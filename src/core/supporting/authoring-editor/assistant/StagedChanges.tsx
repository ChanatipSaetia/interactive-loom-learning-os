/**
 * The staged changeset in the Assistant panel (grill-log-ai-assistant.md,
 * decisions 133–134): one card per file the edit tools changed, a checkbox
 * per changed statement, Apply (the ticked ones), Reject and Show in code,
 * and a bar with Apply all and Reject all. Changes that clash with the
 * author's own edits show both versions and are left out of Apply.
 */
import { useMemo, useState } from 'react'
import { AlertTriangle, Check, CheckCheck, Code2, FilePlus2, Layers, X } from 'lucide-react'
import { fileStatements } from './context'
import { fileView, hasPending, type StagedChange, type StagedFile } from './changeset'
import { Diff } from './AssistantEdits'
import type { StatementChange } from './edits'
import type { AssistantState } from './useAssistant'

const FIELD_LABEL: Record<string, string> = { title: 'title', category: 'category', description: 'description', tags: 'tags' }

function changeLabel(change: StagedChange): string {
  switch (change.kind) {
    case 'replace': return `change ${change.name}`
    case 'add': return `add ${change.name}`
    case 'delete': return `remove ${change.name}`
    case 'create': return 'new file'
    case 'field': return `set ${FIELD_LABEL[change.name] ?? change.name}`
    case 'section': return `list SectionRef("${change.name}")`
  }
}

const readJSON = (text: string | undefined) => {
  try {
    const value = JSON.parse(text ?? '""') as unknown
    return Array.isArray(value) ? value.join(', ') : String(value)
  } catch {
    return text ?? ''
  }
}

/** One change as a statement diff against the buffer as it is now. */
function changeDiff(change: StagedChange, buffer: string | undefined): StatementChange {
  if (change.kind === 'create') return { name: change.name, kind: 'create', before: buffer, after: change.text?.trimEnd() }
  if (change.kind === 'field') return { name: change.name, kind: 'replace', before: readJSON(change.base), after: readJSON(change.text) }
  if (change.kind === 'section') return { name: change.name, kind: 'add', after: `SectionRef("${change.name}")` }
  const now = buffer === undefined ? undefined : fileStatements(buffer).find((s) => s.name === change.name)?.text
  if (change.kind === 'delete') return { name: change.name, kind: 'delete', before: now ?? change.base }
  return { name: change.name, kind: change.kind, before: now, after: change.text }
}

