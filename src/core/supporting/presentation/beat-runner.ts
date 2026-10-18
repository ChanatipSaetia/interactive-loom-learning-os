/**
 * Where a learner is in a presented topic, and how next / previous / jump move them
 * (decisions 68, 69, 89 in grill-log-presenting-mode.md). Pure: the stage animates the result.
 */
import type { Beat, BeatKind } from '../../learning-engine/sub-contexts/present-kernel'

export interface RunnerState {
  /** Current section; equals the section count once the topic is complete. */
  section: number
  beat: number
  /** `enter` plays the beat's entrance; `settle` draws its end state at once (going back, jumping). */
  mode: 'enter' | 'settle'
  /** Solved gates, as `gateKey(section, beat)`. */
  solved: ReadonlySet<string>
}

export type RunnerAction =
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'jump'; section: number; beat?: number }
  | { type: 'solve'; section: number; beat: number }
  | { type: 'restart' }

export const gateKey = (section: number, beat: number) => `${section}:${beat}`

export function initialRunnerState(start = 0): RunnerState {
  return { section: Math.max(0, start), beat: 0, mode: 'enter', solved: new Set() }
}

export const isComplete = (state: RunnerState, sections: Beat[][]) => state.section >= sections.length

export function kindAt(state: RunnerState, sections: Beat[][]): BeatKind | null {
  return sections[state.section]?.[state.beat]?.kind ?? null
}

/** The learner must act before moving on: an unsolved gate. */
export function isBlocked(state: RunnerState, sections: Beat[][]): boolean {
  return kindAt(state, sections) === 'gate' && !state.solved.has(gateKey(state.section, state.beat))
}

/** The stage waits here instead of auto-advancing: an unsolved gate or an explore beat. */
export function isWaiting(state: RunnerState, sections: Beat[][]): boolean {
  return isBlocked(state, sections) || kindAt(state, sections) === 'explore'
}

/** The beat each section draws: done sections their last beat, the current one its beat, later ones none. */
export function beatToDraw(state: RunnerState, sections: Beat[][], index: number): number {
  if (index < state.section) return sections[index].length - 1
  if (index === state.section) return state.beat
  return -1
}

export function runnerReducer(sections: Beat[][]) {
  const last = (s: number) => Math.max(0, sections[s].length - 1)
  return (state: RunnerState, action: RunnerAction): RunnerState => {
    switch (action.type) {
      case 'next': {
        if (isComplete(state, sections) || isBlocked(state, sections)) return state
        if (state.beat < last(state.section)) return { ...state, beat: state.beat + 1, mode: 'enter' }
        return { ...state, section: state.section + 1, beat: 0, mode: 'enter' }
      }
      case 'prev': {
        if (isComplete(state, sections)) {
          if (!sections.length) return state
          return { ...state, section: sections.length - 1, beat: last(sections.length - 1), mode: 'settle' }
        }
        if (state.beat > 0) return { ...state, beat: state.beat - 1, mode: 'settle' }
        if (state.section > 0) return { ...state, section: state.section - 1, beat: last(state.section - 1), mode: 'settle' }
        return state
      }
      case 'jump': {
        if (!sections.length) return state
        const section = Math.min(Math.max(0, action.section), sections.length - 1)
        const beat = Math.min(Math.max(0, action.beat ?? 0), last(section))
        return { ...state, section, beat, mode: 'settle' }
      }
      case 'solve': {
        const key = gateKey(action.section, action.beat)
        if (state.solved.has(key)) return state
        return { ...state, solved: new Set([...state.solved, key]) }
      }
      case 'restart':
        return { ...initialRunnerState(0), mode: 'enter' }
    }
  }
}

/** Reading-time hold of a show beat: about 230 words a minute plus 0.8s, between 1.5s and 9s. */
export function holdMs(words: number): number {
  return Math.min(9000, Math.max(1500, 800 + (words / 230) * 60000))
}
