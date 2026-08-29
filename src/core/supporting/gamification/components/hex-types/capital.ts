import { Graphics, FillGradient, Container } from 'pixi.js'
import { HEX_RADIUS } from '../hex-geometry'
import { GamificationThemePalette, getGamificationThemePalette } from '../../theme-palette'
import { HexInsigniaOptions, HexTypeDefinition, HexTypeEffectContext } from './types'

export function drawCapitalTerrainGround(
  g: Graphics,
  options: HexInsigniaOptions = {},
) {
  if (!g || g.destroyed) return
  g.clear()

  const { palette = getGamificationThemePalette(), isLocked = false } = options
  const alphaMod = isLocked ? 0.4 : 0.85

  // 1. Cobblestone plaza paving rings across the full hex
  g.circle(0, 0, HEX_RADIUS * 0.88)
    .stroke({ width: 1, color: palette.surface1Num, alpha: 0.35 * alphaMod })
  g.circle(0, 0, HEX_RADIUS * 0.58)
    .stroke({ width: 0.9, color: palette.surface2Num, alpha: 0.45 * alphaMod })

  // 2. Radial courtyard paving segments connecting center to hex perimeter
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3
    const x1 = Math.cos(angle) * (HEX_RADIUS * 0.35)
    const y1 = Math.sin(angle) * (HEX_RADIUS * 0.35)
    const x2 = Math.cos(angle) * (HEX_RADIUS * 0.88)
    const y2 = Math.sin(angle) * (HEX_RADIUS * 0.88)
    g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: 0.8, color: palette.surface0Num, alpha: 0.4 * alphaMod })
  }

  // 3. Citadel foundation masonry platform
  g.roundRect(-16, 4, 32, 12, 2)
    .fill({ color: palette.surface0Num, alpha: 0.35 * alphaMod })
    .stroke({ width: 0.8, color: palette.surface1Num, alpha: 0.5 * alphaMod })
}

export function drawCapitalInsignia(
  g: Graphics,
  options: HexInsigniaOptions = {},
) {
  if (!g || g.destroyed) return
  g.clear()

  const {
    color,
    isDefeated = false,
    palette = getGamificationThemePalette(),
    time = 0,
  } = options

  const c = isDefeated ? palette.overlay2Num : (color ?? palette.sapphireNum)
  const darkC = palette.crustNum
  const stoneColor = palette.overlay0Num
  const trimColor = palette.yellowNum

  // 1. Ground contact shadow
  g.ellipse(0, 10, 13, 3.5).fill({ color: darkC, alpha: 0.55 })

  // 2. Main Keep Citadel Base (Layered stone masonry)
  g.roundRect(-11, -2, 22, 12, 1.5)
    .fill({ color: stoneColor, alpha: 0.98 })
    .stroke({ width: 1.4, color: palette.textNum })

  // Masonry wall horizontal course lines
  g.moveTo(-10, 2).lineTo(10, 2).stroke({ width: 1, color: palette.surface0Num })
  g.moveTo(-10, 6).lineTo(10, 6).stroke({ width: 1, color: palette.surface0Num })

  // 3. Flanking Battlement Towers
  // Left Tower
  g.rect(-12, -9, 6, 8).fill({ color: stoneColor }).stroke({ width: 1.2, color: palette.textNum })
  g.poly([-13, -9, -9, -15, -5, -9]).fill({ color: c }).stroke({ width: 1, color: palette.textNum })
  // Right Tower
  g.rect(6, -9, 6, 8).fill({ color: stoneColor }).stroke({ width: 1.2, color: palette.textNum })
  g.poly([5, -9, 9, -15, 13, -9]).fill({ color: c }).stroke({ width: 1, color: palette.textNum })

  // 4. Central Grand Tower Keep
  g.rect(-6, -13, 12, 12).fill({ color: stoneColor }).stroke({ width: 1.3, color: palette.textNum })
  g.poly([-7, -13, 0, -21, 7, -13]).fill({ color: c }).stroke({ width: 1.2, color: palette.textNum })

  // Golden Spire Pinnacle Ornaments
  g.circle(0, -21.5, 1.2).fill({ color: trimColor })
  g.circle(-9, -15.5, 1).fill({ color: trimColor })
  g.circle(9, -15.5, 1).fill({ color: trimColor })

  // 5. Arched Grand Portcullis Gate
  g.roundRect(-4, 3, 8, 7, 3)
    .fill({ color: darkC })
    .stroke({ width: 1.1, color: palette.textNum })
  // Portcullis Iron Grate & Gold Studs
  g.moveTo(-4, 6).lineTo(4, 6).stroke({ width: 0.8, color: trimColor })
  g.moveTo(0, 3).lineTo(0, 10).stroke({ width: 0.8, color: trimColor })
  g.circle(-1.5, 7.5, 0.6).fill({ color: trimColor })
  g.circle(1.5, 7.5, 0.6).fill({ color: trimColor })

  // 6. Fluttering Swallowtail Banner (Using warrior cloak wave math: Math.sin(t * 3.5))
  const flagWave = Math.sin(time * 3.5) * 3.5
  g.moveTo(0, -21.5).lineTo(0, -28).stroke({ width: 1.1, color: palette.textNum })
  g.poly([
    0, -28,
    7, -27 + flagWave * 0.4,
    11, -26 + flagWave,
    7, -24 + flagWave * 0.5,
    11, -22 + flagWave * 0.8,
    0, -23,
  ]).fill({ color: palette.sapphireNum }).stroke({ width: 0.9, color: trimColor })
}

