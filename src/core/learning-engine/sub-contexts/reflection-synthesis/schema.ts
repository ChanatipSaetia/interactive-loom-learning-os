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
})

export const ReflectionSequenceSectionSchema = z.preprocess(
  (val: unknown) => {
    if (val && typeof val === 'object') {
      const obj = val as Record<string, unknown>
      if (Array.isArray(obj.challenges)) {
        return obj
      }
      if (Array.isArray(val)) {
        return { type: 'reflection-sequence', challenges: val }
      }
      if (obj.prompt && obj.items && obj.solution) {
        return {
          type: obj.type || 'reflection-sequence',
          challenges: [
            {
              prompt: obj.prompt,
              items: obj.items,
              solution: obj.solution,
            }
          ],
        }
      }
    }
    return val
  },
  z.object({
    type: z.literal('reflection-sequence'),
    challenges: z.array(ReflectionSequenceChallengeSchema),
  })
)

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

export const ReflectionTemplateSectionSchema = z.preprocess(
  (val: unknown) => {
    if (val && typeof val === 'object') {
      const obj = val as Record<string, unknown>
      if (Array.isArray(obj.challenges)) {
        return obj
      }
      if (Array.isArray(val)) {
        return { type: 'reflection-template', challenges: val }
      }
      if (obj.prompt && obj.template && obj.chips && obj.solution) {
        return {
          type: obj.type || 'reflection-template',
          challenges: [
            {
              prompt: obj.prompt,
              template: obj.template,
              chips: obj.chips,
              solution: obj.solution,
              explanation: obj.explanation,
            }
          ],
        }
      }
    }
    return val
  },
  z.object({
    type: z.literal('reflection-template'),
    challenges: z.array(ReflectionTemplateChallengeSchema),
  })
)

export type ChipItem = z.infer<typeof ChipItemSchema>
export type ReflectionTemplateChallenge = z.infer<typeof ReflectionTemplateChallengeSchema>
export type ReflectionTemplateSectionData = z.infer<typeof ReflectionTemplateSectionSchema>
