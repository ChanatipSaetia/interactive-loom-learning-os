/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  UISystemProvider,
  useUISystem,
  CTP,
  MOTION_FADE,
} from '../../../../src/core/ui-system'

describe('UISystemProvider', () => {
  function TestConsumer() {
    const ui = useUISystem()
    return (
      <div data-testid="consumer">
        <span data-testid="theme-tokens">{JSON.stringify(ui.theme.tokens.ctp.base)}</span>
        <span data-testid="sound-muted">{String(ui.sensory.sound.isMuted)}</span>
        <span data-testid="sound-volume">{String(ui.sensory.sound.volume)}</span>
        <span data-testid="motion-fade">{JSON.stringify((ui.sensory.motion.fade.hidden as any).opacity)}</span>
        <span data-testid="components-card">{String(!!ui.components.Card)}</span>
        <span data-testid="components-badge">{String(!!ui.components.Badge)}</span>
        <span data-testid="components-modal">{String(!!ui.components.Modal)}</span>
        <span data-testid="components-slider">{String(!!ui.components.RangeSlider)}</span>
      </div>
    )
  }

  it('provides theme tokens with CTP palette', () => {
    render(
      <UISystemProvider>
        <TestConsumer />
      </UISystemProvider>,
    )
    expect(screen.getByTestId('theme-tokens').textContent).toBe(JSON.stringify(CTP.base))
  })

  it('provides sound system with default values', () => {
    render(
      <UISystemProvider>
        <TestConsumer />
      </UISystemProvider>,
    )
    expect(screen.getByTestId('sound-muted').textContent).toBe('false')
    expect(screen.getByTestId('sound-volume').textContent).toBe('0.25')
  })

  it('provides motion variants', () => {
    render(
      <UISystemProvider>
        <TestConsumer />
      </UISystemProvider>,
    )
    expect(screen.getByTestId('motion-fade').textContent).toBe(JSON.stringify((MOTION_FADE.hidden as any).opacity))
  })

  it('provides all UI component primitives', () => {
    render(
      <UISystemProvider>
        <TestConsumer />
      </UISystemProvider>,
    )
    expect(screen.getByTestId('components-card').textContent).toBe('true')
    expect(screen.getByTestId('components-badge').textContent).toBe('true')
    expect(screen.getByTestId('components-modal').textContent).toBe('true')
    expect(screen.getByTestId('components-slider').textContent).toBe('true')
  })

  it('throws when useUISystem is called outside provider', () => {
    expect(() => {
      render(<TestConsumer />)
    }).toThrow('useUISystem must be used inside <UISystemProvider>')
  })

  describe('sound convenience methods', () => {
    function SoundMethodsConsumer() {
      const ui = useUISystem()
      return (
        <div>
          <span data-testid="playClick">{typeof ui.sensory.sound.playClick}</span>
          <span data-testid="playSuccess">{typeof ui.sensory.sound.playSuccess}</span>
          <span data-testid="playError">{typeof ui.sensory.sound.playError}</span>
          <span data-testid="playStepNext">{typeof ui.sensory.sound.playStepNext}</span>
          <span data-testid="playStepPrev">{typeof ui.sensory.sound.playStepPrev}</span>
          <span data-testid="playComplete">{typeof ui.sensory.sound.playComplete}</span>
        </div>
      )
    }

    it('exposes all convenience sound methods', () => {
      render(
        <UISystemProvider>
          <SoundMethodsConsumer />
        </UISystemProvider>,
      )
      expect(screen.getByTestId('playClick').textContent).toBe('function')
      expect(screen.getByTestId('playSuccess').textContent).toBe('function')
      expect(screen.getByTestId('playError').textContent).toBe('function')
      expect(screen.getByTestId('playStepNext').textContent).toBe('function')
      expect(screen.getByTestId('playStepPrev').textContent).toBe('function')
      expect(screen.getByTestId('playComplete').textContent).toBe('function')
    })
  })

  describe('motion variants accessibility', () => {
    function MotionConsumer() {
      const ui = useUISystem()
      const m = ui.sensory.motion
      return (
        <div>
          <span data-testid="easeOut">{JSON.stringify(m.easeOut)}</span>
          <span data-testid="springPress">{String(m.springPress.stiffness)}</span>
          <span data-testid="springLayout">{String(m.springLayout.stiffness)}</span>
          <span data-testid="drawer">{typeof m.drawer.hidden}</span>
        </div>
      )
    }

    it('exposes easing curves and spring configs', () => {
      render(
        <UISystemProvider>
          <MotionConsumer />
        </UISystemProvider>,
      )
      expect(screen.getByTestId('easeOut').textContent).toBe(JSON.stringify([0.16, 1, 0.3, 1]))
      expect(screen.getByTestId('springPress').textContent).toBe('500')
      expect(screen.getByTestId('springLayout').textContent).toBe('360')
      expect(screen.getByTestId('drawer').textContent).toBe('object')
    })
  })
})
