/**
 * OpenUI Lang vocabulary for the Process & Event Workflow Simulation subdomain.
 *
 * Flowcharts follow the Event Storming cycle
 * EVENT → POLICY → COMMAND → AGGREGATE/EXTERNAL → EVENT. Actors and systems
 * are declared once and referenced from steps:
 *
 *   root = Flowchart("Checkout", [buyer], [orders], [place], [happy])
 *   buyer = Actor("buyer", "Buyer", "Person placing the order")
 *   orders = System("orders", "Order Service", "Owns orders", "aggregate")
 *   place = Step("place-order", "When cart is submitted", "PlaceOrder", orders, [Event("order-placed", "Order Placed")], buyer)
 *   happy = Journey("happy", "Happy path", "Order goes through", [JourneyStep(place, "Place order", "Buyer submits the cart")])
 */
import { z } from 'zod'
import {
  byId,
  call,
  defineOUIComponent,
  defineOUISection,
  idOf,
  refOrId,
  refTo,
  sectionFields, sectionTail,
  sectionTailProps,
  type LoomOUIComponent,
  type OUIValue,
} from '../openui-kernel'
import { ref } from './components/flowchart/abstract-flow/types'
import type { AbstractFlow, ActorDecl, BranchOption as BranchOptionData, FlowJourney, FlowStep, ResultEvent, SystemDecl } from './components/flowchart/abstract-flow/types'
import type { FlowchartSectionData, ScenarioNode as ScenarioNodeData, ScenarioSectionData } from './schema'

// --- Flowchart: declarations ---

export const Actor = defineOUIComponent({
  name: 'Actor',
  description: 'A human actor (user role) who initiates steps.',
  props: z.object({
    id: z.string(),
    title: z.string(),
    desc: z.string(),
  }),
  fields: {
    id: 'Actor ID, unique within the flowchart; steps refer to it with `initiatedBy`.',
    title: 'Actor name shown on its sticky (e.g. "Buyer").',
    desc: 'What this actor is or wants.',
  },
})

export const MachineState = defineOUIComponent({
  name: 'MachineState',
  description: 'A state of a system state machine.',
  props: z.object({
    id: z.string(),
    label: z.string(),
    color: z.string(),
  }),
  fields: {
    id: 'State ID, unique within the state machine.',
    label: 'State name shown in the state machine view.',
    color: 'CSS colour for the state, e.g. "var(--ctp-green)" or "#a6d189".',
  },
})

export const StateMachine = defineOUIComponent({
  name: 'StateMachine',
  description: 'State machine for an orchestrating system. `initialState` is a state ID.',
  props: z.object({
    states: z.array(MachineState.ref),
    initialState: z.string(),
  }),
  fields: {
    states: 'The states, as MachineState references.',
    initialState: 'ID of the starting MachineState.',
  },
})

export const System = defineOUIComponent({
  name: 'System',
  description: 'A system that handles commands: an "aggregate" (owned domain model) or an "external" service.',
  props: z.object({
    id: z.string(),
    title: z.string(),
    desc: z.string(),
    kind: z.enum(['aggregate', 'external']).optional(),
    stateMachine: StateMachine.ref.optional(),
  }),
  fields: {
    id: 'System ID, unique within the flowchart; steps refer to it with `handledBy` / `delegatesTo`.',
    title: 'System name shown on its sticky (e.g. "Order Service").',
    desc: 'What the system owns or does.',
    kind: 'Optional "aggregate" (owned domain model) or "external" (outside service). Default "external".',
    stateMachine: 'Optional StateMachine(...) for a system that orchestrates the flow.',
  },
  toData: (p) => ({
    id: p.id,
    title: p.title,
    desc: p.desc,
    type: p.kind ?? 'external',
    stateMachine: p.stateMachine,
  }),
})

// --- Flowchart: steps ---

export const Event = defineOUIComponent({
  name: 'Event',
  description: 'A domain event produced by a step (past tense, e.g. "Order Placed").',
  props: z.object({
    id: z.string(),
    title: z.string(),
    desc: z.string().optional(),
  }),
  fields: {
    id: 'Event ID, unique within the flowchart.',
    title: 'Event name in past tense (e.g. "Order Placed").',
    desc: 'Optional detail about the event.',
  },
})

const handlerProps = {
  policy: z.string(),
  command: z.string(),
  handledBy: refOrId(System),
  events: z.array(Event.ref),
}

const optionalChainProps = {
  initiatedBy: refOrId(Actor).optional(),
  delegatesTo: refOrId(System).optional(),
  continuesAs: z.string().optional(),
  description: z.string().optional(),
  sendsTo: z.union([z.string(), Actor.ref, System.ref]).optional(),
}

