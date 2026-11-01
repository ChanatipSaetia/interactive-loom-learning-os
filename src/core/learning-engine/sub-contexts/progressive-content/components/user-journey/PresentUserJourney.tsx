import { useLayoutEffect, useRef } from 'react'
import { beatMarks, focus, QUIET, type PresentRendererProps } from '../../../present-kernel'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { journeyPages, journeyScenes, type UserJourneySectionData } from '../../user-journey'
import { JourneyDetail, JourneyGoal, JourneyRail } from './JourneyView'

export type UserJourneyPresentData = { section?: UserJourneySectionData }
export default function PresentUserJourney({ data, beat, onBeatChange }: PresentRendererProps<UserJourneyPresentData>) {
  const pick = usePickAnchors()
  const section = data.section
  const momentsRef = useRef<HTMLDivElement>(null)
  // Keep typography stable between beats; scroll longer content into view instead of shrinking it.
  useLayoutEffect(() => {
    const scroller = momentsRef.current
    if (!scroller) return
    let live = true
    const fit = () => {
      if (!live || !scroller.clientHeight || !scroller.clientWidth) return
      const active = scroller.querySelector<HTMLElement>('[data-focus]')
      if (!active || scroller.scrollHeight <= scroller.clientHeight) return
      const top = active.offsetTop
      if (top < scroller.scrollTop || top + active.offsetHeight > scroller.scrollTop + scroller.clientHeight) {
        const next = top < scroller.scrollTop ? top - 12 : Math.min(top - 12, top + active.offsetHeight + 12 - scroller.clientHeight)
        scroller.scrollTo({ top: Math.max(0, next), behavior: 'auto' })
      }
    }
    fit()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit)
    observer?.observe(scroller)
    void document.fonts?.ready.then(fit)
    return () => { live = false; observer?.disconnect() }
  }, [beat, section])
  if (!section) return null
  const scenes = journeyScenes(section)
  const scene = beat > 0 ? scenes[beat - 1] : undefined
  const stage = scene ? section.stages[scene.stage] : undefined
  const pages = journeyPages(section)
  const page = pages.find((p) => p.scenes.includes(beat - 1))
  const stagePages = pages.filter((p) => p.stage === scene?.stage)
  const pageIndex = page ? stagePages.indexOf(page) : 0
  const mark = beatMarks(beat)
  return <div className="user-journey present-user-journey" data-testid="present-user-journey">
    <div {...(beat === 0 ? mark(0, { motion: 'fade' }) : QUIET)}><JourneyGoal section={section} /><div {...QUIET}><JourneyRail section={section} selected={scene?.stage} onSelect={onBeatChange ? (index) => { const target = scenes.findIndex((s) => s.stage === index); if (target >= 0) onBeatChange(target + 1) } : undefined} /></div></div>
    {scene && page && <p className="journey-page-count" {...QUIET}>Page {pageIndex + 1} of {stagePages.length}</p>}
    {scene && stage && page ? <section key={`${scene.stage}:${pageIndex}`} className="journey-stage journey-step-page" data-journey-page={`${scene.stage}:${pageIndex}`} {...pick(stage)}>
      <div className="journey-step-moments" ref={momentsRef}><div className="journey-page-content">
        {scenes.flatMap((item, index) => page.scenes.includes(index) && index < beat ? [
          <div key={item.id} className="journey-beat" {...mark(index + 1, { motion: 'fade' })} {...focus(index + 1 === beat)}>
            <JourneyDetail stage={stage} moment={item.moment} />
          </div>,
        ] : [])}
      </div></div>
    </section> : <div className="journey-stage journey-path" {...mark(0, { motion: 'fade' })} {...focus(true)}>
      <h3>The path to that goal</h3>
      <p>{section.stages.length} stages · follow what {section.person} does and what happens in response.</p>
      <ol aria-label="Journey path">{section.stages.map((item, index) => <li key={index}>{item.name}</li>)}</ol>
    </div>}
  </div>
}
