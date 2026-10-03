import { buildCanonicalIdMapper } from '../../model/derive';
import { TYPES } from './types';
import type { FlowchartStep, UnifiedFlowchartSchema } from './types';

/** Views where playback reads as a route between systems rather than a walk along a timeline. */
export const STORY_ROUTE_VIEWS = new Set(['SYS_ARCH']);

/** The journey drawn as a route between the systems of one view. */
export interface StoryRoute {
  /** Hand-off edges of the current step. */
  currentEdgeIds: string[];
  /** The one current edge that carries the label: the step's own edge, else its hand-off. */
  labelEdgeId?: string;
  /** Both ends of the current hand-offs plus the step's own systems and actors. */
  currentNodeIds: string[];
  /** What the current step does, shown on its edge ("Check the facts…"). */
  currentLabel: string;
  /** 1-based number of the current step, shown in the edge badge. */
  currentNumber: number;
  /** Edges walked by earlier steps, with the step numbers that walked them. */
  trail: Record<string, number[]>;
}

/**
 * Works out which edges of `viewKey` each journey step travels, up to `currentStep`.
 * A step travels the edges between its own systems and actors (Writer → Docs
 * Repository) plus the hand-off into them: from the previous step's systems, or
 * for a fork option from the step that produced the fork (LLM → MCP Servers).
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
  const toViewSet = (ids: string[]) => new Set(ids.map(canonical).filter(id => inView.has(id)));
  const nodesOf = (step: FlowchartStep) => toViewSet(step.nodeIds);

  const between = (from: Set<string>, to: Set<string>) => relations.filter(r =>
    r.from !== r.to && (
      (from.has(r.from) && to.has(r.to)) ||
      (r.bidirectional && from.has(r.to) && to.has(r.from))
    )
  );

  const routeFor = (idx: number) => {
    const step = steps[idx];
    const own = nodesOf(step);
    const inside = between(own, own).map(r => r.id);
    const from = step.branch
      ? toViewSet(step.branch.forkNodeIds)
      : idx > 0 ? nodesOf(steps[idx - 1]) : new Set<string>();
    const entering = new Set([...own].filter(id => !from.has(id)));
    const handOff = between(from, entering).map(r => r.id);
    return { edgeIds: [...new Set([...handOff, ...inside])], labelEdgeId: inside[0] ?? handOff[0] };
  };
  const edgesFor = (idx: number) => routeFor(idx).edgeIds;

  const trail: Record<string, number[]> = {};
  for (let i = 0; i < currentStep; i++) {
    edgesFor(i).forEach(id => { trail[id] = [...(trail[id] ?? []), i + 1]; });
  }

  const { edgeIds: currentEdgeIds, labelEdgeId } = routeFor(currentStep);
  const currentNodeIds = new Set(nodesOf(steps[currentStep]));
  relations
    .filter(r => currentEdgeIds.includes(r.id))
    .forEach(r => { currentNodeIds.add(r.from); currentNodeIds.add(r.to); });

  const step = steps[currentStep];
  const commandId = step.nodeIds.find(id => schema.entities[id]?.type === TYPES.COMMAND);

  return {
    currentEdgeIds,
    labelEdgeId,
    currentNodeIds: [...currentNodeIds],
    currentLabel: (commandId && schema.entities[commandId]?.title) || step.title,
    currentNumber: currentStep + 1,
    trail,
  };
}
