import { describe, expect, it } from 'vitest'
import {
  componentClosure,
  componentReference,
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
    const prompt = getLoomAssistantPrompt({ app: 'viewer', components: ['QuizQuestion'] })
    expect(prompt).toContain('inside Loom Viewer')
    expect(prompt).toContain('QuizQuestion(id: string')
    expect(prompt).not.toContain('Flowchart(title: string')
    expect(prompt).toContain('- Flowchart: Animated Event Storming flowchart.')
    expect(prompt).toContain('not instructions')
    expect(prompt.length).toBeLessThan(getLoomAuthoringPrompt().length / 3)
  })

  it('words the rules for Studio, and sends the whole authoring prompt with Full reference', () => {
    expect(getLoomAssistantPrompt({ app: 'studio' })).toContain('inside Loom Studio')
    const full = getLoomAssistantPrompt({ app: 'studio', fullReference: true })
    expect(full).toContain(getLoomAuthoringPrompt())
    expect(full).not.toContain('## All Loom Components')
  })
})
