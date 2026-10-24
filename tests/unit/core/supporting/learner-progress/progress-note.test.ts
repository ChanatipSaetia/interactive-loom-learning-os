import { describe, expect, it } from 'vitest'
import { localDate, progressNote, progressNoteMessage, stampEvent, type NewLearnerEvent, type NoteTopic } from '../../../../../src/core/supporting/learner-progress'

const topic: NoteTopic = {
  id: 'chinese101-day1',
  title: 'Chinese 101: Day 1',
  sections: [
    { name: 'intro', title: 'Welcome' },
    { name: 'tones', title: 'The four tones' },
    { name: 'quiz', title: 'Check yourself' },
    { name: 'scenario', title: 'scenario' },
  ],
}

const now = new Date(2026, 9, 24, 18, 0)
const at = (hour: number, event: NewLearnerEvent, day = 24) => stampEvent(event, 'viewer', new Date(2026, 9, day, hour))

describe('progressNote', () => {
  const events = [
    at(9, { topic: 'chinese101-day1', item: 'sections/intro.oui', kind: 'seen' }),
    at(10, { topic: 'chinese101-day1', item: 'sections/quiz.oui#q1', kind: 'answered', result: 'correct' }),
    at(11, { topic: 'chinese101-day1', item: 'sections/quiz.oui#q2', kind: 'answered', result: 'wrong' }),
    at(12, { topic: 'chinese101-day1', item: 'sections/quiz.oui#q2', kind: 'answered', result: 'correct' }),
    at(13, { topic: 'chinese101-day1', item: 'sections/quiz.oui#q3', kind: 'answered', result: 'wrong' }),
    // Another day and another topic stay out
    at(9, { topic: 'chinese101-day1', item: 'sections/tones.oui', kind: 'seen' }, 23),
    at(9, { topic: 'kafka', item: 'sections/intro.oui', kind: 'seen' }),
  ]
  const note = progressNote(topic, events, now)

  it('names the topic and the day in its front matter and its path', () => {
    expect(note.path).toBe('Loom/progress/chinese101-day1-2026-10-24.md')
    expect(note.text).toMatch(/^---\nloom-progress: 1\ntopic: chinese101-day1\ndate: 2026-10-24\n---\n# Loom progress: Chinese 101: Day 1\n/)
    expect(note.empty).toBe(false)
  })

  it('lists the sections played that day and every answer in order', () => {
    expect(note.text).toContain('Played 2 of 4 sections; 2 of 3 questions right in the end.')
    expect(note.text).toContain('- [x] Welcome (`intro`)')
    expect(note.text).toContain('- [ ] The four tones (`tones`)')
    expect(note.text).toContain('- [ ] `scenario`')
    expect(note.text).toContain('- `sections/quiz.oui#q2`: wrong, then right')
  })

  it('puts last-wrong answers and unplayed sections under To review', () => {
    const review = note.text.slice(note.text.indexOf('## To review'))
    expect(review).toContain('- `sections/quiz.oui#q3`: last answer wrong')
    expect(review).toContain('- The four tones (`tones`): not played yet')
    expect(review).not.toContain('q2')
  })

  it('says when nothing was done that day', () => {
    expect(progressNote(topic, [], now).empty).toBe(true)
  })

  it('goes into the chat with what to do with it', () => {
    const message = progressNoteMessage(note)
    expect(message).toContain('`Loom/progress/chinese101-day1-2026-10-24.md`')
    expect(message).toContain('```markdown\n---\nloom-progress: 1')
  })
})

describe('localDate', () => {
  it('uses the learner\'s own calendar day', () => {
    expect(localDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})
