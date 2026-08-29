import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { SimplexNoiseFilter } from 'pixi-filters'
import { HexNodeData } from '../types'
import { GamificationThemePalette } from '../theme-palette'
import { HEX_RADIUS, getHexVertices, getStarVertices } from './hex-geometry'
import {
  drawHexInsignia,
  renderCapitalEffects,
  renderReadingSanctuaryEffects,
  renderQuizEncounterEffects,
  renderReflectionDecryptionEffects,
  renderTradeoffWorkshopEffects,
  renderBossLairEffects,
} from './hex-types'

export interface NodeEffectContext {
  node: HexNodeData
  nodeContainer: Container
  innerGfx: Graphics
  palette: GamificationThemePalette
  animControllers: Array<(time: number) => void>
  x: number
  y: number
  isSelected: boolean
  isCleared: boolean
  isLocked: boolean
  isBoss: boolean
  isDefeatedEncounter: boolean
  capitalCleared: boolean
  atkUx: number
  atkUy: number
  atkLen: number
  styleInfo: { fill: number; stroke: number; highlight: number; icon: string; name: string }
  newlyUnlockedNodeIds: Set<string>
  newlyClearedNodeIds: Set<string>
  unlockAnimStart: Map<string, number>
  clearAnimStart: Map<string, number>
}

// Arcane Hexagonal Astral Halo (Option 1: Concentric Celestial Hex Rings & Vertex Prisms)
export function renderAimReticle(ctx: NodeEffectContext) {
  const { nodeContainer, palette, animControllers } = ctx

  const haloContainer = new Container()
  const haloOuterGfx = new Graphics()
  const haloInnerGfx = new Graphics()
  const haloPrismGfx = new Graphics()
  const haloSparkGfx = new Graphics()

  haloContainer.addChild(haloInnerGfx)
  haloContainer.addChild(haloOuterGfx)
  haloContainer.addChild(haloPrismGfx)
  haloContainer.addChild(haloSparkGfx)
  nodeContainer.addChild(haloContainer)

  animControllers.push((t) => {
    const pulse = Math.sin(t * 2.5)
    const outerR = HEX_RADIUS + 5.5 + pulse * 1.5
    const innerR = HEX_RADIUS + 2.2 + pulse * 0.8
    const primaryColor = palette.blueNum
    const secondaryColor = palette.lavenderNum
    const accentColor = palette.sapphireNum

    // 1. Inner Echo Hex Ring
    haloInnerGfx.clear()
    haloInnerGfx
      .poly(getHexVertices(0, 0, innerR))
      .stroke({ width: 1, color: accentColor, alpha: 0.45 + pulse * 0.15 })

    // 2. Outer Breathing Hex Ring
    haloOuterGfx.clear()
    haloOuterGfx
      .poly(getHexVertices(0, 0, outerR))
      .stroke({ width: 2, color: primaryColor, alpha: 0.9 + pulse * 0.1 })

    // 3. 6 Vertex Prisms & Corner Braces
    haloPrismGfx.clear()
    for (let i = 0; i < 6; i++) {
      const angleRad = (i * Math.PI) / 3
      const vx = outerR * Math.cos(angleRad)
      const vy = outerR * Math.sin(angleRad)

      // Vertex Diamond Prism
      const prismSize = 3.2 + Math.sin(t * 3.5 + i * 1.05) * 0.8
      haloPrismGfx
        .poly([
          vx, vy - prismSize,
          vx + prismSize, vy,
          vx, vy + prismSize,
          vx - prismSize, vy,
        ])
        .fill({ color: secondaryColor, alpha: 0.95 })
        .stroke({ width: 1, color: primaryColor, alpha: 0.95 })

      // Small Vertex Corner Hugger Lines along hex edges
      const armLen = 7
      const edgeAngle1 = angleRad + (2 * Math.PI) / 3
      const edgeAngle2 = angleRad - (2 * Math.PI) / 3
      haloPrismGfx
        .moveTo(vx + Math.cos(edgeAngle1) * armLen, vy + Math.sin(edgeAngle1) * armLen)
        .lineTo(vx, vy)
        .lineTo(vx + Math.cos(edgeAngle2) * armLen, vy + Math.sin(edgeAngle2) * armLen)
        .stroke({ width: 2.2, color: secondaryColor, alpha: 0.85 })
    }

    // 4. Orbiting Celestial Sparkle
    haloSparkGfx.clear()
    const orbitAngle = t * 1.6
    const sparkX = (outerR + 0.5) * Math.cos(orbitAngle)
    const sparkY = (outerR + 0.5) * Math.sin(orbitAngle)
    haloSparkGfx
      .poly(getStarVertices(sparkX, sparkY, 4, 4, 1.6))
      .fill({ color: palette.yellowNum, alpha: 0.9 })
  })
}

