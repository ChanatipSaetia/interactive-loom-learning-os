import type { FlowchartRelation, FlowchartViewNode, FlowchartEntity } from '../../types';
import { buildGroups } from './grouping';
import { calculatePositions } from './positions';

export function layoutEventStorming(
  nodes: FlowchartViewNode[],
  nodeIds: string[],
  nodeSet: Set<string>,
  relations: FlowchartRelation[],
  viewKey: string,
  entities: Record<string, FlowchartEntity>,
  getRole: (id: string) => 'db' | 'handler' | 'timeline',
): FlowchartViewNode[] {
  // Phase 1: Build groups
  const { groups, groupOrder } = buildGroups(
    nodeIds,
    nodeSet,
    relations,
    viewKey,
    entities,
    getRole,
    nodes,
  );

  // Phase 2: Calculate positions
  const grid = calculatePositions(
    nodes,
    groups,
    groupOrder,
    relations,
    viewKey,
  );

  // Phase 3: Collision resolution
  const finalGrid = resolveCollisions(nodes, grid);

  // Phase 4: Return positioned nodes
  return nodes.map(n => ({
    ...n,
    grid: finalGrid.get(n.id) ?? [0, 0],
  }));
}

function resolveCollisions(
  nodes: FlowchartViewNode[],
  grid: Map<string, [number, number]>,
): Map<string, [number, number]> {
  const result = new Map(grid);

  // Ensure all nodes have a position
  nodes.forEach(n => {
    if (!result.has(n.id)) {
      result.set(n.id, [0, 0]);
    }
  });

  for (let iteration = 0; iteration < 10; iteration++) {
    const positions = new Map<string, string[]>();
    nodes.forEach(n => {
      const [c, r] = result.get(n.id) ?? [0, 0];
      const key = `${c},${r}`;
      if (!positions.has(key)) positions.set(key, []);
      positions.get(key)!.push(n.id);
    });

    let hasCollision = false;
    positions.forEach((ids, key) => {
      if (ids.length > 1) {
        hasCollision = true;
        const [, r] = key.split(',').map(Number);
        ids.forEach((id, idx) => {
          if (idx > 0) {
            const existing = result.get(id) ?? [0, 0];
            result.set(id, [existing[0], r + idx * 0.5]);
          }
        });
      }
    });
    if (!hasCollision) break;
  }

  return result;
}

/**
 * Returns the set of relation IDs where both `from` and `to` belong to the
 * same FlowGroup — these should be hidden from the EVENT_STORMING view so only
 * cross-group edges are rendered.
 */
export function buildIntraGroupRelationSet(
  nodeIds: string[],
  nodeSet: Set<string>,
  relations: FlowchartRelation[],
  viewKey: string,
  entities: Record<string, FlowchartEntity>,
  getRole: (id: string) => 'db' | 'handler' | 'timeline',
  nodes: FlowchartViewNode[],
): Set<string> {
  const { groups } = buildGroups(nodeIds, nodeSet, relations, viewKey, entities, getRole, nodes);
  const intraIds = new Set<string>();
  relations.forEach(rel => {
    if (!rel.views || !rel.views.includes(viewKey)) return;
    const fromGroup = groups.find(g => g.allNodes.has(rel.from));
    const toGroup   = groups.find(g => g.allNodes.has(rel.to));
    if (fromGroup && toGroup && fromGroup.id === toGroup.id) {
      intraIds.add(rel.id);
    }
  });
  return intraIds;
}
