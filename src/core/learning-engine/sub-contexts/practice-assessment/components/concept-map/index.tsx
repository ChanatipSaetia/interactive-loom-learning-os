import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react'
import { ConceptMapHelpModal } from './ConceptMapHelpModal'
import { SectionTitleBar } from '../../../../../delivery/web-app-shell/SectionTitleBar'
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
  sectionIndex?: number
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

interface GraphComponent {
  nodeIds: string[]
  edges: ConceptEdge[]
  entryPointId: string
}

function findConnectedComponents(
  nodeIds: string[],
  edges: ConceptEdge[]
): GraphComponent[] {
  const adj = new Map<string, Set<string>>()
  for (const id of nodeIds) {
    adj.set(id, new Set())
  }
  for (const e of edges) {
    if (adj.has(e.from) && adj.has(e.to)) {
      adj.get(e.from)?.add(e.to)
      adj.get(e.to)?.add(e.from)
    }
  }

  const visited = new Set<string>()
  const components: GraphComponent[] = []

  for (const id of nodeIds) {
    if (visited.has(id)) continue
    const componentNodes: string[] = []
    const queue = [id]
    while (queue.length > 0) {
      const curr = queue.shift()!
      if (visited.has(curr)) continue
      visited.add(curr)
      componentNodes.push(curr)
      for (const neighbor of adj.get(curr) ?? []) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor)
        }
      }
    }

    const componentEdges = edges.filter(
      (e) => visited.has(e.from) && visited.has(e.to) && componentNodes.includes(e.from) && componentNodes.includes(e.to)
    )

    const entryPoint = findEntryPoint(componentNodes, componentEdges)
    components.push({
      nodeIds: componentNodes,
      edges: componentEdges,
      entryPointId: entryPoint,
    })
  }

  return components.sort((a, b) => b.nodeIds.length - a.nodeIds.length)
}

function findEntryPoint(nodeIds: string[], _edges: ConceptEdge[]): string {
  return nodeIds[0]
}

export interface ConceptEdgeAnchor {
  p1: { x: number; y: number }
  p2: { x: number; y: number }
}

export interface ConceptLayoutResult {
  nodes: Record<string, ConceptNode>
  edgeAnchors: Record<string, ConceptEdgeAnchor>
}

function getBoundaryAnchor(
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  tx: number,
  ty: number,
  rx: number = 16
): { x: number; y: number } {
  const dx = tx - cx
  const dy = ty - cy
  const dist = Math.sqrt(dx * dx + dy * dy) || 1
  const nx = dx / dist
  const ny = dy / dist

  const absNx = Math.abs(nx)
  const absNy = Math.abs(ny)
  let t = Infinity
  if (absNx > 0) t = Math.min(t, hw / absNx)
  if (absNy > 0) t = Math.min(t, hh / absNy)

  let x = cx + nx * t
  let y = cy + ny * t

  const innerHW = hw - rx
  const innerHH = hh - rx

  if (Math.abs(x - cx) > innerHW && Math.abs(y - cy) > innerHH) {
    const cornerCx = cx + Math.sign(nx) * innerHW
    const cornerCy = cy + Math.sign(ny) * innerHH
    const cDx = x - cornerCx
    const cDy = y - cornerCy
    const cDist = Math.sqrt(cDx * cDx + cDy * cDy) || 1
    x = cornerCx + (cDx / cDist) * rx
    y = cornerCy + (cDy / cDist) * rx
  }

  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 }
}

