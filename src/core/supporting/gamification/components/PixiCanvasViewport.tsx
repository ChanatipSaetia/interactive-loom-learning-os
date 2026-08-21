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
 * 1. Async Application.init() with zero-dimension fallback protection.
 * 2. DOM attachment via containerRef.
 * 3. ResizeObserver for automatic resize handling.
 * 4. Teardown via Application.destroy() on unmount.
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
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let app: Application | null = null
    let resizeObserver: ResizeObserver | null = null
    let customCleanup: (() => void) | void = undefined
    let isMounted = true

    const initPixi = async () => {
      if (!containerRef.current) return

      const { clientWidth, clientHeight } = containerRef.current

      const pixiApp = new Application()
      await pixiApp.init({
        width: clientWidth || defaultWidth,
        height: clientHeight || defaultHeight,
        backgroundColor,
        backgroundAlpha,
        antialias: true,
        autoDensity: true,
        resolution: (typeof window !== 'undefined' && window.devicePixelRatio) || 1,
      })

      if (!isMounted || !containerRef.current) {
        // NOTE: rendererDestroyOptions must NOT be the literal `true` — that triggers
        // PixiJS's GlobalResourceRegistry.release(), which wipes shared/global resource
        // pools (Batcher's batch pool, CanvasPool, TexturePool) used by EVERY PixiJS
        // Application on the page, corrupting any other still-alive canvas (e.g. the
        // HexGridCanvas map rendering underneath this encounter's canvas).
        pixiApp.destroy({ removeView: true }, { children: true, texture: true })
        return
      }

      app = pixiApp
      containerRef.current.appendChild(pixiApp.canvas)

      const rootContainer = new Container()
      app.stage.addChild(rootContainer)

      // Run component-specific scene initialization & ticker setup
      customCleanup = onInit(pixiApp, rootContainer)

      // Track size changes of the parent container directly
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect
          if (width > 0 && height > 0 && app?.renderer) {
            app.renderer.resize(width, height)
            onResize?.(width, height, app)
          }
        }
      })

      resizeObserver.observe(containerRef.current)
    }

    initPixi()

    return () => {
      isMounted = false
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
      if (app) {
        // See note above: never pass the literal `true` as the first argument here.
        app.destroy({ removeView: true }, { children: true, texture: true, context: true })
      }
    }
  }, [backgroundColor, backgroundAlpha, defaultWidth, defaultHeight, onInit, onResize])

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
    />
  )
}
