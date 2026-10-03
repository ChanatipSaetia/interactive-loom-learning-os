import { Container, Graphics } from 'pixi.js'
import { GlowFilter, type GlowFilterOptions } from 'pixi-filters'
import { HexNodeData } from '../types'
import { GamificationThemePalette } from '../theme-palette'
import { computeHexGridCoordinates, getAutoFlowConnections, isSanctuary } from '../layout'
import { HEX_RADIUS, axialToPixel, getHexVertices } from './hex-geometry'
import { createHexGradient } from './hex-gradient'
import {
  NodeEffectContext,
  renderAimReticle,
  renderClearedExplosionFx,
  renderFogOfWar,
  renderNodeBadges,
  renderUnlockRevealFx,
} from './node-effects'
import { renderHexTypeEffects, drawHexTerrainGround, drawHexTerritory, type HexTerritoryContext } from './hex-types'

export interface HexSceneContext {
  mapContainer: Container
  palette: GamificationThemePalette
  nodes: HexNodeData[]
  selectedNodeId: string | null
  onSelectNode: (node: HexNodeData | null) => void
  updateMapTransform: () => void
  animControllers: Array<(time: number) => void>
  newlyUnlockedNodeIds: Set<string>
  newlyClearedNodeIds: Set<string>
  unlockAnimStart: Map<string, number>
  clearAnimStart: Map<string, number>
}

export type NodeGlowVariant = 'selected' | 'boss_lair' | 'capital' | 'quest_item'

/** Low alpha for the full dependency topology layer. */
export const FULL_ARC_ALPHA = 0.2

export interface ArcControlPoint {
  cpX: number
  cpY: number
  curveOffset: number
}

/**
 * Perpendicular quadratic-Bézier control point for a dependency arc between p1
 * and p2. The curvature sign alternates by connection index so parallel arcs in
 * dense chains stay visually separable.
 */
export function computeArcControlPoint(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  index: number,
): ArcControlPoint {
  const midX = (p1.x + p2.x) / 2
  const midY = (p1.y + p2.y) / 2
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const dist = Math.hypot(dx, dy) || 1
  const curveOffset = Math.min(32, Math.max(18, dist * 0.22)) * (index % 2 === 0 ? 1 : -1)
  const nx = -dy / dist
  const ny = dx / dist
  return { cpX: midX + nx * curveOffset, cpY: midY + ny * curveOffset, curveOffset }
}

export interface CalculatedRoad {
  fromNode: HexNodeData
  toHubNode: HexNodeData
  fromPixel: { x: number; y: number }
  toPixel: { x: number; y: number }
  controlPoint: ArcControlPoint
  isUnlocked: boolean
  isCleared: boolean
}

/**
 * Calculates connecting trade highway trajectories from every sanctuary territory back to the central hub.
 * This is computed at the last rendering stage after all node coordinates and territory envelopes are resolved.
 */
export function calculateTerritoryRoads(
  nodes: HexNodeData[],
  coords: Map<string, { q: number; r: number }>,
): CalculatedRoad[] {
  const hubNode = nodes.find((n) => n.type === 'capital') || nodes[0]
  if (!hubNode) return []

  const hubCoord = coords.get(hubNode.id) || { q: 0, r: 0 }
  const hubPixel = axialToPixel(hubCoord.q, hubCoord.r, 0, 0)

  const sanctuaryNodes = nodes.filter((n) => isSanctuary(n.type))
  const roads: CalculatedRoad[] = []

  sanctuaryNodes.forEach((node, index) => {
    const nodeCoord = coords.get(node.id) || node.coordinates || { q: 0, r: 0 }
    const nodePixel = axialToPixel(nodeCoord.q, nodeCoord.r, 0, 0)

    const hubRadius = 135
    const sanctuaryRadius = 75

    // Angle in 2.5D isometric space (y scaled by 1 / 0.88)
    const dx = nodePixel.x - hubPixel.x
    const dy = (nodePixel.y - hubPixel.y) / 0.88
    const angleHubToSanctuary = Math.atan2(dy, dx)

    // Start of road: edge of Hub territory
    const hubEdgePixel = {
      x: hubPixel.x + Math.cos(angleHubToSanctuary) * hubRadius,
      y: hubPixel.y + Math.sin(angleHubToSanctuary) * (hubRadius * 0.88),
    }

    // End of road: edge of Sanctuary territory
    const sanctuaryEdgePixel = {
      x: nodePixel.x - Math.cos(angleHubToSanctuary) * sanctuaryRadius,
      y: nodePixel.y - Math.sin(angleHubToSanctuary) * (sanctuaryRadius * 0.88),
    }

    const controlPoint = computeArcControlPoint(hubEdgePixel, sanctuaryEdgePixel, index)

    roads.push({
      fromNode: node,
      toHubNode: hubNode,
      fromPixel: sanctuaryEdgePixel,
      toPixel: hubEdgePixel,
      controlPoint,
      isUnlocked: node.status === 'unlocked',
      isCleared: node.status === 'cleared',
    })
  })

  return roads
}

