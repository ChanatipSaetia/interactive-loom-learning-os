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
    gradient.addColorStop(0, palette.surface1)
    gradient.addColorStop(0.5, palette.surface0)
    gradient.addColorStop(1, palette.base)
    return gradient
  }

  gradient.addColorStop(0, palette.sapphire)
  gradient.addColorStop(0.45, palette.blue)
  gradient.addColorStop(1, palette.surface0)
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

export function drawCapitalTerritory(
  g: Graphics,
  ctx: import('./types').HexTerritoryContext,
) {
  if (!g || g.destroyed) return
  const { x, y, radius, palette, isCleared = false } = ctx

  const primaryColor = isCleared ? palette.sapphireNum : palette.mauveNum
  const trimColor = palette.yellowNum
  const stoneColor = palette.surface1Num
  const stoneDark = palette.surface2Num
  const darkC = palette.crustNum
  const outlineColor = palette.textNum

  // 1. Circular Ground Plinth & Drop Shadow
  g.circle(x, y + 4, radius)
    .fill({ color: darkC, alpha: 0.25 })
  g.circle(x, y, radius)
    .fill({ color: primaryColor, alpha: 0.065 })

  // 2. Concentric Fortification Rampart Rings
  g.circle(x, y, radius * 0.86)
    .stroke({ width: 1.0, color: primaryColor, alpha: 0.18 })
  g.circle(x, y, radius)
    .stroke({ width: 1.6, color: primaryColor, alpha: 0.38 })

  // 3. 2.5D Fortress Watchtowers stationed at 4 cardinal perimeter points
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2
    const tx = x + Math.cos(angle) * radius
    const ty = y + Math.sin(angle) * (radius * 0.88)

    // Tower ground contact shadow
    g.ellipse(tx, ty + 2, 6, 2.5).fill({ color: darkC, alpha: 0.55 })

    // Upright 2.5D Masonry Tower Body (elevated in negative Y) with bold outline
    g.roundRect(tx - 4.5, ty - 12, 9, 12, 1.5)
      .fill({ color: stoneColor })
      .stroke({ width: 1.2, color: outlineColor })

    // Vertical stone corner shading line
    g.moveTo(tx, ty - 12).lineTo(tx, ty).stroke({ width: 0.8, color: stoneDark })

    // Glowing Portcullis / Arrow Slit
    g.rect(tx - 1, ty - 7, 2, 3.5).fill({ color: trimColor, alpha: 0.9 })

    // Conical Roof Spire with bold outline
    g.poly([
      tx - 5.5, ty - 12,
      tx, ty - 19,
      tx + 5.5, ty - 12,
    ]).fill({ color: primaryColor }).stroke({ width: 1.1, color: outlineColor })

    // Golden Pinnacle Finial
    g.circle(tx, ty - 19.5, 1.3).fill({ color: trimColor })
  }

  // 4. 2.5D Wall Battlement Crenellations stationed at diagonal points
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4
    const bx = x + Math.cos(angle) * radius
    const by = y + Math.sin(angle) * (radius * 0.88)

    // Wall contact shadow
    g.ellipse(bx, by + 1.5, 5, 2).fill({ color: darkC, alpha: 0.4 })

    // Crenellated stone parapet wall block with bold outline
    g.roundRect(bx - 3.5, by - 6, 7, 6, 1)
      .fill({ color: stoneDark })
      .stroke({ width: 1.0, color: outlineColor })

    // Wall top crenels
    g.rect(bx - 3, by - 7.5, 2, 2).fill({ color: stoneColor }).stroke({ width: 0.8, color: outlineColor })
    g.rect(bx + 1, by - 7.5, 2, 2).fill({ color: stoneColor }).stroke({ width: 0.8, color: outlineColor })

    // Gem stud
    g.circle(bx, by - 2.5, 1.0).fill({ color: trimColor, alpha: 0.8 })
  }

  // 5. Scattered 2.5D Citadel Buildings & Courtyard Structures throughout the Hub Territory
  const scatteredBuildings = [
    // 1. Scriptorium Guildhouse (North-East Courtyard)
    {
      angle: -Math.PI * 0.32,
      dist: radius * 0.65,
      type: 'guildhouse',
      roofColor: primaryColor,
    },
    // 2. Arcanist Towerette (East-South-East Courtyard)
    {
      angle: Math.PI * 0.22,
      dist: radius * 0.62,
      type: 'towerette',
      roofColor: palette.lavenderNum,
    },
    // 3. Marketplace Merchant Canvas Pavilion (South-West Courtyard)
    {
      angle: Math.PI * 0.68,
      dist: radius * 0.64,
      type: 'market',
      roofColor: palette.peachNum,
    },
    // 4. Armory & Smithing Workshop (North-West Courtyard)
    {
      angle: -Math.PI * 0.78,
      dist: radius * 0.60,
      type: 'workshop',
      roofColor: palette.surface2Num,
    },
    // 5. Town Treasury Hall (North-North-West Courtyard)
    {
      angle: -Math.PI * 0.58,
      dist: radius * 0.72,
      type: 'hall',
      roofColor: palette.sapphireNum,
    },
    // 6. Royal Water Fountain (South-East Courtyard)
    {
      angle: Math.PI * 0.42,
      dist: radius * 0.58,
      type: 'fountain',
      roofColor: palette.tealNum,
    },
  ]

  for (const b of scatteredBuildings) {
    const bx = x + Math.cos(b.angle) * b.dist
    const by = y + Math.sin(b.angle) * (b.dist * 0.88)

    // Base ground contact shadow
    g.ellipse(bx, by + 1.5, 5.5, 2.2).fill({ color: darkC, alpha: 0.45 })

    // Pathway stepping stones leading toward plaza
    const pathAngle = Math.atan2(y - by, x - bx)
    for (let p = 1; p <= 2; p++) {
      const stepX = bx + Math.cos(pathAngle) * (p * 5)
      const stepY = by + Math.sin(pathAngle) * (p * 5 * 0.88)
      g.ellipse(stepX, stepY, 1.5, 0.8)
        .fill({ color: stoneDark, alpha: 0.35 })
    }

    if (b.type === 'guildhouse' || b.type === 'workshop') {
      // 2.5D Pitched-Roof Timber & Stone House with bold border
      g.roundRect(bx - 4.5, by - 6, 9, 6, 1)
        .fill({ color: stoneColor })
        .stroke({ width: 1.1, color: outlineColor })

      // Chimney
      g.rect(bx + 2, by - 9, 1.5, 3.5).fill({ color: stoneDark }).stroke({ width: 0.7, color: outlineColor })

      // Pitched Roof with bold border
      g.poly([
        bx - 5.5, by - 6,
        bx, by - 11,
        bx + 5.5, by - 6,
      ]).fill({ color: b.roofColor }).stroke({ width: 1.1, color: outlineColor })

      // Glowing Amber Window
      g.rect(bx - 1.5, by - 4, 3, 2.5).fill({ color: trimColor, alpha: 0.9 })
    } else if (b.type === 'towerette') {
      // 2.5D Round Stone Towerette with bold border
      g.roundRect(bx - 3.5, by - 8, 7, 8, 1)
        .fill({ color: stoneColor })
        .stroke({ width: 1.1, color: outlineColor })

      // Conical Spire with bold border
      g.poly([
        bx - 4.5, by - 8,
        bx, by - 14,
        bx + 4.5, by - 8,
      ]).fill({ color: b.roofColor }).stroke({ width: 1.1, color: outlineColor })

      // Golden Orb Finial
      g.circle(bx, by - 14.5, 1.0).fill({ color: trimColor })

      // Narrow window slit
      g.rect(bx - 0.7, by - 5, 1.4, 2.5).fill({ color: trimColor, alpha: 0.85 })
    } else if (b.type === 'market') {
      // 2.5D Merchant Stall & Striped Canvas Pavilion with bold border
      g.rect(bx - 4, by - 3, 8, 3).fill({ color: palette.surface0Num }).stroke({ width: 1.0, color: outlineColor })

      // Wooden corner posts
      g.moveTo(bx - 3.5, by).lineTo(bx - 3.5, by - 6).stroke({ width: 0.9, color: outlineColor })
      g.moveTo(bx + 3.5, by).lineTo(bx + 3.5, by - 6).stroke({ width: 0.9, color: outlineColor })

      // Striped Canvas Canopy Awning with bold border
      g.poly([
        bx - 4.5, by - 5,
        bx, by - 8,
        bx + 4.5, by - 5,
      ]).fill({ color: b.roofColor }).stroke({ width: 1.0, color: outlineColor })
    } else if (b.type === 'hall') {
      // 2.5D Town Hall / Vault with bold border
      g.roundRect(bx - 5, by - 7, 10, 7, 1)
        .fill({ color: stoneColor })
        .stroke({ width: 1.1, color: outlineColor })

      // Parapet roof rim with bold border
      g.rect(bx - 5.5, by - 8, 11, 1.5).fill({ color: b.roofColor }).stroke({ width: 0.9, color: outlineColor })

      // Arched entryway & gold seal
      g.roundRect(bx - 1.5, by - 4, 3, 4, 1).fill({ color: darkC })
      g.circle(bx, by - 5.5, 0.9).fill({ color: trimColor })
    } else if (b.type === 'fountain') {
      // 2.5D Royal Courtyard Fountain with bold border
      g.ellipse(bx, by, 4.5, 2.2).fill({ color: stoneDark }).stroke({ width: 1.0, color: outlineColor })
      g.ellipse(bx, by - 1, 3.5, 1.5).fill({ color: palette.tealNum, alpha: 0.85 })
      // Center pedestal & water spout
      g.rect(bx - 0.8, by - 3, 1.6, 2.5).fill({ color: stoneColor }).stroke({ width: 0.7, color: outlineColor })
      g.circle(bx, by - 3.5, 0.8).fill({ color: 0xffffff, alpha: 0.9 })
    }
  }
}

export const capitalHex: HexTypeDefinition = {
  type: 'capital',
  title: 'Citadel of Knowledge',
  drawTerrainGround: drawCapitalTerrainGround,
  drawInsignia: drawCapitalInsignia,
  drawTerritory: drawCapitalTerritory,
  createGradient: createCapitalGradient,
  renderEffects: renderCapitalEffects,
  getGlowColor: (palette) => palette.mauveNum,
}
