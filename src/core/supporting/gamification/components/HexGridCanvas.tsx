import React, { useMemo, useState, useRef, useEffect, useCallback, useImperativeHandle } from 'react'
import { Plus, Minus, RotateCcw, Move } from 'lucide-react'
import { Application, Container, ColorMatrixFilter } from 'pixi.js'
import { HexNodeData } from '../types'
import { computeHexGridCoordinates } from '../layout'
import { axialToPixel } from './hex-geometry'
import { computeChaosTintMatrix, computeChaosTintStrength } from './chaos-tint'
import { PixiCanvasViewport } from './PixiCanvasViewport'
import { triggerWalkTransition } from './walk-transition'
import { renderHexScene } from './scene-renderer'
import { isVictorySetPieceNode, triggerBossVictorySetPiece } from './victory-fx'
import { useGamificationTheme } from '../theme-palette'

interface HexGridCanvasProps {
  nodes: HexNodeData[]
  selectedNodeId: string | null
  onSelectNode: (node: HexNodeData) => void
  /** Campaign chaos level 0–100; drives the red desaturation map tint. */
  chaosLevel?: number
}

export interface HexGridCanvasRef {
  triggerWalkTransition: (node: HexNodeData, onComplete?: () => void) => void
  /** @deprecated use triggerWalkTransition */
  triggerTwistTransition: (node: HexNodeData, onComplete?: () => void) => void
}

