import { describe, expect, it } from 'vitest'
import { pickQuestion, quoteOf } from '../../../src/mcp-app/ask'

const entry = (anchor: string, note = '') => ({ file: 'sections/quiz.oui', anchor, label: `Check yourself › ${anchor}`, section: 'Check yourself', note, stale: false })

describe('pickQuestion', () => {
  const topic = { id: 'chinese101-day1', title: 'Chinese 101' }

  it('names each picked place with its pointer and the words on screen, then the question', () => {
    const text = pickQuestion(topic, { mode: 'comment', message: 'Why is B right?', entries: [entry('q2', 'I picked A')] }, () => '  What does   谢谢 mean? \n A  Hello  B Thank you ')
    expect(text).toBe([
      'About this part of the Loom topic "Chinese 101":',
      '',
      '- Check yourself › q2 (`chinese101-day1/sections/quiz.oui #q2`)',
      '  > What does 谢谢 mean? A Hello B Thank you',
      '  My note: I picked A',
      '',
      'Why is B right?',
    ].join('\n'))
  })

  it('asks for an explanation when the learner types nothing, and reads a whole section as such', () => {
    const text = pickQuestion(topic, { mode: 'comment', message: '', entries: [entry('root'), entry('q1')] }, () => '')
    expect(text).toContain('- Check yourself › whole section (`chinese101-day1/sections/quiz.oui #root`)')
    expect(text.endsWith('Can you explain these?')).toBe(true)
    expect(text).not.toContain('>')
  })

  it('sends a plain question when nothing is picked', () => {
    expect(pickQuestion(topic, { mode: 'comment', message: ' What next? ', entries: [] }, () => '')).toBe('What next?')
  })

  it('keeps quotes short', () => {
    expect(quoteOf('x'.repeat(1000))).toHaveLength(400)
  })
})
