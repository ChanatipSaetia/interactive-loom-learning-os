/**
 * OUICodeEditor — CodeMirror editor for OpenUI Lang sources.
 *
 * Highlighting, autocomplete, signature help, hovers, gateway diagnostics and
 * go-to-definition come from `ouiEditorExtensions`. Heavy (CodeMirror), so
 * hosts should load it with `React.lazy(() => import('./OUICodeEditor'))`.
 */
import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
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
}

export function OUICodeEditor({
  value,
  onChange,
  fileKind = 'section',
  hints,
  readOnly = false,
  className,
  ariaLabel = 'OpenUI Lang source',
}: OUICodeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const hintsRef = useRef(hints)
  onChangeRef.current = onChange
  hintsRef.current = hints

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

  return <div ref={hostRef} className={className ?? 'oui-code-editor'} data-testid="oui-code-editor" />
}

export default OUICodeEditor
