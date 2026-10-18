import { Suspense, useCallback, useMemo, useRef, useState } from 'react'
import { AlertCircle, AlertTriangle, Clapperboard, Code2, Eye, FormInput, Trash2 } from 'lucide-react'
import { LazyOUICodeEditor, VisualFormEditor } from '../../core/supporting/authoring-editor'
import type { SectionState, TopicWorkspace } from '../../core/supporting/authoring-editor/workspace'
import { statementAtLine, type PickTarget } from '../../core/supporting/authoring-editor/pick'
import { indexStatementLines } from '../../core/learning-engine/composition/oui/compile'
import { narrationTemplate } from '../../core/learning-engine/composition/oui/narration'
import { sectionBeatsOf } from '../../core/learning-engine/validation/oui-gateway'
import { SectionPreview } from './SectionPreview'

interface Props {
  workspace: TopicWorkspace
  section: SectionState
  sectionNames: string[]
  /** The statement the latest Pick points at; shown in the code when it is in this file. */
  reveal?: { file: string; statement: string } | null
  /** Adds the statement on a code line to the Pick tray (Ctrl/Cmd+Shift+M). */
  onAddToTray?: (target: PickTarget) => void
}

type Tab = 'code' | 'form' | 'narration'

export function SectionEditor({ workspace, section, sectionNames, reveal, onAddToTray }: Props) {
  const [tab, setTab] = useState<Tab>('code')
  const file = `sections/${section.name}.oui`
  const title = section.lastValid?.meta.title || section.name
  const sourceRef = useRef(section.source)
  sourceRef.current = section.source

  // Reveal only when a new pick arrives, not on every keystroke.
  const revealLine = useMemo(() => {
    if (!reveal || reveal.file !== file) return undefined
    const line = indexStatementLines(sourceRef.current).get(reveal.statement)
    return line ? { line } : undefined
  }, [reveal, file])

  // Hovering a code line outlines what its statement draws in the preview.
  const [hoverStatement, setHoverStatement] = useState<string | undefined>()
  const onHoverLine = useCallback((line: number | null) => {
    setHoverStatement(line ? statementAtLine(sourceRef.current, line) : undefined)
  }, [])
  const onAddLine = useCallback((line: number) => {
    const statement = statementAtLine(sourceRef.current, line)
    if (statement) onAddToTray?.({ file, anchor: statement, section: title, label: statement === 'root' ? title : `${title} › ${statement}` })
  }, [file, title, onAddToTray])
  const narration = section.narration
  const diagnostics = tab === 'narration' ? narration?.validation.diagnostics ?? [] : section.validation.diagnostics
  const blocking = diagnostics.some((d) => d.tier < 3)
  const payload = blocking ? null : section.validation.payload
  const hints = useMemo(() => ({ sectionNames }), [sectionNames])
  const narrationHints = useMemo(() => ({ sectionSource: section.source }), [section.source])

  return (
    <div className="studio-editor" data-testid="studio-section-editor">
      <section className="studio-panel studio-editor-pane">
        <div className="studio-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'code'} className={tab === 'code' ? 'is-active' : ''} onClick={() => setTab('code')} data-testid="studio-tab-code">
            <Code2 size={14} /> Code
          </button>
          <button type="button" role="tab" aria-selected={tab === 'form'} className={tab === 'form' ? 'is-active' : ''} onClick={() => setTab('form')} data-testid="studio-tab-form">
            <FormInput size={14} /> Form
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'narration'}
            className={tab === 'narration' ? 'is-active' : ''}
            onClick={() => setTab('narration')}
            title="Callouts, highlights and captions this section adds in Loom Viewer's Present mode"
            data-testid="studio-tab-narration"
          >
            <Clapperboard size={14} /> Narration{narration?.source.trim() ? ' •' : ''}
          </button>
          <span className="studio-tabs-file">sections/{section.name}{tab === 'narration' ? '.narrate' : ''}.oui</span>
        </div>

        {diagnostics.length > 0 && (
          <ul className="studio-diagnostics" data-testid="studio-diagnostics">
            {diagnostics.map((d, i) => (
              <li key={i} className={d.tier < 3 ? 'is-error' : 'is-warning'}>
                {d.tier < 3 ? <AlertCircle size={13} /> : <AlertTriangle size={13} />}
                <span>
                  {d.line ? <strong>Line {d.line}: </strong> : null}
                  {d.message}
                  {d.fixHint && <em> {d.fixHint}</em>}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="studio-editor-body">
          {tab === 'narration' ? (
            narration ? (
              <div className="studio-narration" data-testid="studio-narration">
                <Suspense fallback={<div className="studio-loading">Loading editor…</div>}>
                  <LazyOUICodeEditor
                    value={narration.source}
                    onChange={(value) => workspace.setNarration(section.name, value)}
                    hints={narrationHints}
                    fileKind="narration"
                    className="studio-code-editor"
                    ariaLabel={`Narration of ${section.name}`}
                  />
                </Suspense>
                <button type="button" className="studio-button studio-narration-remove" onClick={() => workspace.setNarration(section.name, '')} data-testid="studio-narration-remove">
                  <Trash2 size={13} /> Remove narration
                </button>
              </div>
            ) : (
              <div className="studio-form studio-narration-empty">
                <p className="studio-hint">
                  A narration file is the script this section plays to in Loom Viewer&apos;s <strong>Present</strong> mode: for each beat, a line the
                  narrator says, with optional highlights, callout notes and a spotlight that point at statements of this file by name. Beats without a
                  step read what they show on screen.
                  It is saved as <code>sections/{section.name}.narrate.oui</code>.
                </p>
                <button type="button" className="studio-button" onClick={() => workspace.setNarration(section.name, narrationTemplate(sectionBeatsOf(section.source) ?? []))} data-testid="studio-narration-add">
                  <Clapperboard size={14} /> Add narration
                </button>
              </div>
            )
          ) : tab === 'code' ? (
            <Suspense fallback={<div className="studio-loading">Loading editor…</div>}>
              <LazyOUICodeEditor
                value={section.source}
                onChange={(value) => workspace.setSource(section.name, value)}
                hints={hints}
                className="studio-code-editor"
                ariaLabel={`Source of ${section.name}`}
                revealLine={revealLine}
                onHoverLine={onHoverLine}
                onAddLine={onAddToTray ? onAddLine : undefined}
              />
            </Suspense>
          ) : payload ? (
            <div className="studio-form" data-testid="studio-form">
              <p className="studio-hint">Form edits rewrite <code>{section.name}.oui</code> in the standard layout; comments are not kept.</p>
              <VisualFormEditor
                data={payload.data}
                meta={payload.meta}
                onChange={(data) => workspace.setSectionData(section.name, payload.meta, data)}
                onMetaChange={(meta) => workspace.setSectionData(section.name, meta, payload.data)}
              />
            </div>
          ) : (
            <p className="studio-warning" role="alert">Fix the errors in the code first. The form needs a section that compiles.</p>
          )}
        </div>
      </section>

      <section className="studio-panel studio-preview-pane" aria-label="Preview">
        <div className="studio-tabs">
          <span className="studio-tabs-label"><Eye size={14} /> Preview</span>
          {blocking && section.lastValid && <span className="studio-stale">Showing the last version without errors</span>}
        </div>
        <SectionPreview payload={section.lastValid} file={file} highlight={tab === 'code' ? hoverStatement : undefined} />
      </section>
    </div>
  )
}
