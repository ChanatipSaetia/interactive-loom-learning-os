import { Graphics, Container, FillGradient } from 'pixi.js'
import { HEX_RADIUS } from '../hex-geometry'
import { GamificationThemePalette, getGamificationThemePalette } from '../../theme-palette'
import { HexInsigniaOptions, HexTypeDefinition, HexTypeEffectContext } from './types'
import { createTerritoryRng, ringAngle } from './territory-rng'

export function drawConceptMonolithTerrainGround(
  g: Graphics,
  options: HexInsigniaOptions = {},
) {
  if (!g || g.destroyed) return
  g.clear()

  const { palette = getGamificationThemePalette(), isLocked = false } = options
  const alphaMod = isLocked ? 0.35 : 0.85

  // 1. Spreading Arcane World Tree Root Filaments
  const rootAngles = [
    -Math.PI / 4,
    Math.PI / 4,
    (3 * Math.PI) / 4,
    (-3 * Math.PI) / 4,
    Math.PI / 2,
  ]
  for (const angle of rootAngles) {
    const startX = Math.cos(angle) * (HEX_RADIUS * 0.15)
    const startY = 12 + Math.sin(angle) * 3
    const midX = Math.cos(angle + 0.1) * (HEX_RADIUS * 0.45)
    const midY = 12 + Math.sin(angle + 0.1) * (HEX_RADIUS * 0.25)
    const endX = Math.cos(angle) * (HEX_RADIUS * 0.72)
    const endY = 12 + Math.sin(angle) * (HEX_RADIUS * 0.38)

    g.moveTo(startX, startY)
      .quadraticCurveTo(midX, midY, endX, endY)
      .stroke({ width: 1.4, color: palette.surface2Num, alpha: 0.6 * alphaMod })
    g.moveTo(startX, startY)
      .quadraticCurveTo(midX, midY, endX, endY)
      .stroke({ width: 0.7, color: palette.tealNum, alpha: 0.7 * alphaMod })
  }

  // 2. Glowing Arboretum Flora / Blossom Spores on Roots
  const blossomPoints = [
    { x: -18, y: 14, r: 2.5, color: palette.lavenderNum },
    { x: 18, y: 14, r: 2.5, color: palette.lavenderNum },
    { x: -22, y: 5, r: 2.0, color: palette.tealNum },
    { x: 22, y: 5, r: 2.0, color: palette.tealNum },
    { x: 0, y: 22, r: 2.8, color: palette.mauveNum },
  ]
  for (const b of blossomPoints) {
    g.circle(b.x, b.y, b.r + 1.2).fill({ color: b.color, alpha: 0.25 * alphaMod })
    g.circle(b.x, b.y, b.r).fill({ color: b.color, alpha: 0.8 * alphaMod })
  }
}

