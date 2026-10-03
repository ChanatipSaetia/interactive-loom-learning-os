import { Graphics, Container, FillGradient } from 'pixi.js'
import { HEX_RADIUS } from '../hex-geometry'
import { GamificationThemePalette, getGamificationThemePalette } from '../../theme-palette'
import { HexInsigniaOptions, HexTypeDefinition, HexTypeEffectContext } from './types'
import { createTerritoryRng, ringAngle } from './territory-rng'

export function drawArchiveSpireTerrainGround(
  g: Graphics,
  options: HexInsigniaOptions = {},
) {
  if (!g || g.destroyed) return
  g.clear()

  const { palette = getGamificationThemePalette(), isLocked = false } = options
  const alphaMod = isLocked ? 0.35 : 0.85

  // 1. Geometric Library Mosaic Flagstones
  const tileRadius = HEX_RADIUS * 0.72
  g.poly([
    -tileRadius, 0,
    -tileRadius / 2, -tileRadius * 0.7,
    tileRadius / 2, -tileRadius * 0.7,
    tileRadius, 0,
    tileRadius / 2, tileRadius * 0.7,
    -tileRadius / 2, tileRadius * 0.7,
  ])
    .fill({ color: palette.surface0Num, alpha: 0.35 * alphaMod })
    .stroke({ width: 1.0, color: palette.skyNum, alpha: 0.25 * alphaMod })

  // 2. Concentric Runic Index Ring
  g.circle(0, 0, HEX_RADIUS * 0.45)
    .stroke({ width: 0.8, color: palette.sapphireNum, alpha: 0.3 * alphaMod })

  // 3. Ambient Codex Glyph Points
  const glyphDots = [
    { x: -14, y: -10 },
    { x: 14, y: -10 },
    { x: -16, y: 12 },
    { x: 16, y: 12 },
    { x: 0, y: -18 },
    { x: 0, y: 18 },
  ]
  for (const pt of glyphDots) {
    g.circle(pt.x, pt.y, 1.2).fill({ color: palette.skyNum, alpha: 0.6 * alphaMod })
  }
}

export function drawArchiveSpireInsignia(
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

  const c = isDefeated ? palette.overlay2Num : (color ?? palette.skyNum)
  const spireBaseColor = palette.surface1Num
  const spireTrimColor = palette.surface2Num
  const darkC = palette.crustNum
  const glowColor = palette.skyNum

  // 1. Heavy Stone Base Terrace
  g.ellipse(0, 11, 15, 4.5).fill({ color: darkC, alpha: 0.55 })
  g.ellipse(0, 10, 14, 3.8).fill({ color: spireBaseColor }).stroke({ width: 1.1, color: spireTrimColor })
  g.ellipse(0, 8, 10, 2.8).fill({ color: palette.surface0Num }).stroke({ width: 0.9, color: spireTrimColor })

  // 2. Central Archive Spire / Library Obelisk
  g.poly([
    -6, 8,
    -4, -14,
    0, -20,
    4, -14,
    6, 8,
  ])
    .fill({ color: spireBaseColor })
    .stroke({ width: 1.1, color: palette.textNum })

  // Spire Rib Lines & Windows
  g.moveTo(0, 8).lineTo(0, -18).stroke({ width: 0.9, color: palette.textNum })
  g.rect(-2, -5, 4, 6).fill({ color: darkC }).stroke({ width: 0.8, color: c })

  // 3. Floating Winged Scrolls / Taxonomy Codexes
  const bob1 = Math.sin(time * 2.2) * 1.5
  const bob2 = Math.sin(time * 2.2 + Math.PI) * 1.5

  // Left Floating Scroll
  g.poly([
    -14, -2 + bob1,
    -8, -5 + bob1,
    -8, 1 + bob1,
    -14, 4 + bob1,
  ])
    .fill({ color: palette.surface0Num })
    .stroke({ width: 0.9, color: c })
  g.moveTo(-12, 0 + bob1).lineTo(-10, -1 + bob1).stroke({ width: 0.7, color: palette.textNum })

  // Right Floating Scroll
  g.poly([
    8, -5 + bob2,
    14, -2 + bob2,
    14, 4 + bob2,
    8, 1 + bob2,
  ])
    .fill({ color: palette.surface0Num })
    .stroke({ width: 0.9, color: c })
  g.moveTo(10, -1 + bob2).lineTo(12, 0 + bob2).stroke({ width: 0.7, color: palette.textNum })

  // 4. Arcane Astral Beacon Lantern at Apex
  const pulse = Math.sin(time * 3.0) * 0.2
  g.circle(0, -20, 4.5 + pulse).fill({ color: glowColor, alpha: 0.35 })
  g.circle(0, -20, 2.5).fill({ color: palette.rosewaterNum }).stroke({ width: 0.8, color: 0xffffff })
}

