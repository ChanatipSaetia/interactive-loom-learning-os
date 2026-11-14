import { z } from 'zod'
import { evaluateExpression } from '../sub-contexts/tradeoff-sandbox/components/formula-sandbox/expression'
import { FormulaSandboxSectionSchema } from '../sub-contexts/tradeoff-sandbox/schema'
import { BreakdownTreeSectionSchema, validateBreakdownTree } from '../sub-contexts/progressive-content/breakdown-tree'

export const NUMERIC_TOLERANCE = 1e-9
export const nearlyEqual = (a: number, b: number) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= NUMERIC_TOLERANCE * Math.max(1, Math.abs(a), Math.abs(b))
export interface QuantitativeDiagnostic { code: string; severity: 'error' | 'warning'; stage: 'quantitative'; path: string; message: string; fixHint: string }

/** Default, all-min/all-max and one-variable boundary/intermediate probes; bounded, not a proof over a continuum. */
export function checkFormulaModel(input: unknown) {
  const diagnostics: QuantitativeDiagnostic[] = []
  const add = (code: string, path: string, message: string, fixHint: string) => diagnostics.push({ code, severity: 'error', stage: 'quantitative', path, message, fixHint })
  const parsed = FormulaSandboxSectionSchema.safeParse(input)
  if (!parsed.success) {
    parsed.error.issues.slice(0, 20).forEach((issue) => add('INVALID_FORMULA_MODEL', issue.path.join('.'), issue.message, 'Repair the FormulaSandbox contract.'))
    return { diagnostics, defaults: {}, samplesChecked: 0, coverage: 'not-checked' }
  }
  const { variables, metrics } = parsed.data
  if (variables.length > 32 || metrics.length > 32 || metrics.some((m) => m.formula.length > 4096)) {
    add('MODEL_LIMIT_EXCEEDED', '', 'Formula checks accept at most 32 variables, 32 metrics and 4096 characters per expression.', 'Split the model into meaningful bounded activities.')
    return { diagnostics, defaults: {}, samplesChecked: 0, coverage: 'not-checked' }
  }
  const ids = new Set<string>()
  variables.forEach((v, i) => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(v.id) || ['Math', 'true', 'false', '__proto__', 'constructor', 'prototype'].includes(v.id) || ids.has(v.id)) add('INVALID_VARIABLE_ID', `variables[${i}].id`, 'Variable IDs must be unique identifiers and cannot shadow evaluator names.', 'Rename the variable and update its expressions.')
    ids.add(v.id)
    if (![v.min, v.max, v.step, v.defaultValue].every(Number.isFinite) || v.min > v.max || v.step <= 0 || v.defaultValue < v.min || v.defaultValue > v.max) add('INVALID_VARIABLE_DOMAIN', `variables[${i}].defaultValue`, 'Slider min/max bounds, positive step and in-range defaultValue must define a finite domain.', 'Use min <= defaultValue <= max and a positive step.')
  })
  const defaults = Object.fromEntries(variables.map((v) => [v.id, v.defaultValue]))
  const probes = [defaults, Object.fromEntries(variables.map((v) => [v.id, v.min])), Object.fromEntries(variables.map((v) => [v.id, v.max]))]
  for (const v of variables) for (const value of [v.min, v.max, v.min / 2 + v.max / 2, 0]) {
    if (value >= v.min && value <= v.max) probes.push({ ...defaults, [v.id]: value })
  }
  const scopes = probes.map((probe) => ({ ...probe }))
  const outputs: Record<string, number> = {}
  const metricIds = new Set<string>()
  let samplesChecked = 0
  metrics.forEach((m, i) => {
    const path = `metrics[${i}].formula`
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(m.id) || ['Math', 'true', 'false', '__proto__', 'constructor', 'prototype'].includes(m.id) || ids.has(m.id)) add('INVALID_METRIC_ID', `metrics[${i}].id`, 'Metric IDs must be identifiers distinct from variable and evaluator names.', 'Rename the metric and update dependent expressions.')
    if (metricIds.has(m.id)) add('DUPLICATE_METRIC_ID', `metrics[${i}].id`, 'Metric IDs must be unique.', 'Rename duplicate metrics.')
    metricIds.add(m.id)
    if (/\bMath\s*\.\s*random\b/.test(m.formula)) { add('NONDETERMINISTIC_FORMULA', path, 'Random expressions cannot be reconciled deterministically.', 'Use an explicit authored variable for uncertainty.'); return }
    // Bound parser recursion before evaluation. The evaluator never executes arbitrary code.
    if ((m.formula.match(/[()+\-!?]|\*\*/g) ?? []).length > 128) { add('FORMULA_COMPLEXITY_LIMIT', path, 'Expression exceeds the bounded validation complexity.', 'Simplify the expression.'); return }
    for (const [index, probe] of scopes.entries()) {
      try {
        samplesChecked++
        const result = evaluateExpression(m.formula, probe)
        if (!Number.isFinite(result)) throw new Error('Non-finite mathematical output')
        probe[m.id] = result
        if (index === 0) outputs[m.id] = result
      } catch (error) {
        add('INVALID_FORMULA_OUTPUT', path, `${error instanceof Error ? error.message.replace('Unknown name', 'unknown variable or metric') : String(error)} at ${index === 0 ? 'defaults' : 'a domain probe'}: ${JSON.stringify(probe)}`, 'Use declared variable names and supported operations; restrict the domain or guard invalid boundaries.')
        break
      }
    }
  })
  return { diagnostics, defaults: outputs, samplesChecked, coverage: 'sampled-not-proven' }
}

