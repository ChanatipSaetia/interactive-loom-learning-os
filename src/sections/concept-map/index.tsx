import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import './concept-map.css'

export interface ConceptNode {
  id: string
  title: string
  definition: string
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

const NODE_RADIUS = 32
const SIMULATION_STEPS = 200
const REPULSION = 40000
const ATTRACTION = 0.005
const CENTER_GRAVITY = 0.008
const DAMPING = 0.85

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
    x: (Math.random() - 0.5) * width * 0.5 + width / 2,
    y: (Math.random() - 0.5) * height * 0.5 + height / 2,
    vx: 0,
    vy: 0,
  }))

  const nodeMap = new Map<string, typeof simNodes[0]>()
  simNodes.forEach((n) => nodeMap.set(n.id, n))

  for (let step = 0; step < SIMULATION_STEPS; step++) {
    const cooling = 1 - step / SIMULATION_STEPS

    for (let i = 0; i < simNodes.length; i++) {
      for (let j = i + 1; j < simNodes.length; j++) {
        const a = simNodes[i]
        const b = simNodes[j]
        let dx = b.x - a.x
        let dy = b.y - a.y
        let dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = REPULSION / (dist * dist)
        const fx = (dx / dist) * force * cooling
        const fy = (dy / dist) * force * cooling
        a.vx -= fx
        a.vy -= fy
        b.vx += fx
        b.vy += fy
      }
    }

    for (const edge of edges) {
      const a = nodeMap.get(edge.from)
      const b = nodeMap.get(edge.to)
      if (!a || !b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const force = dist * ATTRACTION * cooling
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      a.vx += fx
      a.vy += fy
      b.vx -= fx
      b.vy -= fy
    }

    for (const node of simNodes) {
      const dx = width / 2 - node.x
      const dy = height / 2 - node.y
      node.vx += dx * CENTER_GRAVITY * cooling
      node.vy += dy * CENTER_GRAVITY * cooling
    }

    for (const node of simNodes) {
      node.vx *= DAMPING
      node.vy *= DAMPING
      node.x += node.vx
      node.y += node.vy
      node.x = Math.max(NODE_RADIUS + 20, Math.min(width - NODE_RADIUS - 20, node.x))
      node.y = Math.max(NODE_RADIUS + 20, Math.min(height - NODE_RADIUS - 20, node.y))
    }
  }

  const result: Record<string, ConceptNode> = {}
  for (const n of simNodes) {
    result[n.id] = { id: n.id, title: n.title, definition: n.definition, category: n.category, x: n.x, y: n.y }
  }
  return result
}

