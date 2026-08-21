import React, { useMemo, useState, useRef, useEffect, useCallback, useImperativeHandle } from 'react'
import { Plus, Minus, RotateCcw, Move } from 'lucide-react'
import { Application, Container, Graphics, Text, TextStyle, FillGradient } from 'pixi.js'
import { HexNodeData } from '../types'
import { computeHexGridCoordinates, getAutoFlowConnections, isKeyItemLocationRevealed } from '../layout'
import { PixiCanvasViewport } from './PixiCanvasViewport'
import { drawWarrior } from './warrior-renderer'

interface HexGridCanvasProps {
  nodes: HexNodeData[]
  selectedNodeId: string | null
  onSelectNode: (node: HexNodeData) => void
}

const HEX_RADIUS = 42
const HEX_GAP_SCALE = 1.32

// Axial to pixel coordinates relative to origin (0, 0)
function axialToPixel(q: number, r: number, originX = 0, originY = 0) {
  const x = originX + HEX_RADIUS * 1.5 * HEX_GAP_SCALE * q
  const y = originY + HEX_RADIUS * Math.sqrt(3) * HEX_GAP_SCALE * (r + q / 2)
  return { x, y }
}

// Star polygon vertices for star particles
function getStarVertices(cx: number, cy: number, points: number, outerRadius: number, innerRadius: number): number[] {
  const verts: number[] = []
  const step = Math.PI / points
  for (let i = 0; i < 2 * points; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius
    const angle = i * step - Math.PI / 2
    verts.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle))
  }
  return verts
}

// Flat-topped hexagon polygon vertices
function getHexVertices(cx: number, cy: number, radius: number): number[] {
  const points: number[] = []
  for (let i = 0; i < 6; i++) {
    const angleRad = (Math.PI / 180) * (60 * i)
    points.push(cx + radius * Math.cos(angleRad), cy + radius * Math.sin(angleRad))
  }
  return points
}

// ─── PROCEDURAL VECTOR MAGIC RUNE PARTICLES ───
function drawMagicRuneParticle(g: Graphics, typeIndex: number, color: number, glowColor: number) {
  if (!g || g.destroyed) return
  g.clear()
  // Subtle glowing halo
  g.circle(0, 0, 4.5).fill({ color: glowColor, alpha: 0.3 })

  switch (typeIndex % 6) {
    case 0: {
      // ᛉ Algiz - Arcane Tree Glyph
      g.moveTo(0, -4).lineTo(0, 4).stroke({ width: 1.4, color: 0xffffff, cap: 'round' })
      g.moveTo(-3, -3).lineTo(0, -0.5).lineTo(3, -3).stroke({ width: 1.3, color, cap: 'round' })
      break
    }
    case 1: {
      // ᛟ Diamond Mana Crystal / Othala
      g.poly([0, -4.5, 3.2, 0, 0, 4.5, -3.2, 0]).fill({ color: glowColor, alpha: 0.65 }).stroke({ width: 1.2, color: 0xffffff })
      g.circle(0, 0, 1.2).fill({ color: 0xffffff, alpha: 1.0 })
      break
    }
    case 2: {
      // ᚲ Kenaz - Arcane Beacon Torch Angle
      g.moveTo(-2.5, -3.5).lineTo(2.2, 0).lineTo(-2.5, 3.5).stroke({ width: 1.4, color: 0xffffff, cap: 'round' })
      g.circle(2.2, 0, 1.2).fill({ color, alpha: 0.95 })
      break
    }
    case 3: {
      // ᚠ Fehu - Wisdom Staff with Twin Ascending Wings
      g.moveTo(-1.5, -4).lineTo(-1.5, 4).stroke({ width: 1.4, color: 0xffffff, cap: 'round' })
      g.moveTo(-1.5, -2.5).lineTo(2.5, -4).stroke({ width: 1.3, color, cap: 'round' })
      g.moveTo(-1.5, 0.5).lineTo(2.5, -1).stroke({ width: 1.3, color, cap: 'round' })
      break
    }
    case 4: {
      // ᛞ Dagaz / Hourglass Matrix Glyph
      g.moveTo(-2.8, -3.2).lineTo(2.8, 3.2).stroke({ width: 1.3, color, cap: 'round' })
      g.moveTo(2.8, -3.2).lineTo(-2.8, 3.2).stroke({ width: 1.3, color, cap: 'round' })
      g.moveTo(-2.8, -3.2).lineTo(-2.8, 3.2).stroke({ width: 1.1, color: 0xffffff, cap: 'round' })
      g.moveTo(2.8, -3.2).lineTo(2.8, 3.2).stroke({ width: 1.1, color: 0xffffff, cap: 'round' })
      break
    }
    case 5: {
      // Arcane Concentric Glyphic Orb / Mana Sphere
      g.circle(0, 0, 3).stroke({ width: 1.2, color: 0xffffff }).fill({ color: glowColor, alpha: 0.7 })
      g.circle(0, 0, 1.2).fill({ color: 0xffffff, alpha: 1.0 })
      break
    }
  }
}

import { useGamificationTheme, GamificationThemePalette, getGamificationThemePalette } from '../theme-palette'

// ─── PROCEDURAL VECTOR EMBLEMS / INSIGNIAS ───
function drawVectorInsignia(g: Graphics, type: string, color: number, isDefeated: boolean = false, palette: GamificationThemePalette = getGamificationThemePalette()) {
  if (!g || g.destroyed) return
  g.clear()
  const c = isDefeated ? palette.overlay2Num : color
  const darkC = palette.crustNum

  switch (type) {
    case 'capital': {
      // 🏰 Citadel Crest: 3 battlement towers + arched gate
      g.roundRect(-10, -2, 20, 12, 1.5).fill({ color: c, alpha: 0.95 })
      // Central high tower
      g.rect(-4, -13, 8, 11).fill({ color: c, alpha: 0.95 })
      // Left and Right battlement towers
      g.rect(-10, -9, 5, 7).fill({ color: c, alpha: 0.95 })
      g.rect(5, -9, 5, 7).fill({ color: c, alpha: 0.95 })
      // Arched gate
      g.roundRect(-3.5, 3, 7, 7, 3).fill({ color: darkC, alpha: 0.9 })
      // Top crest diamond
      g.poly([0, -17, 3, -14, 0, -11, -3, -14]).fill({ color: 0xffffff, alpha: 0.9 })
      break
    }
    case 'reading_sanctuary': {
      // 🏛️ Temple of Wisdom: Triangular pediment + 3 pillars + pedestal
      g.poly([-12, -5, 0, -14, 12, -5]).fill({ color: c, alpha: 0.95 })
      // 3 Columns
      g.rect(-10, -4, 4, 12).fill({ color: c, alpha: 0.9 })
      g.rect(-2, -4, 4, 12).fill({ color: c, alpha: 0.9 })
      g.rect(6, -4, 4, 12).fill({ color: c, alpha: 0.9 })
      // Pedestal foundation
      g.roundRect(-13, 8, 26, 3.5, 1).fill({ color: c, alpha: 0.95 })
      // Inner wisdom gem
      g.circle(0, -7.5, 2.2).fill({ color: 0xffffff, alpha: 0.9 })
      break
    }
    case 'quiz_encounter': {
      // 👾 Encounter Monster Fiend (Horns, fangs, menacing glowing eyes)
      // Pointy Monster Horns / Ears
      g.poly([-8, -6, -13, -15, -4, -10]).fill({ color: c, alpha: 0.95 })
      g.poly([8, -6, 13, -15, 4, -10]).fill({ color: c, alpha: 0.95 })

      // Monster Head / Face Mask
      g.roundRect(-10, -7, 20, 15, 4).fill({ color: c, alpha: 0.95 })

      // Brow Ridge
      g.moveTo(-10, -3).lineTo(0, 0).lineTo(10, -3).stroke({ width: 2, color: darkC })

      // Sharp Menacing Eyes
      g.poly([-7, -4, -3, -1, -8, -1]).fill({ color: 0xffffff, alpha: 1.0 })
      g.poly([7, -4, 3, -1, 8, -1]).fill({ color: 0xffffff, alpha: 1.0 })
      // Glowing Pupils
      g.circle(-5, -2, 1.2).fill({ color: palette.peachNum, alpha: 1.0 })
      g.circle(5, -2, 1.2).fill({ color: palette.peachNum, alpha: 1.0 })

      // Snarl Mouth / Fangs
      g.roundRect(-6, 3, 12, 4, 1.5).fill({ color: darkC, alpha: 0.95 })
      // Top Fangs
      g.poly([-4, 3, -2, 3, -3, 6]).fill({ color: 0xffffff, alpha: 1.0 })
      g.poly([2, 3, 4, 3, 3, 6]).fill({ color: 0xffffff, alpha: 1.0 })
      // Bottom Jaw Fangs
      g.poly([-1, 7, 1, 7, 0, 4.5]).fill({ color: 0xffffff, alpha: 1.0 })
      break
    }
    case 'reflection_decryption': {
      // ✨ Cryptographic Matrix / Cipher Core
      // 4 Tech corner brackets
      const d = 11
      g.moveTo(-d, -d + 5).lineTo(-d, -d).lineTo(-d + 5, -d).stroke({ width: 1.8, color: c })
      g.moveTo(d, -d + 5).lineTo(d, -d).lineTo(d - 5, -d).stroke({ width: 1.8, color: c })
      g.moveTo(-d, d - 5).lineTo(-d, d).lineTo(-d + 5, d).stroke({ width: 1.8, color: c })
      g.moveTo(d, d - 5).lineTo(d, d).lineTo(d - 5, d).stroke({ width: 1.8, color: c })

      // Center decryption diamond
      g.poly([0, -8, 8, 0, 0, 8, -8, 0]).stroke({ width: 1.8, color: c }).fill({ color: darkC, alpha: 0.6 })
      // Core cipher dot
      g.circle(0, 0, 2.5).fill({ color: 0xffffff, alpha: 0.95 })
      break
    }
    case 'tradeoff_workshop': {
      // 🔨 Anvil & Forging Hammer
      // Anvil top & horn
      g.moveTo(-11, -3).lineTo(10, -3).lineTo(8, 2).lineTo(-7, 2).lineTo(-11, -3).fill({ color: c, alpha: 0.95 })
      // Anvil body & base
      g.rect(-5, 2, 10, 5).fill({ color: c, alpha: 0.9 })
      g.roundRect(-9, 7, 18, 4, 1).fill({ color: c, alpha: 0.95 })
      // Angled hammer
      g.moveTo(7, -13).lineTo(-2, -4).stroke({ width: 2, color: 0xffffff, alpha: 0.85 })
      g.poly([-6, -8, -1, -13, 2, -10, -3, -5]).fill({ color: c, alpha: 0.95 })
      break
    }
    case 'boss_lair': {
      // 🔥 Horned Demonic Skull Titan
      // Horns
      g.moveTo(-9, -5).quadraticCurveTo(-14, -13, -8, -16).stroke({ width: 2.2, color: palette.maroonNum })
      g.moveTo(9, -5).quadraticCurveTo(14, -13, 8, -16).stroke({ width: 2.2, color: palette.maroonNum })
      // Skull head plate
      g.roundRect(-9, -8, 18, 11, 3).fill({ color: c, alpha: 0.95 })
      // Fanged jaw
      g.poly([-6, 3, 6, 3, 4, 9, -4, 9]).fill({ color: c, alpha: 0.95 })
      // Eye sockets
      g.rect(-6, -4, 3.5, 3.5).fill({ color: darkC, alpha: 0.95 })
      g.rect(2.5, -4, 3.5, 3.5).fill({ color: darkC, alpha: 0.95 })
      // Glowing pupils
      g.circle(-4.2, -2.2, 1.2).fill({ color: 0xffffff, alpha: 0.9 })
      g.circle(4.2, -2.2, 1.2).fill({ color: 0xffffff, alpha: 0.9 })
      break
    }
    default:
      g.circle(0, 0, 8).fill({ color: c, alpha: 0.9 })
      break
  }
}

