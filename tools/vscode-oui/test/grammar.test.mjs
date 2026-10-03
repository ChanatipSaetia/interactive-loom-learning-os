// Tokenizes sample OpenUI Lang with the real TextMate engine VS Code uses.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import vsctm from 'vscode-textmate'
import oniguruma from 'vscode-oniguruma'

const require = createRequire(import.meta.url)
const here = path.dirname(fileURLToPath(import.meta.url))
const wasm = fs.readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm')).buffer
await oniguruma.loadWASM(wasm)

const registry = new vsctm.Registry({
  onigLib: Promise.resolve({
    createOnigScanner: (patterns) => new oniguruma.OnigScanner(patterns),
    createOnigString: (s) => new oniguruma.OnigString(s),
  }),
  loadGrammar: async () => vsctm.parseRawGrammar(
    fs.readFileSync(path.join(here, '../syntaxes/oui.tmLanguage.json'), 'utf8'),
    'oui.tmLanguage.json',
  ),
})
const grammar = await registry.loadGrammar('source.oui')

/** Map each token text on a line to its most specific scope. */
function scopes(source) {
  let state = vsctm.INITIAL
  const out = []
  for (const line of source.split('\n')) {
    const result = grammar.tokenizeLine(line, state)
    for (const t of result.tokens) {
      const text = line.slice(t.startIndex, t.endIndex)
      if (text.trim()) out.push([text.trim(), t.scopes[t.scopes.length - 1]])
    }
    state = result.ruleStack
  }
  return out
}

const find = (tokens, text) => tokens.find(([t]) => t === text)?.[1]

test('highlights statements, calls and values', () => {
  const tokens = scopes([
    '// Knowledge check',
    '$level = "beginner"',
    'root = Quiz("Check " + $level, [q1], null)',
    'q1 = QuizQuestion("q1", "Count: \\"3\\"", [QuizChoice("a", "A", true, "Yes")])',
    'n = Text("x", ["" + @Count([1, 2.5])])',
    'c = TradeoffChoice("a", "A", "d", {perf: -10}, [], [])',
  ].join('\n'))

  assert.equal(find(tokens, '// Knowledge check'), 'comment.line.double-slash.oui')
  assert.equal(find(tokens, '$level'), 'variable.other.state.definition.oui')
  assert.equal(find(tokens, 'root'), 'keyword.other.root.oui')
  assert.equal(find(tokens, 'Quiz'), 'entity.name.function.component.oui')
  assert.equal(find(tokens, 'q1'), 'variable.other.reference.oui')
  assert.equal(find(tokens, 'QuizChoice'), 'entity.name.function.component.oui')
  assert.equal(find(tokens, 'true'), 'constant.language.oui')
  assert.equal(find(tokens, 'null'), 'constant.language.oui')
  assert.equal(find(tokens, '\\"'), 'constant.character.escape.oui')
  assert.equal(find(tokens, '@Count'), 'support.function.builtin.oui')
  assert.equal(find(tokens, '2.5'), 'constant.numeric.oui')
  assert.equal(find(tokens, 'perf'), 'variable.other.property.oui')
  assert.equal(find(tokens, '-10'), 'constant.numeric.oui')
})

test('marks statement definitions and keeps multi-line arguments highlighted', () => {
  const tokens = scopes([
    'place = Step(',
    '  "place-order",',
    '  orders,',
    ')',
  ].join('\n'))
  assert.equal(find(tokens, 'place'), 'entity.name.variable.definition.oui')
  assert.equal(find(tokens, 'orders'), 'variable.other.reference.oui')
  assert.match(find(tokens, '"place-order"') ?? find(tokens, 'place-order') ?? '', /string\.quoted\.double/)
})

test('does not treat comparisons as definitions', () => {
  const tokens = scopes('$a = 1\nroot = Text($a == 1 ? "x" : "y", [])')
  assert.equal(find(tokens, '=='), 'keyword.operator.oui')
})
