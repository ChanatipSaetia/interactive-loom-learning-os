import type { UnifiedFlowchartSchema, FlowchartRelation, FlowchartViewNode, FlowchartViewGroup, FlowchartEntity } from '../types';
import { TYPES, MASTER_MAPPING_MATRIX } from '../types';
import { getEntityType, deriveRelations, buildCycleFreeGraph, computeTopologicalColumns, compactColumns, computeLayoutInfo, countOutgoingRelations, countOutgoingPolicies } from './utils';
import { buildCanonicalIdMapper } from '../abstract-flow/derive';

export function deriveSwimlanes(
  schema: UnifiedFlowchartSchema,
  getCollapsedId: (id: string) => string,
  getESNode: (id: string) => FlowchartViewNode | undefined,
  esNodes: FlowchartViewNode[] | undefined
) {
  const swimNodes: FlowchartViewNode[] = [];
  const localAddedNodes = new Set<string>();

  Object.entries(schema.entities).forEach(([id, entity]) => {
    const type = getEntityType(entity);
    const esNode = getESNode(id);
    if (!esNode) return;

    // Decide whether this entity is rendered as a node in the activity view.
    let include: boolean;
    if (type === TYPES.POLICY) {
      // Only a genuine fork (>= 2 outgoing) stays as a Decision. A single-edge
      // Policy is a pass-through guard and is not rendered; its branch is shown
      // on the edge leaving the triggering Event's Decision instead.
      include = countOutgoingRelations(schema, id) >= 2;
    } else if (type === TYPES.EVENT) {
      // A branching Event (>= 2 outgoing Policies) is the Decision diamond.
      // A terminal Event (no outgoing relations) is a dead-end end-state: keep it
      // so the activity view shows where a branch terminates and its handling
      // lane (e.g. MCP Servers, Subagent Pool) stays visible instead of vanishing.
      include = countOutgoingPolicies(schema, id) >= 2 || countOutgoingRelations(schema, id) === 0;
    } else if (type === TYPES.USER) {
      // Actors are represented as lanes in the activity view, not as nodes.
      include = false;
    } else {
      include = !!MASTER_MAPPING_MATRIX[type]?.SWIMLANES;
    }
    if (!include) return;

    const collapsedId = getCollapsedId(id);
    if (localAddedNodes.has(collapsedId)) return;
    localAddedNodes.add(collapsedId);

    swimNodes.push({
      id: collapsedId,
      grid: [esNode.grid ? esNode.grid[0] : 0, 0]
    });
  });

  const getSwimlaneLabel = (pathNodeIds: string[], startInstanceId: string): { label: string } => {
    const startEntity = schema.entities[startInstanceId];
    if (startEntity?.branchLabel) {
      return { label: startEntity.branchLabel };
    }

    // Edges leaving a branching Event's Decision pass through a single-edge
    // Policy that was collapsed away — surface that Policy's branch as the guard.
    const polNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.POLICY);
    if (polNode) {
      const policy = schema.entities[polNode];
      return { label: policy.branchLabel || policy.title };
    }

    const evtNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.EVENT);
    if (evtNode) return { label: schema.entities[evtNode].title };

    const lastNode = pathNodeIds[pathNodeIds.length - 1];
    if (lastNode && schema.entities[lastNode]) {
      return { label: schema.entities[lastNode].title };
    }
    return { label: '' };
  };

  const swimRelations = deriveRelations(schema, 'SWIMLANES', localAddedNodes, getSwimlaneLabel);

  const updatedRelations = [
    ...schema.relations.filter(r => !r.views || !r.views.includes('SWIMLANES')),
    ...swimRelations
  ];

  const nodeIds = swimNodes.map(n => n.id);
  const nodeSet = new Set(nodeIds);
  const laidOutSwimNodes = layoutSwimlanes(swimNodes, nodeIds, nodeSet, updatedRelations, 'SWIMLANES', schema.entities, esNodes);
  const swimGroups = generateDynamicSwimlaneGroups(schema, laidOutSwimNodes, esNodes);

  return {
    nodes: laidOutSwimNodes,
    groups: swimGroups,
    relations: updatedRelations,
    layoutInfo: computeLayoutInfo(laidOutSwimNodes)
  };
}

