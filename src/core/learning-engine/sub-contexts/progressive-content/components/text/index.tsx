import { useMemo } from 'react'
import { marked } from 'marked'
import { ScrollReveal } from '../../../../../ui-system/motion/scroll-reveal'
import { SectionTitleBar } from '../../../../../delivery/web-app-shell/SectionTitleBar'
import { TextHelpModal } from './TextHelpModal'
import './text.css'

export interface TextSectionProps {
  title?: string
  heading?: string
  paragraphs: string[]
  animate?: boolean
  sectionIndex?: number
}

marked.use({ async: false, breaks: true })

function TextSection({ title, heading, paragraphs, animate = false, sectionIndex = 0 }: TextSectionProps) {
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
