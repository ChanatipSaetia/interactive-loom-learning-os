import { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { createTimeline } from 'animejs'

export interface UseAnimationOptions {
  autoplay?: boolean
  loop?: number | boolean
  delay?: number
  playbackRate?: number
  totalSteps?: number
}

export interface AnimationStatus {
  playing: boolean
  currentStep: number
  totalSteps: number
}

export interface AnimationControl {
  play: () => void
  pause: () => void
  reset: () => void
  restart: () => void
  seek: (time: number) => void
  stepForward: () => void
  stepBack: () => void
  status: AnimationStatus
}

export function useAnimation(
  addFn: (tl: ReturnType<typeof createTimeline>) => void,
  options: UseAnimationOptions = {}
): AnimationControl {
  const { autoplay = true, totalSteps: givenTotal = 1 } = options

  const tlRef = useRef<ReturnType<typeof createTimeline> | null>(null)
  const segmentTimesRef = useRef<number[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const totalSteps = Math.max(givenTotal, 1)

  useEffect(() => {
    if (tlRef.current) {
      tlRef.current.cancel()
    }

    const tl = createTimeline({
      autoplay,
      loop: options.loop,
      delay: options.delay,
      playbackRate: options.playbackRate,
    })

    const originalAdd = tl.add.bind(tl)
    const segments: number[] = []

    tl.add = ((...args: Parameters<typeof originalAdd>) => {
      const rawArgs = args as unknown[]
      const pos = rawArgs[2]
      if (typeof pos === 'number') {
        segments.push(pos)
      } else if (typeof pos === 'string') {
        const m = pos.match(/^(-?[\d.]+)/)
        if (m) segments.push(parseFloat(m[1]))
      }
      return originalAdd(...args)
    }) as typeof originalAdd

    segmentTimesRef.current = segments

    tl.onUpdate = () => {
      const ct = tl.currentTime ?? 0
      let step = 0
      for (let i = segments.length - 1; i >= 0; i--) {
        if (ct >= segments[i]) {
          step = i
          break
        }
      }
      setCurrentStep(step)
    }

    tl.onComplete = () => {
      setPlaying(false)
    }

    addFn(tl)
    tlRef.current = tl
    setCurrentStep(0)

    return () => {
      tl.cancel()
      tlRef.current = null
    }
  }, [addFn, autoplay, options.loop, options.delay, options.playbackRate])

  const stepForward = useCallback(() => {
    if (!tlRef.current) return
    const segments = segmentTimesRef.current
    if (playing) {
      tlRef.current.pause()
      setPlaying(false)
    }
    const next = Math.min(currentStep + 1, segments.length - 1)
    if (next >= 0 && next < segments.length) {
      tlRef.current.seek(segments[next])
      setCurrentStep(next)
    } else if (segments.length === 0) {
      setCurrentStep(Math.min(currentStep + 1, totalSteps - 1))
    }
  }, [currentStep, playing, totalSteps])

  const stepBack = useCallback(() => {
    if (!tlRef.current) return
    const segments = segmentTimesRef.current
    if (playing) {
      tlRef.current.pause()
      setPlaying(false)
    }
    const prev = Math.max(currentStep - 1, 0)
    if (prev < segments.length) {
      tlRef.current.seek(segments[prev])
      setCurrentStep(prev)
    } else if (segments.length === 0) {
      setCurrentStep(Math.max(currentStep - 1, 0))
    }
  }, [currentStep, playing])

  const control = useMemo<AnimationControl>(
    () => ({
      play: () => {
        tlRef.current?.restart()
        setPlaying(true)
      },
      pause: () => {
        tlRef.current?.pause()
        setPlaying(false)
      },
      reset: () => {
        tlRef.current?.reset()
        setPlaying(false)
        setCurrentStep(0)
      },
      restart: () => {
        tlRef.current?.restart()
        setPlaying(true)
      },
      seek: (time: number) => {
        tlRef.current?.seek(time)
        setPlaying(false)
      },
      stepForward,
      stepBack,
      get status() {
        return { playing, currentStep, totalSteps }
      },
    }),
    [playing, currentStep, totalSteps, stepForward, stepBack]
  )

  return control
}
