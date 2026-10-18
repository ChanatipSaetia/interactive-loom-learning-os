/**
 * Which beat each authored narration step plays on (decision 108 in grill-log-presenting-mode.md):
 * the one its `beat` names. A step naming no beat of the section does not play (validation warns).
 */
import type { Beat } from '../../learning-engine/sub-contexts/present-kernel'
import type { NarrationStepData } from '../../learning-engine/composition/oui/narration'

/** Per beat, the indexes of the steps that play during it, in written order. */
export function stepsByBeat(beats: Beat[], steps: ReadonlyArray<Pick<NarrationStepData, 'beat'>>): number[][] {
  const at = new Map(beats.map((b, i) => [b.id, i]))
  const byBeat: number[][] = beats.map(() => [])
  steps.forEach((step, i) => {
    const beat = at.get(step.beat)
    if (beat !== undefined) byBeat[beat].push(i)
  })
  return byBeat
}
