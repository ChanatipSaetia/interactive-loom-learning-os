import { Graphics, Container, FillGradient } from 'pixi.js'
import { HEX_RADIUS } from '../hex-geometry'
import { GamificationThemePalette, getGamificationThemePalette } from '../../theme-palette'
import { HexInsigniaOptions, HexTypeDefinition, HexTypeEffectContext } from './types'

export function drawObservatoryGalleryTerrainGround(
  g: Graphics,
  options: HexInsigniaOptions = {},
) {
  if (!g || g.destroyed) return
  g.clear()

  const { palette = getGamificationThemePalette(), isLocked = false } = options
  const alphaMod = isLocked ? 0.35 : 0.85

  // 1. Astrolabe Celestial Ground Rosette
  g.circle(0, 0, HEX_RADIUS * 0.72)
    .stroke({ width: 0.9, color: palette.rosewaterNum, alpha: 0.3 * alphaMod })
  g.circle(0, 0, HEX_RADIUS * 0.45)
    .stroke({ width: 0.8, color: palette.flamingoNum, alpha: 0.25 * alphaMod })

  // 2. Cardinal Compass Points
  const cardinalPts = [
    { x: 0, y: -HEX_RADIUS * 0.72 },
    { x: HEX_RADIUS * 0.72, y: 0 },
    { x: 0, y: HEX_RADIUS * 0.72 },
    { x: -HEX_RADIUS * 0.72, y: 0 },
  ]
  for (const pt of cardinalPts) {
    g.circle(pt.x, pt.y, 1.5).fill({ color: palette.rosewaterNum, alpha: 0.6 * alphaMod })
  }
}

export function drawObservatoryGalleryInsignia(
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

  const c = isDefeated ? palette.overlay2Num : (color ?? palette.rosewaterNum)
  const mountBaseColor = palette.surface1Num
  const trimColor = palette.surface2Num
  const darkC = palette.crustNum

  // 1. Heavy Astrolabe Stand / Tripod Base
  g.ellipse(0, 11, 15, 4.5).fill({ color: darkC, alpha: 0.55 })
  g.ellipse(0, 10, 13, 3.8).fill({ color: mountBaseColor }).stroke({ width: 1.1, color: trimColor })

  // Tripod Legs
  g.moveTo(0, 8).lineTo(-9, 10).stroke({ width: 1.2, color: palette.textNum })
  g.moveTo(0, 8).lineTo(9, 10).stroke({ width: 1.2, color: palette.textNum })
  g.moveTo(0, 8).lineTo(0, 11).stroke({ width: 1.2, color: palette.textNum })

  // 2. Angled Celestial Telescope Barrel
  const tilt = -Math.PI / 5 + Math.sin(time * 1.5) * 0.05
  const barrelLen = 22
  const bx1 = Math.cos(tilt) * (-barrelLen * 0.4)
  const by1 = Math.sin(tilt) * (-barrelLen * 0.4) - 3
  const bx2 = Math.cos(tilt) * (barrelLen * 0.6)
  const by2 = Math.sin(tilt) * (barrelLen * 0.6) - 3

  g.moveTo(bx1, by1).lineTo(bx2, by2).stroke({ width: 3.5, color: palette.surface0Num })
  g.moveTo(bx1, by1).lineTo(bx2, by2).stroke({ width: 2.0, color: c })

  // Telescope Lens Flange
  g.circle(bx2, by2, 3.5).fill({ color: palette.flamingoNum }).stroke({ width: 0.9, color: 0xffffff })

  // Eyepiece
  g.circle(bx1, by1, 2.0).fill({ color: palette.surface2Num }).stroke({ width: 0.8, color: palette.textNum })

  // 3. Prismatic Light Shimmer Mote
  const lensPulse = Math.sin(time * 3.5) * 0.2
  g.circle(bx2, by2, 2.0 + lensPulse).fill({ color: palette.rosewaterNum })
}

export function createObservatoryGalleryGradient(
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

  gradient.addColorStop(0, palette.flamingo)
  gradient.addColorStop(0.45, palette.rosewater)
  gradient.addColorStop(1, palette.crust)
  return gradient
}

export function renderObservatoryGalleryEffects(ctx: HexTypeEffectContext) {
  const { nodeContainer, palette, animControllers } = ctx

  const obsFx = new Container()
  const beamGfx = new Graphics()
  obsFx.addChild(beamGfx)
  nodeContainer.addChild(obsFx)

  animControllers.push((t) => {
    beamGfx.clear()
    const tilt = -Math.PI / 5 + Math.sin(t * 1.5) * 0.05
    const startX = Math.cos(tilt) * 13
    const startY = Math.sin(tilt) * 13 - 3
    const beamLen = 20
    const endX = startX + Math.cos(tilt) * beamLen
    const endY = startY + Math.sin(tilt) * beamLen

    beamGfx.moveTo(startX, startY).lineTo(endX, endY).stroke({
      width: 1.5,
      color: palette.rosewaterNum,
      alpha: 0.4 + Math.sin(t * 2.5) * 0.25,
    })
  })
}

export const observatoryGalleryHex: HexTypeDefinition = {
  type: 'observatory_gallery',
  title: 'Observatory Gallery',
  drawTerrainGround: drawObservatoryGalleryTerrainGround,
  drawInsignia: drawObservatoryGalleryInsignia,
  createGradient: createObservatoryGalleryGradient,
  renderEffects: renderObservatoryGalleryEffects,
  getGlowColor: (palette) => palette.rosewaterNum,
}
