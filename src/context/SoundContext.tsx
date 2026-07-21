import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react'

export type SoundEffect =
  | 'click'
  | 'stepNext'
  | 'stepPrev'
  | 'flip'
  | 'success'
  | 'error'
  | 'boundary'
  | 'complete'

interface SoundContextType {
  isMuted: boolean
  volume: number
  toggleMute: () => void
  setVolume: (vol: number) => void
  playSound: (effect: SoundEffect) => void
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

  const audioCtxRef = useRef<AudioContext | null>(null)

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass()
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {})
    }
    return audioCtxRef.current
  }, [])

  useEffect(() => {
    const handleFirstGesture = () => {
      getAudioContext()
      window.removeEventListener('pointerdown', handleFirstGesture)
      window.removeEventListener('keydown', handleFirstGesture)
    }
    window.addEventListener('pointerdown', handleFirstGesture, { once: true })
    window.addEventListener('keydown', handleFirstGesture, { once: true })

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture)
      window.removeEventListener('keydown', handleFirstGesture)
    }
  }, [getAudioContext])

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY_MUTED, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const setVolume = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol))
    setVolumeState(clamped)
    try {
      localStorage.setItem(STORAGE_KEY_VOLUME, String(clamped))
    } catch {}
  }, [])

  const playSound = useCallback(
    (effect: SoundEffect) => {
      if (isMuted || volume <= 0) return
      const ctx = getAudioContext()
      if (!ctx) return

      const now = ctx.currentTime
      const mainGain = ctx.createGain()
      mainGain.gain.setValueAtTime(volume, now)
      mainGain.connect(ctx.destination)

      switch (effect) {
        case 'click': {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(750, now)
          osc.frequency.exponentialRampToValueAtTime(350, now + 0.025)
          gain.gain.setValueAtTime(0.4, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025)

          osc.connect(gain)
          gain.connect(mainGain)
          osc.start(now)
          osc.stop(now + 0.025)
          break
        }

        case 'stepNext': {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(440, now)
          osc.frequency.exponentialRampToValueAtTime(660, now + 0.07)
          gain.gain.setValueAtTime(0.5, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07)

          osc.connect(gain)
          gain.connect(mainGain)
          osc.start(now)
          osc.stop(now + 0.07)
          break
        }

        case 'stepPrev': {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(660, now)
          osc.frequency.exponentialRampToValueAtTime(440, now + 0.07)
          gain.gain.setValueAtTime(0.5, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07)

          osc.connect(gain)
          gain.connect(mainGain)
          osc.start(now)
          osc.stop(now + 0.07)
          break
        }

        case 'flip': {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(500, now)
          osc.frequency.exponentialRampToValueAtTime(220, now + 0.04)
          gain.gain.setValueAtTime(0.4, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

          osc.connect(gain)
          gain.connect(mainGain)
          osc.start(now)
          osc.stop(now + 0.04)
          break
        }

        case 'success': {
          const notes = [523.25, 659.25, 783.99] // C5, E5, G5
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            const startTime = now + idx * 0.06
            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, startTime)
            gain.gain.setValueAtTime(0.35, startTime)
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2)

            osc.connect(gain)
            gain.connect(mainGain)
            osc.start(startTime)
            osc.stop(startTime + 0.2)
          })
          break
        }

        case 'error': {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(160, now)
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.12)
          gain.gain.setValueAtTime(0.3, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

          osc.connect(gain)
          gain.connect(mainGain)
          osc.start(now)
          osc.stop(now + 0.12)
          break
        }

        case 'boundary': {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(130, now)
          osc.frequency.exponentialRampToValueAtTime(90, now + 0.05)
          gain.gain.setValueAtTime(0.4, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

          osc.connect(gain)
          gain.connect(mainGain)
          osc.start(now)
          osc.stop(now + 0.05)
          break
        }

        case 'complete': {
          const chord = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
          chord.forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            const startTime = now + idx * 0.05
            osc.type = 'triangle'
            osc.frequency.setValueAtTime(freq, startTime)
            gain.gain.setValueAtTime(0.3, startTime)
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35)

            osc.connect(gain)
            gain.connect(mainGain)
            osc.start(startTime)
            osc.stop(startTime + 0.35)
          })
          break
        }
      }
    },
    [isMuted, volume, getAudioContext]
  )

  return (
    <SoundContext.Provider value={{ isMuted, volume, toggleMute, setVolume, playSound }}>
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
}

export function useSound() {
  const context = useContext(SoundContext)
  return context || dummyContext
}

