import { Graphics, Container, FillGradient } from 'pixi.js'
import { HEX_RADIUS } from '../hex-geometry'
import { GamificationThemePalette, getGamificationThemePalette } from '../../theme-palette'
import { HexInsigniaOptions, HexTypeDefinition, HexTypeEffectContext } from './types'
import { createTerritoryRng } from './territory-rng'

export function drawSimulationNexusTerrainGround(
  g: Graphics,
  options: HexInsigniaOptions = {},
) {
  if (!g || g.destroyed) return
  g.clear()

  const { palette = getGamificationThemePalette(), isLocked = false } = options
  const alphaMod = isLocked ? 0.35 : 0.85

  // 1. Tactical Blueprint Coordinate Grid Mesh
  const gridR = HEX_RADIUS * 0.75
  g.rect(-gridR, -gridR * 0.6, gridR * 2, gridR * 1.2)
    .stroke({ width: 0.8, color: palette.surface1Num, alpha: 0.35 * alphaMod })

  // Circuit Bus Lines
  g.moveTo(-gridR, 0).lineTo(gridR, 0).stroke({ width: 1.0, color: palette.blueNum, alpha: 0.3 * alphaMod })
  g.moveTo(0, -gridR * 0.6).lineTo(0, gridR * 0.6).stroke({ width: 1.0, color: palette.blueNum, alpha: 0.3 * alphaMod })

  // Corner Coordinate Crosshairs
  const crosshairPts = [
    { x: -14, y: -12 },
    { x: 14, y: -12 },
    { x: -14, y: 12 },
    { x: 14, y: 12 },
  ]
  for (const pt of crosshairPts) {
    g.moveTo(pt.x - 2, pt.y).lineTo(pt.x + 2, pt.y).stroke({ width: 0.8, color: palette.lavenderNum, alpha: 0.5 * alphaMod })
    g.moveTo(pt.x, pt.y - 2).lineTo(pt.x, pt.y + 2).stroke({ width: 0.8, color: palette.lavenderNum, alpha: 0.5 * alphaMod })
  }
}

export function drawSimulationNexusInsignia(
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

  const c = isDefeated ? palette.overlay2Num : (color ?? palette.blueNum)
  const brassColor = palette.surface1Num
  const trimColor = palette.surface2Num
  const darkC = palette.crustNum
  const neonGlow = palette.blueNum

  // 1. Heavy Stepped Platform
  g.ellipse(0, 11, 15, 4.5).fill({ color: darkC, alpha: 0.55 })
  g.ellipse(0, 10, 14, 3.8).fill({ color: brassColor }).stroke({ width: 1.1, color: trimColor })

  // 2. Central Rotating Simulation Core Gear / Nexus
  const gearRot = time * 0.8
  const gearRadius = 9
  const teeth = 6

  // Rotating Cog Teeth
  for (let i = 0; i < teeth; i++) {
    const angle = gearRot + (i * Math.PI * 2) / teeth
    const tx = Math.cos(angle) * (gearRadius + 2.5)
    const ty = Math.sin(angle) * (gearRadius + 2.5) - 2
    g.circle(tx, ty, 1.8).fill({ color: palette.surface0Num }).stroke({ width: 0.8, color: palette.textNum })
  }

  // Gear Body
  g.circle(0, -2, gearRadius).fill({ color: brassColor }).stroke({ width: 1.1, color: palette.textNum })
  g.circle(0, -2, gearRadius - 3).fill({ color: darkC }).stroke({ width: 0.9, color: c })

  // 3. Three Interconnected Flowchart Logic Diamond Nodes
  const orbitRadius = 14
  const nodeCount = 3
  const orbitRot = -time * 0.6

  for (let i = 0; i < nodeCount; i++) {
    const angle = orbitRot + (i * Math.PI * 2) / nodeCount
    const nx = Math.cos(angle) * orbitRadius
    const ny = Math.sin(angle) * orbitRadius * 0.65 - 2

    // Flow line connecting back to core
    g.moveTo(0, -2).lineTo(nx, ny).stroke({ width: 0.9, color: neonGlow, alpha: 0.65 })

    // Diamond Logic Node
    const diamondR = 3.5
    g.poly([
      nx, ny - diamondR,
      nx + diamondR, ny,
      nx, ny + diamondR,
      nx - diamondR, ny,
    ])
      .fill({ color: palette.surface0Num })
      .stroke({ width: 1.0, color: c })

    // Node Core Spark
    g.circle(nx, ny, 1.0).fill({ color: palette.rosewaterNum })
  }

  // 4. Center Radiant Nexus Spark
  const corePulse = Math.sin(time * 3.5) * 0.2
  g.circle(0, -2, 2.5 + corePulse).fill({ color: palette.rosewaterNum })
}

