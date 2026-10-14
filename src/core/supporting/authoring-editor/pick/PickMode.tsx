/**
 * Pick mode for Loom Studio and Loom Viewer (grill-log-pick-and-comment.md):
 * `PickToggle` goes in the page header, `PickMode` renders the hover outline,
 * the "Picking · Done" pill, numbered badges on the picked places and the
 * tray, and copies the picks for an AI coding agent.
 *
 * The tray (decision 53) groups picks by section in reading order, one
 * compact numbered row each; a row opens to show its full pointer, the
 * Wider button and a comment box. On phones it is a one-line bar that opens
 * into a sheet.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { AlertTriangle, Check, ChevronDown, ChevronUp, ChevronsUp, Copy, Crosshair, LocateFixed, MessageSquare, MessageSquarePlus, Trash2, X } from 'lucide-react'
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

export function PickToggle({ active, onChange, className }: {
  active: boolean
  onChange: (active: boolean) => void
  className: string
}) {
  return (
    <button
      type="button"
      className={`${className} pick-toggle${active ? ' is-active' : ''}`}
      aria-pressed={active}
      onClick={() => onChange(!active)}
      title="Pick parts of the topic to comment on or mention to your AI agent (P). Alt/Option+click picks without this."
      data-testid="pick-toggle"
    >
      <Crosshair size={14} /> <span className="pick-toggle-label">Pick</span>
    </button>
  )
}

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

/** Phone-sized screens get the bar-and-sheet tray. */
function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(NARROW).matches)
  useEffect(() => {
    const query = window.matchMedia?.(NARROW)
    if (!query) return
    const onChange = () => setNarrow(query.matches)
    query.addEventListener?.('change', onChange)
    return () => query.removeEventListener?.('change', onChange)
  }, [])
  return narrow
}

/** Lets the page add picks that do not come from a click (Studio's code editor). */
export interface PickModeApi {
  add(target: PickTarget): void
}

const rowLabel = (anchor: string) => (anchor === 'root' ? 'Whole section' : anchor)

interface Badge {
  key: string
  number: number
  top: number
  left: number
}

/** Numbered dots on the picked places that are on screen, matching the tray rows. */
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

