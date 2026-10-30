/**
 * Narration files (decisions 91–95 and 108 in grill-log-presenting-mode.md): `sections/<name>.narrate.oui`
 * is the script a section plays to in Loom Viewer's Present mode. Its root is `Narration([...])`; each
 * `NarrationStep` names the beat it plays on (`"q1.wrong"`), with an optional caption and effects that
 * point at the section's statements by Pick pointer (`"noCache"`, `"q2.explanation"`).
 */
import { z } from 'zod'
import { defineOUIComponent } from '../../sub-contexts/openui-kernel'
import type { Beat } from '../../sub-contexts/present-kernel'

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
  description: 'One narrated step: the beat it plays on, a caption line read aloud, and effects. Several steps on one beat play in turn.',
  props: z.object({
    beat: z.string(),
    caption: z.string().optional(),
    effects: z.array(z.union([Highlight.ref, Callout.ref, Spotlight.ref])).optional(),
  }),
  fields: {
    beat: 'The beat it plays on, by its ID for the section type, e.g. "q1", "q1.wrong", "q1.right" for a quiz, "p2" for a text paragraph (see Narration Files).',
    caption: 'Subtitle line shown and read aloud while the beat plays, in the topic\'s language; null for none.',
    effects: 'Highlight, Callout and Spotlight calls for the step.',
  },
})

export const Narration = defineOUIComponent({
  name: 'Narration',
  description: 'Root of a narration file sections/<name>.narrate.oui: the script Present mode plays the section to, step by step.',
  props: z.object({ steps: z.array(NarrationStep.ref) }),
  fields: { steps: 'The narrated steps in order, as NarrationStep references.' },
})

export const NARRATION_COMPONENTS = [Narration, NarrationStep, Highlight, Callout, Spotlight]

export type NarrationEffect =
  | { kind: 'highlight'; target: string }
  | { kind: 'callout'; target: string; text: string }
  | { kind: 'spotlight'; targets: string[] }

export interface NarrationStepData {
  /** The beat ID it plays on (decision 108). */
  beat: string
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

/**
 * Beat IDs per section type, as each type's `toBeats` names them (decision 108); `n` counts from 1.
 * The authoring prompt lists them; a unit test checks them against `toBeats`.
 */
export const BEAT_IDS: Record<string, string> = {
  intro: '`title` (when it has a title or tagline), `what`, `why`, `roadmap` (when it has a roadmap)',
  text: '`p1`, `p2`, … for each paragraph; long prose continues as `p1.part2`, `p1.part3`, … in short scenes, preserving Markdown constructs',
  bullets: '`item1`, `item2`, … one per top-level bullet; nested points get their own beats in depth-first order, progressively revealed on pages measured to fit (parents stay visible): `item1.child1`, `item1.child1.child1`, `item1.child2`, …',
  'pillar-layer': '`layer1`, `layer2`, … one per layer',
  'image-gallery': '`image1`, `image2`, … one per image',
  'taxonomy-browser': '`cards` (all cards), then `card1`, `card2`, … each card opened',
  'concept-map': '`group1`, `group2`, … introduce categories in first-appearance order; after each group, `linkN` explains every ConceptLink whose endpoints are now introduced (N is its 1-based position in the links list); then `map` shows the complete map when there are links or several groups. Explain from → label → to without assuming every relation is a flow or a cause.',
  flowchart: '`step1`, `step2`, … one per step of the first journey',
  scenario: '`start`; then one path per ending (weaker endings first, the best last): along path P, `pathP.choice1` (the choice picked on its card), `pathP.choice1.next` (where it leads), `pathP.choice2`, … (the last `.next` shows its ending); a later path starts at the fork where it leaves the one before',
  'decision-tree': '`start` (the first question), then per answer taken (the recommended choice, else the first) `answer1` (picked on its question, with its rationale), `q2` (the next question), `answer2`, …, then `result` (the recommendation)',
  'tradeoff-sandbox': '`step1`, `step2`, … one per step (numbered across scenarios), each followed by `stepN.choice1`, `stepN.choice2`, … (the gains and costs of each choice that has some, numbered in the step) and `stepN.recommended` when it has a recommended choice; then `result1`, `result2`, … one per scenario with a recommendation',
  'formula-sandbox': '`formulas`, then `sweep1`, `sweep2`, … one per variable that can move (it sweeps from its min to its max while the trend of each metric is stated)',
  quiz: '`q1`, `q1.wrong`, `q1.right`, `q2`, … per question: asked, its first wrong choice tried, the right answer given',
  flashcards: '`card1`, `card1.back`, `card2`, … per card: its word, then its definition',
  'reflection-sequence': '`c1`, `c1.step1`, `c1.step2`, …, `c1.solved`, `c2`, … per challenge: the prompt, then each item placed in its slot in the right order, one per step, then the order confirmed',
  'reflection-template': '`c1`, `c1.step1`, `c1.step2`, …, `c1.solved`, `c2`, … per challenge: the prompt, then each blank filled with its chip in reading order, one per step, then the sentence confirmed with its explanation',
  openui: '`part1`, `part2`, … one per item of the children list of a `Card([...])` or `Stack([...])` root with more than one, in order (name those items as statements to point at them); any other root plays in one beat, `all`',
}

/**
 * A first narration file for a section (Studio's Add narration, decision 108): one step per beat, its
 * caption a placeholder saying what the beat shows, for the author to rewrite as speech.
 */
export function narrationTemplate(beats: Beat[]): string {
  const name = (id: string) => id.replace(/\W+/g, '_')
  const steps = beats.map((b) => `// ${b.about ?? b.id}\n${name(b.id)} = NarrationStep(${JSON.stringify(b.id)}, ${JSON.stringify(b.about ?? '')})`)
  return `// One step per beat: rewrite each caption as what the narrator says, in the topic's language.\nroot = Narration([${beats.map((b) => name(b.id)).join(', ')}])\n\n${steps.join('\n\n')}\n`
}
