/**
 * Pick mode for Loom Studio and Loom Viewer (grill-log-pick-and-comment.md,
 * grill-log-ai-assistant.md decision 64): `PickMode` renders the hover
 * outline, the "Picking · Done" pill, numbered badges on the picked places
 * and the message bar.
 *
 * The bar is the one place where messages are written: ⌖ starts Pick mode
 * (like an attach button), each pick is a chip that opens to show its full
 * pointer, a comment box, Wider and Show on page, and the text box holds the
 * message. With an `assistant` the main button sends to the AI assistant;
 * without one it copies the picks for an AI coding agent. The ⋯ menu holds
 * Copy for agent, Answer only (the old Ask mode) and Clear.
 *
 * The bar floats at the bottom centre of the page, or of the pane named by
 * `over` (Studio's preview, where picks are made); while the Assistant panel is open on
 * a wide screen it docks at the foot of the panel, and on phones it is a
 * full-width bar with the chat sheet above it. Its height is published as
 * `--pick-bar-height` for that layout.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { AlertTriangle, Bot, Check, ChevronsUp, Copy, Crosshair, LocateFixed, MessageSquare, MoreHorizontal, Send, Square, Trash2, X } from 'lucide-react'
import { copyText } from '../../../ui-system/clipboard'
import { formatPickPointer, type PickSource } from '../../../learning-engine/composition/oui/pick-report'
import { PickLayer, findPickElement, type PickTarget } from './PickLayer'
import {
  EMPTY_TRAY,
  addPickEntry,
  entrySection,
  loadPickTray,
  orderPickEntries,
  pickEntryKey,
  resolvePickEntries,
  savePickTray,
  trayReport,
  widenAnchor,
  widenPickEntry,
  type PickEntry,
  type PickResolver,
  type PickTrayState,
  type ResolvedPickEntry,
} from './tray'
import './pick.css'

/** The tray for one topic, kept in localStorage. */
function usePickTray(topicId: string) {
  const [state, setState] = useState<PickTrayState>(() => loadPickTray(topicId))
  const [loadedFor, setLoadedFor] = useState(topicId)
  if (loadedFor !== topicId) {
    setLoadedFor(topicId)
    setState(loadPickTray(topicId))
  }
  useEffect(() => savePickTray(topicId, state), [topicId, state])
  return [state, setState] as const
}

const NARROW = '(max-width: 640px)'

/** Phone-sized screens get the bar-and-sheet tray. Pass another media query for a different width. */
export function useNarrow(media = NARROW): boolean {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(media).matches)
  useEffect(() => {
    const query = window.matchMedia?.(media)
    if (!query) return
    const onChange = () => setNarrow(query.matches)
    onChange()
    query.addEventListener?.('change', onChange)
    return () => query.removeEventListener?.('change', onChange)
  }, [media])
  return narrow
}

/** Lets the page add picks that do not come from a click (Studio's code editor). */
export interface PickModeApi {
  add(target: PickTarget): void
}

/** What Send to AI hands the assistant. */
export interface PickSendDraft {
  mode: PickTrayState['mode']
  message: string
  /** In reading order; stale entries only when kept. */
  entries: ResolvedPickEntry[]
}

/** The AI assistant as the bar sees it (`useAssistant` in authoring-editor/assistant). */
export interface PickAssistantBridge {
  panelOpen: boolean
  busy: boolean
  unread: boolean
  /** Resolves to true once sent; the bar then clears. */
  send(draft: PickSendDraft): Promise<boolean>
  /** Stop the reply that is streaming. */
  stop(): void
  togglePanel(open?: boolean): void
  /** False when the replies show elsewhere (the chat around the Loom MCP App): no chat button on phones. */
  hasPanel?: boolean
}

const rowLabel = (anchor: string) => (anchor === 'root' ? 'Whole section' : anchor)

