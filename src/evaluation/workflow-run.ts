/** Provider-neutral offline/host trace ingestion. Never imported by the Worker. */
import { z } from 'zod'

const count = z.number().int().nonnegative()
const ratio = z.number().min(0).max(1).nullable().default(null)
export const WorkflowRunSchema = z.object({
  schemaVersion: z.literal(1),
  runId: z.string().regex(/^[a-z0-9_-]{1,120}$/),
  caseId: z.string().regex(/^[a-z0-9_-]{1,120}$/),
  variant: z.enum(['full-guide', 'section-filtered', 'progressive']),
  origin: z.enum(['synthetic', 'host-observed']),
  assistant: z.string().max(120).optional(),
  events: z.array(z.object({
    type: z.enum(['workflow.selected', 'context.resolved', 'research.completed', 'plan.validated', 'section.generated', 'validation.completed', 'topic.presented', 'learning.updated']),
    latencyMs: z.number().nonnegative(), inputBytes: count, outputBytes: count,
    estimatedInputTokens: count, estimatedOutputTokens: count,
    providerInputTokens: count.optional(), providerOutputTokens: count.optional(),
  }).strict()).min(1).max(500),
  outcome: z.object({
    ouiValid: z.boolean().nullable(), rendered: z.boolean().nullable(), narrationValid: z.boolean().nullable(),
    objectiveCoverage: ratio, dependencyRecall: ratio, evidenceSupport: ratio,
    repairCount: count,
  }).strict(),
  documentationEstimatedTokens: count,
  budgetExemption: z.string().min(1).max(500).optional(),
  reviews: z.array(z.object({
    reviewerAlias: z.string().regex(/^[a-z0-9_-]{1,60}$/), rubricVersion: z.literal(1),
    learnerActionFit: z.number().int().min(1).max(5), grounding: z.number().int().min(1).max(5), readability: z.number().int().min(1).max(5),
  }).strict()).max(10).default([]),
}).strict()
export type WorkflowRun = z.infer<typeof WorkflowRunSchema>
export const percentile = (values: number[], fraction: number) => values.length ? [...values].sort((a, b) => a - b)[Math.max(0, Math.ceil(values.length * fraction) - 1)] : null

export function evaluateWorkflowRuns(input: unknown) {
  const runs = z.array(WorkflowRunSchema).max(10000).parse(input)
  if (new Set(runs.map((r) => r.runId)).size !== runs.length) throw Error('Duplicate runId')
  const groups = (['synthetic', 'host-observed'] as const).flatMap((origin) => (['full-guide', 'section-filtered', 'progressive'] as const).map((variant) => {
    const group = runs.filter((r) => r.origin === origin && r.variant === variant)
    const sum = (fn: (run: WorkflowRun) => number) => group.reduce((n, r) => n + fn(r), 0)
    const eventSum = (r: WorkflowRun, key: 'estimatedInputTokens' | 'estimatedOutputTokens' | 'providerInputTokens' | 'providerOutputTokens') => r.events.reduce((n, e) => n + (e[key] ?? 0), 0)
    const success = group.filter((r) => r.outcome.ouiValid === true && r.outcome.rendered === true && r.outcome.narrationValid === true)
    const complete = group.filter((r) => r.events.every((e) => e.providerInputTokens !== undefined && e.providerOutputTokens !== undefined))
    const providerTotal = sum((r) => eventSum(r, 'providerInputTokens') + eventSum(r, 'providerOutputTokens'))
    const metric = (key: 'objectiveCoverage' | 'dependencyRecall' | 'evidenceSupport') => {
      const values = group.flatMap((r) => r.outcome[key] === null ? [] : [r.outcome[key] as number])
      return { observedRuns: values.length, mean: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null }
    }
    return {
      origin, variant, runs: group.length, successful: success.length,
      firstPassValid: group.filter((r) => r.outcome.ouiValid && r.outcome.repairCount === 0).length,
      unknownRenderRuns: group.filter((r) => r.outcome.rendered === null).length,
      narrationValidRuns: group.filter((r) => r.outcome.narrationValid === true).length,
      objectiveCoverage: metric('objectiveCoverage'), dependencyRecall: metric('dependencyRecall'), evidenceSupport: metric('evidenceSupport'),
      totalObservedProviderTokens: complete.length ? providerTotal : null,
      completeProviderUsageRuns: complete.length,
      providerTokensPerSuccess: success.length && complete.length === group.length ? providerTotal / success.length : null,
      estimatedBoundaryTokens: sum((r) => eventSum(r, 'estimatedInputTokens') + eventSum(r, 'estimatedOutputTokens')),
      repairs: sum((r) => r.outcome.repairCount),
      documentationTokens: { p50: percentile(group.map((r) => r.documentationEstimatedTokens), 0.5), p95: percentile(group.map((r) => r.documentationEstimatedTokens), 0.95) },
      latencyMs: { p50: percentile(group.map((r) => r.events.reduce((n, e) => n + e.latencyMs, 0)), 0.5), p95: percentile(group.map((r) => r.events.reduce((n, e) => n + e.latencyMs, 0)), 0.95) },
      budgetViolations: group.filter((r) => r.variant === 'progressive' && r.documentationEstimatedTokens > 5000 && !r.budgetExemption).map((r) => r.runId),
      exemptions: group.filter((r) => r.budgetExemption).length,
      reviewSamples: sum((r) => r.reviews.length),
      calibrationPairs: group.filter((r) => new Set(r.reviews.map((review) => review.reviewerAlias)).size >= 2).length,
    }
  })).filter((group) => group.runs)
  return { schemaVersion: 1, groups, caveats: ['Synthetic and host-observed runs are separate.', 'Missing metrics are unknown, never successful checks.', 'Estimated tokens are not provider billing.', 'Imported ratings require independent calibrated reviewers; the runner does not perform semantic judging.'] }
}