// NEWLY CLEARED ENCOUNTER BOMB DETONATION ANIMATION
export function renderClearedExplosionFx(ctx: NodeEffectContext) {
  const { node, nodeContainer, animControllers, newlyClearedNodeIds, clearAnimStart } = ctx

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

  let bombStartTime = clearAnimStart.get(node.id)
  if (bombStartTime === undefined) {
    bombStartTime = performance.now() * 0.001
    clearAnimStart.set(node.id, bombStartTime)
  }

  animControllers.push((t) => {
    const elapsed = t - (bombStartTime as number)
    const duration = 0.85
    const progress = Math.min(1, Math.max(0, elapsed / duration))

    if (progress < 1) {
      bombAnimContainer.visible = true
      const flashRadius = (HEX_RADIUS + 4) * (1 + progress * 0.75)
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
      newlyClearedNodeIds.delete(node.id)
      clearAnimStart.delete(node.id)
    }
  })
}

// ─── DELEGATED HEX TYPE EFFECTS ───
export function renderCapitalOrbit(ctx: NodeEffectContext) {
  renderCapitalEffects(ctx)
}

export function renderSanctuarySpores(ctx: NodeEffectContext) {
  renderReadingSanctuaryEffects(ctx)
}

export function renderQuizEncounterAttack(ctx: NodeEffectContext) {
  renderQuizEncounterEffects(ctx)
}

export function renderReflectionDecryptionRuneClock(ctx: NodeEffectContext) {
  renderReflectionDecryptionEffects(ctx)
}

export function renderTradeoffForge(ctx: NodeEffectContext) {
  renderTradeoffWorkshopEffects(ctx)
}

export function renderBossShockwave(ctx: NodeEffectContext) {
  renderBossLairEffects(ctx)
}

// UNLOCK REVEAL ANIMATION (Clouds parting left & right with glow)
export function renderUnlockRevealFx(ctx: NodeEffectContext) {
  const { node, nodeContainer, animControllers, newlyUnlockedNodeIds, unlockAnimStart } = ctx

  const unlockAnimContainer = new Container()
  nodeContainer.addChild(unlockAnimContainer)

  const leftPuffs = [
    { x: -14, y: -12, rx: 20, ry: 16, color: 0x51576d, baseAlpha: 0.8 },
    { x: -18, y: 10, rx: 19, ry: 15, color: 0x414559, baseAlpha: 0.85 },
    { x: -8, y: 0, rx: 18, ry: 16, color: 0x626880, baseAlpha: 0.75 },
  ]
  const rightPuffs = [
    { x: 14, y: -12, rx: 20, ry: 16, color: 0x51576d, baseAlpha: 0.8 },
    { x: 18, y: 10, rx: 19, ry: 15, color: 0x414559, baseAlpha: 0.85 },
    { x: 8, y: 0, rx: 18, ry: 16, color: 0x626880, baseAlpha: 0.75 },
  ]

  const leftGfx = leftPuffs.map((p) => {
    const g = new Graphics()
    g.ellipse(0, 0, p.rx, p.ry).fill({ color: p.color, alpha: p.baseAlpha })
    g.position.set(p.x, p.y)
    unlockAnimContainer.addChild(g)
    return { gfx: g, puff: p }
  })

  const rightGfx = rightPuffs.map((p) => {
    const g = new Graphics()
    g.ellipse(0, 0, p.rx, p.ry).fill({ color: p.color, alpha: p.baseAlpha })
    g.position.set(p.x, p.y)
    unlockAnimContainer.addChild(g)
    return { gfx: g, puff: p }
  })

  const goldenPulse = new Graphics()
  unlockAnimContainer.addChild(goldenPulse)

  let revealStartTime = unlockAnimStart.get(node.id)
  if (revealStartTime === undefined) {
    revealStartTime = performance.now() * 0.001
    unlockAnimStart.set(node.id, revealStartTime)
  }

  animControllers.push((t) => {
    const elapsed = t - (revealStartTime as number)
    const duration = 0.9
    const progress = Math.min(1, Math.max(0, elapsed / duration))

    if (progress < 1) {
      unlockAnimContainer.visible = true
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const partDist = easeOut * 42

      leftGfx.forEach(({ gfx, puff }) => {
        gfx.position.set(puff.x - partDist, puff.y)
        gfx.alpha = Math.max(0, puff.baseAlpha * (1 - progress * 1.1))
      })

      rightGfx.forEach(({ gfx, puff }) => {
        gfx.position.set(puff.x + partDist, puff.y)
        gfx.alpha = Math.max(0, puff.baseAlpha * (1 - progress * 1.1))
      })

      goldenPulse.clear()
        .poly(getHexVertices(0, 0, HEX_RADIUS + progress * 14))
        .stroke({ width: 3 * (1 - progress), color: 0xe5c890, alpha: (1 - progress) * 0.9 })
    } else {
      unlockAnimContainer.visible = false
      newlyUnlockedNodeIds.delete(node.id)
      unlockAnimStart.delete(node.id)
    }
  })
}

