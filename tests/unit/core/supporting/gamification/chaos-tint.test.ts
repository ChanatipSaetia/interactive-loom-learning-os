import { describe, it, expect } from 'vitest'
import {
  IDENTITY_MATRIX,
  CHAOS_TINT_MATRIX,
  MAX_CHAOS_TINT_STRENGTH,
  computeChaosTintStrength,
  computeChaosTintMatrix,
} from '../../../../../src/core/supporting/gamification/components/chaos-tint'

describe('computeChaosTintStrength', () => {
  it('returns 0 at chaos level 0', () => {
    expect(computeChaosTintStrength(0)).toBe(0)
  })

  it('scales proportionally in the middle range', () => {
    expect(computeChaosTintStrength(50)).toBeCloseTo(MAX_CHAOS_TINT_STRENGTH / 2)
    expect(computeChaosTintStrength(20)).toBeCloseTo(MAX_CHAOS_TINT_STRENGTH * 0.2)
  })

  it('caps at MAX_CHAOS_TINT_STRENGTH (~35%) at chaos level 100', () => {
    expect(MAX_CHAOS_TINT_STRENGTH).toBeCloseTo(0.35)
    expect(computeChaosTintStrength(100)).toBeCloseTo(MAX_CHAOS_TINT_STRENGTH)
  })

  it('clamps out-of-range levels into [0, 100]', () => {
    expect(computeChaosTintStrength(-20)).toBe(0)
    expect(computeChaosTintStrength(150)).toBeCloseTo(MAX_CHAOS_TINT_STRENGTH)
  })
})

describe('computeChaosTintMatrix', () => {
  it('produces a 20-element matrix', () => {
    expect(computeChaosTintMatrix(37)).toHaveLength(20)
  })

  it('equals the identity matrix at chaos level 0', () => {
    const m = computeChaosTintMatrix(0)
    m.forEach((v, i) => expect(v).toBeCloseTo(IDENTITY_MATRIX[i], 10))
  })

  it('equals the full chaos tint matrix at chaos level 100', () => {
    const m = computeChaosTintMatrix(100)
    m.forEach((v, i) => expect(v).toBeCloseTo(
      IDENTITY_MATRIX[i] + (CHAOS_TINT_MATRIX[i] - IDENTITY_MATRIX[i]) * MAX_CHAOS_TINT_STRENGTH,
      10,
    ))
  })

  it('linearly interpolates between identity and chaos tint at mid chaos', () => {
    const m = computeChaosTintMatrix(50)
    const t = MAX_CHAOS_TINT_STRENGTH / 2
    m.forEach((v, i) => {
      expect(v).toBeCloseTo(IDENTITY_MATRIX[i] + (CHAOS_TINT_MATRIX[i] - IDENTITY_MATRIX[i]) * t, 10)
    })
  })

  it('keeps the alpha translation row unchanged at every level', () => {
    for (const level of [0, 25, 60, 100]) {
      const row = computeChaosTintMatrix(level).slice(15, 20)
      expect(row).toEqual([0, 0, 0, 1, 0])
    }
  })

  it('boosts red channel above blue channel (red/desaturated cast)', () => {
    const m = computeChaosTintMatrix(100)
    // R output row luminance weights > B output row weights
    expect(m[0] + m[1] + m[2]).toBeGreaterThan(m[10] + m[11] + m[12])
  })
})
