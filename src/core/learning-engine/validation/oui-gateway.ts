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

import { compileOUINarration, compileOUISection, indexStatementLines, type OUIIssue, type OUISectionPayload, type OUISourceMap } from '../composition/oui/compile'
import { getLoomOUIComponent } from '../composition/oui/library'
import { targetProp, targetStatement, type NarrationData } from '../composition/oui/narration'
import { bundleToSections } from '../composition/okf/sections'
import { coreBeatsOf } from '../registry/register-core-presenters'
import type { Beat } from '../sub-contexts/present-kernel'
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

/** Each top-level statement of a section source and the component it calls (`q2 = Question(…)` → q2: Question). */
function statementComponents(source: string): Map<string, string | undefined> {
  const out = new Map<string, string | undefined>()
  for (const name of indexStatementLines(source).keys()) {
    const call = new RegExp(`^${name.replace(/[$]/g, '\\$&')}\\s*=\\s*([A-Z][\\w.]*)\\s*\\(`, 'm').exec(source)
    out.set(name, call?.[1])
  }
  return out
}

/**
 * The beats a section plays in Present mode, from its source (decision 108): their IDs are what a
 * narration file's steps name. Null when the section does not compile.
 */
export function sectionBeatsOf(sectionSource: string): Beat[] | null {
  const payload = validateOUISection(sectionSource).payload
  return payload ? coreBeatsOf(bundleToSections([payload])[0]) : null
}

/**
 * Validate a narration file `sections/<name>.narrate.oui` (decisions 91–95 and 108 in
 * grill-log-presenting-mode.md) against its section's source. Tier 1–2 come from the compiler;
 * tier 3 checks that every step names a beat of the section and every target names a statement of
 * the section (and a prop of its component).
 *
 * @param sectionSource - The section's `.oui` source, or undefined when the topic has no such section
 */
export function validateOUINarration(
  source: string,
  sectionSource: string | undefined,
  context?: ValidationContext,
): ValidationResult<NarrationData | null> {
  const compiled = compileOUINarration(source)
  const diagnostics = compiled.issues.map((issue) => issueToDiagnostic(issue, context))
  const narration = compiled.value
  const section = context?.sectionName ? `sections/${context.sectionName}.oui` : 'its section file'

  if (sectionSource === undefined) {
    diagnostics.push({
      tier: 3,
      line: 1,
      message: `There is no ${section} for this narration to play with.`,
      fixHint: 'Name the file after a section of the topic: sections/<name>.narrate.oui next to sections/<name>.oui.',
      ...contextToDiagnostic(context),
    })
  } else if (narration && !diagnostics.some((d) => d.tier === 1)) {
    const statements = statementComponents(sectionSource)
    const names = [...statements.keys()]
    const beats = sectionBeatsOf(sectionSource)?.map((b) => b.id)
    for (const step of narration.steps ?? []) {
      if (beats && !beats.includes(step.beat)) {
        diagnostics.push({
          tier: 3,
          line: compiled.sourceMap.lineOf(compiled.sourceMap.statementOf(step) ?? 'root'),
          field: step.beat,
          message: `"${step.beat}" is not a beat of ${section}, so this step never plays.`,
          fixHint: `Its beats are ${beats.slice(0, 16).join(', ')}${beats.length > 16 ? ', …' : ''}.`,
          ...contextToDiagnostic(context),
        })
      }
      for (const effect of step.effects ?? []) {
        const line = compiled.sourceMap.lineOf(compiled.sourceMap.statementOf(effect) ?? compiled.sourceMap.statementOf(step) ?? 'root')
        for (const target of effect.kind === 'spotlight' ? effect.targets : [effect.target]) {
          const statement = targetStatement(target)
          if (!statements.has(statement)) {
            diagnostics.push({
              tier: 3,
              line,
              field: target,
              message: `"${target}" does not name a statement of ${section}.`,
              fixHint: `Point at one of its statements: ${names.slice(0, 12).join(', ')}${names.length > 12 ? ', …' : ''}.`,
              ...contextToDiagnostic(context),
            })
            continue
          }
          const prop = targetProp(target)
          const component = getLoomOUIComponent(statements.get(statement) ?? '')
          const shape = (component?.definition as unknown as { props?: { shape?: Record<string, unknown> } } | undefined)?.props?.shape
          if (prop && shape && !(prop in shape)) {
            diagnostics.push({
              tier: 3,
              line,
              field: target,
              message: `"${target}": ${component?.name} has no prop "${prop}".`,
              fixHint: `Its props are ${Object.keys(shape).join(', ')}.`,
              ...contextToDiagnostic(context),
            })
          }
        }
      }
      if (!step.caption && !step.effects?.length) {
        diagnostics.push({
          tier: 3,
          line: compiled.sourceMap.lineOf(compiled.sourceMap.statementOf(step) ?? 'root'),
          message: 'This step has no caption and no effects, so it shows nothing.',
          fixHint: 'Give it a caption or an effect, or remove it.',
          ...contextToDiagnostic(context),
        })
      }
    }
  }

  let status: ValidationResult['status'] = 'valid'
  if (diagnostics.some((d) => d.tier === 1 || d.tier === 2)) status = 'error'
  else if (diagnostics.some((d) => d.tier === 3)) status = 'warning'
  return { status, payload: diagnostics.some((d) => d.tier === 1) ? null : narration, diagnostics }
}