export function createCapitalGradient(
  isLocked: boolean,
  _isCleared: boolean,
  palette: GamificationThemePalette,
): FillGradient {
  const gradient = new FillGradient({
    start: { x: 0, y: -HEX_RADIUS },
    end: { x: 0, y: HEX_RADIUS },
  })

  if (isLocked) {
    gradient.addColorStop(0, palette.surface0)
    gradient.addColorStop(0.5, palette.base)
    gradient.addColorStop(1, palette.crust)
    return gradient
  }

  gradient.addColorStop(0, palette.sapphire)
  gradient.addColorStop(0.45, palette.blue)
  gradient.addColorStop(1, palette.crust)
  return gradient
}

export function renderCapitalEffects(ctx: HexTypeEffectContext) {
  const { nodeContainer, palette, animControllers, isLocked } = ctx
  if (isLocked) return

  const orbitContainer = new Container()
  orbitContainer.label = 'CapitalOrbit'
  const orbitGfx = new Graphics()
  orbitContainer.addChild(orbitGfx)
  nodeContainer.addChild(orbitContainer)

  const beaconGfx = new Graphics()
  orbitContainer.addChild(beaconGfx)

  animControllers.push((t) => {
    orbitGfx.clear()
    beaconGfx.clear()

    // 1. Subtle upward celestial light beacon
    const beaconPulse = (Math.sin(t * 2) + 1) * 0.5
    beaconGfx.poly([
      -8, 10,
      8, 10,
      14, -HEX_RADIUS - 12,
      -14, -HEX_RADIUS - 12,
    ]).fill({ color: palette.sapphireNum, alpha: 0.08 + beaconPulse * 0.06 })

    // 2. 6 orbiting sanctuary wisdom motes
    const r = HEX_RADIUS + 5
    for (let i = 0; i < 6; i++) {
      const angle = t * 0.75 + (i * Math.PI) / 3
      const ox = Math.cos(angle) * r
      const oy = Math.sin(angle) * (r * 0.65) // Perspective compression
      const moteAlpha = 0.5 + Math.sin(t * 3 + i) * 0.35

      orbitGfx.circle(ox, oy, 1.8).fill({ color: palette.sapphireNum, alpha: moteAlpha })
      orbitGfx.circle(ox, oy, 0.8).fill({ color: palette.textNum, alpha: moteAlpha + 0.2 })
    }
  })
}

export const capitalHex: HexTypeDefinition = {
  type: 'capital',
  title: 'Citadel of Knowledge',
  drawTerrainGround: drawCapitalTerrainGround,
  drawInsignia: drawCapitalInsignia,
  createGradient: createCapitalGradient,
  renderEffects: renderCapitalEffects,
  getGlowColor: (palette) => palette.mauveNum,
}
