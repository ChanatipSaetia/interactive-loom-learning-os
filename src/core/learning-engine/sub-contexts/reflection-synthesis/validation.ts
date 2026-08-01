/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ValidationDiagnostic, ValidationContext } from '../../validation/types'
import { contextToDiagnostic } from '../../validation/types'

/**
 * Tier 3: Semantic Reference Integrity for Metacognitive Reflection & Synthesis.
 * Validates 'reflection-sequence' and 'reflection-template' cross-references.
 */
export function validateReflectionSynthesisTier3(
  data: Record<string, unknown>,
  sectionType: string,
  context?: ValidationContext
): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = []
  const ctx = contextToDiagnostic(context)

  switch (sectionType) {
    case 'reflection-sequence': {
      const challenges = Array.isArray(data.challenges) ? data.challenges : []
      challenges.forEach((ch: any, idx: number) => {
        if (!ch || typeof ch !== 'object') return
        const itemIds = new Set(
          (Array.isArray(ch.items) ? ch.items : []).map((item: any) => item?.id).filter(Boolean)
        )
        const solution = Array.isArray(ch.solution) ? ch.solution : []
        solution.forEach((solId: any, sIdx: number) => {
          if (itemIds.size > 0 && !itemIds.has(String(solId))) {
            diagnostics.push({
              tier: 3,
              field: `challenges[${idx}].solution[${sIdx}]`,
              message: `Challenge #${idx} solution references unknown item ID "${solId}".`,
              fixHint: `Valid item IDs: [${[...itemIds].map((i) => `"${i}"`).join(', ')}]`,
              ...ctx,
            })
          }
        })
      })
      break
    }

    case 'reflection-template': {
      const challenges = Array.isArray(data.challenges) ? data.challenges : []
      challenges.forEach((ch: any, idx: number) => {
        if (!ch || typeof ch !== 'object') return
        const chipIds = new Set(
          (Array.isArray(ch.chips) ? ch.chips : []).map((chip: any) => chip?.id).filter(Boolean)
        )
        const solution = ch.solution
        const solutionZones = new Set<string>()

        if (solution && typeof solution === 'object' && !Array.isArray(solution)) {
          for (const [zoneId, chipId] of Object.entries(solution)) {
            solutionZones.add(zoneId)
            if (chipIds.size > 0 && !chipIds.has(String(chipId))) {
              diagnostics.push({
                tier: 3,
                field: `challenges[${idx}].solution.${zoneId}`,
                message: `Challenge #${idx} solution zone "${zoneId}" references unknown chip "${chipId}".`,
                fixHint: `Valid chip IDs: [${[...chipIds].map((c) => `"${c}"`).join(', ')}]`,
                ...ctx,
              })
            }
          }
        }

        // Cross-reference template placeholders against solution keys
        if (typeof ch.template === 'string') {
          const templateZones = new Set<string>()
          const regex = /\{([a-zA-Z0-9_-]+)\}/g
          let match
          while ((match = regex.exec(ch.template)) !== null) {
            templateZones.add(match[1])
          }

          templateZones.forEach((zoneId) => {
            if (!solutionZones.has(zoneId)) {
              diagnostics.push({
                tier: 3,
                field: `challenges[${idx}].template`,
                message: `Challenge #${idx} template placeholder "{${zoneId}}" is missing from solution.`,
                fixHint: `Add "${zoneId}" to challenge #${idx} solution mapping.`,
                ...ctx,
              })
            }
          })

          solutionZones.forEach((zoneId) => {
            if (templateZones.size > 0 && !templateZones.has(zoneId)) {
              diagnostics.push({
                tier: 3,
                field: `challenges[${idx}].solution.${zoneId}`,
                message: `Challenge #${idx} solution defines zone "${zoneId}" which is not present in template.`,
                fixHint: `Ensure template contains placeholder "{${zoneId}}" or remove it from solution.`,
                ...ctx,
              })
            }
          })
        }
      })
      break
    }
  }

  return diagnostics
}
