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
  /** System that handles the command. */
  handledBy: Ref;
  /** Optional secondary system the handler delegates to (sequential chain). */
  delegatesTo?: Ref;
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
  policy: string;
  command: string;
  handledBy: Ref;
  /** Optional secondary system the handler delegates to (sequential chain). */
  delegatesTo?: Ref;
  resultEvents: ResultEvent[];
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

/** Journey step references a node and provides custom description. */
export interface JourneyStepRef {
  /** Node ID (entity ID) in the derived schema. */
  nodeId: string;
  /** Custom description for this journey step. */
  description: string;
  /** Optional process group for state machine mapping. */
  processGroup?: 'planning' | 'execution' | 'evaluation' | 'escalation';
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
