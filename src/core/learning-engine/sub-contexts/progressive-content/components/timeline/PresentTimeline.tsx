import { beatMarks, focus, QUIET, type PresentRendererProps } from '../../../present-kernel'
import type { TimelinePresentData } from '../../present'
import { layoutTimeline, timelineGroups, timelineTime } from '../../timeline-layout'
import { TimelineDiagram } from './TimelineDiagram'
import type { TimelineSectionData } from '../../timeline'
import '../present.css'

/** A passive context map; no duplicate Pick/narration targets in the stage detail. */
function TimelineContext({ section, activeIds }: { section: TimelineSectionData; activeIds: string[] }) {
  const layout = layoutTimeline(section)
  return <div className="timeline-context" data-testid="timeline-context" {...QUIET}>
    <div><span>Whole schedule · {section.activities.length} tasks</span><span>0–{timelineTime(layout.end)} {section.unit}</span></div>
    <svg viewBox={`0 64 ${layout.width} ${layout.height - 64}`} preserveAspectRatio="none" aria-hidden="true">
      {layout.placed.map(({ activity, x, barY, width }) => {
        const lane = section.lanes.find((l) => l.id === activity.lane)
        const selected = activeIds.includes(activity.id)
        return <rect key={activity.id} x={x} y={barY} width={width || 2} height={20} rx={3} fill={`var(--ctp-${lane?.color ?? 'blue'})`} opacity={selected ? 1 : .35} stroke={selected ? 'var(--foreground)' : 'none'} strokeWidth={selected ? 1 : 0} vectorEffect="non-scaling-stroke" />
      })}
    </svg>
  </div>
}

/** Time is spatial, not animation speed: all activities remain visible on every beat. */
export default function PresentTimeline({ data, beat }: PresentRendererProps<TimelinePresentData>) {
  const section = data.section
  if (!section) return null
  const mark = beatMarks(beat)
  const groups = timelineGroups(section)
  const group = beat > 0 && beat <= groups.length ? groups[beat - 1] : undefined
  const summary = beat === groups.length + 1
  const layout = layoutTimeline(section)
  const end = layout.end
  const detail = !!group && (section.activities.length > 10 || layout.height > 650)
  const activities = detail ? section.activities.filter((a) => group.activities.includes(a.id)) : section.activities
  const visibleLanes = new Set(activities.map((a) => a.lane))
  const diagram = detail ? { ...section, activities, lanes: section.lanes.filter((l) => visibleLanes.has(l.id)) } : section
  const externalDependencies = detail ? [...new Set(activities.flatMap((a) => a.depends_on ?? []).filter((id) => !group.activities.includes(id)))] : []
  return <div className="present-timeline timeline-section" data-testid="present-timeline">
    <div className="timeline-summary-line" {...QUIET}><span>Total elapsed <strong>{timelineTime(end)} {section.unit}</strong></span><span>All tasks share the same time scale</span></div>
    <div className="timeline-diagram-frame" {...mark(0, { motion: 'fade' })} {...QUIET}><TimelineDiagram data={diagram} activeIds={group?.activities} fit endTime={end} /></div>
    {detail && <TimelineContext section={section} activeIds={group.activities} />}
    <div className="timeline-scene-caption" {...mark(beat, { motion: 'fade', until: beat })} {...focus(true)}>
      {group ? <><h3>{group.title}</h3>{group.description && <p>{group.description}</p>}{externalDependencies.length > 0 && <p className="timeline-waits">Waits for earlier work: {externalDependencies.map((id) => section.activities.find((a) => a.id === id)?.title).join(', ')}</p>}</> : summary ? <p>{section.takeaway || section.title}</p> : <p>{section.description || section.title}</p>}
    </div>
  </div>
}
