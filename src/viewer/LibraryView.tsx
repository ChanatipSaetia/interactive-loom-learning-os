/**
 * The learner's Loom folder in Viewer (decisions 210–215 in grill-log-adaptive-learning.md):
 * the library page (one card per domain) and the domain page (its topics in
 * learning order with their status, the topic up next, and a request for the
 * chat). The model is `library.ts`.
 */
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, CircleDashed, Copy, FolderOpen, MessageSquareShare, PenLine, PlayCircle, RefreshCw, RotateCcw } from 'lucide-react'
import { copyText } from '../core/ui-system/clipboard'
import { useLearnerMemory, type LearnerEvent } from '../core/supporting/learner-progress'
import { nextTopicRequest, topicStatus, upNext, type Domain, type DomainTopic, type LoomLibrary, type TopicStatus, type TopicStatusKind } from './library'

/** This device's event log (Viewer's IndexedDB), merged into every status (decision 212). */
function useEvents(revision: number): LearnerEvent[] {
  const memory = useLearnerMemory()
  const [events, setEvents] = useState<LearnerEvent[]>([])
  useEffect(() => {
    let live = true
    void memory?.port.readAll().then((all) => live && setEvents(all)).catch(() => {})
    return () => {
      live = false
    }
  }, [memory, revision])
  return events
}

function statusesOf(domain: Domain, events: LearnerEvent[]): Map<string, TopicStatus> {
  return new Map(domain.topics.map((t) => [t.id, topicStatus(t, domain.notes, events)]))
}

const STATUS_LABEL: Record<TopicStatusKind, string> = {
  missing: 'Not written yet',
  'not-started': 'Not started',
  'in-progress': 'In progress',
  'to-review': 'To review',
  done: 'Done',
}

function StatusIcon({ kind }: { kind: TopicStatusKind }) {
  if (kind === 'done') return <Check size={14} aria-hidden />
  if (kind === 'to-review') return <RotateCcw size={14} aria-hidden />
  if (kind === 'missing') return <PenLine size={14} aria-hidden />
  return <CircleDashed size={14} aria-hidden />
}

function statusText(status: TopicStatus): string {
  if (status.kind === 'in-progress' || status.kind === 'to-review') {
    const parts = [`${status.played} of ${status.total} sections`]
    if (status.review.length) parts.push(`${status.review.length} to review`)
    return `${STATUS_LABEL[status.kind]} · ${parts.join(', ')}`
  }
  return STATUS_LABEL[status.kind]
}

