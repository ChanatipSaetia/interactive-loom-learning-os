import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { SectionRegistry } from '../../core/registry'
import * as Icons from 'lucide-react'
import './flowchart.css'

export interface FlowchartNode {
  id: string
  label: string
  stereotype: string
  icon: string
  layer?: number
}

export interface FlowchartEdge {
  from: string
  to: string
}

export interface Step {
  nodeId: string
  description: string
}

export interface Journey {
  id: string
  label: string
  steps: Step[]
}

export interface FlowchartProps {
  title?: string
  nodes: FlowchartNode[]
  edges: FlowchartEdge[]
  journeys?: Journey[]
}

interface PositionedNode extends FlowchartNode {
  x: number
  y: number
}

interface TransformState {
  scale: number
  translateX: number
  translateY: number
}

interface PinchState {
  active: boolean
  initialDist: number
  initialScale: number
}

const nodeWidth = 160
const nodeHeight = 64
const layerHeight = 120
const nodeGap = 40
const svgPaddingX = 40
const svgPaddingTop = 40

export function computeLayout(nodes: FlowchartNode[]): PositionedNode[] {
  const layers = new Map<number, FlowchartNode[]>()

  for (const node of nodes) {
    const layer = node.layer ?? 0
    if (!layers.has(layer)) {
      layers.set(layer, [])
    }
    layers.get(layer)!.push(node)
  }

  const sortedLayerKeys = Array.from(layers.keys()).sort((a, b) => a - b)

  const positioned: PositionedNode[] = []

  for (const layerKey of sortedLayerKeys) {
    const layerNodes = layers.get(layerKey)!

    if (layerNodes.length === 1) {
      const node = layerNodes[0]
      positioned.push({
        ...node,
        x: 0,
        y: svgPaddingTop + layerKey * layerHeight,
      })
    } else {
      const totalWidth = layerNodes.length * nodeWidth + (layerNodes.length - 1) * nodeGap
      const startX = -totalWidth / 2

      layerNodes.forEach((node, idx) => {
        positioned.push({
          ...node,
          x: startX + idx * (nodeWidth + nodeGap) + nodeWidth / 2,
          y: svgPaddingTop + layerKey * layerHeight,
        })
      })
    }
  }

  return positioned
}

export function computeLayoutWithBarycenter(
  nodes: FlowchartNode[],
  edges: FlowchartEdge[]
): PositionedNode[] {
  const layers = new Map<number, FlowchartNode[]>()

  for (const node of nodes) {
    const layer = node.layer ?? 0
    if (!layers.has(layer)) {
      layers.set(layer, [])
    }
    layers.get(layer)!.push(node)
  }

  const sortedLayerKeys = Array.from(layers.keys()).sort((a, b) => a - b)

  const positioned = computeLayout(nodes)

  const positionedMap = new Map<string, PositionedNode>()
  for (const p of positioned) {
    positionedMap.set(p.id, p)
  }

  for (let iteration = 0; iteration < 5; iteration++) {
    for (let i = 1; i < sortedLayerKeys.length; i++) {
      const layerKey = sortedLayerKeys[i]
      const layerNodes = layers.get(layerKey)!

      if (layerNodes.length <= 1) continue

      const barycenters = layerNodes.map((node) => {
        const incomingEdges = edges.filter((e) => e.to === node.id)
        if (incomingEdges.length === 0) {
          const p = positionedMap.get(node.id)!
          return p.x
        }
        const sum = incomingEdges.reduce((acc, e) => {
          const fromPos = positionedMap.get(e.from)
          return acc + (fromPos ? fromPos.x : 0)
        }, 0)
        return sum / incomingEdges.length
      })

      const sortedIndices = barycenters
        .map((bc, idx) => ({ bc, idx }))
        .sort((a, b) => a.bc - b.bc)
        .map((item) => item.idx)

      const totalWidth = layerNodes.length * nodeWidth + (layerNodes.length - 1) * nodeGap
      const startX = -totalWidth / 2

      const newPositions = new Map<string, number>()
      sortedIndices.forEach((originalIdx, sortedIdx) => {
        const node = layerNodes[originalIdx]
        newPositions.set(node.id, startX + sortedIdx * (nodeWidth + nodeGap) + nodeWidth / 2)
      })

      for (const [id, x] of newPositions) {
        const p = positionedMap.get(id)!
        p.x = x
      }
    }
  }

  return positioned
}

