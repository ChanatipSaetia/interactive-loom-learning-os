import { Application, Container, Graphics } from 'pixi.js'
import { GamificationThemePalette } from '../theme-palette'
import { ItemReward } from '../types'
import { getStarVertices } from './hex-geometry'

export const BOSS_ATTACK_DURATION = 3.8 // Total animation duration in seconds

export interface BossBeamAttackOptions {
  app?: Application | null
  stage: Container
  bossPixel: { x: number; y: number }
  inventory: ItemReward[]
  palette: GamificationThemePalette
  onComplete?: () => void
  duration?: number
}

/**
 * Calculates 2.5D isometric orbit coordinates around a focal center.
 */
export function computeOrbitPosition(
  cx: number,
  cy: number,
  angle: number,
  radius: number,
  isoScale = 0.88
): { x: number; y: number } {
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * (radius * isoScale),
  }
}

/**
 * Draws a glowing, sparkling Key Artifact with runic starburst, key bit, and energy coronas.
 */
export function drawKeyArtifact(
  g: Graphics,
  x: number,
  y: number,
  angle: number,
  color: number,
  coreColor: number,
  scale = 1.0
) {
  // 1. Soft Outermost Radiant Halo
  g.ellipse(x, y, 22 * scale, 18 * scale).fill({
    color,
    alpha: 0.28,
  })
  g.ellipse(x, y, 14 * scale, 12 * scale).fill({
    color,
    alpha: 0.55,
  })

  // 2. Spinning 8-Point Starburst Corona
  const starVerts = getStarVertices(x, y, 8, 12 * scale, 5 * scale)
  if (starVerts.length > 0) {
    g.poly(starVerts).fill({ color: coreColor, alpha: 0.75 })
  }

  // 3. 2.5D Key Glyph (Orb Ring + Shaft + Teeth)
  const fx = Math.cos(angle)
  const fy = Math.sin(angle)
  const sx = -fy
  const sy = fx

  // Key Bow (Ring)
  g.ellipse(x - fx * 5 * scale, y - fy * 5 * scale, 6 * scale, 4.5 * scale)
    .fill({ color })
    .stroke({ width: 1.2 * scale, color: coreColor })
  g.ellipse(x - fx * 5 * scale, y - fy * 5 * scale, 3 * scale, 2.2 * scale)
    .fill({ color: 0x000000, alpha: 0.3 })

  // Key Shaft
  g.moveTo(x - fx * 2 * scale, y - fy * 2 * scale)
    .lineTo(x + fx * 8 * scale, y + fy * 8 * scale)
    .stroke({ width: 2.2 * scale, color: coreColor })

  // Key Bits / Teeth
  g.moveTo(x + fx * 5 * scale, y + fy * 5 * scale)
    .lineTo(x + fx * 5 * scale + sx * 3.5 * scale, y + fy * 5 * scale + sy * 3.5 * scale)
    .stroke({ width: 1.8 * scale, color: coreColor })
  g.moveTo(x + fx * 7 * scale, y + fy * 7 * scale)
    .lineTo(x + fx * 7 * scale + sx * 2.8 * scale, y + fy * 7 * scale + sy * 2.8 * scale)
    .stroke({ width: 1.8 * scale, color: coreColor })

  // 4. Ultra-Bright Incandescent Core
  g.circle(x, y, 3.2 * scale).fill({ color: 0xffffff, alpha: 0.95 })
}

/**
 * Draws the celestial Singularity Core where key artifacts fuse and concentrate energy.
 */
export function drawSingularityCore(
  g: Graphics,
  x: number,
  y: number,
  time: number,
  intensity: number,
  palette: GamificationThemePalette
) {
  const pulse = Math.sin(time * 20) * 0.2 + 1.0
  const size = 18 * intensity * pulse

  // Accretion Glow
  g.ellipse(x, y, size * 2.2, size * 1.8).fill({
    color: palette.yellowNum,
    alpha: 0.35 * intensity,
  })
  g.ellipse(x, y, size * 1.5, size * 1.2).fill({
    color: palette.peachNum,
    alpha: 0.65 * intensity,
  })

  // Pulsing Core
  g.ellipse(x, y, size * 0.9, size * 0.75).fill({
    color: 0xffffff,
    alpha: 0.95,
  })

  // Crackling Lightning / Energy Arcs (4 random discharge prongs)
  for (let i = 0; i < 6; i++) {
    const prongAngle = (i * Math.PI) / 3 + time * 12 + i
    const dist = size * (1.2 + 0.6 * Math.sin(time * 30 + i * 2))
    const px = x + Math.cos(prongAngle) * dist
    const py = y + Math.sin(prongAngle) * dist * 0.88
    const mx = (x + px) / 2 + Math.sin(time * 40 + i) * 6
    const my = (y + py) / 2 + Math.cos(time * 40 + i) * 6

    g.moveTo(x, y)
      .lineTo(mx, my)
      .lineTo(px, py)
      .stroke({ width: 1.2 * intensity, color: i % 2 === 0 ? palette.sapphireNum : 0xffffff, alpha: 0.85 })
  }
}