export function LibraryView({ library, name, revision, onOpenDomain, onRefresh, onClose }: {
  library: LoomLibrary
  name: string
  revision: number
  onOpenDomain: (id: string) => void
  onRefresh?: () => void
  onClose: () => void
}) {
  const events = useEvents(revision)
  return (
    <div className="loom-shelf" data-testid="viewer-library">
      <header className="loom-shelf-head">
        <div>
          <p className="loom-shelf-kicker"><FolderOpen size={14} aria-hidden /> {name}/</p>
          <h1>Your Loom library</h1>
          <p className="loom-shelf-lead">Each domain keeps its own topics and progress.</p>
        </div>
        <ShelfActions onRefresh={onRefresh} onClose={onClose} />
      </header>
      {library.error && <p className="loom-shelf-error" role="alert">{library.error}</p>}
      {library.domains.length === 0 && <p className="loom-shelf-empty">No domains yet. Ask your AI chat to start one; it saves it here.</p>}
      <ul className="loom-domains">
        {library.domains.map((domain) => {
          const statuses = statusesOf(domain, events)
          const planned = domain.topics.filter((t) => t.planned)
          const done = planned.filter((t) => statuses.get(t.id)?.kind === 'done').length
          const last = [...statuses.values()].map((s) => s.last).filter(Boolean).sort().pop()
          return (
            <li key={domain.id}>
              <button type="button" className="loom-domain-card" onClick={() => onOpenDomain(domain.id)} data-testid={`viewer-domain-${domain.id}`}>
                <strong>{domain.title}</strong>
                {domain.goal && <span className="loom-domain-goal">{domain.goal}</span>}
                <span className="loom-meter" aria-hidden><span style={{ width: `${planned.length ? (100 * done) / planned.length : 0}%` }} /></span>
                <span className="loom-domain-meta">{done} of {planned.length} topics done{last ? ` · last studied ${last}` : ''}</span>
                {domain.error && <span className="loom-shelf-error">{domain.error}</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function DomainView({ domain, revision, onOpenTopic, onBack, onRefresh, onClose }: {
  domain: Domain
  revision: number
  onOpenTopic: (topic: DomainTopic) => void
  /** Back to the library, when the folder is one. */
  onBack?: () => void
  onRefresh?: () => void
  onClose: () => void
}) {
  const events = useEvents(revision)
  const statuses = useMemo(() => statusesOf(domain, events), [domain, events])
  const next = upNext(domain, statuses)
  const [copied, setCopied] = useState<boolean | null>(null)
  const planned = domain.topics.filter((t) => t.planned)
  const unplanned = domain.topics.filter((t) => !t.planned)
  const done = planned.filter((t) => statuses.get(t.id)?.kind === 'done').length

  const row = (topic: DomainTopic, index?: number) => {
    const status = statuses.get(topic.id)!
    const isNext = topic === next
    return (
      <li key={topic.id} className={`loom-topic is-${status.kind}${isNext ? ' is-next' : ''}`} data-testid={`viewer-domain-topic-${topic.id}`}>
        {index !== undefined && <span className="loom-topic-number">{index + 1}</span>}
        <div className="loom-topic-body">
          <span className="loom-topic-title">{topic.title}{isNext && <em className="loom-next-badge">Up next</em>}</span>
          <span className={`loom-status loom-status--${status.kind}`}><StatusIcon kind={status.kind} /> {statusText(status)}{status.last ? ` · ${status.last}` : ''}</span>
        </div>
        {topic.topic && (
          <button type="button" className="viewer-pill" onClick={() => onOpenTopic(topic)} data-testid={`viewer-open-topic-${topic.id}`}>
            <PlayCircle size={14} /> Open
          </button>
        )}
      </li>
    )
  }

  return (
    <div className="loom-shelf" data-testid="viewer-domain">
      <header className="loom-shelf-head">
        <div>
          {onBack && (
            <button type="button" className="loom-back" onClick={onBack} data-testid="viewer-library-back"><ArrowLeft size={14} /> Library</button>
          )}
          <h1>{domain.title}</h1>
          {domain.description && <p className="loom-shelf-lead">{domain.description}</p>}
          {domain.goal && <p className="loom-domain-goal"><strong>Goal:</strong> {domain.goal}</p>}
          <span className="loom-meter loom-meter--wide" aria-hidden><span style={{ width: `${planned.length ? (100 * done) / planned.length : 0}%` }} /></span>
          <p className="loom-domain-meta">{done} of {planned.length} topics done</p>
        </div>
        <ShelfActions onRefresh={onRefresh} onClose={onClose} />
      </header>
      {domain.error && <p className="loom-shelf-error" role="alert">{domain.error}</p>}
      <div className="loom-ask">
        <p>{next ? (next.topic ? <>Up next: <strong>{next.title}</strong>. Ask your AI chat to plan it with you.</> : <>Up next is <strong>{next.id}</strong>, not written yet. Ask your AI chat to write it.</>) : 'Every planned topic is done. Ask your AI chat for the next step toward your goal.'}</p>
        <button
          type="button"
          className="viewer-button loom-ask-button"
          onClick={async () => setCopied(await copyText(nextTopicRequest(domain, statuses)))}
          data-testid="viewer-copy-next-request"
        >
          {copied ? <><Check size={14} /> Copied: paste it into your AI chat</> : copied === false ? <><Copy size={14} /> Copy failed</> : <><MessageSquareShare size={14} /> Copy request for your AI chat</>}
        </button>
      </div>
      <ol className="loom-topics">{planned.map((t, i) => row(t, i))}</ol>
      {unplanned.length > 0 && (
        <>
          <h2 className="loom-subhead">Not in the plan</h2>
          <p className="loom-shelf-lead">In <code>topics/</code> but not listed in <code>domain.oui</code>.</p>
          <ul className="loom-topics">{unplanned.map((t) => row(t))}</ul>
        </>
      )}
    </div>
  )
}

function ShelfActions({ onRefresh, onClose }: { onRefresh?: () => void; onClose: () => void }) {
  return (
    <div className="loom-shelf-actions">
      {onRefresh && <button type="button" className="viewer-pill" onClick={onRefresh} data-testid="viewer-library-refresh"><RefreshCw size={14} /> Refresh</button>}
      <button type="button" className="viewer-pill" onClick={onClose} data-testid="viewer-library-close"><FolderOpen size={14} /> Open another…</button>
    </div>
  )
}