function StagedFileCard({ assistant, entry, buffer }: { assistant: AssistantState; entry: StagedFile; buffer: string | undefined }) {
  const pending = entry.changes.filter((c) => c.state === 'pending')
  const view = useMemo(() => fileView(buffer, entry), [buffer, entry])
  const [unticked, setUnticked] = useState<Set<string>>(() => new Set())
  const [error, setError] = useState<string | null>(null)
  const busy = assistant.busy
  const created = pending.some((c) => c.kind === 'create')
  // A SectionRef goes with its new file; it is not ticked on its own.
  const follows = (c: StagedChange) => c.kind === 'section' && assistant.currentFiles()[`sections/${c.name}.oui`] === undefined
  const selectable = (c: StagedChange) => !view.conflicts.has(c.name) && !follows(c)
  const ticked = pending.filter((c) => selectable(c) && !unticked.has(c.name))
  const decided = entry.changes.length - pending.length
  const showName = pending.find((c) => c.kind === 'replace' || c.kind === 'add')?.name

  const toggle = (name: string) => setUnticked((current) => {
    const next = new Set(current)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    return next
  })
  const names = () => (ticked.length === pending.filter(selectable).length ? undefined : new Set(ticked.map((c) => c.name)))

  return (
    <div className="ai-edit ai-staged-file" data-testid="ai-staged-file" data-file={entry.file}>
      <div className="ai-edit-head">
        {created ? <FilePlus2 size={14} aria-hidden /> : <Code2 size={14} aria-hidden />}
        <code className="ai-edit-file">{entry.file}</code>
        <span className="ai-edit-summary">{entry.summaries.filter((s, i, all) => all.indexOf(s) === i).join(' · ')}</span>
        {decided > 0 && <span className="ai-note">{decided} decided</span>}
      </div>
      <ul className="ai-staged-list">
        {pending.map((change) => {
          const conflict = view.conflicts.has(change.name)
          return (
            <li key={`${change.kind}:${change.name}`} className={`ai-staged-change${conflict ? ' is-conflict' : ''}`} data-testid="ai-staged-change" data-name={change.name} data-conflict={conflict || undefined}>
              <label className="ai-check">
                <input
                  type="checkbox"
                  checked={selectable(change) && !unticked.has(change.name)}
                  disabled={!selectable(change) || busy}
                  onChange={() => toggle(change.name)}
                  data-testid="ai-staged-tick"
                />
                <span>{changeLabel(change)}</span>
                {conflict && <span className="ai-edit-state ai-edit-state--failed"><AlertTriangle size={11} aria-hidden /> conflict</span>}
                {follows(change) && <span className="ai-note">with sections/{change.name}.oui</span>}
              </label>
              {conflict && <p className="ai-note">You changed this too, so the editor's version is kept: red lines are yours, green the staged ones.</p>}
              <Diff changes={[changeDiff(change, buffer)]} />
            </li>
          )
        })}
      </ul>
      {error && <p className="ai-edit-error" role="alert"><AlertTriangle size={13} aria-hidden /> {error}</p>}
      <div className="ai-edit-actions">
        <button
          type="button"
          className="ai-button ai-button--primary"
          disabled={busy || !ticked.length}
          onClick={() => {
            setError(assistant.applyStagedFile(entry.file, names()))
            if (!created) assistant.showEdit(entry.file, showName)
          }}
          data-testid="ai-staged-apply"
        >
          <Check size={13} /> Apply{ticked.length < pending.length ? ` ${ticked.length}` : ''}
        </button>
        <button type="button" className="ai-button" disabled={busy || !ticked.length} onClick={() => assistant.rejectStagedFile(entry.file, names())} data-testid="ai-staged-reject">
          <X size={13} /> Reject{ticked.length < pending.length ? ` ${ticked.length}` : ''}
        </button>
        {view.conflicts.size > 0 && (
          <button type="button" className="ai-link-button" disabled={busy} onClick={() => assistant.rejectStagedFile(entry.file, view.conflicts)}>
            Reject conflicts
          </button>
        )}
        {!created && buffer !== undefined && (
          <button type="button" className="ai-link-button" onClick={() => assistant.showEdit(entry.file, showName)}>
            Show in code
          </button>
        )}
      </div>
    </div>
  )
}

/** Every staged file still waiting for a decision, and Apply all / Reject all. */
export function StagedChanges({ assistant }: { assistant: AssistantState }) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const waiting = assistant.staged.filter(hasPending)
  if (!waiting.length) return null
  const files = assistant.currentFiles()
  const count = waiting.reduce((sum, s) => sum + s.changes.filter((c) => c.state === 'pending').length, 0)
  return (
    <section className="ai-staged" aria-label="Staged changes" data-testid="ai-staged">
      <div className="ai-staged-head">
        <Layers size={14} aria-hidden />
        <strong>Staged changes</strong>
        <span className="ai-note">{count} in {waiting.length} {waiting.length === 1 ? 'file' : 'files'}</span>
      </div>
      {waiting.map((entry) => <StagedFileCard key={entry.file} assistant={assistant} entry={entry} buffer={files[entry.file]} />)}
      {Object.entries(errors).map(([file, error]) => (
        <p key={file} className="ai-edit-error" role="alert"><AlertTriangle size={13} aria-hidden /> {file}: {error}</p>
      ))}
      <div className="ai-proposal">
        <button type="button" className="ai-button ai-button--primary" disabled={assistant.busy} onClick={() => setErrors(assistant.applyAllStaged())} data-testid="ai-staged-apply-all">
          <CheckCheck size={13} /> Apply all
        </button>
        <button type="button" className="ai-button" disabled={assistant.busy} onClick={assistant.rejectAllStaged} data-testid="ai-staged-reject-all">
          <X size={13} /> Reject all
        </button>
        <span className="ai-note">Applied changes go into the editor; Save writes the files.</span>
      </div>
    </section>
  )
}