export function drawConceptMonolithInsignia(
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

  const barkColor = isDefeated ? palette.overlay1Num : palette.surface1Num
  const barkTrim = isDefeated ? palette.overlay0Num : palette.surface2Num
  const leafColor1 = isDefeated ? palette.overlay2Num : palette.lavenderNum
  const leafColor2 = isDefeated ? palette.subtext0Num : palette.tealNum
  const fruitColor = isDefeated ? palette.surface2Num : (color ?? palette.mauveNum)
  const glowAlpha = isDefeated ? 0.3 : 0.85

  // 1. Root Base Earth Mound
  g.ellipse(0, 14, 14, 4.5).fill({ color: palette.crustNum, alpha: 0.6 })
  g.ellipse(0, 13, 11, 3.5).fill({ color: barkColor }).stroke({ width: 1.0, color: barkTrim })

  // 2. Twisted Ancient Trunk
  // Left root flare
  g.poly([-8, 13, -3, 6, -2, -2, -4, 13]).fill({ color: barkColor })
  // Right root flare
  g.poly([8, 13, 3, 6, 2, -2, 4, 13]).fill({ color: barkColor })
  // Main trunk body
  g.poly([-3.5, 12, -2.5, -3, 2.5, -3, 3.5, 12])
    .fill({ color: barkColor })
    .stroke({ width: 1.0, color: barkTrim })

  // Trunk Bark Texture Lines
  g.moveTo(0, 11).lineTo(0, -2).stroke({ width: 0.8, color: palette.crustNum, alpha: 0.7 })
  g.moveTo(-1.5, 7).lineTo(-1.5, 0).stroke({ width: 0.6, color: palette.crustNum, alpha: 0.5 })

  // 3. Branching Canopy Structure (Concept Tree Nodes & Edges)
  const sway = Math.sin(time * 1.5) * 0.8

  // Main branch forks
  // Central high branch
  g.moveTo(0, -3).quadraticCurveTo(sway * 0.5, -10, 0 + sway, -15).stroke({ width: 1.8, color: barkColor })
  g.moveTo(0, -3).quadraticCurveTo(sway * 0.5, -10, 0 + sway, -15).stroke({ width: 0.9, color: barkTrim })

  // Left branch
  g.moveTo(-1, -2).quadraticCurveTo(-7, -7, -12 + sway * 0.7, -10).stroke({ width: 1.6, color: barkColor })
  g.moveTo(-1, -2).quadraticCurveTo(-7, -7, -12 + sway * 0.7, -10).stroke({ width: 0.8, color: barkTrim })

  // Left sub-branch
  g.moveTo(-6, -6).quadraticCurveTo(-11, -12, -8 + sway * 0.6, -16).stroke({ width: 1.1, color: barkTrim })

  // Right branch
  g.moveTo(1, -2).quadraticCurveTo(7, -7, 12 + sway * 0.7, -10).stroke({ width: 1.6, color: barkColor })
  g.moveTo(1, -2).quadraticCurveTo(7, -7, 12 + sway * 0.7, -10).stroke({ width: 0.8, color: barkTrim })

  // Right sub-branch
  g.moveTo(6, -6).quadraticCurveTo(11, -12, 8 + sway * 0.6, -16).stroke({ width: 1.1, color: barkTrim })

  // 4. Luminous Concept Nodes & Canopy Foliage Clusters
  const nodes = [
    // Center apex
    { x: 0 + sway, y: -16, r: 4.8, color: fruitColor, inner: 0xffffff },
    // Left major
    { x: -13 + sway * 0.7, y: -10, r: 4.2, color: leafColor1, inner: palette.rosewaterNum },
    // Left top
    { x: -8 + sway * 0.6, y: -17, r: 3.5, color: leafColor2, inner: 0xffffff },
    // Right major
    { x: 13 + sway * 0.7, y: -10, r: 4.2, color: leafColor1, inner: palette.rosewaterNum },
    // Right top
    { x: 8 + sway * 0.6, y: -17, r: 3.5, color: leafColor2, inner: 0xffffff },
    // Lower mid branches
    { x: -5 + sway * 0.4, y: -9, r: 2.8, color: leafColor2, inner: leafColor1 },
    { x: 5 + sway * 0.4, y: -9, r: 2.8, color: leafColor2, inner: leafColor1 },
  ]

  // Holographic Relational Concept Map Edges between nodes
  g.moveTo(nodes[1].x, nodes[1].y).lineTo(nodes[2].x, nodes[2].y).stroke({ width: 0.6, color: palette.tealNum, alpha: 0.4 * glowAlpha })
  g.moveTo(nodes[2].x, nodes[2].y).lineTo(nodes[0].x, nodes[0].y).stroke({ width: 0.6, color: palette.lavenderNum, alpha: 0.5 * glowAlpha })
  g.moveTo(nodes[0].x, nodes[0].y).lineTo(nodes[4].x, nodes[4].y).stroke({ width: 0.6, color: palette.lavenderNum, alpha: 0.5 * glowAlpha })
  g.moveTo(nodes[4].x, nodes[4].y).lineTo(nodes[3].x, nodes[3].y).stroke({ width: 0.6, color: palette.tealNum, alpha: 0.4 * glowAlpha })

  for (const n of nodes) {
    const pulse = Math.sin(time * 2.5 + n.x * 0.5) * 0.4
    // Outer aura
    g.circle(n.x, n.y, n.r + 2.0 + pulse).fill({ color: n.color, alpha: 0.25 * glowAlpha })
    // Main glowing node
    g.circle(n.x, n.y, n.r).fill({ color: n.color, alpha: glowAlpha }).stroke({ width: 0.9, color: 0xffffff, alpha: 0.8 * glowAlpha })
    // Inner core spark
    g.circle(n.x, n.y, n.r * 0.45).fill({ color: n.inner, alpha: glowAlpha })
  }
}

