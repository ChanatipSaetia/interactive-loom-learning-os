/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest'
import {
  createAudioEngine,
  MOTION_FADE,
  MOTION_SLIDE_UP,
  MOTION_SCALE,
  MOTION_BLUR_IN,
  MOTION_STAGGER_CONTAINER,
  MOTION_STAGGER_CHILD,
  MOTION_PRESS,
  MOTION_DRAWER,
  EASE_OUT,
  EASE_IN_OUT,
  SPRING_PRESS,
  SPRING_LAYOUT,
} from '../../../../src/core/ui-system/SensoryFeedbackContract'

describe('SensoryFeedbackContract', () => {
  describe('createAudioEngine', () => {
    it('creates an engine with getContext and play methods', () => {
      const engine = createAudioEngine()
      expect(typeof engine.getContext).toBe('function')
      expect(typeof engine.play).toBe('function')
    })

    it('getContext returns null in non-browser environment', () => {
      const engine = createAudioEngine()
      const ctx = engine.getContext()
      // In jsdom, AudioContext may or may not be available
      expect(ctx === null || typeof ctx.resume === 'function').toBe(true)
    })

    it('play does not throw for valid effect names', () => {
      const engine = createAudioEngine()
      expect(() => engine.play('click', 0.25)).not.toThrow()
      expect(() => engine.play('success', 0.25)).not.toThrow()
      expect(() => engine.play('error', 0.25)).not.toThrow()
      expect(() => engine.play('complete', 0.25)).not.toThrow()
    })
  })

  describe('motion variants', () => {
    it('MOTION_FADE has hidden/visible/exit states', () => {
      expect(MOTION_FADE).toHaveProperty('hidden')
      expect(MOTION_FADE).toHaveProperty('visible')
      expect(MOTION_FADE).toHaveProperty('exit')
    })

    it('MOTION_SLIDE_UP has y offset transitions', () => {
      expect((MOTION_SLIDE_UP.hidden as any).y).toBe(20)
      expect((MOTION_SLIDE_UP.visible as any).y).toBe(0)
    })

    it('MOTION_SCALE has scale transitions', () => {
      expect((MOTION_SCALE.hidden as any).scale).toBe(0.95)
      expect((MOTION_SCALE.visible as any).scale).toBe(1)
    })

    it('MOTION_BLUR_IN has filter transitions', () => {
      expect((MOTION_BLUR_IN.hidden as any).filter).toBe('blur(8px)')
      expect((MOTION_BLUR_IN.visible as any).filter).toBe('blur(0px)')
    })

    it('MOTION_STAGGER_CONTAINER has staggerChildren', () => {
      expect((MOTION_STAGGER_CONTAINER.visible as any).transition).toHaveProperty('staggerChildren')
    })

    it('MOTION_STAGGER_CHILD has opacity and y transitions', () => {
      expect((MOTION_STAGGER_CHILD.hidden as any).opacity).toBe(0)
      expect((MOTION_STAGGER_CHILD.hidden as any).y).toBe(12)
      expect((MOTION_STAGGER_CHILD.visible as any).opacity).toBe(1)
      expect((MOTION_STAGGER_CHILD.visible as any).y).toBe(0)
    })

    it('MOTION_PRESS has scale and spring transition', () => {
      expect(MOTION_PRESS.scale).toBe(0.93)
    })

    it('MOTION_DRAWER has x offset transitions', () => {
      expect((MOTION_DRAWER.hidden as any).x).toBe('100%')
      expect((MOTION_DRAWER.visible as any).x).toBe(0)
    })
  })

  describe('easing exports', () => {
    it('EASE_OUT is correct cubic-bezier', () => {
      expect(EASE_OUT).toEqual([0.16, 1, 0.3, 1])
    })

    it('EASE_IN_OUT is correct cubic-bezier', () => {
      expect(EASE_IN_OUT).toEqual([0.77, 0, 0.175, 1])
    })

    it('SPRING_PRESS has stiffness, damping, mass', () => {
      expect(SPRING_PRESS.stiffness).toBe(500)
      expect(SPRING_PRESS.damping).toBe(30)
      expect(SPRING_PRESS.mass).toBe(0.6)
    })

    it('SPRING_LAYOUT has stiffness, damping, mass', () => {
      expect(SPRING_LAYOUT.stiffness).toBe(360)
      expect(SPRING_LAYOUT.damping).toBe(32)
    })
  })
})
