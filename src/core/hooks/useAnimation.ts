import { useRef, useMemo, useEffect } from 'react'
import { createTimeline } from 'animejs'

export interface UseAnimationOptions {
  autoplay?: boolean
  loop?: number | boolean
  delay?: number
  playbackRate?: number
}

export interface AnimationControl {
  play: () => void
  pause: () => void
  reset: () => void
  restart: () => void
  seek: (time: number) => void
}

export function useAnimation(
  addFn: (tl: ReturnType<typeof createTimeline>) => void,
  options: UseAnimationOptions = {}
): AnimationControl {
  const { autoplay = true } = options

  const tlRef = useRef<ReturnType<typeof createTimeline> | null>(null)

  const control = useMemo<AnimationControl>(() => ({
    play: () => tlRef.current?.play(),
    pause: () => tlRef.current?.pause(),
    reset: () => tlRef.current?.reset(),
    restart: () => tlRef.current?.restart(),
    seek: (time: number) => tlRef.current?.seek(time),
  }), [])

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

    addFn(tl)

    tlRef.current = tl

    return () => {
      tl.cancel()
      tlRef.current = null
    }
  }, [addFn, autoplay, options.loop, options.delay, options.playbackRate])

  return control
}
