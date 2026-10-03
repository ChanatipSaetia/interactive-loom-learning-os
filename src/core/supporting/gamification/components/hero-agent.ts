import { Container, Graphics, Ticker } from 'pixi.js'
import type { MutableRefObject } from 'react'
import { HexGridCoordinate } from '../types'
import { GamificationThemePalette } from '../theme-palette'
import { HEX_RADIUS, axialToPixel } from './hex-geometry'
import { drawWarrior } from './warrior-renderer'
import { computeArcControlPoint } from './scene-renderer'

export const DEFAULT_WALK_DURATION = 900

/** Vertical oscillation amplitude (px) and period (ms) of the idle breathing bob. */
export const IDLE_BOB_AMPLITUDE = 2
export const IDLE_BOB_PERIOD = 1400

export interface Point {
  x: number
  y: number
}

/**
 * Point on a quadratic Bézier at parameter `t` (0 → p1, 1 → p2).
 * B(t) = (1-t)²·p1 + 2(1-t)t·cp + t²·p2
 */
export function quadraticBezierPoint(p1: Point, cp: Point, p2: Point, t: number): Point {
  const it = 1 - t
  return {
    x: it * it * p1.x + 2 * it * t * cp.x + t * t * p2.x,
    y: it * it * p1.y + 2 * it * t * cp.y + t * t * p2.y,
  }
}

/** Gentle in-place breathing bob offset for the idle state. */
export function idleBobOffset(elapsed: number): number {
  return Math.sin((elapsed / IDLE_BOB_PERIOD) * Math.PI * 2) * IDLE_BOB_AMPLITUDE
}

export interface HeroWalkPath {
  start: Point
  cp: Point
  end: Point
  /** Index of the dependency connection this arc mirrors (-1 when synthesized). */
  connectionIndex: number
  /** True when no matching dependency arc exists and the curve was synthesized. */
  synthesized: boolean
}

/**
 * Resolve the arc the hero walks: reuse the exact quadratic-Bézier control point
 * of the dependency connection between `fromId` and `toId` (matching the order
 * used by the scene renderer so the hero traces the visible arc), falling back to
 * a synthesized perpendicular arc when the hero hops between unconnected hexes.
 */
export function resolveHeroWalkPath(
  from: Point,
  to: Point,
  connections: Array<{ fromId: string; toId: string }>,
  fromId: string | null,
  toId: string,
): HeroWalkPath {
  const index = fromId
    ? connections.findIndex(
        (conn) =>
          (conn.fromId === fromId && conn.toId === toId) ||
          (conn.fromId === toId && conn.toId === fromId),
      )
    : -1

  if (index === -1) {
    const cp = computeArcControlPoint(from, to, 0)
    return { start: from, cp: { x: cp.cpX, y: cp.cpY }, end: to, connectionIndex: -1, synthesized: true }
  }

  const cp = computeArcControlPoint(from, to, index)
  return { start: from, cp: { x: cp.cpX, y: cp.cpY }, end: to, connectionIndex: index, synthesized: false }
}

export interface HeroAgentOptions {
  palette: GamificationThemePalette
  /** Node the hero currently stands on (walks originate here). */
  currentNodeId: string | null
  coord: HexGridCoordinate
}

interface HeroWalkState {
  path: HeroWalkPath
  startedAt: number
  duration: number
  targetNodeId: string
  targetCoord: HexGridCoordinate
  onComplete?: () => void
}

/**
 * Persistent campaign hero. Owns a single display object that lives on the map
 * container: it idles with a gentle bob, walks the dependency arcs between hexes,
 * and can be re-parented after a scene rebuild (renderHexScene's removeChildren)
 * without losing its position or current-node bookkeeping.
 */
export class HeroAgent {
  readonly container: Container
  private readonly warriorGfx: Graphics
  private readonly dustContainer: Container
  private readonly arrivalAura: Graphics
  private palette: GamificationThemePalette
  private currentNodeId: string | null
  private currentCoord: HexGridCoordinate
  private walkState: HeroWalkState | null = null
  private readonly idleStart = performance.now()
  private readonly tickFn = () => this.tick()

  constructor(options: HeroAgentOptions) {
    this.palette = options.palette
    this.currentNodeId = options.currentNodeId
    this.currentCoord = { ...options.coord }

    const start = axialToPixel(this.currentCoord.q, this.currentCoord.r, 0, 0)

    this.container = new Container()
    this.container.position.set(start.x, start.y)
    this.container.zIndex = 999
    this.container.eventMode = 'none'

    this.dustContainer = new Container()
    this.container.addChild(this.dustContainer)

    this.warriorGfx = new Graphics()
    this.container.addChild(this.warriorGfx)

    this.arrivalAura = new Graphics()
    this.drawArrivalAura()
    this.container.addChild(this.arrivalAura)

    this.drawFrame(0, 0)
  }

  get nodeId(): string | null {
    return this.currentNodeId
  }

  get isWalking(): boolean {
    return this.walkState !== null
  }

  setPalette(palette: GamificationThemePalette) {
    this.palette = palette
    if (!this.container.destroyed) {
      this.drawArrivalAura()
    }
  }

  /** Idle bob + walk-frame driver, registered on the Pixi ticker by the host. */
  attachTicker(ticker: Ticker) {
    ticker.add(this.tickFn)
  }

  detachTicker(ticker: Ticker) {
    ticker.remove(this.tickFn)
  }

