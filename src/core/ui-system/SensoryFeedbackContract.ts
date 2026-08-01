/**
 * SensoryFeedbackContract — Audio triggers and motion animation variants.
 *
 * Provides the sound synthesis engine (Web Audio API, no external files)
 * and reusable Framer Motion animation variants for UI transitions.
 */

import type { Variants } from 'motion/react'
import {
  EASE_OUT,
  EASE_IN_OUT,
  EASE_DRAWER,
  SPRING_PRESS,
  SPRING_SWAP,
  SPRING_PANEL,
  SPRING_LAYOUT,
  SPRING_MOUSE,
} from './motion/ease'

export {
  EASE_OUT,
  EASE_IN_OUT,
  EASE_DRAWER,
  SPRING_PRESS,
  SPRING_SWAP,
  SPRING_PANEL,
  SPRING_LAYOUT,
  SPRING_MOUSE,
}



// ---------------------------------------------------------------------------
// Sound types
// ---------------------------------------------------------------------------

export type SoundEffect =
  | 'click'
  | 'stepNext'
  | 'stepPrev'
  | 'flip'
  | 'success'
  | 'error'
  | 'boundary'
  | 'complete'

export interface SoundContract {
  /** Whether audio is currently muted */
  isMuted: boolean
  /** Volume level 0‑1 */
  volume: number
  /** Toggle mute state */
  toggleMute: () => void
  /** Set volume (clamped 0‑1) */
  setVolume: (vol: number) => void
  /** Play a named sound effect */
  playSound: (effect: SoundEffect) => void
  /** Convenience: play click sound */
  playClick: () => void
  /** Convenience: play success sound */
  playSuccess: () => void
  /** Convenience: play error sound */
  playError: () => void
  /** Convenience: play step‑forward sound */
  playStepNext: () => void
  /** Convenience: play step‑backward sound */
  playStepPrev: () => void
  /** Convenience: play completion fanfare */
  playComplete: () => void
}

/**
 * Pure sound synthesis engine — no React dependency.
 * Used internally by `SoundContext` to produce sounds.
 */
export interface AudioEngine {
  getContext: () => AudioContext | null
  play: (effect: SoundEffect, volume: number) => void
}

/**
 * Build an AudioEngine backed by the browser Web Audio API.
 * Sounds are synthesized via oscillators (no external files).
 */
export function createAudioEngine(): AudioEngine {
  let ctx: AudioContext | null = null

  const getContext = (): AudioContext | null => {
    if (!ctx) {
      const AC = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AC) ctx = new AC()
    }
    if (ctx?.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    return ctx
  }

  const play = (effect: SoundEffect, volume: number): void => {
    const audioCtx = getContext()
    if (!audioCtx) return

    const now = audioCtx.currentTime
    const mainGain = audioCtx.createGain()
    mainGain.gain.setValueAtTime(volume, now)
    mainGain.connect(audioCtx.destination)

    const connect = (osc: OscillatorNode, gain: GainNode) => {
      osc.connect(gain)
      gain.connect(mainGain)
    }

    switch (effect) {
      case 'click': {
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(750, now)
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.025)
        gain.gain.setValueAtTime(0.4, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025)
        connect(osc, gain)
        osc.start(now)
        osc.stop(now + 0.025)
        break
      }
      case 'stepNext': {
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(440, now)
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.07)
        gain.gain.setValueAtTime(0.5, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07)
        connect(osc, gain)
        osc.start(now)
        osc.stop(now + 0.07)
        break
      }
      case 'stepPrev': {
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(660, now)
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.07)
        gain.gain.setValueAtTime(0.5, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07)
        connect(osc, gain)
        osc.start(now)
        osc.stop(now + 0.07)
        break
      }
      case 'flip': {
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(500, now)
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.04)
        gain.gain.setValueAtTime(0.4, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
        connect(osc, gain)
        osc.start(now)
        osc.stop(now + 0.04)
        break
      }
      case 'success': {
        const notes = [523.25, 659.25, 783.99]
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator()
          const gain = audioCtx.createGain()
          const start = now + idx * 0.06
          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq, start)
          gain.gain.setValueAtTime(0.35, start)
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2)
          connect(osc, gain)
          osc.start(start)
          osc.stop(start + 0.2)
        })
        break
      }
      case 'error': {
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(160, now)
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12)
        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
        connect(osc, gain)
        osc.start(now)
        osc.stop(now + 0.12)
        break
      }
      case 'boundary': {
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(130, now)
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.05)
        gain.gain.setValueAtTime(0.4, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
        connect(osc, gain)
        osc.start(now)
        osc.stop(now + 0.05)
        break
      }
      case 'complete': {
        const chord = [523.25, 659.25, 783.99, 1046.5]
        chord.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator()
          const gain = audioCtx.createGain()
          const start = now + idx * 0.05
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(freq, start)
          gain.gain.setValueAtTime(0.3, start)
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35)
          connect(osc, gain)
          osc.start(start)
          osc.stop(start + 0.35)
        })
        break
      }
    }
  }

  return { getContext, play }
}

// ---------------------------------------------------------------------------
// Motion animation variants
// ---------------------------------------------------------------------------

/** Standard fade in/out variants for AnimatePresence */
export const MOTION_FADE: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: EASE_OUT } },
}

/** Slide up reveal variant */
export const MOTION_SLIDE_UP: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15, ease: EASE_OUT } },
}

/** Slide down reveal variant */
export const MOTION_SLIDE_DOWN: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.15, ease: EASE_OUT } },
}

/** Scale in/out variant for modals, overlays */
export const MOTION_SCALE: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: EASE_OUT } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15, ease: EASE_OUT } },
}

/** Blur‑in variant for text reveals */
export const MOTION_BLUR_IN: Variants = {
  hidden: { opacity: 0, filter: 'blur(8px)' },
  visible: { opacity: 1, filter: 'blur(0px)', transition: { duration: 0.3, ease: EASE_OUT } },
  exit: { opacity: 0, filter: 'blur(4px)', transition: { duration: 0.15, ease: EASE_OUT } },
}

/** Stagger container for children animations */
export const MOTION_STAGGER_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

/** Staggered child item — fades and slides up */
export const MOTION_STAGGER_CHILD: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE_OUT } },
}

/** Spring press — for interactive elements (buttons, cards) */
export const MOTION_PRESS = {
  scale: 0.93,
  transition: SPRING_PRESS,
}

/** Drawer slide — for side panels, drawers */
export const MOTION_DRAWER: Variants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { duration: 0.35, ease: EASE_DRAWER } },
  exit: { x: '100%', transition: { duration: 0.2, ease: EASE_OUT } },
}

// ---------------------------------------------------------------------------
// SensoryFeedbackContract — unified interface
// ---------------------------------------------------------------------------

export interface SensoryFeedbackContract {
  /** Sound system with mute, volume, and effect playback */
  sound: SoundContract
  /** Motion animation variant presets */
  motion: {
    fade: Variants
    slideUp: Variants
    slideDown: Variants
    scale: Variants
    blurIn: Variants
    staggerContainer: Variants
    staggerChild: Variants
    press: typeof MOTION_PRESS
    drawer: Variants
    /** Easing curves */
    easeOut: typeof EASE_OUT
    easeInOut: typeof EASE_IN_OUT
    easeDrawer: typeof EASE_DRAWER
    /** Spring configs */
    springPress: typeof SPRING_PRESS
    springSwap: typeof SPRING_SWAP
    springPanel: typeof SPRING_PANEL
    springLayout: typeof SPRING_LAYOUT
    springMouse: typeof SPRING_MOUSE
  }
}
