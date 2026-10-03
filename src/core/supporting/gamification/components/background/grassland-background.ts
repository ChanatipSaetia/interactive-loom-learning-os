import { Graphics } from 'pixi.js'
import { GamificationThemePalette, getGamificationThemePalette } from '../../theme-palette'
import {
  AstrolabeRing,
  CartographyGridConfig,
  StardustParticle,
  GrassTuft,
  TerrainContourPatch,
} from './types'
import { mulberry32, PARALLAX_SPREAD_FACTOR } from './spore-particles'

// ─── Tactical Astrolabe Celestial Spheres ───

export function generateAstrolabeRings(
  _width: number,
  _height: number,
  palette: GamificationThemePalette = getGamificationThemePalette(),
): AstrolabeRing[] {
  return [
    // Outer Celestial Equator Ring with 24 hour ticks (Luminous Lavender)
    {
      radius: 410,
      strokeWidth: 1.5,
      color: palette.lavenderNum,
      alpha: 0.28,
      hasTicks: true,
      tickCount: 24,
      tickLength: 8,
      rotationSpeed: 0.008,
      phase: 0,
    },
    // Ecliptic / Horizon Ring (Luminous Sky Blue)
    {
      radius: 310,
      strokeWidth: 1.3,
      color: palette.skyNum,
      alpha: 0.26,
      hasTicks: true,
      tickCount: 16,
      tickLength: 6,
      rotationSpeed: -0.012,
      phase: Math.PI / 6,
    },
    // Meridian Latitude Ring (Radiant Blue)
    {
      radius: 210,
      strokeWidth: 1.1,
      color: palette.blueNum,
      alpha: 0.30,
      hasTicks: true,
      tickCount: 12,
      tickLength: 5,
      rotationSpeed: 0.015,
      phase: Math.PI / 4,
    },
    // Inner Astrolabe Nexus Ring (Radiant Sapphire)
    {
      radius: 110,
      strokeWidth: 1.0,
      color: palette.sapphireNum,
      alpha: 0.32,
      hasTicks: true,
      tickCount: 8,
      tickLength: 4,
      rotationSpeed: -0.018,
      phase: 0,
    },
    // Concentric subtle target center (Luminous Rosewater)
    {
      radius: 45,
      strokeWidth: 1.0,
      color: palette.rosewaterNum,
      alpha: 0.35,
      rotationSpeed: 0,
      phase: 0,
    },
  ]
}

export function generateCartographyGrid(
  palette: GamificationThemePalette = getGamificationThemePalette(),
): CartographyGridConfig {
  return {
    spacing: 75,
    gridColor: palette.surface0Num,
    gridAlpha: 0.24,
    crosshairSize: 5,
    showAxes: true,
  }
}

export function generateStardust(
  width: number,
  height: number,
  palette: GamificationThemePalette = getGamificationThemePalette(),
  seed: number = 1337,
): StardustParticle[] {
  const rand = mulberry32(seed)
  const spreadW = width * PARALLAX_SPREAD_FACTOR
  const spreadH = height * PARALLAX_SPREAD_FACTOR
  const particles: StardustParticle[] = []

  const starColors = [
    palette.lavenderNum,
    palette.blueNum,
    palette.sapphireNum,
    palette.rosewaterNum,
    palette.textNum,
  ]

  const count = 56
  for (let i = 0; i < count; i++) {
    const x = (rand() - 0.5) * spreadW
    const y = (rand() - 0.5) * spreadH
    const radius = 1.0 + rand() * 1.6
    const alpha = 0.25 + rand() * 0.45
    const color = starColors[Math.floor(rand() * starColors.length)]
    const twinkleSpeed = 0.8 + rand() * 1.5
    const phase = rand() * Math.PI * 2
    particles.push({ x, y, radius, alpha, color, twinkleSpeed, phase })
  }

  return particles
}

// ─── Drawing Routines ───

