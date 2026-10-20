import { useInsertionEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Renderer, type ActionEvent } from '@openuidev/react-lang'
import '@openuidev/react-ui/components.css'
import { beatMarks, type PresentRendererProps } from '../../../present-kernel'
import { openuiParts, type OpenUIPresentData } from '../../present'
import { ensureLoomOpenUITheme } from './theme'
import { loomOpenUILibrary } from './themed-charts'
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
 * it. Any other root plays in one beat, each top-level child fading in (decision 78).
 */
export default function PresentOpenUI({ data, beats, beat }: PresentRendererProps<OpenUIPresentData>) {
  const mark = beatMarks(beat)
  const scope = useRef<HTMLDivElement>(null)
  const parts = useMemo(() => (beats.length > 1 ? openuiParts(data.source) : null), [beats.length, data.source])
  useInsertionEffect(() => ensureLoomOpenUITheme(), [])

  // Marks set on the rendered elements before the stage enters the beat (its effects run after ours)
  useLayoutEffect(() => {
    const root = scope.current
    if (!parts || !root) return
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
    els.forEach((el, i) => set(el, { ...mark(i, { motion: 'rise' }), ...(parts[i].name && { ...file, 'data-oui-anchor': parts[i].name }) }))
  })

  const whole = !parts
  return (
    <div className="openui-section present-openui">
      {data.heading && <h4 className="openui-section-heading" {...mark(0, { motion: 'fade' })}>{data.heading}</h4>}
      <div ref={scope} className="loom-openui-scope openui-section-body" {...(whole && mark(0, { motion: 'children' }))}>
        <Renderer response={data.source} library={loomOpenUILibrary} onAction={handleAction} publishObservability={false} />
      </div>
    </div>
  )
}