  /**
   * Re-parent onto the map container. renderHexScene() calls removeChildren() on
   * every rebuild, so the host re-attaches the hero afterwards; the hero keeps its
   * world position, current node, and animation state.
   */
  attachTo(mapContainer: Container) {
    if (this.container.destroyed || mapContainer.destroyed) return
    mapContainer.addChild(this.container)
  }

  /** Teleport the hero to a node without walking (campaign reset / initial spawn). */
  moveTo(nodeId: string | null, coord: HexGridCoordinate) {
    if (this.container.destroyed) return
    this.currentNodeId = nodeId
    this.currentCoord = { ...coord }
    const pos = axialToPixel(coord.q, coord.r, 0, 0)
    this.container.position.set(pos.x, pos.y)
  }

  /**
   * Walk from the hero's current node to `target.coord` along the dependency arc.
   * The hero stays at the target hex when the walk completes.
   */
  walkTo(target: {
    nodeId: string
    coord: HexGridCoordinate
    connections: Array<{ fromId: string; toId: string }>
    duration?: number
    onComplete?: () => void
  }) {
    if (this.container.destroyed) {
      target.onComplete?.()
      return
    }
    if (this.walkState) return

    const start = axialToPixel(this.currentCoord.q, this.currentCoord.r, 0, 0)
    const end = axialToPixel(target.coord.q, target.coord.r, 0, 0)

    if (Math.hypot(end.x - start.x, end.y - start.y) < 1) {
      this.currentNodeId = target.nodeId
      target.onComplete?.()
      return
    }

    const path = resolveHeroWalkPath(start, end, target.connections, this.currentNodeId, target.nodeId)
    this.walkState = {
      path,
      startedAt: performance.now(),
      duration: target.duration ?? DEFAULT_WALK_DURATION,
      targetNodeId: target.nodeId,
      targetCoord: { ...target.coord },
      onComplete: target.onComplete,
    }
  }

  private tick() {
    if (this.container.destroyed) return
    const now = performance.now()

    if (this.walkState) {
      const { path, startedAt, duration, targetNodeId, targetCoord, onComplete } = this.walkState
      const elapsed = now - startedAt
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - progress, 1.6)

      const pos = quadraticBezierPoint(path.start, path.cp, path.end, eased)
      this.container.position.set(pos.x, pos.y)

      const walkCycle = progress * Math.PI * 8
      const bob = Math.abs(Math.sin(walkCycle * 2)) * 2.5
      this.drawFrame(walkCycle, bob)
      this.spawnDust(walkCycle)

      if (progress > 0.75) {
        const arrivalRatio = (progress - 0.75) / 0.25
        this.arrivalAura.alpha = Math.sin(arrivalRatio * Math.PI) * 0.9
        this.arrivalAura.scale.set(0.6 + arrivalRatio * 0.5)
      }

      if (progress >= 1) {
        this.currentNodeId = targetNodeId
        this.currentCoord = { ...targetCoord }
        this.arrivalAura.alpha = 0
        this.arrivalAura.scale.set(1)
        this.walkState = null
        onComplete?.()
      }
      return
    }

    // Idle: gentle breathing bob in place
    this.drawFrame(0, idleBobOffset(now - this.idleStart))
  }

  private drawFrame(walkCycle: number, bob: number) {
    if (this.container.destroyed || this.warriorGfx.destroyed) return
    drawWarrior(this.warriorGfx, {
      walkCycle,
      bob,
      cloakPhase: walkCycle || (performance.now() - this.idleStart) * 0.001,
      palette: this.palette,
    })
  }

  private drawArrivalAura() {
    this.arrivalAura.clear()
    this.arrivalAura
      .circle(0, 0, HEX_RADIUS - 4)
      .stroke({ width: 2, color: this.palette.blueNum, alpha: 0 })
    this.arrivalAura.alpha = 0
  }

  private spawnDust(walkCycle: number) {
    if (this.dustContainer.destroyed) return
    if (Math.sin(walkCycle) <= 0.8 || Math.random() <= 0.4) return
    const puff = new Graphics()
    puff.circle(0, 15, 2.5).fill({ color: 0x737994, alpha: 0.6 })
    this.dustContainer.addChild(puff)
    setTimeout(() => {
      if (!this.dustContainer.destroyed && this.dustContainer.children.includes(puff)) {
        this.dustContainer.removeChild(puff)
        puff.destroy()
      }
    }, 180)
  }

  destroy() {
    if (this.container.destroyed) return
    this.walkState = null
    this.container.destroy({ children: true })
  }
}

export interface TriggerHeroWalkArgs {
  hero: HeroAgent | null
  mapContainer: Container | null
  nodeId: string
  coord: HexGridCoordinate
  connections: Array<{ fromId: string; toId: string }>
  isTransitioningRef: MutableRefObject<boolean>
  onComplete?: () => void
}

/**
 * Host-facing helper: command the persistent hero to walk to a node. Replaces the
 * legacy one-shot walk transition — the hero display object itself never dies.
 */
export function triggerHeroWalk(args: TriggerHeroWalkArgs) {
  const { hero, mapContainer, isTransitioningRef } = args
  if (!hero || hero.container.destroyed || !mapContainer || mapContainer.destroyed) {
    args.onComplete?.()
    return
  }
  if (isTransitioningRef.current || hero.isWalking) return

  isTransitioningRef.current = true
  hero.attachTo(mapContainer)
  hero.walkTo({
    nodeId: args.nodeId,
    coord: args.coord,
    connections: args.connections,
    onComplete: () => {
      isTransitioningRef.current = false
      args.onComplete?.()
    },
  })
}
