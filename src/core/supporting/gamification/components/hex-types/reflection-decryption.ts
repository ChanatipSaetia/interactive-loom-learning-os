import { Graphics, FillGradient, Container } from 'pixi.js'
import { HEX_RADIUS } from '../hex-geometry'
import { GamificationThemePalette, getGamificationThemePalette } from '../../theme-palette'
import { HexInsigniaOptions, HexTypeDefinition, HexTypeEffectContext } from './types'

export function drawReflectionDecryptionTerrainGround(
  g: Graphics,
  options: HexInsigniaOptions = {},
) {
  if (!g || g.destroyed) return
  g.clear()

  const { palette = getGamificationThemePalette(), isLocked = false, isDefeated = false } = options
  const alphaMod = isLocked ? 0.35 : 0.85

  // 1. Scorched Blast Ground Crater
  g.circle(0, 0, HEX_RADIUS * 0.78)
    .fill({ color: palette.crustNum, alpha: 0.55 * alphaMod })
    .stroke({ width: 1.0, color: isDefeated ? palette.surface2Num : palette.maroonNum, alpha: 0.4 * alphaMod })

  // 2. Volatile Lightning & Heat Fissures branching outwards
  const fissureAngles = [
    -Math.PI / 3,
    -Math.PI * 0.7,
    0,
    Math.PI * 0.35,
    Math.PI * 0.75,
    -Math.PI * 0.15,
  ]
  const fissureColor = isDefeated ? palette.overlay0Num : palette.redNum
  const arcColor = isDefeated ? palette.surface2Num : palette.peachNum

  for (const angle of fissureAngles) {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const r1 = HEX_RADIUS * 0.22
    const r2 = HEX_RADIUS * 0.5
    const r3 = HEX_RADIUS * 0.82

    const midX = cos * r2 + (sin * 4)
    const midY = sin * r2 - (cos * 4)

    g.moveTo(cos * r1, sin * r1)
      .lineTo(midX, midY)
      .lineTo(cos * r3, sin * r3)
      .stroke({ width: 1.2, color: fissureColor, alpha: 0.7 * alphaMod })

    g.moveTo(cos * r1, sin * r1)
      .lineTo(midX, midY)
      .stroke({ width: 0.6, color: arcColor, alpha: 0.9 * alphaMod })
  }

  // 3. Perimeter Warning Node Emitters
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3
    const px = Math.cos(angle) * (HEX_RADIUS * 0.72)
    const py = Math.sin(angle) * (HEX_RADIUS * 0.72)
    g.circle(px, py, 1.8).fill({ color: isDefeated ? palette.surface1Num : palette.redNum, alpha: 0.8 * alphaMod })
  }
}

export function drawReflectionDecryptionInsignia(
  g: Graphics,
  options: HexInsigniaOptions = {},
) {
  if (!g || g.destroyed) return
  g.clear()

  const {
    isDefeated = false,
    palette = getGamificationThemePalette(),
    time = 0,
  } = options

  const pylonBody = isDefeated ? palette.surface0Num : palette.surface1Num
  const pylonTrim = isDefeated ? palette.overlay0Num : palette.surface2Num
  const coreHue1 = isDefeated ? palette.surface2Num : palette.mauveNum
  const coreHue2 = isDefeated ? palette.overlay1Num : palette.redNum
  const heatColor = isDefeated ? palette.surface1Num : palette.peachNum
  const sparkColor = isDefeated ? palette.overlay0Num : 0xffffff
  const glowAlpha = isDefeated ? 0.25 : 0.9

  // Tremble / Jitter effect when critical (active)
  const jitterX = isDefeated ? 0 : (Math.sin(time * 28) * 0.4)
  const jitterY = isDefeated ? 0 : (Math.cos(time * 32) * 0.4)

  // 1. Heavy Containment Base Chassis
  g.ellipse(0, 12, 15, 5).fill({ color: palette.crustNum, alpha: 0.7 })
  g.poly([
    -13, 11,
    -9, 14,
    9, 14,
    13, 11,
    8, 8,
    -8, 8,
  ]).fill({ color: pylonBody }).stroke({ width: 1.2, color: pylonTrim })

  // 2. Reinforced Magnetic Containment Pylons (Bracing the Core)
  // Left Pylon
  g.poly([
    -12, 11,
    -15, 0,
    -11, -12,
    -7, -10,
    -10, 0,
    -8, 10,
  ]).fill({ color: pylonBody }).stroke({ width: 1.1, color: isDefeated ? pylonTrim : palette.redNum })

  // Left Pylon Emitter Tip
  g.circle(-9, -11, 2.2).fill({ color: isDefeated ? pylonTrim : palette.peachNum })

  // Right Pylon
  g.poly([
    12, 11,
    15, 0,
    11, -12,
    7, -10,
    10, 0,
    8, 10,
  ]).fill({ color: pylonBody }).stroke({ width: 1.1, color: isDefeated ? pylonTrim : palette.redNum })

  // Right Pylon Emitter Tip
  g.circle(9, -11, 2.2).fill({ color: isDefeated ? pylonTrim : palette.peachNum })

  // Rear Base Pylon Spike
  g.poly([
    -3, 9,
    0, -16,
    3, 9,
  ]).fill({ color: palette.surface0Num }).stroke({ width: 0.9, color: pylonTrim })

  // 3. Supercritical Plasma Sphere / Meltdown Reactor Core
  const coreY = -2 + jitterY
  const coreX = 0 + jitterX
  const criticalPulse = isDefeated ? 0 : (Math.sin(time * 8.0) * 1.2 + Math.sin(time * 16.0) * 0.6)

  // Outermost Overcharged Plasma Heat Shield
  g.circle(coreX, coreY, 9.5 + criticalPulse)
    .fill({ color: coreHue2, alpha: 0.22 * glowAlpha })
  g.circle(coreX, coreY, 7.5 + criticalPulse * 0.7)
    .fill({ color: coreHue1, alpha: 0.45 * glowAlpha })

  // High-Density Core Sphere
  g.circle(coreX, coreY, 5.5 + criticalPulse * 0.4)
    .fill({ color: heatColor, alpha: glowAlpha })
    .stroke({ width: 1.1, color: coreHue2 })

  // White-Hot Singular Meltdown Center
  g.circle(coreX, coreY, 2.8 + criticalPulse * 0.2)
    .fill({ color: sparkColor, alpha: glowAlpha })

  // 4. Volatile Electric Lightning Arcs discharging to Containment Pylons
  if (!isDefeated) {
    const arcPhase = Math.floor(time * 14) % 4
    if (arcPhase === 0 || arcPhase === 1) {
      // Left arc
      g.moveTo(coreX, coreY)
        .lineTo(coreX - 4, coreY - 4)
        .lineTo(coreX - 6, coreY - 1)
        .lineTo(-9, -11)
        .stroke({ width: 1.1, color: sparkColor, alpha: 0.95 })
    }
    if (arcPhase === 1 || arcPhase === 2) {
      // Right arc
      g.moveTo(coreX, coreY)
        .lineTo(coreX + 4, coreY - 3)
        .lineTo(coreX + 7, coreY - 6)
        .lineTo(9, -11)
        .stroke({ width: 1.1, color: sparkColor, alpha: 0.95 })
    }
    if (arcPhase === 3) {
      // Downward ground blast arc
      g.moveTo(coreX, coreY)
        .lineTo(coreX + 2, coreY + 5)
        .lineTo(0, 10)
        .stroke({ width: 1.0, color: palette.peachNum, alpha: 0.9 })
    }
  }
}

