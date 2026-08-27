import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { HexNodeData } from '../types'
import { GamificationThemePalette } from '../theme-palette'
import { HEX_RADIUS, getHexVertices, getStarVertices } from './hex-geometry'
import { drawVectorInsignia } from './insignia-renderer'

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

// Tactical Target Lock / Aim Reticle (Drawn on Selected Node)
export function renderAimReticle(ctx: NodeEffectContext) {
  const { nodeContainer, palette, animControllers } = ctx

  const aimContainer = new Container()
  const aimBracketGfx = new Graphics()
  const aimRingGfx = new Graphics()
  aimContainer.addChild(aimBracketGfx)
  aimContainer.addChild(aimRingGfx)
  nodeContainer.addChild(aimContainer)

  animControllers.push((t) => {
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

// NEWLY CLEARED ENCOUNTER BOMB DETONATION ANIMATION
export function renderClearedExplosionFx(ctx: NodeEffectContext) {
  const { node, nodeContainer, animControllers, newlyClearedNodeIds, clearAnimStart } = ctx

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

  let bombStartTime = clearAnimStart.get(node.id)
  if (bombStartTime === undefined) {
    bombStartTime = performance.now() * 0.001
    clearAnimStart.set(node.id, bombStartTime)
  }
  const bombDuration = 1.1 // 1.1s blast animation

  animControllers.push((t) => {
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
      newlyClearedNodeIds.delete(node.id)
      clearAnimStart.delete(node.id)
    }
  })
}

// CAPITAL: Orbital Constellation Satellites
export function renderCapitalOrbit(ctx: NodeEffectContext) {
  const { nodeContainer, innerGfx, animControllers } = ctx

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

  animControllers.push((t) => {
    satellites.forEach((sat, i) => {
      const angle = t * 1.5 + (i * (2 * Math.PI) / numSatellites)
      const r = HEX_RADIUS + 6
      sat.position.set(r * Math.cos(angle), r * Math.sin(angle))
      sat.alpha = 0.5 + 0.5 * Math.sin(t * 3 + i)
    })
    innerGfx.alpha = 0.35 + 0.25 * Math.sin(t * 2)
  })
}

// READING SANCTUARY: Floating Healing Spores / Gentle Mist
export function renderSanctuarySpores(ctx: NodeEffectContext) {
  const { nodeContainer, innerGfx, animControllers } = ctx

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

  animControllers.push((t) => {
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

// QUIZ ENCOUNTER: Strike Lunge with Smooth Fireball Blast Shot at Peak Distance
export function renderQuizEncounterAttack(ctx: NodeEffectContext) {
  const { nodeContainer, innerGfx, x, y, isCleared, atkUx, atkUy, atkLen, animControllers } = ctx

  if (isCleared) {
    animControllers.push((t) => {
      innerGfx.alpha = 0.35 + 0.25 * Math.sin(t * 2)
    })
    return
  }

  const fireGfx = new Graphics()
  nodeContainer.addChild(fireGfx)
  const maxLunge = Math.min(26, Math.max(16, atkLen * 0.35))

  // Stateful projectile animation state
  let activeBlastStartTime = -1
  let hasFiredThisCycle = false

  animControllers.push((t) => {
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

// REFLECTION DECRYPTION: Volatile Cryptographic Cipher Bomb / Clockwise Pulsing Magic Runes & Lightning
export function renderReflectionDecryptionRuneClock(ctx: NodeEffectContext) {
  const { nodeContainer, innerGfx, isCleared, palette, animControllers } = ctx

  if (isCleared) {
    animControllers.push((t) => {
      innerGfx.alpha = 0.35 + 0.25 * Math.sin(t * 2)
    })
    return
  }

  const cipherContainer = new Container()
  const clockGlowGfx = new Graphics()
  const lightningGfx = new Graphics()
  cipherContainer.addChild(clockGlowGfx)
  cipherContainer.addChild(lightningGfx)
  nodeContainer.addChild(cipherContainer)

  const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᛉ', 'ᛞ', 'ᛟ']
  const numPips = RUNES.length
  const clockRadius = 25

  const runeItems = RUNES.map((char, i) => {
    const pipAngle = (i * 2 * Math.PI) / numPips - Math.PI / 2
    const px = Math.cos(pipAngle) * clockRadius
    const py = Math.sin(pipAngle) * clockRadius

    const style = new TextStyle({
      fontSize: 9,
      fontFamily: 'serif, monospace',
      fontWeight: 'bold',
      fill: palette.mauveNum,
    })
    const txt = new Text({ text: char, style })
    txt.anchor.set(0.5, 0.5)
    txt.position.set(px, py)
    cipherContainer.addChild(txt)
    return { txt, style, angle: pipAngle, px, py }
  })

  animControllers.push((t) => {
    // 1. Clockwise Pulsing Magic Rune Dial (Fast Clock / Bomb Ticker Dial)
    clockGlowGfx.clear()
    const sweepAngle = (t * 3.6) % (Math.PI * 2)

    runeItems.forEach(({ txt, style, angle, px, py }) => {
      // Angular difference behind the clockwise sweep
      let angleDiff = (sweepAngle - angle) % (Math.PI * 2)
      if (angleDiff < 0) angleDiff += Math.PI * 2

      // Intensity falls off along the trailing tail
      const intensity = Math.max(0, 1 - angleDiff / (Math.PI * 1.0))
      const runeAlpha = 0.3 + 0.7 * Math.pow(intensity, 2)
      txt.alpha = runeAlpha
      txt.scale.set(0.85 + 0.35 * intensity)
      style.fill = intensity > 0.6 ? 0xffffff : (intensity > 0.3 ? palette.peachNum : palette.mauveNum)

      // Dynamic glow behind active rune
      if (intensity > 0.35) {
        clockGlowGfx.circle(px, py, 6).fill({
          color: intensity > 0.6 ? palette.redNum : palette.mauveNum,
          alpha: (intensity - 0.35) * 0.55,
        })
      }
    })

    // 2. Crackling Volatile Magic Overload Lightning Arcs (Inside hex bounds)
    lightningGfx.clear()
    if (Math.sin(t * 16) > 0.3) {
      const boltAngle = t * 7 + Math.sin(t * 12)
      const boltLen = (HEX_RADIUS - 10) * (0.5 + Math.random() * 0.45)
      const midX = Math.cos(boltAngle) * (boltLen * 0.5) + (Math.random() - 0.5) * 6
      const midY = Math.sin(boltAngle) * (boltLen * 0.5) + (Math.random() - 0.5) * 6
      const endX = Math.cos(boltAngle) * boltLen
      const endY = Math.sin(boltAngle) * boltLen

      lightningGfx
        .moveTo(0, 0)
        .lineTo(midX, midY)
        .lineTo(endX, endY)
        .stroke({ width: 1.6, color: 0xffffff, alpha: 0.95 })
        .moveTo(0, 0)
        .lineTo(midX, midY)
        .lineTo(endX, endY)
        .stroke({ width: 3.0, color: palette.redNum, alpha: 0.4 })
    }

    innerGfx.alpha = 0.1 + 0.3 * (0.5 + 0.5 * Math.sin(t * 2.0))
  })
}

// TRADEOFF WORKSHOP: Transmutation Forge / Golden Star Constellation
export function renderTradeoffForge(ctx: NodeEffectContext) {
  const { nodeContainer, innerGfx, animControllers } = ctx

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

  animControllers.push((t) => {
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

// BOSS LAIR: Expanding Crimson Shockwaves & Fiery Flare
export function renderBossShockwave(ctx: NodeEffectContext) {
  const { nodeContainer, innerGfx, animControllers } = ctx

  const shockwaveContainer = new Container()
  const wave1 = new Graphics()
  const wave2 = new Graphics()
  shockwaveContainer.addChild(wave1)
  shockwaveContainer.addChild(wave2)
  nodeContainer.addChild(shockwaveContainer)

  animControllers.push((t) => {
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

// NEWLY UNLOCKED REVEAL ANIMATION (Clouds parting left & right with glow)
export function renderUnlockRevealFx(ctx: NodeEffectContext) {
  const { node, nodeContainer, animControllers, newlyUnlockedNodeIds, unlockAnimStart } = ctx

  // NOTE: do NOT delete the flag here (see matching note on the bomb-detonation
  // animation). The scene render can be re-invoked mid-animation by unrelated
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

  let revealStartTime = unlockAnimStart.get(node.id)
  if (revealStartTime === undefined) {
    revealStartTime = performance.now() * 0.001
    unlockAnimStart.set(node.id, revealStartTime)
  }
  const revealDuration = 1.3 // 1.3s elegant reveal animation

  animControllers.push((t) => {
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
      newlyUnlockedNodeIds.delete(node.id)
      unlockAnimStart.delete(node.id)
    }
  })
}

// LOCKED (Fog of War) cloud puffs
export function renderFogOfWar(ctx: NodeEffectContext) {
  const { nodeContainer, animControllers } = ctx

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

  animControllers.push((t) => {
    puffGraphics.forEach(({ gfx, puff }) => {
      const driftX = Math.sin(t * puff.speed + puff.phase) * 6
      const driftY = Math.cos(t * puff.speed * 0.7 + puff.phase) * 4
      gfx.position.set(puff.x + driftX, puff.y + driftY)
      gfx.alpha = puff.baseAlpha + Math.sin(t * 1.5 + puff.phase) * 0.12
    })
  })
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
  } = ctx

  // Center Procedural Vector Insignia (Only for Unlocked Nodes or Boss)
  if (!isLocked || isBoss) {
    const insigniaGfx = new Graphics()
    drawVectorInsignia(insigniaGfx, node.type, styleInfo.highlight || styleInfo.stroke, isDefeatedEncounter, palette)
    insigniaGfx.position.set(0, 0)
    nodeContainer.addChild(insigniaGfx)
  }

  // Item Reward Beacon Badge (Docked cleanly at bottom edge without shifting main icon)
  // When Capital is cleared, Citadel Intelligence reveals all key item reward beacons across the map (even on locked nodes)
  if (capitalCleared && node.rewards && node.rewards.length > 0) {
    const isCollected = isCleared
    const badgeGfx = new Graphics()
    badgeGfx
      .roundRect(-13, 20, 26, 16, 8)
      .fill({ color: palette.mantleNum, alpha: 0.95 })
      .stroke({
        width: 1.5,
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
