import { useMemo } from 'react'
import { marked } from 'marked'
import { ScrollReveal } from '../../../../../ui-system/motion/scroll-reveal'
import { SectionTitleBar } from '../../../../../delivery/web-app-shell/SectionTitleBar'
import { TextHelpModal } from './TextHelpModal'
import './text.css'

import type { SectionResultProps } from '../../../types'

export interface TextSectionProps extends SectionResultProps<{ read: boolean; paragraphCount: number }> {
  title?: string
  heading?: string
  paragraphs: string[]
  animate?: boolean
  sectionIndex?: number
  sectionId?: string
}

marked.use({ async: false, breaks: true })

function TextSection({
  title,
  heading,
  paragraphs,
  animate = false,
  sectionIndex = 0,
  sectionId = 'text',
  onResultChange,
}: TextSectionProps) {
  const renderedParagraphs = useMemo(
    () =>
      paragraphs.map((p) => {
        let html = marked.parse(p) as string
        html = html.replace(
          /<code([^>]*)>/g,
          '<code$1 data-testid="text-inline-code" class="text-inline-code">',
        )
        html = html.replace(
          /<a([^>]*)>/g,
          '<a$1 data-testid="text-link" class="text-link">',
        )
        return html
      }),
    [paragraphs],
  )

  useMemo(() => {
    onResultChange?.({
      sectionId,
      sectionType: 'text',
      status: 'completed',
      score: 100,
      accuracy: 1.0,
      completedAt: Date.now(),
      payload: { read: true, paragraphCount: paragraphs.length },
    })
  }, [paragraphs.length, onResultChange, sectionId])

  const content = (
    <>
      <SectionTitleBar
        title={title}
        sectionIndex={sectionIndex}
        HelpModal={TextHelpModal}
        titleTestId="text-title"
      />

      {heading && (
        <h4 className="text-section-heading" data-testid="text-heading">
          {heading}
        </h4>
      )}

      <div className="text-section-content" data-testid="text-content">
        {renderedParagraphs.map((html, i) => (
          <div
            key={i}
            className="text-paragraph"
            data-testid={`text-paragraph-${i}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ))}
      </div>
    </>
  )

  return (
    <div className="text-section" data-testid="text-section">
      {animate ? (
        <ScrollReveal>{content}</ScrollReveal>
      ) : (
        content
      )}
    </div>
  )
}

export default TextSection
