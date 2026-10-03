import { Application, Container, Graphics } from 'pixi.js'
import { GamificationThemePalette } from '../theme-palette'
import { getStarVertices } from './hex-geometry'

export const VICTORY_FX_DURATION = 2.0 // seconds — full set piece lifetime
export const VICTORY_FX_PARTICLE_COUNT = 48
export const VICTORY_FX_RING_COUNT = 3
export const VICTORY_FX_RING_STAGGER = 0.22 // seconds between successive ring launches
export const VICTORY_FX_BASE_RADIUS = 26 // ring birth radius around the cleared hex

/** Only boss lairs and capitals earn the full-screen victory set piece. */
export function isVictorySetPieceNode(node: { type: string }): boolean {
  return node.type === 'boss_lair' || node.type === 'capital'
}

/** Frappé celebration palette: yellow / peach / mauve. */
export function getVictoryFxColors(palette: GamificationThemePalette): number[] {
  return [palette.yellowNum, palette.peachNum, palette.mauveNum]
}

export interface VictoryRingState {
  radius: number
  alpha: number
  width: number
}

/**
 * Golden ring expansion state for a ring at [0,1] progress: ease-out radius
 * growth from baseRadius to maxRadius with a linear alpha/width fade.
 */
export function computeVictoryRingState(progress: number, baseRadius: number, maxRadius: number): VictoryRingState {
  const p = Math.min(1, Math.max(0, progress))
  const eased = 1 - (1 - p) * (1 - p)
  return {
    radius: baseRadius + (maxRadius - baseRadius) * eased,
    alpha: Math.max(0, 1 - p) * 0.85,
    width: 1 + 6 * (1 - p),
  }
}

export interface VictoryParticleParams {
  angle: number
  speed: number
  spin: number
}

export interface VictoryParticleState {
  x: number
  y: number
  rotation: number
  alpha: number
  scale: number
}

/**
 * Confetti particle kinematics at [0,1] progress: radial ease-out burst from the
 * origin with quadratic gravity fall, spin, shrink, and fade.
 */
export function computeVictoryParticleState(
  p: VictoryParticleParams,
  progress: number,
  gravity = 150,
): VictoryParticleState {
  const t = Math.min(1, Math.max(0, progress))
  const eased = t * (2 - t) // ease-out travel distance
  const dist = p.speed * eased
  return {
    x: Math.cos(p.angle) * dist,
    y: Math.sin(p.angle) * dist + 0.5 * gravity * t * t,
    rotation: p.spin * t * Math.PI * 4,
    alpha: Math.max(0, 1.2 * (1 - t)),
    scale: 1 - 0.45 * t,
  }
}

export interface BossVictorySetPieceOptions {
  app: Application
  stage: Container
  /** Cleared hex center in root-stage (screen) coordinates. */
  origin: { x: number; y: number }
  palette: GamificationThemePalette
  duration?: number
  particleCount?: number
}

/**
 * V6 cinematic victory set piece: full-screen confetti particle burst plus
 * expanding golden rings emanating from a newly cleared boss_lair/capital hex.
 * Rendered directly on the root Pixi stage container (above the map layer, so
 * it is unaffected by map pan/zoom) and self-destroys after ~2 seconds.
 */
export function triggerBossVictorySetPiece(opts: BossVictorySetPieceOptions): Container {
  const duration = opts.duration ?? VICTORY_FX_DURATION
  const particleCount = opts.particleCount ?? VICTORY_FX_PARTICLE_COUNT
  const colors = getVictoryFxColors(opts.palette)

  const fxContainer = new Container()
  fxContainer.position.set(opts.origin.x, opts.origin.y)
  fxContainer.eventMode = 'none'
  opts.stage.addChild(fxContainer)

  // Expanding golden rings, staggered launches from the cleared hex center
  const rings = Array.from({ length: VICTORY_FX_RING_COUNT }, (_, i) => {
    const gfx = new Graphics()
    fxContainer.addChild(gfx)
    return {
      gfx,
      delay: i * VICTORY_FX_RING_STAGGER,
      color: colors[i % colors.length],
      maxRadius: 170 + i * 55,
    }
  })

  // Confetti-style particle burst (rectangles + stars in Frappé yellow/peach/mauve)
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = (i * Math.PI * 2) / particleCount + (Math.random() - 0.5) * 0.5
    const speed = 110 + Math.random() * 190
    const spin = (Math.random() - 0.5) * 2
    const color = colors[i % colors.length]
    const gfx = new Graphics()
    if (i % 3 === 0) {
      gfx.poly(getStarVertices(0, 0, 5, 5, 2.2)).fill({ color, alpha: 1 })
    } else if (i % 3 === 1) {
      gfx.rect(-3.5, -2, 7, 4).fill({ color, alpha: 1 })
    } else {
      gfx.circle(0, 0, 2.6).fill({ color, alpha: 1 })
    }
    fxContainer.addChild(gfx)
    return { gfx, angle, speed, spin }
  })

  const startTime = performance.now() * 0.001

  const tick = () => {
    if (fxContainer.destroyed) {
      opts.app.ticker.remove(tick)
      return
    }

    const elapsed = performance.now() * 0.001 - startTime
    const progress = Math.min(1, elapsed / duration)

    rings.forEach(({ gfx, delay, color, maxRadius }) => {
      const ringProgress = (elapsed - delay) / (duration - delay)
      if (ringProgress <= 0) {
        gfx.clear()
        return
      }
      const state = computeVictoryRingState(ringProgress, VICTORY_FX_BASE_RADIUS, maxRadius)
      gfx.clear()
        .circle(0, 0, state.radius)
        .stroke({ width: state.width, color, alpha: state.alpha })
    })

    particles.forEach(({ gfx, angle, speed, spin }) => {
      const state = computeVictoryParticleState({ angle, speed, spin }, progress)
      gfx.position.set(state.x, state.y)
      gfx.rotation = state.rotation
      gfx.alpha = state.alpha
      gfx.scale.set(state.scale)
    })

    if (progress >= 1) {
      // Animation complete — detach ticker and destroy every display object (no leaks).
      opts.app.ticker.remove(tick)
      opts.stage.removeChild(fxContainer)
      fxContainer.destroy({ children: true })
    }
  }

  opts.app.ticker.add(tick)
  return fxContainer
}
