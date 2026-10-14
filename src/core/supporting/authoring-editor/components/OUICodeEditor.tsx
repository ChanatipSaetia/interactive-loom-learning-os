/**
 * OUICodeEditor — CodeMirror editor for OpenUI Lang sources.
 *
 * Highlighting, autocomplete, signature help, hovers, gateway diagnostics and
 * go-to-definition come from `ouiEditorExtensions`. Heavy (CodeMirror), so
 * hosts should load it with `React.lazy(() => import('./OUICodeEditor'))`.
 *
 * Loom Studio's Pick mode (grill-log-pick-and-comment.md, decision 46) uses
 * `revealLine` to show the statement a preview pick points at, `onHoverLine`
 * to outline what a line draws, and `onAddLine` (Ctrl/Cmd+Shift+M, or
 * Alt/Option+click on a line number) to add the statement on a line to the tray.
 */
import { useEffect, useRef } from 'react'
import { EditorSelection, EditorState, StateEffect, StateField } from '@codemirror/state'
import { Decoration, EditorView, keymap, type DecorationSet } from '@codemirror/view'
import { ouiEditorExtensions } from '../oui-language/codemirror'
import type { OUIFileKind, OUIWorkspaceHints } from '../oui-language/service'

export interface OUICodeEditorProps {
  value: string
  onChange?: (value: string) => void
  /** Kind of `.oui` file (section, topic or catalog). Defaults to section. */
  fileKind?: OUIFileKind
  /** Names for `SectionRef("…")` / `TopicRef("…")` completions. */
  hints?: OUIWorkspaceHints
  readOnly?: boolean
  className?: string
  /** Accessible label for the editing surface. */
  ariaLabel?: string
  /** Scroll to this 1-based line, put the cursor there and flash it; a new object reveals again. */
  revealLine?: { line: number }
  /** The 1-based line under the pointer, or null when it leaves the editor. */
  onHoverLine?: (line: number | null) => void
  /** Ctrl/Cmd+Shift+M on the cursor's line, or Alt/Option+click on a line number. */
  onAddLine?: (line: number) => void
}

/** Briefly highlights a line (the target of `revealLine`). */
const flashLine = StateEffect.define<number | null>()
const flashField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (!effect.is(flashLine)) continue
      if (effect.value === null) return Decoration.none
      const line = tr.state.doc.line(effect.value)
      return Decoration.set([Decoration.line({ class: 'oui-line-flash' }).range(line.from)])
    }
    return decorations.map(tr.changes)
  },
  provide: (field) => EditorView.decorations.from(field),
})

const flashTheme = EditorView.baseTheme({
  '.oui-line-flash': { backgroundColor: 'color-mix(in srgb, var(--primary, #8caaee) 22%, transparent)', transition: 'background-color 0.6s' },
})

const lineAt = (view: EditorView, clientY: number) =>
  view.state.doc.lineAt(view.lineBlockAtHeight(clientY - view.documentTop).from).number

export function OUICodeEditor({
  value,
  onChange,
  fileKind = 'section',
  hints,
  readOnly = false,
  className,
  ariaLabel = 'OpenUI Lang source',
  revealLine,
  onHoverLine,
  onAddLine,
}: OUICodeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const hintsRef = useRef(hints)
  const onHoverLineRef = useRef(onHoverLine)
  const onAddLineRef = useRef(onAddLine)
  onChangeRef.current = onChange
  hintsRef.current = hints
  onHoverLineRef.current = onHoverLine
  onAddLineRef.current = onAddLine

  useEffect(() => {
    if (!hostRef.current) return
    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          ouiEditorExtensions({ kind: fileKind, hints: () => hintsRef.current ?? {} }),
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
          EditorView.contentAttributes.of({ 'aria-label': ariaLabel }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current?.(update.state.doc.toString())
          }),
          flashField,
          flashTheme,
          keymap.of([{
            key: 'Mod-Shift-m',
            run: (v) => {
              if (!onAddLineRef.current) return false
              onAddLineRef.current(v.state.doc.lineAt(v.state.selection.main.head).number)
              return true
            },
          }]),
          EditorView.domEventHandlers({
            mousemove: (event, v) => {
              onHoverLineRef.current?.(lineAt(v, event.clientY))
            },
            mouseleave: () => {
              onHoverLineRef.current?.(null)
            },
            mousedown: (event, v) => {
              const onGutter = (event.target as Element | null)?.closest?.('.cm-lineNumbers')
              if (!event.altKey || !onGutter || !onAddLineRef.current) return false
              event.preventDefault()
              onAddLineRef.current(lineAt(v, event.clientY))
              return true
            },
          }),
        ],
      }),
    })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
    // The editor is recreated only when its configuration changes; `value` is synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileKind, readOnly, ariaLabel])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
    }
  }, [value])

  useEffect(() => {
    const view = viewRef.current
    if (!view || !revealLine) return
    const number = Math.min(Math.max(1, revealLine.line), view.state.doc.lines)
    const line = view.state.doc.line(number)
    view.dispatch({
      selection: EditorSelection.cursor(line.from),
      effects: [EditorView.scrollIntoView(line.from, { y: 'center' }), flashLine.of(number)],
    })
    const timer = setTimeout(() => view.dispatch({ effects: flashLine.of(null) }), 1500)
    return () => clearTimeout(timer)
  }, [revealLine])

  return <div ref={hostRef} className={className ?? 'oui-code-editor'} data-testid="oui-code-editor" />
}

export default OUICodeEditor
