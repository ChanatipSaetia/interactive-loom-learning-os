import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { animate } from 'animejs'
import { SectionRegistry } from '../../core/registry'
import * as Icons from 'lucide-react'
import './flowchart.css'

export interface FlowchartNode {
  id: string
  label: string
  stereotype: string
  icon: string
  layer?: number
  description?: string
}

export interface FlowchartEdge {
  from: string
  to: string
  description?: string
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
const layerGap = 220   // horizontal spacing between layers (left-to-right)
const nodeGap = 80     // vertical spacing between nodes in the same layer
const svgPaddingX = 60
const svgPaddingTop = 40

export function computeLayout(nodes: FlowchartNode[]): PositionedNode[] {
  const layers = new Map<number, FlowchartNode[]>()

  for (const node of nodes) {
    const layer = node.layer ?? 0
    if (!layers.has(layer)) layers.set(layer, [])
    layers.get(layer)!.push(node)
  }

  const sortedLayerKeys = Array.from(layers.keys()).sort((a, b) => a - b)
  const positioned: PositionedNode[] = []

  for (const layerKey of sortedLayerKeys) {
    const layerNodes = layers.get(layerKey)!
    const layerX = svgPaddingX + layerKey * layerGap + nodeWidth / 2
    const totalHeight = layerNodes.length * nodeHeight + (layerNodes.length - 1) * nodeGap
    const startY = -totalHeight / 2

    layerNodes.forEach((node, idx) => {
      positioned.push({
        ...node,
        x: layerX,
        y: startY + idx * (nodeHeight + nodeGap) + nodeHeight / 2,
      })
    })
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
    if (!layers.has(layer)) layers.set(layer, [])
    layers.get(layer)!.push(node)
  }

  const sortedLayerKeys = Array.from(layers.keys()).sort((a, b) => a - b)
  const positioned = computeLayout(nodes)

  const positionedMap = new Map<string, PositionedNode>()
  for (const p of positioned) positionedMap.set(p.id, p)

  // Barycenter reordering — now sorts on Y within each layer
  for (let iteration = 0; iteration < 5; iteration++) {
    for (let i = 1; i < sortedLayerKeys.length; i++) {
      const layerKey = sortedLayerKeys[i]
      const layerNodes = layers.get(layerKey)!
      if (layerNodes.length <= 1) continue

      const barycenters = layerNodes.map((node) => {
        const incomingEdges = edges.filter((e) => e.to === node.id)
        if (incomingEdges.length === 0) return positionedMap.get(node.id)!.y
        const sum = incomingEdges.reduce((acc, e) => {
          const fromPos = positionedMap.get(e.from)
          return acc + (fromPos ? fromPos.y : 0)
        }, 0)
        return sum / incomingEdges.length
      })

      const sortedIndices = barycenters
        .map((bc, idx) => ({ bc, idx }))
        .sort((a, b) => a.bc - b.bc)
        .map((item) => item.idx)

      const totalHeight = layerNodes.length * nodeHeight + (layerNodes.length - 1) * nodeGap
      const startY = -totalHeight / 2

      const newPositions = new Map<string, number>()
      sortedIndices.forEach((originalIdx, sortedIdx) => {
        newPositions.set(
          layerNodes[originalIdx].id,
          startY + sortedIdx * (nodeHeight + nodeGap) + nodeHeight / 2
        )
      })

      for (const [id, y] of newPositions) {
        positionedMap.get(id)!.y = y
      }
    }
  }

  return positioned
}

function getIconComponent(iconName: string) {
  const IconComponent = (Icons as unknown as Record<string, ComponentType<{ size?: number; className?: string }>>)[iconName]
  return IconComponent ? <IconComponent size={16} className="flowchart-node-icon" /> : null
}

function wrapTooltipText(text: string, maxChars = 28): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxChars) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

// Single consistent node colour (Catppuccin Frappé – Blue)
const NODE_COLOR = {
  accent: '#8caaee',
  bg:     '#1a2a4a',
  hlBg:   '#223259',
} as const


const panelWidth = 216
const panelGap = 14

type Placement = 'above' | 'below' | 'left' | 'right'