/**
 * Draws the massive Celestial Strike Beam shooting from the fusion singularity directly into the Boss Dragon.
 */
export function drawCelestialBeam(
  g: Graphics,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  progress: number, // 0 to 1
  palette: GamificationThemePalette,
  time: number
) {
  const p = Math.min(1, Math.max(0, progress))
  const beamEndProgress = Math.min(1, p * 3) // beam tip reaches target quickly in first 33%
  const currentToX = fromX + (toX - fromX) * beamEndProgress
  const currentToY = fromY + (toY - fromY) * beamEndProgress

  const dx = currentToX - fromX
  const dy = currentToY - fromY
  const len = Math.hypot(dx, dy)
  if (len < 1) return

  const angle = Math.atan2(dy, dx)
  const sx = -Math.sin(angle)
  const sy = Math.cos(angle)

  // Beam sustained power pulse
  const beamPower = Math.sin(p * Math.PI) // ease-in-out envelope
  const wave = Math.sin(time * 35) * 3

  // 1. Wide Chromatic Atmospheric Bloom
  g.moveTo(fromX + sx * (24 * beamPower + wave), fromY + sy * (24 * beamPower + wave))
    .lineTo(currentToX + sx * (28 * beamPower + wave), currentToY + sy * (28 * beamPower + wave))
    .lineTo(currentToX - sx * (28 * beamPower + wave), currentToY - sy * (28 * beamPower + wave))
    .lineTo(fromX - sx * (24 * beamPower + wave), fromY - sy * (24 * beamPower + wave))
    .closePath()
    .fill({ color: palette.yellowNum, alpha: 0.28 * beamPower })

  // 2. High-Energy Violet/Peach Outer Sheath
  g.moveTo(fromX + sx * (14 * beamPower), fromY + sy * (14 * beamPower))
    .lineTo(currentToX + sx * (17 * beamPower), currentToY + sy * (17 * beamPower))
    .lineTo(currentToX - sx * (17 * beamPower), currentToY - sy * (17 * beamPower))
    .lineTo(fromX - sx * (14 * beamPower), fromY - sy * (14 * beamPower))
    .closePath()
    .fill({ color: palette.peachNum, alpha: 0.55 * beamPower })

  // 3. Radiant Laser Core
  g.moveTo(fromX + sx * (7 * beamPower), fromY + sy * (7 * beamPower))
    .lineTo(currentToX + sx * (9 * beamPower), currentToY + sy * (9 * beamPower))
    .lineTo(currentToX - sx * (9 * beamPower), currentToY - sy * (9 * beamPower))
    .lineTo(fromX - sx * (7 * beamPower), fromY - sy * (7 * beamPower))
    .closePath()
    .fill({ color: 0xffffff, alpha: 0.95 * beamPower })

  // 4. Helical Containment Rings Spiraling down the beam cylinder
  const ringCount = 8
  for (let r = 0; r < ringCount; r++) {
    const ringT = (r / ringCount + time * 2.5) % 1
    if (ringT > beamEndProgress) continue
    const rx = fromX + dx * ringT
    const ry = fromY + dy * ringT
    const ringWidth = (14 + Math.sin(ringT * Math.PI) * 8) * beamPower
    const ringHeight = 5 * beamPower

    g.ellipse(rx, ry, ringWidth, ringHeight)
      .stroke({ width: 1.5, color: palette.sapphireNum, alpha: 0.75 * beamPower })
  }

  // 5. Plasma Impact Point on the Boss
  if (beamEndProgress >= 0.95) {
    const impactScale = (1.0 + Math.sin(time * 30) * 0.3) * beamPower
    // Ground burst
    g.ellipse(toX, toY, 35 * impactScale, 20 * impactScale).fill({
      color: palette.yellowNum,
      alpha: 0.45 * beamPower,
    })
    g.ellipse(toX, toY, 20 * impactScale, 12 * impactScale).fill({
      color: 0xffffff,
      alpha: 0.85 * beamPower,
    })

    // Shockwave Rings expanding outward from impact
    for (let sw = 0; sw < 3; sw++) {
      const swProgress = (p * 4 + sw * 0.33) % 1
      const swRadius = 15 + swProgress * 65
      g.ellipse(toX, toY, swRadius, swRadius * 0.88).stroke({
        width: Math.max(0.5, 3 * (1 - swProgress)),
        color: palette.peachNum,
        alpha: (1 - swProgress) * 0.75 * beamPower,
      })
    }

    // High velocity sparks
    for (let s = 0; s < 12; s++) {
      const sparkAngle = (s * Math.PI) / 6 + time * 15 + s
      const sparkDist = (20 + (s * 7) % 35) * impactScale
      const spx = toX + Math.cos(sparkAngle) * sparkDist
      const spy = toY + Math.sin(sparkAngle) * sparkDist * 0.88
      g.circle(spx, spy, 1.4 * impactScale).fill({ color: 0xffffff, alpha: 0.9 })
    }
  }
}

