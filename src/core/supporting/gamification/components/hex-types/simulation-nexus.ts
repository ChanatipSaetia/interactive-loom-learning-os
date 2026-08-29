import { Graphics, Container, FillGradient } from 'pixi.js'
import { HEX_RADIUS } from '../hex-geometry'
import { GamificationThemePalette, getGamificationThemePalette } from '../../theme-palette'
import { HexInsigniaOptions, HexTypeDefinition, HexTypeEffectContext } from './types'

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
    gradient.addColorStop(0, palette.surface0)
    gradient.addColorStop(0.5, palette.base)
    gradient.addColorStop(1, palette.crust)
    return gradient
  }

  gradient.addColorStop(0, palette.lavender)
  gradient.addColorStop(0.45, palette.blue)
  gradient.addColorStop(1, palette.crust)
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

export const simulationNexusHex: HexTypeDefinition = {
  type: 'simulation_nexus',
  title: 'Simulation Nexus',
  drawTerrainGround: drawSimulationNexusTerrainGround,
  drawInsignia: drawSimulationNexusInsignia,
  createGradient: createSimulationNexusGradient,
  renderEffects: renderSimulationNexusEffects,
  getGlowColor: (palette) => palette.blueNum,
}
