import { useMemo, type ComponentType } from 'react'
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

export interface FlowchartProps {
  title?: string
  nodes: FlowchartNode[]
  edges: FlowchartEdge[]
}

interface PositionedNode extends FlowchartNode {
  x: number
  y: number
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

function Flowchart({ title, nodes, edges }: FlowchartProps) {
  const positioned = useMemo(
    () => computeLayoutWithBarycenter(nodes, edges),
    [nodes, edges]
  )

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

  return (
    <div className="flowchart-section" data-testid="flowchart-section">
      {title && (
        <h3 className="flowchart-title" data-testid="flowchart-title">
          {title}
        </h3>
      )}

      <svg
        className="flowchart-svg"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        data-testid="flowchart-svg"
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
            >
              <rect
                x={x}
                y={y}
                width={nodeWidth}
                height={nodeHeight}
                rx="var(--radius-sm)"
                fill="var(--canvas)"
                stroke="var(--hairline)"
                strokeWidth="1"
                className="flowchart-node-rect"
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
      </svg>
    </div>
  )
}

SectionRegistry.register('flowchart', Flowchart as ComponentType<unknown>)

export default Flowchart
