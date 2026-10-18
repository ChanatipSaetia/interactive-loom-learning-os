/** A formula's value for the variables (and earlier metrics) in scope; 0 when it does not evaluate. */
export function evaluateFormula(formulaStr: string, variablesState: Record<string, number>): number {
  let expression = formulaStr
  for (const [key, val] of Object.entries(variablesState)) {
    const regex = new RegExp(`\\b${key}\\b`, 'g')
    expression = expression.replace(regex, String(val))
  }

  try {
    // Safe evaluation using Function
    const fn = new Function('Math', `return (${expression})`)
    return fn(Math)
  } catch (err) {
    console.error('Failed to evaluate formula:', formulaStr, 'Expression:', expression, err)
    return 0
  }
}
