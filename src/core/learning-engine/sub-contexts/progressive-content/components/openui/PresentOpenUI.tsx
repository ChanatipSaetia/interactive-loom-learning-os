import { ReferenceLinks } from '../../../../../ui-system/primitives/reference-links'
import PresentText from '../text/PresentText'
import { proseAnchors, proseBlocks, proseRootAlias } from '../../../../composition/oui/page-prose'
import { parseOUIElements } from '../../../../composition/oui/compile'
import { lazy, Suspense, useEffect, useInsertionEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Renderer, type ActionEvent } from '@openuidev/react-lang'
import '@openuidev/react-ui/components.css'
import { beatMarks, type PresentRendererProps } from '../../../present-kernel'
import { openuiParts, type OpenUIPresentData } from '../../present'
import { ensureLoomOpenUITheme } from './theme'
import { tagDataAnchors } from './data-anchors'
import { createLoomReactLibrary } from '../../../../composition/oui/react'
import { pageActivityPlan, type PageActivity } from '../../../../composition/oui/page-activities'
import { CORE_PRESENTERS } from '../../../../registry/register-core-presenters'
import './openui.css'
import '../present.css'

function handleAction(event: ActionEvent) {
  if (event.type === 'open_url' && typeof event.params.url === 'string') {
    window.open(event.params.url, '_blank', 'noopener,noreferrer')
  }
}

/** The rendered elements of the root's children: past single wrappers (the root Card or Stack), as the `children` motion steps in. */
function partElements(scope: HTMLElement): HTMLElement[] {
  let parent: Element = scope
  for (let depth = 0; depth < 3 && parent.children.length === 1; depth++) parent = parent.children[0]
  return Array.from(parent.children) as HTMLElement[]
}

/**
 * Standard OpenUI section in Present mode. A `Card` or `Stack` root with several children plays
 * them one per beat (`partN`, decision 116): the program renders whole, as in Read, and each child's
 * element gets its beat mark and, when it is a statement, its Pick anchor, so narration can point at
 * it, down to one bar, point, slice or table cell (decision 117). Any other root plays in one beat,
 * each top-level child fading in (decision 78).
 */
function ActivityScene({ activity, beat, sectionIndex, active }: { activity: PageActivity; beat: number; sectionIndex: number; active: boolean }) {
  const presenter = CORE_PRESENTERS[activity.config.type]
  const Component = useMemo(() => presenter ? lazy(presenter.load) : null, [presenter])
  if (!Component) return null
  const local = Math.max(-1, Math.min(beat - activity.start, activity.beats.length - 1))
  return <Suspense fallback={null}><Component data={activity.config.props} beats={activity.beats} beat={local}
    sectionIndex={sectionIndex} active={active && beat >= activity.start && beat < activity.start + activity.beats.length} /></Suspense>
}

export default function PresentOpenUI({ data, beats, beat, sectionIndex, active }: PresentRendererProps<OpenUIPresentData>) {
  const mark = beatMarks(beat)
  const scope = useRef<HTMLDivElement>(null)
  const parts = useMemo(() => (beats.length > 1 ? openuiParts(data.source) : null), [beats.length, data.source])
  const activityPlan = useMemo(() => pageActivityPlan(data.source), [data.source])
  const proseRoot = useMemo(() => parseOUIElements(data.source), [data.source])
  const prose = proseRoot && proseBlocks(proseRoot)
  const library = useMemo(() => createLoomReactLibrary((config, statementId) => {
    const activity = activityPlan.activities.find((entry) => entry.config.type === config.type && (!statementId || entry.statementId === statementId))
    return activity ? <ActivityScene activity={{ ...activity, config }} beat={beat} sectionIndex={sectionIndex} active={active} /> : null
  }), [activityPlan, beat, sectionIndex, active])
  useInsertionEffect(() => ensureLoomOpenUITheme(), [])

  // Marks set on the rendered elements before the stage enters the beat (its effects run after ours)
  useLayoutEffect(() => {
    const root = scope.current
    if (!root) return
    // Upstream inserts anonymous wrappers. Identify a single enclosing Card by
    // its content rather than assuming it is a direct child of the scope.
    const cards = [...root.querySelectorAll<HTMLElement>('.openui-card-card')]
    cards.forEach((card) => card.classList.remove('present-openui-shell'))
    const outer = cards.filter((card) => !card.parentElement?.closest('.openui-card-card'))
    if (outer.length === 1 && outer[0].textContent?.trim() === root.textContent?.trim()) outer[0].classList.add('present-openui-shell')
    if (!parts) return
    const set = (el: HTMLElement, attrs: Record<string, string | number | undefined>) => {
      el.toggleAttribute('data-shown', 'data-shown' in attrs)
      for (const [k, v] of Object.entries(attrs)) if (k !== 'data-shown' && v !== undefined) el.setAttribute(k, String(v))
    }
    const els = partElements(root)
    // A program whose elements do not line up with its children plays whole on the first beat
    if (els.length !== parts.length) return set(root, mark(0, { motion: 'children' }))
    // Pick anchors carry the section's file and label, as the stage's own anchors do
    const owner = root.closest('[data-oui-file]')
    const file = owner && { 'data-oui-file': owner.getAttribute('data-oui-file') ?? undefined, 'data-oui-section': owner.getAttribute('data-oui-section') ?? undefined }
    els.forEach((el, i) => set(el, { ...mark(activityPlan.activities.length ? activityPlan.starts[i] : i, { motion: 'rise' }), ...(parts[i].name && { ...file, 'data-oui-anchor': parts[i].name }) }))
  })

  // Charts draw once they are measured, so their bars, points and cells are tagged as they appear (decision 117)
  useEffect(() => {
    const root = scope.current
    if (!parts || !root) return
    let frame = 0
    const tagAll = () => {
      frame = 0
      const els = partElements(root)
      if (els.length === parts.length) els.forEach((el, i) => parts[i].name && tagDataAnchors(el, parts[i].name))
    }
    tagAll()
    const observer = new MutationObserver(() => { frame ||= requestAnimationFrame(tagAll) })
    observer.observe(root, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [parts])

  if (prose) return <PresentText data={{ ...data, paragraphs: prose.map((block) => String(block.props.text)) }} beats={beats} beat={beat} sectionIndex={sectionIndex} active={active}
    paragraphAnchors={proseAnchors(proseRoot!, true, proseRootAlias(data.source))} />

  const whole = !parts
  return (
    <div className="openui-section present-openui">
      <ReferenceLinks scope={scope} contentKey={data.source} />
      {data.heading && <h4 className="openui-section-heading" {...mark(0, { motion: 'fade' })}>{data.heading}</h4>}
      <div ref={scope} className="loom-openui-scope openui-section-body" {...(whole && mark(0, { motion: 'children' }))}>
        <Renderer response={data.source} library={library} onAction={handleAction} publishObservability={false} />
      </div>
    </div>
  )
}
