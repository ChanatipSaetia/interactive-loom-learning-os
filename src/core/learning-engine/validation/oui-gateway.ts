// ============================================================================
// Validation Gateway — OpenUI Lang (`.oui`) sources
// ============================================================================
// Maps the 3-Tier Validation pipeline onto OpenUI Lang:
//   Tier 1: OpenUI syntax — parse failures, unknown components, unresolved
//           references, unsupported features (Query/Mutation), wrong root.
//   Tier 2: Structural schema — OpenUI required-argument checks, then the
//           subdomain Zod `SectionSchema` on the compiled section data.
//   Tier 3: Semantic reference integrity — subdomain validators, plus
//           statements that are defined but never used.
// Diagnostics carry the source line of the statement that produced them.
// ============================================================================

import { compileOUISection, type OUIIssue, type OUISectionPayload, type OUISourceMap } from '../composition/oui/compile'
import { contextToDiagnostic } from './types'
import type { ValidationContext, ValidationDiagnostic, ValidationResult } from './types'
import { tier2Validate, tier3Validate } from './gateway'

function issueToDiagnostic(issue: OUIIssue, context?: ValidationContext): ValidationDiagnostic {
  const where = [issue.component, issue.path].filter(Boolean).join('')
  return {
    tier: issue.tier,
    line: issue.line,
    field: issue.statementId ? `${issue.statementId}${where ? ` (${where})` : ''}` : where || undefined,
    message: issue.message,
    fixHint: issue.fixHint,
    ...contextToDiagnostic(context),
  }
}

/**
 * Find the source line for a dotted data path (e.g. "questions.1.choices.0" or "edges[2].from")
 * by walking the compiled data and keeping the deepest object whose
 * producing statement is known.
 */
function lineForDataPath(data: unknown, field: string | undefined, sourceMap: OUISourceMap): number | undefined {
  let line = sourceMap.lineOf('root')
  if (!field) return line
  let cursor: unknown = data
  for (const key of field.replace(/\[(\d+)\]/g, '.$1').split('.')) {
    if (!cursor || typeof cursor !== 'object') break
    cursor = (cursor as Record<string, unknown>)[key]
    const statement = sourceMap.statementOf(cursor)
    const statementLine = statement ? sourceMap.lineOf(statement) : undefined
    if (statementLine) line = statementLine
  }
  return line
}

/**
 * Execute the full 3-Tier Validation pipeline on an OpenUI Lang section source.
 *
 * @param source - `.oui` section file contents
 * @param context - File/topic context for diagnostic attribution
 * @returns ValidationResult whose payload is the compiled section (meta + data),
 *          or null when tier 1 prevented compilation.
 */
export function validateOUISection(
  source: string,
  context?: ValidationContext,
): ValidationResult<OUISectionPayload | null> {
  const compiled = compileOUISection(source)
  const diagnostics = compiled.issues.map((issue) => issueToDiagnostic(issue, context))
  const payload = compiled.value

  if (payload && !diagnostics.some((d) => d.tier === 1)) {
    const data = payload.data as unknown as Record<string, unknown>
    const tier2 = tier2Validate(data, payload.meta.type, context)
    for (const diag of tier2.diagnostics) {
      diagnostics.push({ ...diag, line: lineForDataPath(data, diag.field, compiled.sourceMap) })
    }
    for (const diag of tier3Validate(data, payload.meta.type, context)) {
      diagnostics.push({ ...diag, line: diag.line ?? lineForDataPath(data, diag.field, compiled.sourceMap) })
    }
  }

  let status: ValidationResult['status'] = 'valid'
  if (diagnostics.some((d) => d.tier === 1 || d.tier === 2)) status = 'error'
  else if (diagnostics.some((d) => d.tier === 3)) status = 'warning'

  return {
    status,
    payload: diagnostics.some((d) => d.tier === 1) ? null : payload,
    diagnostics,
  }
}
