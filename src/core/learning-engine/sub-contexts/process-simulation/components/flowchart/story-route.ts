import { buildCanonicalIdMapper } from './abstract-flow/derive';
import type { FlowchartStep, UnifiedFlowchartSchema } from './types';

/** Views where playback reads as a route between systems rather than a walk along a timeline. */
export const STORY_ROUTE_VIEWS = new Set(['SYS_ARCH']);

/** The journey drawn as messages between the systems of one view. */
export interface StoryRoute {
  /** Edges the current step's messages travel. */
  currentEdgeIds: string[];
  /** The one current edge that carries the label: the step's main message. */
  labelEdgeId?: string;
  /** Current edges travelled against their stored direction (to → from on a two-way edge). */
  reversedEdgeIds: string[];
  /** Actors and systems taking part in the current step. */
  currentNodeIds: string[];
  /** What the current step does ("Send Server Certificate"). */
  currentLabel: string;
  /** 1-based number of the current step. */
  currentNumber: number;
  /** A step that sends nothing: its label sits on this box instead of on a line. */
  badgeNodeId?: string;
  /** Edges walked by earlier steps, with the step numbers that walked them. */
  trail: Record<string, number[]>;
  /** Boxes where earlier steps happened without sending anything, with their step numbers. */
  nodeTrail: Record<string, number[]>;
}

interface StepMessages {
  /** Main message first; the rest are drawn as secondary lines. */
  edgeIds: string[];
  reversedEdgeIds: string[];
  nodeIds: string[];
  /** Where the step happens when it sends nothing. */
  badgeNodeId?: string;
}

/**
 * Reads each journey step as the messages it declares, nothing inferred:
 *   initiatedBy → handledBy   (the command; main message)
 *   handledBy → sendsTo       (the result sent on; main message when there is no initiator)
 *   initiatedBy → sendsTo     (a step no system runs)
 *   handledBy → delegatesTo   (secondary)
 * A message is drawn only along an edge of the view that runs that way. A step
 * that sends nothing (e.g. a local check) lights its box and carries its label
 * as a badge there.
 */
export function computeStoryRoute(
  schema: UnifiedFlowchartSchema,
  viewKey: string,
  steps: FlowchartStep[] | undefined,
  currentStep: number
): StoryRoute | null {
  if (!STORY_ROUTE_VIEWS.has(viewKey) || !steps || currentStep < 0 || currentStep >= steps.length) return null;
  const view = schema.views?.[viewKey];
  if (!view) return null;

  const canonical = buildCanonicalIdMapper(schema.entities);
  const inView = new Set(view.nodes.map(n => n.id));
  const relations = schema.relations.filter(r => r.views?.includes(viewKey));
  const toView = (id: string | undefined) => {
    const c = id ? canonical(id) : undefined;
    return c && inView.has(c) ? c : undefined;
  };
  const edgeBetween = (from: string | undefined, to: string | undefined) => {
    if (!from || !to || from === to) return undefined;
    const forward = relations.find(r => r.from === from && r.to === to);
    if (forward) return { id: forward.id, reversed: false };
    const backward = relations.find(r => r.bidirectional && r.from === to && r.to === from);
    return backward ? { id: backward.id, reversed: true } : undefined;
  };

  const messagesOf = (step: FlowchartStep): StepMessages => {
    const roles = step.roles;
    const initiator = toView(roles?.initiator);
    const handler = toView(roles?.handler);
    const delegate = toView(roles?.delegate);
    const recipient = toView(roles?.recipient);
    const edges = [
      edgeBetween(initiator, handler),
      edgeBetween(handler, recipient),
      handler ? undefined : edgeBetween(initiator, recipient),
      edgeBetween(handler, delegate),
    ].filter((e): e is { id: string; reversed: boolean } => !!e);
    const nodeIds = [initiator, handler, delegate, recipient].filter((id): id is string => !!id);
    return {
      edgeIds: [...new Set(edges.map(e => e.id))],
      reversedEdgeIds: edges.filter(e => e.reversed).map(e => e.id),
      nodeIds: [...new Set(nodeIds)],
      badgeNodeId: edges.length === 0 ? handler ?? initiator ?? recipient : undefined,
    };
  };

  const trail: Record<string, number[]> = {};
  const nodeTrail: Record<string, number[]> = {};
  for (let i = 0; i < currentStep; i++) {
    const { edgeIds, badgeNodeId } = messagesOf(steps[i]);
    edgeIds.forEach(id => { trail[id] = [...(trail[id] ?? []), i + 1]; });
    if (badgeNodeId) nodeTrail[badgeNodeId] = [...(nodeTrail[badgeNodeId] ?? []), i + 1];
  }

  const step = steps[currentStep];
  const { edgeIds, reversedEdgeIds, nodeIds, badgeNodeId } = messagesOf(step);
  return {
    currentEdgeIds: edgeIds,
    labelEdgeId: edgeIds[0],
    reversedEdgeIds,
    currentNodeIds: nodeIds,
    currentLabel: step.roles?.command || step.title,
    currentNumber: currentStep + 1,
    badgeNodeId,
    trail,
    nodeTrail,
  };
}