// ─── LOCKED (Fog of War) cloud puffs ───
let sharedFogNoiseFilter: SimplexNoiseFilter | null = null

export function getFogNoiseFilter(): SimplexNoiseFilter {
  if (!sharedFogNoiseFilter) {
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1
    sharedFogNoiseFilter = new SimplexNoiseFilter({ strength: 0.35, noiseScale: 6 })
    sharedFogNoiseFilter.resolution = dpr
  }
  return sharedFogNoiseFilter
}

export function renderFogOfWar(ctx: NodeEffectContext) {
  const { nodeContainer, animControllers, palette } = ctx

  const fogContainer = new Container()
  fogContainer.label = 'FogOfWar'

  // 9 overlapping smooth cloud puffs concealing hex edges and corners with soft vector blending
  const cloudPuffs = [
    { x: 0, y: 0, rx: 26, ry: 20, color: palette.surface0Num, baseAlpha: 0.7, speed: 0.7, phase: 0 },
    { x: -18, y: -16, rx: 22, ry: 17, color: palette.surface1Num, baseAlpha: 0.65, speed: 0.9, phase: 1.2 },
    { x: 18, y: -16, rx: 24, ry: 18, color: palette.surface2Num, baseAlpha: 0.6, speed: 1.1, phase: 2.3 },
    { x: -22, y: 12, rx: 23, ry: 17, color: palette.surface1Num, baseAlpha: 0.65, speed: 0.8, phase: 3.5 },
    { x: 20, y: 14, rx: 25, ry: 19, color: palette.surface0Num, baseAlpha: 0.7, speed: 1.0, phase: 4.6 },
    { x: 0, y: -22, rx: 24, ry: 16, color: palette.surface2Num, baseAlpha: 0.6, speed: 1.2, phase: 1.8 },
    { x: 0, y: 22, rx: 25, ry: 17, color: palette.surface1Num, baseAlpha: 0.65, speed: 0.9, phase: 5.1 },
    { x: -24, y: 0, rx: 20, ry: 18, color: palette.surface0Num, baseAlpha: 0.7, speed: 1.1, phase: 2.9 },
    { x: 24, y: 0, rx: 21, ry: 18, color: palette.surface2Num, baseAlpha: 0.6, speed: 0.8, phase: 4.0 },
  ]

  const puffGraphics = cloudPuffs.map((puff) => {
    const g = new Graphics()
    g.ellipse(0, 0, puff.rx, puff.ry).fill({ color: puff.color, alpha: puff.baseAlpha })
    g.position.set(puff.x, puff.y)
    fogContainer.addChild(g)
    return { gfx: g, puff }
  })

  nodeContainer.addChild(fogContainer)

  // Continuous fog drift animation ONLY when selected
  if (ctx.isSelected) {
    animControllers.push((t) => {
      puffGraphics.forEach(({ gfx, puff }) => {
        const driftX = Math.sin(t * puff.speed + puff.phase) * 6
        const driftY = Math.cos(t * puff.speed * 0.7 + puff.phase) * 4
        gfx.position.set(puff.x + driftX, puff.y + driftY)
        gfx.alpha = puff.baseAlpha + Math.sin(t * 1.5 + puff.phase) * 0.12
      })
    })
  }
}

