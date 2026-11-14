import { checkFormulaModel } from '../../validation/quantitative'
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ValidationDiagnostic, ValidationContext } from '../../validation/types'
import { contextToDiagnostic } from '../../validation/types'

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
      for (const diagnostic of checkFormulaModel(data).diagnostics) diagnostics.push({
        tier: 3, severity: diagnostic.severity, code: diagnostic.code, field: diagnostic.path,
        message: diagnostic.message, fixHint: diagnostic.fixHint, ...ctx,
      })
      break
    }
  }

  return diagnostics
}
