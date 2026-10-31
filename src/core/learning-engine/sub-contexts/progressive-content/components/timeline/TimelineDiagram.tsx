import { useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { focus } from '../../../present-kernel'
import type { TimelineSectionData } from '../../timeline'
import { layoutTimeline, timelineTime } from '../../timeline-layout'
import './timeline.css'

export function TimelineDiagram({ data, activeIds, onSelect, fit = false, endTime }: { data: TimelineSectionData; activeIds?: string[]; onSelect?: (id: string) => void; fit?: boolean; endTime?: number }) {
  const root = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(false)
  useLayoutEffect(() => {
    if (!fit || !root.current) return
    const measure = () => { const width = root.current?.clientWidth ?? 0; if (width) setCompact(width < 700) }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root.current)
    return () => observer.disconnect()
  }, [fit])
  const layout = layoutTimeline(data, compact, endTime)
  const pick = usePickAnchors()
  const markerId = `timeline-arrow-${useId().replace(/:/g, '')}`
  const byId = new Map(layout.placed.map((p) => [p.activity.id, p]))
  const { left, right } = layout
  const tickCount = compact ? 3 : 6
  return <div ref={root} className={`timeline-scroll${compact ? ' is-compact' : ''}`}>
    <svg className="timeline-diagram" viewBox={`0 0 ${layout.width} ${layout.height}`} role="group" aria-label={`Timeline in ${data.unit}; elapsed ${timelineTime(layout.end)} ${data.unit}`}>
      <defs><marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="context-stroke" strokeWidth="1.5" /></marker></defs>
      <text x={left} y={24} className="timeline-axis-title">Elapsed time ({data.unit}) →</text>
      {(layout.end ? Array.from({ length: tickCount }, (_, i) => layout.end * i / (tickCount - 1)) : [0]).map((tick, i) => <g key={i} aria-hidden="true">
        <line x1={layout.x(tick)} x2={layout.x(tick)} y1={64} y2={layout.height - 25} className="timeline-grid-line" />
        <text x={layout.x(tick)} y={53} textAnchor={i === tickCount - 1 ? 'end' : 'start'} className="timeline-tick">{timelineTime(tick)}</text>
      </g>)}
      <text x={12} y={53} className="timeline-axis-title">Task</text>
      {layout.placed.map(({ activity, y, height }) => <rect key={activity.id} x={0} y={y - 2} width={layout.width} height={height - 4} rx={10} className="timeline-lane-fill" aria-hidden="true" />)}
      {layout.placed.flatMap((target) => (target.activity.depends_on ?? []).map((id) => {
        const source = byId.get(id)
        if (!source) return null
        const x1 = source.x + source.width, y1 = source.barY + 10
        const x2 = target.x, y2 = target.barY + 10
        const mid = x1 + (x2 - x1) / 2
        const active = activeIds?.includes(target.activity.id)
        return <path key={`${id}-${target.activity.id}`} d={`M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`} className={`timeline-dependency${active ? ' is-active' : ''}`} markerEnd={`url(#${markerId})`} data-testid={`timeline-dependency-${id}-${target.activity.id}`}><title>{source.activity.title} must finish before {target.activity.title}</title></path>
      }))}
      {layout.placed.map(({ activity, lane, x, y, width, barY, height, lines }) => {
        const active = activeIds?.includes(activity.id)
        const labelX = x + Math.min(8, width / 2)
        const labelAnchor = labelX > layout.width - right - (compact ? 220 : 190) ? 'end' : 'start'
        return <g key={activity.id} className={`timeline-activity${active ? ' is-active' : ''}`} style={{ '--timeline-accent': `var(--ctp-${lane?.color ?? 'blue'})` } as CSSProperties} {...pick(activity)} {...focus(!!active)}
          role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined}
          aria-label={`${activity.title}: ${timelineTime(activity.start)} to ${timelineTime(activity.start + activity.duration)} ${data.unit}; duration ${timelineTime(activity.duration)} ${data.unit}`}
          aria-pressed={onSelect ? !!active : undefined}
          onClick={onSelect ? () => onSelect(activity.id) : undefined}
          onKeyDown={onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(activity.id) } } : undefined}
          data-testid={`timeline-activity-${activity.id}`}>
          <title>{activity.title}: {timelineTime(activity.start)}–{timelineTime(activity.start + activity.duration)} {data.unit}</title>
          <rect x={0} y={y - 2} width={layout.width} height={height - 4} rx={10} className="timeline-activity-focus" />
          <text x={12} y={y + (compact ? 34 : 30)} className="timeline-activity-name" {...pick(activity, 'title')}>{lines.map((line, i) => <tspan key={i} x={12} dy={i ? (compact ? 32 : 23) : 0}>{line}</tspan>)}</text>
          {lane && <text x={12} y={y + (compact ? 34 : 30) + (lines.length - 1) * (compact ? 32 : 23) + (compact ? 28 : 24)} className="timeline-resource-name" {...pick(lane, 'title')}>{lane.title}</text>}
          {activity.duration === 0
            ? <path d={`M ${x} ${barY} l 10 13 l -10 13 l -10 -13 Z`} className="timeline-milestone" />
            : <rect x={x} y={barY} width={width} height={20} rx={5} className="timeline-bar" />}
          <text x={labelX} y={barY + 38} textAnchor={labelAnchor} className="timeline-activity-time">{timelineTime(activity.start)}–{timelineTime(activity.start + activity.duration)} · {timelineTime(activity.duration)} {data.unit}</text>
        </g>
      })}
      <line x1={left} x2={layout.width - right} y1={64} y2={64} className="timeline-axis-line" />
    </svg>
  </div>
}
