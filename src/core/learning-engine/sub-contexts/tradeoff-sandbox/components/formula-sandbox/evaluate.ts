import { evaluateExpression } from './expression'

/** A formula's value for the variables (and earlier metrics) in scope; 0 when it does not evaluate. */
export function evaluateFormula(formulaStr: string, variablesState: Record<string, number>): number {
  try {
    // Parsed rather than compiled: `new Function` is blocked inside chat apps (no unsafe-eval)
    return evaluateExpression(formulaStr, variablesState)
  } catch (err) {
    console.error('Failed to evaluate formula:', formulaStr, err)
    return 0
  }
}
