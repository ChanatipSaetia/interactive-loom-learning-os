import { z } from 'zod'
import { reviewTopicSource } from '../core/learning-engine/composition/oui/source-plan-review'
import { topicPlanReview, validateTopicPlan } from '../core/learning-engine/composition/oui/topic-plan'

export const AdvisoryResolution = z.object({ code: z.string().max(120), path: z.string().max(500), reason: z.string().trim().min(40).max(2000), planVersion: z.string().max(120) }).strict()
export type AdvisoryResolutionInput = z.infer<typeof AdvisoryResolution>
const justifiable = new Set(['REPRESENTATION_ALTERNATIVE_AVAILABLE', 'KNOWLEDGE_STRUCTURE_MISMATCH', 'UNJUSTIFIED_TEXT_SELECTION', 'LIST_STRUCTURE_REVIEW', 'POSSIBLE_REDUNDANT_SECTION', 'GOAL_COMPOSITION_REVIEW'])

/** No session state. Every create call rechecks the exact plan and source. */
export function reviewDelivery(oui: string, plan: unknown, resolutions: AdvisoryResolutionInput[]) {
  const errors = plan === undefined ? [{ code: 'PLAN_REQUIRED', path: 'plan', message: 'New topics require a TopicPlan. Supply and validate it; use intent: reopen only for an existing exact source.' }] : validateTopicPlan(plan)
  const review = topicPlanReview(plan, !errors.length)
  const sourceReview = errors.length ? undefined : reviewTopicSource(oui, plan)
  const resolved: typeof review.advisoryDiagnostics = []
  const invalidResolutions: Array<{ code: string; path: string; message: string }> = []
  const seen = new Set<string>()
  for (const resolution of resolutions) {
    const key = `${resolution.code}:${resolution.path}`
    const warning = review.advisoryDiagnostics.find((d) => d.code === resolution.code && d.path === resolution.path)
    if (seen.has(key) || !warning || !justifiable.has(resolution.code) || resolution.planVersion !== review.planVersion) {
      invalidResolutions.push({ code: 'INVALID_ADVISORY_RESOLUTION', path: resolution.path, message: 'Resolve only current design warnings with the current planVersion. Missing presentation/evidence fields and source mismatches must be repaired.' })
    } else { seen.add(key); resolved.push(warning) }
  }
  const unresolved = review.advisoryDiagnostics.filter((d) => !resolved.includes(d))
  const blocked = errors.length > 0 || invalidResolutions.length > 0 || unresolved.length > 0 || sourceReview?.status !== 'aligned'
  return {
    ...review,
    sourceReview: sourceReview && { ...sourceReview, diagnostics: sourceReview.diagnostics.slice(0, 10), omittedDiagnosticCount: Math.max(0, sourceReview.diagnostics.length - 10) },
    deliveryReview: {
      status: blocked ? 'blocked' as const : 'accepted-for-player-check' as const,
      sourceValidity: 'not-compiled' as const, layout: 'not-measured' as const, teachingQuality: 'not-evaluated' as const,
      planVersion: review.planVersion,
      errors: [...errors, ...invalidResolutions].slice(0, 10),
      unresolvedAdvisories: unresolved.slice(0, 10), unresolvedAdvisoryCount: unresolved.length,
      resolvedAdvisoryCount: resolved.length,
      next: blocked ? 'Repair source mismatches and missing fields. Resolve design warnings with a specific plan-bound explanation or revise and revalidate the plan. Do not replace the planned activity silently.' : 'Source declarations match the reviewed plan. The player must still compile OUI/narration and check layout.',
    },
    advisoryDiagnostics: review.advisoryDiagnostics.slice(0, 3), advisoryCount: review.advisoryDiagnostics.length,
    omittedAdvisoryCount: Math.max(0, review.advisoryDiagnostics.length - 3),
  }
}
