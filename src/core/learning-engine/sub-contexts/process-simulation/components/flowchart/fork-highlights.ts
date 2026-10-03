import { buildCanonicalIdMapper } from '../../model/derive';
import type { FlowchartStepBranchInfo, UnifiedFlowchartSchema } from './types';

/** How the current step's fork shows up in one view. */
export interface ForkHighlights {
  /** Edges into the path this journey takes; drawn as active with the full label. */
  takenRelationIds: string[];
  /** Edges into the paths not taken; pulse once, then stay dimmed. */
  altRelationIds: string[];
  /** Nodes that only belong to paths not taken. */
  altNodeIds: string[];
  /** Sequence view: the `alt:` group of the taken option and of the others. */
  takenGroupId?: string;
  altGroupIds: string[];
}

const seqGroupId = (optionId: string) => `seq_group_${optionId}`;

/**
 * Finds the fork edges for `branch` in `viewKey`. Event Storming uses node ids
 * as they are; the derived views draw each actor/system once, so ids are
 * collapsed to their canonical node first. A fork edge runs from the fork
 * (branching event or the step that emitted it) into an option's chain.
 * Returns null where a view has no fork to show (state machine) or no edges match.
 */
export function computeForkHighlights(
  schema: UnifiedFlowchartSchema,
  viewKey: string,
  branch: FlowchartStepBranchInfo | undefined,
  takenNodeIds: string[]
): ForkHighlights | null {
  if (!branch || viewKey === 'STATE_MACHINE') return null;
  const view = schema.views?.[viewKey];
  if (!view) return null;

  if (viewKey === 'SEQUENCE') {
    const groupIds = new Set((view.groups ?? []).map(g => g.id));
    const taken = seqGroupId(branch.optionId);
    const alts = branch.alternatives.map(a => seqGroupId(a.optionId)).filter(id => groupIds.has(id));
    if (!groupIds.has(taken) && alts.length === 0) return null;
    return {
      takenRelationIds: [],
      altRelationIds: [],
      altNodeIds: [],
      takenGroupId: groupIds.has(taken) ? taken : undefined,
      altGroupIds: alts,
    };
  }

  const canonical = viewKey === 'EVENT_STORMING'
    ? (id: string) => id
    : buildCanonicalIdMapper(schema.entities);
  const inView = new Set(view.nodes.map(n => n.id));
  const toViewSet = (ids: string[]) => new Set(ids.map(canonical).filter(id => inView.has(id)));

  const forkSet = toViewSet(branch.forkNodeIds);
  const optionSet = (ids: string[]) => {
    const set = toViewSet(ids);
    forkSet.forEach(id => set.delete(id));
    return set;
  };
  const takenSet = optionSet(takenNodeIds);
  const altSets = branch.alternatives.map(a => optionSet(a.nodeIds));

  const viewRelations = schema.relations.filter(r =>
    viewKey === 'EVENT_STORMING' ? !r.views || r.views.includes(viewKey) : r.views?.includes(viewKey)
  );
  const takenRelationIds: string[] = [];
  const altRelationIds: string[] = [];
  for (const rel of viewRelations) {
    if (!forkSet.has(rel.from)) continue;
    if (takenSet.has(rel.to)) {
      takenRelationIds.push(rel.id);
    } else if (altSets.some(set => set.has(rel.to))) {
      altRelationIds.push(rel.id);
    }
  }
  if (takenRelationIds.length === 0 && altRelationIds.length === 0) return null;

  const altNodeIds = new Set<string>();
  altSets.forEach(set => set.forEach(id => { if (!takenSet.has(id)) altNodeIds.add(id); }));

  return {
    takenRelationIds,
    altRelationIds,
    altNodeIds: [...altNodeIds],
    altGroupIds: [],
  };
}
