/** Deterministic benchmark measurements; model quality judgments live outside the Worker. */
export interface WorkflowMeasurement {
  caseId: string
  variant: string
  valid: boolean
  rendered: boolean
  inputTokens?: number
  outputTokens?: number
  repairInputTokens?: number
  repairOutputTokens?: number
  repairCount: number
}
export function summarizeMeasurements(runs: readonly WorkflowMeasurement[]) {
  const total = runs.length
  const sum = (select: (run: WorkflowMeasurement) => number) => runs.reduce((n, run) => n + select(run), 0)
  const successful = runs.filter((run) => run.valid && run.rendered)
  const tokens = sum((run) => (run.inputTokens ?? 0) + (run.outputTokens ?? 0) + (run.repairInputTokens ?? 0) + (run.repairOutputTokens ?? 0))
  return {
    total,
    successful: successful.length,
    successRate: total ? successful.length / total : 0,
    firstPassValidityRate: total ? runs.filter((run) => run.valid && run.repairCount === 0).length / total : 0,
    observedTokens: tokens,
    tokenObservedRuns: runs.filter((run) => [run.inputTokens, run.outputTokens, run.repairInputTokens, run.repairOutputTokens].some((value) => value !== undefined)).length,
    completeTokenRuns: runs.filter((run) => run.inputTokens !== undefined && run.outputTokens !== undefined && (run.repairCount === 0 || (run.repairInputTokens !== undefined && run.repairOutputTokens !== undefined))).length,
    tokensPerSuccess: successful.length && runs.some((run) => run.inputTokens !== undefined || run.outputTokens !== undefined || run.repairInputTokens !== undefined || run.repairOutputTokens !== undefined) ? tokens / successful.length : null,
    averageRepairs: total ? sum((run) => run.repairCount) / total : 0,
  }
}