const handlerFields = {
  policy: 'Policy that reacts to the incoming event ("When …"); the POLICY sticky.',
  command: 'Command the policy issues, in imperative form (e.g. "PlaceOrder").',
  handledBy: 'System that handles the command (System reference or ID).',
  events: 'Events the handler emits, as Event references (past tense).',
} as const

const optionalChainFields = {
  initiatedBy: 'Optional actor that starts this path (Actor reference or ID), usually on the first step.',
  delegatesTo: 'Optional second system the handler calls (System reference or ID).',
  continuesAs: 'Optional ID of the Step, Branch or BranchOption that this path\'s events lead into.',
  description: 'Optional narration of this step, shown when it is highlighted.',
  sendsTo: 'Optional actor or system that receives this step\'s events (e.g. the server sends ServerHello to the client).',
} as const

function toRef(value: unknown) {
  return value === undefined ? undefined : ref(idOf(value))
}

export const Step = defineOUIComponent({
  name: 'Step',
  description: 'Linear Event Storming step: POLICY → COMMAND → handledBy system → resulting events. `initiatedBy` is the actor that starts it; `delegatesTo` a system the handler calls.',
  props: z.object({
    id: z.string(),
    ...handlerProps,
    ...optionalChainProps,
  }),
  fields: {
    id: 'Step ID, unique within the flowchart; journeys and `continuesAs` refer to it.',
    ...handlerFields,
    ...optionalChainFields,
  },
  toData: (p) => ({
    type: 'linear',
    id: p.id,
    initiatedBy: toRef(p.initiatedBy),
    policy: p.policy,
    command: p.command,
    handledBy: toRef(p.handledBy),
    delegatesTo: toRef(p.delegatesTo),
    sendsTo: toRef(p.sendsTo),
    resultEvents: p.events,
    continuesAs: p.continuesAs,
    description: p.description,
  }),
})

export const BranchOption = defineOUIComponent({
  name: 'BranchOption',
  description: 'One path of a branch: label, then the same POLICY → COMMAND → system → events cycle as a Step.',
  props: z.object({
    id: z.string(),
    label: z.string(),
    ...handlerProps,
    dashed: z.boolean().optional(),
    ...optionalChainProps,
  }),
  fields: {
    id: 'Option ID, unique within the flowchart; journeys and `continuesAs` refer to it.',
    label: 'Label drawn on the branch edge (e.g. "approved").',
    ...handlerFields,
    dashed: 'Optional: true draws this path as a dashed line (e.g. an error path).',
    ...optionalChainFields,
  },
  toData: (p) => ({
    id: p.id,
    label: p.label,
    dashed: p.dashed,
    initiatedBy: toRef(p.initiatedBy),
    policy: p.policy,
    command: p.command,
    handledBy: toRef(p.handledBy),
    delegatesTo: toRef(p.delegatesTo),
    sendsTo: toRef(p.sendsTo),
    resultEvents: p.events,
    continuesAs: p.continuesAs,
    description: p.description,
  }),
})

export const Branch = defineOUIComponent({
  name: 'Branch',
  description: 'Branching step: one event splits into several policy/command paths.',
  props: z.object({
    id: z.string(),
    event: z.string(),
    options: z.array(BranchOption.ref),
  }),
  fields: {
    id: 'Branch ID, unique within the flowchart.',
    event: 'The event that splits into the options (e.g. "Payment Checked").',
    options: 'The paths, as BranchOption references.',
  },
  toData: (p) => ({ type: 'branch', id: p.id, event: p.event, branches: p.options }),
})

// --- Flowchart: journeys ---

export const JourneyStep = defineOUIComponent({
  name: 'JourneyStep',
  description: 'A stop on a journey: the Step or BranchOption it plays (reference or ID), with a short name and narration. `processGroup` groups stops for the state machine (e.g. "planning", "execution").',
  props: z.object({
    step: z.union([z.string(), Step.ref, BranchOption.ref]),
    name: z.string(),
    description: z.string(),
    processGroup: z.string().optional(),
  }),
  fields: {
    step: 'The Step or BranchOption this stop plays (reference or ID).',
    name: 'Short stop name shown in the journey list.',
    description: 'Narration shown while the stop is played.',
    processGroup: 'Optional phase used by the state machine (e.g. "planning", "execution").',
  },
  toData: (p) => ({ stepId: idOf(p.step), name: p.name, description: p.description, processGroup: p.processGroup }),
})