function smartPlacePanel(
  nodeX: number,
  nodeY: number,
  allNodes: PositionedNode[],
  offsetX: number,
  offsetY: number,
  svgW: number,
  svgH: number,
  panelH: number
): Placement {
  const nodeLeft = nodeX - nodeWidth / 2
  const nodeRight = nodeX + nodeWidth / 2
  const nodeTop = nodeY - nodeHeight / 2
  const nodeBottom = nodeY + nodeHeight / 2

  // Left-to-right layout: prefer right then left, then above/below
  const candidateBoxes: { placement: Placement; x: number; y: number }[] = [
    { placement: 'right', x: nodeRight + panelGap, y: nodeY - panelH / 2 },
    { placement: 'above', x: nodeX - panelWidth / 2, y: nodeTop - panelH - panelGap },
    { placement: 'below', x: nodeX - panelWidth / 2, y: nodeBottom + panelGap },
    { placement: 'left', x: nodeLeft - panelWidth - panelGap, y: nodeY - panelH / 2 },
  ]

  const overlaps = (boxX: number, boxY: number) => {
    const boxRight = boxX + panelWidth
    const boxBottom = boxY + panelH
    for (const n of allNodes) {
      const nX = n.x + offsetX
      const nY = n.y + offsetY
      const nLeft = nX - nodeWidth / 2
      const nRight = nX + nodeWidth / 2
      const nTop = nY - nodeHeight / 2
      const nBottom = nY + nodeHeight / 2
      if (boxX < nRight && boxRight > nLeft && boxY < nBottom && boxBottom > nTop) {
        return true
      }
    }
    return false
  }

  const outOfBounds = (boxX: number, boxY: number) => {
    return boxX < 4 || boxY < 4 || (boxX + panelWidth) > (svgW - 4) || (boxY + panelH) > (svgH - 4)
  }

  for (const c of candidateBoxes) {
    if (!overlaps(c.x, c.y) && !outOfBounds(c.x, c.y)) return c.placement
  }
  for (const c of candidateBoxes) {
    if (!overlaps(c.x, c.y)) return c.placement
  }
  return 'right'
}

function getPanelPosition(
  placement: Placement,
  nodeX: number,
  nodeY: number,
  panelH: number
): { x: number; y: number } {
  const nodeLeft = nodeX - nodeWidth / 2
  const nodeRight = nodeX + nodeWidth / 2
  const nodeTop = nodeY - nodeHeight / 2
  const nodeBottom = nodeY + nodeHeight / 2
  switch (placement) {
    case 'above':
      return { x: nodeX - panelWidth / 2, y: nodeTop - panelH - panelGap }
    case 'below':
      return { x: nodeX - panelWidth / 2, y: nodeBottom + panelGap }
    case 'left':
      return { x: nodeLeft - panelWidth - panelGap, y: nodeY - panelH / 2 }
    case 'right':
      return { x: nodeRight + panelGap, y: nodeY - panelH / 2 }
  }
}

