import { useRef, useCallback, useMemo, type ComponentType } from 'react'
import { useAnimation } from '../../core/hooks/useAnimation'
import { SectionRegistry } from '../../core/registry'
import './architecture-flow.css'

export interface ArchNode {
  id: string
  label: string
  x: number
  y: number
  color?: string
}

export interface ArchEdge {
  from: string
  to: string
  label?: string
}

export interface ArchitectureFlowProps {
  title?: string
  nodes: ArchNode[]
  edges: ArchEdge[]
}

function getEdgePath(
  nodes: ArchNode[],
  fromId: string,
  toId: string
): { path: string; length: number } {
  const from = nodes.find((n) => n.id === fromId)
  const to = nodes.find((n) => n.id === toId)
  if (!from || !to) {
    return { path: 'M 0 0', length: 0 }
  }

  const r = 28
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dist = Math.sqrt(dx * dx + dy * dy) || 1
  const ux = dx / dist
  const uy = dy / dist

  const x1 = from.x + ux * r
  const y1 = from.y + uy * r
  const x2 = to.x - ux * r
  const y2 = to.y - uy * r

  const path = `M ${x1} ${y1} L ${x2} ${y2}`
  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) || 1

  return { path, length }
}

const defaultNodeColor = '#17171c'

function ArchitectureFlow({ title, nodes, edges }: ArchitectureFlowProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const nodeRefs = useRef<Record<string, SVGCircleElement | null>>({})
  const edgeRefs = useRef<Record<string, SVGPathElement | null>>({})

  const nodeMap = useMemo(() => {
    const m = Object.create(null)
    for (const n of nodes) {
      m[n.id] = n
    }
    return m
  }, [nodes])

  const setNodeRef = useCallback((id: string, el: SVGCircleElement | null) => {
    if (el) {
      nodeRefs.current[id] = el
      el.setAttribute('opacity', '0')
    }
  }, [])

  const setEdgeRef = useCallback((idx: number, el: SVGPathElement | null) => {
    if (el) {
      const { length } = getEdgePath(nodes, edges[idx].from, edges[idx].to)
      edgeRefs.current[idx] = el
      el.setAttribute('stroke-dasharray', String(length))
      el.setAttribute('stroke-dashoffset', String(length))
    }
  }, [nodes, edges])

  const buildTimeline = useCallback(
    (tl: Parameters<Parameters<typeof useAnimation>[0]>[0]) => {
      for (let i = 0; i < nodes.length; i++) {
        const el = nodeRefs.current[nodes[i].id]
        if (el) {
          tl.add(
            el,
            { opacity: 1, duration: 400, easing: 'easeOutQuad' },
            i * 450
          )
        }
        if (i < edges.length) {
          const edgeEl = edgeRefs.current[i]
          const { length } = getEdgePath(nodes, edges[i].from, edges[i].to)
          if (edgeEl) {
            tl.add(
              edgeEl,
              {
                strokeDashoffset: [length, 0],
                duration: 500,
                easing: 'easeInOutQuad',
              },
              i * 450 + 200
            )
          }
        }
      }
    },
    [nodes, edges]
  )

  const control = useAnimation(buildTimeline, { autoplay: false, totalSteps: nodes.length })
  const { playing, currentStep, totalSteps } = control.status

  const viewBoxY = nodes.length > 0
    ? Math.min(...nodes.map((n) => n.y)) - 50
    : 0
  const viewBoxHeight = nodes.length > 0
    ? Math.max(...nodes.map((n) => n.y)) + 50 - viewBoxY
    : 300

  return (
    <div className="architecture-flow">
      {title && <h3 className="architecture-flow-title">{title}</h3>}

      <svg
        ref={svgRef}
        className="architecture-flow-svg"
        viewBox={`0 0 600 ${viewBoxHeight}`}
        data-testid="architecture-flow-svg"
      >
        {edges.map((edge, idx) => {
          const { path } = getEdgePath(nodes, edge.from, edge.to)
          const fromNode = nodeMap[edge.from]
          const toNode = nodeMap[edge.to]
          const labelX = fromNode && toNode ? (fromNode.x + toNode.x) / 2 : 0
          const labelY = fromNode && toNode ? (fromNode.y + toNode.y) / 2 - 10 : 0
          return (
            <g key={`edge-${idx}`} data-testid={`edge-${idx}`}>
             <path
                  ref={(el) => setEdgeRef(idx, el)}
                  d={path}
                 fill="none"
                 stroke="var(--hairline)"
                 strokeWidth="2"
               />
               {edge.label && (
                 <text
                   x={labelX}
                   y={labelY}
                   textAnchor="middle"
                   fontSize="11"
                   fill="var(--muted)"
                 >
                   {edge.label}
                 </text>
               )}
            </g>
          )
        })}

        {nodes.map((node) => (
          <g key={node.id} data-testid={`node-${node.id}`}>
            <circle
               ref={(el) => setNodeRef(node.id, el)}
               cx={node.x}
               cy={node.y}
               r="28"
               fill={node.color || defaultNodeColor}
             />
            <text
              x={node.x}
              y={node.y}
              dy="0.35em"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--on-primary)"
              fontSize="11"
              fontWeight="500"
              pointerEvents="none"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="architecture-flow-controls" data-testid="arch-flow-controls">
        <button
          className="architecture-flow-btn"
          onClick={control.play}
          data-testid="arch-flow-play"
          aria-label="Play animation"
        >
          Play
        </button>
        <button
          className="architecture-flow-btn"
          onClick={control.pause}
          data-testid="arch-flow-pause"
          aria-label="Pause animation"
        >
          Pause
        </button>
        <button
          className="architecture-flow-btn"
          onClick={control.stepForward}
          disabled={playing || currentStep >= totalSteps - 1}
          data-testid="arch-flow-step"
          aria-label="Step forward"
        >
          Step
        </button>
        <button
          className="architecture-flow-btn"
          onClick={control.stepBack}
          disabled={playing || currentStep <= 0}
          data-testid="arch-flow-step-back"
          aria-label="Step back"
        >
          Step Back
        </button>
        <button
          className="architecture-flow-btn"
          onClick={control.reset}
          data-testid="arch-flow-reset"
          aria-label="Reset animation"
        >
          Reset
        </button>
        <span
          className="architecture-flow-progress"
          data-testid="arch-flow-progress"
        >
          {currentStep + 1} / {totalSteps}
        </span>
      </div>
    </div>
  )
}

SectionRegistry.register('architecture-flow', ArchitectureFlow as ComponentType<unknown>)

export default ArchitectureFlow
