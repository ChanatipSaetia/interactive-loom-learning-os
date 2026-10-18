/**
 * Narration files (decisions 91–95 in grill-log-presenting-mode.md): `sections/<name>.narrate.oui`
 * adds explanation to a section in Loom Viewer's Present mode. Its root is `Narration([...])`; each
 * `NarrationStep` has an optional caption and effects that point at the section's statements by
 * Pick pointer (`"noCache"`, `"q2.explanation"`).
 */
import { z } from 'zod'
import { defineOUIComponent } from '../../sub-contexts/openui-kernel'

/** File of a section's narration, next to `sections/<name>.oui`. */
export const narrationPath = (section: string) => `sections/${section}.narrate.oui`
export const NARRATION_FILE = /^sections\/([a-z0-9][a-z0-9_-]*)\.narrate\.oui$/

const target = 'Pick pointer to what it points at in the section file: a statement name, optionally with a prop path, e.g. "noCache", "q2.explanation", "root.categories[0]".'

export const Highlight = defineOUIComponent({
  name: 'Highlight',
  description: 'Narration effect: outlines and pulses one element of the section for its step.',
  props: z.object({ target: z.string() }),
  fields: { target },
  toData: (p) => ({ kind: 'highlight', target: p.target }),
})

export const Callout = defineOUIComponent({
  name: 'Callout',
  description: 'Narration effect: a note that pops up beside one element of the section, with explanation the section does not say itself.',
  props: z.object({ target: z.string(), text: z.string() }),
  fields: {
    target,
    text: 'The note, one or two short sentences. Narration reads it after the caption.',
  },
  toData: (p) => ({ kind: 'callout', target: p.target, text: p.text }),
})

export const Spotlight = defineOUIComponent({
  name: 'Spotlight',
  description: 'Narration effect: the camera moves in on these elements and dims the rest of the section.',
  props: z.object({ targets: z.array(z.string()) }),
  fields: { targets: 'Pick pointers of the elements to frame together, e.g. ["noCache", "noStore"].' },
  toData: (p) => ({ kind: 'spotlight', targets: p.targets }),
})

export const NarrationStep = defineOUIComponent({
  name: 'NarrationStep',
  description: 'One narrated step: a caption line and effects. It plays right after the beat that shows its first target (untargeted steps before the first question or exploring).',
  props: z.object({
    caption: z.string().optional(),
    effects: z.array(z.union([Highlight.ref, Callout.ref, Spotlight.ref])).optional(),
  }),
  fields: {
    caption: 'Subtitle line shown (and read aloud) for the step; null for none.',
    effects: 'Highlight, Callout and Spotlight calls for the step.',
  },
})

export const Narration = defineOUIComponent({
  name: 'Narration',
  description: 'Root of a narration file sections/<name>.narrate.oui: the steps Present mode adds to that section.',
  props: z.object({ steps: z.array(NarrationStep.ref) }),
  fields: { steps: 'The narrated steps in order, as NarrationStep references.' },
})

export const NARRATION_COMPONENTS = [Narration, NarrationStep, Highlight, Callout, Spotlight]

export type NarrationEffect =
  | { kind: 'highlight'; target: string }
  | { kind: 'callout'; target: string; text: string }
  | { kind: 'spotlight'; targets: string[] }

export interface NarrationStepData {
  caption?: string
  effects?: NarrationEffect[]
}

export interface NarrationData {
  steps: NarrationStepData[]
}

/** Every target a step points at, in order (Spotlight's targets after the others). */
export function stepTargets(step: NarrationStepData): string[] {
  return (step.effects ?? []).flatMap((e) => (e.kind === 'spotlight' ? e.targets : [e.target]))
}

/** The statement a target names: "q2.explanation" → "q2". */
export const targetStatement = (target: string) => /^[^.[]*/.exec(target)?.[0] ?? target

/** The first prop a target names, if any: "q2.explanation" → "explanation", "root.items[0]" → "items". */
export const targetProp = (target: string) => /^[^.[]*\.([A-Za-z_]\w*)/.exec(target)?.[1]
