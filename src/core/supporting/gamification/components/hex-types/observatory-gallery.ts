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
  const brassColor = palette.surface1Num
  const darkC = palette.crustNum

  // 1. 2.5D Polished Astrolabe Platform & Single Perimeter Border
  g.ellipse(x, y + 5, radius, radius * 0.85)
    .fill({ color: darkC, alpha: 0.25 })
  g.ellipse(x, y, radius, radius * 0.88)
    .fill({ color: primaryColor, alpha: 0.055 })
    .stroke({ width: 1.5, color: primaryColor, alpha: 0.35 })

  // 2. Interior Observation Yard: telescopes, star pedestals & celestial instruments
  const slots: { y: number; draw: () => void }[] = []
  const at = (a: number, d: number) => ({ bx: x + Math.cos(a) * d, by: y + Math.sin(a) * (d * 0.88) })

  // 1. Refractor Brass Telescope on Tripod with Altitude Adjuster
  const telescope = (bx: number, by: number, tilt: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1, 4.5 * sc, 2 * sc).fill({ color: darkC, alpha: 0.45 })
        // Brass mount collar
        g.circle(bx, by - 6 * sc, 1.4 * sc).fill({ color: brassColor }).stroke({ width: 0.6, color: palette.textNum })
        // Sturdy wooden tripod legs with brass tips
        g.moveTo(bx, by - 6 * sc).lineTo(bx - 3.6 * sc, by).stroke({ width: 1.1, color: palette.surface1Num })
        g.moveTo(bx, by - 6 * sc).lineTo(bx + 3.6 * sc, by).stroke({ width: 1.1, color: palette.surface1Num })
        g.moveTo(bx, by - 6 * sc).lineTo(bx, by + 0.5 * sc).stroke({ width: 1.1, color: palette.surface2Num })
        // Altitude wheel
        g.circle(bx + 1 * sc, by - 6 * sc, 0.8 * sc).fill({ color: palette.yellowNum })

        // Multi-segmented brass refractor barrel
        const L = 6 * sc
        const W = 1.4 * sc
        const cosT = Math.cos(tilt)
        const sinT = Math.sin(tilt)

        // Rear eyepiece tube
        g.poly([
          bx - L * 0.4 * cosT - W * 0.6 * sinT, by - 6 * sc + L * 0.4 * sinT - W * 0.6 * cosT,
          bx - L * 0.4 * cosT + W * 0.6 * sinT, by - 6 * sc + L * 0.4 * sinT + W * 0.6 * cosT,
          bx - W * 0.6 * sinT, by - 6 * sc + W * 0.6 * cosT,
          bx + W * 0.6 * sinT, by - 6 * sc - W * 0.6 * cosT,
        ]).fill({ color: darkC }).stroke({ width: 0.6, color: palette.textNum })

        // Main polished brass barrel
        g.poly([
          bx - W * sinT, by - 6 * sc + W * cosT,
          bx + L * cosT - W * 1.2 * sinT, by - 6 * sc - L * sinT + W * 1.2 * cosT,
          bx + L * cosT + W * 1.2 * sinT, by - 6 * sc - L * sinT - W * 1.2 * cosT,
          bx + W * sinT, by - 6 * sc - W * cosT,
        ]).fill({ color: brassColor }).stroke({ width: 0.8, color: palette.textNum })

        // Objective lens hood and reflex
        g.ellipse(bx + L * cosT, by - 6 * sc - L * sinT, W * 1.3, W * 0.8)
          .fill({ color: primaryColor }).stroke({ width: 0.7, color: palette.yellowNum })
        g.circle(bx + (L - 0.5) * cosT, by - 6 * sc - (L - 0.5) * sinT, 0.7 * sc).fill({ color: 0xffffff, alpha: 0.95 })
      },
    })
  }

  // 2. Celestial Orrery with Nested Orbital Rings and Gemstone Planets
  const celestialOrrery = (bx: number, by: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1, 4.4 * sc, 1.8 * sc).fill({ color: darkC, alpha: 0.4 })
        // Tiered brass pedestal
        g.roundRect(bx - 2.5 * sc, by - 1.2 * sc, 5 * sc, 1.4 * sc, 0.4).fill({ color: brassColor }).stroke({ width: 0.6, color: palette.textNum })
        g.rect(bx - 0.7 * sc, by - 7 * sc, 1.4 * sc, 6 * sc).fill({ color: brassColor }).stroke({ width: 0.6, color: palette.textNum })
        // Central Golden Sun
        g.circle(bx, by - 9 * sc, 1.8 * sc).fill({ color: palette.yellowNum }).stroke({ width: 0.7, color: palette.textNum })
        // Outer orbital ring tilted 2.5D
        g.ellipse(bx, by - 9 * sc, 5.2 * sc, 2.2 * sc).stroke({ width: 0.7, color: brassColor, alpha: 0.9 })
        // Inner orbital ring
        g.ellipse(bx, by - 9 * sc, 3.4 * sc, 1.4 * sc).stroke({ width: 0.6, color: brassColor, alpha: 0.8 })
        // Orbiting planet beads
        g.circle(bx - 4.4 * sc, by - 9.6 * sc, 0.9 * sc).fill({ color: palette.sapphireNum })
        g.circle(bx + 2.8 * sc, by - 8 * sc, 0.7 * sc).fill({ color: palette.tealNum })
      },
    })
  }

  // 3. Armillary Celestial Star Globe on Marble Pillar
  const starGlobe = (bx: number, by: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1, 3.8 * sc, 1.6 * sc).fill({ color: darkC, alpha: 0.4 })
        // Fluted marble pillar
        g.rect(bx - 1.4 * sc, by - 6 * sc, 2.8 * sc, 6 * sc).fill({ color: palette.surface1Num }).stroke({ width: 0.7, color: palette.textNum })
        g.roundRect(bx - 2.2 * sc, by - 7 * sc, 4.4 * sc, 1.2 * sc, 0.3).fill({ color: brassColor })
        // Deep Indigo Globe
        g.circle(bx, by - 10.5 * sc, 3.2 * sc).fill({ color: palette.surface0Num }).stroke({ width: 0.8, color: palette.textNum })
        // Gilded meridian gimbal arc
        g.ellipse(bx, by - 10.5 * sc, 3.8 * sc, 1.6 * sc).stroke({ width: 0.7, color: palette.yellowNum })
        // Constellation star specks
        g.circle(bx - 1 * sc, by - 11.5 * sc, 0.6 * sc).fill({ color: 0xffffff, alpha: 0.95 })
        g.circle(bx + 1.2 * sc, by - 10 * sc, 0.5 * sc).fill({ color: 0xffffff, alpha: 0.95 })
        g.circle(bx - 0.2 * sc, by - 9.2 * sc, 0.5 * sc).fill({ color: palette.yellowNum, alpha: 0.9 })
      },
    })
  }

  // 4. Cartography Drafting Table with Rolled Constellation Chart
  const draftingTable = (bx: number, by: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1, 4.6 * sc, 2 * sc).fill({ color: darkC, alpha: 0.4 })
        // Table legs
        g.rect(bx - 3.4 * sc, by - 4 * sc, 1 * sc, 4 * sc).fill({ color: palette.surface1Num }).stroke({ width: 0.5, color: palette.textNum })
        g.rect(bx + 2.4 * sc, by - 4 * sc, 1 * sc, 4 * sc).fill({ color: palette.surface1Num }).stroke({ width: 0.5, color: palette.textNum })
        // Tilted drafting top
        g.poly([
          bx - 4.4 * sc, by - 4.2 * sc,
          bx + 4.4 * sc, by - 6 * sc,
          bx + 4.4 * sc, by - 8.2 * sc,
          bx - 4.4 * sc, by - 6.4 * sc,
        ]).fill({ color: palette.surface2Num }).stroke({ width: 0.8, color: palette.textNum })
        // Rolled star chart blueprint
        g.poly([
          bx - 3.4 * sc, by - 5.5 * sc,
          bx + 3.4 * sc, by - 6.8 * sc,
          bx + 3.4 * sc, by - 8 * sc,
          bx - 3.4 * sc, by - 6.7 * sc,
        ]).fill({ color: primaryColor, alpha: 0.9 })
        // Brass weights on chart
        g.circle(bx - 2.8 * sc, by - 5.8 * sc, 0.6 * sc).fill({ color: palette.yellowNum })
        g.circle(bx + 2.8 * sc, by - 7.5 * sc, 0.6 * sc).fill({ color: palette.yellowNum })
      },
    })
  }

  // ─── STATIC NATURAL CELESTIAL OBSERVATION VIGNETTES ───
  // Vignette 1: North-West Celestial Observation Post
  {
    const pScope = at(-2.15, radius * 0.78)
    telescope(pScope.bx, pScope.by, Math.PI / 3.5, 1.05)

    const pDesk = at(-2.45, radius * 0.74)
    draftingTable(pDesk.bx, pDesk.by, 1.0)

    const pGlobe = at(-1.8, radius * 0.85)
    starGlobe(pGlobe.bx, pGlobe.by, 1.0)
  }

  // Vignette 2: East Grand Orrery Chamber
  {
    const pOrrery = at(0.1, radius * 0.82)
    celestialOrrery(pOrrery.bx, pOrrery.by, 1.1)

    const pGlobe = at(-0.15, radius * 0.75)
    starGlobe(pGlobe.bx, pGlobe.by, 0.95)

    const pScope = at(0.38, radius * 0.84)
    telescope(pScope.bx, pScope.by, Math.PI / 4, 0.95)
  }

  // Vignette 3: South-West Stargazer's Drafting Station
  {
    const pScope = at(2.15, radius * 0.78)
    telescope(pScope.bx, pScope.by, Math.PI / 3.2, 1.0)

    const pDesk = at(1.85, radius * 0.74)
    draftingTable(pDesk.bx, pDesk.by, 0.95)

    const pOrrery = at(2.45, radius * 0.84)
    celestialOrrery(pOrrery.bx, pOrrery.by, 1.0)
  }

  slots.sort((s1, s2) => s1.y - s2.y)
  for (const s of slots) s.draw()
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
