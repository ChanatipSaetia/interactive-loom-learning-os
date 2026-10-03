import type { ColorMatrix } from 'pixi.js'

export const IDENTITY_MATRIX: ColorMatrix = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]

// Luminance-preserving red/desaturated tint: full luminance into red, green-
// luminance into green, and a suppressed green-luminance into blue, which
// pushes the desaturated image toward an ominous crimson cast.
export const CHAOS_TINT_MATRIX: ColorMatrix = [
  0.2126, 0.7152, 0.0722, 0, 0,
  0.085, 0.2861, 0.0289, 0, 0,
  0.085, 0.2861, 0.0289, 0, 0,
  0, 0, 0, 1, 0,
]

// Tint strength is capped at ~35% so the map stays readable at max chaos.
export const MAX_CHAOS_TINT_STRENGTH = 0.35

/**
 * Linearly interpolates between the identity and chaos tint matrices based on
 * a campaign chaos level (0–100). Returns the chaos tint strength in [0,
 * MAX_CHAOS_TINT_STRENGTH] scaled proportionally to the (clamped) level.
 */
export function computeChaosTintStrength(level: number): number {
  const clamped = Math.min(100, Math.max(0, level))
  return (clamped / 100) * MAX_CHAOS_TINT_STRENGTH
}

export function computeChaosTintMatrix(level: number): ColorMatrix {
  const t = computeChaosTintStrength(level)
  return IDENTITY_MATRIX.map((v, i) => v + (CHAOS_TINT_MATRIX[i] - v) * t) as ColorMatrix
}
