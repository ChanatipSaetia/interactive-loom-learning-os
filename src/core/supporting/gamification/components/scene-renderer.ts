import { Container, Graphics } from 'pixi.js'
import { HexNodeData } from '../types'
import { GamificationThemePalette } from '../theme-palette'
import { computeHexGridCoordinates, getAutoFlowConnections } from '../layout'
import { HEX_RADIUS, axialToPixel, getHexVertices } from './hex-geometry'
import { createHexGradient } from './hex-gradient'
import {
  NodeEffectContext,
  renderAimReticle,
  renderBossShockwave,
  renderCapitalOrbit,
  renderClearedExplosionFx,
  renderFogOfWar,
  renderNodeBadges,
  renderQuizEncounterAttack,
  renderReflectionDecryptionRuneClock,
  renderSanctuarySpores,
  renderTradeoffForge,
  renderUnlockRevealFx,
} from './node-effects'

export interface HexSceneContext {
  mapContainer: Container
  palette: GamificationThemePalette
  nodes: HexNodeData[]
  selectedNodeId: string | null
  onSelectNode: (node: HexNodeData) => void
  centerOnNode: (node: HexNodeData) => void
  updateMapTransform: () => void
  animControllers: Array<(time: number) => void>
  newlyUnlockedNodeIds: Set<string>
  newlyClearedNodeIds: Set<string>
  unlockAnimStart: Map<string, number>
  clearAnimStart: Map<string, number>
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

      animControllers.push((t) => {
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

    // Inner Bevel / Highlight ring graphics (stroked & added only for unlocked or boss nodes)
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

    // ─── UNIQUE EFFECT LAYERS BY NODE TYPE (TRIGGERED ON SELECTION) ───

    // 1. CAPITAL: Orbital Constellation Satellites
    if (node.type === 'capital' && !isLocked && isSelected) {
      renderCapitalOrbit(nodeCtx)
    }

    // 2. READING SANCTUARY: Floating Healing Spores / Gentle Mist
    if (node.type === 'reading_sanctuary' && !isLocked && isSelected) {
      renderSanctuarySpores(nodeCtx)
    }

    // 3. QUIZ ENCOUNTER: Strike Lunge with Smooth Fireball Blast Shot at Peak Distance
    if (node.type === 'quiz_encounter' && !isLocked && isSelected) {
      renderQuizEncounterAttack(nodeCtx)
    }

    // 4. REFLECTION DECRYPTION: Volatile Cryptographic Cipher Bomb / Clockwise Pulsing Magic Runes & Lightning
    if (node.type === 'reflection_decryption' && !isLocked && isSelected) {
      renderReflectionDecryptionRuneClock(nodeCtx)
    }

    // 4. TRADEOFF WORKSHOP: Transmutation Forge / Golden Star Constellation
    if (node.type === 'tradeoff_workshop' && !isLocked && isSelected) {
      renderTradeoffForge(nodeCtx)
    }

    // 5. BOSS LAIR: Expanding Crimson Shockwaves & Fiery Flare
    if (node.type === 'boss_lair' && isSelected) {
      renderBossShockwave(nodeCtx)
    }

    // 6. LOCKED (Fog of War) OR NEWLY UNLOCKED REVEAL ANIMATION (Clouds parting left & right with glow)
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
