import { useMemo } from 'react'
import { marked } from 'marked'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentAgenda } from '../../../PresentAgenda'
import { PresentWords } from '../../../PresentWords'
import { beatMarks, focus, wordsHtml, type PresentRendererProps } from '../../../present-kernel'
import type { TextPresentData } from '../../present'
import './text.css'
import '../present.css'

marked.use({ async: false, breaks: true })

/** The Read text section's markup for a paragraph: inline code and links get its classes. */
const readHtml = (p: string) => (marked.parse(p) as string)
  .replace(/<code([^>]*)>/g, '<code$1 class="text-inline-code">')
  .replace(/<a([^>]*)>/g, '<a$1 class="text-link">')

/** A paragraph that opens with a bold term (`**Pipelines** — …`): the term, and the rest of the paragraph. */
export function leadTerm(paragraph: string): { term?: string; rest: string } {
  const m = paragraph.match(/^\s*\*\*([^*]{1,60})\*\*\s*(?:[—–:-]\s*)?/)
  return m ? { term: m[1].trim(), rest: paragraph.slice(m[0].length) } : { rest: paragraph }
}

/**
 * Text in Present mode, styled as the Read section: one paragraph per beat (textBeats), each replacing
 * the last at reading size, its words arriving phrase by phrase (decision 109). A paragraph that opens
 * with a bold term shows the term as its headline; when every paragraph does, an agenda of the terms
 * shows where the section is (decision 111).
 */
export default function PresentText({ data, beat }: PresentRendererProps<TextPresentData>) {
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const paragraphs = data.paragraphs
  const parts = useMemo(() => (paragraphs ?? []).map((p) => {
    const { term, rest } = leadTerm(p)
    return { term, html: wordsHtml(readHtml(rest)) }
  }), [paragraphs])
  const last = parts.length - 1
  const agenda = parts.length > 1 && parts.every((p) => p.term)
  // The region header already shows the section title
  const heading = data.heading && data.heading !== data.title ? data.heading : undefined

  const scenes = (
    <div className="present-scenes present-text-scenes">
      {parts.map((p, i) => (
        <div key={i} className="present-text-scene" {...mark(i, { motion: 'fade', ...(i < last && { until: i }) })} {...pick(paragraphs ?? [], i)}>
          {p.term && <p className="present-headline" {...mark(i, { motion: 'zoom' })} {...focus(beat === i)}>{p.term}</p>}
          <div
            className="text-paragraph present-paragraph"
            {...mark(i, { motion: 'words', delay: p.term ? 450 : i === 0 && heading ? 200 : 0 })}
            {...focus(!p.term && beat === i)}
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
        ? <div className="present-with-agenda"><PresentAgenda items={parts.map((p) => p.term)} current={beat} label="Parts" />{scenes}</div>
        : scenes}
    </div>
  )
}