// Center insignia + reward / boss / cleared badges
export function renderNodeBadges(ctx: NodeEffectContext) {
  const {
    node,
    nodeContainer,
    palette,
    styleInfo,
    isCleared,
    isLocked,
    isBoss,
    isDefeatedEncounter,
    capitalCleared,
    animControllers,
    isSelected,
  } = ctx

  // Center Procedural Vector Insignia (Only for Unlocked Nodes or Boss)
  if (!isLocked || isBoss) {
    const insigniaGfx = new Graphics()
    insigniaGfx.position.set(0, 0)
    nodeContainer.addChild(insigniaGfx)

    // Initial static draw (time: 0)
    drawHexInsignia(insigniaGfx, node.type, {
      color: styleInfo.highlight || styleInfo.stroke,
      isDefeated: isDefeatedEncounter,
      palette,
      time: 0,
    })

    // Continuous ticker animation for living miniature features ONLY when selected
    if (isSelected) {
      animControllers.push((t) => {
        drawHexInsignia(insigniaGfx, node.type, {
          color: styleInfo.highlight || styleInfo.stroke,
          isDefeated: isDefeatedEncounter,
          palette,
          time: t,
        })
      })
    }
  }

  // Item Reward Beacon Badge & Quest Aura
  if ((capitalCleared || !isLocked) && node.rewards && node.rewards.length > 0) {
    const isCollected = isCleared
    const isRevealedQuest = !isLocked && !isCleared

    // Animated Pulsing Quest Beacon Ring on revealed uncompleted key item node (always animated)
    if (isRevealedQuest) {
      const beaconGfx = new Graphics()
      nodeContainer.addChild(beaconGfx)
      animControllers.push((t) => {
        beaconGfx.clear()
        const pulse = (t * 1.4) % 1
        const r = HEX_RADIUS + 2 + pulse * 10
        const alpha = (1 - pulse) * 0.75
        beaconGfx
          .poly(getHexVertices(0, 0, r))
          .stroke({ width: 2.2 * (1 - pulse * 0.5), color: palette.yellowNum, alpha })
      })
    }

    const badgeGfx = new Graphics()
    badgeGfx
      .roundRect(-13, 20, 26, 16, 8)
      .fill({ color: palette.mantleNum, alpha: 0.95 })
      .stroke({
        width: isRevealedQuest ? 2 : 1.5,
        color: isCollected ? palette.subtext0Num : isLocked ? palette.mauveNum : palette.yellowNum,
      })
    nodeContainer.addChild(badgeGfx)

    const rewardIconStyle = new TextStyle({
      fontSize: 10,
      fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif',
      fontWeight: 'bold',
      fill: isCollected ? palette.subtext0Num : palette.yellowNum,
    })
    const rewardText = new Text({ text: node.rewards[0].icon || '🎁', style: rewardIconStyle })
    rewardText.anchor.set(0.5, 0.5)
    rewardText.position.set(0, 28)
    nodeContainer.addChild(rewardText)
  }

  // Boss Seals Requirement Indicator on Hex Map
  if (isBoss && node.requiredItems && node.requiredItems.length > 0) {
    const bossBadgeGfx = new Graphics()
    bossBadgeGfx
      .roundRect(-15, 20, 30, 16, 8)
      .fill({ color: palette.crustNum, alpha: 0.95 })
      .stroke({ width: 1.5, color: isCleared ? palette.greenNum : palette.maroonNum })
    nodeContainer.addChild(bossBadgeGfx)

    const bossBadgeStyle = new TextStyle({
      fontSize: 10,
      fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif',
      fontWeight: 'bold',
      fill: isCleared ? palette.greenNum : palette.maroonNum,
    })
    const bossBadgeText = new Text({ text: isCleared ? '👑' : '🗝️', style: bossBadgeStyle })
    bossBadgeText.anchor.set(0.5, 0.5)
    bossBadgeText.position.set(0, 28)
    nodeContainer.addChild(bossBadgeText)
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
}