function findHandlingEntity(
  entities: Record<string, FlowchartEntity>,
  relations: FlowchartRelation[],
  nodeId: string
): string | null {
  const getCollapsedId = buildCanonicalIdMapper(entities);

  const isStructuralOrBoundary = (type: string): boolean => {
    return (
      type === TYPES.USER ||
      type === TYPES.AGGREGATE ||
      type === TYPES.EXTERNAL ||
      type === TYPES.DATABASE ||
      type === TYPES.SERVICE
    );
  };

  const startType = getEntityType(entities[nodeId]);
  if (isStructuralOrBoundary(startType)) {
    return getCollapsedId(nodeId);
  }

  // An activity wired directly to a USER actor belongs in that actor's lane —
  // the user is who performs (or receives) the activity. This takes priority
  // over the deeper handler search so e.g. "Review Result" sits in the QA
  // Engineer lane rather than the upstream LLM lane it descends from.
  const directUser = relations.find(r => {
    const isES = !r.views || r.views.includes('EVENT_STORMING');
    if (!isES) return false;
    if (r.from === nodeId && getEntityType(entities[r.to]) === TYPES.USER) return true;
    if (r.to === nodeId && getEntityType(entities[r.from]) === TYPES.USER) return true;
    return false;
  });
  if (directUser) {
    const userId = directUser.from === nodeId ? directUser.to : directUser.from;
    return getCollapsedId(userId);
  }

  const isES = (r: FlowchartRelation) => !r.views || r.views.includes('EVENT_STORMING');

  // A command an actor starts (initiatedBy, linked through its policy) is that
  // actor's action, so it sits in the actor's lane.
  if (startType === TYPES.COMMAND) {
    const policyIds = relations
      .filter(r => isES(r) && r.to === nodeId && getEntityType(entities[r.from]) === TYPES.POLICY)
      .map(r => r.from);
    const initiator = relations.find(r =>
      isES(r) && policyIds.includes(r.to) && getEntityType(entities[r.from]) === TYPES.USER
    );
    if (initiator) return getCollapsedId(initiator.from);
  }

  // Any other command sits in the lane of the system that handles it, not in
  // the lane of the step before it.
  const handledBy = relations.find(r => isES(r) && r.from === nodeId && r.handledBy);
  if (handledBy) return getCollapsedId(handledBy.to);

  // A fork whose every option is started by the same actor is that actor's
  // decision, so its diamond sits in the actor's lane.
  if (startType === TYPES.EVENT) {
    const options = relations.filter(r =>
      isES(r) && r.from === nodeId && getEntityType(entities[r.to]) === TYPES.POLICY
    );
    if (options.length >= 2) {
      const deciders = new Set(options.map(option => {
        const actor = relations.find(r =>
          isES(r) && r.to === option.to && getEntityType(entities[r.from]) === TYPES.USER
        );
        return actor ? getCollapsedId(actor.from) : null;
      }));
      const [decider] = deciders;
      if (deciders.size === 1 && decider) return decider;
    }
  }

  let queue: { id: string; depth: number }[] = [{ id: nodeId, depth: 0 }];
  let visited = new Set<string>([nodeId]);

  // Backward BFS (prioritize previous command)
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (depth > 4) continue;

    const currentType = getEntityType(entities[id]);
    if (id !== nodeId && isStructuralOrBoundary(currentType)) {
      return getCollapsedId(id);
    }

    const inRels = relations.filter(r =>
      (!r.views || r.views.includes('EVENT_STORMING')) && r.to === id
    );
    for (const r of inRels) {
      if (!visited.has(r.from)) {
        visited.add(r.from);
        queue.push({ id: r.from, depth: depth + 1 });
      }
    }
  }

  // Forward BFS
  queue = [{ id: nodeId, depth: 0 }];
  visited = new Set<string>([nodeId]);

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (depth > 4) continue;

    const currentType = getEntityType(entities[id]);
    if (id !== nodeId && isStructuralOrBoundary(currentType)) {
      return getCollapsedId(id);
    }

    const outRels = relations.filter(r =>
      (!r.views || r.views.includes('EVENT_STORMING')) && r.from === id
    );
    for (const r of outRels) {
      if (!visited.has(r.to)) {
        visited.add(r.to);
        queue.push({ id: r.to, depth: depth + 1 });
      }
    }
  }

  return null;
}

