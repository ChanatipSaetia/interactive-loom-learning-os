import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { QUIET, beatMarks, focus, type PresentRendererProps } from '../../../present-kernel'
import { conceptCategories, conceptMapPlan, conceptRelationText, type ConceptMapPresentData } from '../../present'
import { NODE_HEIGHT, conceptCategoryColor, conceptCategoryFill, getNodeWidth, layoutConceptMap, routeConceptEdges, conceptNodeLines } from './index'
import './concept-map.css'
import '../present.css'

/** Explain directed, authored relationships one at a time while retaining the shared Read layout. */
export default function PresentConceptMap({ data, beat }: PresentRendererProps<ConceptMapPresentData>) {
  const pick = usePickAnchors()
  const mark = beatMarks(beat)
  const markerId = `cm-arrow-${useId().replace(/:/g, '')}`
  const nodes = useMemo(() => data.nodes ?? {}, [data.nodes])
  const edges = useMemo(() => (data.edges ?? []).map((edge, index) => ({ edge, index })).filter(({ edge }) => nodes[edge.from] && nodes[edge.to]), [data.edges, nodes])
  const layout = useMemo(() => layoutConceptMap(nodes, edges.map(({ edge }) => edge)), [nodes, edges])
  const routes = useMemo(() => routeConceptEdges(layout.nodes, data.edges ?? []), [layout.nodes, data.edges])
  const groups = useMemo(() => conceptCategories(data), [data])
  const plan = useMemo(() => conceptMapPlan(data), [data])
  const step = plan[beat]
  const groupBeats = new Map(plan.flatMap((s, i) => s.kind === 'group' ? [[s.group, i] as const] : []))
  const linkBeats = new Map(plan.flatMap((s, i) => s.kind === 'relation' ? [[s.edge, i] as const] : []))
  const groupOf = (id: string) => Math.max(0, groups.indexOf(nodes[id]?.category ?? ''))
  const colorOf = (category: string) => conceptCategoryColor(category, groups)
  const fillOf = (category: string) => conceptCategoryFill(category, groups)
  const whole = step?.kind === 'map'
  const relation = step?.kind === 'relation' ? data.edges?.[step.edge] : undefined
  const focused = new Set(relation ? [relation.from, relation.to] : step?.kind === 'group' ? Object.keys(nodes).filter((id) => groupOf(id) === step.group) : Object.keys(nodes))
  const svgRef = useRef<SVGSVGElement>(null)
  const [tall, setTall] = useState(false)
  useEffect(() => {
    const el = svgRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => setTall(entry.contentRect.width < entry.contentRect.height))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const frame = Object.values(layout.nodes)
  let viewBox = `0 0 ${Math.max(1, layout.width)} ${Math.max(1, layout.height)}`
  if (frame.length) {
    const minX = Math.min(...frame.map((n) => (n.x ?? 0) - getNodeWidth(n.title) / 2)) - 80
    const maxX = Math.max(...frame.map((n) => (n.x ?? 0) + getNodeWidth(n.title) / 2)) + 80
    const minY = Math.min(...frame.map((n) => (n.y ?? 0) - NODE_HEIGHT / 2)) - 100
    const maxY = Math.max(...frame.map((n) => (n.y ?? 0) + NODE_HEIGHT / 2)) + 80
    const width = Math.max(maxX - minX, tall ? 320 : 850)
    const height = Math.max(maxY - minY, tall ? 340 : 400)
    viewBox = `${(minX + maxX - width) / 2} ${(minY + maxY - height) / 2} ${width} ${height}`
  }

  return (
    <div className="present-cm" data-testid="present-concept-map">
      <div className="concept-map-canvas-wrapper present-cm-canvas" {...QUIET}>
        <motion.svg ref={svgRef} className="present-cm-svg" viewBox={viewBox} initial={false} animate={{ viewBox }} transition={{ duration: 0 }} preserveAspectRatio="xMidYMid meet" role="img" aria-label={data.title ?? 'Concept map'}>
          <defs><marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker></defs>
          {[...edges].sort((a, b) => Number(a.index === (step?.kind === 'relation' ? step.edge : -1)) - Number(b.index === (step?.kind === 'relation' ? step.edge : -1))).map(({ edge, index }) => {
            const route = routes[index]
            if (!route) return null
            const active = step?.kind === 'relation' && step.edge === index
            return <path key={index} d={route.path} fill="none" pathLength={1} markerEnd={`url(#${markerId})`} className={`cm-edge present-cm-edge${active ? ' is-active' : !whole ? ' is-context' : ''}`} data-testid={`present-cm-link-${index + 1}`} {...mark(linkBeats.get(index) ?? Infinity, { motion: 'draw', delay: 350 })} data-shown="" {...pick(edge)} />
          })}
          {Object.values(layout.nodes).map((node) => {
            const at = groupBeats.get(groupOf(node.id)) ?? 0
            const width = getNodeWidth(node.title)
            const lines = conceptNodeLines(node.title)
            const x = (node.x ?? 0) - width / 2
            const y = (node.y ?? 0) - NODE_HEIGHT / 2
            const source = relation?.from === node.id
            const target = relation?.to === node.id
            return <g key={node.id} className={`cm-node-group present-cm-node${!whole && !focused.has(node.id) ? ' is-context' : ''}`} data-testid={`present-cm-node-${node.id}`} {...mark(at, { motion: 'fade' })} data-shown="" {...pick(nodes[node.id])}>
              <title>{node.title}</title>
              <rect className="cm-node-surface" x={x} y={y} width={width} height={NODE_HEIGHT} rx={16} fill={fillOf(node.category)} stroke={colorOf(node.category)} strokeWidth={2} />
              {source && <rect className="present-cm-source-ring" x={x - 5} y={y - 5} width={width + 10} height={NODE_HEIGHT + 10} rx={16} fill="none" stroke={colorOf(node.category)} strokeWidth={3} {...mark(beat, { motion: 'fade', delay: 0 })} />}
              {target && <rect className="present-cm-target-ring" x={x - 8} y={y - 8} width={width + 16} height={NODE_HEIGHT + 16} rx={18} fill="none" stroke={colorOf(node.category)} strokeWidth={3} {...mark(beat, { motion: 'fade', delay: 1100 })} />}
              <text x={node.x} y={(node.y ?? 0) - 10 - (lines.length - 1) * 12} dominantBaseline="middle" textAnchor="middle" className="cm-node-title" fill="var(--ctp-text)" {...pick(nodes[node.id], 'title')}>
                {lines.map((line, i) => <tspan key={i} x={node.x} dy={i ? 24 : 0}>{line}</tspan>)}
              </text>
              <text x={node.x} y={(node.y ?? 0) + 39} dominantBaseline="middle" textAnchor="middle" className="cm-node-category" fill={colorOf(node.category)} {...pick(nodes[node.id], 'category')}>{node.category}</text>
            </g>
          })}
          {(whole || relation) && edges.map(({ edge, index }) => {
            const route = routes[index]
            const active = step?.kind === 'relation' && step.edge === index
            if (!route || !edge.label || (!whole && !active)) return null
            const x = route.label.x
            const y = route.label.y
            const width = edge.label.length * (active ? 7 : 6) + 16
            return <g key={index} className={`cm-edge-label-group${active ? ' present-cm-active-label' : ''}`} {...(active && mark(beat, { motion: 'fade', delay: 750 }))} {...pick(edge, 'label')}>
              <rect x={x - width / 2} y={y - 16} width={width} height={active ? 26 : 20} rx={4} className="cm-edge-label-bg" />
              <text x={x} y={y - 1} textAnchor="middle" className="cm-edge-label">{edge.label}</text>
            </g>
          })}
        </motion.svg>
      </div>
      <div key={beat} className="present-cm-explanation" {...mark(Math.max(0, beat), { motion: 'fade' })}>
        {relation ? <>
          <p className="present-eyebrow" {...QUIET}>Read the connection</p>
          <div className="present-cm-statement" data-testid="present-cm-statement" {...QUIET}>
            <strong style={{ '--concept-accent': colorOf(nodes[relation.from].category) } as CSSProperties} {...pick(nodes[relation.from], 'title')}>{nodes[relation.from].title}</strong>
            <span className="present-cm-verb" {...focus(true)} {...pick(relation, 'label')}>{relation.label?.trim() || 'is connected to'}<ArrowRight aria-hidden size={24} /></span>
            <strong style={{ '--concept-accent': colorOf(nodes[relation.to].category) } as CSSProperties} {...pick(nodes[relation.to], 'title')}>{nodes[relation.to].title}</strong>
          </div>
          <p className="present-sr" aria-hidden="true">{conceptRelationText(data, relation)}.</p>
        </> : step?.kind === 'group' ? <>
          <p className="present-eyebrow" {...QUIET}>Meet the concepts</p>
          <p className="present-cm-group-title" {...QUIET} {...focus(true)}>{groups[step.group] || 'Concepts'}</p>
          <p className="present-cm-group-names" {...QUIET}>{Object.keys(nodes).filter((id) => groupOf(id) === step.group).map((id) => nodes[id].title).join(' · ')}</p>
          <p className="present-sr" aria-hidden="true">{groups[step.group] || 'Concepts'}. {Object.keys(nodes).filter((id) => groupOf(id) === step.group).map((id) => nodes[id].title).join(', ')}.</p>
        </> : <p className="present-cm-group-title">{Object.keys(nodes).length ? 'The complete map' : 'No concepts to present'}</p>}
      </div>
    </div>
  )
}
