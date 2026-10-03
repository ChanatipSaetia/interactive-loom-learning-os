/**
 * OpenUI Lang vocabulary for the Reflection & Synthesis subdomain.
 *
 *   root = ReflectionSequence("Order the lifecycle", [c1])
 *   c1 = SequenceChallenge("Put the steps in order", [a, b], [a, b])
 *   a = SequenceItem("plan", "Plan")
 */
import { z } from 'zod'
import { defineOUIComponent, defineOUISection, idOf, refOrId, sectionTailProps } from '../openui-kernel'
import type { ReflectionSequenceChallenge, ReflectionTemplateChallenge } from './schema'

// --- Reflection Sequence ---

export const SequenceItem = defineOUIComponent({
  name: 'SequenceItem',
  description: 'A draggable item in a sequence challenge.',
  props: z.object({
    id: z.string(),
    text: z.string(),
    icon: z.string().optional(),
  }),
})

export const SequenceChallenge = defineOUIComponent({
  name: 'SequenceChallenge',
  description: 'Ask the learner to order items. `solution` lists the items (references or IDs) in the correct order.',
  props: z.object({
    prompt: z.string(),
    items: z.array(SequenceItem.ref),
    solution: z.array(refOrId(SequenceItem)),
  }),
  toData: (p) => ({ prompt: p.prompt, items: p.items, solution: (p.solution as unknown[]).map(idOf) }),
})

export const ReflectionSequence = defineOUISection({
  name: 'ReflectionSequence',
  sectionType: 'reflection-sequence',
  description: 'Sequence-builder reflection: learners put steps in the right order.',
  props: z.object({
    title: z.string(),
    challenges: z.array(SequenceChallenge.ref),
    ...sectionTailProps,
  }),
  toData: (p) => ({ type: 'reflection-sequence', challenges: p.challenges as unknown as ReflectionSequenceChallenge[] }),
})

// --- Reflection Template ---

export const Chip = defineOUIComponent({
  name: 'Chip',
  description: 'A word chip the learner drops into a template blank.',
  props: z.object({
    id: z.string(),
    text: z.string(),
  }),
})

export const TemplateChallenge = defineOUIComponent({
  name: 'TemplateChallenge',
  description: 'Fill-in-the-blanks self-explanation. `template` contains {zone-id} slots; `solution` maps each zone ID to a chip ID, e.g. {"zone-1": "chip-a"}.',
  props: z.object({
    prompt: z.string(),
    template: z.string(),
    chips: z.array(Chip.ref),
    solution: z.record(z.string(), z.string()),
    explanation: z.string().optional(),
  }),
})

export const ReflectionTemplate = defineOUISection({
  name: 'ReflectionTemplate',
  sectionType: 'reflection-template',
  description: 'Self-explanation reflection: learners complete sentence templates with chips.',
  props: z.object({
    title: z.string(),
    challenges: z.array(TemplateChallenge.ref),
    ...sectionTailProps,
  }),
  toData: (p) => ({ type: 'reflection-template', challenges: p.challenges as unknown as ReflectionTemplateChallenge[] }),
})

export const reflectionSynthesisOUIComponents = [
  ReflectionSequence, SequenceChallenge, SequenceItem,
  ReflectionTemplate, TemplateChallenge, Chip,
]