function layoutTopDownPlanar(
  component: GraphComponent,
  nodes: Record<string, ConceptNode>,
  width: number,
  height: number
): ConceptLayoutResult {
  const { nodeIds: compNodeIds, entryPointId } = component

  const adj = new Map<string, string[]>()
  const undirAdj = new Map<string, string[]>()
  for (const id of compNodeIds) {
    adj.set(id, [])
    undirAdj.set(id, [])
  }
  for (const e of component.edges) {
    if (adj.has(e.from)) adj.get(e.from)?.push(e.to)
    if (undirAdj.has(e.from) && undirAdj.has(e.to)) {
      undirAdj.get(e.from)?.push(e.to)
      undirAdj.get(e.to)?.push(e.from)
    }
  }

  const relativeRow = new Map<string, number>()
  relativeRow.set(entryPointId, 0)

  const visited = new Set<string>([entryPointId])
  const queue = [entryPointId]

  while (queue.length > 0) {
    const curr = queue.shift()!
    const currRow = relativeRow.get(curr)!
    for (const neighbor of undirAdj.get(curr) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        relativeRow.set(neighbor, currRow + 1)
        queue.push(neighbor)
      }
    }
  }

  if (visited.size < compNodeIds.length) {
    for (const id of compNodeIds) {
      if (!visited.has(id)) {
        visited.add(id)
        let minNeighborRow = Infinity
        for (const neighbor of undirAdj.get(id) ?? []) {
          if (relativeRow.has(neighbor)) {
            minNeighborRow = Math.min(minNeighborRow, relativeRow.get(neighbor)!)
          }
        }
        relativeRow.set(id, minNeighborRow !== Infinity ? minNeighborRow + 1 : 1)
      }
    }
  }

  const rowGroups = new Map<number, string[]>()
  for (const [id, r] of relativeRow) {
    if (!rowGroups.has(r)) rowGroups.set(r, [])
    rowGroups.get(r)?.push(id)
  }

  const sortedRowKeys = Array.from(rowGroups.keys()).sort((a, b) => a - b)

  const xPositions = new Map<string, number>()
  xPositions.set(entryPointId, 0)

  for (const r of sortedRowKeys) {
    if (r === 0) continue
    const group = rowGroups.get(r) ?? []
    const totalW = (group.length - 1) * 220
    group.forEach((id, idx) => {
      const initialX = group.length === 1 ? 0 : -totalW / 2 + idx * 220
      xPositions.set(id, initialX)
    })
  }

  const centerX = width / 2
  const centerY = height / 2
  const ROW_GAP = 140
  const EDGE_MARGIN = 80

  for (let sweep = 0; sweep < 4; sweep++) {
    const isForward = sweep % 2 === 0
    const keysToSweep = isForward ? [...sortedRowKeys] : [...sortedRowKeys].reverse()

    for (const r of keysToSweep) {
      if (r === 0) continue
      const group = rowGroups.get(r) ?? []
      if (group.length === 0) continue

      const nodeXList = group.map((id) => {
        const neighbors = undirAdj.get(id) ?? []
        const adjacentRowNeighbors = neighbors.filter((nid) => relativeRow.get(nid) !== r && xPositions.has(nid))
        const sameRowNeighbors = neighbors.filter((nid) => relativeRow.get(nid) === r && xPositions.has(nid))

        let targetX = xPositions.get(id) ?? 0
        const currHW = getNodeWidth(nodes[id]?.title ?? id) / 2
        const currHH = NODE_HEIGHT / 2
        const currY = centerY + r * ROW_GAP

        if (adjacentRowNeighbors.length > 0 || sameRowNeighbors.length > 0) {
          let sumX = 0
          let totalWeight = 0

          for (const nid of adjacentRowNeighbors) {
            const nX = xPositions.get(nid)!
            const nRow = relativeRow.get(nid)!
            const nY = centerY + nRow * ROW_GAP
            const nHW = getNodeWidth(nodes[nid]?.title ?? nid) / 2
            const nHH = NODE_HEIGHT / 2
            const ancN = getBoundaryAnchor(nX, nY, nHW, nHH, targetX, currY, 16)
            const ancCurr = getBoundaryAnchor(targetX, currY, currHW, currHH, nX, nY, 16)
            const anchorOffset = ancN.x - (ancCurr.x - targetX)
            sumX += anchorOffset * 1.0
            totalWeight += 1.0
          }

          for (const nid of sameRowNeighbors) {
            const nX = xPositions.get(nid)!
            sumX += nX * 1.5
            totalWeight += 1.5
          }

          if (totalWeight > 0) {
            targetX = sumX / totalWeight
          }
        }
        const width = currHW * 2
        return { id, targetX, width }
      })

      nodeXList.sort((a, b) => {
        if (Math.abs(a.targetX - b.targetX) > 0.001) {
          return a.targetX - b.targetX
        }
        return compNodeIds.indexOf(a.id) - compNodeIds.indexOf(b.id)
      })

      if (nodeXList.length === 1) {
        xPositions.set(nodeXList[0].id, nodeXList[0].targetX)
      } else {
        const xs = nodeXList.map((item) => item.targetX)

        for (let i = 1; i < nodeXList.length; i++) {
          const prevHW = nodeXList[i - 1].width / 2
          const currHW = nodeXList[i].width / 2
          const minRequiredDist = prevHW + currHW + EDGE_MARGIN
          if (xs[i] - xs[i - 1] < minRequiredDist) {
            xs[i] = xs[i - 1] + minRequiredDist
          }
        }

        for (let i = nodeXList.length - 2; i >= 0; i--) {
          const currHW = nodeXList[i].width / 2
          const nextHW = nodeXList[i + 1].width / 2
          const minRequiredDist = currHW + nextHW + EDGE_MARGIN
          if (xs[i + 1] - xs[i] < minRequiredDist) {
            xs[i] = xs[i + 1] - minRequiredDist
          }
        }

        const avgTarget = nodeXList.reduce((sum, item) => sum + item.targetX, 0) / nodeXList.length
        const avgPlaced = xs.reduce((sum, val) => sum + val, 0) / xs.length
        const shiftX = avgTarget - avgPlaced

        nodeXList.forEach((item, idx) => {
          xPositions.set(item.id, Math.round((xs[idx] + shiftX) * 100) / 100)
        })
      }

      rowGroups.set(r, nodeXList.map((item) => item.id))
    }
  }

  const resultNodes: Record<string, ConceptNode> = {}

  for (const id of compNodeIds) {
    const r = relativeRow.get(id) ?? 0
    const relX = xPositions.get(id) ?? 0
    const x = centerX + relX
    const y = centerY + r * ROW_GAP

    resultNodes[id] = {
      id,
      title: nodes[id].title,
      category: nodes[id].category,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
    }
  }

  const edgeAnchors: Record<string, ConceptEdgeAnchor> = {}
  for (const e of component.edges) {
    const from = resultNodes[e.from]
    const to = resultNodes[e.to]
    if (from?.x !== undefined && from?.y !== undefined && to?.x !== undefined && to?.y !== undefined) {
      const fromHW = getNodeWidth(from.title) / 2
      const fromHH = NODE_HEIGHT / 2
      const toHW = getNodeWidth(to.title) / 2
      const toHH = NODE_HEIGHT / 2

      const p1 = getBoundaryAnchor(from.x, from.y, fromHW, fromHH, to.x, to.y, 16)
      const p2 = getBoundaryAnchor(to.x, to.y, toHW, toHH, from.x, from.y, 16)
      const key = `${e.from}->${e.to}`
      edgeAnchors[key] = { p1, p2 }
    }
  }

  return { nodes: resultNodes, edgeAnchors }
}

