/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ValidationDiagnostic, ValidationContext } from '../../validation/types'
import { contextToDiagnostic } from '../../validation/types'

/**
 * Tier 3: Semantic Reference Integrity for Knowledge Verification & Practice.
 * Validates 'quiz' and 'concept-map' cross-references.
 */
export function validatePracticeAssessmentTier3(
  data: Record<string, unknown>,
  sectionType: string,
  context?: ValidationContext
): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = []
  const ctx = contextToDiagnostic(context)

  switch (sectionType) {
    case 'quiz': {
      const questions = Array.isArray(data.questions) ? data.questions : []
      questions.forEach((q: any, qIdx: number) => {
        if (!q || typeof q !== 'object') return
        const choices = Array.isArray(q.choices) ? q.choices : []
        const choiceIds = new Set(choices.map((c: any) => c?.id).filter(Boolean))

        const correctCount = choices.filter((c: any) => c?.correct === true).length
        if (choices.length > 0 && correctCount !== 1) {
          diagnostics.push({
            tier: 3,
            field: `questions[${qIdx}].choices`,
            message:
              correctCount === 0
                ? `Quiz question #${qIdx + 1} has no choice marked "correct: true" — exactly one choice must be correct.`
                : `Quiz question #${qIdx + 1} has ${correctCount} choices marked "correct: true" — exactly one choice must be correct.`,
            fixHint:
              correctCount === 0
                ? 'Mark exactly one choice with "correct: true".'
                : 'Keep exactly one choice with "correct: true" and set the others to "correct: false".',
            ...ctx,
          })
        }

        if (q.correctAnswer !== undefined && typeof q.correctAnswer === 'string') {
          if (!choiceIds.has(q.correctAnswer)) {
            diagnostics.push({
              tier: 3,
              field: `questions[${qIdx}].correctAnswer`,
              message: `Quiz question #${qIdx + 1} correctAnswer "${q.correctAnswer}" does not match any choice ID.`,
              fixHint: `Valid choice IDs: [${[...choiceIds].map((c) => `"${c}"`).join(', ')}]`,
              ...ctx,
            })
          }
        }
      })
      break
    }

    case 'concept-map': {
      const rawNodes = data.nodes
      let nodeIds: string[] = []
      if (rawNodes && typeof rawNodes === 'object' && !Array.isArray(rawNodes)) {
        nodeIds = Object.keys(rawNodes)
      } else if (Array.isArray(rawNodes)) {
        nodeIds = rawNodes.map((n: any) => n?.id).filter(Boolean)
      }

      const edges = Array.isArray(data.edges) ? data.edges : []
      edges.forEach((edge: any, idx: number) => {
        if (!edge || typeof edge !== 'object') return
        const from = edge.from || edge.source
        const to = edge.to || edge.target
        if (from && !nodeIds.includes(String(from))) {
          diagnostics.push({
            tier: 3,
            field: `edges[${idx}].from`,
            message: `Edge #${idx} references unknown source node "${from}".`,
            fixHint: `Valid node IDs: [${nodeIds.map((n) => `"${n}"`).join(', ')}]`,
            ...ctx,
          })
        }
        if (to && !nodeIds.includes(String(to))) {
          diagnostics.push({
            tier: 3,
            field: `edges[${idx}].to`,
            message: `Edge #${idx} references unknown target node "${to}".`,
            fixHint: `Valid node IDs: [${nodeIds.map((n) => `"${n}"`).join(', ')}]`,
            ...ctx,
          })
        }
      })
      break
    }
  }

  return diagnostics
}