export function PickMode({ topicId, active, onActiveChange, resolve, source, fileOrder, onPick, apiRef }: {
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
}) {
  const [tray, setTray] = usePickTray(topicId)
  const narrow = useNarrow()
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed' | 'empty'>('idle')
  const [collapsed, setCollapsed] = useState(narrow)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [commenting, setCommenting] = useState<ReadonlySet<string>>(new Set())
  const [focus, setFocus] = useState<{ file: string; anchor: string; label: string } | null>(null)
  const listRef = useRef<HTMLOListElement>(null)

  const entries = useMemo(
    () => orderPickEntries(resolvePickEntries(tray.entries, resolve), fileOrder),
    [tray.entries, resolve, fileOrder],
  )
  const report = useMemo(() => trayReport(topicId, tray, resolve, source, fileOrder), [topicId, tray, resolve, source, fileOrder])
  const groups = useMemo(() => {
    const out: Array<{ section: string; file: string; rows: Array<{ entry: ResolvedPickEntry; number: number }> }> = []
    entries.forEach((entry, index) => {
      const last = out[out.length - 1]
      if (last?.file === entry.file) last.rows.push({ entry, number: index + 1 })
      else out.push({ section: entrySection(entry), file: entry.file, rows: [{ entry, number: index + 1 }] })
    })
    return out
  }, [entries])

  const add = useCallback((target: PickTarget) => {
    setTray((t) => addPickEntry(t, target))
    // On phones the bar stays a bar: the flash and the count show the pick.
    if (!narrow) setCollapsed(false)
  }, [setTray, narrow])

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

  const update = (entry: PickEntry, change: Partial<PickEntry>) =>
    setTray((t) => ({ ...t, entries: t.entries.map((e) => (pickEntryKey(e) === pickEntryKey(entry) ? { ...e, ...change } : e)) }))
  const remove = (entry: PickEntry) =>
    setTray((t) => ({ ...t, entries: t.entries.filter((e) => pickEntryKey(e) !== pickEntryKey(entry)) }))
  const widen = (entry: PickEntry) => {
    const anchor = widenAnchor(entry.anchor)
    setTray((t) => widenPickEntry(t, entry))
    if (anchor) setOpenKey(pickEntryKey({ file: entry.file, anchor }))
  }

  /** Scroll a picked place into view and flash it; on phones the sheet folds to its bar first. */
  const showOnPage = (entry: ResolvedPickEntry) => {
    if (entry.stale) return
    if (narrow) setCollapsed(true)
    setFocus({ file: entry.file, anchor: entry.anchor, label: entry.label })
  }

  /** A tapped row opens; on wide screens its place also shows on the page. */
  const toggleRow = (entry: ResolvedPickEntry) => {
    const key = pickEntryKey(entry)
    setOpenKey((open) => (open === key ? null : key))
    if (!narrow) showOnPage(entry)
  }

  /** A tapped badge opens the tray at its row. */
  const selectBadge = useCallback((key: string) => {
    setCollapsed(false)
    setOpenKey(key)
    requestAnimationFrame(() => listRef.current?.querySelector(`[data-key="${CSS.escape(key)}"]`)?.scrollIntoView?.({ block: 'nearest' }))
  }, [])

  const hasNotes = tray.entries.some((e) => e.note.trim())
  const copyLabel = tray.mode === 'ask' ? 'Copy question' : hasNotes ? 'Copy comments' : 'Copy references'
  const showTray = active || tray.entries.length > 0
  const count = tray.entries.length

  return (
    <>
      <PickLayer active={active} onActiveChange={onActiveChange} onPick={pick} onCopy={() => void copy()} focus={focus} />
      {(active || (count > 0 && !collapsed)) && <PickBadges entries={entries} onSelect={selectBadge} />}
      {active && !(narrow && showTray && !collapsed) && (
        <div className="pick-pill" role="status" data-pick-ignore data-testid="pick-pill">
          <Crosshair size={14} aria-hidden />
          <span>{narrow ? 'Picking · tap a part' : 'Picking · click a part (Esc to stop)'}</span>
          <button type="button" onClick={() => onActiveChange(false)} data-testid="pick-done">Done</button>
        </div>
      )}
      {showTray && (
        <aside
          className={`pick-tray${collapsed ? ' is-collapsed' : ''}${narrow ? ' is-narrow' : ''}`}
          data-pick-ignore
          aria-label="Picked places"
          data-testid="pick-tray"
        >
          <div className="pick-tray-head">
            <button
              type="button"
              className="pick-tray-title"
              onClick={() => setCollapsed((c) => !c)}
              aria-expanded={!collapsed}
              data-testid="pick-tray-toggle"
            >
              {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {count === 0 ? 'Nothing picked' : `${count} picked`}
            </button>
            {!(narrow && collapsed) && (
              <div className="pick-tray-modes" role="radiogroup" aria-label="What to copy">
                {(['comment', 'ask'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    role="radio"
                    aria-checked={tray.mode === mode}
                    className={tray.mode === mode ? 'is-active' : ''}
                    onClick={() => setTray((t) => ({ ...t, mode }))}
                    title={mode === 'comment'
                      ? 'Comment on the picked places; places without a comment are mentioned'
                      : 'Ask a question about the picked places; the agent is told not to change files'}
                    data-testid={`pick-mode-${mode}`}
                  >
                    {mode === 'comment' ? 'Comment' : 'Ask'}
                  </button>
                ))}
              </div>
            )}
            <span className="pick-tray-spacer" />
            <span className="pick-tray-status" aria-live="polite">
              {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : copyState === 'empty' ? 'Nothing to copy' : ''}
            </span>
            <button type="button" className="pick-tray-button pick-tray-button--primary" onClick={() => void copy()} disabled={count === 0} title="Copy for your AI agent (Ctrl/Cmd+C in Pick mode)" data-testid="pick-copy">
              {copyState === 'copied' ? <Check size={14} /> : <Copy size={14} />} <span className="pick-copy-label">{narrow ? 'Copy' : copyLabel}</span>
            </button>
            {!(narrow && collapsed) && (
              <button type="button" className="pick-tray-icon" onClick={() => setTray(EMPTY_TRAY)} disabled={count === 0 && !tray.question} aria-label="Clear the tray" title="Clear the tray" data-testid="pick-clear">
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {!collapsed && (
            <div className="pick-tray-body">
              {count === 0 && (
                <p className="pick-tray-hint">
                  {narrow ? 'Tap part of a section to pick it.' : 'Click part of a section to pick it. Esc leaves Pick mode; Alt/Option+click picks without it.'}
                </p>
              )}
              {count > 0 && (
                <ol className="pick-tray-list" ref={listRef}>
                  {groups.map((group) => (
                    <li key={group.file} className="pick-group">
                      <div className="pick-group-title">{group.section}</div>
                      <ol>
                        {group.rows.map(({ entry, number }) => {
                          const key = pickEntryKey(entry)
                          const open = openKey === key
                          const showNote = !!entry.note || commenting.has(key)
                          return (
                            <li key={key} data-key={key} className={`pick-row${entry.stale ? ' is-stale' : ''}${open ? ' is-open' : ''}`} data-testid="pick-entry">
                              <div className="pick-row-head">
                                <button type="button" className="pick-row-main" onClick={() => toggleRow(entry)} aria-expanded={open} data-testid="pick-row">
                                  <span className="pick-row-number">{number}</span>
                                  <span className="pick-row-label">{rowLabel(entry.anchor)}</span>
                                  {entry.note.trim() && <MessageSquare size={12} className="pick-row-noted" aria-label="Has a comment" />}
                                </button>
                                {!showNote && (
                                  <button
                                    type="button"
                                    className="pick-tray-icon"
                                    onClick={() => setCommenting((c) => new Set(c).add(key))}
                                    aria-label={`Comment on ${entry.label}`}
                                    title="Add a comment"
                                    data-testid="pick-add-note"
                                  >
                                    <MessageSquarePlus size={13} />
                                  </button>
                                )}
                                <button type="button" className="pick-tray-icon" onClick={() => remove(entry)} aria-label={`Remove ${entry.label}`}>
                                  <X size={13} />
                                </button>
                              </div>
                              {open && (
                                <div className="pick-row-detail">
                                  <code className="pick-entry-pointer">{formatPickPointer({ topicId, ...entry })}</code>
                                  {narrow && !entry.stale && (
                                    <button type="button" className="pick-tray-button" onClick={() => showOnPage(entry)} data-testid="pick-show">
                                      <LocateFixed size={13} /> Show on page
                                    </button>
                                  )}
                                  {widenAnchor(entry.anchor) && (
                                    <button type="button" className="pick-tray-button" onClick={() => widen(entry)} title="Point at the part that contains this one" data-testid="pick-wider">
                                      <ChevronsUp size={13} /> Wider: {rowLabel(widenAnchor(entry.anchor)!)}
                                    </button>
                                  )}
                                </div>
                              )}
                              {entry.stale && (
                                <label className="pick-entry-stale">
                                  <AlertTriangle size={13} aria-hidden /> No longer in the topic, so it is not copied.
                                  <input type="checkbox" checked={!!entry.keep} onChange={(e) => update(entry, { keep: e.target.checked })} /> Copy anyway
                                </label>
                              )}
                              {showNote && (
                                <textarea
                                  className="pick-entry-note"
                                  rows={1}
                                  value={entry.note}
                                  autoFocus={commenting.has(key) && !entry.note}
                                  placeholder={tray.mode === 'ask' ? 'Note' : 'Comment for the agent'}
                                  onChange={(e) => update(entry, { note: e.target.value })}
                                  onFocus={(e) => e.currentTarget.scrollIntoView?.({ block: 'nearest' })}
                                  aria-label={`Comment on ${entry.label}`}
                                  data-testid="pick-entry-note"
                                />
                              )}
                            </li>
                          )
                        })}
                      </ol>
                    </li>
                  ))}
                </ol>
              )}
              {tray.mode === 'ask' && (
                <textarea
                  className="pick-tray-question"
                  rows={2}
                  value={tray.question}
                  placeholder="Your question about these places"
                  onChange={(e) => setTray((t) => ({ ...t, question: e.target.value }))}
                  onFocus={(e) => e.currentTarget.scrollIntoView?.({ block: 'nearest' })}
                  aria-label="Question"
                  data-testid="pick-question"
                />
              )}
            </div>
          )}
        </aside>
      )}
    </>
  )
}
