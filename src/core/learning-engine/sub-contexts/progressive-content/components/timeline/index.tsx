import { useState } from 'react'
import { SectionTitleBar } from '../../../../../delivery/web-app-shell/SectionTitleBar'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import type { TimelineSectionData } from '../../timeline'
import type { TimelineActivitySelected } from '../../events'
import { layoutTimeline, timelineTime } from '../../timeline-layout'
import { TimelineDiagram } from './TimelineDiagram'

export interface TimelineSectionProps {
  title?: string
  section?: TimelineSectionData
  sectionIndex?: number
  onEvent?: (event: TimelineActivitySelected) => void
}

export default function TimelineSection({ title, section, sectionIndex = 0, onEvent }: TimelineSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const pick = usePickAnchors()
  if (!section) return null
  const selected = section.activities.find((a) => a.id === selectedId)
  const select = (id: string) => {
    setSelectedId((current) => current === id ? null : id)
    onEvent?.({ type: 'TimelineActivitySelected', activityId: id, timestamp: Date.now() })
  }
  const end = layoutTimeline(section).end
  return <div className="timeline-section" data-testid="timeline-section">
    <SectionTitleBar title={title || section.title} sectionIndex={sectionIndex} titleTestId="timeline-title" />
    {section.description && <p className="timeline-description" {...pick(section, 'description')}>{section.description}</p>}
    <div className="timeline-summary-line"><span>Total elapsed <strong>{timelineTime(end)} {section.unit}</strong></span><span>Shared time scale · overlapping bars run together</span></div>
    <TimelineDiagram data={section} activeIds={selected ? [selected.id] : undefined} onSelect={select} />
    <p className="timeline-hint">Select a task for details. Arrows mean “must finish before”.</p>
    {selected && <div className="timeline-details" aria-live="polite" {...pick(selected)}>
      <h3>{selected.title}</h3>
      {selected.description && <p {...pick(selected, 'description')}>{selected.description}</p>}
      <p>{timelineTime(selected.start)}–{timelineTime(selected.start + selected.duration)} {section.unit} · duration {timelineTime(selected.duration)} {section.unit}</p>
      {!!selected.depends_on?.length && <p>Waits for: {selected.depends_on.map((id) => <button key={id} type="button" onClick={() => select(id)}>{section.activities.find((a) => a.id === id)?.title}</button>)}</p>}
    </div>}
    {section.takeaway && <p className="timeline-takeaway" {...pick(section, 'takeaway')}>{section.takeaway}</p>}
  </div>
}
