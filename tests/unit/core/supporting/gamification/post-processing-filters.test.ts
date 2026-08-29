import { describe, it, expect } from 'vitest'
import {
  getGlowFilterOptions,
  getCachedGlowFilter,
} from '../../../../../src/core/supporting/gamification/components/scene-renderer'
import { getFogNoiseFilter } from '../../../../../src/core/supporting/gamification/components/node-effects'
import { getGamificationThemePalette } from '../../../../../src/core/supporting/gamification/theme-palette'

describe('getGlowFilterOptions', () => {
  const palette = getGamificationThemePalette('catppuccin')

  it('uses Frappé lavender/blue accent for the selected node glow', () => {
    const opts = getGlowFilterOptions(palette, 'selected')
    expect(opts.color).toBe(palette.lavenderNum)
    expect(opts.outerStrength).toBeGreaterThan(0)
    expect(opts.distance).toBeGreaterThan(0)
  })

  it('uses Frappé red tint for boss_lair glow', () => {
    const opts = getGlowFilterOptions(palette, 'boss_lair')
    expect(opts.color).toBe(palette.redNum)
  })

  it('uses Frappé mauve tint for capital glow', () => {
    const opts = getGlowFilterOptions(palette, 'capital')
    expect(opts.color).toBe(palette.mauveNum)
  })

  it('keeps glow quality low for GPU performance', () => {
    for (const variant of ['selected', 'boss_lair', 'capital'] as const) {
      expect(getGlowFilterOptions(palette, variant).quality).toBeLessThanOrEqual(0.25)
    }
  })
})

describe('getCachedGlowFilter', () => {
  const palette = getGamificationThemePalette('catppuccin')

  it('returns the same filter instance for repeated calls (shared across rebuilds)', () => {
    const a = getCachedGlowFilter(palette, 'selected')
    const b = getCachedGlowFilter(palette, 'selected')
    expect(a).toBe(b)
  })

  it('returns distinct instances per variant', () => {
    const selected = getCachedGlowFilter(palette, 'selected')
    const boss = getCachedGlowFilter(palette, 'boss_lair')
    const capital = getCachedGlowFilter(palette, 'capital')
    expect(selected).not.toBe(boss)
    expect(boss).not.toBe(capital)
  })
})

describe('getFogNoiseFilter', () => {
  it('returns a single shared SimplexNoiseFilter instance for all fog containers', () => {
    const a = getFogNoiseFilter()
    const b = getFogNoiseFilter()
    expect(a).toBe(b)
  })
})