function getEntityFirstAppearance(
  entities: Record<string, FlowchartEntity>,
  relations: FlowchartRelation[],
  esNodes: FlowchartViewNode[] | undefined,
  entityId: string
): number {
  if (!esNodes) return 0;

  const instances: string[] = [];
  Object.keys(entities).forEach(id => {
    if (findHandlingEntity(entities, relations, id) === entityId) {
      instances.push(id);
    }
  });

  let minCol = Infinity;
  instances.forEach(id => {
    const esNode = esNodes.find(n => n.id === id);
    if (esNode && typeof esNode.grid?.[0] === 'number') {
      if (esNode.grid[0] < minCol) {
        minCol = esNode.grid[0];
      }
    }
  });

  return minCol === Infinity ? 0 : minCol;
}

function getSortedActiveLanes(
  entities: Record<string, FlowchartEntity>,
  relations: FlowchartRelation[],
  esNodes: FlowchartViewNode[] | undefined,
  nodeIds: string[]
): string[] {
  const activeLanes = new Set<string>();
  nodeIds.forEach(id => {
    const laneId = findHandlingEntity(entities, relations, id);
    if (laneId) {
      activeLanes.add(laneId);
    }
  });

  const lanes = Array.from(activeLanes);

  const sortByAppearance = (a: string, b: string) => {
    const colA = getEntityFirstAppearance(entities, relations, esNodes, a);
    const colB = getEntityFirstAppearance(entities, relations, esNodes, b);
    if (colA !== colB) return colA - colB;
    return a.localeCompare(b);
  };

  lanes.sort(sortByAppearance);

  return lanes;
}

export function generateDynamicSwimlaneGroups(
  schema: UnifiedFlowchartSchema,
  laidOutSwimNodes: FlowchartViewNode[],
  esNodes?: FlowchartViewNode[]
): FlowchartViewGroup[] {
  const nodeIds = laidOutSwimNodes.map(n => n.id);
  const resolvedEsNodes = esNodes || schema.views!.EVENT_STORMING?.nodes;
  const sortedLanes = getSortedActiveLanes(schema.entities, schema.relations, resolvedEsNodes, nodeIds);

  // Derive each lane's vertical band straight from the laid-out nodes so that
  // multi-row lanes (see layoutSwimlanes) get a tall enough band and the lanes
  // below them start at the correct row.
  const laneBand = new Map<string, { min: number; max: number }>();
  laidOutSwimNodes.forEach(n => {
    const lane = findHandlingEntity(schema.entities, schema.relations, n.id);
    if (!lane) return;
    const r = n.grid?.[1] ?? 0;
    const band = laneBand.get(lane);
    if (!band) laneBand.set(lane, { min: r, max: r });
    else { band.min = Math.min(band.min, r); band.max = Math.max(band.max, r); }
  });

  const tint = (accent: string) => `color-mix(in srgb, ${accent} 5%, transparent)`;

  const getAccent = (type: string): string => {
    if (type === TYPES.USER) return 'var(--ctp-yellow)';
    if (type === TYPES.EXTERNAL) return 'var(--ctp-green)';
    if (type === TYPES.DATABASE) return 'var(--ctp-teal)';
    if (type === TYPES.SERVICE) return 'var(--ctp-sapphire)';
    return 'var(--ctp-blue)';
  };

  return sortedLanes.map((laneId) => {
    const entity = schema.entities[laneId];
    const type = getEntityType(entity);
    const accent = getAccent(type);
    const title = entity?.viewTitles?.SWIMLANES || entity?.title || laneId;

    const band = laneBand.get(laneId);

    return {
      id: `lane_${laneId}`,
      title: title,
      isLane: true,
      row: band ? band.min : 0,
      rowSpan: band ? band.max - band.min + 1 : 1,
      color: tint(accent),
      borderColor: `color-mix(in srgb, ${accent} 35%, var(--ctp-surface2))`,
      textColor: accent
    };
  });
}

