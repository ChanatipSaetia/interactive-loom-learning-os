/**
 * Pick mode for Loom Studio and Loom Viewer (grill-log-pick-and-comment.md):
 * `PickToggle` goes in the page header, `PickMode` renders the hover outline
 * and the tray of picked places, and copies them for an AI coding agent.
 */
import { useCallback, useEffect, useMemo, useState, type MutableRefObject } from 'react'
import { AlertTriangle, Check, ChevronDown, ChevronUp, Copy, Crosshair, Trash2, X } from 'lucide-react'
import { copyText } from '../../../ui-system/clipboard'
import { formatPickPointer, type PickSource } from '../../../learning-engine/composition/oui/pick-report'
import { PickLayer, type PickTarget } from './PickLayer'
import {
  EMPTY_TRAY,
  addPickEntry,
  loadPickTray,
  pickEntryKey,
  resolvePickEntries,
  savePickTray,
  trayReport,
  type PickEntry,
  type PickResolver,
  type PickTrayState,
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

/** Lets the page add picks that do not come from a click (Studio's code editor). */
export interface PickModeApi {
  add(target: PickTarget): void
}

export function PickMode({ topicId, active, onActiveChange, resolve, source, onPick, apiRef }: {
  topicId: string
  active: boolean
  onActiveChange: (active: boolean) => void
  /** Finds an entry's statement in the current sources (line hint, unsaved, stale). */
  resolve: PickResolver
  source?: PickSource
  /** Called for every pick, after it is added (Studio reveals the statement in the code). */
  onPick?: (target: PickTarget) => void
  apiRef?: MutableRefObject<PickModeApi | null>
}) {
  const [tray, setTray] = usePickTray(topicId)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed' | 'empty'>('idle')
  const [collapsed, setCollapsed] = useState(false)

  const entries = useMemo(() => resolvePickEntries(tray.entries, resolve), [tray.entries, resolve])
  const report = useMemo(() => trayReport(topicId, tray, resolve, source), [topicId, tray, resolve, source])

  const add = useCallback((target: PickTarget) => {
    setTray((t) => addPickEntry(t, target))
    setCollapsed(false)
  }, [setTray])

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

  const hasNotes = tray.entries.some((e) => e.note.trim())
  const copyLabel = tray.mode === 'ask' ? 'Copy question' : hasNotes ? 'Copy comments' : 'Copy references'
  const showTray = active || tray.entries.length > 0

  return (
    <>
      <PickLayer active={active} onActiveChange={onActiveChange} onPick={pick} onCopy={() => void copy()} />
      {showTray && (
        <aside className={`pick-tray${collapsed ? ' is-collapsed' : ''}`} data-pick-ignore aria-label="Picked places" data-testid="pick-tray">
          <div className="pick-tray-head">
            <strong className="pick-tray-title">
              {tray.entries.length === 0 ? 'Pick mode' : `${tray.entries.length} picked`}
            </strong>
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
            <span className="pick-tray-spacer" />
            <span className="pick-tray-status" aria-live="polite">
              {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : copyState === 'empty' ? 'Nothing to copy' : ''}
            </span>
            <button type="button" className="pick-tray-button pick-tray-button--primary" onClick={() => void copy()} disabled={tray.entries.length === 0} title="Copy for your AI agent (Ctrl/Cmd+C in Pick mode)" data-testid="pick-copy">
              {copyState === 'copied' ? <Check size={14} /> : <Copy size={14} />} {copyLabel}
            </button>
            <button type="button" className="pick-tray-icon" onClick={() => setTray(EMPTY_TRAY)} disabled={tray.entries.length === 0 && !tray.question} aria-label="Clear the tray" title="Clear the tray" data-testid="pick-clear">
              <Trash2 size={14} />
            </button>
            <button type="button" className="pick-tray-icon" onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? 'Expand the tray' : 'Collapse the tray'} aria-expanded={!collapsed}>
              {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {active && (
              <button type="button" className="pick-tray-icon" onClick={() => onActiveChange(false)} aria-label="Leave Pick mode (Esc)" title="Leave Pick mode (Esc)">
                <X size={14} />
              </button>
            )}
          </div>

          {!collapsed && (
            <div className="pick-tray-body">
              {tray.entries.length === 0 && (
                <p className="pick-tray-hint">Click part of a section to pick it. Esc leaves Pick mode; Alt/Option+click picks without it.</p>
              )}
              {entries.length > 0 && (
                <ol className="pick-tray-list">
                  {entries.map((entry) => (
                    <li key={pickEntryKey(entry)} className={entry.stale ? 'is-stale' : undefined} data-testid="pick-entry">
                      <div className="pick-entry-head">
                        <span className="pick-entry-label">{entry.label}</span>
                        <code className="pick-entry-pointer">{formatPickPointer({ topicId, ...entry })}</code>
                        <button type="button" className="pick-tray-icon" onClick={() => remove(entry)} aria-label={`Remove ${entry.label}`}>
                          <X size={13} />
                        </button>
                      </div>
                      {entry.stale && (
                        <label className="pick-entry-stale">
                          <AlertTriangle size={13} aria-hidden /> No longer in the topic, so it is not copied.
                          <input type="checkbox" checked={!!entry.keep} onChange={(e) => update(entry, { keep: e.target.checked })} /> Copy anyway
                        </label>
                      )}
                      <textarea
                        className="pick-entry-note"
                        rows={1}
                        value={entry.note}
                        placeholder={tray.mode === 'ask' ? 'Note (optional)' : 'Comment (optional). Leave empty to just mention it.'}
                        onChange={(e) => update(entry, { note: e.target.value })}
                        aria-label={`Comment on ${entry.label}`}
                        data-testid="pick-entry-note"
                      />
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
