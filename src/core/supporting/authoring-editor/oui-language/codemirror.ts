/**
 * CodeMirror 6 support for OpenUI Lang, backed by the shared language service.
 *
 * `ouiEditorExtensions()` bundles highlighting, autocomplete (snippets for
 * every required argument), a signature tooltip that follows the cursor,
 * hovers, gateway diagnostics, and go-to-definition (F12 / Mod-click).
 * Colors use the Catppuccin `--ctp-*` CSS variables so the editor follows
 * the active Loom theme.
 */
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
  snippet,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { bracketMatching, HighlightStyle, indentOnInput, StreamLanguage, syntaxHighlighting, type StringStream } from '@codemirror/language'
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint'
import { EditorState, StateField, type Extension } from '@codemirror/state'
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  hoverTooltip,
  keymap,
  lineNumbers,
  showTooltip,
  type Tooltip,
} from '@codemirror/view'
import { tags } from '@lezer/highlight'
import {
  getCompletions,
  getDefinition,
  getDiagnostics,
  getHover,
  getSignatureHelp,
  type OUICompletion,
  type OUIFileKind,
  type OUIWorkspaceHints,
} from './service'

// ============================================================================
// Highlighting
// ============================================================================

interface TokenState {
  depth: number
}

function token(stream: StringStream, state: TokenState): string | null {
  if (stream.eatSpace()) return null
  if (stream.match('//')) {
    stream.skipToEnd()
    return 'comment'
  }
  const atStatementStart = state.depth === 0 && stream.string.slice(0, stream.pos).trim() === ''
  if (atStatementStart) {
    const def = stream.match(/^(\$?[A-Za-z_]\w*)(?=\s*=(?!=))/) as RegExpMatchArray | null
    if (def) return def[1] === 'root' ? 'rootKeyword' : def[1].startsWith('$') ? 'stateDefinition' : 'definition'
  }
  const quote = stream.peek()
  if (quote === '"' || quote === "'") {
    stream.next()
    let escaped = false
    let ch: string | void
    while ((ch = stream.next()) != null) {
      if (ch === quote && !escaped) break
      escaped = !escaped && ch === '\\'
    }
    return 'string'
  }
  if (stream.match(/^-?\d+(\.\d+)?/)) return 'number'
  if (stream.match(/^(true|false|null)\b/)) return 'atom'
  if (stream.match(/^@[A-Za-z_]\w*/)) return 'builtinCall'
  if (stream.match(/^\$[A-Za-z_]\w*/)) return 'state'
  if (stream.match(/^[A-Za-z_]\w*(?=\s*\()/)) return 'component'
  if (stream.match(/^[A-Za-z_]\w*(?=\s*:)/)) return 'property'
  if (stream.match(/^[A-Za-z_]\w*/)) return 'reference'
  const ch = stream.next()
  if (ch && '([{'.includes(ch)) {
    state.depth++
    return 'bracket'
  }
  if (ch && ')]}'.includes(ch)) {
    state.depth = Math.max(0, state.depth - 1)
    return 'bracket'
  }
  if (ch === ',') return 'separator'
  return 'operator'
}

export const ouiLanguage = StreamLanguage.define<TokenState>({
  name: 'oui',
  startState: () => ({ depth: 0 }),
  copyState: (s) => ({ ...s }),
  token,
  languageData: { commentTokens: { line: '//' }, closeBrackets: { brackets: ['(', '[', '{', '"'] } },
  tokenTable: {
    comment: tags.lineComment,
    rootKeyword: tags.keyword,
    definition: tags.definition(tags.variableName),
    stateDefinition: tags.definition(tags.special(tags.variableName)),
    string: tags.string,
    number: tags.number,
    atom: tags.atom,
    builtinCall: tags.standard(tags.function(tags.variableName)),
    state: tags.special(tags.variableName),
    component: tags.className,
    property: tags.propertyName,
    reference: tags.variableName,
    bracket: tags.bracket,
    separator: tags.separator,
    operator: tags.operator,
  },
})

export const ouiHighlightStyle = HighlightStyle.define([
  { tag: tags.lineComment, color: 'var(--ctp-overlay1)', fontStyle: 'italic' },
  { tag: tags.keyword, color: 'var(--ctp-mauve)', fontWeight: '600' },
  { tag: tags.definition(tags.variableName), color: 'var(--ctp-lavender)', fontWeight: '600' },
  { tag: tags.definition(tags.special(tags.variableName)), color: 'var(--ctp-maroon)', fontWeight: '600' },
  { tag: tags.string, color: 'var(--ctp-green)' },
  { tag: tags.number, color: 'var(--ctp-peach)' },
  { tag: tags.atom, color: 'var(--ctp-peach)' },
  { tag: tags.standard(tags.function(tags.variableName)), color: 'var(--ctp-teal)' },
  { tag: tags.special(tags.variableName), color: 'var(--ctp-maroon)' },
  { tag: tags.className, color: 'var(--ctp-blue)' },
  { tag: tags.propertyName, color: 'var(--ctp-sky)' },
  { tag: tags.variableName, color: 'var(--ctp-text)' },
  { tag: [tags.bracket, tags.separator, tags.operator], color: 'var(--ctp-overlay2)' },
])

const ouiTheme = EditorView.theme({
  '&': { color: 'var(--ctp-text)', backgroundColor: 'var(--ctp-mantle)', fontSize: '13px' },
  '.cm-content': { fontFamily: 'var(--font-mono, ui-monospace, monospace)', caretColor: 'var(--ctp-rosewater)' },
  '.cm-gutters': { backgroundColor: 'var(--ctp-mantle)', color: 'var(--ctp-overlay0)', border: 'none' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'color-mix(in srgb, var(--ctp-surface0) 55%, transparent)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: 'var(--ctp-surface1)' },
  '&.cm-focused .cm-matchingBracket': { backgroundColor: 'var(--ctp-surface2)', outline: 'none' },
  '.cm-tooltip': { backgroundColor: 'var(--ctp-surface0)', color: 'var(--ctp-text)', border: '1px solid var(--ctp-surface1)', borderRadius: '6px' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: 'var(--ctp-surface1)', color: 'var(--ctp-text)' },
  '.cm-completionDetail': { color: 'var(--ctp-overlay1)', fontStyle: 'normal', marginLeft: '0.75em' },
  '.oui-tooltip': { padding: '6px 10px', maxWidth: '560px', fontSize: '12px', lineHeight: '1.45' },
  '.oui-tooltip pre': { margin: '0 0 4px', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono, monospace)', color: 'var(--ctp-blue)' },
  '.oui-tooltip code': { fontFamily: 'var(--font-mono, monospace)', color: 'var(--ctp-sky)' },
  '.oui-signature-active': { color: 'var(--ctp-yellow)', fontWeight: '700', textDecoration: 'underline' },
  '.oui-signature-doc': { color: 'var(--ctp-subtext0)', marginTop: '4px' },
}, { dark: true })

// ============================================================================
// Markdown-ish rendering for tooltips
// ============================================================================

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Render the small Markdown subset the language service emits. */
export function renderTooltipMarkdown(markdown: string): string {
  return markdown
    .split(/```oui\n([\s\S]*?)\n```/g)
    .map((part, i) => {
      if (i % 2 === 1) return `<pre>${escapeHtml(part)}</pre>`
      return escapeHtml(part.trim())
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n{2,}/g, '<br><br>')
        .replace(/\n/g, '<br>')
    })
    .join('')
}

function tooltipDom(html: string): { dom: HTMLElement } {
  const dom = document.createElement('div')
  dom.className = 'oui-tooltip'
  dom.innerHTML = html
  return { dom }
}

// ============================================================================
// Autocomplete
// ============================================================================

const COMPLETION_TYPES: Record<OUICompletion['kind'], string> = {
  component: 'class',
  reference: 'variable',
  state: 'variable',
  builtin: 'function',
  keyword: 'keyword',
  value: 'enum',
  id: 'constant',
  snippet: 'text',
}

/** Convert VS Code-style snippet syntax to CodeMirror's (`$0` → `${}`). */
export function toCodeMirrorSnippet(text: string): string {
  return text.replace(/\$0/g, '${}')
}

export function toCodeMirrorCompletion(item: OUICompletion): Completion {
  return {
    label: item.label,
    type: COMPLETION_TYPES[item.kind],
    detail: item.detail,
    info: item.documentation ? () => tooltipDom(renderTooltipMarkdown(item.documentation!)).dom : undefined,
    apply: item.isSnippet ? snippet(toCodeMirrorSnippet(item.insertText)) : item.insertText,
    boost: -Number(item.sortText.slice(0, 1)),
  }
}

const TRIGGER_BEFORE = /[([,"{\s$@]$/

/** CodeMirror completion source backed by the language service. */
export function ouiCompletionSource(kind: OUIFileKind = 'section', hints: () => OUIWorkspaceHints = () => ({})) {
  return (context: CompletionContext): CompletionResult | null => {
    const source = context.state.doc.toString()
    const before = source.slice(Math.max(0, context.pos - 1), context.pos)
    const word = context.matchBefore(/[$@]?\w*/)
    if (!context.explicit && !word?.text && !TRIGGER_BEFORE.test(before)) return null
    const items = getCompletions(source, context.pos, kind, hints())
    if (items.length === 0) return null
    return {
      from: Math.min(...items.map((i) => i.replace.start)),
      to: Math.max(context.pos, ...items.map((i) => i.replace.end)),
      options: items.map(toCodeMirrorCompletion),
      validFor: /^[$@]?[\w-]*$/,
    }
  }
}

// ============================================================================
// Signature help (tooltip that follows the cursor)
// ============================================================================

function signatureTooltip(state: EditorState): Tooltip | null {
  const selection = state.selection.main
  if (!selection.empty) return null
  const help = getSignatureHelp(state.doc.toString(), selection.head)
  if (!help) return null
  return {
    pos: selection.head,
    above: true,
    strictSide: true,
    arrow: false,
    create: () => {
      const active = help.parameters[help.activeParameter]
      const [start, end] = active?.label ?? [0, 0]
      const label = active
        ? `${escapeHtml(help.label.slice(0, start))}<span class="oui-signature-active">${escapeHtml(help.label.slice(start, end))}</span>${escapeHtml(help.label.slice(end))}`
        : escapeHtml(help.label)
      const doc = active?.documentation ?? help.documentation
      return tooltipDom(`<pre>${label}</pre>${doc ? `<div class="oui-signature-doc">${renderTooltipMarkdown(doc)}</div>` : ''}`)
    },
  }
}

const signatureField = StateField.define<Tooltip | null>({
  create: signatureTooltip,
  update(value, tr) {
    return tr.docChanged || tr.selection ? signatureTooltip(tr.state) : value
  },
  provide: (field) => showTooltip.from(field),
})

// ============================================================================
// Hover, diagnostics, definition
// ============================================================================

const ouiHover = hoverTooltip((view, pos) => {
  const hover = getHover(view.state.doc.toString(), pos)
  if (!hover) return null
  return { pos: hover.range.start, end: hover.range.end, above: true, create: () => tooltipDom(renderTooltipMarkdown(hover.contents)) }
})

function ouiLinter(kind: OUIFileKind) {
  return linter((view) => getDiagnostics(view.state.doc.toString(), kind).map((d): Diagnostic => ({
    from: d.range.start,
    to: Math.max(d.range.end, d.range.start),
    severity: d.severity,
    source: `tier ${d.tier}`,
    message: d.fixHint ? `${d.message}\nHint: ${d.fixHint}` : d.message,
  })), { delay: 300 })
}

/** Move the cursor to the definition of the symbol at `pos`. Returns true if found. */
export function goToDefinition(view: EditorView, pos = view.state.selection.main.head): boolean {
  const target = getDefinition(view.state.doc.toString(), pos)
  if (!target) return false
  view.dispatch({ selection: { anchor: target.start, head: target.end }, scrollIntoView: true })
  return true
}

const definitionHandlers = [
  keymap.of([{ key: 'F12', run: (view) => goToDefinition(view) }]),
  EditorView.domEventHandlers({
    mousedown(event, view) {
      if (!(event.metaKey || event.ctrlKey)) return false
      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
      if (pos == null || !goToDefinition(view, pos)) return false
      event.preventDefault()
      return true
    },
  }),
]

// ============================================================================
// Public bundle
// ============================================================================

export interface OUIEditorOptions {
  /** Which kind of `.oui` file is edited (affects diagnostics and root snippets). */
  kind?: OUIFileKind
  /** Host-provided names for `SectionRef` / `TopicRef` completions. */
  hints?: () => OUIWorkspaceHints
}

/** Language support only: highlighting, completions, signatures, hovers, lint, definitions. */
export function ouiLanguageSupport({ kind = 'section', hints = () => ({}) }: OUIEditorOptions = {}): Extension {
  return [
    ouiLanguage,
    syntaxHighlighting(ouiHighlightStyle),
    autocompletion({ override: [ouiCompletionSource(kind, hints)], icons: true }),
    signatureField,
    ouiHover,
    ouiLinter(kind),
    lintGutter(),
    definitionHandlers,
  ]
}

/** Full editor setup: language support plus Loom's basic editing defaults and theme. */
export function ouiEditorExtensions(options: OUIEditorOptions = {}): Extension {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    history(),
    bracketMatching(),
    closeBrackets(),
    indentOnInput(),
    EditorState.tabSize.of(2),
    keymap.of([...closeBracketsKeymap, ...completionKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
    ouiLanguageSupport(options),
    ouiTheme,
  ]
}