function ConceptMapSection({ title, nodes, edges }: ConceptMapSectionProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [transform, setTransform] = useState<TransformState>({ scale: 1, translateX: 0, translateY: 0 })
  const [layoutNodes, setLayoutNodes] = useState<Record<string, ConceptNode>>({})
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
    const w = rect.width || 800
    const h = rect.height || 500
    const laid = simulateLayout(nodeIds, nodes, edges, w, h)
    setLayoutNodes(laid)

    const centerX = (w - w * 0.6) / 2
    const centerY = (h - h * 0.6) / 2
    setTransform({ scale: 0.6, translateX: centerX, translateY: centerY })
  }, [nodes, edges])

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
    const w = rect.width || 800
    const h = rect.height || 500
    const centerX = (w - w * 0.6) / 2
    const centerY = (h - h * 0.6) / 2
    setTransform({ scale: 0.6, translateX: centerX, translateY: centerY })
  }, [])

  const handleNodeClick = useCallback((id: string) => {
    setSelectedNode((prev) => (prev === id ? null : id))
  }, [])

  const isNodeHovered = (id: string): boolean => {
    if (!hoveredNode) return false
    if (id === hoveredNode) return true
    return connectedNodes.get(hoveredNode)?.has(id) ?? false
  }

  const isEdgeConnected = (edge: ConceptEdge): boolean => {
    if (!hoveredNode) return false
    return edge.from === hoveredNode || edge.to === hoveredNode
  }

  const selectedNodeData = selectedNode ? layoutNodes[selectedNode] : null

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
            viewBox="0 0 800 500"
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

                let dx = to.x - from.x
                let dy = to.y - from.y
                const dist = Math.sqrt(dx * dx + dy * dy) || 1
                const nx = dx / dist
                const ny = dy / dist

                const x1 = from.x + nx * NODE_RADIUS
                const y1 = from.y + ny * NODE_RADIUS
                const x2 = to.x - nx * NODE_RADIUS
                const y2 = to.y - ny * NODE_RADIUS

                return (
                  <g key={`edge-${edge.from}-${edge.to}-${idx}`} data-testid={`concept-map-edge-${idx}`}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      className={`cm-edge ${isConnected ? 'cm-edge-highlight' : ''} ${isDimmed ? 'cm-edge-dimmed' : ''}`}
                      data-testid={`concept-map-edge-line-${idx}`}
                    />
                    {edge.label && (() => {
                      const lx = (x1 + x2) / 2
                      const ly = (y1 + y2) / 2 - 6
                      const tw = edge.label.length * 6 + 10
                      return (
                        <>
                          <rect
                            x={lx - tw / 2}
                            y={ly - 8}
                            width={tw}
                            height={15}
                            rx={4}
                            className="cm-edge-label-bg"
                          />
                          <text
                            x={lx}
                            y={ly}
                            className="cm-edge-label"
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
                const isSelected = selectedNode === id
                const color = getCategoryColor(node.category)
                const fill = getCategoryFill(node.category)

                return (
                  <g
                    key={id}
                    className={`cm-node-group ${isHov ? 'cm-node-highlight' : ''} ${isDimmed ? 'cm-node-dimmed' : ''} ${isSelected ? 'cm-node-selected' : ''}`}
                    data-testid={`concept-map-node-${id}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleNodeClick(id)
                    }}
                    onMouseEnter={() => setHoveredNode(id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    cursor="pointer"
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={NODE_RADIUS}
                      fill={fill}
                      stroke={color}
                      strokeWidth={isSelected ? 3 : 2}
                      data-testid={`concept-map-node-circle-${id}`}
                    />
                    <text
                      x={node.x}
                      y={node.y - 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="cm-node-title"
                      fill="var(--ctp-text)"
                      data-testid={`concept-map-node-title-${id}`}
                    >
                      {node.title.length > 14 ? node.title.slice(0, 13) + '…' : node.title}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 14}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="cm-node-category"
                      fill={color}
                    >
                      {node.category}
                    </text>
                    {isHov && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={NODE_RADIUS + 5}
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

        <AnimatePresence>
          {selectedNodeData && (
            <motion.div
              className="concept-map-panel"
              data-testid="concept-map-panel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="concept-map-panel-header">
                <div className="concept-map-panel-category">
                  <span
                    className="concept-map-panel-dot"
                    style={{ backgroundColor: getCategoryColor(selectedNodeData.category) }}
                  />
                  <span>{selectedNodeData.category}</span>
                </div>
                <button
                  className="concept-map-panel-close"
                  data-testid="concept-map-panel-close"
                  onClick={() => setSelectedNode(null)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h4 className="concept-map-panel-title" data-testid="concept-map-panel-title">
                {selectedNodeData.title}
              </h4>
              <p className="concept-map-panel-def" data-testid="concept-map-panel-definition">
                {selectedNodeData.definition}
              </p>
              {connectedNodes.get(selectedNodeData.id)?.size && (
                <div className="concept-map-panel-connections">
                  <span className="concept-map-panel-connections-label">Connected to:</span>
                  <div className="concept-map-panel-connection-list">
                    {Array.from(connectedNodes.get(selectedNodeData.id) ?? []).map((connId) => {
                      const connNode = layoutNodes[connId]
                      if (!connNode) return null
                      return (
                        <button
                          key={connId}
                          className="concept-map-panel-connection-item"
                          data-testid={`concept-map-panel-connection-${connId}`}
                          onClick={() => setSelectedNode(connId)}
                        >
                          <span
                            className="concept-map-panel-connection-dot"
                            style={{ backgroundColor: getCategoryColor(connNode.category) }}
                          />
                          {connNode.title}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ConceptMapSection

function useEffectSyncRef<T>(value: T, ref: React.MutableRefObject<T>) {
  ref.current = value
}