export const HexGridCanvas = React.forwardRef<HexGridCanvasRef, HexGridCanvasProps>(({
  nodes,
  selectedNodeId,
  onSelectNode,
  chaosLevel = 0,
}, ref) => {
  const palette = useGamificationTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const rootContainerRef = useRef<Container | null>(null)
  const mapContainerRef = useRef<Container | null>(null)
  const isTransitioningRef = useRef<boolean>(false)

  const [zoom, setZoom] = useState<number>(1.0)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)

  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const zoomRef = useRef<number>(1.0)
  panRef.current = pan
  zoomRef.current = zoom

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const touchDistRef = useRef<number | null>(null)
  const previousNodesRef = useRef<HexNodeData[]>(nodes)
  const newlyUnlockedNodeIdsRef = useRef<Set<string>>(new Set())
  const newlyClearedNodeIdsRef = useRef<Set<string>>(new Set())
  // Persisted per-node animation start timestamps (performance.now() * 0.001 seconds).
  // renderPixiScene() fully rebuilds the scene graph on every call (resize, selection
  // change, isCapitalCleared toggle, etc. all trigger it, not just the "newly
  // unlocked/cleared" transition). Without persisting the start time here, a re-render
  // mid-animation would restart the one-shot bomb-blast / fog-reveal FX from t=0 (or,
  // combined with premature flag consumption, silently drop it forever). These maps let
  // the animation resume from its real elapsed time across rebuilds instead.
  const unlockAnimStartRef = useRef<Map<string, number>>(new Map())
  const clearAnimStartRef = useRef<Map<string, number>>(new Map())

  // Keep latest refs for async Pixi render
  const latestPropsRef = useRef({
    nodes,
    selectedNodeId,
    onSelectNode,
  })
  latestPropsRef.current = { nodes, selectedNodeId, onSelectNode }

  const chaosFilterRef = useRef<ColorMatrixFilter | null>(null)
  const lastChaosLevelRef = useRef<number>(-1)
  const chaosLevelRef = useRef<number>(chaosLevel)
  chaosLevelRef.current = chaosLevel

  const applyChaosTint = useCallback((level: number) => {
    const mapContainer = mapContainerRef.current
    if (!mapContainer) return
    if (lastChaosLevelRef.current === level) return
    lastChaosLevelRef.current = level

    const t = computeChaosTintStrength(level)
    if (t <= 0) {
      mapContainer.filters = null
      return
    }
    if (!chaosFilterRef.current) {
      chaosFilterRef.current = new ColorMatrixFilter()
    }
    chaosFilterRef.current.matrix = computeChaosTintMatrix(level)
    mapContainer.filters = [chaosFilterRef.current]
  }, [])

  // Layout coordinate derivations
  const computedCoordsMap = useMemo(() => computeHexGridCoordinates(nodes), [nodes])
  const isCapitalCleared = useMemo(() => nodes.find((n) => n.type === 'capital')?.status === 'cleared', [nodes])

  const getNodeCoord = useCallback(
    (node: HexNodeData) => computedCoordsMap.get(node.id) || node.coordinates || { q: 0, r: 0 },
    [computedCoordsMap]
  )

  // Center camera smoothly on node
  const centerOnNode = useCallback(
    (node: HexNodeData) => {
      const coord = getNodeCoord(node)
      const { x, y } = axialToPixel(coord.q, coord.r, 0, 0)
      const currentZoom = zoomRef.current
      setPan({ x: -x * currentZoom, y: -y * currentZoom })
    },
    [getNodeCoord]
  )

  // Trigger human walking animation into hex from the left before opening encounter modal
  const triggerWalk = useCallback((node: HexNodeData, onComplete?: () => void) => {
    triggerWalkTransition({
      mapContainer: mapContainerRef.current,
      coord: getNodeCoord(node),
      palette,
      isTransitioningRef,
      onComplete,
    })
  }, [getNodeCoord, palette])

  useImperativeHandle(ref, () => ({
    triggerWalkTransition: triggerWalk,
    triggerTwistTransition: triggerWalk,
  }), [triggerWalk])

  // Update map container transform
  const updateMapTransform = useCallback(() => {
    const mapContainer = mapContainerRef.current
    const app = appRef.current
    if (!mapContainer || !app) return

    const cx = (app.screen?.width || containerRef.current?.clientWidth || 880) / 2
    const cy = (app.screen?.height || containerRef.current?.clientHeight || 580) / 2

    mapContainer.position.set(cx + panRef.current.x, cy + panRef.current.y)
    mapContainer.scale.set(zoomRef.current)
  }, [])

  // Apply pan & zoom to PixiJS mapContainer
  useEffect(() => {
    updateMapTransform()
  }, [pan, zoom, updateMapTransform])

  // Animation controller storage ref
  const animControllersRef = useRef<Array<(time: number) => void>>([])

  // Main render routine for PixiJS
  const renderPixiScene = useCallback(() => {
    const mapContainer = mapContainerRef.current
    if (!mapContainer) return

    const {
      nodes: currentNodes,
      selectedNodeId: currentSelectedId,
      onSelectNode: handleSelect,
    } = latestPropsRef.current

    renderHexScene({
      mapContainer,
      palette,
      nodes: currentNodes,
      selectedNodeId: currentSelectedId,
      onSelectNode: handleSelect,
      centerOnNode,
      updateMapTransform,
      animControllers: animControllersRef.current,
      newlyUnlockedNodeIds: newlyUnlockedNodeIdsRef.current,
      newlyClearedNodeIds: newlyClearedNodeIdsRef.current,
      unlockAnimStart: unlockAnimStartRef.current,
      clearAnimStart: clearAnimStartRef.current,
    })
  }, [palette, centerOnNode, updateMapTransform])

  const renderRef = useRef(renderPixiScene)
  renderRef.current = renderPixiScene

  // Detect newly unlocked nodes and newly cleared encounters when nodes prop updates,
  // then re-render the PixiJS scene exactly once.
  //
  // NOTE: this used to be split into two separate effects that both watched `nodes`
  // (this one, plus the "re-render on data/selection change" effect below). Since the
  // bomb-blast / fog-reveal animation flags are consumed (deleted) the moment a node is
  // drawn, having a SECOND effect immediately re-render right after this one wiped out
  // the animation containers before a single frame was ever painted — the node's status
  // (checkmark/color) would update correctly, but the celebratory animation never showed.
  useEffect(() => {
    const prevMap = new Map(previousNodesRef.current.map((n) => [n.id, n.status]))
    const newUnlockIds = new Set<string>()
    const newClearedIds = new Set<string>()

    nodes.forEach((n) => {
      const prevStatus = prevMap.get(n.id)
      if (prevStatus === 'locked' && n.status !== 'locked') {
        newUnlockIds.add(n.id)
      }
      if (prevStatus !== 'cleared' && n.status === 'cleared') {
        newClearedIds.add(n.id)
      }
    })

    const hasNewAnimations = newUnlockIds.size > 0 || newClearedIds.size > 0
    if (hasNewAnimations) {
      // Merge into (not replace) the existing sets: a still in-flight animation from an
      // earlier change (e.g. one node clears while another node's unlock-reveal from a
      // moment ago hasn't finished its 1.3s yet) must not be clobbered by this new batch.
      newUnlockIds.forEach((id) => newlyUnlockedNodeIdsRef.current.add(id))
      newClearedIds.forEach((id) => newlyClearedNodeIdsRef.current.add(id))
    }
    previousNodesRef.current = nodes

    // ─── V6 BOSS VICTORY SET PIECE (root stage FX above the map layer) ───
    // Boss lair / capital newly cleared: full-screen confetti burst + expanding
    // golden rings anchored at the cleared hex's current screen position, drawn
    // on the root stage container so map pan/zoom cannot affect them.
    const app = appRef.current
    const rootContainer = rootContainerRef.current
    const mapContainer = mapContainerRef.current
    if (app && rootContainer && mapContainer && !mapContainer.destroyed) {
      nodes.forEach((n) => {
        if (!newClearedIds.has(n.id) || !isVictorySetPieceNode(n)) return
        const coord = getNodeCoord(n)
        const { x, y } = axialToPixel(coord.q, coord.r, 0, 0)
        const origin = mapContainer.toGlobal({ x, y })
        triggerBossVictorySetPiece({ app, stage: rootContainer, origin, palette })
      })
    }

    // Single render pass per change — this (re)builds containers for any pending
    // newly-unlocked/newly-cleared ids, resuming in-flight ones via the persisted
    // unlockAnimStartRef / clearAnimStartRef start timestamps rather than restarting them.
    if (mapContainerRef.current) {
      renderRef.current()
    }

    if (hasNewAnimations) {
      // Safety-net: if one of THIS batch's ids never got consumed by a render pass (e.g.
      // it isn't currently in the visible node list, so its per-node render block never
      // ran), drop only those specific ids/timestamps rather than wiping the whole set —
      // other nodes' animations may still be legitimately in-flight.
      const timer = setTimeout(() => {
        newUnlockIds.forEach((id) => {
          newlyUnlockedNodeIdsRef.current.delete(id)
          unlockAnimStartRef.current.delete(id)
        })
        newClearedIds.forEach((id) => {
          newlyClearedNodeIdsRef.current.delete(id)
          clearAnimStartRef.current.delete(id)
        })
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [nodes, selectedNodeId, isCapitalCleared, palette, getNodeCoord])

  // Re-render Pixi scene when theme palette changes
  useEffect(() => {
    if (appRef.current?.renderer) {
      appRef.current.renderer.background.color = palette.baseNum
    }
    if (mapContainerRef.current) {
      renderRef.current()
    }
  }, [palette])

  // PixiJS canvas initialization & render hook
  const handleInitPixi = useCallback((app: Application, rootContainer: Container) => {
    appRef.current = app
    rootContainerRef.current = rootContainer

    const mapContainer = new Container()
    rootContainer.addChild(mapContainer)
    mapContainerRef.current = mapContainer

    lastChaosLevelRef.current = -1
    applyChaosTint(chaosLevelRef.current)

    // Add 60fps ticker callback
    const tickerCallback = () => {
      if (!app || !app.renderer || !mapContainer || mapContainer.destroyed) return
      const now = performance.now() * 0.001
      animControllersRef.current.forEach((fn) => {
        try {
          fn(now)
        } catch {
          // ignore destroyed graphics during scene transition
        }
      })
    }
    app.ticker.add(tickerCallback)

    renderRef.current()

    return () => {
      app.ticker.remove(tickerCallback)
      appRef.current = null
      rootContainerRef.current = null
      mapContainerRef.current = null
    }
  }, [applyChaosTint])

  useEffect(() => {
    applyChaosTint(chaosLevel)
  }, [chaosLevel, applyChaosTint])

  const handleResizePixi = useCallback(() => {
    updateMapTransform()
    renderRef.current()
  }, [updateMapTransform])

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(2.0, +(prev + 0.15).toFixed(2)))
  const handleZoomOut = () => setZoom((prev) => Math.max(0.05, +(prev - 0.15).toFixed(2)))
  const handleResetPanZoom = () => {
    setZoom(1.0)
    setPan({ x: 0, y: 0 })
  }

  // Native non-passive wheel listener
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const zoomStep = -e.deltaY * 0.0015
      setZoom((prev) => Math.min(2.0, Math.max(0.05, +(prev + zoomStep).toFixed(3))))
    }

    el.addEventListener('wheel', handleNativeWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleNativeWheel)
    }
  }, [])

  // Pointer drag panning
  const handlePointerDown = (e: React.PointerEvent) => {
    const targetTag = (e.target as HTMLElement).tagName.toLowerCase()
    if (targetTag === 'canvas' || targetTag === 'div') {
      setIsDragging(true)
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    })
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  // Touch Pinch-to-Zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      touchDistRef.current = Math.hypot(dx, dy)
    } else if (e.touches.length === 1) {
      setIsDragging(true)
      dragStartRef.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const factor = dist / touchDistRef.current
      setZoom((prev) => Math.min(2.0, Math.max(0.05, +(prev * factor).toFixed(3))))
      touchDistRef.current = dist
    } else if (e.touches.length === 1 && isDragging) {
      setPan({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    touchDistRef.current = null
  }

  return (
    <div
      ref={containerRef}
      data-lenis-prevent
      data-lenis-prevent-wheel
      data-lenis-prevent-touch
      className={`relative w-full aspect-[16/10] min-h-[320px] max-h-[70vh] bg-[var(--ctp-base)] rounded-2xl border border-[var(--ctp-surface1)] overflow-hidden shadow-2xl flex items-center justify-center select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Reusable React Pixi Canvas Viewport */}
      <PixiCanvasViewport
        className="absolute inset-0 w-full h-full"
        backgroundColor={palette.baseNum}
        backgroundAlpha={1}
        defaultWidth={880}
        defaultHeight={580}
        onInit={handleInitPixi}
        onResize={handleResizePixi}
      />

      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(var(--ctp-blue)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Mobile-Friendly Zoom & Pan Controls Overlay */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-[var(--ctp-surface0)]/90 backdrop-blur-md p-1.5 rounded-xl border border-[var(--ctp-surface1)] shadow-lg">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-8 h-8 rounded-lg bg-[var(--ctp-crust)] hover:bg-[var(--ctp-surface1)] active:scale-95 text-[var(--ctp-text)] flex items-center justify-center transition-all border border-[var(--ctp-surface1)]"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-8 h-8 rounded-lg bg-[var(--ctp-crust)] hover:bg-[var(--ctp-surface1)] active:scale-95 text-[var(--ctp-text)] flex items-center justify-center transition-all border border-[var(--ctp-surface1)]"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={handleResetPanZoom}
          title="Reset Pan & Zoom"
          className="px-2.5 h-8 rounded-lg bg-[var(--ctp-crust)] hover:bg-[var(--ctp-surface1)] active:scale-95 text-[var(--ctp-blue)] font-mono text-xs font-semibold flex items-center gap-1 transition-all border border-[var(--ctp-surface1)]"
        >
          <RotateCcw size={13} />
          <span>{Math.round(zoom * 100)}%</span>
        </button>
      </div>

      {/* Map Pan Drag Hint */}
      <div className="absolute top-3 left-3 z-20 hidden sm:flex items-center gap-1.5 bg-[var(--ctp-surface0)]/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-[var(--ctp-surface1)] text-[11px] text-[var(--ctp-subtext0)] pointer-events-none">
        <Move size={12} className="text-[var(--ctp-blue)]" />
        <span>Drag canvas to pan • Pinch / Wheel to zoom</span>
      </div>

      {/* Map Control Overlay Legend */}
      <div className="absolute bottom-3 left-3 z-20 bg-[var(--ctp-surface0)]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-[var(--ctp-surface1)] flex items-center gap-3 text-xs text-[var(--ctp-text)] max-w-[92vw] overflow-x-auto">
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-[var(--ctp-blue)]" /> Capital</div>
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-[var(--ctp-green)]" /> Sanctuary</div>
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-[var(--ctp-red)]" /> Monster</div>
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-[var(--ctp-mauve)]" /> Reflection</div>
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-[var(--ctp-yellow)]" /> Workshop</div>
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-[var(--ctp-maroon)]" /> Boss</div>
        <div className="flex items-center gap-1 shrink-0 border-l border-[var(--ctp-surface1)] pl-3"><span className="w-2.5 h-2.5 rounded-full bg-[var(--ctp-surface1)]" /> Locked (Fog)</div>
      </div>
    </div>
  )
})
