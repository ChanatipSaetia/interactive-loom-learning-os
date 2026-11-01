import { z } from 'zod'
import type { ValidationDiagnostic } from '../../validation/types'

const text = z.string().trim().min(1)
export const JourneyStageSchema = z.object({
  name: text, goal: text, action: text, response: text,
  friction: text.optional(), recovery: text.optional(), outcome: text.optional(),
})
export const UserJourneySectionSchema = z.object({
  type: z.literal('user-journey'), title: text, person: text, goal: text,
  stages: z.array(JourneyStageSchema).min(1),
})
export type JourneyStageData = z.infer<typeof JourneyStageSchema>
export type UserJourneySectionData = z.infer<typeof UserJourneySectionSchema>

export function validateUserJourney(data: UserJourneySectionData): ValidationDiagnostic[] {
  return data.stages.flatMap((stage, i) => stage.recovery && !stage.friction ? [{
    tier: 3 as const, field: `stages[${i}].recovery`,
    message: 'A recovery needs a friction point to explain what went wrong.',
    fixHint: 'Add friction to this JourneyStage or remove its recovery.',
  }] : [])
}

export type JourneyMoment = 'goal' | 'action' | 'response' | 'friction' | 'outcome'
export const JOURNEY_LABELS: Record<JourneyMoment, string> = {
  goal: 'Stage goal', action: 'User action', response: 'Product / service response',
  friction: 'Friction and recovery', outcome: 'Outcome',
}
/** Optional details produce beats only when authored; no invented emotions or outcomes. */
export function journeyMoments(stage: JourneyStageData): JourneyMoment[] {
  return ['goal', 'action', 'response', ...(stage.friction ? ['friction' as const] : []), ...(stage.outcome ? ['outcome' as const] : [])]
}
export function journeyScenes(data: UserJourneySectionData) {
  return data.stages.flatMap((stage, index) => journeyMoments(stage).map((moment) => ({
    id: `stage${index + 1}.${moment}`, stage: index, moment,
  })))
}

/** Keep Present text large: at most two moments and roughly 42 words per page. Beat IDs do not change. */
export function journeyPages(data: UserJourneySectionData): Array<{ stage: number; scenes: number[] }> {
  const pages: Array<{ stage: number; scenes: number[] }> = []
  let words = 0
  journeyScenes(data).forEach((scene, index) => {
    const stage = data.stages[scene.stage]
    const text = [stage[scene.moment], scene.moment === 'friction' ? stage.recovery : ''].filter(Boolean).join(' ')
    const count = text.trim().split(/\s+/).length
    let page = pages[pages.length - 1]
    if (!page || page.stage !== scene.stage || page.scenes.length >= 2 || words + count > 42) {
      page = { stage: scene.stage, scenes: [] }
      pages.push(page)
      words = 0
    }
    page.scenes.push(index)
    words += count
  })
  return pages
}