export const Journey = defineOUIComponent({
  name: 'Journey',
  description: 'A guided path through the flow, from start to finish.',
  props: z.object({
    id: z.string(),
    label: z.string(),
    description: z.string(),
    steps: z.array(JourneyStep.ref),
  }),
  fields: {
    id: 'Journey ID, unique within the flowchart.',
    label: 'Journey name shown in the journey picker (e.g. "Happy path").',
    description: 'What this journey walks through.',
    steps: 'The stops in order, as JourneyStep references.',
  },
})

// --- Flowchart printing (data → call tree) ---

function refId(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  return idOf(value) || undefined
}

function eventCalls(events: ResultEvent[] | undefined): OUIValue[] {
  return (events ?? []).map((e) => call(Event, { id: e.id, title: e.title, desc: e.desc }))
}

function chainProps(step: { initiatedBy?: unknown; delegatesTo?: unknown; sendsTo?: unknown; continuesAs?: string; description?: string }) {
  return {
    initiatedBy: refTo(Actor, refId(step.initiatedBy)),
    delegatesTo: refTo(System, refId(step.delegatesTo)),
    sendsTo: refTo([Actor, System], refId(step.sendsTo)),
    continuesAs: step.continuesAs,
    description: step.description,
  }
}

function stepCall(step: FlowStep): OUIValue {
  if (step.type === 'branch') {
    return call(Branch, {
      id: step.id,
      event: step.event,
      options: step.branches.map((b: BranchOptionData) => call(BranchOption, {
        id: b.id,
        label: b.label,
        policy: b.policy,
        command: b.command,
        handledBy: refTo(System, refId(b.handledBy)),
        events: eventCalls(b.resultEvents),
        dashed: b.dashed,
        ...chainProps(b),
      })),
    }, step.id)
  }
  return call(Step, {
    id: step.id,
    policy: step.policy,
    command: step.command,
    handledBy: refTo(System, refId(step.handledBy)),
    events: eventCalls(step.resultEvents),
    ...chainProps(step),
  }, step.id)
}

export const Flowchart: LoomOUIComponent = defineOUISection({
  name: 'Flowchart',
  sectionType: 'flowchart',
  description: 'Animated Event Storming flowchart. Every actor and system must be used by at least one step.',
  props: z.object({
    title: z.string(),
    actors: z.array(Actor.ref),
    systems: z.array(System.ref),
    steps: z.array(z.union([Step.ref, Branch.ref])),
    journeys: z.array(Journey.ref),
    ...sectionTailProps,
  }),
  fields: {
    ...sectionFields,
    actors: 'Human actors, as Actor references. Each must start at least one step.',
    systems: 'Systems, as System references. Each must handle or receive at least one step.',
    steps: 'The flow, as Step and Branch references, in order.',
    journeys: 'Guided paths through the flow, as Journey references.',
  },
  toData: (p) => {
    const actors: Record<string, ActorDecl> = {}
    for (const [id, a] of Object.entries(byId(p.actors as unknown as Array<ActorDecl & { id: string }>))) {
      actors[id] = { title: a.title, desc: a.desc }
    }
    const systems: Record<string, SystemDecl> = {}
    for (const [id, s] of Object.entries(byId(p.systems as unknown as Array<SystemDecl & { id: string }>))) {
      systems[id] = { title: s.title, desc: s.desc, type: s.type, stateMachine: s.stateMachine }
      if (!s.stateMachine) delete systems[id].stateMachine
    }
    return {
      type: 'flowchart',
      flow: {
        actors,
        systems,
        steps: p.steps as unknown as FlowStep[],
        journeys: p.journeys as unknown as FlowJourney[],
      },
    }
  },
  fromData: (data: FlowchartSectionData, meta) => {
    const flow = (data.flow ?? { actors: {}, systems: {}, steps: [], journeys: [] }) as unknown as AbstractFlow
    return call(Flowchart, {
      title: meta.title ?? '',
      actors: Object.entries(flow.actors ?? {}).map(([id, a]) => call(Actor, { id, title: a.title, desc: a.desc ?? '' }, id)),
      systems: Object.entries(flow.systems ?? {}).map(([id, sys]) => call(System, {
        id,
        title: sys.title,
        desc: sys.desc ?? '',
        kind: sys.type,
        stateMachine: sys.stateMachine
          ? call(StateMachine, {
            states: sys.stateMachine.states.map((st) => call(MachineState, { id: st.id, label: st.label, color: st.color })),
            initialState: sys.stateMachine.initialState,
          })
          : undefined,
      }, id)),
      steps: (flow.steps ?? []).map(stepCall),
      journeys: (flow.journeys ?? []).map((j) => call(Journey, {
        id: j.id,
        label: j.label,
        description: j.description,
        steps: j.steps.map((js) => call(JourneyStep, {
          step: refTo([Step, BranchOption], js.stepId),
          name: js.name,
          description: js.description,
          processGroup: js.processGroup,
        })),
      }, j.id)),
      ...sectionTail(meta),
    })
  },
})