export function layoutSwimlanes(
  nodes: FlowchartViewNode[],
  nodeIds: string[],
  nodeSet: Set<string>,
  relations: FlowchartRelation[],
  viewKey: string,
  entities: Record<string, FlowchartEntity>,
  esNodes?: FlowchartViewNode[]
): FlowchartViewNode[] {
  const { adj, inDegree } = buildCycleFreeGraph(nodeIds, relations, viewKey, nodeSet);
  const col = computeTopologicalColumns(nodeIds, inDegree, adj);

  const colGroups = new Map<number, string[]>();
  col.forEach((c, id) => {
    if (!colGroups.has(c)) colGroups.set(c, []);
    colGroups.get(c)!.push(id);
  });
  const sortedCols = Array.from(colGroups.keys()).sort((a, b) => a - b);

  const sortedLanes = getSortedActiveLanes(entities, relations, esNodes, nodeIds);

  const compactedCol = compactColumns(sortedCols, col);
  const spacedCol = new Map<string, number>();
  compactedCol.forEach((val, key) => {
    spacedCol.set(key, val * 2);
  });

  nodeIds.forEach(id => {
    if (getEntityType(entities[id]) === TYPES.DATABASE) {
      const inRels = relations.filter(r => 
        r.to === id && (!r.views || r.views.includes('SWIMLANES')) && nodeSet.has(r.from)
      );
      let targetParent = inRels.find(r => getEntityType(entities[r.from]) === TYPES.PROCESS)?.from;
      if (!targetParent && inRels.length > 0) {
        targetParent = inRels[0].from;
      }
      
      if (targetParent) {
        const parentCol = spacedCol.get(targetParent);
        if (parentCol !== undefined) {
          spacedCol.set(id, parentCol);
        }
      }
    }
  });

  // Multi-row lanes: a lane may hold several nodes that resolve to the same
  // column (e.g. two Commands a Decision fans out to). Stack them on separate
  // sub-rows within the lane so they never overlap, and push following lanes
  // down by however many sub-rows each lane consumed.
  const laneOf = new Map<string, string>();
  nodeIds.forEach(id => {
    laneOf.set(id, findHandlingEntity(entities, relations, id) ?? (sortedLanes[0] ?? id));
  });

  const subRow = new Map<string, number>();
  const laneRowCount = new Map<string, number>();
  const orderedLanes = sortedLanes.length > 0 ? sortedLanes : Array.from(new Set(laneOf.values()));

  orderedLanes.forEach(lane => {
    const laneNodeIds = nodeIds
      .filter(id => laneOf.get(id) === lane)
      .sort((a, b) => (spacedCol.get(a)! - spacedCol.get(b)!));

    const occupiedColsPerRow: Set<number>[] = [];
    laneNodeIds.forEach(id => {
      const c = spacedCol.get(id)!;
      let r = 0;
      while (r < occupiedColsPerRow.length && occupiedColsPerRow[r].has(c)) r++;
      if (r === occupiedColsPerRow.length) occupiedColsPerRow.push(new Set<number>());
      occupiedColsPerRow[r].add(c);
      subRow.set(id, r);
    });
    laneRowCount.set(lane, Math.max(1, occupiedColsPerRow.length));
  });

  // Sub-rows stacked inside the same lane keep a gap between their boxes: the
  // row pitch is at least one node height, so 1.2 rows leaves 20px or more
  // (at 0.75 a three-line box was covered by the one below it).
  // Lanes are still separated by a full row of band padding (the trailing +1).
  const SUBROW_GAP = 1.2;
  const laneStartRow = new Map<string, number>();
  let accRow = 0;
  orderedLanes.forEach(lane => {
    laneStartRow.set(lane, accRow);
    const laneRows = laneRowCount.get(lane) ?? 1;
    accRow += (laneRows - 1) * SUBROW_GAP + 1;
  });

  const row = new Map<string, number>();
  nodeIds.forEach(id => {
    const lane = laneOf.get(id)!;
    row.set(id, (laneStartRow.get(lane) ?? 0) + (subRow.get(id) ?? 0) * SUBROW_GAP);
  });

  return nodes.map(n => ({
    ...n,
    grid: [spacedCol.get(n.id)!, row.get(n.id)!]
  }));
}
