/**
 * Where a viewer is in a presented topic, and how next / previous / jump move them
 * (decisions 68, 89 and 101 in grill-log-presenting-mode.md). Pure: the stage animates the result.
 * Every beat plays by itself, so nothing ever blocks the way forward.
 */
import type { Beat } from '../../learning-engine/sub-contexts/present-kernel'

export interface RunnerState {
  /** Current section; equals the section count once the topic is complete. */
  section: number
  beat: number
  /** `enter` plays the beat's entrance; `settle` draws its end state at once (going back, jumping). */
  mode: 'enter' | 'settle'
}

export type RunnerAction =
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'jump'; section: number; beat?: number }
  | { type: 'restart' }

export function initialRunnerState(start = 0, beat = 0): RunnerState {
  return { section: Math.max(0, start), beat: Math.max(0, beat), mode: 'enter' }
}

export const isComplete = (state: RunnerState, sections: Beat[][]) => state.section >= sections.length

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
        if (isComplete(state, sections)) return state
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
      case 'restart':
        return initialRunnerState(0)
    }
  }
}

/** Reading-time hold of a beat: about 230 words a minute plus 0.8s, between 1.5s and 9s. */
export function holdMs(words: number): number {
  return Math.min(9000, Math.max(1500, 800 + (words / 230) * 60000))
}
