import React, { useEffect, useRef } from 'react'
import { Application, Container } from 'pixi.js'

export interface PixiCanvasViewportProps {
  className?: string
  style?: React.CSSProperties
  backgroundColor?: number
  backgroundAlpha?: number
  defaultWidth?: number
  defaultHeight?: number
  onInit: (app: Application, rootContainer: Container) => (() => void) | void
  onResize?: (width: number, height: number, app: Application) => void
}

/**
 * Reusable React Component for PixiJS canvas viewports.
 * Encapsulates the complete PixiJS lifecycle cleanly in React:
 * 1. Async Application.init() with zero-dimension fallback protection.
 * 2. Absolute positioning and DOM attachment.
 * 3. Robust ResizeObserver for automatic resize handling across tab swaps, drawer opens, and layout changes.
 * 4. Safe teardown and WebGL context destruction.
 */
export const PixiCanvasViewport: React.FC<PixiCanvasViewportProps> = ({
  className = 'relative w-full h-full overflow-hidden',
  style,
  backgroundColor = 0x181825,
  backgroundAlpha = 1,
  defaultWidth = 800,
  defaultHeight = 400,
  onInit,
  onResize,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const onInitRef = useRef(onInit)
  const onResizeRef = useRef(onResize)

  onInitRef.current = onInit
  onResizeRef.current = onResize

  useEffect(() => {
    const domElement = containerRef.current
    if (!domElement) return

    let isDestroyed = false
    const app = new Application()
    let resizeObserver: ResizeObserver | null = null
    let customCleanup: (() => void) | void = undefined

    const init = async () => {
      try {
        const initialW = domElement.clientWidth || defaultWidth
        const initialH = domElement.clientHeight || defaultHeight

        await app.init({
          width: initialW,
          height: initialH,
          backgroundColor,
          backgroundAlpha,
          antialias: true,
          resolution: (typeof window !== 'undefined' && window.devicePixelRatio) || 1,
          autoDensity: true,
        })

        if (isDestroyed || !domElement) {
          app.destroy(true, { children: true })
          return
        }

        const canvas = app.canvas as HTMLCanvasElement
        canvas.style.position = 'absolute'
        canvas.style.inset = '0'
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.style.display = 'block'
        canvas.style.userSelect = 'none'

        domElement.appendChild(canvas)
        appRef.current = app

        const rootContainer = new Container()
        app.stage.addChild(rootContainer)

        // Run component-specific scene initialization & ticker setup
        customCleanup = onInitRef.current(app, rootContainer)

        // Observe container resizing (modal transitions, drawer toggles, window resizes)
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect
            if (width > 0 && height > 0 && appRef.current) {
              appRef.current.renderer.resize(width, height)
              if (onResizeRef.current) {
                onResizeRef.current(width, height, appRef.current)
              }
            }
          }
        })
        resizeObserver.observe(domElement)
      } catch (err) {
        console.warn('PixiCanvasViewport initialization error:', err)
      }
    }

    init()

    return () => {
      isDestroyed = true
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      if (typeof customCleanup === 'function') {
        try {
          customCleanup()
        } catch {
          // ignore
        }
      }
      if (appRef.current) {
        try {
          appRef.current.destroy(true, { children: true })
        } catch {
          // ignore
        }
        appRef.current = null
      }
    }
  }, [backgroundColor, backgroundAlpha, defaultWidth, defaultHeight])

  return <div ref={containerRef} className={className} style={style} />
}