function getIconComponent(iconName: string) {
  const IconComponent = (Icons as unknown as Record<string, ComponentType<{ size?: number; className?: string }>>)[iconName]
  return IconComponent ? <IconComponent size={16} className="flowchart-node-icon" /> : null
}

function Flowchart({ title, nodes, edges, journeys }: FlowchartProps) {
  const basePositioned = useMemo(
    () => computeLayoutWithBarycenter(nodes, edges),
    [nodes, edges]
  )

  const [currentJourneyId, setCurrentJourneyId] = useState<string>(
    journeys?.[0]?.id ?? ''
  )
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const playTimerRef = useRef<number | null>(null)

  const currentJourney = journeys?.find((j) => j.id === currentJourneyId)
  const highlightedNodeId = currentJourney?.steps[currentStep]?.nodeId

  useEffect(() => {
    if (isPlaying && currentJourney && currentStep < currentJourney.steps.length - 1) {
      playTimerRef.current = window.setTimeout(() => {
        setCurrentStep((s) => s + 1)
      }, 1200)
    } else {
      setIsPlaying(false)
    }
    return () => {
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current)
        playTimerRef.current = null
      }
    }
  }, [isPlaying, currentStep, currentJourney])

  const handleJourneyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentJourneyId(e.target.value)
    setCurrentStep(0)
    setIsPlaying(false)
  }, [])

  const handlePlay = useCallback(() => {
    if (currentJourney && currentStep < currentJourney.steps.length - 1) {
      setIsPlaying(true)
    }
  }, [currentJourney, currentStep])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const handleNext = useCallback(() => {
    if (currentJourney && currentStep < currentJourney.steps.length - 1) {
      setCurrentStep((s) => s + 1)
    }
  }, [currentJourney, currentStep])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }, [currentStep])

  const handleReset = useCallback(() => {
    setCurrentStep(0)
    setIsPlaying(false)
  }, [])

  const [dragOffsets, setDragOffsets] = useState<Record<string, { dx: number; dy: number }>>({})
  const dragRef = useRef<{ active: boolean; nodeId: string | null; lastSvgX: number; lastSvgY: number; svgEl: SVGSVGElement | null }>({
    active: false,
    nodeId: null,
    lastSvgX: 0,
    lastSvgY: 0,
    svgEl: null,
  })

  const [transform, setTransform] = useState<TransformState>({ scale: 1, translateX: 0, translateY: 0 })
  const isPanningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0, baseTranslateX: 0, baseTranslateY: 0 })
  const pinchRef = useRef<PinchState>({ active: false, initialDist: 0, initialScale: 1 })

  const positioned = useMemo(() => {
    return basePositioned.map((n) => {
      const offset = dragOffsets[n.id]
      return offset ? { ...n, x: n.x + offset.dx, y: n.y + offset.dy } : n
    })
  }, [basePositioned, dragOffsets])

  const nodeMap = useMemo(() => {
    const m = Object.create(null)
    for (const n of positioned) {
      m[n.id] = n
    }
    return m
  }, [positioned])

  const minX = positioned.length > 0 ? Math.min(...positioned.map((n) => n.x)) : 0
  const maxX = positioned.length > 0 ? Math.max(...positioned.map((n) => n.x)) : 0
  const minY = positioned.length > 0 ? Math.min(...positioned.map((n) => n.y)) : 0
  const maxY = positioned.length > 0 ? Math.max(...positioned.map((n) => n.y)) : 0

  const svgWidth = Math.max(600, (maxX - minX) + nodeWidth + svgPaddingX * 2)
  const svgHeight = Math.max(300, (maxY - minY) + nodeHeight + svgPaddingTop * 2)
  const offsetX = svgWidth / 2
  const offsetY = -minY + svgPaddingTop

  const getSvgPoint = useCallback(
    (clientX: number, clientY: number, svgEl: SVGSVGElement) => {
      const pt = svgEl.createSVGPoint()
      pt.x = clientX
      pt.y = clientY
      const ctm = svgEl.getScreenCTM()
      if (!ctm) return { x: clientX, y: clientY }
      const svgP = pt.matrixTransform(ctm.inverse())
      return { x: svgP.x, y: svgP.y }
    },
    []
  )

  const onNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation()
      const svgEl = e.currentTarget.closest('svg') as SVGSVGElement
      if (!svgEl) return
      const pt = getSvgPoint(e.clientX, e.clientY, svgEl)
      dragRef.current = { active: true, nodeId, lastSvgX: pt.x, lastSvgY: pt.y, svgEl }
    },
    [getSvgPoint]
  )

  const onNodeTouchStart = useCallback(
    (e: React.TouchEvent, nodeId: string) => {
      if (e.touches.length !== 1) return
      e.stopPropagation()
      const svgEl = (e.currentTarget as Element).closest('svg') as SVGSVGElement
      if (!svgEl) return
      const touch = e.touches[0]
      const pt = getSvgPoint(touch.clientX, touch.clientY, svgEl)
      dragRef.current = { active: true, nodeId, lastSvgX: pt.x, lastSvgY: pt.y, svgEl }
    },
    [getSvgPoint]
  )

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (dragRef.current.active && dragRef.current.nodeId) {
        const svgEl = dragRef.current.svgEl
        if (!svgEl) return
        const pt = getSvgPoint(clientX, clientY, svgEl)
        const nodeId = dragRef.current.nodeId
        const deltaSvgX = pt.x - dragRef.current.lastSvgX
        const deltaSvgY = pt.y - dragRef.current.lastSvgY
        dragRef.current.lastSvgX = pt.x
        dragRef.current.lastSvgY = pt.y
        setDragOffsets((prev) => {
          const prevOffset = prev[nodeId] || { dx: 0, dy: 0 }
          return { ...prev, [nodeId]: { dx: prevOffset.dx + deltaSvgX, dy: prevOffset.dy + deltaSvgY } }
        })
        return
      }
      if (isPanningRef.current) {
        const dx = (clientX - panStartRef.current.x) / transform.scale
        const dy = (clientY - panStartRef.current.y) / transform.scale
        setTransform((prev) => ({
          ...prev,
          translateX: panStartRef.current.baseTranslateX + dx,
          translateY: panStartRef.current.baseTranslateY + dy,
        }))
      }
    },
    [getSvgPoint, transform.scale]
  )

  const handlePointerUp = useCallback(() => {
    dragRef.current = { active: false, nodeId: null, lastSvgX: 0, lastSvgY: 0, svgEl: null }
    isPanningRef.current = false
    pinchRef.current = { active: false, initialDist: 0, initialScale: 1 }
  }, [])

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => handlePointerMove(e.clientX, e.clientY),
    [handlePointerMove]
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (pinchRef.current.active && e.touches.length === 2) {
        const t1 = e.touches[0]
        const t2 = e.touches[1]
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        const scaleRatio = dist / pinchRef.current.initialDist
        const newScale = Math.min(3, Math.max(0.3, pinchRef.current.initialScale * scaleRatio))
        const svgEl = e.currentTarget as SVGSVGElement
        const rect = svgEl.getBoundingClientRect()
        const centerX = (t1.clientX + t2.clientX) / 2 - rect.left
        const centerY = (t1.clientY + t2.clientY) / 2 - rect.top
        const svgCenterX = (centerX - rect.width / 2) / transform.scale
        const svgCenterY = (centerY - rect.height / 2) / transform.scale
        const scaleFactor = newScale / transform.scale
        setTransform((prev) => ({
          scale: newScale,
          translateX: prev.translateX + svgCenterX * (1 - scaleFactor),
          translateY: prev.translateY + svgCenterY * (1 - scaleFactor),
        }))
        return
      }
      if (e.touches.length === 1 && (isPanningRef.current || dragRef.current.active === false)) {
        const touch = e.touches[0]
        handlePointerMove(touch.clientX, touch.clientY)
      }
    },
    [handlePointerMove, transform.scale]
  )

  const onSvgMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as Element).closest('.flowchart-node-group')) return
      isPanningRef.current = true
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        baseTranslateX: transform.translateX,
        baseTranslateY: transform.translateY,
      }
    },
    [transform.translateX, transform.translateY]
  )

  const onSvgTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0]
        const t2 = e.touches[1]
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        pinchRef.current = { active: true, initialDist: dist, initialScale: transform.scale }
        isPanningRef.current = false
        return
      }
      if (e.touches.length === 1) {
        const target = e.target as Element
        if (!target.closest('.flowchart-node-group')) {
          isPanningRef.current = true
          const touch = e.touches[0]
          panStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            baseTranslateX: transform.translateX,
            baseTranslateY: transform.translateY,
          }
        }
      }
    },
    [transform]
  )

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = -e.deltaY * 0.001
      const newScale = Math.min(3, Math.max(0.3, transform.scale * (1 + delta)))
      const svgEl = e.currentTarget as SVGSVGElement
      const rect = svgEl.getBoundingClientRect()
      const mouseX = e.clientX - rect.left - rect.width / 2
      const mouseY = e.clientY - rect.top - rect.height / 2
      const svgMouseX = mouseX / transform.scale
      const svgMouseY = mouseY / transform.scale
      const scaleFactor = newScale / transform.scale
      setTransform((prev) => ({
        scale: newScale,
        translateX: prev.translateX + svgMouseX * (1 - scaleFactor),
        translateY: prev.translateY + svgMouseY * (1 - scaleFactor),
      }))
    },
    [transform.scale]
  )

  const transformStr = `translate(${transform.translateX}, ${transform.translateY}) scale(${transform.scale})`

  return (
    <div className="flowchart-section" data-testid="flowchart-section">
      {title && (
        <h3 className="flowchart-title" data-testid="flowchart-title">
          {title}
        </h3>
      )}

      {journeys && journeys.length > 0 && (
        <div className="flowchart-controls" data-testid="flowchart-controls">
          <div className="flowchart-journey-selector">
            <label htmlFor="flowchart-journey-select" className="flowchart-journey-label">Journey:</label>
            <select
              id="flowchart-journey-select"
              className="flowchart-journey-select"
              value={currentJourneyId}
              onChange={handleJourneyChange}
              data-testid="flowchart-journey-select"
            >
              {journeys.map((j) => (
                <option key={j.id} value={j.id}>{j.label}</option>
              ))}
            </select>
          </div>

          <div className="flowchart-playback" data-testid="flowchart-playback">
            <button
              className="flowchart-btn flowchart-btn-play"
              disabled={isPlaying || (!currentJourney || currentStep >= currentJourney.steps.length - 1)}
              onClick={handlePlay}
              data-testid="flowchart-btn-play"
              aria-label="Play"
            >
              ▶
            </button>
            <button
              className="flowchart-btn flowchart-btn-pause"
              disabled={!isPlaying}
              onClick={handlePause}
              data-testid="flowchart-btn-pause"
              aria-label="Pause"
            >
              ❚❚
            </button>
            <button
              className="flowchart-btn flowchart-btn-next"
              disabled={!currentJourney || currentStep >= currentJourney.steps.length - 1}
              onClick={handleNext}
              data-testid="flowchart-btn-next"
              aria-label="Next"
            >
              ⏭
            </button>
            <button
              className="flowchart-btn flowchart-btn-prev"
              disabled={currentStep === 0}
              onClick={handlePrev}
              data-testid="flowchart-btn-prev"
              aria-label="Previous"
            >
              ⏮
            </button>
            <button
              className="flowchart-btn flowchart-btn-reset"
              disabled={currentStep === 0}
              onClick={handleReset}
              data-testid="flowchart-btn-reset"
              aria-label="Reset"
            >
              ⏹
            </button>
            <span className="flowchart-progress" data-testid="flowchart-progress">
              {currentStep + 1} / {currentJourney?.steps.length ?? 0}
            </span>
          </div>
        </div>
      )}

      <svg
        className="flowchart-svg"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        data-testid="flowchart-svg"
        onMouseMove={onMouseMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onMouseDown={onSvgMouseDown}
        onTouchStart={onSvgTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={handlePointerUp}
        onWheel={onWheel}
      >
        <defs>
          <marker
            id="flowchart-arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="var(--hairline)"
            />
          </marker>
        </defs>

        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="transparent"
          style={{ pointerEvents: 'none' }}
        />

        <g transform={transformStr} data-testid="flowchart-canvas">
          {edges.map((edge, idx) => {
            const fromNode = nodeMap[edge.from]
            const toNode = nodeMap[edge.to]
            if (!fromNode || !toNode) return null

            const x1 = fromNode.x + offsetX
            const y1 = fromNode.y + offsetY + nodeHeight
            const x2 = toNode.x + offsetX
            const y2 = toNode.y + offsetY

            return (
              <g key={`edge-${idx}`} data-testid={`flowchart-edge-${idx}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="var(--hairline)"
                  strokeWidth="2"
                  markerEnd="url(#flowchart-arrowhead)"
                />
              </g>
            )
          })}

          {positioned.map((node) => {
            const x = node.x + offsetX - nodeWidth / 2
            const y = node.y + offsetY - nodeHeight / 2

            return (
              <g
                key={node.id}
                data-testid={`flowchart-node-${node.id}`}
                className="flowchart-node-group"
                onMouseDown={(e) => onNodeMouseDown(e, node.id)}
                onMouseMove={onMouseMove}
                onMouseUp={handlePointerUp}
                onTouchStart={(e) => onNodeTouchStart(e, node.id)}
                onTouchMove={(e) => {
                  if (e.touches.length === 1 && dragRef.current.active) {
                    const touch = e.touches[0]
                    handlePointerMove(touch.clientX, touch.clientY)
                  }
                }}
                onTouchEnd={handlePointerUp}
              >
                <rect
                  x={x}
                  y={y}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx="var(--radius-sm)"
                  fill={highlightedNodeId === node.id ? 'var(--pale-blue)' : 'var(--canvas)'}
                  stroke={highlightedNodeId === node.id ? 'var(--action-blue)' : 'var(--hairline)'}
                  strokeWidth={highlightedNodeId === node.id ? '2.5' : '1'}
                  className={`flowchart-node-rect${highlightedNodeId === node.id ? ' flowchart-node-highlighted' : ''}`}
                />
                {getIconComponent(node.icon) && (
                  <foreignObject
                    x={x + 8}
                    y={y + 8}
                    width={20}
                    height={20}
                    className="flowchart-node-icon-fo"
                  >
                    <div className="flowchart-node-icon-wrapper">
                      {getIconComponent(node.icon)}
                    </div>
                  </foreignObject>
                )}
                <text
                  x={x + nodeWidth / 2 + 8}
                  y={y + 22}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="flowchart-node-label"
                >
                  {node.label}
                </text>
                <text
                  x={x + nodeWidth / 2}
                  y={y + 42}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="flowchart-node-stereotype"
                >
                  &lt;&lt;{node.stereotype}&gt;&gt;
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

SectionRegistry.register('flowchart', Flowchart as ComponentType<unknown>)

export default Flowchart
