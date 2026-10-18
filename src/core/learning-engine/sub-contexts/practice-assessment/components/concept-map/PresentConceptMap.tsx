import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useSound } from '../../../../../ui-system/sensory/SoundContext'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { beatMarks, type PresentRendererProps } from '../../../present-kernel'
import { conceptCategories, type ConceptMapPresentData } from '../../present'
import { NODE_HEIGHT, getCategoryColor, getNodeWidth, layoutConceptMap } from './index'
import '../present.css'

/** Categories the Read map has no colour for take these, in order, so each group stands apart. */
const GROUP_COLORS = ['var(--ctp-mauve)', 'var(--ctp-sky)', 'var(--ctp-green)', 'var(--ctp-peach)', 'var(--ctp-yellow)', 'var(--ctp-teal)', 'var(--ctp-pink)', 'var(--ctp-sapphire)']
const PAD = 48
const fill = (color: string) => `color-mix(in srgb, ${color} 15%, var(--ctp-surface0))`

/**
 * Concept map in Present mode (conceptMapBeats): the Read layout of the whole map, built up one category
 * at a time. Each group's concepts pop in while the view widens to hold everything shown so far; a link
 * draws once both its ends are on screen. The last beat frames the whole map and lets the learner tap a
 * concept to light up its links.
 */
export default function PresentConceptMap({ data, beat, beats, active }: PresentRendererProps<ConceptMapPresentData>) {
  const pick = usePickAnchors()
  const { playSound } = useSound()
  const mark = beatMarks(beat)
  const nodes = useMemo(() => data.nodes ?? {}, [data.nodes])
  const edges = useMemo(() => (data.edges ?? []).filter((e) => nodes[e.from] && nodes[e.to]), [data.edges, nodes])
  const layout = useMemo(() => layoutConceptMap(nodes, edges), [nodes, edges])
  const groups = useMemo(() => conceptCategories(data), [data])
  const groupIndex = useMemo(() => new Map(Object.values(nodes).map((n) => [n.id, Math.max(0, groups.indexOf(n.category))])), [nodes, groups])
  const groupOf = (id: string) => groupIndex.get(id) ?? 0
  const colorOf = (category: string) => {
    const known = getCategoryColor(category)
    return known === getCategoryColor('') ? GROUP_COLORS[Math.max(0, groups.indexOf(category)) % GROUP_COLORS.length] : known
  }
  const exploreBeat = beats.length - 1
  const exploring = groups.length > 0 && beat >= exploreBeat
  const [selected, setSelected] = useState<string | null>(null)
  const linked = useMemo(() => {
    if (!selected) return null
    const ids = new Set([selected])
    edges.forEach((e) => {
      if (e.from === selected) ids.add(e.to)
      if (e.to === selected) ids.add(e.from)
    })
    return ids
  }, [selected, edges])

  // Frame everything shown so far (the first group before the section starts)
  const viewBox = useMemo(() => {
    const upTo = exploring ? groups.length : Math.max(0, beat)
    const shown = Object.values(layout.nodes).filter((n) => (groupIndex.get(n.id) ?? 0) <= upTo)
    if (!shown.length) return `0 0 ${Math.max(1, layout.width)} ${Math.max(1, layout.height)}`
    const minX = Math.min(...shown.map((n) => (n.x ?? 0) - getNodeWidth(n.title) / 2)) - PAD
    const maxX = Math.max(...shown.map((n) => (n.x ?? 0) + getNodeWidth(n.title) / 2)) + PAD
    const minY = Math.min(...shown.map((n) => (n.y ?? 0) - NODE_HEIGHT / 2)) - PAD
    const maxY = Math.max(...shown.map((n) => (n.y ?? 0) + NODE_HEIGHT / 2)) + PAD
    // Never closer than the map at its own size, so a lone concept is not blown up
    const w = Math.max(maxX - minX, 900)
    const h = Math.max(maxY - minY, 420)
    return `${(minX + maxX - w) / 2} ${(minY + maxY - h) / 2} ${w} ${h}`
  }, [beat, exploring, layout, groups.length, groupIndex])

  const toggle = (id: string) => {
    if (!exploring || !active) return
    playSound('click')
    setSelected((s) => (s === id ? null : id))
  }
  const dimmed = (ids: string[]) => !!linked && !ids.every((id) => linked.has(id))

  return (
    <div className={`present-cm${exploring && active ? ' is-exploring' : ''}`} data-testid="present-concept-map">
      <motion.svg
        className="present-cm-svg"
        initial={false}
        animate={{ viewBox }}
        transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={data.title ?? 'Concept map'}
      >
        {edges.map((e, i) => {
          const a = layout.edgeAnchors[`${e.from}->${e.to}`]
          if (!a) return null
          const at = Math.max(groupOf(e.from), groupOf(e.to))
          const delay = 420 + i * 40
          return (
            <path
              key={`edge-${i}`}
              className={`present-cm-edge${linked && !dimmed([e.from, e.to]) ? ' is-lit' : ''}${dimmed([e.from, e.to]) ? ' is-dim' : ''}`}
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
          const past = !exploring && g < beat
          return (
            <g
              key={n.id}
              className={`present-cm-node${past ? ' is-past' : ''}${selected === n.id ? ' is-selected' : ''}${dimmed([n.id]) ? ' is-dim' : ''}`}
              onClick={() => toggle(n.id)}
              data-testid={`present-cm-node-${n.id}`}
              {...mark(g, { motion: 'pop', delay: 120 + (i % 12) * 60 })}
              {...pick(nodes[n.id])}
            >
              <rect x={(n.x ?? 0) - w / 2} y={(n.y ?? 0) - NODE_HEIGHT / 2} width={w} height={NODE_HEIGHT} rx={16} fill={fill(color)} stroke={color} />
              <text x={n.x} y={(n.y ?? 0) - 6} className="present-cm-title" {...pick(nodes[n.id], 'title')}>{n.title}</text>
              <text x={n.x} y={(n.y ?? 0) + 13} className="present-cm-category" fill={color}>{n.category}</text>
            </g>
          )
        })}
        {edges.map((e, i) => {
          const a = layout.edgeAnchors[`${e.from}->${e.to}`]
          if (!a || !e.label) return null
          const at = Math.max(groupOf(e.from), groupOf(e.to))
          const x = (a.p1.x + a.p2.x) / 2
          const y = (a.p1.y + a.p2.y) / 2
          const w = e.label.length * 6.6 + 14
          return (
            <g key={`label-${i}`} className={`present-cm-label${dimmed([e.from, e.to]) ? ' is-dim' : ''}`} {...mark(at, { motion: 'fade', delay: 900 + i * 40 })} {...pick(e, 'label')}>
              <rect x={x - w / 2} y={y - 10} width={w} height={20} rx={5} />
              <text x={x} y={y + 1}>{e.label}</text>
            </g>
          )
        })}
      </motion.svg>
      <div className="present-cm-foot">
        <ul className="present-cm-legend">
          {groups.map((c, g) => (
            <li key={c} className={!exploring && g === beat ? 'is-now' : undefined} {...mark(g, { motion: 'rise' })}>
              <span className="present-cm-dot" style={{ background: colorOf(c) }} />
              {c}
            </li>
          ))}
        </ul>
        {exploring && <p className="present-cm-hint" {...mark(exploreBeat, { motion: 'fade', delay: 600 })}>Tap a concept to see what it connects to.</p>}
      </div>
    </div>
  )
}
