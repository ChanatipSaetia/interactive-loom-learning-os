/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ValidationDiagnostic, ValidationContext } from '../../validation/types'
import { contextToDiagnostic } from '../../validation/types'

function extractFormulaVariableRefs(formula: string): string[] {
  const refs = new Set<string>()
  const matches = formula.match(/\$\{([^}]+)\}/g) || []
  for (const m of matches) {
    const inner = m.slice(2, -1).trim()
    if (inner && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(inner)) {
      refs.add(inner)
    }
  }
  return [...refs]
}

/**
 * Tier 3: Semantic Reference Integrity for Dynamic Trade-off & Parameter Exploration.
 * Validates 'decision-tree' and 'formula-sandbox' cross-references and bounds.
 */
export function validateTradeoffSandboxTier3(
  data: Record<string, unknown>,
  sectionType: string,
  context?: ValidationContext
): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = []
  const ctx = contextToDiagnostic(context)

  switch (sectionType) {
    case 'decision-tree': {
      const nodes = (data.nodes || {}) as Record<string, any>
      const root = data.root as string | undefined
      const validNodeKeys = Object.keys(nodes)

      if (root && !nodes[root]) {
        diagnostics.push({
          tier: 3,
          field: 'root',
          message: `Decision tree root "${root}" is not defined in nodes.`,
          fixHint: `Set "root" to one of: [${validNodeKeys.map((k) => `"${k}"`).join(', ')}]`,
          ...ctx,
        })
      }

      for (const [nodeId, node] of Object.entries(nodes)) {
        if (!node || typeof node !== 'object') continue
        const choices = Array.isArray(node.choices) ? node.choices : []
        choices.forEach((choice: any, idx: number) => {
          if (choice && choice.next && typeof choice.next === 'string') {
            if (!nodes[choice.next]) {
              diagnostics.push({
                tier: 3,
                field: `nodes.${nodeId}.choices[${idx}].next`,
                message: `Choice "${choice.text || idx}" in node "${nodeId}" targets unknown node "${choice.next}".`,
                fixHint: `Set "next" to a valid node: [${validNodeKeys.map((k) => `"${k}"`).join(', ')}]`,
                ...ctx,
              })
            }
          }
        })
      }
      break
    }

    case 'formula-sandbox': {
      const vars = Array.isArray(data.variables) ? data.variables : []
      const varIds = new Set(vars.map((v: any) => v?.id).filter(Boolean))
      vars.forEach((v: any, idx: number) => {
        const varLabel = v?.id || `variables[${idx}]`
        if (typeof v.min === 'number' && typeof v.max === 'number' && v.min > v.max) {
          diagnostics.push({
            tier: 3,
            field: `variables[${idx}]`,
            message: `Variable "${varLabel}" has min (${v.min}) > max (${v.max}).`,
            fixHint: `Ensure min <= max for variable "${varLabel}".`,
            ...ctx,
          })
        }
        if (
          typeof v.defaultValue === 'number' &&
          typeof v.min === 'number' &&
          typeof v.max === 'number'
        ) {
          if (v.defaultValue < v.min || v.defaultValue > v.max) {
            diagnostics.push({
              tier: 3,
              field: `variables[${idx}].defaultValue`,
              message: `Variable "${varLabel}" defaultValue (${v.defaultValue}) is outside bounds [${v.min}, ${v.max}].`,
              fixHint: `Set defaultValue between ${v.min} and ${v.max}.`,
              ...ctx,
            })
          }
        }
      })

      const metrics = Array.isArray(data.metrics) ? data.metrics : []
      metrics.forEach((m: any, idx: number) => {
        if (!m || typeof m !== 'object') return
        if (m.formula && typeof m.formula === 'string') {
          const formulaVars = extractFormulaVariableRefs(m.formula)
          for (const ref of formulaVars) {
            if (!varIds.has(ref)) {
              diagnostics.push({
                tier: 3,
                field: `metrics[${idx}].formula`,
                message: `Metric "${m.id || idx}" formula references unknown variable "${ref}".`,
                fixHint: `Valid variable IDs: [${[...varIds].map((v) => `"${v}"`).join(', ')}]`,
                ...ctx,
              })
            }
          }
        }
      })
      break
    }
  }

  return diagnostics
}