// Create thematic top-to-bottom gradients for each node type
function createHexGradient(type: string, isLocked: boolean, isCleared: boolean = false, palette: GamificationThemePalette = getGamificationThemePalette()) {
  const gradient = new FillGradient({
    start: { x: 0, y: -HEX_RADIUS },
    end: { x: 0, y: HEX_RADIUS },
  })

  if (isLocked && type !== 'boss_lair') {
    gradient.addColorStop(0, palette.surface0)
    gradient.addColorStop(0.5, palette.base)
    gradient.addColorStop(1, palette.crust)
    return gradient
  }

  // Defeated / Beaten Hostile Encounter Gradient
  if (isCleared && (type === 'quiz_encounter' || type === 'reflection_decryption')) {
    gradient.addColorStop(0, palette.surface2)
    gradient.addColorStop(0.45, palette.surface0)
    gradient.addColorStop(1, palette.crust)
    return gradient
  }

  switch (type) {
    case 'capital':
      gradient.addColorStop(0, palette.sapphire)
      gradient.addColorStop(0.45, palette.blue)
      gradient.addColorStop(1, palette.crust)
      break
    case 'reading_sanctuary':
      gradient.addColorStop(0, palette.green)
      gradient.addColorStop(0.45, palette.surface0)
      gradient.addColorStop(1, palette.crust)
      break
    case 'quiz_encounter':
      gradient.addColorStop(0, palette.red)
      gradient.addColorStop(0.45, palette.maroon)
      gradient.addColorStop(1, palette.crust)
      break
    case 'reflection_decryption':
      gradient.addColorStop(0, palette.mauve)
      gradient.addColorStop(0.45, palette.surface0)
      gradient.addColorStop(1, palette.crust)
      break
    case 'tradeoff_workshop':
      gradient.addColorStop(0, palette.yellow)
      gradient.addColorStop(0.45, palette.peach)
      gradient.addColorStop(1, palette.crust)
      break
    case 'boss_lair':
      gradient.addColorStop(0, palette.maroon)
      gradient.addColorStop(0.45, palette.red)
      gradient.addColorStop(1, palette.base)
      break
    default:
      gradient.addColorStop(0, palette.sapphire)
      gradient.addColorStop(1, palette.crust)
      break
  }
  return gradient
}

export interface HexGridCanvasRef {
  triggerWalkTransition: (node: HexNodeData, onComplete?: () => void) => void
  /** @deprecated use triggerWalkTransition */
  triggerTwistTransition: (node: HexNodeData, onComplete?: () => void) => void
}

