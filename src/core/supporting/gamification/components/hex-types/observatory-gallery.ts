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
    gradient.addColorStop(0, palette.surface1)
    gradient.addColorStop(0.5, palette.surface0)
    gradient.addColorStop(1, palette.base)
    return gradient
  }

  gradient.addColorStop(0, palette.flamingo)
  gradient.addColorStop(0.45, palette.rosewater)
  gradient.addColorStop(1, palette.surface0)
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

export function drawObservatoryGalleryTerritory(
  g: Graphics,
  ctx: import('./types').HexTerritoryContext,
) {
  if (!g || g.destroyed) return
  const { x, y, radius, palette } = ctx

  const primaryColor = palette.rosewaterNum
  const accentColor = palette.flamingoNum
  const brassColor = palette.surface1Num
  const darkC = palette.crustNum

  // 1. 2.5D Astrolabe Platform Plinth & Drop Shadow
  g.ellipse(x, y + 5, radius, radius * 0.85)
    .fill({ color: darkC, alpha: 0.25 })
  g.ellipse(x, y, radius, radius * 0.88)
    .fill({ color: primaryColor, alpha: 0.055 })

  // 2. Concentric Astrolabe Coordinate Rings
  g.ellipse(x, y, radius * 0.85, radius * 0.74)
    .stroke({ width: 0.9, color: accentColor, alpha: 0.22 })
  g.ellipse(x, y, radius, radius * 0.88)
    .stroke({ width: 1.5, color: primaryColor, alpha: 0.35 })

  // 3. 12 Zodiac / Celestial Degree Ticks along the Perimeter
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI * 2) / 12
    const cosA = Math.cos(angle)
    const sinA = Math.sin(angle)
    const isMajor = i % 3 === 0
    const tickLen = isMajor ? 5 : 2.5

    g.moveTo(x + cosA * (radius - tickLen), y + sinA * ((radius - tickLen) * 0.88))
      .lineTo(x + cosA * (radius + tickLen), y + sinA * ((radius + tickLen) * 0.88))
      .stroke({ width: isMajor ? 1.4 : 0.8, color: primaryColor, alpha: isMajor ? 0.6 : 0.3 })
  }

  // 4. 4 Upright 2.5D Brass Celestial Gnomon Pillars & Armillary Orbs
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2
    const gx = x + Math.cos(angle) * radius
    const gy = y + Math.sin(angle) * (radius * 0.88)

    // Base contact shadow
    g.ellipse(gx, gy + 2, 5, 2.2).fill({ color: darkC, alpha: 0.55 })

    // Upright 2.5D Brass Pillar (elevated in negative Y) with bold border
    g.poly([
      gx - 2.5, gy,
      gx - 1.8, gy - 11,
      gx + 1.8, gy - 11,
      gx + 2.5, gy,
    ]).fill({ color: brassColor }).stroke({ width: 1.1, color: palette.textNum })

    // 2.5D Armillary Celestial Globe Sphere at apex (gy - 14) with bold border
    const tipY = gy - 14
    g.circle(gx, tipY, 2.8).fill({ color: accentColor, alpha: 0.9 }).stroke({ width: 0.9, color: palette.textNum })
    g.circle(gx - 0.8, tipY - 0.8, 1.0).fill({ color: 0xffffff, alpha: 0.95 })

    // Tilted 3D celestial orbital ring around globe
    g.ellipse(gx, tipY, 4.5, 1.8).stroke({ width: 0.9, color: primaryColor, alpha: 0.85 })
  }
}

export const observatoryGalleryHex: HexTypeDefinition = {
  type: 'observatory_gallery',
  title: 'Observatory Gallery',
  drawTerrainGround: drawObservatoryGalleryTerrainGround,
  drawInsignia: drawObservatoryGalleryInsignia,
  drawTerritory: drawObservatoryGalleryTerritory,
  createGradient: createObservatoryGalleryGradient,
  renderEffects: renderObservatoryGalleryEffects,
  getGlowColor: (palette) => palette.rosewaterNum,
}