export function createSimulationNexusGradient(
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

  gradient.addColorStop(0, palette.lavender)
  gradient.addColorStop(0.45, palette.blue)
  gradient.addColorStop(1, palette.surface0)
  return gradient
}

export function renderSimulationNexusEffects(ctx: HexTypeEffectContext) {
  const { nodeContainer, palette, animControllers } = ctx

  const nexusFx = new Container()
  const streamGfx = new Graphics()
  nexusFx.addChild(streamGfx)
  nodeContainer.addChild(nexusFx)

  animControllers.push((t) => {
    streamGfx.clear()
    const pulseCount = 3
    const radius = 15

    for (let i = 0; i < pulseCount; i++) {
      const progress = ((t * 0.8 + i / pulseCount) % 1)
      const angle = progress * Math.PI * 2
      const px = Math.cos(angle) * radius
      const py = Math.sin(angle) * radius * 0.65 - 2

      streamGfx.circle(px, py, 2.0 * (1 - progress * 0.3)).fill({
        color: palette.lavenderNum,
        alpha: Math.sin(progress * Math.PI) * 0.8,
      })
    }
  })
}

export function drawSimulationNexusTerritory(
  g: Graphics,
  ctx: import('./types').HexTerritoryContext,
) {
  if (!g || g.destroyed) return
  const { x, y, radius, palette } = ctx
  const rng = createTerritoryRng(ctx.node.id)

  const primaryColor = palette.blueNum
  const accentColor = palette.lavenderNum
  const metalColor = palette.surface1Num
  const metalDark = palette.surface2Num
  const darkC = palette.crustNum

  // 1. 2.5D Hexagonal Cyber Platform Plinth & Single Perimeter Border
  g.ellipse(x, y + 5, radius, radius * 0.85)
    .fill({ color: darkC, alpha: 0.25 })
  g.ellipse(x, y, radius, radius * 0.88)
    .fill({ color: primaryColor, alpha: 0.055 })
    .stroke({ width: 1.5, color: primaryColor, alpha: 0.4 })

  // 2. Interior Compute Yard: server racks, data nodes & glowing conduit grid
  const slots: { y: number; draw: () => void }[] = []
  const at = (a: number, d: number) => ({ bx: x + Math.cos(a) * d, by: y + Math.sin(a) * (d * 0.88) })

  // Conduit bus lines radiating inward from the data node ring
  const conduitA0 = rng.range(0, Math.PI / 4)
  const nodeRingCount = rng.int(3, 5)
  for (let i = 0; i < nodeRingCount; i++) {
    const a = conduitA0 + (i * Math.PI * 2) / nodeRingCount
    const o = at(a, radius * 0.88)
    const inn = at(a, radius * 0.66)
    g.moveTo(o.bx, o.by).lineTo(inn.bx, inn.by)
      .stroke({ width: 0.8, color: accentColor, alpha: 0.28 })
  }

  // ─── 2.5D HIGH-FIDELITY CYBERNETIC PROPS ───

  // 1. Holographic Flowchart Terminal (Angled Console + Levitating Flowchart Projection)
  const holoTerminal = (bx: number, by: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        // Metallic Dais & Shadow
        g.ellipse(bx, by + 1, 6 * sc, 3 * sc).fill({ color: darkC, alpha: 0.4 })
        g.ellipse(bx, by, 5.5 * sc, 2.7 * sc).fill({ color: metalDark }).stroke({ width: 0.6, color: palette.textNum })
        // Glowing circuit circle in dais
        g.ellipse(bx, by, 3.8 * sc, 1.8 * sc).stroke({ width: 0.6, color: primaryColor, alpha: 0.6 })

        // Console Pillar Stand
        g.rect(bx - 1.2 * sc, by - 6 * sc, 2.4 * sc, 6 * sc).fill({ color: metalColor }).stroke({ width: 0.6, color: palette.textNum })
        // Angled Operator Console Deck
        g.poly([
          bx - 4.5 * sc, by - 5.5 * sc,
          bx + 4.5 * sc, by - 7.5 * sc,
          bx + 4.5 * sc, by - 10 * sc,
          bx - 4.5 * sc, by - 8 * sc,
        ]).fill({ color: metalDark }).stroke({ width: 0.8, color: palette.textNum })
        // Glowing Touchscreen / Control Interface
        g.poly([
          bx - 3.8 * sc, by - 7.2 * sc,
          bx + 3.8 * sc, by - 8.8 * sc,
          bx + 3.8 * sc, by - 9.8 * sc,
          bx - 3.8 * sc, by - 8.2 * sc,
        ]).fill({ color: primaryColor, alpha: 0.95 })

        // Floating Holographic Flowchart / State-Machine Diagram
        const hy = by - 16 * sc
        // Glowing Emitter Cone Base
        g.ellipse(bx, by - 9 * sc, 1.8 * sc, 0.7 * sc).fill({ color: accentColor, alpha: 0.8 })

        // Hologram Flowchart Node 1: Diamond Decision Node
        g.poly([
          bx, hy - 3.2 * sc,
          bx + 2.4 * sc, hy - 1.6 * sc,
          bx, hy,
          bx - 2.4 * sc, hy - 1.6 * sc,
        ]).fill({ color: accentColor, alpha: 0.9 }).stroke({ width: 0.6, color: 0xffffff })
        g.circle(bx, hy - 1.6 * sc, 0.5 * sc).fill({ color: 0xffffff })

        // Hologram Flowchart Node 2: Left Process Box
        g.roundRect(bx - 5 * sc, hy + 0.8 * sc, 3.2 * sc, 1.8 * sc, 0.3)
          .fill({ color: primaryColor, alpha: 0.85 }).stroke({ width: 0.5, color: 0xffffff })

        // Hologram Flowchart Node 3: Right Process Box
        g.roundRect(bx + 1.8 * sc, hy + 0.8 * sc, 3.2 * sc, 1.8 * sc, 0.3)
          .fill({ color: palette.tealNum, alpha: 0.85 }).stroke({ width: 0.5, color: 0xffffff })

        // Hologram Connection Laser Lines
        g.moveTo(bx - 1.2 * sc, hy - 0.8 * sc).lineTo(bx - 3.4 * sc, hy + 0.8 * sc)
          .stroke({ width: 0.6, color: accentColor, alpha: 0.85 })
        g.moveTo(bx + 1.2 * sc, hy - 0.8 * sc).lineTo(bx + 3.4 * sc, hy + 0.8 * sc)
          .stroke({ width: 0.6, color: accentColor, alpha: 0.85 })

        // Light Specks
        g.circle(bx - 3.4 * sc, hy - 3.5 * sc, 0.5 * sc).fill({ color: 0xffffff, alpha: 0.9 })
        g.circle(bx + 3.4 * sc, hy - 3.8 * sc, 0.5 * sc).fill({ color: primaryColor, alpha: 0.9 })
      },
    })
  }

  // 2. Isometric Server Blade Monolith (Titanium Chassis + Blade Bays + LED Status Array + Conduit)
  const serverMonolith = (bx: number, by: number, units: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1, 5 * sc, 2.2 * sc).fill({ color: darkC, alpha: 0.45 })
        const w = 4 * sc
        const h = (7.5 + units * 2.2) * sc
        const dy = 1.6 * sc

        // Left Chassis Face
        g.poly([
          bx - w, by - dy,
          bx, by,
          bx, by - h,
          bx - w, by - h - dy,
        ]).fill({ color: metalDark }).stroke({ width: 0.8, color: palette.textNum })
        // Ventilation grille slits on side
        for (let v = 0; v < units + 2; v++) {
          const sy = by - dy - (v * 2.2 + 2) * sc
          g.moveTo(bx - w + 0.8 * sc, sy - 0.4 * sc).lineTo(bx - 0.8 * sc, sy + 0.4 * sc)
            .stroke({ width: 0.4, color: palette.surface0Num })
        }

        // Right Front Face (Server Blade Bays)
        g.poly([
          bx, by,
          bx + w, by - dy,
          bx + w, by - h - dy,
          bx, by - h,
        ]).fill({ color: metalColor }).stroke({ width: 0.8, color: palette.textNum })

        // Top Face (Rhombus)
        g.poly([
          bx - w, by - h - dy,
          bx, by - h,
          bx + w, by - h - dy,
          bx, by - h - dy * 2,
        ]).fill({ color: palette.surface2Num }).stroke({ width: 0.7, color: palette.textNum })

        // Modular Server Blade Slots & Glowing Status LEDs
        for (let s = 0; s < units; s++) {
          const sy = by - (s * 2.2 + 3) * sc
          // Blade slot outline
          g.poly([
            bx + 0.5 * sc, sy,
            bx + w - 0.5 * sc, sy - dy * 0.8,
            bx + w - 0.5 * sc, sy - dy * 0.8 - 1.4 * sc,
            bx + 0.5 * sc, sy - 1.4 * sc,
          ]).fill({ color: palette.surface0Num }).stroke({ width: 0.4, color: metalDark })

          // Multi-color status LEDs (Cyan, Emerald, Yellow)
          g.circle(bx + 1.2 * sc, sy - 0.7 * sc, 0.45 * sc).fill({ color: primaryColor })
          g.circle(bx + 2.2 * sc, sy - 1.1 * sc, 0.45 * sc).fill({ color: palette.greenNum })
          g.circle(bx + 3.1 * sc, sy - 1.5 * sc, 0.45 * sc).fill({ color: s === 1 ? palette.yellowNum : primaryColor })
        }

        // Heavy conduit pipe feeding into floor
        g.moveTo(bx - w * 0.6, by - dy * 0.8).lineTo(bx - w * 1.2, by + 1 * sc)
          .stroke({ width: 1.1, color: accentColor, alpha: 0.85 })
      },
    })
  }

  // 3. Cryo Coolant Resonator (Translucent Fluid Cylinder + Quantum Core + Pressure Gauge)
  const cryoResonator = (bx: number, by: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1, 3.8 * sc, 1.8 * sc).fill({ color: darkC, alpha: 0.4 })
        // Stepped base collar
        g.roundRect(bx - 2.8 * sc, by - 1.5 * sc, 5.6 * sc, 1.8 * sc, 0.4).fill({ color: metalDark }).stroke({ width: 0.6, color: palette.textNum })
        // Glowing Coolant Fluid Cylinder
        g.rect(bx - 2.2 * sc, by - 9.5 * sc, 4.4 * sc, 8 * sc).fill({ color: primaryColor, alpha: 0.85 }).stroke({ width: 0.7, color: palette.textNum })
        // Quantum plasma core inside
        g.poly([
          bx, by - 8 * sc,
          bx + 1.2 * sc, by - 5.5 * sc,
          bx, by - 3 * sc,
          bx - 1.2 * sc, by - 5.5 * sc,
        ]).fill({ color: 0xffffff, alpha: 0.95 })
        // Glass sheen reflections
        g.moveTo(bx - 1.6 * sc, by - 9 * sc).lineTo(bx - 1.6 * sc, by - 2.5 * sc)
          .stroke({ width: 0.6, color: 0xffffff, alpha: 0.7 })

        // Top Metal Vacuum Cap & Gauge
        g.roundRect(bx - 2.6 * sc, by - 11.2 * sc, 5.2 * sc, 1.8 * sc, 0.4).fill({ color: metalDark }).stroke({ width: 0.6, color: palette.textNum })
        g.circle(bx + 1.2 * sc, by - 12 * sc, 0.7 * sc).fill({ color: palette.yellowNum })
      },
    })
  }

  // 4. Hexagonal Telemetry Pod (Stepped Metallic Hex Dais + Glowing Optical Prism Emitter)
  const telemetryPod = (bx: number, by: number, sc = 1) => {
    slots.push({
      y: by,
      draw: () => {
        g.ellipse(bx, by + 1, 3.6 * sc, 1.8 * sc).fill({ color: darkC, alpha: 0.35 })
        // Hexagonal Metallic Pedestal
        const hexPts: number[] = []
        for (let v = 0; v < 6; v++) {
          const va = (v * Math.PI) / 3
          hexPts.push(bx + Math.cos(va) * 3.2 * sc, by - 1.2 * sc + Math.sin(va) * 2.5 * sc)
        }
        g.poly(hexPts).fill({ color: metalDark }).stroke({ width: 0.7, color: palette.textNum })
        // Glowing circuit ring
        g.ellipse(bx, by - 1.2 * sc, 2.4 * sc, 1.3 * sc).stroke({ width: 0.6, color: primaryColor, alpha: 0.7 })

        // Central Optical Emitter Prism
        g.poly([
          bx, by - 7.5 * sc,
          bx + 1.6 * sc, by - 4.5 * sc,
          bx, by - 1.5 * sc,
          bx - 1.6 * sc, by - 4.5 * sc,
        ]).fill({ color: primaryColor, alpha: 0.95 }).stroke({ width: 0.6, color: 0xffffff })
        // Core Lens Glint
        g.circle(bx, by - 4.5 * sc, 0.8 * sc).fill({ color: 0xffffff })
      },
    })
  }

  // ─── HARMONIOUS CYBERNETIC ARRAY LAYOUT ───

  // West: Holographic Simulation Command Deck (Holo Console + Blade Server + Telemetry Pod)
  {
    const pTerminal = at(-2.2, radius * 0.78)
    holoTerminal(pTerminal.bx, pTerminal.by, 1.05)

    const pServer = at(-2.38, radius * 0.81)
    serverMonolith(pServer.bx, pServer.by, 3, 0.95)

    const pPod = at(-2.02, radius * 0.76)
    telemetryPod(pPod.bx, pPod.by, 0.95)
  }

  // East: Telemetry Uplink Array (Blade Server + Telemetry Pod + Cryo Resonator)
  {
    const pServer = at(0.15, radius * 0.78)
    serverMonolith(pServer.bx, pServer.by, 3, 1.05)

    const pPod = at(0.32, radius * 0.81)
    telemetryPod(pPod.bx, pPod.by, 1.0)

    const pCryo = at(-0.02, radius * 0.76)
    cryoResonator(pCryo.bx, pCryo.by, 0.95)
  }

  // North: Mainframe Server Monolith Bank (Twin Server Monoliths + Cryo Resonator)
  {
    const pServer1 = at(-0.89, radius * 0.83)
    serverMonolith(pServer1.bx, pServer1.by, 4, 1.0)

    const pServer2 = at(-0.61, radius * 0.83)
    serverMonolith(pServer2.bx, pServer2.by, 4, 1.0)

    const pCryo = at(-0.75, radius * 0.78)
    cryoResonator(pCryo.bx, pCryo.by, 1.05)
  }

  // South: Quantum Core Distributor (Cryo Resonator + Dual Telemetry Pods)
  {
    const pCryo = at(2.15, radius * 0.82)
    cryoResonator(pCryo.bx, pCryo.by, 1.0)

    const pPod1 = at(2.01, radius * 0.79)
    telemetryPod(pPod1.bx, pPod1.by, 0.95)

    const pPod2 = at(2.29, radius * 0.79)
    telemetryPod(pPod2.bx, pPod2.by, 0.95)
  }

  slots.sort((s1, s2) => s1.y - s2.y)
  for (const s of slots) s.draw()
}

export const simulationNexusHex: HexTypeDefinition = {
  type: 'simulation_nexus',
  title: 'Simulation Nexus',
  drawTerrainGround: drawSimulationNexusTerrainGround,
  drawInsignia: drawSimulationNexusInsignia,
  drawTerritory: drawSimulationNexusTerritory,
  createGradient: createSimulationNexusGradient,
  renderEffects: renderSimulationNexusEffects,
  getGlowColor: (palette) => palette.blueNum,
}
