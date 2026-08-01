import { createContext, useContext, useCallback, type ReactNode } from 'react'
import { SoundProvider, useSound } from './sensory/SoundContext'
import { DEFAULT_THEME_TOKENS } from './ThemeContract'
import { UIComponentRegistry } from './UIComponentRegistryContract'
import {
  MOTION_FADE,
  MOTION_SLIDE_UP,
  MOTION_SLIDE_DOWN,
  MOTION_SCALE,
  MOTION_BLUR_IN,
  MOTION_STAGGER_CONTAINER,
  MOTION_STAGGER_CHILD,
  MOTION_PRESS,
  MOTION_DRAWER,
  EASE_OUT,
  EASE_IN_OUT,
  EASE_DRAWER,
  SPRING_PRESS,
  SPRING_SWAP,
  SPRING_PANEL,
  SPRING_LAYOUT,
  SPRING_MOUSE,
} from './SensoryFeedbackContract'
import type { ThemeTokens } from './ThemeContract'
import type { UIComponentRegistryContract } from './UIComponentRegistryContract'
import type { SoundEffect } from './SensoryFeedbackContract'

// ---------------------------------------------------------------------------
// UISystemContract — the unified contract exposed to all subdomains
// ---------------------------------------------------------------------------

/**
 * UISystemContract unifies theme tokens, UI component primitives,
 * sound effects, and motion animation variants.
 *
 * Rule: Subdomain components must NOT use ad-hoc hardcoded styling or
 * direct un-abstracted audio triggers. They should consume this contract
 * via `useUISystem()`.
 */
export interface UISystemContract {
  /** Catppuccin Frappé color tokens, typography scales, spacing */
  theme: {
    tokens: ThemeTokens
  }
  /** Standardized UI primitives: Card, Button, Badge, RangeSlider, Modal */
  components: UIComponentRegistryContract
  /** Audio triggers and motion animation variants */
  sensory: {
    /** Sound system with playClick(), playSuccess(), etc. */
    sound: {
      isMuted: boolean
      volume: number
      toggleMute: () => void
      setVolume: (vol: number) => void
      playSound: (effect: SoundEffect) => void
      playClick: () => void
      playSuccess: () => void
      playError: () => void
      playStepNext: () => void
      playStepPrev: () => void
      playComplete: () => void
    }
    /** Motion animation variant presets */
    motion: {
      fade: typeof MOTION_FADE
      slideUp: typeof MOTION_SLIDE_UP
      slideDown: typeof MOTION_SLIDE_DOWN
      scale: typeof MOTION_SCALE
      blurIn: typeof MOTION_BLUR_IN
      staggerContainer: typeof MOTION_STAGGER_CONTAINER
      staggerChild: typeof MOTION_STAGGER_CHILD
      press: typeof MOTION_PRESS
      drawer: typeof MOTION_DRAWER
      easeOut: typeof EASE_OUT
      easeInOut: typeof EASE_IN_OUT
      easeDrawer: typeof EASE_DRAWER
      springPress: typeof SPRING_PRESS
      springSwap: typeof SPRING_SWAP
      springPanel: typeof SPRING_PANEL
      springLayout: typeof SPRING_LAYOUT
      springMouse: typeof SPRING_MOUSE
    }
  }
}

// ---------------------------------------------------------------------------
// Context & Provider
// ---------------------------------------------------------------------------

const UISystemContext = createContext<UISystemContract | null>(null)

/**
 * UISystemProvider wraps the app with the unified UI system.
 *
 * Composes SoundProvider internally so sound is always available
 * to consumers of `useUISystem()`. The theme is applied via CSS
 * custom properties on `<html data-theme>` (handled by useTheme hook).
 *
 * Usage:
 *   <UISystemProvider>
 *     <App />
 *   </UISystemProvider>
 */
export function UISystemProvider({ children }: { children: ReactNode }) {
  return (
    <SoundProvider>
      <UISystemValue>{children}</UISystemValue>
    </SoundProvider>
  )
}

/**
 * Internal value provider — accesses sound from SoundContext and
 * assembles the full UISystemContract.
 */
function UISystemValue({ children }: { children: ReactNode }) {
  const sound = useSound()

  const contract: UISystemContract = {
    theme: {
      tokens: DEFAULT_THEME_TOKENS,
    },
    components: UIComponentRegistry,
    sensory: {
      sound: {
        isMuted: sound.isMuted,
        volume: sound.volume,
        toggleMute: sound.toggleMute,
        setVolume: sound.setVolume,
        playSound: sound.playSound,
        playClick: useCallback(() => sound.playSound('click'), [sound]),
        playSuccess: useCallback(() => sound.playSound('success'), [sound]),
        playError: useCallback(() => sound.playSound('error'), [sound]),
        playStepNext: useCallback(() => sound.playSound('stepNext'), [sound]),
        playStepPrev: useCallback(() => sound.playSound('stepPrev'), [sound]),
        playComplete: useCallback(() => sound.playSound('complete'), [sound]),
      },
      motion: {
        fade: MOTION_FADE,
        slideUp: MOTION_SLIDE_UP,
        slideDown: MOTION_SLIDE_DOWN,
        scale: MOTION_SCALE,
        blurIn: MOTION_BLUR_IN,
        staggerContainer: MOTION_STAGGER_CONTAINER,
        staggerChild: MOTION_STAGGER_CHILD,
        press: MOTION_PRESS,
        drawer: MOTION_DRAWER,
        easeOut: EASE_OUT,
        easeInOut: EASE_IN_OUT,
        easeDrawer: EASE_DRAWER,
        springPress: SPRING_PRESS,
        springSwap: SPRING_SWAP,
        springPanel: SPRING_PANEL,
        springLayout: SPRING_LAYOUT,
        springMouse: SPRING_MOUSE,
      },
    },
  }

  return (
    <UISystemContext.Provider value={contract}>
      {children}
    </UISystemContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the unified UI system contract from any component within
 * `UISystemProvider`.
 *
 * Returns theme tokens, UI component primitives (Card, Button, etc.),
 * audio triggers (playClick, playSuccess), and motion variants.
 *
 * @example
 *   const { theme, components: { Card, Button }, sensory: { sound, motion } } = useUISystem()
 */
export function useUISystem(): UISystemContract {
  const ctx = useContext(UISystemContext)
  if (!ctx) {
    throw new Error('useUISystem must be used inside <UISystemProvider>')
  }
  return ctx
}
