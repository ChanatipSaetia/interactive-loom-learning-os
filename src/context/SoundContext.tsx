import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react'
import { SoundEffect, createAudioEngine, type AudioEngine } from '../core/ui-system/SensoryFeedbackContract'

/**
 * SoundContext provides audio playback via the Web Audio API.
 *
 * Now integrated with UISystemContext: the sound engine lives in
 * `SensoryFeedbackContract` and this context wraps it with React
 * state (mute, volume) and localStorage persistence.
 *
 * Consumers can still use `useSound()` directly (backward compatible)
 * or access sound through `useUISystem().sensory.sound`.
 */

export interface SoundContextType {
  isMuted: boolean
  volume: number
  toggleMute: () => void
  setVolume: (vol: number) => void
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

const SoundContext = createContext<SoundContextType | undefined>(undefined)

const STORAGE_KEY_MUTED = 'loom_audio_muted'
const STORAGE_KEY_VOLUME = 'loom_audio_volume'

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MUTED)
      return saved !== null ? JSON.parse(saved) : false
    } catch {
      return false
    }
  })

  const [volume, setVolumeState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VOLUME)
      return saved !== null ? Number(saved) : 0.25
    } catch {
      return 0.25
    }
  })

  const engineRef = useRef<AudioEngine | null>(null)

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = createAudioEngine()
    }
    return engineRef.current
  }, [])

  useEffect(() => {
    const handleFirstGesture = () => {
      getEngine().getContext()
      window.removeEventListener('pointerdown', handleFirstGesture)
      window.removeEventListener('keydown', handleFirstGesture)
    }
    window.addEventListener('pointerdown', handleFirstGesture, { once: true })
    window.addEventListener('keydown', handleFirstGesture, { once: true })

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture)
      window.removeEventListener('keydown', handleFirstGesture)
    }
  }, [getEngine])

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY_MUTED, JSON.stringify(next))
      } catch {
        // storage unavailable
      }
      return next
    })
  }, [])

  const setVolume = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol))
    setVolumeState(clamped)
    try {
      localStorage.setItem(STORAGE_KEY_VOLUME, String(clamped))
    } catch {
      // storage unavailable
    }
  }, [])

  const playSound = useCallback(
    (effect: SoundEffect) => {
      if (isMuted || volume <= 0) return
      const engine = getEngine()
      engine.play(effect, volume)
    },
    [isMuted, volume, getEngine],
  )

  return (
    <SoundContext.Provider
      value={{
        isMuted,
        volume,
        toggleMute,
        setVolume,
        playSound,
        playClick: () => playSound('click'),
        playSuccess: () => playSound('success'),
        playError: () => playSound('error'),
        playStepNext: () => playSound('stepNext'),
        playStepPrev: () => playSound('stepPrev'),
        playComplete: () => playSound('complete'),
      }}
    >
      {children}
    </SoundContext.Provider>
  )
}

const dummyContext: SoundContextType = {
  isMuted: false,
  volume: 0.25,
  toggleMute: () => {},
  setVolume: () => {},
  playSound: () => {},
  playClick: () => {},
  playSuccess: () => {},
  playError: () => {},
  playStepNext: () => {},
  playStepPrev: () => {},
  playComplete: () => {},
}

export function useSound() {
  const context = useContext(SoundContext)
  return context || dummyContext
}
