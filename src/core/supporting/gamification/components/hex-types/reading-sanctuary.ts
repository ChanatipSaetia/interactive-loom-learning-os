import { Graphics, FillGradient, Container } from 'pixi.js'
import { HEX_RADIUS } from '../hex-geometry'
import { GamificationThemePalette, getGamificationThemePalette } from '../../theme-palette'
import { HexInsigniaOptions, HexTypeDefinition, HexTypeEffectContext } from './types'
import { createTerritoryRng } from './territory-rng'

export function drawReadingSanctuaryTerrainGround(
  g: Graphics,
  options: HexInsigniaOptions = {},
) {
  if (!g || g.destroyed) return
  g.clear()

  const { palette = getGamificationThemePalette(), isLocked = false } = options
  const alphaMod = isLocked ? 0.35 : 0.85

  // 1. Lush grove moss & clover turf patches across the hex
  g.ellipse(0, 8, HEX_RADIUS * 0.75, HEX_RADIUS * 0.45)
    .fill({ color: palette.greenNum, alpha: 0.22 * alphaMod })
  g.ellipse(-12, -10, 10, 6)
    .fill({ color: palette.tealNum, alpha: 0.18 * alphaMod })
  g.ellipse(12, -10, 10, 6)
    .fill({ color: palette.tealNum, alpha: 0.18 * alphaMod })

  // 2. Stepped stone garden path stones leading to dais
  const pathCoords = [
    { x: 0, y: 24, r: 3.5 },
    { x: -2, y: 19, r: 4 },
    { x: 1, y: 14, r: 4.5 },
  ]
  for (const pt of pathCoords) {
    g.ellipse(pt.x, pt.y, pt.r, pt.r * 0.6)
      .fill({ color: palette.surface1Num, alpha: 0.55 * alphaMod })
      .stroke({ width: 0.8, color: palette.surface2Num, alpha: 0.5 * alphaMod })
  }

  // 3. Ambient herbal flora dots
  const flowerDots = [
    { x: -20, y: 4, c: palette.lavenderNum },
    { x: 20, y: 4, c: palette.peachNum },
    { x: -16, y: 16, c: palette.yellowNum },
    { x: 16, y: 16, c: palette.lavenderNum },
  ]
  for (const f of flowerDots) {
    g.circle(f.x, f.y, 1.2).fill({ color: f.c, alpha: 0.65 * alphaMod })
  }
}