export function createArchiveSpireGradient(
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
  gradient.addColorStop(0.45, palette.sky)
  gradient.addColorStop(1, palette.surface0)
  return gradient
}

export function renderArchiveSpireEffects(ctx: HexTypeEffectContext) {
  const { nodeContainer, palette, animControllers } = ctx

  const archiveFx = new Container()
  const dustParticles: Array<{
    gfx: Graphics
    baseX: number
    baseY: number
    speed: number
    phase: number
    radius: number
    color: number
  }> = []

  const colors = [palette.skyNum, palette.sapphireNum, palette.lavenderNum, palette.rosewaterNum]

  for (let i = 0; i < 7; i++) {
    const g = new Graphics()
    const p = {
      gfx: g,
      baseX: (Math.random() - 0.5) * 28,
      baseY: -8 + (Math.random() - 0.5) * 24,
      speed: 0.9 + Math.random() * 1.1,
      phase: Math.random() * Math.PI * 2,
      radius: 0.9 + Math.random() * 1.1,
      color: colors[i % colors.length],
    }
    archiveFx.addChild(g)
    dustParticles.push(p)
  }

  nodeContainer.addChild(archiveFx)

  animControllers.push((t) => {
    for (const p of dustParticles) {
      const x = p.baseX + Math.sin(t * p.speed + p.phase) * 5
      const y = p.baseY - ((t * 8 * p.speed + p.phase * 6) % 24)
      const alpha = Math.sin((y + 20) / 24 * Math.PI) * 0.7

      p.gfx.clear()
      p.gfx.circle(x, y, p.radius).fill({ color: p.color, alpha: Math.max(0, alpha) })
    }
  })
}