export function createConceptMonolithGradient(
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
  gradient.addColorStop(0.45, palette.lavender)
  gradient.addColorStop(1, palette.surface0)
  return gradient
}

export function renderConceptMonolithEffects(ctx: HexTypeEffectContext) {
  const { nodeContainer, palette, animControllers } = ctx

  const treeFx = new Container()
  const sporeGfx = new Graphics()
  treeFx.addChild(sporeGfx)
  nodeContainer.addChild(treeFx)

  // Floating bioluminescent spore motes rising from tree canopy
  const spores = Array.from({ length: 6 }, (_, i) => ({
    xOffset: (i - 2.5) * 6,
    speed: 0.4 + (i % 3) * 0.2,
    phase: i * 1.1,
    size: 1.2 + (i % 2) * 0.6,
    color: i % 2 === 0 ? palette.lavenderNum : palette.tealNum,
  }))

  animControllers.push((t) => {
    sporeGfx.clear()
    for (const s of spores) {
      const progress = ((t * s.speed + s.phase) % 1)
      const x = s.xOffset + Math.sin(t * 2 + s.phase) * 3
      const y = -8 - progress * 22
      const alpha = Math.sin(progress * Math.PI) * 0.75

      sporeGfx.circle(x, y, s.size).fill({ color: s.color, alpha })
    }
  })
}