export function drawReadingSanctuaryInsignia(
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

  const c = isDefeated ? palette.overlay2Num : (color ?? palette.greenNum)
  const marbleColor = palette.surface1Num
  const marbleTrim = palette.surface2Num
  const darkC = palette.crustNum
  const goldColor = palette.yellowNum

  // 1. Stepped Circular Marble Terrace / Plinth
  g.ellipse(0, 10, 14, 4.5).fill({ color: darkC, alpha: 0.55 })
  g.ellipse(0, 9, 13, 3.8).fill({ color: marbleColor }).stroke({ width: 1.1, color: marbleTrim })
  g.ellipse(0, 7, 10, 3).fill({ color: palette.surface0Num }).stroke({ width: 0.9, color: marbleTrim })

  // 2. Classical Fluted Marble Columns
  // Left Pillar
  g.rect(-11, -11, 4, 17).fill({ color: marbleColor }).stroke({ width: 1.1, color: palette.textNum })
  g.rect(-12, -13, 6, 2.5).fill({ color: marbleTrim }).stroke({ width: 0.9, color: palette.textNum })
  g.rect(-12, 5, 6, 2.5).fill({ color: marbleTrim }).stroke({ width: 0.9, color: palette.textNum })
  g.moveTo(-9, -10).lineTo(-9, 5).stroke({ width: 0.8, color: palette.surface0Num })

  // Right Pillar
  g.rect(7, -11, 4, 17).fill({ color: marbleColor }).stroke({ width: 1.1, color: palette.textNum })
  g.rect(6, -13, 6, 2.5).fill({ color: marbleTrim }).stroke({ width: 0.9, color: palette.textNum })
  g.rect(6, 5, 6, 2.5).fill({ color: marbleTrim }).stroke({ width: 0.9, color: palette.textNum })
  g.moveTo(9, -10).lineTo(9, 5).stroke({ width: 0.8, color: palette.surface0Num })

  // Architrave / Pediment Beam
  g.rect(-13, -15, 26, 3).fill({ color: marbleColor }).stroke({ width: 1, color: palette.textNum })
  g.poly([-14, -15, 0, -20, 14, -15]).fill({ color: marbleTrim }).stroke({ width: 1, color: palette.textNum })

  // 3. Floating Open Ancient Grimoire / Tome
  const bookBob = Math.sin(time * 2.5) * 1.5
  const bookY = -2 + bookBob

  // Tome drop shadow on dais
  g.ellipse(0, 5, 8, 2.5).fill({ color: darkC, alpha: 0.4 })

  // Hardcover spine & back
  g.poly([
    -8, bookY - 4,
    0, bookY - 1,
    8, bookY - 4,
    8, bookY + 4,
    0, bookY + 7,
    -8, bookY + 4,
  ]).fill({ color: palette.surface0Num }).stroke({ width: 1.2, color: goldColor })

  // Left Page Block (fluttering edge)
  const leftPageFlutter = Math.sin(time * 3 + 1) * 0.6
  g.poly([
    -7.5, bookY - 3 + leftPageFlutter,
    -0.5, bookY - 0.5,
    -0.5, bookY + 5.5,
    -7.5, bookY + 3 + leftPageFlutter,
  ]).fill({ color: palette.textNum, alpha: 0.95 })
  // Right Page Block
  const rightPageFlutter = Math.sin(time * 3 + 2.5) * 0.6
  g.poly([
    0.5, bookY - 0.5,
    7.5, bookY - 3 + rightPageFlutter,
    7.5, bookY + 3 + rightPageFlutter,
    0.5, bookY + 5.5,
  ]).fill({ color: palette.textNum, alpha: 0.95 })

  // Golden Ribbon Bookmark
  g.poly([
    0, bookY + 6,
    2, bookY + 9,
    0, bookY + 11,
    -1, bookY + 9,
  ]).fill({ color: goldColor }).stroke({ width: 0.7, color: palette.textNum })

  // 4. Hovering Glowing Mana Crystal Core
  const crystalBob = Math.sin(time * 3) * 2
  const crystalY = -12 + crystalBob
  g.poly([
    0, crystalY - 5,
    3.5, crystalY,
    0, crystalY + 5,
    -3.5, crystalY,
  ]).fill({ color: c, alpha: 0.95 }).stroke({ width: 0.8, color: palette.textNum })
  g.circle(0, crystalY, 1.2).fill({ color: palette.textNum, alpha: 0.9 })
}

export function createReadingSanctuaryGradient(
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

  gradient.addColorStop(0, palette.teal)
  gradient.addColorStop(0.45, palette.green)
  gradient.addColorStop(1, palette.surface0)
  return gradient
}

export function renderReadingSanctuaryEffects(ctx: HexTypeEffectContext) {
  const { nodeContainer, palette, animControllers, isLocked } = ctx
  if (isLocked) return

  const sporeContainer = new Container()
  sporeContainer.label = 'SanctuaryHealingSpores'
  const sporeGfx = new Graphics()
  sporeContainer.addChild(sporeGfx)
  nodeContainer.addChild(sporeContainer)

  const spores = Array.from({ length: 7 }, (_, i) => ({
    angle: (i * Math.PI * 2) / 7,
    radius: 12 + (i % 3) * 6,
    speed: 0.6 + (i % 4) * 0.2,
    size: 1.2 + (i % 2) * 0.8,
    phase: i * 1.1,
  }))

  animControllers.push((t) => {
    sporeGfx.clear()
    for (const sp of spores) {
      const curAngle = sp.angle + t * sp.speed
      const x = Math.cos(curAngle) * sp.radius
      const y = Math.sin(curAngle) * (sp.radius * 0.7) + Math.sin(t * 2 + sp.phase) * 3
      const alpha = 0.4 + 0.4 * Math.sin(t * 3 + sp.phase)

      sporeGfx.circle(x, y, sp.size).fill({ color: palette.tealNum, alpha })
      sporeGfx.circle(x, y, sp.size * 0.5).fill({ color: palette.textNum, alpha: alpha + 0.2 })
    }
  })
}

