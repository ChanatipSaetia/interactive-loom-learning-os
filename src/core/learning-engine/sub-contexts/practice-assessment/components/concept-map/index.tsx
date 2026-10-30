import { useState, useEffect, useRef, useCallback, useMemo, useId } from 'react'
import { ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react'
import { ConceptMapHelpModal } from './ConceptMapHelpModal'
import { SectionTitleBar } from '../../../../../delivery/web-app-shell/SectionTitleBar'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { NODE_HEIGHT, getNodeWidth, layoutConceptComponent, routeConceptEdges, wrapConceptText, fitConceptMap, conceptNodeLines } from './graph-layout'
export { NODE_HEIGHT, getNodeWidth, routeConceptEdges, wrapConceptText, fitConceptMap, conceptNodeLines } from './graph-layout'
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

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.default
}

export function getCategoryFill(category: string): string {
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

function findEntryPoint(nodeIds: string[], edges: ConceptEdge[]): string {
  const incoming = (id: string) => edges.filter((e) => e.to === id && e.from !== id).length
  const outgoing = (id: string) => edges.filter((e) => e.from === id && e.to !== id).length
  const roots = nodeIds.filter((id) => incoming(id) === 0)
  return [...(roots.length ? roots : nodeIds)].sort((a, b) => outgoing(b) - outgoing(a) || nodeIds.indexOf(a) - nodeIds.indexOf(b))[0]
}

const CATEGORY_PALETTE = ['var(--ctp-mauve)', 'var(--ctp-sky)', 'var(--ctp-green)', 'var(--ctp-peach)', 'var(--ctp-yellow)', 'var(--ctp-teal)', 'var(--ctp-pink)', 'var(--ctp-sapphire)']
export function conceptCategoryColor(category: string, categories: string[]): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_PALETTE[Math.max(0, categories.indexOf(category ?? '')) % CATEGORY_PALETTE.length]
}
export function conceptCategoryFill(category: string, categories: string[]): string {
  return CATEGORY_FILLS[category] ?? `color-mix(in srgb, ${conceptCategoryColor(category, categories)} 15%, var(--card))`
}

export interface ConceptEdgeAnchor {
  p1: { x: number; y: number }
  p2: { x: number; y: number }
}

export interface ConceptLayoutResult {
  nodes: Record<string, ConceptNode>
  edgeAnchors: Record<string, ConceptEdgeAnchor>
}

function layoutTopDownPlanar(component: GraphComponent, nodes: Record<string, ConceptNode>, width: number, height: number): ConceptLayoutResult {
  return layoutConceptComponent(component, nodes, width / 2, height / 2)
}

export interface ConceptMapLayout extends ConceptLayoutResult {
  width: number
  height: number
}

/**
 * The whole map at once: every connected group placed by the Read layout, side by side and moved so
 * the map starts at 0,0. Present mode draws it in one SVG instead of paging through the groups.
 */
export function layoutConceptMap(nodes: Record<string, ConceptNode>, edges: ConceptEdge[], gap = 120): ConceptMapLayout {
  const result: ConceptMapLayout = { nodes: {}, edgeAnchors: {}, width: 0, height: 0 }
  let left = 0
  for (const component of findConnectedComponents(Object.keys(nodes), edges)) {
    const placed = layoutTopDownPlanar(component, nodes, 0, 0)
    const placedNodes = Object.values(placed.nodes)
    const minX = Math.min(...placedNodes.map((n) => (n.x ?? 0) - getNodeWidth(n.title) / 2))
    const maxX = Math.max(...placedNodes.map((n) => (n.x ?? 0) + getNodeWidth(n.title) / 2))
    const minY = Math.min(...placedNodes.map((n) => (n.y ?? 0) - NODE_HEIGHT / 2))
    const maxY = Math.max(...placedNodes.map((n) => (n.y ?? 0) + NODE_HEIGHT / 2))
    const dx = left - minX
    const dy = -minY
    for (const n of placedNodes) result.nodes[n.id] = { ...n, x: (n.x ?? 0) + dx, y: (n.y ?? 0) + dy }
    for (const [key, { p1, p2 }] of Object.entries(placed.edgeAnchors)) {
      result.edgeAnchors[key] = { p1: { x: p1.x + dx, y: p1.y + dy }, p2: { x: p2.x + dx, y: p2.y + dy } }
    }
    result.width = left + maxX - minX
    result.height = Math.max(result.height, maxY - minY)
    left = result.width + gap
  }
  return result
}

