import type { SectionLayout } from '../../validation/types'
import { singleFile } from '../../validation/layout'

export const PracticeAssessmentLayouts: Record<string, SectionLayout> = {
  quiz: singleFile('questions.yaml', 'questions'),
  flashcards: singleFile('glossary.yaml', 'terms'),
  'concept-map': singleFile('concepts.yaml'),
}