function ConceptMapSection({ title, nodes, edges, sectionIndex = 0 }: ConceptMapSectionProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [transform, setTransform] = useState<TransformState>({ scale: 1, translateX: 0, translateY: 0 })
  const [layoutNodes, setLayoutNodes] = useState<Record<string, ConceptNode>>({})
  const [edgeAnchors, setEdgeAnchors] = useState<Record<string, ConceptEdgeAnchor>>({})
  const [viewBox, setViewBox] = useState('0 0 1400 900')
  const [isPanning, setIsPanning] = useState(false)
  const [graphs, setGraphs] = useState<GraphComponent[]>([])
  const [currentGraphIndex, setCurrentGraphIndex] = useState(0)
  const [entryPointId, setEntryPointId] = useState<string | null>(null)
  const transformRef = useRef(transform)
  const isPanningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0, baseTranslateX: 0, baseTranslateY: 0 })
  const pinchRef = useRef({ active: false, initialDist: 0, initialScale: 1 })

  useEffectSyncRef(transform, transformRef)

  const allNodeIds = useMemo(() => Object.keys(nodes), [nodes])

  const currentGraph = graphs[currentGraphIndex]
  const nodeIds = currentGraph?.nodeIds ?? allNodeIds
  const currentEdges = currentGraph?.edges ?? edges

  const connectedNodes = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const id of allNodeIds) {
      map.set(id, new Set<string>())
    }
    for (const edge of edges) {
      map.get(edge.from)?.add(edge.to)
      map.get(edge.to)?.add(edge.from)
    }
    return map
  }, [allNodeIds, edges])

  const computeLayout = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const cW = Math.max(rect.width, 300)
    const cH = Math.max(rect.height, 300)
    const { viewW: VIEW_W, viewH: VIEW_H } = getViewportDimensions(cW, cH)
    setViewBox(`0 0 ${VIEW_W} ${VIEW_H}`)

    const components = findConnectedComponents(allNodeIds, edges)
    setGraphs(components)

    if (currentGraphIndex >= components.length) {
      setCurrentGraphIndex(0)
    }

    const graph = components[Math.min(currentGraphIndex, components.length - 1)]
    if (!graph) return

    setEntryPointId(graph.entryPointId)
    const layoutResult = layoutTopDownPlanar(graph, nodes, VIEW_W, VIEW_H)
    setLayoutNodes(layoutResult.nodes)
    setEdgeAnchors(layoutResult.edgeAnchors)

    const initialScale = 1.5
    const startNode = layoutResult.nodes[graph.entryPointId]
    const startX = startNode?.x ?? VIEW_W / 2
    const startY = startNode?.y ?? VIEW_H / 2

    const translateX = VIEW_W / 2 - startX * initialScale
    const translateY = VIEW_H / 2 - startY * initialScale

    setTransform({ scale: initialScale, translateX, translateY })
  }, [allNodeIds, edges, nodes, currentGraphIndex])

  useEffect(() => {
    computeLayout()
  }, [computeLayout])

  const switchGraph = useCallback((direction: number) => {
    const newIndex = (currentGraphIndex + direction + graphs.length) % graphs.length
    setCurrentGraphIndex(newIndex)
  }, [currentGraphIndex, graphs.length])

  // Native event listeners for wheel, touch (like flowchart useCamera)
  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (typeof (e as any).stopImmediatePropagation === 'function') {
        (e as any).stopImmediatePropagation()
      }
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
        handlePointerMove(touch.clientX, touch.clientY)
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
      const svgEl = svgRef.current
      // Scale screen-pixel deltas to SVG viewBox units so panning is 1:1 with the mouse.
      // Without this, panning feels sluggish when viewBox >> rendered size.
      let ratio = 1
      if (svgEl) {
        const rendered = svgEl.getBoundingClientRect()
        const vb = svgEl.viewBox.baseVal
        if (rendered.width > 0 && vb.width > 0) ratio = vb.width / rendered.width
      }
      const dx = (clientX - panStartRef.current.x) * ratio
      const dy = (clientY - panStartRef.current.y) * ratio
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
    if (!containerRef.current || !currentGraph) return
    const rect = containerRef.current.getBoundingClientRect()
    const cW = Math.max(rect.width, 300)
    const cH = Math.max(rect.height, 300)
    const { viewW: VIEW_W, viewH: VIEW_H } = getViewportDimensions(cW, cH)

    const initialScale = 1.5
    const startNode = layoutNodes[currentGraph.entryPointId]
    const startX = startNode?.x ?? VIEW_W / 2
    const startY = startNode?.y ?? VIEW_H / 2

    const translateX = VIEW_W / 2 - startX * initialScale
    const translateY = VIEW_H / 2 - startY * initialScale

    setTransform({ scale: initialScale, translateX, translateY })
  }, [currentGraph, layoutNodes])

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
      <div className="concept-map-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SectionTitleBar title={title} sectionIndex={sectionIndex} HelpModal={ConceptMapHelpModal} titleTestId="concept-map-title" />
          {graphs.length > 1 && (
            <span className="concept-map-graph-badge" data-testid="concept-map-graph-badge">
              {currentGraphIndex + 1} / {graphs.length}
            </span>
          )}
        </div>
      </div>

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
              transform={`translate(${transform.translateX}, ${transform. translateY}) scale(${transform.scale})`}
            >
              <rect
                x="-2000"
                y="-2000"
                width="4000"
                height="4000"
                fill="transparent"
              />

              {currentEdges.map((edge, idx) => {
                const from = layoutNodes[edge.from]
                const to = layoutNodes[edge.to]
                if (!from?.x || !from?.y || !to?.x || !to?.y) return null

                const isConnected = isEdgeConnected(edge)
                const isDimmed = hoveredNode && !isConnected

                const fromHW = getNodeWidth(from.title) / 2
                const fromHH = NODE_HEIGHT / 2
                const toHW = getNodeWidth(to.title) / 2
                const toHH = NODE_HEIGHT / 2

                const edgeKey = `${edge.from}->${edge.to}`
                const anchor = edgeAnchors[edgeKey]
                const p1 = anchor?.p1 ?? getBoundaryAnchor(from.x, from.y, fromHW, fromHH, to.x, to.y, 16)
                const p2 = anchor?.p2 ?? getBoundaryAnchor(to.x, to.y, toHW, toHH, from.x, from.y, 16)

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
                      rx={16}
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
                    {id === entryPointId && (
                      <rect
                        className="cm-entry-pulse"
                        x={nodeX}
                        y={nodeY}
                        width={nodeW}
                        height={nodeH}
                        rx={16}
                        fill="none"
                        stroke={color}
                        strokeWidth={2}
                      />
                    )}
                    {isHov && (
                      <rect
                        x={nodeX - 5}
                        y={nodeY - 5}
                        width={nodeW + 10}
                        height={nodeH + 10}
                        rx={18}
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

              {currentEdges.map((edge, idx) => {
                const from = layoutNodes[edge.from]
                const to = layoutNodes[edge.to]
                if (!from?.x || !from?.y || !to?.x || !to?.y || !edge.label) return null

                const isConnected = isEdgeConnected(edge)
                const isDimmed = hoveredNode && !isConnected

                const fromHW = getNodeWidth(from.title) / 2
                const fromHH = NODE_HEIGHT / 2
                const toHW = getNodeWidth(to.title) / 2
                const toHH = NODE_HEIGHT / 2

                const edgeKey = `${edge.from}->${edge.to}`
                const anchor = edgeAnchors[edgeKey]
                const p1 = anchor?.p1 ?? getBoundaryAnchor(from.x, from.y, fromHW, fromHH, to.x, to.y, 16)
                const p2 = anchor?.p2 ?? getBoundaryAnchor(to.x, to.y, toHW, toHH, from.x, from.y, 16)

                const lx = (p1.x + p2.x) / 2
                const ly = (p1.y + p2.y) / 2 - 6

                const displayLabel = !isConnected && edge.label.length > 5
                  ? `${edge.label.slice(0, 5)}...`
                  : edge.label

                const tw = displayLabel.length * 6 + 10

                return (
                  <g
                    key={`edge-label-${idx}`}
                    className={`cm-edge-label-group ${isConnected ? 'cm-edge-label-group-highlight' : ''} ${isDimmed ? 'cm-edge-label-dimmed' : ''}`}
                  >
                    <title>{edge.label}</title>
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
                      {displayLabel}
                    </text>
                  </g>
                )
              })}
            </g>
          </svg>

          <div className="concept-map-toolbar">
            {graphs.length > 1 && (
              <button
                className="concept-map-toolbar-btn"
                data-testid="concept-map-graph-prev"
                onClick={() => switchGraph(-1)}
                title="Previous graph"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
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
            {graphs.length > 1 && (
              <button
                className="concept-map-toolbar-btn"
                data-testid="concept-map-graph-next"
                onClick={() => switchGraph(1)}
                title="Next graph"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
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
