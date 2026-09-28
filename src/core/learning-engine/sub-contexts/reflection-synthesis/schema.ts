import { z } from 'zod'

// --- Reflection Sequence Section Schema ---

export const SequenceItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  icon: z.string().optional(),
})

export const ReflectionSequenceChallengeSchema = z.object({
  prompt: z.string(),
  items: z.array(SequenceItemSchema),
  solution: z.array(z.string()),
  /** Teach point id (from the topic brief) this challenge assesses. */
  groundedIn: z.string().optional(),
})

export const ReflectionSequenceSectionSchema = z.object({
  type: z.literal('reflection-sequence'),
  challenges: z.array(ReflectionSequenceChallengeSchema),
})

export type SequenceItem = z.infer<typeof SequenceItemSchema>
export type ReflectionSequenceChallenge = z.infer<typeof ReflectionSequenceChallengeSchema>
export type ReflectionSequenceSectionData = z.infer<typeof ReflectionSequenceSectionSchema>

// --- Reflection Template Section Schema ---

export const ChipItemSchema = z.object({
  id: z.string(),
  text: z.string(),
})

export const ReflectionTemplateChallengeSchema = z.object({
  prompt: z.string(),
  template: z.string(),
  chips: z.array(ChipItemSchema),
  solution: z.record(z.string(), z.string()),
  explanation: z.string().optional(),
})

export const ReflectionTemplateSectionSchema = z.object({
  type: z.literal('reflection-template'),
  challenges: z.array(ReflectionTemplateChallengeSchema),
})

export type ChipItem = z.infer<typeof ChipItemSchema>
export type ReflectionTemplateChallenge = z.infer<typeof ReflectionTemplateChallengeSchema>
export type ReflectionTemplateSectionData = z.infer<typeof ReflectionTemplateSectionSchema>
