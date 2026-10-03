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
  sectionTail,
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
})

export const MachineState = defineOUIComponent({
  name: 'MachineState',
  description: 'A state of a system state machine.',
  props: z.object({
    id: z.string(),
    label: z.string(),
    color: z.string(),
  }),
})

export const StateMachine = defineOUIComponent({
  name: 'StateMachine',
  description: 'State machine for an orchestrating system. `initialState` is a state ID.',
  props: z.object({
    states: z.array(MachineState.ref),
    initialState: z.string(),
  }),
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
}

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
  toData: (p) => ({
    type: 'linear',
    id: p.id,
    initiatedBy: toRef(p.initiatedBy),
    policy: p.policy,
    command: p.command,
    handledBy: toRef(p.handledBy),
    delegatesTo: toRef(p.delegatesTo),
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
  toData: (p) => ({
    id: p.id,
    label: p.label,
    dashed: p.dashed,
    initiatedBy: toRef(p.initiatedBy),
    policy: p.policy,
    command: p.command,
    handledBy: toRef(p.handledBy),
    delegatesTo: toRef(p.delegatesTo),
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
})

// --- Flowchart printing (data → call tree) ---

function refId(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  return idOf(value) || undefined
}

function eventCalls(events: ResultEvent[] | undefined): OUIValue[] {
  return (events ?? []).map((e) => call(Event, { id: e.id, title: e.title, desc: e.desc }))
}

function chainProps(step: { initiatedBy?: unknown; delegatesTo?: unknown; continuesAs?: string; description?: string }) {
  return {
    initiatedBy: refTo(Actor, refId(step.initiatedBy)),
    delegatesTo: refTo(System, refId(step.delegatesTo)),
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
})

export const ScenarioChoice = defineOUIComponent({
  name: 'ScenarioChoice',
  description: 'A choice in a scenario. `next` is the ID of the node it leads to.',
  props: z.object({
    id: z.string(),
    text: z.string(),
    next: z.string(),
  }),
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
