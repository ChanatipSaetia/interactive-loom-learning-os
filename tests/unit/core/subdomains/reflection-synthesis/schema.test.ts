import { describe, it, expect } from 'vitest'
import {
  ReflectionSequenceSectionSchema,
  ReflectionTemplateSectionSchema,
  SequenceItemSchema,
  ReflectionSequenceChallengeSchema,
  ChipItemSchema,
  ReflectionTemplateChallengeSchema,
} from '../../../../../src/core/subdomains/reflection-synthesis/schema'

describe('ReflectionSequenceSectionSchema', () => {
  it('validates correct reflection sequence data', () => {
    const valid = {
      type: 'reflection-sequence',
      challenges: [
        {
          prompt: 'Order the steps',
          items: [
            { id: 'step1', text: 'First step' },
            { id: 'step2', text: 'Second step', icon: 'check' },
          ],
          solution: ['step1', 'step2'],
        },
      ],
    }
    const result = ReflectionSequenceSectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects wrong type literal', () => {
    const invalid = {
      type: 'reflection-template',
      challenges: [],
    }
    const result = ReflectionSequenceSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects missing required challenge fields', () => {
    const invalid = {
      type: 'reflection-sequence',
      challenges: [
        {
          prompt: 'Order steps',
          // missing items and solution
        },
      ],
    }
    const result = ReflectionSequenceSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects empty challenges array for items', () => {
    const invalid = {
      type: 'reflection-sequence',
      challenges: [
        {
          prompt: 'Order steps',
          items: [],
          solution: [],
        },
      ],
    }
    const result = ReflectionSequenceSectionSchema.safeParse(invalid)
    expect(result.success).toBe(true)
  })
})

describe('SequenceItemSchema', () => {
  it('validates required item fields', () => {
    const valid = { id: 'step1', text: 'First step' }
    const result = SequenceItemSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts optional icon field', () => {
    const valid = { id: 'step1', text: 'First step', icon: 'arrow' }
    const result = SequenceItemSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects missing text', () => {
    const invalid = { id: 'step1' }
    const result = SequenceItemSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('ReflectionSequenceChallengeSchema', () => {
  it('validates correct challenge', () => {
    const valid = {
      prompt: 'Order these',
      items: [{ id: 'a', text: 'A' }],
      solution: ['a'],
    }
    const result = ReflectionSequenceChallengeSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects missing solution', () => {
    const invalid = {
      prompt: 'Order these',
      items: [{ id: 'a', text: 'A' }],
    }
    const result = ReflectionSequenceChallengeSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('ReflectionTemplateSectionSchema', () => {
  it('validates correct reflection template data', () => {
    const valid = {
      type: 'reflection-template',
      challenges: [
        {
          prompt: 'Fill in the blanks',
          template: 'The {zone-a} drives the {zone-b}.',
          chips: [
            { id: 'chip1', text: 'input' },
            { id: 'chip2', text: 'output' },
          ],
          solution: { 'zone-a': 'chip1', 'zone-b': 'chip2' },
        },
      ],
    }
    const result = ReflectionTemplateSectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts optional explanation', () => {
    const valid = {
      type: 'reflection-template',
      challenges: [
        {
          prompt: 'Fill in the blanks',
          template: 'The {zone-a} drives the {zone-b}.',
          chips: [{ id: 'chip1', text: 'input' }],
          solution: { 'zone-a': 'chip1' },
          explanation: 'The input drives the output.',
        },
      ],
    }
    const result = ReflectionTemplateSectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects wrong type literal', () => {
    const invalid = {
      type: 'reflection-sequence',
      challenges: [],
    }
    const result = ReflectionTemplateSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects missing required challenge fields', () => {
    const invalid = {
      type: 'reflection-template',
      challenges: [
        {
          prompt: 'Fill in',
          // missing template, chips, solution
        },
      ],
    }
    const result = ReflectionTemplateSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('ChipItemSchema', () => {
  it('validates required chip fields', () => {
    const valid = { id: 'chip1', text: 'Input' }
    const result = ChipItemSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects missing text', () => {
    const invalid = { id: 'chip1' }
    const result = ChipItemSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('ReflectionTemplateChallengeSchema', () => {
  it('validates correct challenge with solution map', () => {
    const valid = {
      prompt: 'Fill blanks',
      template: 'The {zone-x} is key.',
      chips: [{ id: 'c1', text: 'process' }],
      solution: { 'zone-x': 'c1' },
    }
    const result = ReflectionTemplateChallengeSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects missing template', () => {
    const invalid = {
      prompt: 'Fill blanks',
      chips: [{ id: 'c1', text: 'process' }],
      solution: {},
    }
    const result = ReflectionTemplateChallengeSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects missing solution', () => {
    const invalid = {
      prompt: 'Fill blanks',
      template: 'The {zone-x} is key.',
      chips: [{ id: 'c1', text: 'process' }],
    }
    const result = ReflectionTemplateChallengeSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})
