import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { QUIET, beatMarks, focus, type PresentRendererProps } from '../../../present-kernel'
import { conceptCategories, type ConceptMapPresentData } from '../../present'
import { NODE_HEIGHT, getCategoryColor, getCategoryFill, getNodeWidth, layoutConceptMap } from './index'
import './concept-map.css'
import '../present.css'

/** Categories the Read map has no colour for take these, in order, so each group stands apart. */
const GROUP_COLORS = ['var(--ctp-mauve)', 'var(--ctp-sky)', 'var(--ctp-green)', 'var(--ctp-peach)', 'var(--ctp-yellow)', 'var(--ctp-teal)', 'var(--ctp-pink)', 'var(--ctp-sapphire)']
const PAD = 48

/**
 * Concept map in Present mode (conceptMapBeats), drawn with the Read map's nodes, links, labels and
 * legend: the Read layout of the whole map, built up one category
 * at a time. Each group's concepts pop in and light up while the view widens to hold everything shown
 * so far, and the narrator names them; a link draws once both its ends are on screen. With more than
 * one group, the last beat frames the whole map.
 */
export default function PresentConceptMap({ data, beat }: PresentRendererProps<ConceptMapPresentData>) {
  const pick = usePickAnchors()
  const mark = beatMarks(beat)
  const nodes = useMemo(() => data.nodes ?? {}, [data.nodes])
  const edges = useMemo(() => (data.edges ?? []).filter((e) => nodes[e.from] && nodes[e.to]), [data.edges, nodes])
  const layout = useMemo(() => layoutConceptMap(nodes, edges), [nodes, edges])
  const groups = useMemo(() => conceptCategories(data), [data])
  const groupIndex = useMemo(() => new Map(Object.values(nodes).map((n) => [n.id, Math.max(0, groups.indexOf(n.category))])), [nodes, groups])
  const groupOf = (id: string) => groupIndex.get(id) ?? 0
  const known = (category: string) => getCategoryColor(category) !== getCategoryColor('')
  const colorOf = (category: string) => (known(category) ? getCategoryColor(category) : GROUP_COLORS[Math.max(0, groups.indexOf(category)) % GROUP_COLORS.length])
  const fillOf = (category: string) => (known(category) ? getCategoryFill(category) : `color-mix(in srgb, ${colorOf(category)} 15%, var(--ctp-surface0))`)
  const whole = groups.length > 1 && beat >= groups.length

  // A tall (phone) canvas cannot fit the whole map readably: it frames the group being introduced
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [tall, setTall] = useState(false)
  useEffect(() => {
    const el = svgRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => setTall(entry.contentRect.width < entry.contentRect.height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Frame everything shown so far (the first group before the section starts); on a tall canvas only
  // the current group, and the whole map on its own beat
  const viewBox = useMemo(() => {
    const upTo = whole ? groups.length : Math.max(0, beat)
    const shown = Object.values(layout.nodes).filter((n) => {
      const g = groupIndex.get(n.id) ?? 0
      return tall && !whole ? g === upTo : g <= upTo
    })
    if (!shown.length) return `0 0 ${Math.max(1, layout.width)} ${Math.max(1, layout.height)}`
    const minX = Math.min(...shown.map((n) => (n.x ?? 0) - getNodeWidth(n.title) / 2)) - PAD
    const maxX = Math.max(...shown.map((n) => (n.x ?? 0) + getNodeWidth(n.title) / 2)) + PAD
    const minY = Math.min(...shown.map((n) => (n.y ?? 0) - NODE_HEIGHT / 2)) - PAD
    const maxY = Math.max(...shown.map((n) => (n.y ?? 0) + NODE_HEIGHT / 2)) + PAD
    // Never closer than the map at its own size, so a lone concept is not blown up
    const w = Math.max(maxX - minX, tall ? 360 : 900)
    const h = Math.max(maxY - minY, tall ? 480 : 420)
    return `${(minX + maxX - w) / 2} ${(minY + maxY - h) / 2} ${w} ${h}`
  }, [beat, whole, layout, groups.length, groupIndex, tall])

  return (
    <div className="present-cm" data-testid="present-concept-map">
      <div className="concept-map-canvas-wrapper present-cm-canvas">
      <motion.svg
        ref={svgRef}
        className="present-cm-svg"
        initial={false}
        animate={{ viewBox }}
        transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={data.title ?? 'Concept map'}
        {...QUIET}
      >
        {edges.map((e, i) => {
          const a = layout.edgeAnchors[`${e.from}->${e.to}`]
          if (!a) return null
          const at = Math.max(groupOf(e.from), groupOf(e.to))
          const delay = 420 + i * 40
          return (
            <path
              key={`edge-${i}`}
              className="cm-edge present-cm-edge"
              d={`M ${a.p1.x} ${a.p1.y} L ${a.p2.x} ${a.p2.y}`}
              pathLength={1}
              {...mark(at, { motion: 'draw', delay })}
              {...pick(e)}
            />
          )
        })}
        {Object.values(layout.nodes).map((n, i) => {
          const g = groupOf(n.id)
          const color = colorOf(n.category)
          const w = getNodeWidth(n.title)
          const past = !whole && g < beat
          return (
            <g
              key={n.id}
              className={`cm-node-group present-cm-node${past ? ' is-past' : ''}`}
              data-testid={`present-cm-node-${n.id}`}
              {...mark(g, { motion: 'pop', delay: 120 + (i % 12) * 60 })}
              {...focus(!whole && g === beat)}
              {...pick(nodes[n.id])}
            >
              <rect x={(n.x ?? 0) - w / 2} y={(n.y ?? 0) - NODE_HEIGHT / 2} width={w} height={NODE_HEIGHT} rx={16} fill={fillOf(n.category)} stroke={color} strokeWidth={2} />
              <text x={n.x} y={(n.y ?? 0) - 6} textAnchor="middle" dominantBaseline="middle" className="cm-node-title" fill="var(--ctp-text)" {...pick(nodes[n.id], 'title')}>{n.title}</text>
              <text x={n.x} y={(n.y ?? 0) + 12} textAnchor="middle" dominantBaseline="middle" className="cm-node-category" fill={color} {...pick(nodes[n.id], 'category')}>{n.category}</text>
            </g>
          )
        })}
        {edges.map((e, i) => {
          const a = layout.edgeAnchors[`${e.from}->${e.to}`]
          if (!a || !e.label) return null
          const at = Math.max(groupOf(e.from), groupOf(e.to))
          const x = (a.p1.x + a.p2.x) / 2
          const y = (a.p1.y + a.p2.y) / 2
          const w = e.label.length * 6 + 10
          return (
            <g key={`label-${i}`} className="cm-edge-label-group present-cm-label" {...mark(at, { motion: 'fade', delay: 900 + i * 40 })} {...pick(e, 'label')}>
              <rect x={x - w / 2} y={y - 14} width={w} height={15} rx={4} className="cm-edge-label-bg" />
              <text x={x} y={y - 6} textAnchor="middle" className="cm-edge-label">{e.label}</text>
            </g>
          )
        })}
      </motion.svg>
      <div className="concept-map-legend present-cm-legend" {...QUIET}>
        {groups.map((c, g) => (
          <div key={c} className={`concept-map-legend-item${!whole && g === beat ? ' is-now' : ''}`} {...mark(g, { motion: 'fade' })}>
            <span className="concept-map-legend-dot" style={{ backgroundColor: colorOf(c) }} />
            <span>{c}</span>
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}