/** `Quiz › q2.explanation`, or `Quiz · whole section`; on phones just `q2.explanation` or `Quiz`. */
const chipLabel = (entry: PickEntry, short = false) =>
  entry.anchor === 'root'
    ? short ? entrySection(entry) : `${entrySection(entry)} · whole section`
    : short ? entry.anchor : `${entrySection(entry)} › ${entry.anchor}`

interface Badge {
  key: string
  number: number
  top: number
  left: number
}

/** Numbered dots on the picked places that are on screen, matching the chips. */
function PickBadges({ entries, onSelect }: { entries: ResolvedPickEntry[]; onSelect: (key: string) => void }) {
  const [badges, setBadges] = useState<Badge[]>([])

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next: Badge[] = []
        entries.forEach((entry, index) => {
          if (entry.stale) return
          const element = findPickElement(entry.file, entry.anchor)
          if (!element) return
          const r = element.getBoundingClientRect()
          if (r.width === 0 || r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) return
          next.push({ key: pickEntryKey(entry), number: index + 1, top: Math.max(0, r.top - 9), left: Math.max(0, r.left - 9) })
        })
        setBadges(next)
      })
    }
    update()
    // Sections animate and lay out late, so also look again now and then.
    const timer = setInterval(update, 700)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      clearInterval(timer)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [entries])

  return (
    <>
      {badges.map((badge) => (
        <button
          key={badge.key}
          type="button"
          className="pick-badge"
          style={{ top: badge.top, left: badge.left }}
          onClick={() => onSelect(badge.key)}
          aria-label={`Pick ${badge.number}`}
          data-pick-ignore
          data-testid="pick-badge"
        >
          {badge.number}
        </button>
      ))}
    </>
  )
}

