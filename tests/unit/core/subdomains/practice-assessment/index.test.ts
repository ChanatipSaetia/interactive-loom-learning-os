import { describe, it, expect } from 'vitest'
import * as PracticeAssessmentSubdomain from '../../../../../src/core/subdomains/practice-assessment'

describe('PracticeAssessment Bounded Context Entry Point', () => {
  it('exports all Zod schemas', () => {
    expect(PracticeAssessmentSubdomain.QuizSectionSchema).toBeDefined()
    expect(PracticeAssessmentSubdomain.FlashcardsSectionSchema).toBeDefined()
    expect(PracticeAssessmentSubdomain.ConceptMapSectionSchema).toBeDefined()
  })

  it('exports all section components', () => {
    expect(PracticeAssessmentSubdomain.QuizSection).toBeDefined()
    expect(PracticeAssessmentSubdomain.FlashcardsSection).toBeDefined()
    expect(PracticeAssessmentSubdomain.ConceptMapSection).toBeDefined()
  })

  it('schemas are zod objects', () => {
    expect(PracticeAssessmentSubdomain.QuizSectionSchema._def).toBeDefined()
    expect(PracticeAssessmentSubdomain.FlashcardsSectionSchema._def).toBeDefined()
    expect(PracticeAssessmentSubdomain.ConceptMapSectionSchema._def).toBeDefined()
  })
})