export function drawReadingSanctuaryTerritory(
  g: Graphics,
  ctx: import('./types').HexTerritoryContext,
) {
  if (!g || g.destroyed) return
  const { x, y, radius, palette } = ctx
  const rng = createTerritoryRng(ctx.node.id)

  const primaryColor = palette.greenNum
  const accentColor = palette.tealNum
  const darkC = palette.crustNum

  // 1. 2.5D Elevated Grassy Mound & Single Perimeter Border
  g.ellipse(x, y + 5, radius, radius * 0.85)
    .fill({ color: darkC, alpha: 0.25 })
  g.ellipse(x, y, radius, radius * 0.88)
    .fill({ color: primaryColor, alpha: 0.06 })
    .stroke({ width: 1.4, color: primaryColor, alpha: 0.35 })

  // 5. Interior Sanctuary Garden: flower beds, reading lecterns & stepping-stone paths
  const slots: { y: number; draw: () => void }[] = []
  const at = (a: number, d: number) => ({ bx: x + Math.cos(a) * d, by: y + Math.sin(a) * (d * 0.88) })

  // Winding stepping-stone path ring
  const pathA0 = rng.range(0, Math.PI * 2)
  const stoneCount = rng.int(5, 8)
  for (let i = 0; i < stoneCount; i++) {
    const a = pathA0 + (i * Math.PI * 2) / stoneCount
    const { bx, by } = at(a, radius * (0.7 + 0.03 * Math.sin(a * rng.int(2, 4))))
    g.ellipse(bx, by, 2.2, 1.1).fill({ color: palette.surface2Num, alpha: 0.35 })
  }

  const sanctuaryTree = (bx: number, by: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        // 1. Drop shadow
        g.ellipse(bx, by + 1.5, 6 * sc, 2.5 * sc).fill({ color: darkC, alpha: 0.45 })

        // 2. Trunk with root flares and branch bifurcation
        g.poly([
          bx - 3.2 * sc, by + 1 * sc,
          bx - 1.6 * sc, by - 4 * sc,
          bx - 2.8 * sc, by - 9 * sc,
          bx - 1.2 * sc, by - 8.5 * sc,
          bx, by - 6 * sc,
          bx + 1.2 * sc, by - 8.5 * sc,
          bx + 2.8 * sc, by - 9 * sc,
          bx + 1.6 * sc, by - 4 * sc,
          bx + 3.2 * sc, by + 1 * sc,
        ]).fill({ color: palette.surface1Num }).stroke({ width: 0.9, color: palette.textNum })

        // Trunk bark groove
        g.moveTo(bx - 0.4 * sc, by).lineTo(bx - 0.4 * sc, by - 5 * sc)
          .stroke({ width: 0.6, color: palette.surface2Num })

        // 3. Multi-tiered lush foliage clouds
        // Bottom shadow canopy lobes
        g.circle(bx - 3.8 * sc, by - 9.5 * sc, 3.8 * sc).fill({ color: palette.surface0Num, alpha: 0.9 }).stroke({ width: 0.7, color: palette.textNum })
        g.circle(bx + 3.8 * sc, by - 9.5 * sc, 3.8 * sc).fill({ color: palette.surface0Num, alpha: 0.9 }).stroke({ width: 0.7, color: palette.textNum })

        // Mid vibrant green canopy
        g.circle(bx - 3.2 * sc, by - 11.5 * sc, 4.2 * sc).fill({ color: primaryColor, alpha: 0.95 }).stroke({ width: 0.8, color: palette.textNum })
        g.circle(bx + 3.2 * sc, by - 11.5 * sc, 4.2 * sc).fill({ color: primaryColor, alpha: 0.95 }).stroke({ width: 0.8, color: palette.textNum })
        g.circle(bx, by - 14 * sc, 4.8 * sc).fill({ color: accentColor, alpha: 0.95 }).stroke({ width: 0.8, color: palette.textNum })

        // Top canopy highlight dome
        g.circle(bx - 1.2 * sc, by - 14.5 * sc, 2.6 * sc).fill({ color: primaryColor, alpha: 0.9 })
        g.circle(bx + 1.4 * sc, by - 13.5 * sc, 2.4 * sc).fill({ color: accentColor, alpha: 0.9 })

        // Blossom flower flecks in canopy
        g.circle(bx - 2.5 * sc, by - 12 * sc, 0.8 * sc).fill({ color: palette.lavenderNum })
        g.circle(bx + 2 * sc, by - 13 * sc, 0.8 * sc).fill({ color: palette.rosewaterNum })
        g.circle(bx - 0.2 * sc, by - 16 * sc, 0.9 * sc).fill({ color: palette.yellowNum })
      },
    })
  }

  const flowerBed = (bx: number, by: number, bloom: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1, 5.5 * sc, 2.6 * sc).fill({ color: darkC, alpha: 0.4 })
        g.ellipse(bx, by, 5 * sc, 2.4 * sc).fill({ color: palette.surface0Num, alpha: 0.85 }).stroke({ width: 0.8, color: palette.textNum })
        // Stone edging dots
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3
          g.ellipse(bx + Math.cos(a) * 4.4 * sc, by + Math.sin(a) * 2 * sc, 1 * sc, 0.7 * sc)
            .fill({ color: palette.surface2Num })
        }
        // Flower blooms with stems and centers
        g.circle(bx - 2.2 * sc, by - 1.2 * sc, 1.6 * sc).fill({ color: primaryColor, alpha: 0.95 }).stroke({ width: 0.5, color: palette.textNum })
        g.circle(bx + 2.2 * sc, by - 1.4 * sc, 1.4 * sc).fill({ color: bloom, alpha: 0.95 }).stroke({ width: 0.5, color: palette.textNum })
        g.circle(bx, by - 2.2 * sc, 1.5 * sc).fill({ color: palette.rosewaterNum, alpha: 0.95 }).stroke({ width: 0.5, color: palette.textNum })
        g.circle(bx - 2.2 * sc, by - 1.2 * sc, 0.6 * sc).fill({ color: palette.yellowNum })
        g.circle(bx + 2.2 * sc, by - 1.4 * sc, 0.5 * sc).fill({ color: palette.yellowNum })
        g.circle(bx, by - 2.2 * sc, 0.5 * sc).fill({ color: palette.yellowNum })
      },
    })
  }

  const stoneBench = (bx: number, by: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1, 4.6 * sc, 1.8 * sc).fill({ color: darkC, alpha: 0.4 })
        // Bench legs
        g.rect(bx - 3.2 * sc, by - 3 * sc, 1.4 * sc, 3 * sc).fill({ color: palette.surface1Num }).stroke({ width: 0.6, color: palette.textNum })
        g.rect(bx + 1.8 * sc, by - 3 * sc, 1.4 * sc, 3 * sc).fill({ color: palette.surface1Num }).stroke({ width: 0.6, color: palette.textNum })
        // Slab seat
        g.roundRect(bx - 4.4 * sc, by - 4.2 * sc, 8.8 * sc, 1.8 * sc, 0.5)
          .fill({ color: palette.surface2Num }).stroke({ width: 0.8, color: palette.textNum })
        // Backrest
        g.roundRect(bx - 4.4 * sc, by - 7.5 * sc, 8.8 * sc, 1.4 * sc, 0.5)
          .fill({ color: palette.surface1Num }).stroke({ width: 0.7, color: palette.textNum })
        g.rect(bx - 3.6 * sc, by - 6.2 * sc, 1 * sc, 2.2 * sc).fill({ color: palette.surface1Num })
        g.rect(bx + 2.6 * sc, by - 6.2 * sc, 1 * sc, 2.2 * sc).fill({ color: palette.surface1Num })
      },
    })
  }

  const lectern = (bx: number, by: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1, 3.6 * sc, 1.6 * sc).fill({ color: darkC, alpha: 0.4 })
        // Fluted stone pedestal
        g.roundRect(bx - 2.2 * sc, by - 1.2 * sc, 4.4 * sc, 1.4 * sc, 0.4).fill({ color: palette.surface1Num }).stroke({ width: 0.7, color: palette.textNum })
        g.rect(bx - 1 * sc, by - 6 * sc, 2 * sc, 5 * sc).fill({ color: palette.surface2Num }).stroke({ width: 0.7, color: palette.textNum })
        // Angled book stand
        g.poly([
          bx - 3.6 * sc, by - 5.8 * sc,
          bx + 3.6 * sc, by - 7.6 * sc,
          bx + 3.6 * sc, by - 9.8 * sc,
          bx - 3.6 * sc, by - 8 * sc,
        ]).fill({ color: palette.tealNum }).stroke({ width: 0.8, color: palette.textNum })
        // Open parchment pages
        g.poly([
          bx - 3.2 * sc, by - 7.6 * sc,
          bx, by - 6.8 * sc,
          bx, by - 8.8 * sc,
          bx - 3.2 * sc, by - 9.4 * sc,
        ]).fill({ color: 0xffffff, alpha: 0.9 })
        g.poly([
          bx, by - 6.8 * sc,
          bx + 3.2 * sc, by - 8.2 * sc,
          bx + 3.2 * sc, by - 10.2 * sc,
          bx, by - 8.8 * sc,
        ]).fill({ color: 0xffffff, alpha: 0.9 })
        // Ribbon
        g.moveTo(bx, by - 6.8 * sc).lineTo(bx + 0.5 * sc, by - 5.2 * sc).stroke({ width: 0.6, color: palette.yellowNum })
      },
    })
  }

  const waterBasin = (bx: number, by: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1, 4.2 * sc, 2 * sc).fill({ color: darkC, alpha: 0.4 })
        g.ellipse(bx, by - 1 * sc, 3.8 * sc, 1.8 * sc).fill({ color: palette.surface2Num }).stroke({ width: 0.8, color: palette.textNum })
        g.ellipse(bx, by - 1.2 * sc, 3 * sc, 1.4 * sc).fill({ color: palette.tealNum, alpha: 0.9 })
        // Water glimmer & floating leaf
        g.ellipse(bx - 0.8 * sc, by - 1.4 * sc, 1.2 * sc, 0.6 * sc).fill({ color: 0xffffff, alpha: 0.7 })
        g.circle(bx + 0.8 * sc, by - 1 * sc, 0.8 * sc).fill({ color: primaryColor })
      },
    })
  }

  // ─── STATIC NATURAL GARDEN VIGNETTES ───
  // Vignette 1: North-West Shaded Reading Alcove
  {
    const pTree = at(-2.25, radius * 0.84)
    sanctuaryTree(pTree.bx, pTree.by, 1.05)

    const pBench = at(-2.0, radius * 0.74)
    stoneBench(pBench.bx, pBench.by, 1.0)

    const pLectern = at(-2.45, radius * 0.75)
    lectern(pLectern.bx, pLectern.by, 0.95)

    const pBed = at(-1.75, radius * 0.82)
    flowerBed(pBed.bx, pBed.by, palette.lavenderNum, 1.0)
  }

  // Vignette 2: East Sacred Spring & Reflection Basin
  {
    const pTree = at(0.22, radius * 0.85)
    sanctuaryTree(pTree.bx, pTree.by, 1.1)

    const pBasin = at(-0.02, radius * 0.73)
    waterBasin(pBasin.bx, pBasin.by, 1.05)

    const pBench = at(-0.25, radius * 0.82)
    stoneBench(pBench.bx, pBench.by, 0.95)

    const pBed = at(0.42, radius * 0.8)
    flowerBed(pBed.bx, pBed.by, palette.rosewaterNum, 1.0)
  }

  // Vignette 3: South-West Blossom Garden Path
  {
    const pTree = at(2.15, radius * 0.84)
    sanctuaryTree(pTree.bx, pTree.by, 1.0)

    const pLectern = at(1.85, radius * 0.76)
    lectern(pLectern.bx, pLectern.by, 1.0)

    const pBed = at(2.45, radius * 0.82)
    flowerBed(pBed.bx, pBed.by, palette.yellowNum, 1.05)
  }

  slots.sort((s1, s2) => s1.y - s2.y)
  for (const s of slots) s.draw()
}

export const readingSanctuaryHex: HexTypeDefinition = {
  type: 'reading_sanctuary',
  title: 'Reading Sanctuary',
  drawTerrainGround: drawReadingSanctuaryTerrainGround,
  drawInsignia: drawReadingSanctuaryInsignia,
  drawTerritory: drawReadingSanctuaryTerritory,
  createGradient: createReadingSanctuaryGradient,
  renderEffects: renderReadingSanctuaryEffects,
  getGlowColor: (palette) => palette.greenNum,
}
