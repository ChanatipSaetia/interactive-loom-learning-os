import { useRef, useEffect, useState, type ComponentType } from 'react'
import { SectionRegistry } from '../../core/registry'

export interface TextSectionProps {
  title?: string
  heading?: string
  paragraphs: string[]
  animate?: boolean
}

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
        {paragraphs.map((p, i) => (
          <p key={i} className="text-paragraph" data-testid={`text-paragraph-${i}`}>
            {renderInline(p)}
          </p>
        ))}
      </div>
    </div>
  )
}

function renderInline(html: string) {
  interface Tag { pos: number; type: string; end: number }
  const nodes: React.ReactNode[] = []
  let remaining = html
  let keyIndex = 0

  while (remaining.length > 0) {
    const codeStart = remaining.indexOf('<code>')
    const codeEnd = remaining.indexOf('</code>')
    const linkStart = remaining.indexOf('<a ')
    const linkClose = remaining.indexOf('</a>')

    const tagCandidates: (Tag | null)[] = [
      codeStart >= 0 ? { pos: codeStart, type: 'code-open', end: codeStart + 6 } : null,
      codeEnd >= 0 ? { pos: codeEnd, type: 'code-close', end: codeEnd + 7 } : null,
      linkStart >= 0 ? { pos: linkStart, type: 'link-open', end: findTagEnd(remaining, linkStart) } : null,
      linkClose >= 0 ? { pos: linkClose, type: 'link-close', end: linkClose + 4 } : null,
    ]
    const tags: Tag[] = tagCandidates.filter((t): t is Tag => t !== null)

    if (tags.length === 0) {
      if (remaining.length > 0) {
        nodes.push(remaining)
      }
      remaining = ''
      continue
    }

    tags.sort((a: Tag, b: Tag) => a.pos - b.pos)
    const first = tags[0]

    if (first.pos > 0) {
      nodes.push(remaining.slice(0, first.pos))
    }

    if (first.type === 'code-open') {
      const rest = remaining.slice(first.end)
      const closeIdx = rest.indexOf('</code>')
      if (closeIdx >= 0) {
        const inner = rest.slice(0, closeIdx)
        nodes.push(
          <code key={keyIndex++} className="text-inline-code" data-testid="text-inline-code">
            {inner}
          </code>
        )
        remaining = rest.slice(closeIdx + 7)
      } else {
        nodes.push('<code>')
        remaining = rest
      }
    } else if (first.type === 'link-open') {
      const linkEnd = findTagEnd(remaining, linkStart)
      const linkTag = remaining.slice(0, linkEnd)
      const afterTag = remaining.slice(linkEnd)
      const closeIdx = afterTag.indexOf('</a>')
      if (closeIdx >= 0) {
        const inner = afterTag.slice(0, closeIdx)
        const href = extractHref(linkTag)
        nodes.push(
          <a
            key={keyIndex++}
            href={href}
            className="text-link"
            data-testid="text-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {inner}
          </a>
        )
        remaining = afterTag.slice(closeIdx + 4)
      } else {
        nodes.push(linkTag)
        remaining = afterTag
      }
    } else {
      nodes.push(remaining.slice(first.pos, first.end))
      remaining = remaining.slice(first.end)
    }
  }

  return nodes
}

function findTagEnd(html: string, start: number): number {
  const close = html.indexOf('>', start)
  return close >= 0 ? close + 1 : html.length
}

function extractHref(tag: string): string {
  const match = tag.match(/href=["']([^"']*)["']/)
  return match ? match[1] : '#'
}

SectionRegistry.register('text', TextSection as ComponentType<unknown>)

export default TextSection