/** Explicit shared-model observations, never guessed from formatted table cells or prose. */
export const QuantitativeReviewInput = z.object({
  trees: z.array(BreakdownTreeSectionSchema.extend({ nodes: BreakdownTreeSectionSchema.shape.nodes.max(500) })).max(12).default([]),
  formulas: z.array(FormulaSandboxSectionSchema.extend({ variables: FormulaSandboxSectionSchema.shape.variables.max(32), metrics: FormulaSandboxSectionSchema.shape.metrics.max(32) })).max(12).default([]),
  reconciliations: z.array(z.object({
    modelId: z.string().min(1).max(120), assumptions: z.string().min(1).max(2000),
    provenance: z.enum(['verified', 'user-supplied', 'derived', 'illustrative', 'unsupported']), evidenceRefs: z.array(z.string().max(500)).max(20).optional(),
    observations: z.array(z.object({ target: z.string().max(240), value: z.number().finite(), unit: z.string().trim().min(1).max(80) }).strict()).min(2).max(30),
  }).strict()).max(30).default([]),
}).strict()

export function reviewQuantitativeModels(input: z.input<typeof QuantitativeReviewInput>) {
  const model = QuantitativeReviewInput.parse(input)
  const diagnostics: QuantitativeDiagnostic[] = []
  model.trees.forEach((tree, i) => {
    for (const d of validateBreakdownTree(tree)) diagnostics.push({ code: 'INVALID_BREAKDOWN_MODEL', severity: 'error', stage: 'quantitative', path: `trees[${i}].${d.field ?? ''}`, message: d.message, fixHint: d.fixHint ?? 'Repair the tree.' })
    if (tree.mode === 'quantity' && !tree.unit.trim()) diagnostics.push({ code: 'MISSING_QUANTITY_UNIT', severity: 'warning', stage: 'quantitative', path: `trees[${i}].unit`, message: 'Quantity model has no defined unit.', fixHint: 'State one common unit, including count for dimensionless counts.' })
  })
  const formulas = model.formulas.map((formula, i) => {
    const result = checkFormulaModel(formula)
    diagnostics.push(...result.diagnostics.map((d) => ({ ...d, path: `formulas[${i}].${d.path}` })))
    return { defaults: result.defaults, samplesChecked: result.samplesChecked, coverage: result.coverage }
  })
  model.reconciliations.forEach((entry, i) => {
    const add = (code: string, message: string) => diagnostics.push({ code, severity: 'error', stage: 'quantitative', path: `reconciliations[${i}]`, message, fixHint: 'Derive each observation from the same model, unit and assumptions; repair only the affected targets.' })
    const first = entry.observations[0]
    if (entry.observations.some((o) => o.unit !== first.unit)) add('INCONSISTENT_UNITS', 'Shared-model observations have different units; no conversion is assumed.')
    else if (entry.observations.some((o) => !nearlyEqual(o.value, first.value))) add('QUANTITATIVE_MISMATCH', 'Shared-model observations disagree within the documented tolerance.')
    if (entry.provenance === 'unsupported' || (entry.provenance === 'verified' && !entry.evidenceRefs?.length)) add('MISSING_QUANTITATIVE_EVIDENCE', 'Empirical claims require evidence; illustrative models must identify their assumptions.')
  })
  return { status: !model.trees.length && !model.formulas.length && !model.reconciliations.length ? 'not-checked' : diagnostics.some((d) => d.severity === 'error') ? 'invalid' : diagnostics.length ? 'review-needed' : 'checked', diagnostics: diagnostics.slice(0, 30), omittedDiagnosticCount: Math.max(0, diagnostics.length - 30), formulas, tolerance: NUMERIC_TOLERANCE, scope: 'Explicit models and observations only; sampled formulas do not prove validity across continuous input ranges, dimensional correctness or empirical truth.' }
}

/** Normalize provider usage only after its inclusive/exclusive semantics are declared. */
export const TokenUsageInput = z.object({
  inputTokens: z.number().int().nonnegative(), cacheReadTokens: z.number().int().nonnegative().default(0), cacheWriteTokens: z.number().int().nonnegative().default(0),
  outputTokens: z.number().int().nonnegative(), reasoningTokens: z.number().int().nonnegative().default(0),
  inputIncludesCacheRead: z.boolean(), inputIncludesCacheWrite: z.boolean(), outputIncludesReasoning: z.boolean(),
  toolCharges: z.number().nonnegative().default(0), infrastructureCost: z.number().nonnegative().default(0), retryCost: z.number().nonnegative().default(0),
}).strict()
export function normalizeTokenUsage(raw: z.input<typeof TokenUsageInput>) {
  const usage = TokenUsageInput.parse(raw)
  const freshInputTokens = usage.inputTokens - (usage.inputIncludesCacheRead ? usage.cacheReadTokens : 0) - (usage.inputIncludesCacheWrite ? usage.cacheWriteTokens : 0)
  const visibleOutputTokens = usage.outputTokens - (usage.outputIncludesReasoning ? usage.reasoningTokens : 0)
  if (freshInputTokens < 0 || visibleOutputTokens < 0) throw new Error('Inclusive usage categories exceed their reported total; check provider accounting semantics.')
  return { freshInputTokens, cacheReadTokens: usage.cacheReadTokens, cacheWriteTokens: usage.cacheWriteTokens, outputTokens: visibleOutputTokens, reasoningTokens: usage.reasoningTokens, toolCharges: usage.toolCharges, infrastructureCost: usage.infrastructureCost, retryCost: usage.retryCost }
}