export function drawConceptMonolithTerritory(
  g: Graphics,
  ctx: import('./types').HexTerritoryContext,
) {
  if (!g || g.destroyed) return
  const { x, y, radius, palette } = ctx
  const rng = createTerritoryRng(ctx.node.id)

  const primaryColor = palette.lavenderNum
  const accentColor = palette.tealNum
  const barkColor = palette.surface1Num
  const darkC = palette.crustNum

  // 1. 2.5D Organic Root Mound & Single Perimeter Border
  g.ellipse(x, y + 5, radius, radius * 0.85)
    .fill({ color: darkC, alpha: 0.25 })
  g.ellipse(x, y, radius, radius * 0.88)
    .fill({ color: primaryColor, alpha: 0.06 })
    .stroke({ width: 1.4, color: primaryColor, alpha: 0.32 })

  // 3. Interior Grove: saplings, glowing seed nodes & spreading root lattice
  const slots: { y: number; draw: () => void }[] = []
  const at = (a: number, d: number) => ({ bx: x + Math.cos(a) * d, by: y + Math.sin(a) * (d * 0.88) })

  // Underground root lattice floor decal
  const rootPtCount = rng.int(4, 6)
  const rootA0 = rng.range(0, Math.PI * 2)
  const rootPts: Array<{ x: number; y: number }> = []
  for (let i = 0; i < rootPtCount; i++) {
    const a = ringAngle(rng, i, rootPtCount, rootA0, 0.2)
    const d = radius * rng.range(0.68, 0.84)
    rootPts.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * (d * 0.88) })
  }
  for (let i = 0; i < rootPts.length; i++) {
    const p1 = rootPts[i]
    const p2 = rootPts[(i + 3) % rootPts.length]
    g.moveTo(p1.x, p1.y).lineTo(p2.x, p2.y).stroke({ width: 0.6, color: barkColor, alpha: 0.3 })
  }
  for (const p of rootPts) {
    g.circle(p.x, p.y, 1.6).fill({ color: accentColor, alpha: 0.3 })
  }

  const elderSapling = (bx: number, by: number, glowColor: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1.5, 6 * sc, 2.4 * sc).fill({ color: darkC, alpha: 0.45 })
        // Twisted ancient root trunk
        g.poly([
          bx - 2.8 * sc, by + 1 * sc,
          bx - 1.4 * sc, by - 4 * sc,
          bx - 2.4 * sc, by - 9 * sc,
          bx - 0.8 * sc, by - 8.5 * sc,
          bx, by - 5.5 * sc,
          bx + 1 * sc, by - 8.5 * sc,
          bx + 2.4 * sc, by - 9 * sc,
          bx + 1.4 * sc, by - 4 * sc,
          bx + 2.8 * sc, by + 1 * sc,
        ]).fill({ color: barkColor }).stroke({ width: 0.8, color: palette.textNum })

        // Canopy aura glow
        g.circle(bx, by - 12 * sc, 7 * sc).fill({ color: glowColor, alpha: 0.18 })

        // Multi-layered bioluminescent foliage
        g.circle(bx - 3.4 * sc, by - 10 * sc, 3.8 * sc).fill({ color: palette.surface0Num, alpha: 0.9 }).stroke({ width: 0.7, color: palette.textNum })
        g.circle(bx + 3.4 * sc, by - 10 * sc, 3.8 * sc).fill({ color: palette.surface0Num, alpha: 0.9 }).stroke({ width: 0.7, color: palette.textNum })
        g.circle(bx - 2.8 * sc, by - 12 * sc, 4 * sc).fill({ color: glowColor, alpha: 0.95 }).stroke({ width: 0.8, color: palette.textNum })
        g.circle(bx + 2.8 * sc, by - 12 * sc, 4 * sc).fill({ color: accentColor, alpha: 0.95 }).stroke({ width: 0.8, color: palette.textNum })
        g.circle(bx, by - 14.5 * sc, 4.4 * sc).fill({ color: glowColor, alpha: 0.95 }).stroke({ width: 0.8, color: palette.textNum })

        // Glowing spore crystals in canopy
        g.circle(bx - 1.8 * sc, by - 12.5 * sc, 1.2 * sc).fill({ color: 0xffffff, alpha: 0.95 })
        g.circle(bx + 1.8 * sc, by - 13.5 * sc, 1.2 * sc).fill({ color: 0xffffff, alpha: 0.95 })
        g.circle(bx, by - 16 * sc, 1.4 * sc).fill({ color: 0xffffff, alpha: 0.95 })
      },
    })
  }

  const mushroomCluster = (bx: number, by: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1, 4.8 * sc, 2 * sc).fill({ color: darkC, alpha: 0.4 })
        // Stems
        g.rect(bx - 2.4 * sc, by - 3.5 * sc, 1 * sc, 3.5 * sc).fill({ color: palette.surface2Num })
        g.rect(bx + 1.4 * sc, by - 4.5 * sc, 1.2 * sc, 4.5 * sc).fill({ color: palette.surface2Num })
        g.rect(bx - 0.4 * sc, by - 6 * sc, 1.4 * sc, 6 * sc).fill({ color: palette.surface1Num })

        // Mushroom caps
        g.ellipse(bx - 2 * sc, by - 4 * sc, 2.2 * sc, 1.5 * sc).fill({ color: accentColor, alpha: 0.95 }).stroke({ width: 0.6, color: palette.textNum })
        g.ellipse(bx + 2 * sc, by - 5 * sc, 2.6 * sc, 1.8 * sc).fill({ color: palette.flamingoNum, alpha: 0.95 }).stroke({ width: 0.6, color: palette.textNum })
        g.ellipse(bx + 0.3 * sc, by - 7 * sc, 3.4 * sc, 2.3 * sc).fill({ color: primaryColor, alpha: 0.95 }).stroke({ width: 0.7, color: palette.textNum })

        // Glow dots on main cap
        g.circle(bx - 0.8 * sc, by - 7.6 * sc, 0.7 * sc).fill({ color: 0xffffff, alpha: 0.9 })
        g.circle(bx + 1.2 * sc, by - 7.2 * sc, 0.6 * sc).fill({ color: 0xffffff, alpha: 0.9 })
      },
    })
  }

  const druidicStandingStone = (bx: number, by: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1, 4.2 * sc, 1.8 * sc).fill({ color: darkC, alpha: 0.45 })
        // Mossy monolith menhir
        g.poly([
          bx - 2.2 * sc, by,
          bx - 2.6 * sc, by - 9 * sc,
          bx, by - 12.5 * sc,
          bx + 2.6 * sc, by - 9 * sc,
          bx + 2.2 * sc, by,
        ]).fill({ color: palette.surface2Num }).stroke({ width: 0.8, color: palette.textNum })
        // Glowing runic inscription vein
        g.moveTo(bx, by - 2 * sc).lineTo(bx, by - 10 * sc).stroke({ width: 0.8, color: accentColor })
        g.moveTo(bx - 1.2 * sc, by - 6 * sc).lineTo(bx + 1.2 * sc, by - 6 * sc).stroke({ width: 0.7, color: accentColor })
        g.circle(bx, by - 8 * sc, 0.8 * sc).fill({ color: 0xffffff })
      },
    })
  }

  const crystalSeedPod = (bx: number, by: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1, 3.8 * sc, 1.6 * sc).fill({ color: darkC, alpha: 0.35 })
        // Root cradle
        g.poly([
          bx - 2.8 * sc, by,
          bx - 1.8 * sc, by - 3 * sc,
          bx - 2.4 * sc, by - 5 * sc,
          bx - 1.2 * sc, by - 2 * sc,
          bx, by - 1 * sc,
          bx + 1.2 * sc, by - 2 * sc,
          bx + 2.4 * sc, by - 5 * sc,
          bx + 1.8 * sc, by - 3 * sc,
          bx + 2.8 * sc, by,
        ]).fill({ color: barkColor }).stroke({ width: 0.7, color: palette.textNum })
        // Glowing seed gem
        g.poly([
          bx, by - 8.5 * sc,
          bx + 2.4 * sc, by - 5 * sc,
          bx, by - 1.5 * sc,
          bx - 2.4 * sc, by - 5 * sc,
        ]).fill({ color: primaryColor, alpha: 0.95 }).stroke({ width: 0.7, color: palette.textNum })
        g.circle(bx, by - 5 * sc, 1 * sc).fill({ color: 0xffffff, alpha: 0.95 })
      },
    })
  }

  // ─── STATIC NATURAL GROVE VIGNETTES ───
  // Vignette 1: North-West Ancient Spore Sanctuary
  {
    const pTree = at(-2.25, radius * 0.84)
    elderSapling(pTree.bx, pTree.by, primaryColor, 1.05)

    const pShroom = at(-2.0, radius * 0.74)
    mushroomCluster(pShroom.bx, pShroom.by, 1.0)

    const pStone = at(-2.5, radius * 0.82)
    druidicStandingStone(pStone.bx, pStone.by, 0.95)

    const pSeed = at(-1.75, radius * 0.78)
    crystalSeedPod(pSeed.bx, pSeed.by, 0.9)
  }

  // Vignette 2: East Megalith Ritual Circle
  {
    const pTree = at(0.2, radius * 0.85)
    elderSapling(pTree.bx, pTree.by, accentColor, 1.1)

    const pSeed = at(-0.05, radius * 0.73)
    crystalSeedPod(pSeed.bx, pSeed.by, 1.05)

    const pStone = at(-0.25, radius * 0.85)
    druidicStandingStone(pStone.bx, pStone.by, 1.0)

    const pShroom = at(0.42, radius * 0.76)
    mushroomCluster(pShroom.bx, pShroom.by, 0.95)
  }

  // Vignette 3: South-West Bioluminescent Glade
  {
    const pTree = at(2.15, radius * 0.83)
    elderSapling(pTree.bx, pTree.by, primaryColor, 1.0)

    const pSeed = at(1.85, radius * 0.75)
    crystalSeedPod(pSeed.bx, pSeed.by, 0.95)

    const pShroom = at(2.45, radius * 0.74)
    mushroomCluster(pShroom.bx, pShroom.by, 1.05)
  }

  slots.sort((s1, s2) => s1.y - s2.y)
  for (const s of slots) s.draw()
}

export const conceptMonolithHex: HexTypeDefinition = {
  type: 'concept_monolith',
  title: 'Concept Tree',
  drawTerrainGround: drawConceptMonolithTerrainGround,
  drawInsignia: drawConceptMonolithInsignia,
  drawTerritory: drawConceptMonolithTerritory,
  createGradient: createConceptMonolithGradient,
  renderEffects: renderConceptMonolithEffects,
  getGlowColor: (palette) => palette.lavenderNum,
}

