import { describe, it, expect, beforeEach } from 'vitest'
import {
  EMPTY_TRAY,
  addPickEntry,
  loadPickTray,
  resolvePickEntries,
  savePickTray,
  sourceResolver,
  statementOfAnchor,
  trayReport,
} from '../../../../../../src/core/supporting/authoring-editor/pick'

const sources = {
  'topic.oui': 'root = Topic("Kafka", "Data", "", [SectionRef("quiz")])\n',
  'sections/quiz.oui': 'root = Quiz("Check", [q1])\n\nq1 = QuizQuestion("q1", "Why?", [QuizChoice("a", "A", true, "Yes")])\n',
}

const pick = (anchor: string, file = 'sections/quiz.oui') => ({ file, anchor, label: 'Check' })

beforeEach(() => localStorage.clear())

describe('Pick tray', () => {
  it('takes the statement from an anchor', () => {
    expect(statementOfAnchor('q2.choices[1].explanation')).toBe('q2')
    expect(statementOfAnchor('q2[0]')).toBe('q2')
    expect(statementOfAnchor('root')).toBe('root')
  })

  it('adds each place once', () => {
    const one = addPickEntry(EMPTY_TRAY, pick('q1'))
    expect(one.entries).toEqual([{ ...pick('q1'), note: '' }])
    expect(addPickEntry(one, pick('q1'))).toBe(one)
    expect(addPickEntry(one, pick('q1.choices[0]')).entries).toHaveLength(2)
  })

  it('resolves line hints, unsaved files and stale entries from the current sources', () => {
    const state = [pick('q1.choices[0]'), pick('root', 'topic.oui'), pick('q9'), pick('root', 'sections/gone.oui')]
      .reduce(addPickEntry, EMPTY_TRAY)
    const resolved = resolvePickEntries(state.entries, sourceResolver(sources, new Set(['sections/quiz.oui'])))
    expect(resolved.map((e) => [e.line, e.unsaved, e.stale])).toEqual([
      [3, true, false],
      [1, undefined, false],
      [undefined, undefined, true],
      [undefined, undefined, true],
    ])
  })

  it('copies kept stale entries only', () => {
    let state = [pick('q1'), pick('q9')].reduce(addPickEntry, EMPTY_TRAY)
    const resolve = sourceResolver(sources)
    expect(trayReport('kafka', state, resolve)).toBe('kafka/sections/quiz.oui:3 #q1\n')
    state = { ...state, entries: state.entries.map((e) => (e.anchor === 'q9' ? { ...e, keep: true, note: 'Bring it back' } : e)) }
    expect(trayReport('kafka', state, resolve)).toBe(
      'Comments on the Loom topic "kafka":\n- kafka/sections/quiz.oui:3 #q1\n- kafka/sections/quiz.oui #q9\n  Bring it back\n',
    )
    expect(trayReport('kafka', { ...state, mode: 'ask', question: 'Why?' }, resolve, { kind: 'text' }))
      .toMatch(/^Answer about the Loom topic "kafka" \(do not change any files\):\n- kafka\/sections\/quiz.oui:3 #q1 \(from pasted text\)\n/)
  })

  it('keeps the tray per topic in localStorage', () => {
    const state = { ...addPickEntry(EMPTY_TRAY, pick('q1')), mode: 'ask' as const, question: 'Why?' }
    savePickTray('kafka', state)
    expect(loadPickTray('kafka')).toEqual(state)
    expect(loadPickTray('other')).toEqual(EMPTY_TRAY)
    savePickTray('kafka', EMPTY_TRAY)
    expect(localStorage.getItem('loom-pick-tray:kafka')).toBeNull()
    localStorage.setItem('loom-pick-tray:bad', '{not json')
    expect(loadPickTray('bad')).toEqual(EMPTY_TRAY)
    localStorage.setItem('loom-pick-tray:odd', JSON.stringify({ entries: [{ file: 1 }, { ...pick('q1'), note: '' }], mode: 'x' }))
    expect(loadPickTray('odd')).toEqual({ entries: [{ ...pick('q1'), note: '' }], mode: 'comment', question: '' })
  })
})
