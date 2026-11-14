import { useMemo } from 'react'
import { marked } from 'marked'
import { usePickAnchors, usePickAnchorScope } from '../../../../../ui-system/pick-anchor'
import { PresentAgenda } from '../../../PresentAgenda'
import { PresentWords } from '../../../PresentWords'
import { leadTerm, textScenes } from '../../text-scenes'
import { beatMarks, focus, QUIET, wordsHtml, type PresentRendererProps } from '../../../present-kernel'
import type { TextPresentData } from '../../present'
import './text.css'
import '../present.css'

marked.use({ async: false, breaks: true })

/** The Read text section's markup for a paragraph: inline code and links get its classes. */
const readHtml = (p: string) => (marked.parse(p) as string)
  .replace(/<code([^>]*)>/g, '<code$1 class="text-inline-code">')
  .replace(/<a([^>]*)>/g, '<a$1 class="text-link">')

export { leadTerm } from '../../text-scenes'

/**
 * Text in Present mode keeps the whole paragraph visible and highlights the passage being narrated.
 * Existing short narration beats still advance phrase by phrase without hiding the surrounding text. A paragraph that opens
 * with a bold term shows the term as its headline; when every paragraph does, an agenda of the terms
 * shows where the section is (decision 111).
 */
export default function PresentText({ data, beat, paragraphAnchors }: PresentRendererProps<TextPresentData> & { paragraphAnchors?: string[] }) {
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const pickScope = usePickAnchorScope()
  const paragraphs = data.paragraphs
  const terms = useMemo(() => (paragraphs ?? []).map(leadTerm), [paragraphs])
  const parts = useMemo(() => {
    const scenes = textScenes(data)
    return scenes.map((scene) => ({
      ...scene,
      term: terms[scene.paragraph]?.term,
      // Keep the complete paragraph visible while only the current passage is narrated.
      // Existing pN / pN.partK beats and authored narration remain unchanged.
      html: scenes.filter((part) => part.paragraph === scene.paragraph).map((part) => {
        const { term, rest } = leadTerm(part.source)
        const html = readHtml(part.part === 0 && term ? rest : part.source)
        const current = part.part === scene.part
        return `<div class="present-text-fragment${current ? ' is-current' : ''}"${current ? '' : ' data-quiet'}>${current ? wordsHtml(html) : html}</div>`
      }).join(' '),
    }))
  }, [data, terms])
  const agenda = terms.length > 1 && terms.every((p) => p.term)
  // The region header already shows the section title
  const heading = data.heading && data.heading !== data.title ? data.heading : undefined

  const scenes = (
    <div className="present-scenes present-text-scenes">
      {parts.map((p, i) => (
        <div key={i} className="present-text-scene" {...mark(i, { motion: 'fade', until: i })} {...(paragraphAnchors ? { 'data-oui-anchor': paragraphAnchors[p.paragraph], 'data-oui-file': pickScope?.file, 'data-oui-section': pickScope?.label } : pick(paragraphs ?? [], p.paragraph))}>
          {p.total > 1 && <p className="present-eyebrow" {...QUIET}>Part {p.part + 1} of {p.total}</p>}
          {p.term && <p className="present-headline" {...mark(i, { motion: 'zoom' })} {...focus(p.part === 0 && beat === i)} {...(p.part > 0 ? QUIET : {})}>{p.term}</p>}
          <div
            className="text-paragraph present-paragraph"
            {...mark(i, { motion: 'words', delay: p.term ? 450 : i === 0 && heading ? 200 : 0 })}
            {...focus((!p.term || p.part > 0) && beat === i)}
            dangerouslySetInnerHTML={{ __html: p.html }}
          />
        </div>
      ))}
    </div>
  )

  return (
    <div className="text-section present-text" data-testid="present-text">
      {heading && <h4 className="text-section-heading" {...mark(0, { motion: 'words' })}><PresentWords text={heading} /></h4>}
      {agenda
        ? <div className="present-with-agenda"><PresentAgenda items={terms.map((p) => p.term)} current={parts[beat]?.paragraph ?? -1} label="Parts" />{scenes}</div>
        : scenes}
    </div>
  )
}