export function drawArchiveSpireTerritory(
  g: Graphics,
  ctx: import('./types').HexTerritoryContext,
) {
  if (!g || g.destroyed) return
  const { x, y, radius, palette } = ctx
  const rng = createTerritoryRng(ctx.node.id)

  const primaryColor = palette.skyNum
  const secondaryColor = palette.sapphireNum
  const stoneColor = palette.surface1Num
  const stoneDark = palette.surface2Num
  const darkC = palette.crustNum

  // 1. 2.5D Isometric Mosaic Plinth & Single Perimeter Border
  g.ellipse(x, y + 5, radius, radius * 0.85)
    .fill({ color: darkC, alpha: 0.25 })
  g.ellipse(x, y, radius, radius * 0.88)
    .fill({ color: primaryColor, alpha: 0.055 })
    .stroke({ width: 1.5, color: primaryColor, alpha: 0.35 })

  // 3. Interior Archive Courtyard: hovering tome stacks, rune circles & mini obelisks
  const slots: { y: number; draw: () => void }[] = []
  const at = (a: number, d: number) => ({ bx: x + Math.cos(a) * d, by: y + Math.sin(a) * (d * 0.88) })

  // Floor mosaic rune circles
  const runeCount = rng.int(2, 4)
  const runeA0 = rng.range(0, Math.PI * 2)
  for (let i = 0; i < runeCount; i++) {
    const { bx, by } = at(ringAngle(rng, i, runeCount, runeA0, 0.3), radius * rng.range(0.66, 0.74))
    g.ellipse(bx, by, 6, 3).stroke({ width: 0.7, color: secondaryColor, alpha: 0.3 })
    g.ellipse(bx, by, 2.5, 1.2).fill({ color: primaryColor, alpha: 0.25 })
  }

  // ─── 2.5D HIGH-FIDELITY SCHOLARLY PROPS ───

  // 1. Isometric Study Carrel (Grounded Flagstone Dais + Scholar Desk + Grimoire + Inkpot & Quill + Stool)
  const studyCarrel = (bx: number, by: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        // Grounding Flagstone Plinth
        g.ellipse(bx, by + 1, 9 * sc, 4.5 * sc).fill({ color: darkC, alpha: 0.35 })
        g.ellipse(bx, by, 8.5 * sc, 4.2 * sc).fill({ color: stoneDark, alpha: 0.6 })
          .stroke({ width: 0.6, color: palette.textNum, alpha: 0.4 })

        // Scholar Wooden Stool (behind/offset)
        g.ellipse(bx - 3.5 * sc, by - 2 * sc, 2 * sc, 1 * sc).fill({ color: darkC, alpha: 0.3 })
        g.roundRect(bx - 4.4 * sc, by - 5 * sc, 1.8 * sc, 4 * sc, 0.4).fill({ color: stoneDark }).stroke({ width: 0.5, color: palette.textNum })
        g.ellipse(bx - 3.5 * sc, by - 5 * sc, 1.8 * sc, 0.9 * sc).fill({ color: palette.surface1Num })

        // Solid Wooden Study Desk Structure
        // Front & Side Desk Panels
        const dw = 5.5 * sc
        const dh = 4.5 * sc
        const dy = 2.0 * sc
        // Left desk face
        g.poly([
          bx - dw, by - dy,
          bx, by,
          bx, by - dh,
          bx - dw, by - dh - dy,
        ]).fill({ color: stoneDark }).stroke({ width: 0.7, color: palette.textNum })
        // Right desk face
        g.poly([
          bx, by,
          bx + dw, by - dy,
          bx + dw, by - dh - dy,
          bx, by - dh,
        ]).fill({ color: palette.surface1Num }).stroke({ width: 0.7, color: palette.textNum })

        // Slanted Wooden Writing Surface (Top Isometric Face)
        g.poly([
          bx - dw, by - dh - dy,
          bx, by - dh,
          bx + dw, by - dh - dy,
          bx, by - dh - dy * 2 - 1.5 * sc, // extra tilt for easel-like angle
        ]).fill({ color: palette.surface2Num }).stroke({ width: 0.8, color: palette.textNum })

        // Open Illuminated Grimoire on Desk
        const gw = 2.8 * sc
        const gh = 1.6 * sc
        const gy = by - dh - dy * 1.1
        // Left parchment page
        g.poly([
          bx - gw, gy - 0.6 * sc,
          bx - 0.2 * sc, gy + 0.2 * sc,
          bx - 0.2 * sc, gy - gh,
          bx - gw, gy - gh - 0.6 * sc,
        ]).fill({ color: 0xffffff, alpha: 0.95 }).stroke({ width: 0.4, color: palette.textNum })
        // Red illuminated initial
        g.rect(bx - gw + 0.4 * sc, gy - gh + 0.2 * sc, 0.6 * sc, 0.6 * sc).fill({ color: palette.redNum })
        // Left page script lines
        g.moveTo(bx - gw + 1.2 * sc, gy - gh + 0.4 * sc).lineTo(bx - 0.6 * sc, gy - gh + 0.7 * sc)
          .stroke({ width: 0.35, color: palette.surface0Num })
        g.moveTo(bx - gw + 0.4 * sc, gy - gh + 1.0 * sc).lineTo(bx - 0.6 * sc, gy - gh + 1.3 * sc)
          .stroke({ width: 0.35, color: palette.surface0Num })

        // Right parchment page
        g.poly([
          bx + 0.2 * sc, gy + 0.2 * sc,
          bx + gw, gy - 0.6 * sc,
          bx + gw, gy - gh - 0.6 * sc,
          bx + 0.2 * sc, gy - gh,
        ]).fill({ color: 0xfdfdfd, alpha: 0.95 }).stroke({ width: 0.4, color: palette.textNum })
        // Right page script lines
        g.moveTo(bx + 0.6 * sc, gy - gh + 0.4 * sc).lineTo(bx + gw - 0.4 * sc, gy - gh + 0.1 * sc)
          .stroke({ width: 0.35, color: palette.surface0Num })
        g.moveTo(bx + 0.6 * sc, gy - gh + 1.0 * sc).lineTo(bx + gw - 0.4 * sc, gy - gh + 0.7 * sc)
          .stroke({ width: 0.35, color: palette.surface0Num })

        // Brass Inkwell with White Quill Feather
        g.circle(bx + 3.6 * sc, gy - 0.2 * sc, 0.7 * sc).fill({ color: palette.yellowNum })
        g.circle(bx + 3.6 * sc, gy - 0.2 * sc, 0.35 * sc).fill({ color: darkC })
        // Feather quill sticking up
        g.moveTo(bx + 3.6 * sc, gy - 0.2 * sc).lineTo(bx + 4.6 * sc, gy - 3.2 * sc)
          .stroke({ width: 0.6, color: 0xffffff })
      },
    })
  }

  // 2. True 2.5D Isometric Leatherbound Book Stack
  const bookStack = (bx: number, by: number, n: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1, 4.4 * sc, 2 * sc).fill({ color: darkC, alpha: 0.4 })
        const bookColors = [palette.sapphireNum, palette.maroonNum, palette.tealNum, palette.lavenderNum]
        for (let i = 0; i < n; i++) {
          const dy = -(i * 2.5) * sc
          const bw = (3.6 - i * 0.3) * sc
          const bh = 1.4 * sc
          const c = bookColors[i % bookColors.length]

          // Left Spine Face (Curved appearance)
          g.poly([
            bx - bw, by + dy - 0.5 * sc,
            bx, by + dy + 0.6 * sc,
            bx, by + dy - bh + 0.6 * sc,
            bx - bw, by + dy - bh - 0.5 * sc,
          ]).fill({ color: c }).stroke({ width: 0.6, color: palette.textNum })
          // Gold spine rib bands
          g.moveTo(bx - bw * 0.7, by + dy - 0.2 * sc).lineTo(bx - 0.2 * sc, by + dy + 0.4 * sc)
            .stroke({ width: 0.4, color: palette.yellowNum, alpha: 0.8 })

          // Right Page Edge Face (Creamy parchment edge)
          g.poly([
            bx, by + dy + 0.6 * sc,
            bx + bw, by + dy - 0.5 * sc,
            bx + bw, by + dy - bh - 0.5 * sc,
            bx, by + dy - bh + 0.6 * sc,
          ]).fill({ color: 0xffffff, alpha: 0.95 }).stroke({ width: 0.5, color: palette.textNum })
          g.moveTo(bx + 0.4 * sc, by + dy + 0.2 * sc).lineTo(bx + bw - 0.4 * sc, by + dy - 0.6 * sc)
            .stroke({ width: 0.35, color: palette.surface1Num })

          // Top Cover Rhombus Face
          g.poly([
            bx - bw, by + dy - bh - 0.5 * sc,
            bx, by + dy - bh + 0.6 * sc,
            bx + bw, by + dy - bh - 0.5 * sc,
            bx, by + dy - bh - 1.6 * sc,
          ]).fill({ color: c }).stroke({ width: 0.6, color: palette.textNum })

          // Gold corner clasp & Bookmark ribbon on top book
          if (i === n - 1) {
            g.circle(bx + bw * 0.7, by + dy - bh - 0.5 * sc, 0.4 * sc).fill({ color: palette.yellowNum })
            // Crimson bookmark ribbon trailing down the pages
            g.moveTo(bx + 0.3 * sc, by + dy - bh + 0.6 * sc).lineTo(bx + 1.2 * sc, by + dy + 1.8 * sc)
              .stroke({ width: 0.7, color: palette.redNum })
          }
        }
      },
    })
  }

  // 3. Glazed Ceramic Scroll Amphora with Wax-Sealed Scrolls
  const scrollVessel = (bx: number, by: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1, 3.4 * sc, 1.6 * sc).fill({ color: darkC, alpha: 0.35 })
        // Terracotta / porcelain vase body
        g.poly([
          bx - 1.8 * sc, by,
          bx - 3.0 * sc, by - 3.5 * sc,
          bx - 2.0 * sc, by - 7.5 * sc,
          bx + 2.0 * sc, by - 7.5 * sc,
          bx + 3.0 * sc, by - 3.5 * sc,
          bx + 1.8 * sc, by,
        ]).fill({ color: palette.surface1Num }).stroke({ width: 0.7, color: palette.textNum })
        // Vase rim ring
        g.ellipse(bx, by - 7.5 * sc, 2.2 * sc, 0.9 * sc).fill({ color: palette.surface2Num }).stroke({ width: 0.6, color: palette.textNum })
        // Side loop handles
        g.moveTo(bx - 2.8 * sc, by - 4.5 * sc).lineTo(bx - 3.8 * sc, by - 6 * sc).lineTo(bx - 2.2 * sc, by - 7 * sc)
          .stroke({ width: 0.7, color: palette.textNum })
        g.moveTo(bx + 2.8 * sc, by - 4.5 * sc).lineTo(bx + 3.8 * sc, by - 6 * sc).lineTo(bx + 2.2 * sc, by - 7 * sc)
          .stroke({ width: 0.7, color: palette.textNum })

        // Rolled parchment scrolls sticking out
        g.rect(bx - 1.4 * sc, by - 11.5 * sc, 1.1 * sc, 4.8 * sc).fill({ color: 0xffffff, alpha: 0.95 }).stroke({ width: 0.5, color: palette.textNum })
        g.circle(bx - 0.85 * sc, by - 10 * sc, 0.45 * sc).fill({ color: palette.redNum }) // red wax seal

        g.rect(bx + 0.4 * sc, by - 13 * sc, 1.2 * sc, 6.2 * sc).fill({ color: 0xffffff, alpha: 0.95 }).stroke({ width: 0.5, color: palette.textNum })
        g.circle(bx + 1.0 * sc, by - 11.2 * sc, 0.45 * sc).fill({ color: palette.sapphireNum }) // blue seal
      },
    })
  }

  // 4. Carved Marble Reliquary Pillar with Levitating Runic Focus Crystal
  const relicPillar = (bx: number, by: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1.5, 4.2 * sc, 2 * sc).fill({ color: darkC, alpha: 0.45 })
        // Stepped marble dais
        g.roundRect(bx - 3.2 * sc, by - 1.8 * sc, 6.4 * sc, 1.8 * sc, 0.4).fill({ color: stoneDark }).stroke({ width: 0.6, color: palette.textNum })
        // Fluted column
        g.poly([
          bx - 2.2 * sc, by - 1.8 * sc,
          bx - 1.6 * sc, by - 9.5 * sc,
          bx + 1.6 * sc, by - 9.5 * sc,
          bx + 2.2 * sc, by - 1.8 * sc,
        ]).fill({ color: stoneColor }).stroke({ width: 0.8, color: palette.textNum })
        // Gold carved fluting grooves
        g.moveTo(bx, by - 2.2 * sc).lineTo(bx, by - 9 * sc).stroke({ width: 0.5, color: palette.yellowNum, alpha: 0.8 })
        // Capital plinth
        g.roundRect(bx - 2.6 * sc, by - 11 * sc, 5.2 * sc, 1.6 * sc, 0.4).fill({ color: stoneDark }).stroke({ width: 0.6, color: palette.textNum })

        // Levitating mana crystal focus
        g.poly([
          bx, by - 18 * sc,
          bx + 2.2 * sc, by - 14.5 * sc,
          bx, by - 12 * sc,
          bx - 2.2 * sc, by - 14.5 * sc,
        ]).fill({ color: primaryColor, alpha: 0.95 }).stroke({ width: 0.7, color: palette.textNum })
        // Crystal core glow
        g.circle(bx, by - 14.5 * sc, 0.8 * sc).fill({ color: 0xffffff })
      },
    })
  }

  // ─── HARMONIOUS SCRIPTORIUM CLOISTER LAYOUT ───

  // West Study Wing: Complete Study Carrel + Snug Book Stack + Snug Scroll Amphora
  {
    const pCarrel = at(-2.2, radius * 0.78)
    studyCarrel(pCarrel.bx, pCarrel.by, 1.05)

    const pBooks = at(-2.38, radius * 0.81)
    bookStack(pBooks.bx, pBooks.by, 3, 0.95)

    const pVessel = at(-2.02, radius * 0.76)
    scrollVessel(pVessel.bx, pVessel.by, 0.95)
  }

  // East Study Wing: Complete Study Carrel + Snug Book Stack + Snug Scroll Amphora
  {
    const pCarrel = at(0.15, radius * 0.78)
    studyCarrel(pCarrel.bx, pCarrel.by, 1.05)

    const pBooks = at(0.32, radius * 0.81)
    bookStack(pBooks.bx, pBooks.by, 3, 0.95)

    const pVessel = at(-0.02, radius * 0.76)
    scrollVessel(pVessel.bx, pVessel.by, 0.95)
  }

  // North Reliquary Sanctum: Twin Relic Pillars Snugly Flanking Ancestral Archive Stack
  {
    const pPillar1 = at(-0.89, radius * 0.83)
    relicPillar(pPillar1.bx, pPillar1.by, 1.0)

    const pPillar2 = at(-0.61, radius * 0.83)
    relicPillar(pPillar2.bx, pPillar2.by, 1.0)

    const pTomes = at(-0.75, radius * 0.78)
    bookStack(pTomes.bx, pTomes.by, 4, 1.05)
  }

  // South Scholarly Entryway: Boundary Relic Pillar Snugly Flanked by Tomes & Scroll Amphora
  {
    const pPillar = at(2.15, radius * 0.82)
    relicPillar(pPillar.bx, pPillar.by, 0.95)

    const pBooks = at(2.01, radius * 0.79)
    bookStack(pBooks.bx, pBooks.by, 2, 0.9)

    const pVessel = at(2.29, radius * 0.79)
    scrollVessel(pVessel.bx, pVessel.by, 0.95)
  }

  slots.sort((s1, s2) => s1.y - s2.y)
  for (const s of slots) s.draw()
}

export const archiveSpireHex: HexTypeDefinition = {
  type: 'archive_spire',
  title: 'Archive Spire',
  drawTerrainGround: drawArchiveSpireTerrainGround,
  drawInsignia: drawArchiveSpireInsignia,
  drawTerritory: drawArchiveSpireTerritory,
  createGradient: createArchiveSpireGradient,
  renderEffects: renderArchiveSpireEffects,
  getGlowColor: (palette) => palette.skyNum,
}
