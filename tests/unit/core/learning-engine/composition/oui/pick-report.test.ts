import { describe, it, expect } from 'vitest'
import { formatPickPointer, pickReport } from '../../../../../../src/core/learning-engine/composition/oui/pick-report'

const q2 = { topicId: 'kafka', file: 'sections/quiz-basics.oui', anchor: 'q2.explanation', line: 14, note: '' }
const q5 = { topicId: 'kafka', file: 'sections/quiz-basics.oui', anchor: 'q5', line: 22, note: '' }

describe('Pick report', () => {
  it('formats a pointer with its line hint and notes', () => {
    expect(formatPickPointer(q2)).toBe('kafka/sections/quiz-basics.oui:14 #q2.explanation')
    expect(formatPickPointer({ ...q2, line: undefined, unsaved: true }, { kind: 'archive', name: 'kafka.loom.oui' }))
      .toBe('kafka/sections/quiz-basics.oui #q2.explanation (unsaved) (in kafka.loom.oui)')
    expect(formatPickPointer(q5, { kind: 'text' })).toBe('kafka/sections/quiz-basics.oui:22 #q5 (from pasted text)')
    expect(formatPickPointer(q5, { kind: 'folder' })).toBe('kafka/sections/quiz-basics.oui:22 #q5')
  })

  it('copies bare pointer lines when every entry is a mention', () => {
    expect(pickReport({ topicId: 'kafka', entries: [q2, q5] }))
      .toBe('kafka/sections/quiz-basics.oui:14 #q2.explanation\nkafka/sections/quiz-basics.oui:22 #q5\n')
    expect(pickReport({ topicId: 'kafka', entries: [] })).toBe('')
  })

  it('lists comments under their pointers', () => {
    const report = pickReport({ topicId: 'kafka', entries: [{ ...q2, note: 'Too long.\nOne sentence.' }, q5] })
    expect(report).toBe(
      'Comments on the Loom topic "kafka":\n'
      + '- kafka/sections/quiz-basics.oui:14 #q2.explanation\n  Too long.\n  One sentence.\n'
      + '- kafka/sections/quiz-basics.oui:22 #q5\n',
    )
  })

  it('asks a question without changing files', () => {
    const report = pickReport({ topicId: 'kafka', entries: [q2, q5], question: ' Why do these differ? ' })
    expect(report).toBe(
      'Answer about the Loom topic "kafka" (do not change any files):\n'
      + '- kafka/sections/quiz-basics.oui:14 #q2.explanation\n'
      + '- kafka/sections/quiz-basics.oui:22 #q5\n\nWhy do these differ?\n',
    )
    // An empty question falls back to comments/mentions.
    expect(pickReport({ topicId: 'kafka', entries: [q5], question: '  ' })).toBe('kafka/sections/quiz-basics.oui:22 #q5\n')
  })
})
