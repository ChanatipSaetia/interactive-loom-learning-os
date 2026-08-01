import { describe, it, expect } from 'vitest'
import {
  QuizSectionSchema,
  QuizQuestionSchema,
  QuizChoiceSchema,
  FlashcardsSectionSchema,
  WordTermSchema,
  DialogueSchema,
  ConceptMapSectionSchema,
  ConceptNodeSchema,
  ConceptEdgeSchema,
} from '../../../../../../src/core/learning-engine/sub-contexts/practice-assessment/schema'

// --- Quiz Section ---

describe('QuizSectionSchema', () => {
  it('validates correct quiz section data', () => {
    const valid = {
      type: 'quiz',
      questions: [
        {
          id: 'q1',
          question: 'What is DDD?',
          choices: [
            {
              id: 'a',
              text: 'Domain-Driven Design',
              correct: true,
              explanation: 'DDD is a software design approach.',
            },
            {
              id: 'b',
              text: 'Data-Driven Development',
              correct: false,
              explanation: 'This is not the primary meaning.',
            },
          ],
          hint: 'Think about software architecture.',
        },
      ],
    }
    const result = QuizSectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects wrong type literal', () => {
    const invalid = {
      type: 'flashcards',
      questions: [],
    }
    const result = QuizSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects missing questions', () => {
    const invalid = {
      type: 'quiz',
    }
    const result = QuizSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('accepts quiz without optional hint', () => {
    const valid = {
      type: 'quiz',
      questions: [
        {
          id: 'q1',
          question: 'What is DDD?',
          choices: [
            {
              id: 'a',
              text: 'Domain-Driven Design',
              correct: true,
              explanation: 'Correct.',
            },
          ],
        },
      ],
    }
    const result = QuizSectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects question missing required fields', () => {
    const invalid = {
      type: 'quiz',
      questions: [
        {
          id: 'q1',
          question: 'What is DDD?',
        },
      ],
    }
    const result = QuizSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects choice missing required fields', () => {
    const invalid = {
      type: 'quiz',
      questions: [
        {
          id: 'q1',
          question: 'What is DDD?',
          choices: [
            {
              id: 'a',
              text: 'DDD',
            },
          ],
        },
      ],
    }
    const result = QuizSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('QuizQuestionSchema', () => {
  it('validates required question fields', () => {
    const valid = {
      id: 'q1',
      question: 'Test question',
      choices: [
        {
          id: 'a',
          text: 'Answer A',
          correct: true,
          explanation: 'Explanation',
        },
      ],
    }
    const result = QuizQuestionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts optional hint', () => {
    const valid = {
      id: 'q1',
      question: 'Test question',
      choices: [
        {
          id: 'a',
          text: 'Answer A',
          correct: true,
          explanation: 'Explanation',
        },
      ],
      hint: 'This is a hint',
    }
    const result = QuizQuestionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })
})

describe('QuizChoiceSchema', () => {
  it('validates all required choice fields', () => {
    const valid = {
      id: 'a',
      text: 'Answer',
      correct: true,
      explanation: 'Because...',
    }
    const result = QuizChoiceSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects missing correct field', () => {
    const invalid = {
      id: 'a',
      text: 'Answer',
      explanation: 'Because...',
    }
    const result = QuizChoiceSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

// --- Flashcards Section ---

describe('FlashcardsSectionSchema', () => {
  it('validates correct flashcards section data', () => {
    // Note: pronunciation in YAML is a string, not a regex
    const validString = {
      type: 'flashcards',
      terms: [
        {
          id: 't1',
          word: 'Aggregate',
          pronunciation: '/əˈɡrɛɡət/',
          category: 'DDD',
          shortDefinition: 'A consistency boundary.',
          detailedDefinition: 'Full definition here.',
          whyItMatters: 'Key concept.',
        },
      ],
    }
    const result = FlashcardsSectionSchema.safeParse(validString)
    expect(result.success).toBe(true)
  })

  it('rejects wrong type literal', () => {
    const invalid = {
      type: 'quiz',
      terms: [],
    }
    const result = FlashcardsSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects missing terms', () => {
    const invalid = {
      type: 'flashcards',
    }
    const result = FlashcardsSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('accepts term with optional image and dialogue', () => {
    const valid = {
      type: 'flashcards',
      terms: [
        {
          id: 't1',
          word: 'Term',
          pronunciation: '/term/',
          category: 'cat',
          image: '/img.png',
          shortDefinition: 'Short',
          detailedDefinition: 'Long',
          whyItMatters: 'Important',
          dialogue: {
            user: 'What is this?',
            aiThoughts: 'Thinking...',
            aiQuestion: 'Got it?',
          },
        },
      ],
    }
    const result = FlashcardsSectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })
})

describe('WordTermSchema', () => {
  it('validates required term fields', () => {
    const valid = {
      id: 't1',
      word: 'Word',
      pronunciation: '/wɜːrd/',
      category: 'cat',
      shortDefinition: 'Short',
      detailedDefinition: 'Long',
      whyItMatters: 'Why',
    }
    const result = WordTermSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const invalid = {
      id: 't1',
      word: 'Word',
    }
    const result = WordTermSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('DialogueSchema', () => {
  it('validates all dialogue fields', () => {
    const valid = {
      user: 'User message',
      aiThoughts: 'AI thoughts',
      aiQuestion: 'AI question',
    }
    const result = DialogueSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects missing fields', () => {
    const invalid = {
      user: 'User message',
    }
    const result = DialogueSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

// --- Concept Map Section ---

describe('ConceptMapSectionSchema', () => {
  it('validates correct concept map data', () => {
    const valid = {
      type: 'concept-map',
      nodes: {
        node1: {
          id: 'node1',
          title: 'Node 1',
          category: 'concept',
        },
        node2: {
          id: 'node2',
          title: 'Node 2',
          category: 'pattern',
        },
      },
      edges: [
        {
          from: 'node1',
          to: 'node2',
          label: 'relates to',
        },
      ],
    }
    const result = ConceptMapSectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects wrong type literal', () => {
    const invalid = {
      type: 'quiz',
      nodes: {},
      edges: [],
    }
    const result = ConceptMapSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects missing nodes', () => {
    const invalid = {
      type: 'concept-map',
      edges: [],
    }
    const result = ConceptMapSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects missing edges', () => {
    const invalid = {
      type: 'concept-map',
      nodes: {},
    }
    const result = ConceptMapSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('accepts edge without optional label', () => {
    const valid = {
      type: 'concept-map',
      nodes: {
        n1: {
          id: 'n1',
          title: 'Node',
          category: 'cat',
        },
      },
      edges: [
        {
          from: 'n1',
          to: 'n1',
        },
      ],
    }
    const result = ConceptMapSectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })
})

describe('ConceptNodeSchema', () => {
  it('validates all required node fields', () => {
    const valid = {
      id: 'n1',
      title: 'Node Title',
      category: 'concept',
    }
    const result = ConceptNodeSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const invalid = {
      id: 'n1',
    }
    const result = ConceptNodeSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('ConceptEdgeSchema', () => {
  it('validates required edge fields', () => {
    const valid = {
      from: 'n1',
      to: 'n2',
    }
    const result = ConceptEdgeSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts optional label', () => {
    const valid = {
      from: 'n1',
      to: 'n2',
      label: 'connects',
    }
    const result = ConceptEdgeSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects missing from field', () => {
    const invalid = {
      to: 'n2',
    }
    const result = ConceptEdgeSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})
