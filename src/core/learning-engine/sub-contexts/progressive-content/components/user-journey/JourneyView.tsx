import { useRef } from 'react'
import { Target, Hand, MessageCircle, TriangleAlert, Flag, LifeBuoy, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { JOURNEY_LABELS, type JourneyMoment, type JourneyStageData, type UserJourneySectionData } from '../../user-journey'
import './user-journey.css'

/** The overall purpose stays separate from the current stage's smaller goal. */
export function JourneyGoal({ section }: { section: UserJourneySectionData }) {
  const pick = usePickAnchors()
  return <section className="journey-goal-banner" aria-label="Overall journey goal">
    <p className="journey-goal-label"><Target size={18} aria-hidden="true" /><span {...pick(section, 'person')}>{section.person}</span><span aria-hidden="true">·</span><span>Overall goal</span></p>
    <h3 className="journey-goal-statement" {...pick(section, 'goal')}>{section.goal}</h3>
  </section>
}

export function JourneyRail({ section, selected, onSelect, headingId }: { section: UserJourneySectionData; selected?: number; onSelect?: (index: number) => void; headingId?: string }) {
  const pick = usePickAnchors()
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  if (selected === undefined || !section.stages[selected]) return null
  const stage = section.stages[selected]
  const move = (offset: number) => {
    const next = selected + offset
    if (next >= 0 && next < section.stages.length) onSelect?.(next)
  }
  return <div className="journey-selector">
    <nav className="journey-slider" aria-label="Journey stages" tabIndex={onSelect ? 0 : undefined}
      onKeyDown={(e) => { if (!onSelect || e.target !== e.currentTarget) return; if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1) } }}
      onTouchStart={(e) => { const touch = e.touches[0]; touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null }}
      onTouchEnd={(e) => { const start = touchStart.current; touchStart.current = null; if (start === null) return; const end = e.changedTouches[0]; if (!end) return; const delta = end.clientX - start.x; if (Math.abs(delta) > 45 && Math.abs(delta) > Math.abs(end.clientY - start.y)) { if (e.cancelable) e.preventDefault(); move(delta > 0 ? -1 : 1) } }}>
    <h3 id={headingId} className="journey-current-stage" aria-current="step" {...pick(stage, 'name')}><span>{selected + 1}.</span> {stage.name}</h3>
      {[-1, 1].map((offset) => {
        const index = selected + offset
        const neighbor = section.stages[index]
        if (!neighbor) return <span key={offset} className={`journey-slide-empty journey-slide-empty--${offset < 0 ? 'previous' : 'next'}`} aria-hidden="true" />
        return <button key={offset} type="button" className={`journey-slide journey-slide--${offset < 0 ? 'previous' : 'next'}`} disabled={!onSelect}
          onClick={() => move(offset)} aria-label={`${offset < 0 ? 'Previous' : 'Next'} stage: ${neighbor.name}`} {...pick(neighbor, 'name')}>
          {offset < 0 && <ChevronLeft size={18} aria-hidden="true" />}
          <span><small>{offset < 0 ? 'Previous' : 'Next'}</small><span className="journey-slide-name">{neighbor.name}</span></span>
          {offset > 0 && <ChevronRight size={18} aria-hidden="true" />}
        </button>
      })}
    </nav>
  </div>
}

const MOMENT_ICONS = { goal: Target, action: Hand, response: MessageCircle, friction: TriangleAlert, outcome: Flag }

export function JourneyDetail({ stage, moment }: { stage: JourneyStageData; moment: JourneyMoment }) {
  const pick = usePickAnchors()
  const Icon = MOMENT_ICONS[moment]
  const text = stage[moment]
  if (!text) return null
  return <div className={`journey-detail journey-detail--${moment}`} {...pick(stage, moment)}>
    <h4><Icon aria-hidden="true" size={17} strokeWidth={1.8} /><span>{JOURNEY_LABELS[moment]}</span></h4><p>{text}</p>
    {moment === 'friction' && stage.recovery && <div className="journey-recovery" {...pick(stage, 'recovery')}><h4><LifeBuoy aria-hidden="true" size={17} strokeWidth={1.8} /><span>Recovery</span></h4><p>{stage.recovery}</p></div>}
  </div>
}
