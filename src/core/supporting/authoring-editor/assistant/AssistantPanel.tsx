/**
 * The Assistant panel (grill-log-ai-assistant.md, decision 60): the topic's
 * conversation in a drawer on the right (a sheet on phones), with the
 * profile and model menu, New chat, Stop, and the one-time notice before the
 * first send to a remote server. Messages are written in the Pick message
 * bar (`PickMode`, decision 64), which docks at the foot of the panel while
 * it is open; on phones the panel is a sheet that ends where the bar
 * starts. `AssistantToggle` opens the panel from the page header.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { AlertTriangle, ArrowUpRight, BookOpen, ListChecks, Bot, Brain, ChevronDown, FilePlus2, FileText, ListTree, Loader2, MessageSquarePlus, PencilLine, RotateCcw, Search, Settings2, Tags, X } from 'lucide-react'
import { Modal } from '../../../ui-system'
import { findPickElement } from '../pick/PickLayer'
import { useNarrow } from '../pick/PickMode'
import type { PickResolver } from '../pick/tray'
import { statementOfAnchor } from '../pick/tray'
import { AssistantMarkdown } from './AssistantMarkdown'
import { EditCard, ProposalBar, useEditBlocks } from './AssistantEdits'
import { AssistantSettingsDialog } from './AssistantSettingsDialog'
import { StagedChanges } from './StagedChanges'
import { PlanCard } from './PlanCard'
import { EDIT_TOOL_NAMES } from './edit-tools'
import { failureHint, type AssistantPresetId } from './presets'
import type { ThreadMessage, ThreadPick, ToolStepCall } from './thread'
import type { AssistantFailureKind } from './client'
import type { AssistantState } from './useAssistant'
import type { PickAssistantBridge } from '../pick/PickMode'
import './assistant.css'

export function AssistantToggle({ assistant, className }: { assistant: AssistantState; className: string }) {
  const open = assistant.panelOpen
  return (
    <button
      type="button"
      className={`${className} ai-toggle${open ? ' is-active' : ''}`}
      aria-pressed={open}
      onClick={() => (assistant.profile ? assistant.togglePanel() : assistant.openSettings())}
      title={assistant.profile ? 'AI assistant: ask about the places you pick' : 'Connect an AI model (OpenAI-compatible API)'}
      data-testid="ai-toggle"
    >
      <Bot size={14} /> <span className="ai-toggle-label">AI</span>
      {assistant.unread && !open && <span className="ai-dot" aria-label="New reply" />}
    </button>
  )
}

const WIDTH_KEY = 'loom-ai-panel-width'
const MIN_WIDTH = 320

function loadWidth(): number {
  try {
    const saved = Number(localStorage.getItem(WIDTH_KEY))
    if (saved >= MIN_WIDTH) return saved
  } catch {
    // Storage blocked: the default width.
  }
  return 420
}

/** Where the page header ends, so the drawer starts below it. */
function useHeaderBottom(active: boolean): number {
  const [bottom, setBottom] = useState(0)
  useLayoutEffect(() => {
    if (!active) return
    const measure = () => {
      const header = document.querySelector('.studio-header, .topnav')
      setBottom(header ? Math.max(0, header.getBoundingClientRect().bottom) : 0)
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [active])
  return bottom
}

/** Scroll a picked place into view and flash it. */
function showPick(pick: Pick<ThreadPick, 'file' | 'anchor'>) {
  const element = findPickElement(pick.file, pick.anchor)
  if (!element) return
  element.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
  element.classList.add('pick-linked')
  setTimeout(() => element.classList.remove('pick-linked'), 1400)
}

function PickChips({ picks, resolve }: { picks: ThreadPick[]; resolve: PickResolver }) {
  return (
    <ul className="ai-chips">
      {picks.map((pick) => {
        const stale = !resolve(pick.file, statementOfAnchor(pick.anchor))
        return (
          <li key={`${pick.file}#${pick.anchor}`}>
            <button
              type="button"
              className={`ai-chip${stale ? ' is-stale' : ''}`}
              onClick={() => !stale && showPick(pick)}
              title={`${pick.file} #${pick.anchor}${stale ? ' (no longer in the topic)' : ''}`}
              data-testid="ai-chip"
            >
              {stale && <AlertTriangle size={11} aria-hidden />}
              {pick.anchor === 'root' ? `${pick.label} (whole section)` : pick.label}
            </button>
            {pick.note.trim() && <span className="ai-chip-note">{pick.note.trim()}</span>}
          </li>
        )
      })}
    </ul>
  )
}

const FAILURE_TITLES: Partial<Record<AssistantFailureKind, string>> = {
  network: 'Could not reach the server',
  'mixed-content': 'Blocked: http from an https page',
  'local-network': 'Local network access needed',
  auth: 'API key refused',
  'not-found': 'Wrong path or model',
  'bad-response': 'Not an OpenAI-compatible answer',
  http: 'Server error',
  'invalid-url': 'Not a valid base URL',
}

const TOOL_ICONS: Record<string, typeof Search> = { navigate: ListTree, read: FileText, edit_section: PencilLine, create_section: FilePlus2, edit_topic: Tags, describe_components: BookOpen, propose_plan: ListChecks }

/** Calls that stage a change (decision 130), counted apart from lookups. */
const isEdit = (name: string) => EDIT_TOOL_NAMES.has(name) && name !== 'describe_components'

const PLAN = 'propose_plan'

/** "Knowledge Check › A logged-in…" → the section, then the part. */
function splitLabel(name: string, label: string): { title: string; detail?: string } {
  const at = label.indexOf(' › ')
  if (at >= 0) return { title: label.slice(0, at), detail: label.slice(at + 3) }
  if (name === 'navigate' && label === 'Topic outline') return { title: 'Topic outline', detail: 'All sections' }
  return { title: label }
}

/** "Thought for 8s", or "Thought" under a second. */
function thoughtLabel(ms?: number): string {
  return ms && ms >= 1000 ? `Thought for ${Math.round(ms / 1000)}s` : 'Thought'
}

/** The last line of the thinking so far, for the live preview. */
const lastLine = (text: string) => text.trimEnd().split('\n').filter((line) => line.trim()).pop()?.trim() ?? ''

/** Reasoning text that keeps its newest lines in view while it streams. */
function ThinkingText({ text, live }: { text: string; live: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (live && ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [text, live])
  return <div ref={ref} className="ai-activity-thought" data-testid="ai-thought">{text.trim()}</div>
}

type ActivityRow = { kind: 'thought'; key: string; text: string; live: boolean } | { kind: 'call'; key: string; call: ToolStepCall }

/**
 * What the model did before its answer (decisions 125 and 128): its thinking
 * and the places it looked at, as one pill ("Thinking…", "Looking at …",
 * then "Thought for 8s · Looked at 2 places") that opens on a timeline in
 * the order they happened. A place's row shows it on the page.
 */
function Activity({ message }: { message: ThreadMessage }) {
  const [open, setOpen] = useState(false)
  const streaming = message.status === 'streaming'
  const rows: ActivityRow[] = []
  ;(message.steps ?? []).forEach((step, i) => {
    if (step.thinking) rows.push({ kind: 'thought', key: `t${i}`, text: step.thinking, live: false })
    step.calls.forEach((call) => rows.push({ kind: 'call', key: call.id, call }))
  })
  const thinkingNow = streaming && !!message.thinking && !message.text
  if (message.thinking) rows.push({ kind: 'thought', key: 'final', text: message.thinking, live: thinkingNow })
  if (!rows.length) return null

  const calls = rows.filter((r) => r.kind === 'call' && !isEdit(r.call.name) && r.call.name !== PLAN).length
  const plans = rows.filter((r) => r.kind === 'call' && r.call.name === PLAN).length
  const edits = rows.filter((r) => r.kind === 'call' && isEdit(r.call.name)).length
  const thought = rows.some((r) => r.kind === 'thought')
  const lastCall = [...rows].reverse().find((r): r is Extract<ActivityRow, { kind: 'call' }> => r.kind === 'call')
  const looking = streaming && !message.text && !thinkingNow && !!lastCall
  const done = [
    thought ? thoughtLabel(message.thoughtMs) : '',
    calls ? `Looked at ${calls} ${calls === 1 ? 'place' : 'places'}` : '',
    edits ? `Staged ${edits} ${edits === 1 ? 'edit' : 'edits'}` : '',
    plans ? 'Proposed a plan' : '',
  ].filter(Boolean).join(' · ')
  const busy = thinkingNow || looking
  const preview = thinkingNow && !open ? lastLine(message.thinking ?? '') : ''

  return (
    <div className={`ai-activity${open ? ' is-open' : ''}`} data-testid="ai-activity">
      <button type="button" className="ai-activity-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)} data-testid="ai-activity-toggle">
        {busy ? <Loader2 size={13} className="ai-spin" aria-hidden /> : thought && !calls ? <Brain size={13} aria-hidden /> : <Search size={13} aria-hidden />}
        <span className="ai-activity-summary">
          {thinkingNow ? 'Thinking…' : looking ? <>{isEdit(lastCall!.call.name) ? 'Editing' : 'Looking at'} <b>{splitLabel(lastCall!.call.name, lastCall!.call.label).title}</b>…</> : done}
        </span>
        <ChevronDown size={13} className="ai-activity-chevron" aria-hidden />
      </button>
      {preview && <p className="ai-activity-preview" aria-live="polite">{preview}</p>}
      {open && (
        <ol className="ai-activity-list">
          {rows.map((row) => {
            if (row.kind === 'thought') {
              return (
                <li key={row.key} className="ai-activity-row ai-activity-row--thought">
                  <span className="ai-activity-icon">{row.live ? <Loader2 size={12} className="ai-spin" aria-hidden /> : <Brain size={12} aria-hidden />}</span>
                  <span className="ai-activity-text">
                    <span className="ai-activity-title">{row.live ? 'Thinking…' : 'Thought'}</span>
                    <ThinkingText text={row.text} live={row.live} />
                  </span>
                </li>
              )
            }
            const { call } = row
            const place = call.file ? { file: call.file, anchor: call.anchor ?? 'root' } : null
            const { title, detail } = isEdit(call.name) ? { title: call.label, detail: call.file } : splitLabel(call.name, call.label)
            const Icon = TOOL_ICONS[call.name] ?? Search
            return (
              <li key={row.key}>
                <button
                  type="button"
                  className="ai-activity-row ai-activity-row--place"
                  disabled={!place}
                  onClick={() => place && showPick(place)}
                  title={place ? `Show on page: ${call.label}` : call.label}
                  data-testid="ai-looked-line"
                >
                  <span className="ai-activity-icon"><Icon size={12} aria-hidden /></span>
                  <span className="ai-activity-text">
                    <span className="ai-activity-title">{title}</span>
                    {detail && <span className="ai-activity-detail">{detail}</span>}
                  </span>
                  {place && <ArrowUpRight size={13} className="ai-activity-go" aria-hidden />}
                </button>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

/** The id of the newest `propose_plan` call in the thread; older plans are stale. */
function latestPlan(messages: readonly ThreadMessage[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const call = [...(messages[i].steps ?? [])].reverse().flatMap((s) => [...s.calls].reverse()).find((c) => c.name === PLAN && !c.result.startsWith('Error'))
    if (call) return call.id
  }
  return undefined
}

function Reply({ assistant, message, preset, last, onRetry, latestPlanId }: { assistant: AssistantState; message: ThreadMessage; preset: AssistantPresetId; last: boolean; onRetry: () => void; latestPlanId?: string }) {
  const streaming = message.status === 'streaming'
  const blocks = useEditBlocks(message)
  // Studio turns oui-edit blocks into edit cards; elsewhere they stay code.
  const renderEdit = assistant.canEdit
    ? (index: number) => (blocks[index] ? <EditCard assistant={assistant} message={message} block={blocks[index]} /> : null)
    : undefined
  const failed = message.status === 'error' && message.error
  const page = typeof location !== 'undefined' ? location : undefined
  return (
    <div className="ai-message ai-message--assistant" data-testid="ai-reply" data-status={message.status}>
      <Activity message={message} />
      {message.text ? <AssistantMarkdown text={message.text} renderEdit={renderEdit} /> : streaming && !message.steps?.length && !message.thinking ? <p className="ai-thinking"><Loader2 size={14} className="ai-spin" /> Thinking…</p> : null}
      {message.status === 'stopped' && <p className="ai-note">(stopped)</p>}
      {(message.steps ?? []).flatMap((s) => s.calls).filter((c) => c.name === PLAN && !c.result.startsWith('Error')).map((call) => (
        <PlanCard key={call.id} assistant={assistant} messageId={message.id} call={call} built={message.planBuilt === call.id} stale={call.id !== latestPlanId} />
      ))}
      {assistant.canEdit && <ProposalBar assistant={assistant} message={message} />}
      {failed && (
        <div className="ai-test-fail" role="alert">
          <strong><AlertTriangle size={14} /> {FAILURE_TITLES[message.error!.kind as AssistantFailureKind] ?? 'Request failed'}</strong>
          <span>{message.error!.message}</span>
          <span>
            {failureHint(message.error!.kind as AssistantFailureKind, preset, {
              origin: page?.origin ?? '',
              host: message.via?.host ?? '',
              secure: page?.protocol === 'https:',
            })}
          </span>
        </div>
      )}
      <div className="ai-message-foot">
        {message.via && <span className="ai-via" data-testid="ai-via">via {message.via.host} · {message.via.model}</span>}
        {last && (failed || message.status === 'stopped') && (
          <button type="button" className="ai-link-button" onClick={onRetry} data-testid="ai-retry">
            <RotateCcw size={12} /> Retry
          </button>
        )}
      </div>
    </div>
  )
}

export interface AssistantDockProps {
  assistant: AssistantState
  /** Resolves the thread's picks against the current sources (stale chips). */
  resolve: PickResolver
  /** For tests: replaces `fetch` in Test connection. */
  fetchImpl?: typeof fetch
}

/** The Assistant panel, the connection settings dialog and the remote notice. */
export function AssistantDock({ assistant, resolve, fetchImpl }: AssistantDockProps) {
  const narrow = useNarrow()
  const [width, setWidth] = useState(loadWidth)
  const top = useHeaderBottom(assistant.panelOpen && !narrow)
  const listRef = useRef<HTMLDivElement>(null)
  const stick = useRef(true)
  const { messages } = assistant.thread
  const profile = assistant.profile
  const firstSent = Math.max(0, messages.findIndex((m) => m.id === assistant.thread.start))

  // The tray moves left of the drawer while it is open.
  useEffect(() => {
    const root = document.documentElement
    if (assistant.panelOpen && !narrow) root.style.setProperty('--ai-panel-width', `${width}px`)
    else root.style.removeProperty('--ai-panel-width')
    root.classList.toggle('ai-chat-open', assistant.panelOpen)
    return () => {
      root.style.removeProperty('--ai-panel-width')
      root.classList.remove('ai-chat-open')
    }
  }, [assistant.panelOpen, narrow, width])

  // Follow the reply while it streams, unless the reader scrolled up.
  const lastText = messages[messages.length - 1]?.text
  useEffect(() => {
    const list = listRef.current
    if (list && stick.current) list.scrollTop = list.scrollHeight
  }, [lastText, messages.length, assistant.panelOpen])

  const startResize = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const move = (ev: PointerEvent) => setWidth(Math.min(Math.max(MIN_WIDTH, window.innerWidth - ev.clientX), Math.round(window.innerWidth * 0.7)))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setWidth((w) => {
        try {
          localStorage.setItem(WIDTH_KEY, String(w))
        } catch {
          // Not kept.
        }
        return w
      })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }, [])

  const lastIndex = messages.length - 1
  const latestPlanId = latestPlan(messages)

  return (
    <>
      {assistant.panelOpen && (
        <aside
          className={`ai-panel${narrow ? ' is-narrow' : ''}`}
          style={narrow ? undefined : { width, top }}
          aria-label="AI assistant"
          data-pick-ignore
          data-testid="ai-panel"
        >
          {!narrow && <div className="ai-panel-resize" onPointerDown={startResize} aria-hidden />}
          <div className="ai-panel-head">
            <span className="ai-panel-title"><Bot size={15} /> AI assistant</span>
            <span className="ai-spacer" />
            <button type="button" className="ai-icon-button" onClick={assistant.newChat} disabled={messages.length === 0} title="New chat" aria-label="New chat" data-testid="ai-new-chat">
              <MessageSquarePlus size={15} />
            </button>
            <button type="button" className="ai-icon-button" onClick={assistant.openSettings} title="Connection settings" aria-label="Connection settings" data-testid="ai-settings-open">
              <Settings2 size={15} />
            </button>
            <button type="button" className="ai-icon-button" onClick={() => assistant.togglePanel(false)} title="Close" aria-label="Close the assistant" data-testid="ai-close">
              <X size={15} />
            </button>
          </div>
          {profile && (
            <div className="ai-panel-model">
              <select
                value={profile.id}
                onChange={(e) => assistant.selectProfile(e.target.value)}
                aria-label="Profile"
                disabled={assistant.busy}
                data-testid="ai-panel-profile"
              >
                {assistant.settings.profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input
                value={profile.model}
                list="ai-panel-models"
                onChange={(e) => assistant.updateProfile({ model: e.target.value })}
                placeholder="Model"
                aria-label="Model"
                spellCheck={false}
                disabled={assistant.busy}
                data-testid="ai-panel-model"
              />
              <datalist id="ai-panel-models">
                {assistant.models.map((m) => <option key={m} value={m} />)}
              </datalist>
            </div>
          )}

          <div
            className="ai-messages"
            ref={listRef}
            onScroll={(e) => {
              const el = e.currentTarget
              stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
            }}
            aria-live="polite"
            data-lenis-prevent
          >
            {messages.length === 0 && (
              <div className="ai-empty">
                <p>Type a question in the bar below. To ask about part of the topic, press <strong>⌖</strong> and {narrow ? 'tap' : 'click'} it first: each pick becomes a chip you can comment on, and goes with your next message. Keep asking follow-ups in the same chat.</p>
                <p>{assistant.app === 'studio'
                  ? 'The assistant sees the current source of what you picked, unsaved edits included, and the errors in it.'
                  : 'The assistant sees the source of what you picked and the errors in it. Viewer is read-only, so it answers and explains.'}</p>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={message.id}>
                {index === firstSent && firstSent > 0 && (
                  <p className="ai-cut" data-testid="ai-cut">Earlier messages are not sent: they do not fit the token budget.</p>
                )}
                {message.role === 'user' ? (
                  <div className={`ai-message ai-message--user${message.auto ? ' is-auto' : ''}`} data-testid="ai-user-message">
                    {message.auto && <span className="ai-note">Sent by Studio: the proposed edits did not check out</span>}
                    {message.picks && message.picks.length > 0 && <PickChips picks={message.picks} resolve={resolve} />}
                    {message.text && !message.auto && <p className="ai-user-text">{message.text}</p>}
                    {message.auto && <ul className="ai-auto-problems">{message.text.split('\n').filter((l) => l.startsWith('- ')).map((l, i) => <li key={i}>{l.slice(2)}</li>)}</ul>}
                    {message.mode === 'ask' && <span className="ai-note">Question</span>}
                  </div>
                ) : (
                  <Reply assistant={assistant} message={message} preset={profile?.preset ?? 'custom'} last={index === lastIndex} onRetry={assistant.retry} latestPlanId={latestPlanId} />
                )}
              </div>
            ))}
            {assistant.canEdit && <StagedChanges assistant={assistant} />}
          </div>
        </aside>
      )}

      <AssistantSettingsDialog
        open={assistant.settingsOpen}
        onClose={assistant.closeSettings}
        onChange={(next) => {
          assistant.updateSettings(next)
          if (next.activeId) assistant.togglePanel(true)
        }}
        fetchImpl={fetchImpl}
      />

      <Modal open={!!assistant.notice} onClose={() => assistant.answerNotice(false)} title="Send to a remote server?" maxWidth="md">
        {assistant.notice && (
          <div className="ai-settings" data-testid="ai-remote-notice">
            <p>
              Your picks, comments and message, and the topic source they point at, are sent to <strong>{assistant.notice.host}</strong> (profile
              "{assistant.notice.profileName}"). This is asked once for each profile.
            </p>
            <div className="ai-settings-actions">
              <button type="button" className="ai-button" onClick={() => assistant.answerNotice(false)}>Cancel</button>
              <button type="button" className="ai-button ai-button--primary" onClick={() => assistant.answerNotice(true)} data-testid="ai-remote-ok">Send</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

/** The assistant as the Pick tray sees it: Send to AI hands over the tray's picks. */
export function pickBridgeOf(assistant: AssistantState): PickAssistantBridge {
  return {
    panelOpen: assistant.panelOpen,
    busy: assistant.busy,
    unread: assistant.unread,
    togglePanel: assistant.togglePanel,
    stop: assistant.stop,
    send: (draft) =>
      assistant.send({
        mode: draft.mode,
        message: draft.message,
        picks: draft.entries.map((e) => ({ file: e.file, anchor: e.anchor, label: e.label, note: e.note })),
      }),
  }
}
