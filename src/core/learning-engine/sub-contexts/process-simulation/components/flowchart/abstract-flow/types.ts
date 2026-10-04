import type { FlowchartRelation } from '../types';

/** Reference to a declared actor or system by ID. */
export interface Ref<T extends string = string> {
  _tag: 'ref';
  id: T;
}

/** A single result event from a step or branch. */
export interface ResultEvent {
  id: string;
  title: string;
  desc?: string;
  /** State the flow's state machine enters when this event happens (a MachineState ID). */
  enters?: string;
}

/** Base for any flow step. */
interface FlowStepBase {
  id: string;
  /** Links this step's output to the next step's input. */
  continuesAs?: string;
}

/** Linear step: EVENT → POLICY → COMMAND → HANDLER → [DELEGATE →] EVENT(S). */
export interface LinearStep extends FlowStepBase {
  type: 'linear';
  /** Optional actor that initiates this step (typically the root step). */
  initiatedBy?: Ref;
  /** The policy triggering the command. */
  policy: string;
  /** The command being executed. */
  command: string;
  /** System that handles the command; omitted for a step no system runs. */
  handledBy?: Ref;
  /** Optional secondary system the handler delegates to (sequential chain). */
  delegatesTo?: Ref;
  /** Optional actor or system that receives the step's result (message recipient). */
  sendsTo?: Ref;
  /** Resulting event(s). Always an array. */
  resultEvents: ResultEvent[];
  /** Optional description override for this step. */
  description?: string;
}

/** Branching step: one event splits into multiple policy/command paths. */
export interface BranchStep extends FlowStepBase {
  type: 'branch';
  /** The event that triggers the branch. */
  event: string;
  /** Branch options. */
  branches: BranchOption[];
}

export interface BranchOption extends FlowStepBase {
  /** Display label for the branch (shown on relation). */
  label: string;
  /** Whether this branch renders as a dashed line. */
  dashed?: boolean;
  /** Optional actor that initiates this branch path. */
  initiatedBy?: Ref;
  policy: string;
  command: string;
  /** System that handles the command; omitted for a step no system runs. */
  handledBy?: Ref;
  /** Optional secondary system the handler delegates to (sequential chain). */
  delegatesTo?: Ref;
  /** Optional actor or system that receives the step's result (message recipient). */
  sendsTo?: Ref;
  resultEvents: ResultEvent[];
  /** Optional description for this branch option. */
  description?: string;
}

export type FlowStep = LinearStep | BranchStep;

/** Declared actor (human user). */
export interface ActorDecl {
  title: string;
  desc: string;
}

/** Declared system (aggregate or external). */
export interface SystemDecl {
  title: string;
  desc: string;
  type: 'aggregate' | 'external';
  /** Optional state machine for the orchestrator entity. */
  stateMachine?: {
    states: Array<{ id: string; label: string; color: string }>;
    initialState: string;
  };
}

/** Journey step references a flow step by id with required name and description. */
export interface JourneyStepRef {
  /** Step id (linear step id or branch option id). */
  stepId: string;
  /** Short name shown as the step title in the sidebar. */
  name: string;
  /** Longer explanation shown below the name during playback. */
  description: string;
  /** Optional process group for state machine mapping. */
  /** Free-text phase label (e.g. "handshake"). */
  processGroup?: string;
}

/** A journey through the flow — one path from start to finish. */
export interface FlowJourney {
  id: string;
  label: string;
  description: string;
  steps: JourneyStepRef[];
}

/** Top-level abstract flow definition. */
export interface AbstractFlow {
  /** Human actors in this flow. */
  actors: Record<string, ActorDecl>;
  /** Systems (aggregates and externals). */
  systems: Record<string, SystemDecl>;
  /** Ordered steps defining the process. */
  steps: FlowStep[];
  /** Journeys through the flow. */
  journeys: FlowJourney[];
}

/** Derivation result mapping abstract IDs to generated entity IDs. */
export interface DerivationMap {
  /** Abstract ID → generated entity ID. */  entities: Map<string, string>;
  /** Generated relations. */
  relations: FlowchartRelation[];
}

export function isLinearStep(step: FlowStep): step is LinearStep {
  return step.type === 'linear';
}

export function isBranchStep(step: FlowStep): step is BranchStep {
  return step.type === 'branch';
}

export function ref<T extends string>(id: T): Ref<T> {
  return { _tag: 'ref', id };
}
