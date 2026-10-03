// Loads the bundled extension against a minimal `vscode` stub and exercises
// every registered provider end to end.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import Module from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const registered = {}
const diagnostics = new Map()

class Position { constructor(line, character) { Object.assign(this, { line, character }) } }
class Range { constructor(start, end) { Object.assign(this, { start, end }) } }

const vscode = {
  Position,
  Range,
  CompletionItemKind: { Class: 6, Variable: 5, Function: 2, Keyword: 13, EnumMember: 19, Reference: 17, Snippet: 14 },
  DiagnosticSeverity: { Error: 0, Warning: 1 },
  SymbolKind: { Module: 1, Variable: 12, Object: 18 },
  FileType: { File: 1, Directory: 2 },
  CompletionItem: class { constructor(label, kind) { Object.assign(this, { label, kind }) } },
  SnippetString: class { constructor(value) { this.value = value } },
  MarkdownString: class { constructor(value) { this.value = value } },
  SignatureInformation: class { constructor(label, documentation) { Object.assign(this, { label, documentation }) } },
  ParameterInformation: class { constructor(label, documentation) { Object.assign(this, { label, documentation }) } },
  SignatureHelp: class {},
  Hover: class { constructor(contents, range) { Object.assign(this, { contents, range }) } },
  Location: class { constructor(uri, range) { Object.assign(this, { uri, range }) } },
  DocumentSymbol: class { constructor(name, detail, kind, range, selectionRange) { Object.assign(this, { name, detail, kind, range, selectionRange }) } },
  Diagnostic: class { constructor(range, message, severity) { Object.assign(this, { range, message, severity }) } },
  Uri: { file: (fsPath) => ({ fsPath, scheme: 'file' }) },
  workspace: {
    textDocuments: [],
    fs: { readDirectory: async () => [['intro.oui', 1], ['quiz.oui', 1], ['notes.md', 1]] },
    onDidOpenTextDocument: () => ({}),
    onDidChangeTextDocument: () => ({}),
    onDidCloseTextDocument: () => ({}),
  },
  languages: {
    createDiagnosticCollection: () => ({ set: (uri, d) => diagnostics.set(uri.fsPath, d), delete() {} }),
    registerCompletionItemProvider: (_s, provider, ...triggers) => (registered.completion = { provider, triggers }),
    registerSignatureHelpProvider: (_s, provider) => (registered.signature = provider),
    registerHoverProvider: (_s, provider) => (registered.hover = provider),
    registerDefinitionProvider: (_s, provider) => (registered.definition = provider),
    registerDocumentSymbolProvider: (_s, provider) => (registered.symbols = provider),
  },
}

const originalLoad = Module._load
Module._load = function (request, ...rest) {
  return request === 'vscode' ? vscode : originalLoad.call(this, request, ...rest)
}
const require = Module.createRequire(import.meta.url)
const extension = require(path.join(here, '../dist/extension.js'))

function doc(text, fsPath = '/content/demo/sections/quiz.oui') {
  const offsetAt = (pos) => text.split('\n').slice(0, pos.line).reduce((n, l) => n + l.length + 1, 0) + pos.character
  const positionAt = (offset) => {
    const before = text.slice(0, offset).split('\n')
    return new Position(before.length - 1, before[before.length - 1].length)
  }
  return { getText: () => text, languageId: 'oui', uri: { fsPath, scheme: 'file', toString: () => fsPath }, offsetAt, positionAt }
}

const subscriptions = []
const quiz = doc('root = Quiz("Check", [q1])\nq1 = QuizQuestion("q1", "Why?", [c])\nc = QuizChoice("a", "A", true)')
vscode.workspace.textDocuments.push(quiz)
extension.activate({ subscriptions })

test('reports diagnostics for open documents', () => {
  const [d] = diagnostics.get('/content/demo/sections/quiz.oui')
  assert.equal(d.severity, vscode.DiagnosticSeverity.Error)
  assert.match(d.message, /explanation/)
  assert.match(d.message, /Hint:/)
  assert.equal(d.source, 'loom (tier 2)')
  assert.deepEqual([d.range.start.line, d.range.start.character], [2, 0])
})

test('provides snippet completions', async () => {
  const text = 'root = Quiz("T", [])'
  const items = await registered.completion.provider.provideCompletionItems(doc(text), new Position(0, 18))
  const question = items.find((i) => i.label === 'QuizQuestion')
  assert.equal(question.insertText.value, 'QuizQuestion("${1:id}", "${2:question}", [${3}])')
  assert.equal(question.command.command, 'editor.action.triggerParameterHints')
  assert.ok(registered.completion.triggers.includes('('))
})

test('completes section names from disk in topic.oui', async () => {
  const text = 'root = Topic("T", "C", "D", [SectionRef("")])'
  const items = await registered.completion.provider.provideCompletionItems(doc(text, '/content/demo/topic.oui'), new Position(0, 41))
  assert.deepEqual(items.map((i) => i.label), ['intro', 'quiz'])
})

test('provides signature help, hover, definition and symbols', () => {
  const text = 'root = Text("T", [p])\np = "Hello"'
  const d = doc(text)
  const help = registered.signature.provideSignatureHelp(d, new Position(0, 17))
  assert.equal(help.activeParameter, 1)
  assert.match(help.signatures[0].label, /^Text\(title: string, paragraphs: string\[\]/)

  const hover = registered.hover.provideHover(d, new Position(0, 9))
  assert.match(hover.contents.value, /```openui\nText\(/)

  const location = registered.definition.provideDefinition(d, new Position(0, 18))
  assert.deepEqual([location.range.start.line, location.range.start.character], [1, 0])

  const symbols = registered.symbols.provideDocumentSymbols(d)
  assert.deepEqual(symbols.map((s) => [s.name, s.detail]), [['root', 'Text'], ['p', '']])
})
