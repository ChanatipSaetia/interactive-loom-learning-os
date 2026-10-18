import { useMemo } from 'react'
import { marked } from 'marked'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { beatMarks, wordsHtml, type PresentRendererProps } from '../../../present-kernel'
import type { TextPresentData } from '../../present'
import './text.css'
import '../present.css'

marked.use({ async: false, breaks: true })

/** The Read text section's markup for a paragraph: inline code and links get its classes. */
const readHtml = (p: string) => (marked.parse(p) as string)
  .replace(/<code([^>]*)>/g, '<code$1 class="text-inline-code">')
  .replace(/<a([^>]*)>/g, '<a$1 class="text-link">')

/** Text in Present mode, styled as the Read section: one paragraph per beat, words arriving phrase by phrase (textBeats). */
export default function PresentText({ data, beat }: PresentRendererProps<TextPresentData>) {
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const paragraphs = data.paragraphs
  const html = useMemo(() => (paragraphs ?? []).map((p) => wordsHtml(readHtml(p))), [paragraphs])

  return (
    <div className="text-section present-text" data-testid="present-text">
      {data.heading && <h4 className="text-section-heading" {...mark(0, { motion: 'words' })}><PresentWords text={data.heading} /></h4>}
      <div className="text-section-content">
        {html.map((h, i) => (
          <div
            key={i}
            className="text-paragraph present-paragraph"
            {...mark(i, { motion: 'words', delay: i === 0 && data.heading ? 200 : 0 })}
            {...pick(paragraphs ?? [], i)}
            dangerouslySetInnerHTML={{ __html: h }}
          />
        ))}
      </div>
    </div>
  )
}