/**
 * Draws a very small, detailed 2.5D horse cart / trade wagon with a trotting steed,
 * reins, spoked wheels, cargo crates/canvas cover, and lantern.
 */
export function drawMiniHorseCart(
  g: Graphics,
  x: number,
  y: number,
  angle: number,
  palette: GamificationThemePalette,
  time: number,
  isCleared: boolean,
) {
  const fx = Math.cos(angle)
  const fy = Math.sin(angle)
  const sx = -fy
  const sy = fx

  const bob = Math.sin(time * 14) * 0.5
  const legBob = Math.sin(time * 16) * 0.8

  // 1. Wagon Ground Shadow
  g.ellipse(x - fx * 3.5, y - fy * 3.5 + 1.4, 7.0, 3.5).fill({
    color: palette.crustNum,
    alpha: 0.4,
  })

  // 2. Horse Shadow
  g.ellipse(x + fx * 5.8, y + fy * 5.8 + 1.4, 4.5, 2.2).fill({
    color: palette.crustNum,
    alpha: 0.35,
  })

  // ─── HORSE (Front: offset +5.8px) ───
  const horseX = x + fx * 5.8
  const horseY = y + fy * 5.8 + bob * 0.6
  const coatColor = isCleared ? palette.peachNum : palette.surface2Num
  const maneColor = palette.surface0Num

  // Horse hooves / legs (4 tiny points oscillating with gallop)
  const fHoof1X = horseX + fx * 1.8 + sx * 1.1
  const fHoof1Y = horseY + fy * 1.8 + sy * 1.1 + legBob
  const fHoof2X = horseX + fx * 1.8 - sx * 1.1
  const fHoof2Y = horseY + fy * 1.8 - sy * 1.1 - legBob
  const bHoof1X = horseX - fx * 1.5 + sx * 1.1
  const bHoof1Y = horseY - fy * 1.5 + sy * 1.1 - legBob
  const bHoof2X = horseX - fx * 1.5 - sx * 1.1
  const bHoof2Y = horseY - fy * 1.5 - sy * 1.1 + legBob

  g.circle(fHoof1X, fHoof1Y, 0.7).fill({ color: maneColor })
  g.circle(fHoof2X, fHoof2Y, 0.7).fill({ color: maneColor })
  g.circle(bHoof1X, bHoof1Y, 0.7).fill({ color: maneColor })
  g.circle(bHoof2X, bHoof2Y, 0.7).fill({ color: maneColor })

  // Horse Body (oval)
  g.ellipse(horseX, horseY - 1.4, 3.2, 1.7)
    .fill({ color: coatColor })
    .stroke({ width: 0.5, color: palette.crustNum })

  // Horse Neck & Head
  const headX = horseX + fx * 2.8
  const headY = horseY - 2.8 + bob * 0.7
  g.ellipse(headX, headY, 1.7, 1.1)
    .fill({ color: coatColor })
    .stroke({ width: 0.5, color: palette.crustNum })
  // Mane & ears
  g.circle(headX - fx * 0.8, headY - 0.9, 0.8).fill({ color: maneColor })

  // ─── HARNESS & WOODEN HITCH SHAFTS ───
  g.moveTo(horseX - fx * 1.4 + sx * 1.5, horseY - 1.0)
    .lineTo(x - fx * 0.6 + sx * 1.8, y - 1.0)
    .stroke({ width: 0.6, color: palette.surface0Num })
  g.moveTo(horseX - fx * 1.4 - sx * 1.5, horseY - 1.0)
    .lineTo(x - fx * 0.6 - sx * 1.8, y - 1.0)
    .stroke({ width: 0.6, color: palette.surface0Num })

  // ─── WOODEN CART / WAGON (Rear: offset -3.8px) ───
  const cartX = x - fx * 3.8
  const cartY = y - fy * 3.8

  // 4 Spoked Wooden Wheels (2 left, 2 right)
  const wheelColor = palette.surface0Num
  const w1X = cartX + fx * 2.2 + sx * 2.8
  const w1Y = cartY + fy * 2.2 + sy * 2.8
  const w2X = cartX + fx * 2.2 - sx * 2.8
  const w2Y = cartY + fy * 2.2 - sy * 2.8
  const w3X = cartX - fx * 2.2 + sx * 2.8
  const w3Y = cartY - fy * 2.2 + sy * 2.8
  const w4X = cartX - fx * 2.2 - sx * 2.8
  const w4Y = cartY - fy * 2.2 - sy * 2.8

  g.circle(w1X, w1Y, 1.4).fill({ color: wheelColor }).stroke({ width: 0.5, color: palette.textNum })
  g.circle(w2X, w2Y, 1.4).fill({ color: wheelColor }).stroke({ width: 0.5, color: palette.textNum })
  g.circle(w3X, w3Y, 1.4).fill({ color: wheelColor }).stroke({ width: 0.5, color: palette.textNum })
  g.circle(w4X, w4Y, 1.4).fill({ color: wheelColor }).stroke({ width: 0.5, color: palette.textNum })

  // Wagon Wooden Chassis Box
  g.ellipse(cartX, cartY - 1.4, 4.4, 2.6)
    .fill({ color: palette.surface1Num })
    .stroke({ width: 0.6, color: palette.crustNum })

  // Canvas Wagon Bonnet / Cargo Crates
  const cargoColor = isCleared ? palette.yellowNum : palette.peachNum
  g.ellipse(cartX - fx * 0.5, cartY - 3.2, 3.4, 2.1)
    .fill({ color: cargoColor, alpha: 0.95 })
    .stroke({ width: 0.6, color: palette.crustNum })

  // Wagon Rear Lantern Glint
  const lanternX = cartX - fx * 3.6
  const lanternY = cartY - 3.4
  g.circle(lanternX, lanternY, 1.1).fill({ color: palette.yellowNum })
  g.circle(lanternX, lanternY, 0.5).fill({ color: palette.textNum })
}

