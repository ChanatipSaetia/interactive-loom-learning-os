import { describe, expect, it } from 'vitest'
import * as uiSystem from '../../../../src/core/ui-system'

describe('UISystem index exports', () => {
  it('exports UISystemProvider', () => {
    expect(uiSystem.UISystemProvider).toBeDefined()
  })

  it('exports useUISystem hook', () => {
    expect(typeof uiSystem.useUISystem).toBe('function')
  })

  it('exports ThemeContract items', () => {
    expect(uiSystem.CTP).toBeDefined()
    expect(uiSystem.DEFAULT_THEME_TOKENS).toBeDefined()
  })

  it('exports UI primitives', () => {
    expect(uiSystem.Button).toBeDefined()
    expect(uiSystem.StatefulButton).toBeDefined()
    expect(uiSystem.MagneticButton).toBeDefined()
    expect(uiSystem.Card).toBeDefined()
    expect(uiSystem.CardHeader).toBeDefined()
    expect(uiSystem.CardTitle).toBeDefined()
    expect(uiSystem.CardDescription).toBeDefined()
    expect(uiSystem.CardContent).toBeDefined()
    expect(uiSystem.CardFooter).toBeDefined()
    expect(uiSystem.Badge).toBeDefined()
    expect(uiSystem.RangeSlider).toBeDefined()
    expect(uiSystem.Modal).toBeDefined()
    expect(uiSystem.ModalHeader).toBeDefined()
    expect(uiSystem.ModalTitle).toBeDefined()
    expect(uiSystem.ModalDescription).toBeDefined()
    expect(uiSystem.ModalContent).toBeDefined()
    expect(uiSystem.ModalFooter).toBeDefined()
    expect(uiSystem.UIComponentRegistry).toBeDefined()
  })

  it('exports SensoryFeedback items', () => {
    expect(typeof uiSystem.createAudioEngine).toBe('function')
    expect(uiSystem.MOTION_FADE).toBeDefined()
    expect(uiSystem.MOTION_SLIDE_UP).toBeDefined()
    expect(uiSystem.MOTION_SLIDE_DOWN).toBeDefined()
    expect(uiSystem.MOTION_SCALE).toBeDefined()
    expect(uiSystem.MOTION_BLUR_IN).toBeDefined()
    expect(uiSystem.MOTION_STAGGER_CONTAINER).toBeDefined()
    expect(uiSystem.MOTION_STAGGER_CHILD).toBeDefined()
    expect(uiSystem.MOTION_PRESS).toBeDefined()
    expect(uiSystem.MOTION_DRAWER).toBeDefined()
  })

  it('UIComponentRegistry has all components', () => {
    const registry = uiSystem.UIComponentRegistry
    expect(registry.Card).toBe(uiSystem.Card)
    expect(registry.Button).toBe(uiSystem.Button)
    expect(registry.Badge).toBe(uiSystem.Badge)
    expect(registry.RangeSlider).toBe(uiSystem.RangeSlider)
    expect(registry.Modal).toBe(uiSystem.Modal)
  })
})
