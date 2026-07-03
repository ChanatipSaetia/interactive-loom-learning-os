import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide } from 'd3-force'
import './concept-map.css'

export interface ConceptNode {
  id: string
  title: string
  category: string
  x?: number
  y?: number
  vx?: number
  vy?: number
}

export interface ConceptEdge {
  from: string
  to: string
  label?: string
}

export interface ConceptMapSectionProps {
  title?: string
  nodes: Record<string, ConceptNode>
  edges: ConceptEdge[]
}

interface TransformState {
  scale: number
  translateX: number
  translateY: number
}

const CATEGORY_COLORS: Record<string, string> = {
  pattern: 'var(--ctp-mauve)',
  mechanism: 'var(--ctp-sky)',
  concept: 'var(--ctp-green)',
  role: 'var(--ctp-yellow)',
  system: 'var(--ctp-sapphire)',
  data: 'var(--ctp-teal)',
  process: 'var(--ctp-peach)',
  default: 'var(--ctp-lavender)',
}

const CATEGORY_FILLS: Record<string, string> = {
  pattern: 'color-mix(in srgb, var(--ctp-mauve) 15%, var(--ctp-surface0))',
  mechanism: 'color-mix(in srgb, var(--ctp-sky) 15%, var(--ctp-surface0))',
  concept: 'color-mix(in srgb, var(--ctp-green) 15%, var(--ctp-surface0))',
  role: 'color-mix(in srgb, var(--ctp-yellow) 15%, var(--ctp-surface0))',
  system: 'color-mix(in srgb, var(--ctp-sapphire) 15%, var(--ctp-surface0))',
  data: 'color-mix(in srgb, var(--ctp-teal) 15%, var(--ctp-surface0))',
  process: 'color-mix(in srgb, var(--ctp-peach) 15%, var(--ctp-surface0))',
  default: 'color-mix(in srgb, var(--ctp-lavender) 15%, var(--ctp-surface0))',
}

const NODE_HEIGHT = 56

function getNodeWidth(title: string): number {
  return Math.min(200, Math.max(100, title.length * 8 + 40))
}

function getViewportDimensions(cW: number, cH: number): { viewW: number; viewH: number } {
  const ratio = cW / cH
  const baseRatio = 1400 / 900
  let viewW = ratio >= baseRatio ? Math.round(900 * ratio) : 1400
  let viewH = ratio >= baseRatio ? 900 : Math.round(1400 / ratio)

  // Clamp height to a maximum of 1400 to avoid overly tall viewports
  if (viewH > 1400) {
    viewH = 1400
    viewW = Math.round(1400 * ratio)
  }
  // Clamp width to a maximum of 2800 to avoid overly wide viewports
  if (viewW > 2800) {
    viewW = 2800
    viewH = Math.round(2800 / ratio)
  }

  return { viewW, viewH }
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.default
}

function getCategoryFill(category: string): string {
  return CATEGORY_FILLS[category] ?? CATEGORY_FILLS.default
}

function simulateLayout(
  nodeIds: string[],
  nodes: Record<string, ConceptNode>,
  edges: ConceptEdge[],
  width: number,
  height: number
): Record<string, ConceptNode> {
  const simNodes = nodeIds.map((id) => ({
    ...nodes[id],
    id,
    x: width / 2 + (Math.random() - 0.5) * 100,
    y: height / 2 + (Math.random() - 0.5) * 100,
    rx: getNodeWidth(nodes[id].title) / 2 + 20,
    ry: NODE_HEIGHT / 2 + 20,
  }))

  const simLinks = edges.map((e) => ({ source: e.from, target: e.to }))

  const sim = forceSimulation(simNodes)
    .force('charge', forceManyBody().strength(-3000))
    .force('link', forceLink(simLinks).id((d: any) => d.id).distance(100).strength(0.6))
    .force('center', forceCenter(width / 2, height / 2).strength(0.08))
    .force('collide', forceCollide().radius((d: any) => Math.sqrt(d.rx * d.rx + d.ry * d.ry)).strength(1.0).iterations(4))

  for (let i = 0; i < 3000; i++) {
    sim.tick()
    simNodes.forEach((n: any) => {
      n.x = Math.max(n.rx, Math.min(width - n.rx, n.x))
      n.y = Math.max(n.ry, Math.min(height - n.ry, n.y))
    })
  }

  const result: Record<string, ConceptNode> = {}
  for (const n of simNodes) {
    result[n.id] = {
      id: n.id,
      title: n.title,
      category: n.category,
      x: n.x,
      y: n.y,
    }
  }
  return result
}

