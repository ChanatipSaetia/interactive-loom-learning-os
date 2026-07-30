import { z } from 'zod'

// --- Quiz Section Schema ---

export const QuizChoiceSchema = z.object({
  id: z.string(),
  text: z.string(),
  correct: z.boolean(),
  explanation: z.string(),
})

export const QuizQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  choices: z.array(QuizChoiceSchema),
  hint: z.string().optional(),
})

export const QuizSectionSchema = z.object({
  type: z.literal('quiz'),
  questions: z.array(QuizQuestionSchema),
})

export type QuizChoice = z.infer<typeof QuizChoiceSchema>
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>
export type QuizSectionData = z.infer<typeof QuizSectionSchema>

// --- Flashcards Section Schema ---

export const DialogueSchema = z.object({
  user: z.string(),
  aiThoughts: z.string(),
  aiQuestion: z.string(),
})

export const WordTermSchema = z.object({
  id: z.string(),
  word: z.string(),
  pronunciation: z.string(),
  category: z.string(),
  image: z.string().optional(),
  shortDefinition: z.string(),
  detailedDefinition: z.string(),
  whyItMatters: z.string(),
  dialogue: DialogueSchema.optional(),
})

export const FlashcardsSectionSchema = z.object({
  type: z.literal('flashcards'),
  terms: z.array(WordTermSchema),
})

export type Dialogue = z.infer<typeof DialogueSchema>
export type WordTermType = z.infer<typeof WordTermSchema>
export type FlashcardsSectionData = z.infer<typeof FlashcardsSectionSchema>

// --- Concept Map Section Schema ---

export const ConceptNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
})

export const ConceptEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
})

export const ConceptMapSectionSchema = z.object({
  type: z.literal('concept-map'),
  nodes: z.record(z.string(), ConceptNodeSchema),
  edges: z.array(ConceptEdgeSchema),
})

export type ConceptNodeType = z.infer<typeof ConceptNodeSchema>
export type ConceptEdgeType = z.infer<typeof ConceptEdgeSchema>
export type ConceptMapSectionData = z.infer<typeof ConceptMapSectionSchema>