export const HexGridCanvas = React.forwardRef<HexGridCanvasRef, HexGridCanvasProps>(({
  nodes,
  selectedNodeId,
  onSelectNode,
}, ref) => {
  const palette = useGamificationTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const mapContainerRef = useRef<Container | null>(null)
  const isTransitioningRef = useRef<boolean>(false)

  const [zoom, setZoom] = useState<number>(1.0)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)

  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const zoomRef = useRef<number>(1.0)
  panRef.current = pan
  zoomRef.current = zoom

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const touchDistRef = useRef<number | null>(null)
  const previousNodesRef = useRef<HexNodeData[]>(nodes)
  const newlyUnlockedNodeIdsRef = useRef<Set<string>>(new Set())
  const newlyClearedNodeIdsRef = useRef<Set<string>>(new Set())
  // Persisted per-node animation start timestamps (performance.now() * 0.001 seconds).
  // renderPixiScene() fully rebuilds the scene graph on every call (resize, selection
  // change, isCapitalCleared toggle, etc. all trigger it, not just the "newly
  // unlocked/cleared" transition). Without persisting the start time here, a re-render
  // mid-animation would restart the one-shot bomb-blast / fog-reveal FX from t=0 (or,
  // combined with premature flag consumption, silently drop it forever). These maps let
  // the animation resume from its real elapsed time across rebuilds instead.
  const unlockAnimStartRef = useRef<Map<string, number>>(new Map())
  const clearAnimStartRef = useRef<Map<string, number>>(new Map())

  // Keep latest refs for async Pixi render
  const latestPropsRef = useRef({
    nodes,
    selectedNodeId,
    onSelectNode,
  })
  latestPropsRef.current = { nodes, selectedNodeId, onSelectNode }

  // Layout coordinate derivations
  const computedCoordsMap = useMemo(() => computeHexGridCoordinates(nodes), [nodes])
  const isCapitalCleared = useMemo(() => nodes.find((n) => n.type === 'capital')?.status === 'cleared', [nodes])

  const getNodeCoord = useCallback(
    (node: HexNodeData) => computedCoordsMap.get(node.id) || node.coordinates || { q: 0, r: 0 },
    [computedCoordsMap]
  )

  // Center camera smoothly on node
  const centerOnNode = useCallback(
    (node: HexNodeData) => {
      const coord = getNodeCoord(node)
      const { x, y } = axialToPixel(coord.q, coord.r, 0, 0)
      const currentZoom = zoomRef.current
      setPan({ x: -x * currentZoom, y: -y * currentZoom })
    },
    [getNodeCoord]
  )

  // Trigger human walking animation into hex from the left before opening encounter modal
  const triggerWalkTransition = useCallback((node: HexNodeData, onComplete?: () => void) => {
    const mapContainer = mapContainerRef.current
    if (!mapContainer) {
      onComplete?.()
      return
    }

    if (isTransitioningRef.current) return
    isTransitioningRef.current = true

    const coord = getNodeCoord(node)
    const targetPos = axialToPixel(coord.q, coord.r, 0, 0)

    // Start 90px to the left of the hex node
    const startX = targetPos.x - 90
    const startY = targetPos.y

    // Container for human hero sprite
    const humanContainer = new Container()
    humanContainer.position.set(startX, startY)
    humanContainer.zIndex = 999

    // Ground dust particle effect container
    const dustContainer = new Container()
    humanContainer.addChild(dustContainer)

    // Body container for procedural stick-figure / RPG human explorer
    const humanGfx = new Graphics()
    humanContainer.addChild(humanGfx)

    // Walking indicator aura glow ring
    const arrivalAura = new Graphics()
    arrivalAura.circle(0, 0, HEX_RADIUS - 4).stroke({ width: 2, color: palette.blueNum, alpha: 0 })
    humanContainer.addChild(arrivalAura)

    mapContainer.addChild(humanContainer)

    const startTime = performance.now()
    const duration = 750 // 750ms walk duration

    // Draw procedural animated walking human frame
    const drawHuman = (_walkProgress: number, walkCycle: number) => {
      if (!humanGfx || humanGfx.destroyed) return
      const bob = Math.abs(Math.sin(walkCycle * 2)) * 2.5
      drawWarrior(humanGfx, {
        walkCycle,
        bob,
        cloakPhase: walkCycle,
        palette,
      })
    }

    const animateWalk = (currentTime: number) => {
      if (!mapContainer || mapContainer.destroyed || humanGfx.destroyed || humanContainer.destroyed) return
      const elapsed = currentTime - startTime
      const progress = Math.min(1, elapsed / duration)

      // Linear translation with slight ease-out at the end
      const easeProgress = 1 - Math.pow(1 - progress, 1.6)
      const currentX = startX + (targetPos.x - startX) * easeProgress
      const currentY = startY + (targetPos.y - startY) * easeProgress

      humanContainer.position.set(currentX, currentY)

      // Frequency of walk cycles
      const walkCycle = progress * Math.PI * 8
      drawHuman(progress, walkCycle)

      // Spawn subtle ground footsteps / dust puffs
      if (Math.sin(walkCycle) > 0.8 && Math.random() > 0.4) {
        const puff = new Graphics()
        puff.circle(0, 15, 2.5).fill({ color: 0x737994, alpha: 0.6 })
        dustContainer.addChild(puff)
        setTimeout(() => {
          if (!dustContainer.destroyed && dustContainer.children.includes(puff)) {
            dustContainer.removeChild(puff)
            puff.destroy()
          }
        }, 180)
      }

      // Arrival burst glow upon reaching center
      if (progress > 0.75) {
        const arrivalRatio = (progress - 0.75) / 0.25
        arrivalAura.alpha = Math.sin(arrivalRatio * Math.PI) * 0.9
        arrivalAura.scale.set(0.6 + arrivalRatio * 0.5)
      }

      if (progress < 1) {
        requestAnimationFrame(animateWalk)
      } else {
        // Complete walk into the center of the hex
        if (!mapContainer.destroyed) {
          mapContainer.removeChild(humanContainer)
        }
        humanContainer.destroy({ children: true })
        isTransitioningRef.current = false
        onComplete?.()
      }
    }

    requestAnimationFrame(animateWalk)
  }, [getNodeCoord])

  useImperativeHandle(ref, () => ({
    triggerWalkTransition,
    triggerTwistTransition: triggerWalkTransition,
  }), [triggerWalkTransition])

  // Update map container transform
  const updateMapTransform = useCallback(() => {
    const mapContainer = mapContainerRef.current
    const app = appRef.current
    if (!mapContainer || !app) return

    const cx = (app.screen?.width || containerRef.current?.clientWidth || 880) / 2
    const cy = (app.screen?.height || containerRef.current?.clientHeight || 580) / 2

    mapContainer.position.set(cx + panRef.current.x, cy + panRef.current.y)
    mapContainer.scale.set(zoomRef.current)
  }, [])

  // Apply pan & zoom to PixiJS mapContainer
  useEffect(() => {
    updateMapTransform()
  }, [pan, zoom, updateMapTransform])

  // Animation controller storage ref
  const animControllersRef = useRef<Array<(time: number) => void>>([])

  // Main render routine for PixiJS
  const renderPixiScene = useCallback(() => {
    const mapContainer = mapContainerRef.current
    if (!mapContainer || mapContainer.destroyed) return

    animControllersRef.current = []
    mapContainer.removeChildren()
    mapContainer.sortableChildren = true

    const {
      nodes: currentNodes,
      selectedNodeId: currentSelectedId,
      onSelectNode: handleSelect,
    } = latestPropsRef.current
    const currentSelected = currentNodes.find((n) => n.id === currentSelectedId)
    const currentCoords = computeHexGridCoordinates(currentNodes)
    const currentConnections = getAutoFlowConnections(currentNodes)
    const capitalCleared = currentNodes.find((n) => n.type === 'capital')?.status === 'cleared'

    // ─── 1. RENDER CURVED DEPENDENCY ARCS FOR SELECTED NODE (TARGET) ───
    if (currentSelected && currentSelected.type !== 'boss_lair') {
      const depContainer = new Container()
      depContainer.zIndex = 2
      const activeDepConns = currentConnections.filter(
        (c) => c.toId === currentSelected.id
      )

      activeDepConns.forEach((conn, index) => {
        const fromNode = currentNodes.find((n) => n.id === conn.fromId)
        const toNode = currentNodes.find((n) => n.id === conn.toId)
        if (!fromNode || !toNode) return

        const fromCoord = currentCoords.get(fromNode.id) || fromNode.coordinates || { q: 0, r: 0 }
        const toCoord = currentCoords.get(toNode.id) || toNode.coordinates || { q: 0, r: 0 }
        const p1 = axialToPixel(fromCoord.q, fromCoord.r, 0, 0)
        const p2 = axialToPixel(toCoord.q, toCoord.r, 0, 0)

        // Calculate perpendicular curvature control point
        const midX = (p1.x + p2.x) / 2
        const midY = (p1.y + p2.y) / 2
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const dist = Math.hypot(dx, dy) || 1
        const curveOffset = Math.min(32, Math.max(18, dist * 0.22)) * (index % 2 === 0 ? 1 : -1)

        // Normal perpendicular vector (-dy, dx)
        const nx = -dy / dist
        const ny = dx / dist
        const cpX = midX + nx * curveOffset
        const cpY = midY + ny * curveOffset

        // Base glowing curved line
        const curveGfx = new Graphics()
        curveGfx
          .moveTo(p1.x, p1.y)
          .quadraticCurveTo(cpX, cpY, p2.x, p2.y)
          .stroke({ width: 3.5, color: palette.mauveNum, alpha: 0.85 })

        const glowGfx = new Graphics()
        glowGfx
          .moveTo(p1.x, p1.y)
          .quadraticCurveTo(cpX, cpY, p2.x, p2.y)
          .stroke({ width: 7, color: palette.mauveNum, alpha: 0.22 })

        depContainer.addChild(glowGfx)
        depContainer.addChild(curveGfx)

        // Animated traveling energy pulse dots
        const pulseDot = new Graphics()
        pulseDot.circle(0, 0, 3.5).fill({ color: palette.peachNum, alpha: 0.95 })
        depContainer.addChild(pulseDot)

        animControllersRef.current.push((t) => {
          const progress = ((t * 0.9 + index * 0.3) % 1)
          // Quadratic Bézier: B(t) = (1-t)^2 P1 + 2(1-t)t CP + t^2 P2
          const it = 1 - progress
          const bX = it * it * p1.x + 2 * it * progress * cpX + progress * progress * p2.x
          const bY = it * it * p1.y + 2 * it * progress * cpY + progress * progress * p2.y

          pulseDot.position.set(bX, bY)
          pulseDot.alpha = Math.sin(progress * Math.PI) * 0.95
          curveGfx.alpha = 0.65 + 0.35 * Math.sin(t * 3.5)
        })
      })

      mapContainer.addChild(depContainer)
    }

    // ─── 2. RENDER HEX NODES (SORTED WITH SELECTED NODE AT FRONT) ───
    const sortedNodes = [...currentNodes].sort((a, b) => {
      if (a.id === currentSelectedId) return 1
      if (b.id === currentSelectedId) return -1
      return 0
    })

    sortedNodes.forEach((node) => {
      const coord = currentCoords.get(node.id) || node.coordinates || { q: 0, r: 0 }
      const { x, y } = axialToPixel(coord.q, coord.r, 0, 0)
      const isSelected = currentSelectedId === node.id
      const isCleared = node.status === 'cleared'
      const isLocked = node.status === 'locked'
      const isBoss = node.type === 'boss_lair'
      const isThreatened = node.status === 'threatened'
      const hasItemReward = isKeyItemLocationRevealed(currentNodes, node)

      const nodeContainer = new Container()
      nodeContainer.zIndex = isSelected ? 100 : (isBoss ? 10 : 5)
      nodeContainer.position.set(x, y)
      nodeContainer.eventMode = 'static'
      nodeContainer.cursor = 'pointer'

      // Tap / Click handling
      nodeContainer.on('pointertap', (e) => {
        e.stopPropagation()
        centerOnNode(node)
        handleSelect(node)
      })

      const isDefeatedEncounter = isCleared && (node.type === 'quiz_encounter' || node.type === 'reflection_decryption')
      const styleInfo = palette.colorMap[node.type] || palette.colorMap.capital
      let strokeColor = isDefeatedEncounter ? palette.surface2Num : styleInfo.stroke
      const highlightColor = isDefeatedEncounter ? palette.overlay0Num : (styleInfo.highlight || strokeColor)
      let strokeWidth = 2
      let fillAlpha = isDefeatedEncounter ? 0.78 : 0.88

      if (isLocked && !isBoss) {
        strokeColor = palette.surface1Num
        strokeWidth = 1.8
        fillAlpha = 0.75
      } else if (isLocked && isBoss) {
        strokeColor = palette.redNum
        strokeWidth = 2
        fillAlpha = 0.85
      }

      // 1. Outer Dark Drop Shadow / Rim
      const shadowGfx = new Graphics()
      shadowGfx
        .poly(getHexVertices(0, 1.5, HEX_RADIUS + 1))
        .fill({ color: palette.crustNum, alpha: 0.6 })
      nodeContainer.addChild(shadowGfx)

      // 2. Base Hexagon Tile with Top-to-Bottom FillGradient
      const hexGfx = new Graphics()
      const mainVerts = getHexVertices(0, 0, HEX_RADIUS)
      const gradient = createHexGradient(node.type, isLocked, isCleared, palette)

      hexGfx
        .poly(mainVerts)
        .fill({ fill: gradient, alpha: fillAlpha })
        .stroke({ width: strokeWidth, color: strokeColor })
      nodeContainer.addChild(hexGfx)

      // 3. Tactical Target Lock / Aim Reticle (Drawn on Selected Node)
      if (isSelected) {
        const aimContainer = new Container()
        const aimBracketGfx = new Graphics()
        const aimRingGfx = new Graphics()
        aimContainer.addChild(aimBracketGfx)
        aimContainer.addChild(aimRingGfx)
        nodeContainer.addChild(aimContainer)

        animControllersRef.current.push((t) => {
          const bracketDist = HEX_RADIUS + 8 + Math.sin(t * 3) * 1.5
          const cornerLen = 10
          const lockColor = palette.redNum

          aimBracketGfx.clear()
          // 4 Corner Brackets Framing the Hexagon
          aimBracketGfx
            .moveTo(-bracketDist, -bracketDist + cornerLen)
            .lineTo(-bracketDist, -bracketDist)
            .lineTo(-bracketDist + cornerLen, -bracketDist)
            .stroke({ width: 2, color: lockColor, alpha: 0.95 })

          aimBracketGfx
            .moveTo(bracketDist, -bracketDist + cornerLen)
            .lineTo(bracketDist, -bracketDist)
            .lineTo(bracketDist - cornerLen, -bracketDist)
            .stroke({ width: 2, color: lockColor, alpha: 0.95 })

          aimBracketGfx
            .moveTo(-bracketDist, bracketDist - cornerLen)
            .lineTo(-bracketDist, bracketDist)
            .lineTo(-bracketDist + cornerLen, bracketDist)
            .stroke({ width: 2, color: lockColor, alpha: 0.95 })

          aimBracketGfx
            .moveTo(bracketDist, bracketDist - cornerLen)
            .lineTo(bracketDist, bracketDist)
            .lineTo(bracketDist - cornerLen, bracketDist)
            .stroke({ width: 2, color: lockColor, alpha: 0.95 })

          // Cardinal Crosshair Aim Ticks
          const tickOffset = bracketDist + 4
          aimBracketGfx
            .moveTo(0, -tickOffset - 6).lineTo(0, -tickOffset)
            .stroke({ width: 1.8, color: lockColor, alpha: 0.9 })
            .moveTo(0, tickOffset + 6).lineTo(0, tickOffset)
            .stroke({ width: 1.8, color: lockColor, alpha: 0.9 })
            .moveTo(-tickOffset - 6, 0).lineTo(-tickOffset, 0)
            .stroke({ width: 1.8, color: lockColor, alpha: 0.9 })
            .moveTo(tickOffset + 6, 0).lineTo(tickOffset, 0)
            .stroke({ width: 1.8, color: lockColor, alpha: 0.9 })

          // Rotating Segmented Aim Reticle Ring
          aimRingGfx.clear()
          const r = HEX_RADIUS + 3
          const segAngle = Math.PI / 4
          const gapAngle = Math.PI / 4
          const rot = t * 0.75
          for (let i = 0; i < 4; i++) {
            const startA = rot + i * (segAngle + gapAngle)
            const endA = startA + segAngle
            aimRingGfx
              .arc(0, 0, r, startA, endA)
              .stroke({ width: 1.5, color: palette.peachNum, alpha: 0.85 })
          }
        })
      }

      // 4. Inner Bevel / Highlight Ring (Only for Unlocked or Boss Nodes)
      const innerGfx = new Graphics()
      if (!isLocked || isBoss) {
        const innerVerts = getHexVertices(0, 0, HEX_RADIUS - 5)
        innerGfx
          .poly(innerVerts)
          .stroke({ width: 1, color: highlightColor, alpha: isDefeatedEncounter ? 0.3 : 0.45 })
        nodeContainer.addChild(innerGfx)
      }

      // ─── 4B. NEWLY CLEARED ENCOUNTER BOMB DETONATION ANIMATION ───
      const isNewlyClearedEncounter = newlyClearedNodeIdsRef.current.has(node.id) && (node.type === 'quiz_encounter' || node.type === 'reflection_decryption')
      if (isNewlyClearedEncounter) {
        // NOTE: do NOT delete the flag here. renderPixiScene() can be re-invoked mid-animation
        // (resize, selection change, isCapitalCleared toggle, etc.), which rebuilds the entire
        // scene graph from scratch. If we consumed the flag at build-time, an intervening
        // rebuild would silently drop the animation forever (flag gone, container destroyed).
        // Instead the flag — and this node's start timestamp — persist until the animation
        // reports itself complete (progress >= 1) below, so a mid-flight rebuild simply
        // recreates the FX resuming from its real elapsed time instead of losing it.

        const bombAnimContainer = new Container()
        nodeContainer.addChild(bombAnimContainer)

        // Blast flash expanding dome
        const blastDome = new Graphics()
        bombAnimContainer.addChild(blastDome)

        // Flaming shockwave ring
        const flameRing = new Graphics()
        bombAnimContainer.addChild(flameRing)

        // 12 explosive shrapnel debris particles flying outward
        const particleCount = 12
        const particles = Array.from({ length: particleCount }, (_, i) => {
          const angle = (i * Math.PI * 2) / particleCount + (Math.random() - 0.5) * 0.4
          const speed = 35 + Math.random() * 30
          const pGfx = new Graphics()
          pGfx.poly(getStarVertices(0, 0, 4, 4, 1.5)).fill({ color: i % 2 === 0 ? 0xef9f76 : 0xe78284, alpha: 0.95 })
          bombAnimContainer.addChild(pGfx)
          return { gfx: pGfx, angle, speed }
        })

        let bombStartTime = clearAnimStartRef.current.get(node.id)
        if (bombStartTime === undefined) {
          bombStartTime = performance.now() * 0.001
          clearAnimStartRef.current.set(node.id, bombStartTime)
        }
        const bombDuration = 1.1 // 1.1s blast animation

        animControllersRef.current.push((t) => {
          const elapsed = t - bombStartTime
          const progress = Math.min(1, Math.max(0, elapsed / bombDuration))

          if (progress < 1) {
            // White-hot core flash fading to smoke
            const flashRadius = HEX_RADIUS * (0.6 + progress * 0.8)
            blastDome.clear()
              .circle(0, 0, flashRadius)
              .fill({ color: progress < 0.25 ? 0xffffff : 0xef9f76, alpha: Math.max(0, (1 - progress * 1.2) * 0.85) })

            // Fast expanding orange-crimson shockwave
            flameRing.clear()
              .poly(getHexVertices(0, 0, HEX_RADIUS + progress * 32))
              .stroke({ width: 3.5 * (1 - progress), color: 0xe78284, alpha: (1 - progress) * 0.95 })

            // Flying burning shrapnel particles
            particles.forEach(({ gfx, angle, speed }) => {
              const dist = speed * progress
              gfx.position.set(dist * Math.cos(angle), dist * Math.sin(angle))
              gfx.rotation = progress * Math.PI * 4
              gfx.alpha = Math.max(0, 1 - progress)
              gfx.scale.set(1 - progress * 0.6)
            })
          } else {
            bombAnimContainer.visible = false
            // Animation naturally finished — now it's safe to consume the one-shot trigger.
            newlyClearedNodeIdsRef.current.delete(node.id)
            clearAnimStartRef.current.delete(node.id)
          }
        })
      }

      // ─── UNIQUE EFFECT LAYERS BY NODE TYPE (TRIGGERED ON SELECTION) ───

      // 1. CAPITAL: Orbital Constellation Satellites
      if (node.type === 'capital' && !isLocked && isSelected) {
        const orbitContainer = new Container()
        const numSatellites = 3
        const satellites: Graphics[] = []

        for (let i = 0; i < numSatellites; i++) {
          const sat = new Graphics()
          sat.circle(0, 0, 2.5).fill({ color: 0x60a5fa, alpha: 0.95 })
          orbitContainer.addChild(sat)
          satellites.push(sat)
        }
        nodeContainer.addChild(orbitContainer)

        animControllersRef.current.push((t) => {
          satellites.forEach((sat, i) => {
            const angle = t * 1.5 + (i * (2 * Math.PI) / numSatellites)
            const r = HEX_RADIUS + 6
            sat.position.set(r * Math.cos(angle), r * Math.sin(angle))
            sat.alpha = 0.5 + 0.5 * Math.sin(t * 3 + i)
          })
          innerGfx.alpha = 0.35 + 0.25 * Math.sin(t * 2)
        })
      }

      // 2. READING SANCTUARY: Floating Healing Spores / Gentle Mist
      if (node.type === 'reading_sanctuary' && !isLocked && isSelected) {
        const sporesContainer = new Container()
        const sporesCount = 6
        const spores = Array.from({ length: sporesCount }, (_, i) => {
          const spore = new Graphics()
          spore.circle(0, 0, 1.8).fill({ color: 0xa6d189, alpha: 0.8 })
          sporesContainer.addChild(spore)
          return {
            gfx: spore,
            baseX: (Math.random() - 0.5) * (HEX_RADIUS * 1.1),
            speedY: 10 + Math.random() * 12,
            phase: i * 1.2,
            yOffset: Math.random() * 40 - 20,
          }
        })
        nodeContainer.addChild(sporesContainer)

        animControllersRef.current.push((t) => {
          spores.forEach((s) => {
            const progress = ((t * s.speedY * 0.05 + s.phase) % 1)
            const yPos = 18 - progress * 38
            const xPos = s.baseX + Math.sin(t * 2.5 + s.phase) * 3
            s.gfx.position.set(xPos, yPos)
            s.gfx.alpha = Math.sin(progress * Math.PI) * 0.85
          })
          innerGfx.alpha = 0.4 + 0.3 * Math.sin(t * 1.8)
        })
      }

      // Calculate direction to nearest dependency for attack animations
      const incomingConns = currentConnections.filter((c) => c.toId === node.id)
      let targetPos: { x: number; y: number } | null = null
      let minTargetDist = Infinity

      for (const conn of incomingConns) {
        const pNode = currentNodes.find((n) => n.id === conn.fromId)
        if (pNode) {
          const pCoord = currentCoords.get(pNode.id) || pNode.coordinates || { q: 0, r: 0 }
          const pPixel = axialToPixel(pCoord.q, pCoord.r, 0, 0)
          const d = Math.hypot(pPixel.x - x, pPixel.y - y)
          if (d < minTargetDist) {
            minTargetDist = d
            targetPos = pPixel
          }
        }
      }

      if (!targetPos) {
        for (const other of currentNodes) {
          if (other.id !== node.id && other.status !== 'locked' && other.type !== 'boss_lair') {
            const oCoord = currentCoords.get(other.id) || other.coordinates || { q: 0, r: 0 }
            const oPixel = axialToPixel(oCoord.q, oCoord.r, 0, 0)
            const d = Math.hypot(oPixel.x - x, oPixel.y - y)
            if (d < minTargetDist) {
              minTargetDist = d
              targetPos = oPixel
            }
          }
        }
      }
      const foundTarget = targetPos as { x: number; y: number } | null
      const atkDx = foundTarget ? foundTarget.x - x : 0
      const atkDy = foundTarget ? foundTarget.y - y : -1
      const atkLen = Math.hypot(atkDx, atkDy) || 1
      const atkUx = atkDx / atkLen
      const atkUy = atkDy / atkLen

      // 3. QUIZ ENCOUNTER: Strike Lunge with Smooth Fireball Blast Shot at Peak Distance
      if (node.type === 'quiz_encounter' && !isLocked && isSelected) {
        if (isCleared) {
          animControllersRef.current.push((t) => {
            innerGfx.alpha = 0.35 + 0.25 * Math.sin(t * 2)
          })
        } else {
          const fireGfx = new Graphics()
          nodeContainer.addChild(fireGfx)
          const maxLunge = Math.min(26, Math.max(16, atkLen * 0.35))

          // Stateful projectile animation state
          let activeBlastStartTime = -1
          let hasFiredThisCycle = false

          animControllersRef.current.push((t) => {
            // Attacking lunge cycle: windup -> deep thrust lunge towards dependency -> spring recoil
            const cycle = (t * 1.2) % 1
            let lunge = 0

            if (cycle < 0.18) {
              lunge = -4.5 * Math.sin((cycle / 0.18) * Math.PI)
              hasFiredThisCycle = false
            } else if (cycle < 0.52) {
              const strikeProgress = (cycle - 0.18) / 0.34
              lunge = maxLunge * Math.sin(strikeProgress * Math.PI)
              // Trigger fire blast at the apex of the lunge (peak distance)
              if (strikeProgress >= 0.5 && !hasFiredThisCycle) {
                hasFiredThisCycle = true
                activeBlastStartTime = t
              }
            } else if (cycle < 0.75) {
              lunge = -2.2 * Math.sin(((cycle - 0.52) / 0.23) * Math.PI)
            }
            nodeContainer.position.set(x + atkUx * lunge, y + atkUy * lunge)

            // Render smoothly evolving fire projectile blast when triggered
            fireGfx.clear()
            if (activeBlastStartTime > 0) {
              const blastElapsed = t - activeBlastStartTime
              const blastDuration = 0.45 // 450ms smooth fire animation
              const p = blastElapsed / blastDuration

              if (p <= 1) {
                // Expanding and traveling flame jet
                const travelDist = p * 28
                const tipX = atkUx * (HEX_RADIUS + 4 + travelDist)
                const tipY = atkUy * (HEX_RADIUS + 4 + travelDist)
                const flameScale = Math.sin(p * Math.PI)
                const perpX = -atkUy * (8 * flameScale)
                const perpY = atkUx * (8 * flameScale)
                const flameAlpha = Math.sin(p * Math.PI)

                // Outer Flame Mantle
                fireGfx.poly([
                  tipX - atkUx * 10 + perpX, tipY - atkUy * 10 + perpY,
                  tipX + atkUx * (16 * flameScale), tipY + atkUy * (16 * flameScale),
                  tipX - atkUx * 10 - perpX, tipY - atkUy * 10 - perpY,
                ]).fill({ color: 0xe78284, alpha: flameAlpha * 0.95 })

                // Inner Burning Orange Flare
                fireGfx.poly([
                  tipX - atkUx * 6 + perpX * 0.55, tipY - atkUy * 6 + perpY * 0.55,
                  tipX + atkUx * (10 * flameScale), tipY + atkUy * (10 * flameScale),
                  tipX - atkUx * 6 - perpX * 0.55, tipY - atkUy * 6 - perpY * 0.55,
                ]).fill({ color: 0xef9f76, alpha: flameAlpha * 1.0 })

                // White Plasma Core
                fireGfx.circle(tipX, tipY, Math.max(1, 3.5 * flameScale)).fill({ color: 0xffffff, alpha: flameAlpha * 1.0 })
              }
            }
          })
        }
      }

      // 4. REFLECTION DECRYPTION: Cryptographic Cipher Matrix / Arcane Glyph Orbit & Rotating Runic Matrix
      if (node.type === 'reflection_decryption' && !isLocked && isSelected) {
        const cipherContainer = new Container()
        const matrixRingGfx = new Graphics()
        const pulseWaveGfx = new Graphics()
        cipherContainer.addChild(pulseWaveGfx)
        cipherContainer.addChild(matrixRingGfx)
        nodeContainer.addChild(cipherContainer)

        // 6 ethereal orbiting ancient magic rune particles (Algiz, Mana Crystal, Kenaz, Fehu, Dagaz, Glyphic Orb)
        const numMotes = 6
        const motes = Array.from({ length: numMotes }, (_, i) => {
          const mGfx = new Graphics()
          drawMagicRuneParticle(
            mGfx,
            i,
            i % 2 === 0 ? palette.mauveNum : palette.pinkNum,
            i % 2 === 0 ? palette.mauveNum : palette.sapphireNum
          )
          cipherContainer.addChild(mGfx)
          return {
            gfx: mGfx,
            phase: (i * 2 * Math.PI) / numMotes,
            speed: 1.2 + (i % 2) * 0.4,
            radius: HEX_RADIUS - 8 + (i % 3) * 6,
          }
        })

        animControllersRef.current.push((t) => {
          // Rotating Concentric Sacred Geometry Ring
          matrixRingGfx.clear()
          const rOuter = HEX_RADIUS - 4
          const rInner = HEX_RADIUS - 12
          const rot1 = t * 0.8
          const rot2 = -t * 1.2

          // Segmented Outer Cipher Ring
          for (let i = 0; i < 4; i++) {
            const startA = rot1 + (i * Math.PI) / 2
            const endA = startA + Math.PI / 3.5
            matrixRingGfx
              .arc(0, 0, rOuter, startA, endA)
              .stroke({ width: 1.5, color: palette.mauveNum, alpha: 0.85 })
          }

          // Inner Sacred Geometry Decryption Diamond / Square
          const polyPts: number[] = []
          for (let i = 0; i < 4; i++) {
            const a = rot2 + (i * Math.PI) / 2
            polyPts.push(Math.cos(a) * rInner, Math.sin(a) * rInner)
          }
          matrixRingGfx.poly(polyPts)
            .stroke({ width: 1.2, color: palette.pinkNum, alpha: 0.65 })

          // Expanding Arcane Decryption Pulse Waves
          pulseWaveGfx.clear()
          const p1 = (t * 0.6) % 1
          const waveR = 12 + p1 * (HEX_RADIUS + 8)
          pulseWaveGfx.poly(getHexVertices(0, 0, waveR))
            .stroke({ width: 2 * (1 - p1), color: palette.mauveNum, alpha: (1 - p1) * 0.75 })

          // Orbiting Sacred Runic Motes
          motes.forEach(({ gfx, phase, speed, radius }) => {
            const angle = t * speed + phase
            const swayR = radius + Math.sin(t * 3 + phase) * 3
            gfx.position.set(swayR * Math.cos(angle), swayR * Math.sin(angle))
            gfx.rotation = t * 2 + phase
            const pulse = 0.5 + 0.5 * Math.sin(t * 4 + phase)
            gfx.alpha = 0.4 + 0.6 * pulse
            gfx.scale.set(0.7 + 0.4 * pulse)
          })

          innerGfx.alpha = 0.4 + 0.3 * Math.sin(t * 2.5)
        })
      }

      // 4. TRADEOFF WORKSHOP: Transmutation Forge / Golden Star Constellation
      if (node.type === 'tradeoff_workshop' && !isLocked && isSelected) {
        const forgeContainer = new Container()

        // 8 Twinkling Golden Stars distributed inside the hex
        const starConfigs = [
          { x: -14, y: -12, outerR: 3.8, innerR: 1.3, speed: 1.4, phase: 0.2 },
          { x: 14, y: -11, outerR: 3.2, innerR: 1.1, speed: 1.1, phase: 1.6 },
          { x: -15, y: 12, outerR: 3.5, innerR: 1.2, speed: 1.3, phase: 3.1 },
          { x: 15, y: 13, outerR: 4.0, innerR: 1.4, speed: 1.6, phase: 4.4 },
          { x: 0, y: -19, outerR: 3.0, innerR: 1.0, speed: 1.2, phase: 2.1 },
          { x: 0, y: 17, outerR: 3.4, innerR: 1.2, speed: 1.5, phase: 5.3 },
          { x: -9, y: 1, outerR: 2.6, innerR: 0.9, speed: 1.0, phase: 0.9 },
          { x: 10, y: 2, outerR: 2.8, innerR: 1.0, speed: 1.3, phase: 3.8 },
        ]

        const goldenStars = starConfigs.map((cfg) => {
          const star = new Graphics()
          star
            .poly(getStarVertices(0, 0, 4, cfg.outerR, cfg.innerR))
            .fill({ color: 0xe5c890, alpha: 0.95 })
            .stroke({ width: 0.5, color: 0xffffff, alpha: 0.7 })
          star.position.set(cfg.x, cfg.y)
          forgeContainer.addChild(star)
          return { gfx: star, cfg }
        })

        nodeContainer.addChild(forgeContainer)

        animControllersRef.current.push((t) => {
          goldenStars.forEach(({ gfx, cfg }) => {
            const val = Math.sin(t * 3.5 + cfg.phase)
            const driftX = Math.sin(t * cfg.speed + cfg.phase) * 1.5
            const driftY = Math.cos(t * cfg.speed * 0.8 + cfg.phase) * 1.5
            gfx.position.set(cfg.x + driftX, cfg.y + driftY)
            gfx.rotation = t * cfg.speed + cfg.phase
            gfx.scale.set(0.65 + 0.45 * Math.abs(val))
            gfx.alpha = 0.35 + 0.65 * Math.abs(val)
          })

          innerGfx.alpha = 0.3 + 0.35 * Math.sin(t * 3)
        })
      }

      // 5. BOSS LAIR: Expanding Crimson Shockwaves & Fiery Flare
      if (node.type === 'boss_lair' && isSelected) {
        const shockwaveContainer = new Container()
        const wave1 = new Graphics()
        const wave2 = new Graphics()
        shockwaveContainer.addChild(wave1)
        shockwaveContainer.addChild(wave2)
        nodeContainer.addChild(shockwaveContainer)

        animControllersRef.current.push((t) => {
          const p1 = (t * 0.7) % 1
          const p2 = (t * 0.7 + 0.5) % 1

          const r1 = HEX_RADIUS + p1 * 18
          const r2 = HEX_RADIUS + p2 * 18

          wave1.clear()
            .poly(getHexVertices(0, 0, r1))
            .stroke({ width: 2 * (1 - p1), color: 0xe78284, alpha: (1 - p1) * 0.75 })

          wave2.clear()
            .poly(getHexVertices(0, 0, r2))
            .stroke({ width: 2 * (1 - p2), color: 0xea999c, alpha: (1 - p2) * 0.75 })

          innerGfx.alpha = 0.4 + 0.4 * Math.sin(t * 4)
        })
      }

      // 6. LOCKED (Fog of War) OR NEWLY UNLOCKED REVEAL ANIMATION (Clouds parting left & right with glow)
      const isNewlyUnlocked = newlyUnlockedNodeIdsRef.current.has(node.id)
      if (isNewlyUnlocked) {
        // NOTE: do NOT delete the flag here (see matching note on the bomb-detonation
        // animation above). renderPixiScene() can be re-invoked mid-animation by unrelated
        // triggers (resize, selection change, isCapitalCleared toggle), rebuilding the whole
        // scene graph. Consuming the flag at build-time meant any such rebuild permanently
        // dropped the reveal FX before it ever got to play. The flag + start timestamp now
        // persist until the animation reports itself complete below.
        // Parting Fog Clouds (Left & Right dispersal) + Radiant Golden-Sapphire Unlock Glow
        const revealContainer = new Container()
        nodeContainer.addChild(revealContainer)

        // Celestial Hexagonal Beacon & Rising Sparkle Ray Motes (Elegant Hexagonal Enlightenment)
        const beaconBorderGfx = new Graphics()
        const lightRayGfx = new Graphics()
        const sparkleContainer = new Container()
        revealContainer.addChild(beaconBorderGfx)
        revealContainer.addChild(lightRayGfx)
        revealContainer.addChild(sparkleContainer)

        // 8 sparkling golden/cyan light motes that drift gracefully upward as fog parts
        const sparkleMotes = Array.from({ length: 8 }, (_, i) => {
          const sGfx = new Graphics()
          const outerR = 3.5 + (i % 3) * 0.8
          const innerR = 1.2
          sGfx.poly(getStarVertices(0, 0, 4, outerR, innerR))
            .fill({ color: i % 2 === 0 ? 0x8caaee : 0xe5c890, alpha: 0.95 })
            .stroke({ width: 0.5, color: 0xffffff, alpha: 0.8 })
          sparkleContainer.addChild(sGfx)
          return {
            gfx: sGfx,
            originX: ((i - 3.5) / 3.5) * (HEX_RADIUS - 12),
            originY: 10 - (i % 4) * 6,
            floatSpeed: 28 + (i % 3) * 12,
            phase: i * 0.7,
          }
        })

        // Clouds split into Left Group (dispersing left) and Right Group (dispersing right)
        const leftClouds = [
          { x: -18, y: -16, rx: 24, ry: 18, color: 0x51576d },
          { x: -22, y: 12, rx: 25, ry: 19, color: 0x414559 },
          { x: -24, y: 0, rx: 22, ry: 20, color: 0x626880 },
          { x: -8, y: -6, rx: 20, ry: 16, color: 0x51576d },
        ]

        const rightClouds = [
          { x: 18, y: -16, rx: 24, ry: 18, color: 0x626880 },
          { x: 20, y: 14, rx: 25, ry: 19, color: 0x414559 },
          { x: 24, y: 0, rx: 23, ry: 20, color: 0x51576d },
          { x: 8, y: 6, rx: 20, ry: 16, color: 0x626880 },
        ]

        const leftGraphics = leftClouds.map((puff) => {
          const g = new Graphics()
          g.ellipse(0, 0, puff.rx, puff.ry).fill({ color: puff.color, alpha: 0.85 })
          g.position.set(puff.x, puff.y)
          revealContainer.addChild(g)
          return { gfx: g, puff }
        })

        const rightGraphics = rightClouds.map((puff) => {
          const g = new Graphics()
          g.ellipse(0, 0, puff.rx, puff.ry).fill({ color: puff.color, alpha: 0.85 })
          g.position.set(puff.x, puff.y)
          revealContainer.addChild(g)
          return { gfx: g, puff }
        })

        let revealStartTime = unlockAnimStartRef.current.get(node.id)
        if (revealStartTime === undefined) {
          revealStartTime = performance.now() * 0.001
          unlockAnimStartRef.current.set(node.id, revealStartTime)
        }
        const revealDuration = 1.3 // 1.3s elegant reveal animation

        animControllersRef.current.push((t) => {
          const elapsed = t - revealStartTime
          const progress = Math.min(1, Math.max(0, elapsed / revealDuration))

          if (progress < 1) {
            // Clouds parting smoothly: left clouds drift left (-X), right clouds drift right (+X)
            const partDistance = Math.pow(progress, 1.2) * 58

            leftGraphics.forEach(({ gfx, puff }) => {
              gfx.position.set(puff.x - partDistance, puff.y)
              gfx.alpha = Math.max(0, (1 - progress * 1.1) * 0.85)
              gfx.scale.set(1 + progress * 0.3)
            })

            rightGraphics.forEach(({ gfx, puff }) => {
              gfx.position.set(puff.x + partDistance, puff.y)
              gfx.alpha = Math.max(0, (1 - progress * 1.1) * 0.85)
              gfx.scale.set(1 + progress * 0.3)
            })

            // Hexagonal Beacon Contour Glow (Following exact hex geometry)
            const hexPulse = Math.sin(progress * Math.PI)
            beaconBorderGfx.clear()
              .poly(getHexVertices(0, 0, HEX_RADIUS + 3))
              .stroke({ width: 3, color: 0x8caaee, alpha: hexPulse * 0.95 })
              .poly(getHexVertices(0, 0, HEX_RADIUS - 3))
              .stroke({ width: 1.5, color: 0xe5c890, alpha: hexPulse * 0.8 })

            // Ascending Celestial Enlightenment Light Ray Beams
            lightRayGfx.clear()
            const rayAlpha = Math.sin(progress * Math.PI) * 0.9
            if (rayAlpha > 0.02) {
              // Beams shoot from hex base and ascend high into the sky (-Y)
              const rayBeamRise = progress * 45
              const centerTopY = -20 - progress * 55
              const centerBottomY = 18 - rayBeamRise
              const sideTopY = -14 - progress * 45
              const sideBottomY = 14 - rayBeamRise

              // Center Ascending Pillar of Light (Pure White Core with Cyan Glow)
              lightRayGfx
                .moveTo(0, centerBottomY).lineTo(0, centerTopY)
                .stroke({ width: 5.5, color: 0x8caaee, alpha: rayAlpha * 0.45, cap: 'round' })
                .moveTo(0, centerBottomY).lineTo(0, centerTopY)
                .stroke({ width: 2.5, color: 0xffffff, alpha: rayAlpha * 0.95, cap: 'round' })

              // Left Ascending Ray Beam
              lightRayGfx
                .moveTo(-14, sideBottomY).lineTo(-14, sideTopY)
                .stroke({ width: 2.2, color: 0x8caaee, alpha: rayAlpha * 0.75, cap: 'round' })
                .moveTo(-14, sideBottomY).lineTo(-14, sideTopY)
                .stroke({ width: 1.0, color: 0xffffff, alpha: rayAlpha * 0.85, cap: 'round' })

              // Right Ascending Ray Beam
              lightRayGfx
                .moveTo(14, sideBottomY).lineTo(14, sideTopY)
                .stroke({ width: 2.2, color: 0xe5c890, alpha: rayAlpha * 0.75, cap: 'round' })
                .moveTo(14, sideBottomY).lineTo(14, sideTopY)
                .stroke({ width: 1.0, color: 0xffffff, alpha: rayAlpha * 0.85, cap: 'round' })

              // Far Edge Shimmer Rays
              lightRayGfx
                .moveTo(-24, sideBottomY + 4).lineTo(-24, sideTopY + 10)
                .stroke({ width: 1.2, color: 0x8caaee, alpha: rayAlpha * 0.5, cap: 'round' })
                .moveTo(24, sideBottomY + 4).lineTo(24, sideTopY + 10)
                .stroke({ width: 1.2, color: 0xe5c890, alpha: rayAlpha * 0.5, cap: 'round' })
            }

            // Rising Sparkle Ray Motes (Floating gently upward towards the sky)
            sparkleMotes.forEach(({ gfx, originX, originY, floatSpeed, phase }) => {
              const upwardY = originY - progress * floatSpeed
              const swayX = originX + Math.sin(t * 4 + phase) * 3
              gfx.position.set(swayX, upwardY)
              gfx.alpha = Math.sin(progress * Math.PI) * 0.9
              gfx.scale.set(0.7 + Math.sin(t * 6 + phase) * 0.3)
            })
          } else {
            revealContainer.visible = false
            // Animation naturally finished — now it's safe to consume the one-shot trigger.
            newlyUnlockedNodeIdsRef.current.delete(node.id)
            unlockAnimStartRef.current.delete(node.id)
          }
        })
      } else if (isLocked && !isBoss) {
        const fogContainer = new Container()

        // 9 overlapping edge-spanning cloud puffs concealing all hex edges and corners
        const cloudPuffs = [
          { x: 0, y: 0, rx: 26, ry: 20, color: 0x414559, baseAlpha: 0.7, speed: 0.7, phase: 0 },
          { x: -18, y: -16, rx: 22, ry: 17, color: 0x51576d, baseAlpha: 0.65, speed: 0.9, phase: 1.2 },
          { x: 18, y: -16, rx: 24, ry: 18, color: 0x626880, baseAlpha: 0.6, speed: 1.1, phase: 2.3 },
          { x: -22, y: 12, rx: 23, ry: 17, color: 0x51576d, baseAlpha: 0.65, speed: 0.8, phase: 3.5 },
          { x: 20, y: 14, rx: 25, ry: 19, color: 0x414559, baseAlpha: 0.7, speed: 1.0, phase: 4.6 },
          { x: 0, y: -22, rx: 24, ry: 16, color: 0x626880, baseAlpha: 0.6, speed: 1.2, phase: 1.8 },
          { x: 0, y: 22, rx: 25, ry: 17, color: 0x51576d, baseAlpha: 0.65, speed: 0.9, phase: 5.1 },
          { x: -24, y: 0, rx: 20, ry: 18, color: 0x414559, baseAlpha: 0.7, speed: 1.1, phase: 2.9 },
          { x: 24, y: 0, rx: 21, ry: 18, color: 0x626880, baseAlpha: 0.6, speed: 0.8, phase: 4.0 },
        ]

        const puffGraphics = cloudPuffs.map((puff) => {
          const g = new Graphics()
          g.ellipse(0, 0, puff.rx, puff.ry).fill({ color: puff.color, alpha: puff.baseAlpha })
          g.position.set(puff.x, puff.y)
          fogContainer.addChild(g)
          return { gfx: g, puff }
        })

        nodeContainer.addChild(fogContainer)

        animControllersRef.current.push((t) => {
          puffGraphics.forEach(({ gfx, puff }) => {
            const driftX = Math.sin(t * puff.speed + puff.phase) * 6
            const driftY = Math.cos(t * puff.speed * 0.7 + puff.phase) * 4
            gfx.position.set(puff.x + driftX, puff.y + driftY)
            gfx.alpha = puff.baseAlpha + Math.sin(t * 1.5 + puff.phase) * 0.12
          })
        })
      }

      // Center Procedural Vector Insignia (Only for Unlocked Nodes or Boss)
      if (!isLocked || isBoss) {
        const insigniaGfx = new Graphics()
        drawVectorInsignia(insigniaGfx, node.type, styleInfo.highlight || styleInfo.stroke, isDefeatedEncounter, palette)
        insigniaGfx.position.set(0, 0)
        nodeContainer.addChild(insigniaGfx)
      }

      // Item Reward Beacon Badge (Docked cleanly at bottom edge without shifting main icon)
      if (capitalCleared && node.rewards && node.rewards.length > 0 && (!isLocked || isBoss)) {
        const badgeGfx = new Graphics()
        badgeGfx
          .roundRect(-13, 20, 26, 16, 8)
          .fill({ color: palette.mantleNum, alpha: 0.95 })
          .stroke({ width: 1.5, color: palette.yellowNum })
        nodeContainer.addChild(badgeGfx)

        const rewardIconStyle = new TextStyle({
          fontSize: 10,
          fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif',
          fontWeight: 'bold',
          fill: palette.yellowNum,
        })
        const rewardText = new Text({ text: node.rewards[0].icon || '🎁', style: rewardIconStyle })
        rewardText.anchor.set(0.5, 0.5)
        rewardText.position.set(0, 28)
        nodeContainer.addChild(rewardText)
      }

      // Cleared Checkmark Badge
      if (isCleared) {
        const checkStyle = new TextStyle({
          fontSize: 13,
          fontWeight: 'bold',
          fill: isDefeatedEncounter ? palette.subtext0Num : palette.greenNum,
        })
        const checkText = new Text({ text: '✓', style: checkStyle })
        checkText.anchor.set(0.5, 0.5)
        checkText.position.set(20, -18)
        nodeContainer.addChild(checkText)
      }

      // Threatened Warning Badge
      if (isThreatened && !hasItemReward) {
        const warnStyle = new TextStyle({
          fontSize: 13,
          fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif',
        })
        const warnText = new Text({ text: '⚠️', style: warnStyle })
        warnText.anchor.set(0.5, 0.5)
        warnText.position.set(18, -18)
        nodeContainer.addChild(warnText)
      }

      // Hover animation
      nodeContainer.on('pointerover', () => {
        nodeContainer.scale.set(1.06)
      })
      nodeContainer.on('pointerout', () => {
        nodeContainer.scale.set(1.0)
      })

      mapContainer.addChild(nodeContainer)
    })

    updateMapTransform()
  }, [centerOnNode, updateMapTransform])

  const renderRef = useRef(renderPixiScene)
  renderRef.current = renderPixiScene

  // Detect newly unlocked nodes and newly cleared encounters when nodes prop updates,
  // then re-render the PixiJS scene exactly once.
  //
  // NOTE: this used to be split into two separate effects that both watched `nodes`
  // (this one, plus the "re-render on data/selection change" effect below). Since the
  // bomb-blast / fog-reveal animation flags are consumed (deleted) the moment a node is
  // drawn, having a SECOND effect immediately re-render right after this one wiped out
  // the animation containers before a single frame was ever painted — the node's status
  // (checkmark/color) would update correctly, but the celebratory animation never showed.
  useEffect(() => {
    const prevMap = new Map(previousNodesRef.current.map((n) => [n.id, n.status]))
    const newUnlockIds = new Set<string>()
    const newClearedIds = new Set<string>()

    nodes.forEach((n) => {
      const prevStatus = prevMap.get(n.id)
      if (prevStatus === 'locked' && n.status !== 'locked') {
        newUnlockIds.add(n.id)
      }
      if (prevStatus !== 'cleared' && n.status === 'cleared') {
        newClearedIds.add(n.id)
      }
    })

    const hasNewAnimations = newUnlockIds.size > 0 || newClearedIds.size > 0
    if (hasNewAnimations) {
      // Merge into (not replace) the existing sets: a still in-flight animation from an
      // earlier change (e.g. one node clears while another node's unlock-reveal from a
      // moment ago hasn't finished its 1.3s yet) must not be clobbered by this new batch.
      newUnlockIds.forEach((id) => newlyUnlockedNodeIdsRef.current.add(id))
      newClearedIds.forEach((id) => newlyClearedNodeIdsRef.current.add(id))
    }
    previousNodesRef.current = nodes

    // Single render pass per change — this (re)builds containers for any pending
    // newly-unlocked/newly-cleared ids, resuming in-flight ones via the persisted
    // unlockAnimStartRef / clearAnimStartRef start timestamps rather than restarting them.
    if (mapContainerRef.current) {
      renderRef.current()
    }

    if (hasNewAnimations) {
      // Safety-net: if one of THIS batch's ids never got consumed by a render pass (e.g.
      // it isn't currently in the visible node list, so its per-node render block never
      // ran), drop only those specific ids/timestamps rather than wiping the whole set —
      // other nodes' animations may still be legitimately in-flight.
      const timer = setTimeout(() => {
        newUnlockIds.forEach((id) => {
          newlyUnlockedNodeIdsRef.current.delete(id)
          unlockAnimStartRef.current.delete(id)
        })
        newClearedIds.forEach((id) => {
          newlyClearedNodeIdsRef.current.delete(id)
          clearAnimStartRef.current.delete(id)
        })
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [nodes, selectedNodeId, isCapitalCleared])

  // Re-render Pixi scene when theme palette changes
  useEffect(() => {
    if (appRef.current?.renderer) {
      appRef.current.renderer.background.color = palette.baseNum
    }
    if (mapContainerRef.current) {
      renderRef.current()
    }
  }, [palette])

  // PixiJS canvas initialization & render hook
  const handleInitPixi = useCallback((app: Application, rootContainer: Container) => {
    appRef.current = app

    const mapContainer = new Container()
    rootContainer.addChild(mapContainer)
    mapContainerRef.current = mapContainer

    // Add 60fps ticker callback
    const tickerCallback = () => {
      if (!app || !app.renderer || !mapContainer || mapContainer.destroyed) return
      const now = performance.now() * 0.001
      animControllersRef.current.forEach((fn) => {
        try {
          fn(now)
        } catch {
          // ignore destroyed graphics during scene transition
        }
      })
    }
    app.ticker.add(tickerCallback)

    renderRef.current()

    return () => {
      app.ticker.remove(tickerCallback)
      appRef.current = null
      mapContainerRef.current = null
    }
  }, [])

  const handleResizePixi = useCallback(() => {
    updateMapTransform()
    renderRef.current()
  }, [updateMapTransform])

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(2.0, +(prev + 0.15).toFixed(2)))
  const handleZoomOut = () => setZoom((prev) => Math.max(0.05, +(prev - 0.15).toFixed(2)))
  const handleResetPanZoom = () => {
    setZoom(1.0)
    setPan({ x: 0, y: 0 })
  }

  // Native non-passive wheel listener
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const zoomStep = -e.deltaY * 0.0015
      setZoom((prev) => Math.min(2.0, Math.max(0.05, +(prev + zoomStep).toFixed(3))))
    }

    el.addEventListener('wheel', handleNativeWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleNativeWheel)
    }
  }, [])

  // Pointer drag panning
  const handlePointerDown = (e: React.PointerEvent) => {
    const targetTag = (e.target as HTMLElement).tagName.toLowerCase()
    if (targetTag === 'canvas' || targetTag === 'div') {
      setIsDragging(true)
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    })
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  // Touch Pinch-to-Zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      touchDistRef.current = Math.hypot(dx, dy)
    } else if (e.touches.length === 1) {
      setIsDragging(true)
      dragStartRef.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const factor = dist / touchDistRef.current
      setZoom((prev) => Math.min(2.0, Math.max(0.05, +(prev * factor).toFixed(3))))
      touchDistRef.current = dist
    } else if (e.touches.length === 1 && isDragging) {
      setPan({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    touchDistRef.current = null
  }

  return (
    <div
      ref={containerRef}
      data-lenis-prevent
      data-lenis-prevent-wheel
      data-lenis-prevent-touch
      className={`relative w-full aspect-[16/10] min-h-[320px] max-h-[70vh] bg-[var(--ctp-base)] rounded-2xl border border-[var(--ctp-surface1)] overflow-hidden shadow-2xl flex items-center justify-center select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Reusable React Pixi Canvas Viewport */}
      <PixiCanvasViewport
        className="absolute inset-0 w-full h-full"
        backgroundColor={palette.baseNum}
        backgroundAlpha={1}
        defaultWidth={880}
        defaultHeight={580}
        onInit={handleInitPixi}
        onResize={handleResizePixi}
      />

      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(var(--ctp-blue)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Mobile-Friendly Zoom & Pan Controls Overlay */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-[var(--ctp-surface0)]/90 backdrop-blur-md p-1.5 rounded-xl border border-[var(--ctp-surface1)] shadow-lg">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-8 h-8 rounded-lg bg-[var(--ctp-crust)] hover:bg-[var(--ctp-surface1)] active:scale-95 text-[var(--ctp-text)] flex items-center justify-center transition-all border border-[var(--ctp-surface1)]"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-8 h-8 rounded-lg bg-[var(--ctp-crust)] hover:bg-[var(--ctp-surface1)] active:scale-95 text-[var(--ctp-text)] flex items-center justify-center transition-all border border-[var(--ctp-surface1)]"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={handleResetPanZoom}
          title="Reset Pan & Zoom"
          className="px-2.5 h-8 rounded-lg bg-[var(--ctp-crust)] hover:bg-[var(--ctp-surface1)] active:scale-95 text-[var(--ctp-blue)] font-mono text-xs font-semibold flex items-center gap-1 transition-all border border-[var(--ctp-surface1)]"
        >
          <RotateCcw size={13} />
          <span>{Math.round(zoom * 100)}%</span>
        </button>
      </div>

      {/* Map Pan Drag Hint */}
      <div className="absolute top-3 left-3 z-20 hidden sm:flex items-center gap-1.5 bg-[var(--ctp-surface0)]/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-[var(--ctp-surface1)] text-[11px] text-[var(--ctp-subtext0)] pointer-events-none">
        <Move size={12} className="text-[var(--ctp-blue)]" />
        <span>Drag canvas to pan • Pinch / Wheel to zoom</span>
      </div>

      {/* Map Control Overlay Legend */}
      <div className="absolute bottom-3 left-3 z-20 bg-[var(--ctp-surface0)]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-[var(--ctp-surface1)] flex items-center gap-3 text-xs text-[var(--ctp-text)] max-w-[92vw] overflow-x-auto">
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-[var(--ctp-blue)]" /> Capital</div>
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-[var(--ctp-green)]" /> Sanctuary</div>
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-[var(--ctp-red)]" /> Monster</div>
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-[var(--ctp-mauve)]" /> Reflection</div>
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-[var(--ctp-yellow)]" /> Workshop</div>
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-[var(--ctp-maroon)]" /> Boss</div>
        <div className="flex items-center gap-1 shrink-0 border-l border-[var(--ctp-surface1)] pl-3"><span className="w-2.5 h-2.5 rounded-full bg-[var(--ctp-surface1)]" /> Locked (Fog)</div>
      </div>
    </div>
  )
})
