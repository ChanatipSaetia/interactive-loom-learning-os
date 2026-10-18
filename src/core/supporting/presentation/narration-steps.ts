/**
 * Which beat each authored narration step rides on (decisions 96–98 in grill-log-presenting-mode.md).
 * Pure: the stage measures which derived beat reveals each step's first target and passes it in;
 * until then (or without a target) a step rides on the last `show` beat before the first gate or
 * explore beat.
 */
import type { Beat } from '../../learning-engine/sub-contexts/present-kernel'

/** The beat an untargeted step rides on: the last `show` before the first gate or explore, else the last beat. */
export function defaultBeat(beats: Beat[]): number {
  const first = beats.findIndex((b) => b.kind !== 'show')
  return first < 0 ? beats.length - 1 : Math.max(0, first - 1)
}

/** Per beat, the indexes of the steps that play during it, in written order. */
export function stepsByBeat(beats: Beat[], stepCount: number, at: ReadonlyArray<number | undefined> = []): number[][] {
  const byBeat: number[][] = beats.map(() => [])
  const fallback = defaultBeat(beats)
  for (let step = 0; step < stepCount; step++) {
    const beat = Math.min(beats.length - 1, Math.max(0, at[step] ?? fallback))
    byBeat[beat]?.push(step)
  }
  return byBeat
}