function Flowchart({ title, nodes, edges, journeys }: FlowchartProps) {
  const basePositioned = useMemo(
    () => computeLayoutWithBarycenter(nodes, edges),
    [nodes, edges]
  )

  useEffect(() => {
    if (!journeys) return
    for (const journey of journeys) {
      for (let i = 1; i < journey.steps.length; i++) {
        const prevId = journey.steps[i - 1].nodeId
        const currId = journey.steps[i].nodeId
        const connected = edges.some((e) => e.from === prevId && e.to === currId)
        if (!connected) {
          console.warn(
            `[Flowchart] Journey "${journey.label}" step ${i}: no edge from "${prevId}" to "${currId}". ` +
            'Journey steps must follow connected edges.'
          )
        }
      }
    }
  }, [journeys, edges])

  const [currentJourneyId, setCurrentJourneyId] = useState<string>(
    journeys?.[0]?.id ?? ''
  )
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const playTimerRef = useRef<number | null>(null)
  const particleRef = useRef<SVGCircleElement | null>(null)
  const animeInstanceRef = useRef<ReturnType<typeof animate> | null>(null)
  const descPanelRef = useRef<SVGGElement | null>(null)
  const descPanelAnimRef = useRef<ReturnType<typeof animate> | null>(null)
  const highlightRef = useRef<Map<string, number>>(new Map())
  const highlightAnimRef = useRef<Map<string, number>>(new Map())
  const [, setHighlightTick] = useState(0)
  const [tooltip, setTooltip] = useState<{ description: string; x: number; y: number } | null>(null)

  const currentJourney = journeys?.find((j) => j.id === currentJourneyId)
  const highlightedNodeId = currentJourney?.steps[currentStep]?.nodeId
  const prevHighlightedNodeId = useMemo(() => {
    if (currentStep > 0 && currentJourney) {
      return currentJourney.steps[currentStep - 1]?.nodeId
    }
    return null
  }, [currentStep, currentJourney])
  const currentDescription = currentJourney?.steps[currentStep]?.description ?? ''

  useEffect(() => {
    if (isPlaying && currentJourney && currentStep < currentJourney.steps.length - 1) {
      playTimerRef.current = window.setTimeout(() => {
        setCurrentStep((s) => s + 1)
      }, 2500)
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
  const transformInitialised = useRef(false)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const panAnimRef = useRef<ReturnType<typeof animate> | null>(null)
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

  const uniqueEdges = useMemo(() => {
    const seen = new Set<string>()
    return edges.filter((edge) => {
      const key = [edge.from, edge.to].sort().join('::')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [edges])

  const minX = positioned.length > 0 ? Math.min(...positioned.map((n) => n.x)) : 0
  const maxX = positioned.length > 0 ? Math.max(...positioned.map((n) => n.x)) : 0
  const minY = positioned.length > 0 ? Math.min(...positioned.map((n) => n.y)) : 0
  const maxY = positioned.length > 0 ? Math.max(...positioned.map((n) => n.y)) : 0

  // Left-to-right: SVG width driven by layers, height by node stacking
  const svgWidth = (maxX - minX) + nodeWidth + svgPaddingX * 2
  const svgHeight = Math.max(400, (maxY - minY) + nodeHeight + svgPaddingTop * 2)
  // computeLayout already places nodes in positive SVG-x space with padding applied,
  // so offsetX=0. Nodes are centred at y=0, so offsetY shifts them to mid-SVG.
  const offsetX = 0
  const offsetY = svgHeight / 2

  const INITIAL_SCALE = 1.4

  // One-time init: centre the first highlighted node at a fixed scale
  useEffect(() => {
    if (transformInitialised.current) return
    const svgEl = svgRef.current
    if (!svgEl) return
    transformInitialised.current = true
    const { clientWidth: W, clientHeight: H } = svgEl
    const firstNodeId = currentJourney?.steps[0]?.nodeId
    const targetNode = firstNodeId ? nodeMap[firstNodeId] : null
    const nx = targetNode ? targetNode.x + offsetX : svgWidth / 2
    const ny = targetNode ? targetNode.y + offsetY : svgHeight / 2
    setTransform({
      scale: INITIAL_SCALE,
      translateX: W / 2 - nx * INITIAL_SCALE,
      translateY: H / 2 - ny * INITIAL_SCALE,
    })
  // run once after first render when refs are populated
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgRef, nodeMap, offsetX, offsetY])

  useEffect(() => {
    if (currentStep === 0 || !prevHighlightedNodeId || !highlightedNodeId) return
    const fromNode = nodeMap[prevHighlightedNodeId]
    const toNode = nodeMap[highlightedNodeId]
    if (!fromNode || !toNode) return
    const edgeExists = edges.some((e) => e.from === prevHighlightedNodeId && e.to === highlightedNodeId)
    if (!edgeExists) return
    if (animeInstanceRef.current) {
      animeInstanceRef.current.pause()
    }
    const startX = fromNode.x + offsetX
    const startY = fromNode.y + offsetY
    const endX = toNode.x + offsetX
    const endY = toNode.y + offsetY
    if (particleRef.current) {
      particleRef.current.setAttribute('cx', String(startX))
      particleRef.current.setAttribute('cy', String(startY))
      particleRef.current.setAttribute('opacity', '1')
      animeInstanceRef.current = animate(particleRef.current, {
        cx: [startX, endX],
        cy: [startY, endY],
        duration: 800,
        easing: 'easeInOutQuad',
        onComplete: () => {
          if (particleRef.current) {
            particleRef.current.setAttribute('opacity', '0')
          }
        },
      })
    }
    return () => {
      if (animeInstanceRef.current) {
        animeInstanceRef.current.pause()
      }
    }
  }, [currentStep, prevHighlightedNodeId, highlightedNodeId, edges, nodeMap, offsetX, offsetY])

  // Pan viewport to centre the highlighted node, preserving current zoom scale
  useEffect(() => {
    if (!highlightedNodeId) return
    const node = nodeMap[highlightedNodeId]
    if (!node) return
    const svgEl = svgRef.current
    if (!svgEl) return
    const { clientWidth: W, clientHeight: H } = svgEl
    const nx = node.x + offsetX
    const ny = node.y + offsetY
    const targetTx = W / 2 - nx * transform.scale
    const targetTy = H / 2 - ny * transform.scale

    if (panAnimRef.current) panAnimRef.current.pause()

    const proxy = { tx: transform.translateX, ty: transform.translateY }
    panAnimRef.current = animate(proxy, {
      tx: targetTx,
      ty: targetTy,
      duration: 500,
      easing: 'easeInOutQuad',
      onUpdate: () => {
        setTransform((prev) => ({ scale: prev.scale, translateX: proxy.tx, translateY: proxy.ty }))
      },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedNodeId, nodeMap, offsetX, offsetY])

  useEffect(() => {
    if (descPanelAnimRef.current) {
      descPanelAnimRef.current.cancel()
    }
    if (descPanelRef.current) {
      descPanelRef.current.setAttribute('opacity', '0')
      descPanelAnimRef.current = animate(descPanelRef.current, {
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutQuad',
      })
    }
  }, [currentStep, highlightedNodeId])

  useEffect(() => {
    if (highlightedNodeId) {
      const oldAnim = highlightAnimRef.current.get(highlightedNodeId)
      if (oldAnim) cancelAnimationFrame(oldAnim)
      highlightRef.current.set(highlightedNodeId, 0)
      const start = performance.now()
      const duration = 600
      const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t)
      const step = (now: number) => {
        const elapsed = now - start
        const t = Math.min(elapsed / duration, 1)
        const val = easeOutQuad(t)
        highlightRef.current.set(highlightedNodeId, val)
        setHighlightTick(tk => tk + 1)
        if (t < 1) {
          highlightAnimRef.current.set(highlightedNodeId, requestAnimationFrame(step))
        }
      }
      highlightAnimRef.current.set(highlightedNodeId, requestAnimationFrame(step))
    }

    for (const [nodeId, rafId] of highlightAnimRef.current) {
      if (nodeId !== highlightedNodeId) {
        cancelAnimationFrame(rafId)
        highlightRef.current.set(nodeId, 0)
        highlightAnimRef.current.delete(nodeId)
      }
    }
  }, [highlightedNodeId])

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
      setTooltip(null)
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
      setTooltip(null)
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

  const handleGoToStep = useCallback((idx: number) => {
    setCurrentStep(idx)
    setIsPlaying(false)
  }, [])

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

      <div className="flowchart-body">
      <svg
        ref={svgRef}
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
          <filter id="flowchart-desc-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="7" floodColor="#ca9ee6" floodOpacity="0.30" />
          </filter>
          <filter id="flowchart-tooltip-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.50" />
          </filter>
          <marker id="flowchart-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
            <path d="M 0 0 L 7 3 L 0 6 Z" fill="#626880" />
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
          {uniqueEdges.map((edge, idx) => {
            const fromNode = nodeMap[edge.from]
            const toNode = nodeMap[edge.to]
            if (!fromNode || !toNode) return null

            const x1 = fromNode.x + offsetX
            const y1 = fromNode.y + offsetY
            const x2 = toNode.x + offsetX
            const y2 = toNode.y + offsetY

            return (
              <g key={`edge-${idx}`} data-testid={`flowchart-edge-${idx}`}>
                {/* Base ghost line */}
                <path
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  stroke="#626880"
                  strokeWidth="1.5"
                  fill="none"
                  strokeOpacity="0.3"
                />
                {/* Animated flowing dashes */}
                <path
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  stroke="#8caaee"
                  strokeWidth="1.5"
                  fill="none"
                  strokeOpacity="0.55"
                  strokeDasharray="6 7"
                  className="flowchart-edge-animated"
                />
                {/* Wide transparent hit area for hover tooltip */}
                {edge.description && (
                  <path
                    d={`M ${x1} ${y1} L ${x2} ${y2}`}
                    stroke="transparent"
                    strokeWidth="14"
                    fill="none"
                    style={{ cursor: 'default' }}
                    onMouseEnter={() => setTooltip({ description: edge.description!, x: (x1 + x2) / 2, y: (y1 + y2) / 2 })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )}
              </g>
            )
          })}

          {journeys && journeys.length > 0 && (
            <circle
              ref={particleRef}
              r="6"
              fill="var(--action-blue)"
              opacity="0"
              className="flowchart-particle"
              data-testid="flowchart-particle"
            />
          )}

          {journeys && journeys.length > 0 && highlightedNodeId && currentDescription && (
            (() => {
              const node = nodeMap[highlightedNodeId]
              if (!node) return null
              const nodeAbsX = node.x + offsetX
              const nodeAbsY = node.y + offsetY
              const words = currentDescription.split(' ')
              const lines: string[] = []
              let line = ''
              const maxChars = 26
              for (const word of words) {
                if ((line + ' ' + word).length <= maxChars) {
                  line = line ? line + ' ' + word : word
                } else {
                  lines.push(line)
                  line = word
                }
              }
              if (line) lines.push(line)
              const lineCount = Math.min(lines.length, 4)
              // Dynamic height: top-padding + header row + divider gap + lines + bottom-padding
              const computedPanelH = 14 + 16 + 6 + lineCount * 17 + 12
              const placement = smartPlacePanel(nodeAbsX, nodeAbsY, positioned, offsetX, offsetY, svgWidth, svgHeight, computedPanelH)
              const pos = getPanelPosition(placement, nodeAbsX, nodeAbsY, computedPanelH)
              const px = pos.x
              const py = pos.y
              return (
                <g key={`panel-${currentStep}`} data-testid="flowchart-desc-panel" ref={descPanelRef} opacity="0">
                  {/* Outer glow/shadow */}
                  <rect
                    x={px} y={py}
                    width={panelWidth} height={computedPanelH}
                    rx="10"
                    fill="#292c3c"
                    stroke="#ca9ee6"
                    strokeWidth="1.5"
                    filter="url(#flowchart-desc-shadow)"
                    className="flowchart-desc-panel-bg"
                  />
                  {/* Left accent strip */}
                  <rect
                    x={px + 1} y={py + 9}
                    width={4} height={computedPanelH - 18}
                    rx="2"
                    fill="#ca9ee6"
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Step badge */}
                  <text
                    x={px + 12} y={py + 22}
                    fontSize="9"
                    fontFamily="var(--font-mono)"
                    fontWeight="700"
                    letterSpacing="0.8"
                    fill="#ca9ee6"
                    style={{ pointerEvents: 'none' }}
                  >
                    STEP {currentStep + 1}
                  </text>
                  {/* Divider */}
                  <line
                    x1={px + 9} y1={py + 30}
                    x2={px + panelWidth - 9} y2={py + 30}
                    stroke="#ca9ee6" strokeWidth="0.5" strokeOpacity="0.4"
                  />
                  {/* Description lines */}
                  {Array.from({ length: lineCount }).map((_, li) => (
                    <text
                      key={li}
                      x={px + 12}
                      y={py + 46 + li * 17}
                      fontSize="12"
                      fontFamily="var(--font-body)"
                      fill="#c6d0f5"
                      className="flowchart-desc-panel-text"
                      style={{ pointerEvents: 'none' }}
                    >
                      {lines[li]}
                    </text>
                  ))}
                </g>
              )
            })()
          )}

          {positioned.map((node) => {
            const x = node.x + offsetX - nodeWidth / 2
            const y = node.y + offsetY - nodeHeight / 2
            const highlightProgress = highlightRef.current.get(node.id) ?? 0
            const sw = 1.5 + 2 * highlightProgress
            const color = NODE_COLOR
            // Interpolate background: base → highlighted
            const nodeFill = highlightProgress > 0 ? color.hlBg : color.bg
            const strokeOpacity = 0.45 + 0.55 * highlightProgress

            return (
              <g
                key={node.id}
                data-testid={`flowchart-node-${node.id}`}
                className="flowchart-node-group"
                onMouseDown={(e) => onNodeMouseDown(e, node.id)}
                onMouseMove={onMouseMove}
                onMouseUp={handlePointerUp}
                onMouseEnter={node.description ? () => { if (!dragRef.current.active) setTooltip({ description: node.description!, x: node.x + offsetX, y: node.y + offsetY - nodeHeight / 2 }) } : undefined}
                onMouseLeave={node.description ? () => setTooltip(null) : undefined}
                onTouchStart={(e) => onNodeTouchStart(e, node.id)}
                onTouchMove={(e) => {
                  if (e.touches.length === 1 && dragRef.current.active) {
                    const touch = e.touches[0]
                    handlePointerMove(touch.clientX, touch.clientY)
                  }
                }}
                onTouchEnd={handlePointerUp}
              >
                {/* Main node body */}
                <rect
                  x={x} y={y}
                  width={nodeWidth} height={nodeHeight}
                  rx="var(--radius-sm)"
                  fill={nodeFill}
                  stroke={color.accent}
                  strokeWidth={highlightProgress > 0 ? "2" : String(sw)}
                  strokeOpacity={highlightProgress > 0 ? "1" : String(strokeOpacity)}
                  className={`flowchart-node-rect${highlightProgress > 0 ? ' flowchart-node-highlighted' : ''}`}
                />
                {/* Left accent strip */}
                <rect
                  x={x + 1} y={y + 8}
                  width={3} height={nodeHeight - 16}
                  rx="1.5"
                  fill={color.accent}
                  fillOpacity="0.7"
                  style={{ pointerEvents: 'none' }}
                />
                {getIconComponent(node.icon) && (
                  <foreignObject
                    x={x + 12}
                    y={y + 8}
                    width={20}
                    height={20}
                    className="flowchart-node-icon-fo"
                    style={{ color: color.accent }}
                  >
                    <div className="flowchart-node-icon-wrapper">
                      {getIconComponent(node.icon)}
                    </div>
                  </foreignObject>
                )}
                <text
                  x={x + nodeWidth / 2 + (getIconComponent(node.icon) ? 8 : 0)}
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

          {/* Hover tooltip — rendered last so it's always on top */}
          {tooltip && (() => {
            const lines = wrapTooltipText(tooltip.description)
            const ttW = 190
            const ttPadX = 10
            const ttPadY = 8
            const ttLineH = 15
            const ttH = ttPadY * 2 + lines.length * ttLineH
            const ttX = tooltip.x - ttW / 2
            const ttY = tooltip.y - ttH - 10
            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect
                  x={ttX} y={ttY}
                  width={ttW} height={ttH}
                  rx="5"
                  fill="#16171f"
                  stroke="#626880"
                  strokeWidth="1"
                  filter="url(#flowchart-tooltip-shadow)"
                />
                {lines.map((line, li) => (
                  <text
                    key={li}
                    x={ttX + ttPadX}
                    y={ttY + ttPadY + ttLineH * li + 11}
                    fontSize="11"
                    fontFamily="var(--font-body)"
                    fill="#c6d0f5"
                  >
                    {line}
                  </text>
                ))}
              </g>
            )
          })()}
        </g>
      </svg>
      </div>

      {currentJourney && currentJourney.steps.length > 0 && (
        <ol className="flowchart-steps-list" data-testid="flowchart-steps-list">
          {currentJourney.steps.map((step, idx) => {
            const isPast = idx < currentStep
            const isCurrent = idx === currentStep
            const stepNode = nodes.find((n) => n.id === step.nodeId)
            return (
              <li
                key={idx}
                className={`flowchart-step-item${isCurrent ? ' flowchart-step-current' : ''}${isPast ? ' flowchart-step-past' : ''}`}
                onClick={() => handleGoToStep(idx)}
                data-testid={`flowchart-step-item-${idx}`}
              >
                <div
                  className="flowchart-step-num"
                  style={{
                    borderColor: NODE_COLOR.accent,
                    color: isCurrent ? '#292c3c' : NODE_COLOR.accent,
                    backgroundColor: isCurrent ? NODE_COLOR.accent : 'transparent',
                  }}
                >
                  {isPast ? '✓' : idx + 1}
                </div>
                <div className="flowchart-step-content">
                  <div className="flowchart-step-node" style={{ color: isCurrent ? NODE_COLOR.accent : undefined }}>
                    {stepNode?.label ?? step.nodeId}
                  </div>
                  <div className="flowchart-step-desc">{step.description}</div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

SectionRegistry.register('flowchart', Flowchart as ComponentType<unknown>)

export default Flowchart
