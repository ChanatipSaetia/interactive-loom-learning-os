import { Suspense, useMemo, useState } from 'react'
import { AlertCircle, AlertTriangle, Code2, Eye, FormInput } from 'lucide-react'
import { LazyOUICodeEditor, VisualFormEditor } from '../../core/supporting/authoring-editor'
import type { SectionState, TopicWorkspace } from '../../core/supporting/authoring-editor/workspace'
import { SectionPreview } from './SectionPreview'

interface Props {
  workspace: TopicWorkspace
  section: SectionState
  sectionNames: string[]
}

type Tab = 'code' | 'form'

export function SectionEditor({ workspace, section, sectionNames }: Props) {
  const [tab, setTab] = useState<Tab>('code')
  const diagnostics = section.validation.diagnostics
  const blocking = diagnostics.some((d) => d.tier < 3)
  const payload = blocking ? null : section.validation.payload
  const hints = useMemo(() => ({ sectionNames }), [sectionNames])

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
          <span className="studio-tabs-file">sections/{section.name}.oui</span>
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
          {tab === 'code' ? (
            <Suspense fallback={<div className="studio-loading">Loading editor…</div>}>
              <LazyOUICodeEditor
                value={section.source}
                onChange={(value) => workspace.setSource(section.name, value)}
                hints={hints}
                className="studio-code-editor"
                ariaLabel={`Source of ${section.name}`}
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
        <SectionPreview payload={section.lastValid} />
      </section>
    </div>
  )
}
