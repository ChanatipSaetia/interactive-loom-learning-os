import { describe, it, expect, beforeEach } from 'vitest'
import {
  EMPTY_TRAY,
  addPickEntry,
  orderPickEntries,
  widenAnchor,
  widenPickEntry,
  loadPickTray,
  resolvePickEntries,
  savePickTray,
  sourceResolver,
  statementAtLine,
  statementOfAnchor,
  trayReport,
  type PickTrayState,
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

  it('finds the statement a code line belongs to', () => {
    const source = '// note\nroot = Quiz("C", [q1])\n\nq1 = QuizQuestion(\n  "q1", "Why?",\n  [QuizChoice("a", "A", true, "Yes")],\n)\n'
    expect(statementAtLine(source, 1)).toBeUndefined()
    expect(statementAtLine(source, 2)).toBe('root')
    expect(statementAtLine(source, 3)).toBe('root')
    expect(statementAtLine(source, 4)).toBe('q1')
    expect(statementAtLine(source, 6)).toBe('q1')
  })

  it('widens a pick one level at a time, merging into a place already picked', () => {
    expect(widenAnchor('q1.choices[0].text')).toBe('q1.choices[0]')
    expect(widenAnchor('q1.choices[0]')).toBe('q1.choices')
    expect(widenAnchor('q1')).toBe('root')
    expect(widenAnchor('root')).toBeNull()

    const text = { file: 'sections/quiz.oui', anchor: 'q1.text', section: 'Check', label: 'Check › q1.text', note: 'Shorter' }
    let state: PickTrayState = { ...EMPTY_TRAY, entries: [text] }
    state = widenPickEntry(state, text)
    expect(state.entries).toEqual([{ ...text, anchor: 'q1', label: 'Check › q1' }])
    const other = { ...text, anchor: 'q1.hint', label: 'Check › q1.hint', note: 'Add a hint' }
    state = widenPickEntry({ ...state, entries: [...state.entries, other] }, other)
    expect(state.entries).toEqual([{ ...text, anchor: 'q1', label: 'Check › q1', note: 'Shorter\nAdd a hint' }])
    expect(widenPickEntry(state, { ...text, anchor: 'root', label: 'Check' })).toBe(state)
  })

  it('orders picks by the topic\'s files, then by line', () => {
    const at = (file: string, line?: number) => ({ file, anchor: `a${line}`, label: '', note: '', line })
    const order = orderPickEntries([at('sections/b.oui', 3), at('sections/a.oui', 9), at('topic.oui', 1), at('sections/a.oui', 2), at('sections/x.oui')],
      ['topic.oui', 'sections/a.oui', 'sections/b.oui'])
    expect(order.map((e) => `${e.file}:${e.line}`)).toEqual([
      'topic.oui:1', 'sections/a.oui:2', 'sections/a.oui:9', 'sections/b.oui:3', 'sections/x.oui:undefined',
    ])
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
