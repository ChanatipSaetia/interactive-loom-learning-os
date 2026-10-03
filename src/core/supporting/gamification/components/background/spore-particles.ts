import { Graphics } from 'pixi.js'
import { GamificationThemePalette } from '../../theme-palette'
import { ParallaxParticle } from './types'

export const PARALLAX_PARTICLE_COUNT = 60
export const PARALLAX_FACTOR = 0.25
export const PARALLAX_SPREAD_FACTOR = 1.35

export function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function getParallaxParticleColors(palette: GamificationThemePalette): number[] {
  return [palette.surface0Num, palette.subtext0Num, palette.subtext1Num]
}

export function computeParallaxOffset(
  pan: { x: number; y: number },
  factor: number = PARALLAX_FACTOR,
): { x: number; y: number } {
  return {
    x: pan.x * factor,
    y: pan.y * factor,
  }
}

export function generateParallaxParticles(
  width: number,
  height: number,
  seed: number = 1337,
  palette?: GamificationThemePalette,
): ParallaxParticle[] {
  const rand = mulberry32(seed)
  const spreadW = width * PARALLAX_SPREAD_FACTOR
  const spreadH = height * PARALLAX_SPREAD_FACTOR
  const colors = palette ? getParallaxParticleColors(palette) : [0x414559, 0xa5adce, 0xb5bfe2]

  const particles: ParallaxParticle[] = []
  for (let i = 0; i < PARALLAX_PARTICLE_COUNT; i++) {
    const x = (rand() - 0.5) * spreadW
    const y = (rand() - 0.5) * spreadH
    const radius = 2.4 + rand() * 2.2
    const alpha = 0.15 + rand() * 0.25
    const color = colors[Math.floor(rand() * colors.length)]
    const speedX = (rand() - 0.5) * 0.3 + 0.15
    const speedY = (rand() - 0.5) * 0.2
    const phase = rand() * Math.PI * 2

    particles.push({ x, y, radius, alpha, color, speedX, speedY, phase })
  }
  return particles
}

export function drawSporeParticles(
  g: Graphics,
  particles: ParallaxParticle[],
  time: number = 0,
) {
  g.clear()
  for (const p of particles) {
    const driftX = p.x + Math.sin(time * 0.8 + (p.phase || 0)) * 6
    const driftY = p.y + Math.cos(time * 0.6 + (p.phase || 0)) * 5
    const breathingAlpha = p.alpha * (0.8 + Math.sin(time * 1.2 + (p.phase || 0)) * 0.2)

    // Soft outer ambient halo + smooth inner core
    g.circle(driftX, driftY, p.radius * 1.6).fill({
      color: p.color,
      alpha: Math.max(0.02, Math.min(0.2, breathingAlpha * 0.35)),
    })
    g.circle(driftX, driftY, p.radius).fill({
      color: p.color,
      alpha: Math.max(0.05, Math.min(1, breathingAlpha)),
    })
  }
}
