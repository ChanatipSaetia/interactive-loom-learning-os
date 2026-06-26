import type { UnifiedFlowchartSchema, FlowchartRelation, FlowchartViewNode, FlowchartViewGroup, FlowchartEntity } from '../types';
import { TYPES, MASTER_MAPPING_MATRIX } from '../types';
import { getEntityType, policyShouldMapToDecision, deriveRelations, buildCycleFreeGraph, computeTopologicalColumns, compactColumns, computeLayoutInfo } from './utils';

export function deriveSwimlanes(
  schema: UnifiedFlowchartSchema,
  getCollapsedId: (id: string) => string,
  getESNode: (id: string) => FlowchartViewNode | undefined,
  esNodes: FlowchartViewNode[] | undefined,
  sysNodes?: FlowchartViewNode[]
) {
  const swimNodes: FlowchartViewNode[] = [];
  const localAddedNodes = new Set<string>();

  Object.entries(schema.entities).forEach(([id, entity]) => {
    const type = getEntityType(entity);
    const esNode = getESNode(id);
    if (!esNode) return;

    const swimType = MASTER_MAPPING_MATRIX[type]?.SWIMLANES;
    if (swimType && policyShouldMapToDecision(schema, id, type)) {
      const collapsedId = getCollapsedId(id);
      if (localAddedNodes.has(collapsedId)) return;
      localAddedNodes.add(collapsedId);

      swimNodes.push({
        id: collapsedId,
        grid: [esNode.grid ? esNode.grid[0] : 0, 0]
      });
    }
  });

  const getSwimlaneLabel = (pathNodeIds: string[], _startId: string): { label: string } => {
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
  const laidOutSwimNodes = layoutSwimlanes(swimNodes, nodeIds, nodeSet, updatedRelations, 'SWIMLANES', schema.entities, esNodes, sysNodes);
  const swimGroups = generateDynamicSwimlaneGroups(schema, laidOutSwimNodes, esNodes, sysNodes);

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
  const getCollapsedId = (id: string): string => {
    return entities[id]?.collapsedTo || id;
  };

  const isStructuralOrBoundary = (type: string): boolean => {
    return (
      type === TYPES.USER ||
      type === TYPES.AGGREGATE ||
      type === TYPES.EXTERNAL ||
      type === TYPES.DATABASE ||
      type === TYPES.SERVICE ||
      type === TYPES.CORE_SYSTEM
    );
  };

  const startType = getEntityType(entities[nodeId]);
  if (isStructuralOrBoundary(startType)) {
    return getCollapsedId(nodeId);
  }

  let queue: { id: string; depth: number }[] = [{ id: nodeId, depth: 0 }];
  let visited = new Set<string>([nodeId]);

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

  queue = [{ id: nodeId, depth: 0 }];
  visited = new Set<string>([nodeId]);

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
  nodeIds: string[],
  sysNodes?: FlowchartViewNode[]
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

function computeLaneYAssignments(
  sortedLanes: string[],
  sysNodes?: FlowchartViewNode[]
): Map<string, number> {
  const assignedY = new Map<string, number>();
  
  sortedLanes.forEach((laneId, idx) => {
    assignedY.set(laneId, idx);
  });
  
  return assignedY;
}

export function generateDynamicSwimlaneGroups(
  schema: UnifiedFlowchartSchema,
  laidOutSwimNodes: FlowchartViewNode[],
  esNodes?: FlowchartViewNode[],
  sysNodes?: FlowchartViewNode[]
): FlowchartViewGroup[] {
  const nodeIds = laidOutSwimNodes.map(n => n.id);
  const resolvedEsNodes = esNodes || schema.views.EVENT_STORMING?.nodes;
  const resolvedSysNodes = sysNodes || schema.views.SYS_ARCH?.nodes;
  const sortedLanes = getSortedActiveLanes(schema.entities, schema.relations, resolvedEsNodes, nodeIds, resolvedSysNodes);
  const laneYMap = computeLaneYAssignments(sortedLanes, resolvedSysNodes);

  const tint = (accent: string) => `color-mix(in srgb, ${accent} 5%, transparent)`;

  const getAccent = (type: string): string => {
    if (type === TYPES.USER) return 'var(--ctp-yellow)';
    if (type === TYPES.EXTERNAL) return 'var(--ctp-green)';
    if (type === TYPES.DATABASE) return 'var(--ctp-teal)';
    if (type === TYPES.SERVICE) return 'var(--ctp-sapphire)';
    if (type === TYPES.CORE_SYSTEM) return 'var(--ctp-rosewater)';
    return 'var(--ctp-blue)';
  };

  return sortedLanes.map((laneId) => {
    const entity = schema.entities[laneId];
    const type = getEntityType(entity);
    const accent = getAccent(type);
    const title = entity?.viewTitles?.SWIMLANES || entity?.title || laneId;

    return {
      id: `lane_${laneId}`,
      title: title,
      isLane: true,
      row: laneYMap.get(laneId) ?? 0,
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
  esNodes?: FlowchartViewNode[],
  sysNodes?: FlowchartViewNode[]
): FlowchartViewNode[] {
  const { adj, inDegree } = buildCycleFreeGraph(nodeIds, relations, viewKey, nodeSet);
  const col = computeTopologicalColumns(nodeIds, inDegree, adj);

  const colGroups = new Map<number, string[]>();
  col.forEach((c, id) => {
    if (!colGroups.has(c)) colGroups.set(c, []);
    colGroups.get(c)!.push(id);
  });
  const sortedCols = Array.from(colGroups.keys()).sort((a, b) => a - b);

  const sortedLanes = getSortedActiveLanes(entities, relations, esNodes, nodeIds, sysNodes);
  const laneYMap = computeLaneYAssignments(sortedLanes, sysNodes);

  const row = new Map<string, number>();
  nodeIds.forEach(id => {
    const laneId = findHandlingEntity(entities, relations, id);
    if (laneId) {
      row.set(id, laneYMap.get(laneId) ?? 0);
    } else {
      row.set(id, 0);
    }
  });

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

  return nodes.map(n => ({
    ...n,
    grid: [spacedCol.get(n.id)!, row.get(n.id)!]
  }));
}