export function createReflectionDecryptionGradient(
  isLocked: boolean,
  isCleared: boolean,
  palette: GamificationThemePalette,
): FillGradient {
  const gradient = new FillGradient({
    start: { x: 0, y: -HEX_RADIUS },
    end: { x: 0, y: HEX_RADIUS },
  })

  if (isCleared) {
    gradient.addColorStop(0, palette.surface1)
    gradient.addColorStop(0.5, palette.surface0)
    gradient.addColorStop(1, palette.base)
    return gradient
  }

  if (isLocked) {
    gradient.addColorStop(0, palette.surface1)
    gradient.addColorStop(0.5, palette.surface0)
    gradient.addColorStop(1, palette.base)
    return gradient
  }

  gradient.addColorStop(0, palette.red)
  gradient.addColorStop(0.45, palette.mauve)
  gradient.addColorStop(1, palette.surface0)
  return gradient
}

export function renderReflectionDecryptionEffects(ctx: HexTypeEffectContext) {
  const { nodeContainer, palette, animControllers, isLocked, isCleared } = ctx
  if (isLocked || isCleared) return

  const reactorFx = new Container()
  reactorFx.label = 'MeltdownReactorFx'
  const shockGfx = new Graphics()
  reactorFx.addChild(shockGfx)
  nodeContainer.addChild(reactorFx)

  animControllers.push((t) => {
    shockGfx.clear()

    // Rapid harmonic shockwaves emitting from core
    const wave1 = (t * 1.8) % 1
    const r1 = 6 + wave1 * 18
    const a1 = (1 - wave1) * 0.8
    shockGfx.circle(0, -2, r1).stroke({ width: 1.4, color: palette.redNum, alpha: a1 })

    const wave2 = (t * 1.8 + 0.5) % 1
    const r2 = 6 + wave2 * 18
    const a2 = (1 - wave2) * 0.7
    shockGfx.circle(0, -2, r2).stroke({ width: 1.2, color: palette.peachNum, alpha: a2 })

    // Orbiting volatile spark particles
    for (let i = 0; i < 4; i++) {
      const angle = t * 6 + (i * Math.PI) / 2
      const dist = 12 + Math.sin(t * 10 + i) * 3
      const sx = Math.cos(angle) * dist
      const sy = -2 + Math.sin(angle) * (dist * 0.6)
      shockGfx.circle(sx, sy, 1.4).fill({ color: palette.peachNum, alpha: 0.9 })
    }
  })
}

export const reflectionDecryptionHex: HexTypeDefinition = {
  type: 'reflection_decryption',
  title: 'Arcane Reactor',
  drawTerrainGround: drawReflectionDecryptionTerrainGround,
  drawInsignia: drawReflectionDecryptionInsignia,
  createGradient: createReflectionDecryptionGradient,
  renderEffects: renderReflectionDecryptionEffects,
  getGlowColor: (palette) => palette.mauveNum,
}

