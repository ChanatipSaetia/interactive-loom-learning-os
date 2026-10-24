// @ts-expect-error Node's fs has no types in this project (see tests/unit/sections/present/helpers.ts)
import { readFileSync, readdirSync } from 'fs'
import { describe, expect, it, vi } from 'vitest'
import { evaluateExpression } from '../../../../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/components/formula-sandbox/expression'
import { evaluateFormula } from '../../../../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/components/formula-sandbox/evaluate'

/** What JavaScript itself makes of a formula (the old evaluator), as a number. */
function javascript(formula: string, vars: Record<string, number>): number {
  return Number(new Function('Math', ...Object.keys(vars), `return (${formula})`)(Math, ...Object.values(vars)))
}

/** Every formula in every topic, with the IDs of the variables and metrics before it. */
function topicFormulas(): Array<{ file: string; formula: string; names: string[] }> {
  const out: Array<{ file: string; formula: string; names: string[] }> = []
  for (const topic of readdirSync('public/content') as string[]) {
    let files: string[] = []
    try { files = readdirSync(`public/content/${topic}/sections`) } catch { continue }
    for (const f of files.filter((n) => n.endsWith('.oui'))) {
      const text = readFileSync(`public/content/${topic}/sections/${f}`, 'utf8')
      if (!text.includes('FormulaSandbox(')) continue
      const names = [...text.matchAll(/Formula(?:Variable|Metric)\(\s*"([\w$]+)"/g)].map((m) => m[1])
      for (const m of text.matchAll(/FormulaMetric\(\s*"[\w$]+"\s*,\s*"[^"]*"\s*,\s*"((?:[^"\\]|\\.)*)"/g)) {
        out.push({ file: `${topic}/sections/${f}`, formula: m[1], names })
      }
    }
  }
  return out
}

describe('formula expressions without new Function', () => {
  it('reads the operators, Math and the conditional', () => {
    expect(evaluateExpression('1 + 2 * 3 - 4 / 2', {})).toBe(5)
    expect(evaluateExpression('2 ** 3 ** 2', {})).toBe(512)
    expect(evaluateExpression('-x + 10 % 4', { x: 2 })).toBe(0)
    expect(evaluateExpression('Math.round(Math.PI * Math.pow(r, 2))', { r: 3 })).toBe(28)
    expect(evaluateExpression('Math.max(5, Math.min(1, 2), x)', { x: 7 })).toBe(7)
    expect(evaluateExpression('(x < 50 ? 1 : 0) + (x >= 50 && x !== 60)', { x: 55 })).toBe(1)
    expect(evaluateExpression('!0 || 3', {})).toBe(1)
    expect(evaluateExpression('1.5e2 + .5', {})).toBe(150.5)
  })

  it('refuses anything that is not a formula', () => {
    for (const bad of ['alert(1)', 'x.constructor', 'Math.constructor', 'this', 'window', '1 +', '(1', 'Math.nope(1)', 'y']) {
      expect(() => evaluateExpression(bad, { x: 1 }), bad).toThrow()
    }
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(evaluateFormula('unknown * 2', { x: 1 })).toBe(0)
    log.mockRestore()
  })

  it('gives the same values as JavaScript for every formula in every topic', () => {
    const formulas = topicFormulas()
    expect(formulas.length).toBeGreaterThan(20)
    for (const { file, formula, names } of formulas) {
      for (let round = 0; round < 5; round++) {
        const vars = Object.fromEntries(names.map((n, i) => [n, ((i + 1) * 37 + round * 13) % 97 + 1]))
        const expected = javascript(formula, vars)
        expect(evaluateExpression(formula, vars), `${file}: ${formula}`).toBe(expected)
      }
    }
  })
})
