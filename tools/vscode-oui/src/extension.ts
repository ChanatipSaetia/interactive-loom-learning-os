/**
 * VS Code extension for Loom OpenUI Lang (`.oui`) files.
 *
 * A thin adapter: every feature is computed by the shared language service
 * in src/core/supporting/authoring-editor/oui-language, which is bundled
 * into this extension at build time (so rebuild after changing the Loom
 * component library).
 */
import * as path from 'path'
import * as vscode from 'vscode'
import {
  fileKindFromPath,
  getCompletions,
  getDefinition,
  getDiagnostics,
  getDocumentSymbols,
  getHover,
  getSignatureHelp,
  type OUICompletionKind,
  type OUIRange,
  type OUIWorkspaceHints,
} from '../../../src/core/supporting/authoring-editor/oui-language'

const LANGUAGE = 'oui'
const SELECTOR: vscode.DocumentSelector = { language: LANGUAGE }

const COMPLETION_KINDS: Record<OUICompletionKind, vscode.CompletionItemKind> = {
  component: vscode.CompletionItemKind.Class,
  reference: vscode.CompletionItemKind.Variable,
  state: vscode.CompletionItemKind.Variable,
  builtin: vscode.CompletionItemKind.Function,
  keyword: vscode.CompletionItemKind.Keyword,
  value: vscode.CompletionItemKind.EnumMember,
  id: vscode.CompletionItemKind.Reference,
  snippet: vscode.CompletionItemKind.Snippet,
}

function toRange(document: vscode.TextDocument, range: OUIRange): vscode.Range {
  return new vscode.Range(document.positionAt(range.start), document.positionAt(range.end))
}

function markdown(text: string): vscode.MarkdownString {
  const md = new vscode.MarkdownString(text.replace(/```oui\n/g, '```openui\n'))
  md.supportHtml = false
  return md
}

/** Section / topic names on disk next to the current file, for ID completions. */
async function workspaceHints(document: vscode.TextDocument): Promise<OUIWorkspaceHints> {
  if (document.uri.scheme !== 'file') return {}
  const dir = path.dirname(document.uri.fsPath)
  const kind = fileKindFromPath(document.uri.fsPath)
  const list = async (folder: string) => {
    try {
      return await vscode.workspace.fs.readDirectory(vscode.Uri.file(folder))
    } catch {
      return []
    }
  }
  if (kind === 'catalog') {
    const entries = await list(dir)
    return { topicIds: entries.filter(([, type]) => type === vscode.FileType.Directory).map(([name]) => name) }
  }
  const sectionsDir = kind === 'topic' ? path.join(dir, 'sections') : dir
  const entries = await list(sectionsDir)
  return {
    sectionNames: entries
      .filter(([name, type]) => type === vscode.FileType.File && name.endsWith('.oui'))
      .map(([name]) => name.slice(0, -'.oui'.length)),
  }
}

function registerDiagnostics(context: vscode.ExtensionContext) {
  const collection = vscode.languages.createDiagnosticCollection(LANGUAGE)
  const timers = new Map<string, NodeJS.Timeout>()

  const refresh = (document: vscode.TextDocument) => {
    if (document.languageId !== LANGUAGE) return
    const source = document.getText()
    const diagnostics = getDiagnostics(source, fileKindFromPath(document.uri.fsPath)).map((d) => {
      const message = d.fixHint ? `${d.message}\nHint: ${d.fixHint}` : d.message
      const diagnostic = new vscode.Diagnostic(
        toRange(document, d.range),
        message,
        d.severity === 'warning' ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Error,
      )
      diagnostic.source = `loom (tier ${d.tier})`
      return diagnostic
    })
    collection.set(document.uri, diagnostics)
  }

  const schedule = (document: vscode.TextDocument) => {
    const key = document.uri.toString()
    clearTimeout(timers.get(key))
    timers.set(key, setTimeout(() => refresh(document), 250))
  }

  vscode.workspace.textDocuments.forEach(refresh)
  context.subscriptions.push(
    collection,
    vscode.workspace.onDidOpenTextDocument(refresh),
    vscode.workspace.onDidChangeTextDocument((e) => schedule(e.document)),
    vscode.workspace.onDidCloseTextDocument((d) => collection.delete(d.uri)),
  )
}

export function activate(context: vscode.ExtensionContext) {
  registerDiagnostics(context)

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(SELECTOR, {
      async provideCompletionItems(document, position) {
        const source = document.getText()
        const offset = document.offsetAt(position)
        const items = getCompletions(source, offset, fileKindFromPath(document.uri.fsPath), await workspaceHints(document))
        return items.map((item) => {
          const completion = new vscode.CompletionItem(item.label, COMPLETION_KINDS[item.kind])
          completion.insertText = item.isSnippet ? new vscode.SnippetString(item.insertText) : item.insertText
          completion.range = toRange(document, item.replace)
          completion.sortText = item.sortText
          completion.detail = item.detail
          if (item.documentation) completion.documentation = markdown(item.documentation)
          if (item.kind === 'component' || item.kind === 'builtin') {
            completion.command = { command: 'editor.action.triggerParameterHints', title: 'Signature help' }
          }
          return completion
        })
      },
    }, '(', ',', '[', '"', '$', '@', '{'),

    vscode.languages.registerSignatureHelpProvider(SELECTOR, {
      provideSignatureHelp(document, position) {
        const help = getSignatureHelp(document.getText(), document.offsetAt(position))
        if (!help) return null
        const signature = new vscode.SignatureInformation(help.label, help.documentation ? markdown(help.documentation) : undefined)
        signature.parameters = help.parameters.map((p) => new vscode.ParameterInformation(p.label, p.documentation ? markdown(p.documentation) : undefined))
        const result = new vscode.SignatureHelp()
        result.signatures = [signature]
        result.activeSignature = 0
        result.activeParameter = help.activeParameter
        return result
      },
    }, { triggerCharacters: ['(', ','], retriggerCharacters: [','] }),

    vscode.languages.registerHoverProvider(SELECTOR, {
      provideHover(document, position) {
        const hover = getHover(document.getText(), document.offsetAt(position))
        return hover ? new vscode.Hover(markdown(hover.contents), toRange(document, hover.range)) : null
      },
    }),

    vscode.languages.registerDefinitionProvider(SELECTOR, {
      provideDefinition(document, position) {
        const range = getDefinition(document.getText(), document.offsetAt(position))
        return range ? new vscode.Location(document.uri, toRange(document, range)) : null
      },
    }),

    vscode.languages.registerDocumentSymbolProvider(SELECTOR, {
      provideDocumentSymbols(document) {
        return getDocumentSymbols(document.getText()).map((s) => new vscode.DocumentSymbol(
          s.name,
          s.component ?? '',
          s.name === 'root' ? vscode.SymbolKind.Module : s.name.startsWith('$') ? vscode.SymbolKind.Variable : vscode.SymbolKind.Object,
          toRange(document, s.range),
          toRange(document, s.selectionRange),
        ))
      },
    }),
  )
}

export function deactivate() {}
