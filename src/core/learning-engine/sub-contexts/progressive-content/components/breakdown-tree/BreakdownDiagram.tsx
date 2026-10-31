import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { focus } from '../../../present-kernel'
import { breakdownPercent, breakdownValue, type BreakdownTreeSectionData } from '../../breakdown-tree'
import { BREAKDOWN_GEOMETRY, layoutBreakdownTree } from '../../breakdown-tree-layout'
import './breakdown-tree.css'

export function BreakdownDiagram({ data, rootId, depthLimit, activeIds, selectedId, onSelect }: { data: BreakdownTreeSectionData; rootId?: string; depthLimit?: number; activeIds?: string[]; selectedId?: string; onSelect?: (id: string) => void }) {
  const root = useRef<HTMLDivElement>(null)
  const pick = usePickAnchors()
  const layout = layoutBreakdownTree(data, rootId, depthLimit)
  const byId = new Map(layout.placed.map((p) => [p.node.id, p]))
  const { cardWidth } = BREAKDOWN_GEOMETRY
  const { cardHeight } = layout
  useLayoutEffect(() => {
    const el = root.current
    const top = layout.placed.find((p) => p.depth === 0)
    const svg = el?.querySelector('svg')
    if (el && onSelect && top && svg) el.scrollLeft = Math.max(0, (top.x + cardWidth / 2) * (svg.clientWidth / layout.width) - el.clientWidth / 2)
  // A selection must not reset the learner's scroll position.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, rootId])
  return <div ref={root} className="breakdown-scroll">
    <svg className="breakdown-diagram" viewBox={`0 0 ${layout.width} ${layout.height}`} style={{ '--breakdown-board-width': `${layout.width}px` } as CSSProperties} role="group" aria-label={data.mode === 'probability' ? 'Probability breakdown: branch percentages are conditional; node percentages are overall.' : `Breakdown in ${data.unit || 'units'}: branches show share of parent; cards show share of total.`}>
      {layout.edges.map((edge) => {
        const from = byId.get(edge.from)!, to = byId.get(edge.to)!
        const x1 = from.x + cardWidth / 2, x2 = to.x + cardWidth / 2
        const y1 = from.y + cardHeight, y2 = to.y
        const mid = (y1 + y2) / 2
        const share = layout.model.metrics(to.node).parentShare
        return <g key={`${edge.from}-${edge.to}`} className="breakdown-link" data-testid={`breakdown-link-${edge.from}-${edge.to}`}>
          <path d={`M ${x1} ${y1} V ${mid} H ${x2} V ${y2}`} />
          <rect x={x2 - 35} y={y2 - 31} width={70} height={25} rx={12} />
          <text x={x2} y={y2 - 14} textAnchor="middle">{breakdownPercent(share)}</text>
          <title>{breakdownPercent(share)} of {from.node.title}</title>
        </g>
      })}
      {layout.placed.map(({ node, x, y }) => {
        const { totalShare } = layout.model.metrics(node)
        const color = [...layout.model.path(node.id)].reverse().find((n) => n.color)?.color ?? 'blue'
        const active = activeIds?.includes(node.id)
        return <foreignObject key={node.id} x={x} y={y} width={cardWidth} height={cardHeight}>
          <div className={`breakdown-node${active ? ' is-active' : ''}`} style={{ '--breakdown-accent': `var(--ctp-${color})` } as CSSProperties} {...pick(node)} {...focus(!!active)}
            role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined} aria-pressed={onSelect ? node.id === selectedId : undefined}
            aria-label={data.mode === 'probability' ? `${node.title}: ${breakdownValue(data, node)} overall probability` : `${node.title}: ${breakdownValue(data, node)}; ${breakdownPercent(totalShare)} of total`}
            onClick={onSelect ? () => onSelect(node.id) : undefined}
            onKeyDown={onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(node.id) } } : undefined}
            data-testid={`breakdown-node-${node.id}`}>
            <div className="breakdown-node-name" {...pick(node, 'title')}>{node.title}</div>
            <div className="breakdown-node-value" {...pick(node, 'value')}>{breakdownValue(data, node)}</div>
            <div className="breakdown-node-share">{data.mode === 'probability' ? 'Overall probability' : totalShare === undefined ? 'Share of total —' : `${breakdownPercent(totalShare)} of total`}</div>
            <div className="breakdown-share-track" aria-hidden="true"><span style={{ width: `${Math.min(100, Math.max(0, (totalShare ?? 0) * 100))}%` }} /></div>
          </div>
        </foreignObject>
      })}
    </svg>
  </div>
}
