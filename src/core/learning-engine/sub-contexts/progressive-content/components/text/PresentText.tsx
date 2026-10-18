import { useMemo } from 'react'
import { marked } from 'marked'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { beatMarks, wordsHtml, type PresentRendererProps } from '../../../present-kernel'
import type { TextPresentData } from '../../present'
import '../present.css'

marked.use({ async: false, breaks: true })

/** Text in Present mode: one paragraph per beat, words arriving phrase by phrase (textBeats). */
export default function PresentText({ data, beat }: PresentRendererProps<TextPresentData>) {
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const paragraphs = data.paragraphs
  const html = useMemo(() => (paragraphs ?? []).map((p) => wordsHtml(marked.parse(p) as string)), [paragraphs])

  return (
    <div className="present-text" data-testid="present-text">
      {data.heading && <p className="present-subhead" {...mark(0, { motion: 'words' })}><PresentWords text={data.heading} /></p>}
      {html.map((h, i) => (
        <div
          key={i}
          className="present-paragraph"
          {...mark(i, { motion: 'words', delay: i === 0 && data.heading ? 200 : 0 })}
          {...pick(paragraphs ?? [], i)}
          dangerouslySetInnerHTML={{ __html: h }}
        />
      ))}
    </div>
  )
}
