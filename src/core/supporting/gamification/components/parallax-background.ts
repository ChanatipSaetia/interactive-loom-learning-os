import { Container, Graphics } from 'pixi.js'
import { GamificationThemePalette } from '../theme-palette'

/**
 * Ambient parallax dust/star field rendered behind the hex campaign map.
 * The layer translates at a reduced factor relative to map pan, creating a
 * subtle sense of depth between the background and the campaign topology.
 */

export const PARALLAX_PARTICLE_COUNT = 60
export const PARALLAX_FACTOR = 0.25
export const PARALLAX_SPREAD_FACTOR = 2 // particle field spans 2x the viewport in each axis

export interface ParallaxParticle {
  x: number
  y: number
  radius: number
  alpha: number
  colorIndex: number
}

/** Frappé dust palette: muted surface0 / subtext tones only — never accent colors. */
export function getParallaxParticleColors(palette: GamificationThemePalette): number[] {
  return [palette.surface0Num, palette.subtext0Num, palette.subtext1Num]
}

/** Background layer offset: pan scaled down by the parallax factor. */
export function computeParallaxOffset(
  pan: { x: number; y: number },
  factor: number = PARALLAX_FACTOR,
): { x: number; y: number } {
  return { x: pan.x * factor, y: pan.y * factor }
}

/** Deterministic PRNG (mulberry32) so particle layouts are stable across rebuilds. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Generate a capped, deterministic particle field centered on (0, 0), spread
 * wide enough (2x viewport) that panning never exposes an empty edge.
 */
export function generateParallaxParticles(
  width: number,
  height: number,
  count: number = PARALLAX_PARTICLE_COUNT,
  seed = 1337,
): ParallaxParticle[] {
  const capped = Math.min(count, PARALLAX_PARTICLE_COUNT)
  const rand = mulberry32(seed)
  const spreadX = width * PARALLAX_SPREAD_FACTOR
  const spreadY = height * PARALLAX_SPREAD_FACTOR
  const particles: ParallaxParticle[] = []

  for (let i = 0; i < capped; i++) {
    particles.push({
      x: (rand() - 0.5) * spreadX,
      y: (rand() - 0.5) * spreadY,
      radius: 0.6 + rand() * 1.6,
      alpha: 0.12 + rand() * 0.28,
      colorIndex: Math.floor(rand() * 3) % 3,
    })
  }
  return particles
}

/**
 * Build the parallax layer as a single Graphics batch (one draw call for all
 * particles) inside a container meant to sit behind the map container.
 */
export function createParallaxBackground(
  palette: GamificationThemePalette,
  width: number,
  height: number,
): Container {
  const colors = getParallaxParticleColors(palette)
  const gfx = new Graphics()
  for (const p of generateParallaxParticles(width, height)) {
    gfx.circle(p.x, p.y, p.radius).fill({ color: colors[p.colorIndex], alpha: p.alpha })
  }
  const layer = new Container()
  layer.addChild(gfx)
  layer.zIndex = -1
  return layer
}
