import { useId, useState } from 'react'
import { SectionTitleBar } from '../../../../../delivery/web-app-shell/SectionTitleBar'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import type { JourneyStageSelected } from '../../events'
import { journeyMoments, type UserJourneySectionData } from '../../user-journey'
import { JourneyDetail, JourneyGoal, JourneyRail } from './JourneyView'

export interface UserJourneySectionProps {
  title?: string
  section?: UserJourneySectionData
  sectionIndex?: number
  onEvent?: (event: JourneyStageSelected) => void
}
export default function UserJourneySection({ title, section, sectionIndex = 0, onEvent }: UserJourneySectionProps) {
  const [selected, setSelected] = useState(0)
  const pick = usePickAnchors()
  const headingId = useId()
  if (!section?.stages.length) return null
  const index = Math.min(selected, section.stages.length - 1)
  const stage = section.stages[index]
  const select = (next: number) => {
    setSelected(next)
    onEvent?.({ type: 'JourneyStageSelected', stageIndex: next, stageName: section.stages[next].name, timestamp: Date.now() })
  }
  return <div className="user-journey" data-testid="user-journey-section">
    <SectionTitleBar title={title || section.title} sectionIndex={sectionIndex} />
    <JourneyGoal section={section} />
    <JourneyRail section={section} selected={index} onSelect={select} headingId={headingId} />
    <section className="journey-stage" aria-labelledby={headingId} aria-live="polite" {...pick(stage)}>
      <div className="journey-details">{journeyMoments(stage).map((moment) => <JourneyDetail key={moment} stage={stage} moment={moment} />)}</div>
    </section>
    <div className="journey-navigation"><button type="button" disabled={index === 0} onClick={() => select(index - 1)}>Previous stage</button><span>{index + 1} / {section.stages.length}</span><button type="button" disabled={index === section.stages.length - 1} onClick={() => select(index + 1)}>Next stage</button></div>
  </div>
}