export function drawAstrolabe(
  g: Graphics,
  rings: AstrolabeRing[],
  time: number = 0,
  palette: GamificationThemePalette = getGamificationThemePalette(),
) {
  g.clear()

  // 1. Draw Cardinal & Diagonal Axes (Compass Crosshairs)
  const axisLen = 440
  const axesAngle = time * 0.005

  // Primary Cardinal Axis (N-S & E-W)
  for (let i = 0; i < 4; i++) {
    const angle = axesAngle + (i * Math.PI) / 2
    const x1 = Math.cos(angle) * 35
    const y1 = Math.sin(angle) * 35
    const x2 = Math.cos(angle) * axisLen
    const y2 = Math.sin(angle) * axisLen

    g.moveTo(x1, y1)
      .lineTo(x2, y2)
      .stroke({ width: 1.0, color: palette.surface1Num, alpha: 0.18 })

    // Cardinal Diamond Markers at Axis Tips
    const dx = Math.cos(angle) * axisLen
    const dy = Math.sin(angle) * axisLen
    g.poly([
      dx, dy - 3,
      dx + 3, dy,
      dx, dy + 3,
      dx - 3, dy,
    ]).fill({ color: palette.lavenderNum, alpha: 0.35 })
  }

  // 2. Draw Concentric Glowing Astrolabe Spheres and Degree Ticks
  for (const ring of rings) {
    const ringAngle = (ring.phase ?? 0) + time * (ring.rotationSpeed ?? 0)
    const ringPulse = Math.sin(time * 1.4 + (ring.phase ?? 0)) * 0.06
    const baseAlpha = Math.max(0.1, ring.alpha + ringPulse)

    // Layer 1: Outer diffuse ethereal glow aura
    g.circle(0, 0, ring.radius).stroke({
      width: ring.strokeWidth + 5.5,
      color: ring.color,
      alpha: baseAlpha * 0.24,
    })

    // Layer 2: Mid-tier luminous halo
    g.circle(0, 0, ring.radius).stroke({
      width: ring.strokeWidth + 2.5,
      color: ring.color,
      alpha: baseAlpha * 0.42,
    })

    // Layer 3: Crisp high-contrast celestial core ring
    g.circle(0, 0, ring.radius).stroke({
      width: ring.strokeWidth,
      color: ring.color,
      alpha: baseAlpha * 1.15,
    })

    // Rotating Degree / Hour Ticks with luminous tips
    if (ring.hasTicks && ring.tickCount) {
      const tickLen = ring.tickLength ?? 6
      for (let t = 0; t < ring.tickCount; t++) {
        const tickAngle = ringAngle + (t * Math.PI * 2) / ring.tickCount
        const innerR = ring.radius - tickLen / 2
        const outerR = ring.radius + tickLen / 2

        // Soft tick glow
        g.moveTo(Math.cos(tickAngle) * innerR, Math.sin(tickAngle) * innerR)
          .lineTo(Math.cos(tickAngle) * outerR, Math.sin(tickAngle) * outerR)
          .stroke({ width: ring.strokeWidth + 2.0, color: ring.color, alpha: baseAlpha * 0.35 })

        // Crisp tick stroke
        g.moveTo(Math.cos(tickAngle) * innerR, Math.sin(tickAngle) * innerR)
          .lineTo(Math.cos(tickAngle) * outerR, Math.sin(tickAngle) * outerR)
          .stroke({ width: ring.strokeWidth, color: ring.color, alpha: baseAlpha * 1.3 })
      }
    }
  }
}

export function drawCartographyGrid(
  g: Graphics,
  width: number,
  height: number,
  palette: GamificationThemePalette = getGamificationThemePalette(),
) {
  g.clear()

  const spreadW = width * PARALLAX_SPREAD_FACTOR
  const spreadH = height * PARALLAX_SPREAD_FACTOR
  const halfW = spreadW / 2
  const halfH = spreadH / 2
  const spacing = 80
  const crossSize = 3.5

  // Draw fine coordinate grid crosshair matrix
  for (let x = -halfW + (halfW % spacing); x <= halfW; x += spacing) {
    for (let y = -halfH + (halfH % spacing); y <= halfH; y += spacing) {
      g.moveTo(x - crossSize, y)
        .lineTo(x + crossSize, y)
        .stroke({ width: 0.8, color: palette.surface0Num, alpha: 0.28 })

      g.moveTo(x, y - crossSize)
        .lineTo(x, y + crossSize)
        .stroke({ width: 0.8, color: palette.surface0Num, alpha: 0.28 })
    }
  }
}

export function drawStardust(g: Graphics, particles: StardustParticle[], time: number = 0) {
  g.clear()

  for (const p of particles) {
    const twinkleSpeed = p.twinkleSpeed ?? 1.0
    const phase = p.phase ?? 0
    const twinkle = Math.sin(time * twinkleSpeed + phase)
    const currentAlpha = Math.max(0.1, p.alpha + twinkle * 0.15)
    const currentRadius = p.radius + twinkle * 0.25

    // Outer soft celestial halo
    g.circle(p.x, p.y, currentRadius * 1.8).fill({
      color: p.color,
      alpha: currentAlpha * 0.25,
    })

    // Crisp star core
    g.circle(p.x, p.y, currentRadius).fill({
      color: p.color,
      alpha: currentAlpha,
    })
  }
}

// ─── Backward Compatibility Aliases for Existing Imports & Tests ───

export function generateGrassTufts(
  width: number,
  height: number,
  palette: GamificationThemePalette = getGamificationThemePalette(),
  seed: number = 2024,
): GrassTuft[] {
  // Deterministic adapter for test compatibility
  const rand = mulberry32(seed)
  return Array.from({ length: 8 }, (_, i) => ({
    x: (rand() - 0.5) * width,
    y: (rand() - 0.5) * height,
    blades: [{ length: 10, baseAngle: 0, width: 1.5, color: palette.surface0Num }],
    phase: i,
  }))
}

export function generateTerrainContours(
  width: number,
  height: number,
  palette: GamificationThemePalette = getGamificationThemePalette(),
  _seed: number = 777,
): TerrainContourPatch[] {
  return [
    {
      points: [
        { x: -width / 2, y: -height / 2 },
        { x: width / 2, y: -height / 2 },
        { x: width / 2, y: height / 2 },
        { x: -width / 2, y: height / 2 },
      ],
      color: palette.mantleNum,
      alpha: 0.1,
    },
  ]
}

export function drawGrassTufts(
  g: Graphics,
  _tufts: GrassTuft[],
  time: number = 0,
  palette: GamificationThemePalette = getGamificationThemePalette(),
) {
  // Delegated to astrolabe rendering
  const rings = generateAstrolabeRings(880, 580, palette)
  drawAstrolabe(g, rings, time, palette)
}

export function drawTerrainContours(g: Graphics, _patches: TerrainContourPatch[]) {
  // Clear or render fine base tone
  g.clear()
}

