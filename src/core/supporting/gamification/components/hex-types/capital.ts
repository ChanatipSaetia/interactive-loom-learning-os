import { Graphics, FillGradient, Container } from 'pixi.js'
import { HEX_RADIUS } from '../hex-geometry'
import { GamificationThemePalette, getGamificationThemePalette } from '../../theme-palette'
import { HexInsigniaOptions, HexTypeDefinition, HexTypeEffectContext } from './types'
import { createTerritoryRng, ringAngle, sizeScale } from './territory-rng'

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
  const rng = createTerritoryRng(ctx.node.id)

  const primary = isCleared ? palette.sapphireNum : palette.mauveNum
  const trim = palette.yellowNum
  const stone = palette.surface1Num
  const stonePale = palette.overlay0Num
  const stoneDark = palette.surface2Num
  const dark = palette.crustNum
  const line = palette.textNum
  const r = radius

  const roofMix = [
    primary,
    palette.lavenderNum,
    palette.peachNum,
    palette.sapphireNum,
    palette.tealNum,
    palette.rosewaterNum,
  ]
  const roofOff = rng.int(0, roofMix.length - 1)
  const roofAt = (i: number) => roofMix[(i + roofOff) % roofMix.length]

  // Helper for 2.5D isometric positioning
  const at = (a: number, d: number) => ({
    bx: x + Math.cos(a) * d,
    by: y + Math.sin(a) * (d * 0.88),
  })

  // ─── 1. Ground plinth, drop shadow & rampart rings ────────────────────────
  g.ellipse(x, y + 5, r, r * 0.85).fill({ color: dark, alpha: 0.25 })
  g.ellipse(x, y, r, r * 0.88).fill({ color: primary, alpha: 0.07 })
  g.ellipse(x, y, r, r * 0.88).stroke({ width: 1.6, color: primary, alpha: 0.38 })
  g.ellipse(x, y, r * 0.96, r * 0.96 * 0.88).stroke({ width: 1.0, color: primary, alpha: 0.14 })

  // Faint radial paving spokes suggesting dense urban sprawl
  const spokeA0 = rng.range(0, Math.PI / 6)
  for (let i = 0; i < 12; i++) {
    const a = spokeA0 + (i * Math.PI) / 6
    const p1 = at(a, r * 0.42)
    const p2 = at(a, r * 0.9)
    g.moveTo(p1.bx, p1.by)
      .lineTo(p2.bx, p2.by)
      .stroke({ width: 0.6, color: stoneDark, alpha: 0.16 })
  }

  // Grand ring road boulevard
  g.ellipse(x, y, r * 0.74, r * 0.74 * 0.88).stroke({ width: 5.5, color: stoneDark, alpha: 0.3 })
  g.ellipse(x, y, r * 0.74, r * 0.74 * 0.88).stroke({ width: 0.8, color: stone, alpha: 0.32 })

  // ─── 2. Continuous fortification wall with crenellated merlons ────────────
  g.ellipse(x, y, r * 0.92, r * 0.92 * 0.88).stroke({ width: 3.4, color: stoneDark, alpha: 0.95 })
  g.ellipse(x, y, r * 0.92, r * 0.92 * 0.88).stroke({ width: 1.0, color: line, alpha: 0.4 })
  const merlonCount = rng.int(28, 42)
  const merlonA0 = rng.range(0, Math.PI * 2)
  for (let i = 0; i < merlonCount; i++) {
    const a = merlonA0 + (i * Math.PI * 2) / merlonCount
    const { bx: mx, by: my } = at(a, r * 0.92)
    const mw = rng.range(1.9, 2.5)
    g.rect(mx - mw / 2, my - 2.4, mw, 2.4).fill({ color: stone })
  }

  // ─── 3. Fortress watchtowers on the wall (cardinal bastions) ──────────────
  const drawWatchtower = (a: number, sc: number) => {
    const { bx: tx, by: ty } = at(a, r * 0.92)
    g.ellipse(tx, ty + 2, 6.5 * sc, 2.6 * sc).fill({ color: dark, alpha: 0.55 })
    g.roundRect(tx - 5 * sc, ty - 13 * sc, 10 * sc, 13 * sc, 1.5).fill({ color: stone }).stroke({ width: 1.2, color: line })
    g.moveTo(tx, ty - 13 * sc).lineTo(tx, ty).stroke({ width: 0.8, color: stoneDark })
    g.rect(tx - 1, ty - 8 * sc, 2, 3.5 * sc).fill({ color: trim, alpha: 0.9 })
    g.poly([tx - 6 * sc, ty - 13 * sc, tx, ty - 21 * sc, tx + 6 * sc, ty - 13 * sc])
      .fill({ color: primary }).stroke({ width: 1.1, color: line })
    g.circle(tx, ty - 21.5 * sc, 1.3 * sc).fill({ color: trim })
  }
  const towerCount = rng.int(5, 7)
  const towerA0 = rng.range(0, Math.PI * 2)
  for (let i = 0; i < towerCount; i++) {
    drawWatchtower(ringAngle(rng, i, towerCount, towerA0, 0.07), sizeScale(rng))
  }

  // ─── 4. Gatehouses with boulevards leading inward ─────────────────────────
  const drawGate = (a: number, sc: number) => {
    const { bx: gx, by: gy } = at(a, r * 0.92)
    const { bx: ix, by: iy } = at(a, r * 0.5)
    g.moveTo(gx, gy).lineTo(ix, iy).stroke({ width: 4, color: stoneDark, alpha: 0.32 })
    g.roundRect(gx - 3.2 * sc, gy - 11 * sc, 6.4 * sc, 11 * sc, 1).fill({ color: stonePale }).stroke({ width: 1, color: line })
    g.roundRect(gx - 1.7 * sc, gy - 6.5 * sc, 3.4 * sc, 6.5 * sc, 1.7).fill({ color: dark }).stroke({ width: 0.7, color: trim })
    g.poly([gx - 4 * sc, gy - 11 * sc, gx, gy - 16 * sc, gx + 4 * sc, gy - 11 * sc])
      .fill({ color: primary }).stroke({ width: 0.9, color: line })
    g.circle(gx, gy - 16.5 * sc, 0.9 * sc).fill({ color: trim })
  }
  const gateCount = rng.int(2, 4)
  const gateA0 = rng.range(0, Math.PI * 2)
  for (let i = 0; i < gateCount; i++) {
    drawGate(ringAngle(rng, i, gateCount, gateA0, 0.05), sizeScale(rng))
  }

  // ─── 5. Dense city buildings, depth-sorted back-to-front ──────────────────
  const slots: { y: number; draw: () => void }[] = []

  const drawHouse = (bx: number, by: number, w0: number, h0: number, roof: number, tall = false, sc = 1) => {
    const w = w0 * sc
    const h = h0 * sc
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1.5, w * 0.72, 2.1 * sc).fill({ color: dark, alpha: 0.45 })
        g.roundRect(bx - w / 2, by - h, w, h, 1).fill({ color: stone }).stroke({ width: 1, color: line })
        g.moveTo(bx - w * 0.18, by - h).lineTo(bx - w * 0.18, by).stroke({ width: 0.5, color: stoneDark, alpha: 0.7 })
        g.rect(bx + w * 0.2, by - h - 3 * sc, 1.4 * sc, 3.2 * sc).fill({ color: stoneDark }).stroke({ width: 0.6, color: line })
        const rh = tall ? h * 0.6 : h * 0.8
        g.poly([bx - w / 2 - 1, by - h, bx, by - h - rh, bx + w / 2 + 1, by - h])
          .fill({ color: roof }).stroke({ width: 1, color: line })
        g.rect(bx - w * 0.26, by - h * 0.62, 1.9 * sc, 1.7 * sc).fill({ color: trim, alpha: 0.9 })
        g.rect(bx + w * 0.08, by - h * 0.62, 1.9 * sc, 1.7 * sc).fill({ color: trim, alpha: 0.72 })
        if (tall) {
          g.rect(bx - w * 0.26, by - h * 0.3, 1.9 * sc, 1.7 * sc).fill({ color: trim, alpha: 0.6 })
          g.rect(bx + w * 0.08, by - h * 0.3, 1.9 * sc, 1.7 * sc).fill({ color: trim, alpha: 0.85 })
        }
        g.rect(bx - 1.1 * sc, by - 3.2 * sc, 2.2 * sc, 3.2 * sc).fill({ color: dark })
      },
    })
  }

  const drawTowerette = (bx: number, by: number, roof: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1.5, 4.6 * sc, 2 * sc).fill({ color: dark, alpha: 0.5 })
        g.roundRect(bx - 3.5 * sc, by - 10 * sc, 7 * sc, 10 * sc, 1).fill({ color: stonePale }).stroke({ width: 1.1, color: line })
        g.moveTo(bx - 3.5 * sc, by - 6 * sc).lineTo(bx + 3.5 * sc, by - 6 * sc).stroke({ width: 0.5, color: stoneDark, alpha: 0.7 })
        g.poly([bx - 4.5 * sc, by - 10 * sc, bx, by - 17 * sc, bx + 4.5 * sc, by - 10 * sc])
          .fill({ color: roof }).stroke({ width: 1.1, color: line })
        g.circle(bx, by - 17.5 * sc, 1 * sc).fill({ color: trim })
        g.rect(bx - 0.7 * sc, by - 8.5 * sc, 1.4 * sc, 2.2 * sc).fill({ color: trim, alpha: 0.85 })
        g.rect(bx - 0.7 * sc, by - 4.5 * sc, 1.4 * sc, 2.2 * sc).fill({ color: trim, alpha: 0.7 })
      },
    })
  }

  const drawHall = (bx: number, by: number, roof: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1.5, 6.5 * sc, 2.3 * sc).fill({ color: dark, alpha: 0.5 })
        g.roundRect(bx - 6 * sc, by - 7.5 * sc, 12 * sc, 7.5 * sc, 1).fill({ color: stonePale }).stroke({ width: 1.1, color: line })
        g.rect(bx - 6.5 * sc, by - 8.8 * sc, 13 * sc, 1.6 * sc).fill({ color: roof }).stroke({ width: 0.9, color: line })
        g.poly([bx - 2.5 * sc, by - 8.8 * sc, bx, by - 12.5 * sc, bx + 2.5 * sc, by - 8.8 * sc])
          .fill({ color: roof }).stroke({ width: 0.9, color: line })
        for (const ox of [-4, -1.2, 1.6, 4]) {
          g.rect(bx + ox * sc - 0.5, by - 5.5 * sc, 1, 1.6 * sc).fill({ color: trim, alpha: 0.75 })
        }
        g.roundRect(bx - 1.3 * sc, by - 3.8 * sc, 2.6 * sc, 3.8 * sc, 1.2).fill({ color: dark })
        g.circle(bx, by - 10.4 * sc, 0.8 * sc).fill({ color: trim })
      },
    })
  }

  const drawMarket = (bx: number, by: number, roof: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1.5, 5.6 * sc, 2.1 * sc).fill({ color: dark, alpha: 0.45 })
        g.rect(bx - 4.5 * sc, by - 3 * sc, 9 * sc, 3 * sc).fill({ color: palette.surface0Num }).stroke({ width: 1, color: line })
        g.moveTo(bx - 4 * sc, by).lineTo(bx - 4 * sc, by - 6 * sc).stroke({ width: 0.9, color: line })
        g.moveTo(bx + 4 * sc, by).lineTo(bx + 4 * sc, by - 6 * sc).stroke({ width: 0.9, color: line })
        g.poly([bx - 5.2 * sc, by - 5 * sc, bx, by - 8.6 * sc, bx + 5.2 * sc, by - 5 * sc])
          .fill({ color: roof }).stroke({ width: 1, color: line })
        g.rect(bx - 3.4 * sc, by - 3.2 * sc, 1.6 * sc, 1.6 * sc).fill({ color: trim, alpha: 0.8 })
        g.rect(bx + 1.8 * sc, by - 3.2 * sc, 1.6 * sc, 1.6 * sc).fill({ color: palette.redNum, alpha: 0.8 })
      },
    })
  }

  const drawFountain = (bx: number, by: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1, 5.2 * sc, 2.5 * sc).fill({ color: stoneDark }).stroke({ width: 1, color: line })
        g.ellipse(bx, by - 0.6 * sc, 4 * sc, 1.7 * sc).fill({ color: palette.tealNum, alpha: 0.85 })
        g.rect(bx - 0.8 * sc, by - 3.6 * sc, 1.6 * sc, 3 * sc).fill({ color: stonePale }).stroke({ width: 0.7, color: line })
        g.circle(bx, by - 4.2 * sc, 0.9 * sc).fill({ color: 0xffffff, alpha: 0.9 })
      },
    })
  }

  const drawTree = (bx: number, by: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1, 3 * sc, 1.3 * sc).fill({ color: dark, alpha: 0.35 })
        g.rect(bx - 0.6 * sc, by - 3.5 * sc, 1.2 * sc, 3.5 * sc).fill({ color: stoneDark })
        g.circle(bx, by - 5.5 * sc, 2.8 * sc).fill({ color: palette.greenNum, alpha: 0.9 }).stroke({ width: 0.7, color: line })
        g.circle(bx - 1.6 * sc, by - 4.2 * sc, 2 * sc).fill({ color: palette.tealNum, alpha: 0.85 }).stroke({ width: 0.6, color: line })
        g.circle(bx + 1 * sc, by - 7 * sc, 0.8 * sc).fill({ color: palette.greenNum, alpha: 0.9 })
      },
    })
  }

  const drawLamp = (bx: number, by: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.circle(bx, by - 6 * sc, 2.6 * sc).fill({ color: trim, alpha: 0.16 })
        g.moveTo(bx, by).lineTo(bx, by - 5 * sc).stroke({ width: 0.9, color: line })
        g.circle(bx, by - 6 * sc, 1.2 * sc).fill({ color: trim, alpha: 0.95 })
      },
    })
  }

  // Inner ring: grand civic landmarks hugging the citadel
  const innerCount = rng.int(2, 4)
  const innerA0 = rng.range(0, Math.PI * 2)
  const innerKinds = ['hall', 'guildhouse', 'towerette', 'market', 'hall', 'fountain', 'towerette'] as const
  for (let i = 0; i < innerCount; i++) {
    const a = ringAngle(rng, i, innerCount, innerA0)
    const { bx, by } = at(a, r * rng.range(0.52, 0.6))
    const kind = innerKinds[i % innerKinds.length]
    const sc = sizeScale(rng)
    if (kind === 'hall') drawHall(bx, by, roofAt(i), sc)
    else if (kind === 'guildhouse') drawHouse(bx, by, 10, 8, roofAt(i), true, sc)
    else if (kind === 'towerette') drawTowerette(bx, by, roofAt(i), sc)
    else if (kind === 'market') drawMarket(bx, by, roofAt(i), sc)
    else drawFountain(bx, by, sc)
  }

  // Mid ring: townhouses built along the boulevard
  const midCount = rng.int(4, 6)
  const midA0 = rng.range(0, Math.PI * 2)
  for (let i = 0; i < midCount; i++) {
    const a = ringAngle(rng, i, midCount, midA0, 0.1)
    const { bx, by } = at(a, r * rng.range(0.79, 0.85))
    if (rng.bool(0.22)) {
      drawTowerette(bx, by, roofAt(i + 2), sizeScale(rng))
    } else {
      drawHouse(bx, by, 7.5, 6, roofAt(i), rng.bool(0.35), sizeScale(rng))
    }
  }

  // Outer ring: tight rows of cottages hugging the city wall
  const outerCount = rng.int(5, 8)
  const outerA0 = rng.range(0, Math.PI * 2)
  for (let i = 0; i < outerCount; i++) {
    const a = ringAngle(rng, i, outerCount, outerA0, 0.08)
    const { bx, by } = at(a, r * rng.range(0.84, 0.89))
    drawHouse(bx, by, 6, 4.8, roofAt(i + 3), false, sizeScale(rng))
  }

  // Courtyard greenery & street lamps tucked between the rings
  const treeCount = rng.int(2, 4)
  const treeA0 = rng.range(0, Math.PI * 2)
  for (let i = 0; i < treeCount; i++) {
    const { bx, by } = at(ringAngle(rng, i, treeCount, treeA0, 0.3), r * rng.range(0.6, 0.72))
    drawTree(bx, by, sizeScale(rng))
  }
  const lampCount = rng.int(3, 4)
  const lampA0 = rng.range(0, Math.PI * 2)
  for (let i = 0; i < lampCount; i++) {
    const { bx, by } = at(ringAngle(rng, i, lampCount, lampA0, 0.25), r * rng.range(0.71, 0.77))
    drawLamp(bx, by, sizeScale(rng, 0.9, 1.1))
  }

  // Painter's-algorithm pass: back-to-front for correct 2.5D overlap
  slots.sort((s1, s2) => s1.y - s2.y)
  for (const s of slots) s.draw()
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
