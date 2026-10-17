/**
 * Edit cards (grill-log-ai-assistant.md, decisions 54 and 58): each
 * `oui-edit` block of a reply in Studio shows as a diff against the current
 * buffer, with Apply, Reject and Show in code. Applying writes the buffer
 * only; Save writes the file. `ProposalBar` sums up a reply's blocks: Apply
 * all and what the dry run found wrong.
 */
import { useMemo, useState } from 'react'
import { AlertTriangle, Check, CheckCheck, Code2, FilePlus2, X } from 'lucide-react'
import { applyEditBlock, diffLines, parseEditBlocks, type EditBlock, type StatementChange } from './edits'
import type { ThreadMessage } from './thread'
import type { AssistantState } from './useAssistant'

const MAX_DIFF_LINES = 60

const KIND_LABEL: Record<StatementChange['kind'], string> = {
  replace: 'change',
  add: 'add',
  delete: 'remove',
  create: 'new file',
}

function Diff({ changes }: { changes: StatementChange[] }) {
  const lines = changes.flatMap((change, i) => [
    ...(i > 0 ? [{ kind: 'gap' as const, text: '' }] : []),
    ...diffLines(change.before ?? '', change.after ?? ''),
  ])
  const shown = lines.slice(0, MAX_DIFF_LINES)
  return (
    <pre className="ai-diff" data-testid="ai-edit-diff">
      {shown.map((line, i) =>
        line.kind === 'gap' ? (
          <span key={i} className="ai-diff-gap">⋯</span>
        ) : (
          <span key={i} className={`ai-diff-${line.kind}`}>
            {line.kind === 'add' ? '+ ' : line.kind === 'remove' ? '- ' : '  '}
            {line.text}
          </span>
        ),
      )}
      {lines.length > MAX_DIFF_LINES && <span className="ai-diff-gap">… {lines.length - MAX_DIFF_LINES} more lines</span>}
    </pre>
  )
}

const summary = (changes: StatementChange[]) =>
  changes.map((c) => (c.kind === 'create' ? 'new file' : `${KIND_LABEL[c.kind]} ${c.name}`)).join(' · ')

export function EditCard({ assistant, message, block }: { assistant: AssistantState; message: ThreadMessage; block: EditBlock }) {
  const hunk = message.edits?.[block.index] ?? { state: 'pending' as const }
  const pending = hunk.state === 'pending'
  const streaming = message.status === 'streaming'
  const [open, setOpen] = useState(false)
  // Pending blocks are diffed against the buffers as they are now.
  const files = assistant.currentFiles()
  const result = useMemo(() => applyEditBlock(files[block.file], block), [files, block])
  const firstChanged = result.changes.find((c) => c.kind === 'replace' || c.kind === 'add')?.name

  return (
    <div className={`ai-edit is-${hunk.state}`} data-testid="ai-edit" data-state={hunk.state}>
      <div className="ai-edit-head">
        {block.create ? <FilePlus2 size={14} aria-hidden /> : <Code2 size={14} aria-hidden />}
        <code className="ai-edit-file">{block.file || 'oui-edit'}</code>
        <span className="ai-edit-summary">
          {pending && result.ok ? summary(result.changes) : block.create ? 'new file' : block.statements.map((s) => (s.remove ? `remove ${s.name}` : s.name)).join(' · ')}
        </span>
        <span className="ai-spacer" />
        {hunk.state !== 'pending' && (
          <span className={`ai-edit-state ai-edit-state--${hunk.state}`} data-testid="ai-edit-state">
            {hunk.state === 'applied' ? 'Applied' : hunk.state === 'rejected' ? 'Rejected' : 'Failed'}
          </span>
        )}
      </div>
      {pending && !streaming && !result.ok && (
        <p className="ai-edit-error"><AlertTriangle size={13} aria-hidden /> {result.error}</p>
      )}
      {hunk.state === 'failed' && hunk.error && <p className="ai-edit-error"><AlertTriangle size={13} aria-hidden /> {hunk.error}</p>}
      {pending && result.ok && <Diff changes={result.changes} />}
      {!pending && open && <pre className="ai-diff">{block.body}</pre>}
      {!streaming && (
        <div className="ai-edit-actions">
          {pending ? (
            <>
              <button type="button" className="ai-button ai-button--primary" onClick={() => assistant.applyEdit(message.id, block.index)} disabled={!result.ok} data-testid="ai-edit-apply">
                <Check size={13} /> Apply
              </button>
              <button type="button" className="ai-button" onClick={() => assistant.rejectEdit(message.id, block.index)} data-testid="ai-edit-reject">
                <X size={13} /> Reject
              </button>
              {!block.create && (
                <button type="button" className="ai-link-button" onClick={() => assistant.showEdit(block.file, firstChanged ?? block.statements[0]?.name)} data-testid="ai-edit-show">
                  Show in code
                </button>
              )}
            </>
          ) : (
            <>
              <button type="button" className="ai-link-button" onClick={() => setOpen((o) => !o)}>
                {open ? 'Hide proposal' : 'Show proposal'}
              </button>
              {hunk.state === 'applied' && (
                <button type="button" className="ai-link-button" onClick={() => assistant.showEdit(block.file, block.create ? 'root' : block.statements.find((s) => !s.remove)?.name)}>
                  Show in code
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/** Apply all, and the problems the dry run found, under a reply with edit blocks. */
export function ProposalBar({ assistant, message }: { assistant: AssistantState; message: ThreadMessage }) {
  const blocks = useMemo(() => parseEditBlocks(message.text), [message.text])
  if (!blocks.length || message.status !== 'done') return null
  const pending = blocks.filter((b) => (message.edits?.[b.index]?.state ?? 'pending') === 'pending').length
  const problems = message.problems ?? []
  return (
    <div className="ai-proposal" data-testid="ai-proposal">
      {problems.length > 0 ? (
        <div className="ai-proposal-problems" role="status">
          <strong><AlertTriangle size={13} aria-hidden /> These edits do not check out</strong>
          <ul>{problems.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div>
      ) : (
        <span className="ai-proposal-ok"><CheckCheck size={13} aria-hidden /> The edits apply and validate.</span>
      )}
      {pending > 1 && (
        <button type="button" className="ai-button ai-button--primary" onClick={() => assistant.applyAllEdits(message.id)} data-testid="ai-edit-apply-all">
          <CheckCheck size={13} /> Apply all ({pending})
        </button>
      )}
      <span className="ai-note">Applied edits change the editor only; Save writes the files.</span>
    </div>
  )
}

/** The blocks of a reply, for `AssistantMarkdown`'s edit slots. */
export function useEditBlocks(message: ThreadMessage): EditBlock[] {
  return useMemo(() => parseEditBlocks(message.text), [message.text])
}
