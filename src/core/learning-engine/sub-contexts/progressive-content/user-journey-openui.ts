import { z } from 'zod'
import { call, defineOUIComponent, defineOUISection, sectionFields, sectionTail, sectionTailProps, type LoomOUIComponent } from '../openui-kernel'
import type { UserJourneySectionData } from './user-journey'

export const JourneyStage = defineOUIComponent({
  name: 'JourneyStage', description: 'One stage of a person’s experience: their goal, action, product response, and optional friction, recovery and outcome.',
  props: z.object({ name: z.string(), goal: z.string(), action: z.string(), response: z.string(), friction: z.string().optional(), recovery: z.string().optional(), outcome: z.string().optional() }),
  fields: {
    name: 'Short stage name used in the journey rail.', goal: 'What the person wants to accomplish in this stage.',
    action: 'What the person actually does.', response: 'What the product, service or staff visibly does in response.',
    friction: 'Optional difficulty or unmet need; do not invent research findings.',
    recovery: 'Optional way to address the authored friction; requires friction.',
    outcome: 'Optional resulting state or next step; do not assume success.',
  },
})
export const UserJourney: LoomOUIComponent = defineOUISection({
  name: 'UserJourney', sectionType: 'user-journey',
  description: 'A person’s experience across product or service stages. Read explores stages; Present walks goals, actions, responses and optional friction and outcomes without an Event Storming diagram.',
  props: z.object({ title: z.string(), person: z.string(), goal: z.string(), stages: z.array(JourneyStage.ref), ...sectionTailProps }),
  fields: { ...sectionFields, person: 'Person or role experiencing the journey.', goal: 'Overall goal across the journey.', stages: 'Ordered JourneyStage references. Works for physical products, software and services.' },
  toData: (p) => ({ type: 'user-journey', title: p.title, person: p.person, goal: p.goal, stages: p.stages }),
  fromData: (data: UserJourneySectionData, meta) => call(UserJourney, {
    title: meta.title || data.title, person: data.person, goal: data.goal,
    stages: data.stages.map((stage, i) => call(JourneyStage, stage, `stage${i + 1}`)), ...sectionTail(meta),
  }),
})
export const userJourneyOUIComponents = [UserJourney, JourneyStage]