function ConceptMapSection({ title, nodes, edges }: ConceptMapSectionProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [transform, setTransform] = useState<TransformState>({ scale: 1, translateX: 0, translateY: 0 })
  const [layoutNodes, setLayoutNodes] = useState<Record<string, ConceptNode>>({})
  const [viewBox, setViewBox] = useState('0 0 1400 900')
  const [isPanning, setIsPanning] = useState(false)
  const transformRef = useRef(transform)
  const isPanningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0, baseTranslateX: 0, baseTranslateY: 0 })
  const pinchRef = useRef({ active: false, initialDist: 0, initialScale: 1 })

  useEffectSyncRef(transform, transformRef)

  const nodeIds = useMemo(() => Object.keys(nodes), [nodes])

  const connectedNodes = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const id of nodeIds) {
      map.set(id, new Set<string>())
    }
    for (const edge of edges) {
      map.get(edge.from)?.add(edge.to)
      map.get(edge.to)?.add(edge.from)
    }
    return map
  }, [nodeIds, edges])

  useEffect(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const cW = Math.max(rect.width, 300)
    const cH = Math.max(rect.height, 300)
    const { viewW: VIEW_W, viewH: VIEW_H } = getViewportDimensions(cW, cH)
    setViewBox(`0 0 ${VIEW_W} ${VIEW_H}`)
    const laid = simulateLayout(nodeIds, nodes, edges, VIEW_W, VIEW_H)
    setLayoutNodes(laid)

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const id of nodeIds) {
      const n = laid[id]
      if (!n?.x || !n?.y) continue
      const hw = getNodeWidth(n.title) / 2 + 20
      const hh = NODE_HEIGHT / 2 + 20
      if (n.x - hw < minX) minX = n.x - hw
      if (n.y - hh < minY) minY = n.y - hh
      if (n.x + hw > maxX) maxX = n.x + hw
      if (n.y + hh > maxY) maxY = n.y + hh
    }
    const contentW = maxX - minX
    const contentH = maxY - minY
    const padding = 40
    const scale = Math.min((VIEW_W - padding * 2) / contentW, (VIEW_H - padding * 2) / contentH, 1.5)
    const centerX = (VIEW_W - contentW * scale) / 2 - minX * scale
    const centerY = (VIEW_H - contentH * scale) / 2 - minY * scale
    setTransform({ scale, translateX: centerX, translateY: centerY })
  }, [nodes, edges, nodeIds])

  // Native event listeners for wheel, touch (like flowchart useCamera)
  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = -e.deltaY * 0.0015
      const currentScale = transformRef.current.scale
      const currentTx = transformRef.current.translateX
      const currentTy = transformRef.current.translateY
      const newScale = Math.min(3, Math.max(0.15, currentScale * (1 + delta)))

      const rect = svgEl.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const svgMouseX = (mouseX - currentTx) / currentScale
      const svgMouseY = (mouseY - currentTy) / currentScale

      setTransform({
        scale: newScale,
        translateX: currentTx - svgMouseX * (newScale - currentScale),
        translateY: currentTy - svgMouseY * (newScale - currentScale),
      })
    }

    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as Element
      if (target.closest('.cm-node-group')) return
      if (e.touches.length === 2) {
        e.preventDefault()
        const t1 = e.touches[0]
        const t2 = e.touches[1]
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        pinchRef.current = { active: true, initialDist: dist, initialScale: transformRef.current.scale }
        isPanningRef.current = false
        setIsPanning(false)
        return
      }
      if (e.touches.length === 1) {
        e.preventDefault()
        isPanningRef.current = true
        setIsPanning(true)
        const touch = e.touches[0]
        panStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          baseTranslateX: transformRef.current.translateX,
          baseTranslateY: transformRef.current.translateY,
        }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (pinchRef.current.active && e.touches.length === 2) {
        e.preventDefault()
        const t1 = e.touches[0]
        const t2 = e.touches[1]
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        const scaleRatio = dist / pinchRef.current.initialDist
        const currentScale = transformRef.current.scale
        const currentTx = transformRef.current.translateX
        const currentTy = transformRef.current.translateY
        const newScale = Math.min(3, Math.max(0.15, pinchRef.current.initialScale * scaleRatio))

        const rect = svgEl.getBoundingClientRect()
        const centerX = (t1.clientX + t2.clientX) / 2 - rect.left
        const centerY = (t1.clientY + t2.clientY) / 2 - rect.top
        const svgCenterX = (centerX - currentTx) / currentScale
        const svgCenterY = (centerY - currentTy) / currentScale

        setTransform({
          scale: newScale,
          translateX: currentTx - svgCenterX * (newScale - currentScale),
          translateY: currentTy - svgCenterY * (newScale - currentScale),
        })
        return
      }
      if (e.touches.length === 1 && isPanningRef.current) {
        e.preventDefault()
        const touch = e.touches[0]
        const dx = touch.clientX - panStartRef.current.x
        const dy = touch.clientY - panStartRef.current.y
        setTransform(() => ({
          scale: transformRef.current.scale,
          translateX: panStartRef.current.baseTranslateX + dx,
          translateY: panStartRef.current.baseTranslateY + dy,
        }))
      }
    }

    const onTouchEnd = () => {
      isPanningRef.current = false
      setIsPanning(false)
      pinchRef.current = { active: false, initialDist: 0, initialScale: 1 }
    }

    svgEl.addEventListener('wheel', onWheel, { passive: false })
    svgEl.addEventListener('touchstart', onTouchStart, { passive: false })
    svgEl.addEventListener('touchmove', onTouchMove, { passive: false })
    svgEl.addEventListener('touchend', onTouchEnd)

    return () => {
      svgEl.removeEventListener('wheel', onWheel)
      svgEl.removeEventListener('touchstart', onTouchStart)
      svgEl.removeEventListener('touchmove', onTouchMove)
      svgEl.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (isPanningRef.current) {
      const dx = clientX - panStartRef.current.x
      const dy = clientY - panStartRef.current.y
      setTransform(() => ({
        scale: transformRef.current.scale,
        translateX: panStartRef.current.baseTranslateX + dx,
        translateY: panStartRef.current.baseTranslateY + dy,
      }))
    }
  }, [])

  const handlePointerUp = useCallback(() => {
    isPanningRef.current = false
    setIsPanning(false)
    pinchRef.current = { active: false, initialDist: 0, initialScale: 1 }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest('.cm-node-group')) return
    isPanningRef.current = true
    setIsPanning(true)
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      baseTranslateX: transformRef.current.translateX,
      baseTranslateY: transformRef.current.translateY,
    }
  }, [])

  const handleZoomIn = useCallback(() => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2
    const currentScale = transformRef.current.scale
    const currentTx = transformRef.current.translateX
    const currentTy = transformRef.current.translateY
    const newScale = Math.min(3, currentScale + 0.2)
    const svgX = (cx - currentTx) / currentScale
    const svgY = (cy - currentTy) / currentScale
    setTransform({
      scale: newScale,
      translateX: currentTx - svgX * (newScale - currentScale),
      translateY: currentTy - svgY * (newScale - currentScale),
    })
  }, [])

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2
    const currentScale = transformRef.current.scale
    const currentTx = transformRef.current.translateX
    const currentTy = transformRef.current.translateY
    const newScale = Math.max(0.15, currentScale - 0.2)
    const svgX = (cx - currentTx) / currentScale
    const svgY = (cy - currentTy) / currentScale
    setTransform({
      scale: newScale,
      translateX: currentTx - svgX * (newScale - currentScale),
      translateY: currentTy - svgY * (newScale - currentScale),
    })
  }, [])

  const handleReset = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const cW = Math.max(rect.width, 300)
    const cH = Math.max(rect.height, 300)
    const { viewW: VIEW_W, viewH: VIEW_H } = getViewportDimensions(cW, cH)

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const id of nodeIds) {
      const n = layoutNodes[id]
      if (!n?.x || !n?.y) continue
      const hw = getNodeWidth(n.title) / 2 + 20
      const hh = NODE_HEIGHT / 2 + 20
      if (n.x - hw < minX) minX = n.x - hw
      if (n.y - hh < minY) minY = n.y - hh
      if (n.x + hw > maxX) maxX = n.x + hw
      if (n.y + hh > maxY) maxY = n.y + hh
    }
    const contentW = maxX - minX
    const contentH = maxY - minY
    const padding = 40
    const scale = Math.min((VIEW_W - padding * 2) / contentW, (VIEW_H - padding * 2) / contentH, 1.5)
    const centerX = (VIEW_W - contentW * scale) / 2 - minX * scale
    const centerY = (VIEW_H - contentH * scale) / 2 - minY * scale
    setTransform({ scale, translateX: centerX, translateY: centerY })
  }, [nodeIds, layoutNodes])

  const isNodeHovered = (id: string): boolean => {
    if (!hoveredNode) return false
    if (id === hoveredNode) return true
    return connectedNodes.get(hoveredNode)?.has(id) ?? false
  }

  const isEdgeConnected = (edge: ConceptEdge): boolean => {
    if (!hoveredNode) return false
    return edge.from === hoveredNode || edge.to === hoveredNode
  }

  return (
    <div className="concept-map-section" data-testid="concept-map-section">
      {title && (
        <h3 className="concept-map-title" data-testid="concept-map-title">
          {title}
        </h3>
      )}

      <div className="concept-map-layout" ref={containerRef}>
        <div className="concept-map-canvas-wrapper">
          <svg
            ref={svgRef}
            className="concept-map-svg"
            data-testid="concept-map-svg"
            viewBox={viewBox}
            width="100%"
            height="100%"
            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
          >
            <g
              transform={`translate(${transform.translateX}, ${transform.translateY}) scale(${transform.scale})`}
            >
              <rect
                x="-2000"
                y="-2000"
                width="4000"
                height="4000"
                fill="transparent"
              />

              {edges.map((edge, idx) => {
                const from = layoutNodes[edge.from]
                const to = layoutNodes[edge.to]
                if (!from?.x || !from?.y || !to?.x || !to?.y) return null

                const isConnected = isEdgeConnected(edge)
                const isDimmed = hoveredNode && !isConnected

                const dx = to.x - from.x
                const dy = to.y - from.y
                const dist = Math.sqrt(dx * dx + dy * dy) || 1
                const nx = dx / dist
                const ny = dy / dist

                const fromHW = getNodeWidth(from.title) / 2
                const fromHH = NODE_HEIGHT / 2
                const toHW = getNodeWidth(to.title) / 2
                const toHH = NODE_HEIGHT / 2

                const intersectRect = (cx: number, cy: number, hw: number, hh: number, dxn: number, dyn: number) => {
                  const absDx = Math.abs(dxn)
                  const absDy = Math.abs(dyn)
                  let t = Infinity
                  if (absDx > 0) t = Math.min(t, hw / absDx)
                  if (absDy > 0) t = Math.min(t, hh / absDy)
                  return { x: cx + dxn * t, y: cy + dyn * t }
                }

                const p1 = intersectRect(from.x, from.y, fromHW, fromHH, nx, ny)
                const p2 = intersectRect(to.x, to.y, toHW, toHH, -nx, -ny)

                return (
                  <g key={`edge-${edge.from}-${edge.to}-${idx}`} data-testid={`concept-map-edge-${idx}`}>
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      className={`cm-edge ${isConnected ? 'cm-edge-highlight' : ''} ${isDimmed ? 'cm-edge-dimmed' : ''}`}
                      data-testid={`concept-map-edge-line-${idx}`}
                    />
                    {edge.label && (() => {
                      const lx = (p1.x + p2.x) / 2
                      const ly = (p1.y + p2.y) / 2 - 6
                      const tw = edge.label.length * 6 + 10
                      return (
                        <>
                          <rect
                            x={lx - tw / 2}
                            y={ly - 8}
                            width={tw}
                            height={15}
                            rx={4}
                            className={`cm-edge-label-bg ${isConnected ? 'cm-edge-label-highlight' : ''} ${isDimmed ? 'cm-edge-label-dimmed' : ''}`}
                          />
                          <text
                            x={lx}
                            y={ly}
                            className={`cm-edge-label ${isConnected ? 'cm-edge-label-highlight' : ''} ${isDimmed ? 'cm-edge-label-dimmed' : ''}`}
                            textAnchor="middle"
                            data-testid={`concept-map-edge-label-${idx}`}
                          >
                            {edge.label}
                          </text>
                        </>
                      )
                    })()}
                  </g>
                )
              })}

              {nodeIds.map((id) => {
                const node = layoutNodes[id]
                if (!node?.x || !node?.y) return null

                const isHov = isNodeHovered(id)
                const isDimmed = hoveredNode && !isHov
                const color = getCategoryColor(node.category)
                const fill = getCategoryFill(node.category)
                const nodeW = getNodeWidth(node.title)
                const nodeH = NODE_HEIGHT
                const nodeX = node.x - nodeW / 2
                const nodeY = node.y - nodeH / 2

                return (
                  <g
                    key={id}
                    className={`cm-node-group ${isHov ? 'cm-node-highlight' : ''} ${isDimmed ? 'cm-node-dimmed' : ''}`}
                    data-testid={`concept-map-node-${id}`}
                    onMouseEnter={() => setHoveredNode(id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <rect
                      x={nodeX}
                      y={nodeY}
                      width={nodeW}
                      height={nodeH}
                      rx={8}
                      fill={fill}
                      stroke={color}
                      strokeWidth={isHov ? 3 : 2}
                      data-testid={`concept-map-node-circle-${id}`}
                    />
                    <text
                      x={node.x}
                      y={node.y - 6}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="cm-node-title"
                      fill="var(--ctp-text)"
                      data-testid={`concept-map-node-title-${id}`}
                    >
                      {node.title}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 12}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="cm-node-category"
                      fill={color}
                    >
                      {node.category}
                    </text>
                    {isHov && (
                      <rect
                        x={nodeX - 5}
                        y={nodeY - 5}
                        width={nodeW + 10}
                        height={nodeH + 10}
                        rx={10}
                        fill="none"
                        stroke={color}
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        opacity={0.6}
                      />
                    )}
                  </g>
                )
              })}
            </g>
          </svg>

          <div className="concept-map-toolbar">
            <button
              className="concept-map-toolbar-btn"
              data-testid="concept-map-zoom-in"
              onClick={handleZoomIn}
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              className="concept-map-toolbar-btn"
              data-testid="concept-map-zoom-out"
              onClick={handleZoomOut}
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              className="concept-map-toolbar-btn"
              data-testid="concept-map-reset-view"
              onClick={handleReset}
              title="Reset view"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          <div className="concept-map-legend">
            {Array.from(new Set(nodeIds.map((id) => nodes[id]?.category))).map((cat) => (
              <div key={cat} className="concept-map-legend-item" data-testid={`concept-map-legend-${cat}`}>
                <span
                  className="concept-map-legend-dot"
                  style={{ backgroundColor: getCategoryColor(cat) }}
                />
                <span>{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConceptMapSection

function useEffectSyncRef<T>(value: T, ref: React.MutableRefObject<T>) {
  ref.current = value
}