/**
 * Renders paved 2.5D cobblestone trade highways with outer drainage trenches,
 * parallel cart wheel ruts, milestone cairns, and animated miniature horse carts.
 */
export function renderTerritoryRoads(
  container: Container,
  roads: CalculatedRoad[],
  palette: GamificationThemePalette,
  animControllers?: Array<(time: number) => void>,
) {
  if (!container || container.destroyed) return

  const staticGfx = new Graphics()
  container.addChild(staticGfx)

  const animGfx = new Graphics()
  container.addChild(animGfx)

  roads.forEach((road) => {
    // Before unlocking the hex, the connecting road will not render at all
    if (!road.isUnlocked && !road.isCleared) return

    const { fromPixel, toPixel, controlPoint, isCleared } = road

    // 1. Road Outer Ground Shadow & Shoulder Trench
    staticGfx
      .moveTo(toPixel.x, toPixel.y)
      .quadraticCurveTo(controlPoint.cpX, controlPoint.cpY, fromPixel.x, fromPixel.y)
      .stroke({
        width: 22,
        color: palette.crustNum,
        alpha: 0.42,
      })

    // 2. Packed Earth / Cobblestone Roadbed
    staticGfx
      .moveTo(toPixel.x, toPixel.y)
      .quadraticCurveTo(controlPoint.cpX, controlPoint.cpY, fromPixel.x, fromPixel.y)
      .stroke({
        width: 15,
        color: isCleared ? palette.surface2Num : palette.surface1Num,
        alpha: 0.75,
      })

    // 3. Worn Cart Wheel Ruts (Two Parallel Tracks)
    staticGfx
      .moveTo(toPixel.x, toPixel.y)
      .quadraticCurveTo(controlPoint.cpX, controlPoint.cpY, fromPixel.x, fromPixel.y)
      .stroke({
        width: 9,
        color: palette.surface0Num,
        alpha: 0.45,
      })

    // 4. Center Flagstone Trade Line (Golden / Peach)
    const centerColor = isCleared ? palette.yellowNum : palette.peachNum
    staticGfx
      .moveTo(toPixel.x, toPixel.y)
      .quadraticCurveTo(controlPoint.cpX, controlPoint.cpY, fromPixel.x, fromPixel.y)
      .stroke({
        width: 2.2,
        color: centerColor,
        alpha: 0.75,
      })

    // 5. Milestone Stone Cairns & Roadside Markers (at t = 0.2, 0.4, 0.6, 0.8)
    for (const t of [0.2, 0.4, 0.6, 0.8]) {
      const oneMinusT = 1 - t
      const mx =
        oneMinusT * oneMinusT * toPixel.x +
        2 * oneMinusT * t * controlPoint.cpX +
        t * t * fromPixel.x
      const my =
        oneMinusT * oneMinusT * toPixel.y +
        2 * oneMinusT * t * controlPoint.cpY +
        t * t * fromPixel.y

      // Small 2.5D flagstone stepping marker
      staticGfx
        .ellipse(mx, my + 1.0, 4.8, 2.4)
        .fill({ color: palette.crustNum, alpha: 0.35 })
      staticGfx
        .ellipse(mx, my, 3.8, 1.9)
        .fill({
          color: isCleared ? palette.surface2Num : palette.surface1Num,
          alpha: 0.85,
        })
        .stroke({ width: 0.6, color: centerColor, alpha: 0.6 })
    }
  })

  // 6. Animated Miniature Horse Carts Going Back and Forth
  if (animControllers) {
    animControllers.push((time: number) => {
      if (animGfx.destroyed) return
      animGfx.clear()

      roads.forEach((road, idx) => {
        if (!road.isUnlocked && !road.isCleared) return
        const { fromPixel, toPixel, controlPoint, isCleared } = road

        // Roundtrip cycle: 18s period. u in [0, 2)
        const cycleSpeed = 0.055
        const u = (time * cycleSpeed + idx * 0.38) % 2.0

        // Ping-pong: u in [0, 1] => forward outward (0 -> 1); u in [1, 2] => backward inward (1 -> 0)
        const isOutward = u <= 1.0
        const t = isOutward ? u : 2.0 - u

        const oneMinusT = 1 - t
        // Position B(t)
        const px =
          oneMinusT * oneMinusT * toPixel.x +
          2 * oneMinusT * t * controlPoint.cpX +
          t * t * fromPixel.x
        const py =
          oneMinusT * oneMinusT * toPixel.y +
          2 * oneMinusT * t * controlPoint.cpY +
          t * t * fromPixel.y

        // Tangent B'(t) = 2(1-t)(cp - P0) + 2t(P1 - cp)
        const dx = 2 * oneMinusT * (controlPoint.cpX - toPixel.x) + 2 * t * (fromPixel.x - controlPoint.cpX)
        const dy = 2 * oneMinusT * (controlPoint.cpY - toPixel.y) + 2 * t * (fromPixel.y - controlPoint.cpY)

        const travelDx = isOutward ? dx : -dx
        const travelDy = isOutward ? dy : -dy
        const angle = Math.atan2(travelDy, travelDx)

        drawMiniHorseCart(animGfx, px, py, angle, palette, time + idx * 2.5, isCleared)
      })
    })
  }
}

