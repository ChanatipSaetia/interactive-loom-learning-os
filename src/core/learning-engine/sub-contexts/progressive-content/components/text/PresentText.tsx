import { useMemo } from 'react'
import { marked } from 'marked'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
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
 * Text in Present mode, styled as the Read section: short prose scenes (textBeats), each replacing
 * the last at presentation size, its words arriving phrase by phrase (decision 109). A paragraph that opens
 * with a bold term shows the term as its headline; when every paragraph does, an agenda of the terms
 * shows where the section is (decision 111).
 */
export default function PresentText({ data, beat }: PresentRendererProps<TextPresentData>) {
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const paragraphs = data.paragraphs
  const terms = useMemo(() => (paragraphs ?? []).map(leadTerm), [paragraphs])
  const parts = useMemo(() => textScenes(data).map((scene) => {
    const { term, rest } = leadTerm(scene.source)
    return { ...scene, term: terms[scene.paragraph]?.term, html: wordsHtml(readHtml(scene.part === 0 && term ? rest : scene.source)) }
  }), [data, terms])
  const agenda = terms.length > 1 && terms.every((p) => p.term)
  // The region header already shows the section title
  const heading = data.heading && data.heading !== data.title ? data.heading : undefined

  const scenes = (
    <div className="present-scenes present-text-scenes">
      {parts.map((p, i) => (
        <div key={i} className="present-text-scene" {...mark(i, { motion: 'fade', until: i })} {...pick(paragraphs ?? [], p.paragraph)}>
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
