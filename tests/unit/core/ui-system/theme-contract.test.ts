import { describe, expect, it } from 'vitest'
import {
  CTP,
  DEFAULT_THEME_TOKENS,
} from '../../../../src/core/ui-system/ThemeContract'

describe('ThemeContract', () => {
  it('exports CTP palette with all 27 Catppuccin Frappé colors', () => {
    const expectedKeys = [
      'rosewater', 'flamingo', 'pink', 'mauve', 'red', 'maroon', 'peach',
      'yellow', 'green', 'teal', 'sky', 'sapphire', 'blue', 'lavender',
      'text', 'subtext1', 'subtext0', 'overlay2', 'overlay1', 'overlay0',
      'surface2', 'surface1', 'surface0', 'base', 'mantle', 'crust',
    ]
    expect(Object.keys(CTP)).toHaveLength(expectedKeys.length)
    for (const key of expectedKeys) {
      expect(CTP[key as keyof typeof CTP]).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('DEFAULT_THEME_TOKENS has all required fields', () => {
    expect(DEFAULT_THEME_TOKENS.ctp).toBe(CTP)
    expect(DEFAULT_THEME_TOKENS.background).toBe('var(--ctp-base)')
    expect(DEFAULT_THEME_TOKENS.foreground).toBe('var(--ctp-text)')
    expect(DEFAULT_THEME_TOKENS.primary).toBe('var(--ctp-blue)')
    expect(DEFAULT_THEME_TOKENS.spacing.sm).toBe('8px')
    expect(DEFAULT_THEME_TOKENS.spacing.xl).toBe('24px')
    expect(DEFAULT_THEME_TOKENS.radius.md).toBe('16px')
    expect(DEFAULT_THEME_TOKENS.typography.body).toBe('16px / 1.5 0')
  })

  it('CTP blue matches Catppuccin Frappé blue (#8caaee)', () => {
    expect(CTP.blue).toBe('#8caaee')
  })

  it('CTP base matches Catppuccin Frappé base (#303446)', () => {
    expect(CTP.base).toBe('#303446')
  })

  it('spacing follows 8px base grid', () => {
    expect(DEFAULT_THEME_TOKENS.spacing.xxs).toBe('2px')
    expect(DEFAULT_THEME_TOKENS.spacing.xs).toBe('6px')
    expect(DEFAULT_THEME_TOKENS.spacing.sm).toBe('8px')
    expect(DEFAULT_THEME_TOKENS.spacing.md).toBe('12px')
    expect(DEFAULT_THEME_TOKENS.spacing.lg).toBe('16px')
    expect(DEFAULT_THEME_TOKENS.spacing.xl).toBe('24px')
    expect(DEFAULT_THEME_TOKENS.spacing.xxl).toBe('32px')
    expect(DEFAULT_THEME_TOKENS.spacing.section).toBe('80px')
  })
})