/**
 * Triggers the cinematic Boss Key Attack Animation:
 * 1. 2 Key artifacts orbit the Boss Lair with accelerating rotational speed (0 - 1.5s).
 * 2. Key artifacts spiral inwards and combine into a dense Singularity Core (1.5 - 2.3s).
 * 3. Singularity unleashes a massive Celestial Strike Beam blasting the Boss Dragon (2.3 - 3.4s).
 * 4. Supernova shockwaves shatter the boss encounter and triggers onComplete (3.4 - 3.8s).
 */
export function triggerBossBeamAttackAnimation(opts: BossBeamAttackOptions): Container {
  const duration = opts.duration ?? BOSS_ATTACK_DURATION
  const fxContainer = new Container()
  fxContainer.eventMode = 'none'
  fxContainer.zIndex = 9999
  opts.stage.addChild(fxContainer)

  const gfx = new Graphics()
  fxContainer.addChild(gfx)

  const startTime = performance.now() * 0.001
  const bossX = opts.bossPixel.x
  const bossY = opts.bossPixel.y
  // Singularity focal point rests 120px above the boss hex
  const focusX = bossX
  const focusY = bossY - 120

  const key1Color = opts.palette.yellowNum
  const key2Color = opts.palette.peachNum

  let isFinished = false

  const updateFrame = () => {
    if (fxContainer.destroyed) return
    const now = performance.now() * 0.001
    const elapsed = now - startTime
    const totalProgress = Math.min(1, elapsed / duration)

    gfx.clear()

    // ─── PHASE 1: KEY ARTIFACTS ORBIT & MANIFESTATION (0.0s – 1.5s) ───
    if (elapsed < 1.5) {
      const p1 = elapsed / 1.5
      // Radius starts at 85px and gently pulls into 65px
      const radius = 85 - 20 * p1
      // Accelerating angular spin
      const angle = p1 * 9.0 + (p1 * p1) * 6.0
      const pos1 = computeOrbitPosition(focusX, focusY, angle, radius)
      const pos2 = computeOrbitPosition(focusX, focusY, angle + Math.PI, radius)

      // Orbit guide ring
      gfx.ellipse(focusX, focusY, radius, radius * 0.88).stroke({
        width: 1.0,
        color: opts.palette.surface2Num,
        alpha: 0.35 * p1,
      })

      // Draw Key Artifact 1 & 2
      drawKeyArtifact(gfx, pos1.x, pos1.y, angle, key1Color, 0xffffff, Math.min(1.2, p1 * 1.3))
      drawKeyArtifact(gfx, pos2.x, pos2.y, angle + Math.PI, key2Color, 0xffffff, Math.min(1.2, p1 * 1.3))
    }

    // ─── PHASE 2: CONVERGENCE & SINGULARITY FUSION (1.5s – 2.3s) ───
    else if (elapsed < 2.3) {
      const p2 = (elapsed - 1.5) / 0.8
      const radius = 65 * Math.pow(1 - p2, 1.5)
      const spin = 15.0 + elapsed * 18.0
      const pos1 = computeOrbitPosition(focusX, focusY, spin, radius)
      const pos2 = computeOrbitPosition(focusX, focusY, spin + Math.PI, radius)

      // Draw contracting keys
      if (radius > 4) {
        drawKeyArtifact(gfx, pos1.x, pos1.y, spin, key1Color, 0xffffff, 1.2 * (1 - p2 * 0.5))
        drawKeyArtifact(gfx, pos2.x, pos2.y, spin + Math.PI, key2Color, 0xffffff, 1.2 * (1 - p2 * 0.5))
      }

      // Singularity core blooms
      drawSingularityCore(gfx, focusX, focusY, elapsed, p2, opts.palette)
    }

    // ─── PHASE 3: CELESTIAL STRIKE BEAM BLAST (2.3s – 3.4s) ───
    else if (elapsed < 3.4) {
      const p3 = (elapsed - 2.3) / 1.1
      // Sustained singularity core
      drawSingularityCore(gfx, focusX, focusY, elapsed, 1.0, opts.palette)
      // Massive laser beam from focal point straight into the Boss Dragon!
      drawCelestialBeam(gfx, focusX, focusY, bossX, bossY, p3, opts.palette, elapsed)
    }

    // ─── PHASE 4: SUPERNOVA RESOLUTION (3.4s – 3.8s) ───
    else {
      const p4 = (elapsed - 3.4) / 0.4
      const novaRadius = 20 + p4 * 120
      // Supernova blast wave
      gfx.ellipse(bossX, bossY, novaRadius, novaRadius * 0.88).stroke({
        width: Math.max(0.5, 5 * (1 - p4)),
        color: opts.palette.yellowNum,
        alpha: (1 - p4) * 0.9,
      })
      gfx.ellipse(bossX, bossY, novaRadius * 0.6, novaRadius * 0.6 * 0.88).fill({
        color: 0xffffff,
        alpha: (1 - p4) * 0.6,
      })
    }

    // Loop continuation or completion
    if (totalProgress < 1.0) {
      requestAnimationFrame(updateFrame)
    } else if (!isFinished) {
      isFinished = true
      try {
        opts.onComplete?.()
      } finally {
        if (!fxContainer.destroyed) {
          fxContainer.destroy({ children: true })
        }
      }
    }
  }

  requestAnimationFrame(updateFrame)
  return fxContainer
}