function ConceptMapSection({ title, nodes, edges, sectionIndex = 0 }: ConceptMapSectionProps) {
  const arrowId = `read-cm-arrow-${useId().replace(/:/g, '')}`
  const categories = useMemo(() => [...new Set(Object.values(nodes).map((n) => n.category ?? ''))], [nodes])
  const colorOf = (category: string) => conceptCategoryColor(category, categories)
  const fillOf = (category: string) => conceptCategoryFill(category, categories)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const focusedNode = hoveredNode ?? selectedNode
  const pick = usePickAnchors()
  const [transform, setTransform] = useState<TransformState>({ scale: 1, translateX: 0, translateY: 0 })
  const [layoutNodes, setLayoutNodes] = useState<Record<string, ConceptNode>>({})
  const [viewBox, setViewBox] = useState('0 0 1400 900')
  const [isPanning, setIsPanning] = useState(false)
  const [graphs, setGraphs] = useState<GraphComponent[]>([])
  const [currentGraphIndex, setCurrentGraphIndex] = useState(0)
  const transformRef = useRef(transform)
  const isPanningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0, baseTranslateX: 0, baseTranslateY: 0 })
  const pinchRef = useRef({ active: false, initialDist: 0, initialScale: 1 })

  useEffectSyncRef(transform, transformRef)

  const allNodeIds = useMemo(() => Object.keys(nodes), [nodes])

  const currentGraph = graphs[currentGraphIndex]
  const nodeIds = currentGraph?.nodeIds ?? allNodeIds
  const currentEdges = currentGraph?.edges ?? edges
  const routes = useMemo(() => routeConceptEdges(layoutNodes, currentEdges), [layoutNodes, currentEdges])

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

    const layoutResult = layoutTopDownPlanar(graph, nodes, VIEW_W, VIEW_H)
    setLayoutNodes(layoutResult.nodes)

    setTransform(fitConceptMap(layoutResult.nodes, graph.edges, VIEW_W, VIEW_H))

  }, [allNodeIds, edges, nodes, currentGraphIndex])

  useEffect(() => {
    computeLayout()
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(computeLayout)
    observer.observe(element)
    return () => observer.disconnect()
  }, [computeLayout])

  useEffect(() => {
    if (!containerRef.current || !Object.keys(layoutNodes).length) return
    const bounds = containerRef.current.getBoundingClientRect()
    const { viewW, viewH } = getViewportDimensions(Math.max(300, bounds.width), Math.max(300, bounds.height))
    const ids = selectedNode ? new Set([selectedNode, ...connectedNodes.get(selectedNode) ?? []]) : new Set(Object.keys(layoutNodes))
    const shown = Object.fromEntries(Object.entries(layoutNodes).filter(([id]) => ids.has(id)))
    const links = currentEdges.filter((edge) => shown[edge.from] && shown[edge.to])
    setTransform(fitConceptMap(shown, links, viewW, viewH))
  }, [selectedNode, layoutNodes, currentEdges, connectedNodes])

  const switchGraph = useCallback((direction: number) => {
    const newIndex = (currentGraphIndex + direction + graphs.length) % graphs.length
    setCurrentGraphIndex(newIndex)
    setSelectedNode(null)
    setHoveredNode(null)
  }, [currentGraphIndex, graphs.length])

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (isPanningRef.current) {
      const svgEl = svgRef.current
      // Scale screen-pixel deltas to SVG viewBox units so panning is 1:1 with the mouse.
      // Without this, panning feels sluggish when viewBox >> rendered size.
      let ratio = 1
      if (svgEl) {
        const rendered = svgEl.getBoundingClientRect()
        const width = Number(svgEl.getAttribute('viewBox')?.split(/\s+/)[2])
        if (rendered.width > 0 && width > 0) ratio = width / rendered.width
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

  // Native event listeners for wheel, touch (like flowchart useCamera)
  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation?.()
      const delta = -e.deltaY * 0.0015
      const currentScale = transformRef.current.scale
      const currentTx = transformRef.current.translateX
      const currentTy = transformRef.current.translateY
      const newScale = Math.min(3, Math.max(0.15, currentScale * (1 + delta)))

      const rect = svgEl.getBoundingClientRect()
      const [, , viewWidth, viewHeight] = (svgEl.getAttribute('viewBox') ?? '0 0 1400 900').split(/\s+/).map(Number)
      const mouseX = (e.clientX - rect.left) * viewWidth / Math.max(1, rect.width)
      const mouseY = (e.clientY - rect.top) * viewHeight / Math.max(1, rect.height)
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
        const [, , viewWidth, viewHeight] = (svgEl.getAttribute('viewBox') ?? '0 0 1400 900').split(/\s+/).map(Number)
        const centerX = ((t1.clientX + t2.clientX) / 2 - rect.left) * viewWidth / Math.max(1, rect.width)
        const centerY = ((t1.clientY + t2.clientY) / 2 - rect.top) * viewHeight / Math.max(1, rect.height)
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
  }, [handlePointerMove])

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
    const [, , viewWidth, viewHeight] = (svgRef.current.getAttribute('viewBox') ?? '0 0 1400 900').split(/\s+/).map(Number)
    const cx = viewWidth / 2
    const cy = viewHeight / 2
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
    const [, , viewWidth, viewHeight] = (svgRef.current.getAttribute('viewBox') ?? '0 0 1400 900').split(/\s+/).map(Number)
    const cx = viewWidth / 2
    const cy = viewHeight / 2
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

    setSelectedNode(null)
    setTransform(fitConceptMap(layoutNodes, currentEdges, VIEW_W, VIEW_H))
  }, [currentGraph, layoutNodes, currentEdges])

  const isNodeHovered = (id: string): boolean => {
    if (!focusedNode) return false
    if (id === focusedNode) return true
    return connectedNodes.get(focusedNode)?.has(id) ?? false
  }

  const isEdgeConnected = (edge: ConceptEdge): boolean => {
    if (!focusedNode) return false
    return edge.from === focusedNode || edge.to === focusedNode
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
            data-pick-pan
            viewBox={viewBox}
            width="100%"
            height="100%"
            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
          >
            <defs><marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker></defs>
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
                if (!from || !to) return null

                const isConnected = isEdgeConnected(edge)
                const isDimmed = focusedNode && !isConnected

                const route = routes[idx]
                if (!route) return null

                return (
                  <g key={`edge-${edge.from}-${edge.to}-${idx}`} data-testid={`concept-map-edge-${idx}`} {...pick(edge)}>
                    <path d={route.path} fill="none" markerEnd={`url(#${arrowId})`}
                      className={`cm-edge ${isConnected ? 'cm-edge-highlight' : ''} ${isDimmed ? 'cm-edge-dimmed' : ''}`}
                      data-testid={`concept-map-edge-line-${idx}`}
                    />
                  </g>
                )
              })}

              {nodeIds.map((id) => {
                const node = layoutNodes[id]
                if (!node || node.x === undefined || node.y === undefined) return null

                const isHov = isNodeHovered(id)
                const isDimmed = focusedNode && !isHov
                const color = colorOf(node.category)
                const fill = fillOf(node.category)
                const nodeW = getNodeWidth(node.title)
                const nodeH = NODE_HEIGHT
                const nodeX = node.x - nodeW / 2
                const nodeY = node.y - nodeH / 2

                return (
                  <g
                    key={id}
                    className={`cm-node-group ${isHov ? 'cm-node-highlight' : ''} ${isDimmed ? 'cm-node-dimmed' : ''}`}
                    data-testid={`concept-map-node-${id}`}
                    {...pick(nodes[id])}
                    role="button" tabIndex={0} aria-label={`Explore ${node.title}`} aria-pressed={selectedNode === id}
                    onClick={() => setSelectedNode((old) => old === id ? null : id)}
                    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedNode((old) => old === id ? null : id) } }}
                    onMouseEnter={() => setHoveredNode(id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <title>{node.title}</title>
                    <rect
                      x={nodeX}
                      y={nodeY}
                      width={nodeW}
                      height={nodeH}
                      rx={16}
                      className="cm-node-surface"
                      fill={fill}
                      stroke={color}
                      strokeWidth={isHov ? 3 : 2}
                      data-testid={`concept-map-node-circle-${id}`}
                    />
                    <text
                      x={node.x}
                      y={node.y - 10}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="cm-node-title"
                      fill="var(--ctp-text)"
                      data-testid={`concept-map-node-title-${id}`}
                      {...pick(nodes[id], 'title')}
                    >
                      {conceptNodeLines(node.title).map((line, i, lines) => <tspan key={i} x={node.x} dy={i ? 24 : -(lines.length - 1) * 12}>{line}</tspan>)}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 39}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="cm-node-category"
                      fill={color}
                      {...pick(nodes[id], 'category')}
                    >
                      {node.category}
                    </text>
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
                if (!from || !to || !edge.label) return null

                const isConnected = isEdgeConnected(edge)
                const isDimmed = focusedNode && !isConnected

                const route = routes[idx]
                if (!route) return null
                const lx = route.label.x
                const ly = route.label.y
                const lines = wrapConceptText(edge.label, 26)
                const tw = Math.max(...lines.map((line) => line.length)) * 6.5 + 18
                const labelHeight = lines.length * 15 + 12

                return (
                  <g
                    key={`edge-label-${idx}`}
                    {...pick(edge, 'label')}
                    className={`cm-edge-label-group ${isConnected ? 'cm-edge-label-group-highlight' : ''} ${isDimmed ? 'cm-edge-label-dimmed' : ''}`}
                  >
                    <title>{edge.label}</title>
                    <rect
                      x={lx - tw / 2}
                      y={ly - labelHeight / 2}
                      width={tw}
                      height={labelHeight}
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
                      {lines.map((line, i) => <tspan key={i} x={lx} dy={i ? 15 : -(lines.length - 1) * 7.5 + 4}>{line}</tspan>)}
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
                  style={{ backgroundColor: colorOf(cat) }}
                />
                <span>{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="concept-map-relations" data-testid="concept-map-relations">
        <div className="concept-map-relations-heading">
          <h3>{selectedNode && nodes[selectedNode] ? nodes[selectedNode].title : 'Explore the connections'}</h3>
          {selectedNode && <button type="button" onClick={() => setSelectedNode(null)}>Show all</button>}
        </div>
        {!selectedNode && <p>Select a concept to read its incoming and outgoing relationships.</p>}
        {selectedNode && !currentEdges.some((edge) => edge.from === selectedNode || edge.to === selectedNode) && <p>No authored connections for this concept.</p>}
        {selectedNode && <ul>{currentEdges.filter((edge) => edge.from === selectedNode || edge.to === selectedNode).map((edge, i) => <li key={i}>
          <span>{nodes[edge.from]?.title ?? edge.from}</span><strong>{edge.label?.trim() || 'is connected to'}</strong><span>{nodes[edge.to]?.title ?? edge.to}</span>
        </li>)}</ul>}
      </div>
    </div>
  )
}

export default ConceptMapSection

function useEffectSyncRef<T>(value: T, ref: React.MutableRefObject<T>) {
  ref.current = value
}
