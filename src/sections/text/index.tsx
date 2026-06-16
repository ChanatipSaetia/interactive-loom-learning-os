import { useMemo, useRef, useEffect, useState } from 'react'
import { marked } from 'marked'
import './text.css'

export interface TextSectionProps {
  title?: string
  heading?: string
  paragraphs: string[]
  animate?: boolean
}

// Configure marked: no wrapping <p> for single-line inline strings,
// but full block rendering for multi-line markdown.
marked.use({ async: false, breaks: true })

function TextSection({ title, heading, paragraphs, animate = false }: TextSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(!animate)

  useEffect(() => {
    if (animate && !visible) {
      const el = containerRef.current
      if (!el) return
      el.style.opacity = '0'
      el.style.transform = 'translateY(16px)'
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease'
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
        setVisible(true)
        setTimeout(() => {
          el.style.transition = ''
        }, 450)
      })
    }
  }, [animate, visible])

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

  return (
    <div
      ref={containerRef}
      className="text-section"
      data-testid="text-section"
    >
      {title && (
        <h3 className="text-section-title" data-testid="text-title">
          {title}
        </h3>
      )}

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
    </div>
  )
}

export default TextSection