// --- Scenario ---

export const Outcome = defineOUIComponent({
  name: 'Outcome',
  description: 'End of a scenario path: verdict, lesson, and rating ("a", "b-plus", "b-minus" or "c").',
  props: z.object({
    verdict: z.string(),
    lesson: z.string(),
    rating: z.enum(['a', 'b-plus', 'b-minus', 'c']),
  }),
  fields: {
    verdict: 'Short judgement of the path taken (e.g. "Solid call").',
    lesson: 'What the learner should take away.',
    rating: 'Grade of the path: "a", "b-plus", "b-minus" or "c".',
  },
})

export const ScenarioChoice = defineOUIComponent({
  name: 'ScenarioChoice',
  description: 'A choice in a scenario. `next` is the ID of the node it leads to.',
  props: z.object({
    id: z.string(),
    text: z.string(),
    next: z.string(),
  }),
  fields: {
    id: 'Choice ID, unique within its node.',
    text: 'Choice text shown on the button.',
    next: 'ID of the ScenarioNode this choice leads to.',
  },
})

export const ScenarioNode = defineOUIComponent({
  name: 'ScenarioNode',
  description: 'A scenario node: a prompt with choices, or an outcome.',
  props: z.object({
    id: z.string(),
    prompt: z.string().optional(),
    choices: z.array(ScenarioChoice.ref).optional(),
    outcome: Outcome.ref.optional(),
  }),
  fields: {
    id: 'Node ID, unique within the scenario; choices point at it with `next`.',
    prompt: 'Situation and question shown at this node (prompt nodes).',
    choices: 'Options, as ScenarioChoice references (prompt nodes).',
    outcome: 'Outcome(...) ending (outcome nodes, instead of prompt/choices).',
  },
})

export const Scenario: LoomOUIComponent = defineOUISection({
  name: 'Scenario',
  sectionType: 'scenario',
  description: 'Branching "what would you do?" scenario. `startNode` defaults to "start". `displayTitle` overrides the title shown inside the scenario.',
  props: z.object({
    title: z.string(),
    id: z.string(),
    nodes: z.array(ScenarioNode.ref),
    intro: z.string().optional(),
    startNode: z.string().optional(),
    displayTitle: z.string().optional(),
    ...sectionTailProps,
  }),
  fields: {
    ...sectionFields,
    id: 'Scenario ID, unique within the topic.',
    nodes: 'All nodes, as ScenarioNode references.',
    intro: 'Optional setup text shown before the first node.',
    startNode: 'Optional ID of the first node (default "start").',
    displayTitle: 'Optional title shown inside the scenario instead of `title`.',
  },
  toData: (p) => ({
    type: 'scenario',
    id: p.id,
    title: p.displayTitle ?? p.title,
    intro: p.intro,
    nodes: byId(p.nodes as unknown as ScenarioNodeData[]),
    startNode: p.startNode ?? 'start',
  }),
  fromData: (data: ScenarioSectionData, meta) => call(Scenario, {
    title: meta.title || data.title || '',
    displayTitle: data.title && data.title !== (meta.title || data.title) ? data.title : undefined,
    id: data.id,
    nodes: Object.entries(data.nodes).map(([id, n]) => call(ScenarioNode, {
      id,
      prompt: n.prompt ?? n.text,
      choices: n.choices?.map((c) => call(ScenarioChoice, { id: c.id ?? '', text: c.text ?? c.label ?? '', next: c.next ?? c.nextNode ?? '' })),
      outcome: n.outcome ? call(Outcome, { verdict: n.outcome.verdict, lesson: n.outcome.lesson, rating: n.outcome.rating }) : undefined,
    }, id)),
    intro: data.intro,
    startNode: (data.startNode ?? data.initialNode) === 'start' ? undefined : (data.startNode ?? data.initialNode),
    ...sectionTail(meta),
  }),
})

export const processSimulationOUIComponents = [
  Flowchart, Actor, System, StateMachine, MachineState,
  Step, Branch, BranchOption, Event, Journey, JourneyStep,
  Scenario, ScenarioNode, ScenarioChoice, Outcome,
]