export function getGlowFilterOptions(palette: GamificationThemePalette, variant: NodeGlowVariant): GlowFilterOptions {
  switch (variant) {
    case 'selected':
      return { distance: 16, outerStrength: 2.6, color: palette.lavenderNum, alpha: 0.9, quality: 1 }
    case 'boss_lair':
      return { distance: 12, outerStrength: 2.2, color: palette.redNum, alpha: 0.85, quality: 1 }
    case 'capital':
      return { distance: 12, outerStrength: 2.0, color: palette.mauveNum, alpha: 0.85, quality: 1 }
    case 'quest_item':
      return { distance: 14, outerStrength: 2.5, color: palette.yellowNum, alpha: 0.95, quality: 1 }
  }
}

// Shared glow filter instances (per palette variant): the scene graph is torn
// down with removeChildren() on every render pass, so filters are cached and
// reused instead of being re-instantiated per node per rebuild.
const glowFilterCache = new Map<string, GlowFilter>()

export function getCachedGlowFilter(palette: GamificationThemePalette, variant: NodeGlowVariant): GlowFilter {
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1
  const key = `${palette.id}|${palette.redNum}|${variant}|${dpr}`
  let filter = glowFilterCache.get(key)
  if (!filter) {
    filter = new GlowFilter(getGlowFilterOptions(palette, variant))
    filter.resolution = dpr
    filter.padding = 24
    glowFilterCache.set(key, filter)
  }
  return filter
}

