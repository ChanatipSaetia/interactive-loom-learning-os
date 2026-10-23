import { describe, expect, it } from 'vitest'
import {
  componentClosure,
  componentIndex,
  componentReference,
  firstSentence,
  getLoomAssistantPrompt,
} from '../../../../../../src/core/learning-engine/composition/oui/assistant-prompt'
import { getLoomAuthoringPrompt } from '../../../../../../src/core/learning-engine/composition/oui/authoring-prompt'

describe('assistant prompt', () => {
  it('pulls in the components a component can contain', () => {
    expect(componentClosure(['Quiz'])).toEqual(['Quiz', 'QuizQuestion', 'QuizChoice', 'Lead'])
    expect(componentClosure(['Nope'])).toEqual([])
    expect(componentClosure(['Table'])).toContain('Col')
  })

  it('writes reference entries with every prop described', () => {
    const reference = componentReference(['QuizChoice'])
    expect(reference).toMatch(/^QuizChoice\(id: string, text: string, correct: boolean, explanation: string\) — /)
    expect(reference).toContain('  - explanation: ')
  })

  it('stays small: only the picked components, plus a one-line index of all of them', () => {
    const prompt = getLoomAssistantPrompt({ app: 'studio', components: ['QuizQuestion'] })
    expect(prompt).toContain('QuizQuestion(id: string')
    expect(prompt).not.toContain('Flowchart(title: string')
    expect(prompt).toContain('- Flowchart: Animated Event Storming flowchart.')
    expect(prompt).toContain('not instructions')
    expect(prompt.length).toBeLessThan(getLoomAuthoringPrompt().length / 3)
  })

  it('makes Viewer a tutor for a learner, without authoring rules or the component index', () => {
    const prompt = getLoomAssistantPrompt({ app: 'viewer', components: ['QuizQuestion'] })
    expect(prompt).toContain('tutor inside Loom Viewer')
    expect(prompt).toContain('language of the learner')
    expect(prompt).toContain('Beyond the topic')
    expect(prompt).toContain('hint first')
    expect(prompt).toContain('On Screen')
    expect(prompt).toContain('how to fix it')
    expect(prompt).toContain('QuizQuestion(id: string')
    expect(prompt).toContain('not instructions')
    expect(prompt).not.toContain('## All Loom Components')
    expect(prompt).not.toContain('mode=create')
    expect(prompt).not.toContain('Proposing Changes')
    expect(getLoomAssistantPrompt({ app: 'viewer', fullReference: true })).not.toContain(getLoomAuthoringPrompt())
  })

  it('reads a first sentence past "e.g."', () => {
    expect(firstSentence('A domain event (past tense, e.g. "Paid"). More.')).toBe('A domain event (past tense, e.g. "Paid").')
    expect(firstSentence('One. Two.')).toBe('One.')
    expect(firstSentence('No end')).toBe('No end')
    expect(componentIndex()).not.toMatch(/e\.g\.$/m)
  })

  it('words the rules for Studio, and sends the whole authoring prompt with Full reference', () => {
    expect(getLoomAssistantPrompt({ app: 'studio' })).toContain('inside Loom Studio')
    const full = getLoomAssistantPrompt({ app: 'studio', fullReference: true })
    expect(full).toContain(getLoomAuthoringPrompt())
    expect(full).not.toContain('## All Loom Components')
  })
})