export function PickMode({ topicId, active, onActiveChange, resolve, source, fileOrder, onPick, apiRef, assistant, over }: {
  topicId: string
  active: boolean
  onActiveChange: (active: boolean) => void
  /** Finds an entry's statement in the current sources (line hint, unsaved, stale). */
  resolve: PickResolver
  source?: PickSource
  /** Reading order of the topic's files (topic.oui, then the sections); picks and the copy follow it. */
  fileOrder?: readonly string[]
  /** Called for every pick, after it is added (Studio reveals the statement in the code). */
  onPick?: (target: PickTarget) => void
  apiRef?: MutableRefObject<PickModeApi | null>
  /** The AI assistant: the main button sends to it. */
  assistant?: PickAssistantBridge
  /** CSS selector of the pane the bar floats over on wide screens (Studio: the preview); the page when absent or not shown. */
  over?: string
}) {
  const [tray, setTray] = usePickTray(topicId)
  const narrow = useNarrow()
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed' | 'empty'>('idle')
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [focus, setFocus] = useState<{ file: string; anchor: string; label: string } | null>(null)
  const barRef = useRef<HTMLElement>(null)
  const chipsRef = useRef<HTMLOListElement>(null)
  const boxRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const entries = useMemo(
    () => orderPickEntries(resolvePickEntries(tray.entries, resolve), fileOrder),
    [tray.entries, resolve, fileOrder],
  )
  const report = useMemo(() => trayReport(topicId, tray, resolve, source, fileOrder), [topicId, tray, resolve, source, fileOrder])

  const add = useCallback((target: PickTarget) => setTray((t) => addPickEntry(t, target)), [setTray])

  const pick = useCallback((target: PickTarget) => {
    add(target)
    onPick?.(target)
  }, [add, onPick])

  useEffect(() => {
    if (!apiRef) return
    apiRef.current = { add }
    return () => {
      apiRef.current = null
    }
  }, [apiRef, add])

  const copy = useCallback(async () => {
    if (!report) {
      setCopyState('empty')
      return
    }
    setCopyState((await copyText(report)) ? 'copied' : 'failed')
  }, [report])

  useEffect(() => {
    if (copyState === 'idle') return
    const timer = setTimeout(() => setCopyState('idle'), 1800)
    return () => clearTimeout(timer)
  }, [copyState])

  // The page lays out around the bar (the chat panel and sheet end where it starts).
  useLayoutEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const root = document.documentElement
    const measure = () => root.style.setProperty('--pick-bar-height', `${Math.ceil(bar.getBoundingClientRect().height)}px`)
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(bar)
    return () => {
      observer?.disconnect()
      root.style.removeProperty('--pick-bar-height')
    }
  }, [])

  // Over a pane (Studio's preview), the bar centres on it; panes come and go with the selected section.
  const [pane, setPane] = useState<{ left: number; width: number } | null>(null)
  useEffect(() => {
    if (!over || narrow) {
      setPane(null)
      return
    }
    const measure = () => {
      const r = document.querySelector(over)?.getBoundingClientRect()
      const next = r && r.width > 0 ? { left: Math.round(r.left), width: Math.round(r.width) } : null
      setPane((p) => (p?.left === next?.left && p?.width === next?.width ? p : next))
    }
    measure()
    const timer = setInterval(measure, 500)
    window.addEventListener('resize', measure)
    return () => {
      clearInterval(timer)
      window.removeEventListener('resize', measure)
    }
  }, [over, narrow])

  // The text box grows with the message, up to the CSS max-height.
  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    box.style.height = 'auto'
    box.style.height = `${box.scrollHeight}px`
  }, [tray.question])

  // The ⋯ menu closes on a click elsewhere.
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [menuOpen])

  const update = (entry: PickEntry, change: Partial<PickEntry>) =>
    setTray((t) => ({ ...t, entries: t.entries.map((e) => (pickEntryKey(e) === pickEntryKey(entry) ? { ...e, ...change } : e)) }))
  const remove = (entry: PickEntry) =>
    setTray((t) => ({ ...t, entries: t.entries.filter((e) => pickEntryKey(e) !== pickEntryKey(entry)) }))
  const widen = (entry: PickEntry) => {
    const anchor = widenAnchor(entry.anchor)
    setTray((t) => widenPickEntry(t, entry))
    if (anchor) setOpenKey(pickEntryKey({ file: entry.file, anchor }))
  }
  const clear = () => {
    setTray((t) => ({ ...EMPTY_TRAY, mode: t.mode }))
    setOpenKey(null)
  }

  /** Scroll a picked place into view and flash it. */
  const showOnPage = (entry: ResolvedPickEntry) => {
    if (!entry.stale) setFocus({ file: entry.file, anchor: entry.anchor, label: entry.label })
  }

  /** A tapped chip opens its editor; on wide screens its place also shows on the page. */
  const toggleChip = (entry: ResolvedPickEntry) => {
    const key = pickEntryKey(entry)
    setOpenKey((open) => (open === key ? null : key))
    if (!narrow) showOnPage(entry)
  }

  /** A tapped badge opens its chip. */
  const selectBadge = useCallback((key: string) => {
    setOpenKey(key)
    requestAnimationFrame(() => chipsRef.current?.querySelector(`[data-key="${CSS.escape(key)}"]`)?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }))
  }, [])

  const count = tray.entries.length
  const text = tray.question
  const answerOnly = tray.mode === 'ask'
  const chatting = !!assistant?.panelOpen
  const docked = chatting && !narrow
  const openEntry = entries.find((e) => pickEntryKey(e) === openKey)
  const hasNotes = tray.entries.some((e) => e.note.trim())
  const copyLabel = answerOnly ? 'Copy question for agent' : hasNotes ? 'Copy comments for agent' : 'Copy for agent'
  const canSend = !!assistant && !assistant.busy && (count > 0 || !!text.trim())

  const sendToAI = async () => {
    if (!assistant || !canSend) return
    const draft: PickSendDraft = {
      mode: tray.mode,
      message: text,
      entries: entries.filter((e) => !e.stale || e.keep),
    }
    if (await assistant.send(draft)) clear()
  }

  /** Enter does the main action (send, or copy without an assistant); Shift+Enter is a new line. */
  const primary = () => {
    if (assistant) void sendToAI()
    else void copy()
  }

  const placeholder = active
    ? narrow ? 'Tap a part to pick it' : 'Click part of a section to pick it (Esc to stop)'
    : assistant
      ? count
        ? answerOnly ? narrow ? 'Your question' : 'Your question about these places' : narrow ? 'Message (optional)' : 'Message about the picked places (optional)'
        : chatting ? 'Ask a follow-up…' : narrow ? 'Ask about this topic…' : 'Ask about this topic, or pick parts of it with ⌖'
      : count ? 'Question for your agent (optional)' : narrow ? 'Pick parts with ⌖' : 'Pick parts of the topic with ⌖ to copy them for your agent'

  return (
    <>
      <PickLayer active={active} onActiveChange={onActiveChange} onPick={pick} onCopy={() => void copy()} focus={focus} />
      {count > 0 && <PickBadges entries={entries} onSelect={selectBadge} />}
      {active && (
        <div className="pick-pill" role="status" data-pick-ignore data-testid="pick-pill">
          <Crosshair size={14} aria-hidden />
          <span>{narrow ? 'Picking · tap a part' : 'Picking · click a part (Esc to stop)'}</span>
          <button type="button" onClick={() => onActiveChange(false)} data-testid="pick-done">Done</button>
        </div>
      )}
      <aside
        ref={barRef}
        className={`pick-bar${narrow ? ' is-narrow' : ''}${docked ? ' is-docked' : ''}`}
        style={pane && !docked ? { left: pane.left + pane.width / 2, width: Math.min(720, pane.width - 24) } : undefined}
        data-pick-ignore
        aria-label="Message and picked places"
        data-testid="pick-tray"
      >
        {openEntry && (
          <div className={`pick-editor${openEntry.stale ? ' is-stale' : ''}`} data-testid="pick-editor">
            <div className="pick-editor-head">
              <strong>{chipLabel(openEntry)}</strong>
              <button type="button" className="pick-bar-icon" onClick={() => setOpenKey(null)} aria-label="Close" data-testid="pick-editor-close">
                <X size={14} />
              </button>
            </div>
            <code className="pick-entry-pointer">{formatPickPointer({ topicId, ...openEntry })}</code>
            {openEntry.stale && (
              <label className="pick-entry-stale">
                <AlertTriangle size={13} aria-hidden /> No longer in the topic, so it is not sent.
                <input type="checkbox" checked={!!openEntry.keep} onChange={(e) => update(openEntry, { keep: e.target.checked })} /> Send anyway
              </label>
            )}
            <textarea
              className="pick-entry-note"
              rows={2}
              value={openEntry.note}
              placeholder={answerOnly ? 'Note on this place' : 'Comment on this place (optional)'}
              onChange={(e) => update(openEntry, { note: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.stopPropagation()
                  setOpenKey(null)
                }
              }}
              aria-label={`Comment on ${openEntry.label}`}
              data-testid="pick-entry-note"
            />
            <div className="pick-editor-actions">
              {!openEntry.stale && (
                <button type="button" className="pick-tray-button" onClick={() => showOnPage(openEntry)} data-testid="pick-show">
                  <LocateFixed size={13} /> Show on page
                </button>
              )}
              {widenAnchor(openEntry.anchor) && (
                <button type="button" className="pick-tray-button" onClick={() => widen(openEntry)} title="Point at the part that contains this one" data-testid="pick-wider">
                  <ChevronsUp size={13} /> Wider: {rowLabel(widenAnchor(openEntry.anchor)!)}
                </button>
              )}
              <button type="button" className="pick-tray-button" onClick={() => remove(openEntry)} data-testid="pick-remove">
                <Trash2 size={13} /> Remove
              </button>
            </div>
          </div>
        )}

        {count > 0 && (
          <ol className="pick-chips" ref={chipsRef} aria-label="Picked places">
            {entries.map((entry, index) => {
              const key = pickEntryKey(entry)
              return (
                <li key={key} data-key={key} className={`pick-chip${entry.stale ? ' is-stale' : ''}${openKey === key ? ' is-open' : ''}`} data-testid="pick-entry">
                  <button
                    type="button"
                    className="pick-chip-main"
                    onClick={() => toggleChip(entry)}
                    aria-expanded={openKey === key}
                    title={formatPickPointer({ topicId, ...entry })}
                    data-testid="pick-row"
                  >
                    <span className="pick-row-number">{index + 1}</span>
                    {entry.stale && <AlertTriangle size={11} aria-label="No longer in the topic" />}
                    <span className="pick-chip-label">{chipLabel(entry, narrow)}</span>
                    {entry.note.trim() && <MessageSquare size={11} className="pick-row-noted" aria-label="Has a comment" />}
                  </button>
                  <button type="button" className="pick-chip-remove" onClick={() => remove(entry)} aria-label={`Remove ${entry.label}`}>
                    <X size={12} />
                  </button>
                </li>
              )
            })}
          </ol>
        )}

        <div className="pick-bar-row">
          <button
            type="button"
            className={`pick-bar-icon pick-toggle${active ? ' is-active' : ''}`}
            aria-pressed={active}
            onClick={() => onActiveChange(!active)}
            aria-label="Pick parts of the topic"
            title="Pick parts of the topic (P). Alt/Option+click picks without it."
            data-testid="pick-toggle"
          >
            <Crosshair size={16} />
          </button>
          <textarea
            ref={boxRef}
            className="pick-bar-input"
            rows={1}
            value={text}
            placeholder={placeholder}
            onChange={(e) => setTray((t) => ({ ...t, question: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                primary()
              }
            }}
            aria-label={assistant ? 'Message for the AI' : 'Question for your agent'}
            data-testid="pick-composer"
          />
          <span className="pick-tray-status" aria-live="polite">
            {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : copyState === 'empty' ? 'Nothing to copy' : ''}
          </span>
          {narrow && assistant && assistant.hasPanel !== false && !chatting && (
            <button type="button" className="pick-bar-icon pick-chat-button" onClick={() => assistant.togglePanel(true)} aria-label="Open the AI chat" title="Open the AI chat" data-testid="pick-chat">
              <Bot size={16} />
              {assistant.unread && <span className="ai-dot" aria-label="New reply" />}
            </button>
          )}
          <div className="pick-menu-wrap" ref={menuRef}>
            <button type="button" className="pick-bar-icon" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={menuOpen} aria-label="More" title="More" data-testid="pick-more">
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="pick-menu" role="menu">
                {assistant && (
                  <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); void copy() }} disabled={count === 0} data-testid="pick-copy">
                    <Copy size={14} /> {copyLabel}
                  </button>
                )}
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={answerOnly}
                  onClick={() => setTray((t) => ({ ...t, mode: t.mode === 'ask' ? 'comment' : 'ask' }))}
                  title="Ask a question: the AI or agent is told not to change files"
                  data-testid="pick-answer-only"
                >
                  <Check size={14} className={answerOnly ? '' : 'is-hidden'} /> Answer only <small>no changes</small>
                </button>
                <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); clear() }} disabled={count === 0 && !text} data-testid="pick-clear">
                  <Trash2 size={14} /> Clear
                </button>
              </div>
            )}
          </div>
          {assistant ? (
            assistant.busy ? (
              <button type="button" className="pick-bar-send is-stop" onClick={assistant.stop} aria-label="Stop the reply (Esc)" title="Stop the reply (Esc)" data-testid="pick-stop">
                <Square size={14} />
              </button>
            ) : (
              <button type="button" className="pick-bar-send" onClick={() => void sendToAI()} disabled={!canSend} aria-label="Send to AI" title="Send to the AI assistant (Enter)" data-testid="pick-send">
                <Send size={15} />
              </button>
            )
          ) : (
            <button type="button" className="pick-bar-send" onClick={() => void copy()} disabled={count === 0} aria-label={copyLabel} title={`${copyLabel} (Enter, or Ctrl/Cmd+C in Pick mode)`} data-testid="pick-copy">
              {copyState === 'copied' ? <Check size={15} /> : <Copy size={15} />}
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