// Main render routine for the PixiJS campaign map scene
export function renderHexScene(ctx: HexSceneContext) {
  const {
    mapContainer,
    palette,
    nodes: currentNodes,
    selectedNodeId: currentSelectedId,
    onSelectNode: handleSelect,
    updateMapTransform,
    animControllers,
    newlyUnlockedNodeIds,
    newlyClearedNodeIds,
    unlockAnimStart,
    clearAnimStart,
  } = ctx

  if (!mapContainer || mapContainer.destroyed) return

  animControllers.length = 0
  mapContainer.removeChildren()
  mapContainer.sortableChildren = true

  const currentCoords = computeHexGridCoordinates(currentNodes)
  const currentConnections = getAutoFlowConnections(currentNodes)
  const capitalCleared = currentNodes.find((n) => n.type === 'capital')?.status === 'cleared'

  // ─── 1. RENDER THEMATIC TERRITORY AURAS (BACKGROUND LAYER, zIndex: 1) ───
  const territoryContainer = new Container()
  territoryContainer.zIndex = 1
  territoryContainer.eventMode = 'none'

  currentNodes.forEach((node) => {
    const isHub = node.type === 'capital'
    const isSite = isSanctuary(node.type)
    if (!isHub && !isSite) return
    if (node.status === 'locked') return // Only show territory aura when that node is unlocked or cleared

    const coord = currentCoords.get(node.id) || node.coordinates || { q: 0, r: 0 }
    const { x, y } = axialToPixel(coord.q, coord.r, 0, 0)
    const territoryRadius = isHub ? 135 : 75

    const territoryGfx = new Graphics()
    const territoryCtx: HexTerritoryContext = {
      x,
      y,
      radius: territoryRadius,
      palette,
      isCleared: node.status === 'cleared',
      isUnlocked: node.status === 'unlocked',
      node,
    }

    drawHexTerritory(territoryGfx, node.type, territoryCtx)

    // Subtle ambient breathing controller for the territory aura
    animControllers.push((time: number) => {
      if (territoryGfx.destroyed) return
      territoryGfx.alpha = 0.85 + 0.15 * Math.sin(time * 1.5 + (coord.q * 0.7 + coord.r * 0.3))
    })

    territoryContainer.addChild(territoryGfx)
  })

  mapContainer.addChild(territoryContainer)

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

    const nodeContainer = new Container()
    nodeContainer.zIndex = isSelected ? 100 : (isBoss ? 10 : 5)
    nodeContainer.position.set(x, y)
    nodeContainer.eventMode = 'static'
    nodeContainer.cursor = 'pointer'
    nodeContainer.cullable = true

    const hasUncompletedQuestItem = !isLocked && !isCleared && !!node.rewards && node.rewards.length > 0

    // Post-processing glow filter with native device resolution & padding
    if (isSelected) {
      nodeContainer.filters = [getCachedGlowFilter(palette, 'selected')]
    } else if (isBoss) {
      nodeContainer.filters = [getCachedGlowFilter(palette, 'boss_lair')]
    } else if (node.type === 'capital') {
      nodeContainer.filters = [getCachedGlowFilter(palette, 'capital')]
    } else if (hasUncompletedQuestItem) {
      nodeContainer.filters = [getCachedGlowFilter(palette, 'quest_item')]
    }

    // Tap / Click handling
    nodeContainer.on('pointertap', (e) => {
      e.stopPropagation()
      handleSelect(node)
    })


    const isDefeatedEncounter = isCleared && (node.type === 'quiz_encounter' || node.type === 'reflection_decryption')
    const styleInfo = palette.colorMap[node.type] || palette.colorMap.capital

    // Unified hex border color across all node types (surface2Num for revealed, surface1Num for locked)
    const strokeColor = isLocked ? palette.surface1Num : palette.surface2Num
    const highlightColor = isDefeatedEncounter ? palette.overlay0Num : (styleInfo.highlight || strokeColor)
    const strokeWidth = isLocked ? 2 : 2.2
    const fillAlpha = 1.0

    // 1. Theme-Responsive 3D Base Elevation & Drop Shadow
    const shadowGfx = new Graphics()
    if (palette.isDark) {
      // Dark Mode: Ground contact drop shadow + visible 3D pedestal extrusion against dark crust canvas
      shadowGfx
        .poly(getHexVertices(0, 4.5, HEX_RADIUS + 1.2))
        .fill({ color: 0x10121a, alpha: 0.95 })
        .poly(getHexVertices(0, 2.6, HEX_RADIUS + 0.6))
        .fill({ color: palette.surface0Num, alpha: 0.9 })
    } else {
      // Light Mode: Soft ambient contact occlusion + cast drop shadow
      shadowGfx
        .poly(getHexVertices(0, 4, HEX_RADIUS + 1.5))
        .fill({ color: palette.overlay0Num, alpha: 0.35 })
        .poly(getHexVertices(0, 2, HEX_RADIUS + 0.5))
        .fill({ color: palette.surface2Num, alpha: 0.5 })
    }
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

    // 2B. Full Hex Terrain Ground Biome
    const terrainGfx = new Graphics()
    drawHexTerrainGround(terrainGfx, node.type, {
      palette,
      isDefeated: isDefeatedEncounter,
      isLocked,
    })
    nodeContainer.addChild(terrainGfx)

    // Inner Bevel / Highlight ring graphics
    const innerGfx = new Graphics()

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

    const nodeCtx: NodeEffectContext = {
      node,
      nodeContainer,
      innerGfx,
      palette,
      animControllers,
      x,
      y,
      isSelected,
      isCleared,
      isLocked,
      isBoss,
      isDefeatedEncounter,
      capitalCleared,
      atkUx,
      atkUy,
      atkLen,
      styleInfo,
      newlyUnlockedNodeIds,
      newlyClearedNodeIds,
      unlockAnimStart,
      clearAnimStart,
    }

    // 3. Tactical Target Lock / Aim Reticle (Drawn on Selected Node)
    if (isSelected) {
      renderAimReticle(nodeCtx)
    }

    // 4. Inner Bevel / Highlight Ring (Only for Unlocked or Boss Nodes)
    if (!isLocked || isBoss) {
      const innerVerts = getHexVertices(0, 0, HEX_RADIUS - 5)
      innerGfx
        .poly(innerVerts)
        .stroke({ width: 1, color: highlightColor, alpha: isDefeatedEncounter ? 0.3 : 0.45 })
      nodeContainer.addChild(innerGfx)
    }

    // ─── 4B. NEWLY CLEARED ENCOUNTER BOMB DETONATION ANIMATION ───
    const isNewlyClearedEncounter = newlyClearedNodeIds.has(node.id) && (node.type === 'quiz_encounter' || node.type === 'reflection_decryption')
    if (isNewlyClearedEncounter) {
      renderClearedExplosionFx(nodeCtx)
    }

    // ─── DELEGATED HEX TYPE EFFECTS (Always Animated) ───
    renderHexTypeEffects(node.type, nodeCtx)

    // ─── LOCKED (Fog of War) OR NEWLY UNLOCKED REVEAL ANIMATION ───
    const isNewlyUnlocked = newlyUnlockedNodeIds.has(node.id)
    if (isNewlyUnlocked) {
      renderUnlockRevealFx(nodeCtx)
    } else if (isLocked && !isBoss) {
      renderFogOfWar(nodeCtx)
    }

    // Center insignia + reward / boss / cleared badges
    renderNodeBadges(nodeCtx)

    // Hover animation
    nodeContainer.on('pointerover', () => {
      nodeContainer.scale.set(1.06)
    })
    nodeContainer.on('pointerout', () => {
      nodeContainer.scale.set(1.0)
    })

    mapContainer.addChild(nodeContainer)
  })

  // ─── 3. CALCULATE AND RENDER ROADS TO THE HUB (CALCULATED AT THE LAST) ───
  const roadsContainer = new Container()
  roadsContainer.zIndex = 2
  roadsContainer.eventMode = 'none'

  const calculatedRoads = calculateTerritoryRoads(currentNodes, currentCoords)
  renderTerritoryRoads(roadsContainer, calculatedRoads, palette, animControllers)
  mapContainer.addChild(roadsContainer)

  updateMapTransform()
}
