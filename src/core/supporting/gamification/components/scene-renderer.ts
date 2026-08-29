import { Container, Graphics } from 'pixi.js'
import { GlowFilter, type GlowFilterOptions } from 'pixi-filters'
import { HexNodeData } from '../types'
import { GamificationThemePalette } from '../theme-palette'
import { computeHexGridCoordinates, getAutoFlowConnections, isSanctuaryOrForge } from '../layout'
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
  centerOnNode: (node: HexNodeData) => void
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
    centerOnNode,
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
    const isSite = isSanctuaryOrForge(node.type)
    if (!isHub && !isSite) return
    if (node.status === 'locked') return // Only show territory aura when that node is unlocked or cleared

    const coord = currentCoords.get(node.id) || node.coordinates || { q: 0, r: 0 }
    const { x, y } = axialToPixel(coord.q, coord.r, 0, 0)
    const territoryRadius = 105

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
      centerOnNode(node)
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

    // ─── DELEGATED HEX TYPE EFFECTS (Triggered on Selection) ───
    if (isSelected) {
      renderHexTypeEffects(node.type, nodeCtx)
    }

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

  updateMapTransform()
}
