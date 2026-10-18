/**
 * Where authored narration steps play among a section's derived beats (decision 93 in
 * grill-log-presenting-mode.md). Pure: the stage measures which derived beat reveals each step's
 * first target and passes it in; until then a step plays before the first gate or explore beat.
 */
import type { Beat } from '../../learning-engine/sub-contexts/present-kernel'
import type { NarrationStepData } from '../../learning-engine/composition/oui/narration'

/** A beat of the merged timeline: the derived beat the renderer draws, and the narration step if it is one. */
export interface PlayBeat extends Beat {
  /** The section's own (derived) beat the renderer draws at this point. */
  derived: number
  /** Index of the narration step this beat plays, if it is one. */
  step?: number
}

/** Where a step plays when its target is not known: after the last `show` before the first gate or explore, else at the end. */
export function defaultAfter(derived: Beat[]): number {
  const first = derived.findIndex((b) => b.kind !== 'show')
  return first < 0 ? derived.length - 1 : Math.max(0, first - 1)
}

/**
 * The section's timeline with its narration steps: each step right after derived beat `after[i]`
 * (or `defaultAfter`), steps after the same beat in written order.
 */
export function mergeBeats(derived: Beat[], steps: readonly NarrationStepData[], after: ReadonlyArray<number | undefined> = []): PlayBeat[] {
  const fallback = defaultAfter(derived)
  const at = steps.map((_, i) => Math.min(derived.length - 1, Math.max(0, after[i] ?? fallback)))
  const merged: PlayBeat[] = []
  derived.forEach((beat, d) => {
    merged.push({ ...beat, derived: d })
    at.forEach((a, step) => {
      if (a === d) merged.push({ kind: 'show', derived: d, step })
    })
  })
  return merged
}
