/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import type { UnifiedFlowchartSchema, FlowchartRelation, FlowchartViewNode, FlowchartEntity } from '../types';
import { TYPES, MASTER_MAPPING_MATRIX } from '../types';
import { getEntityType, deriveRelations, computeLayoutInfo } from './utils';
import { buildCanonicalIdMapper } from '../abstract-flow/derive';

export function deriveSysArch(
  schema: UnifiedFlowchartSchema,
  getCollapsedId: (id: string) => string,
  getESNode: (id: string) => FlowchartViewNode | undefined
) {
  const sysNodes: FlowchartViewNode[] = [];
  const localAddedNodes = new Set<string>();

  Object.entries(schema.entities).forEach(([id, entity]) => {
    const type = getEntityType(entity);
    const esNode = getESNode(id);
    if (!esNode) return;

    const sysType = MASTER_MAPPING_MATRIX[type]?.SYS_ARCH;
    if (sysType) {
      const collapsedId = getCollapsedId(id);
      if (localAddedNodes.has(collapsedId)) return;
      localAddedNodes.add(collapsedId);

      sysNodes.push({
        id: collapsedId,
        grid: [esNode.grid ? esNode.grid[0] : 0, 0]
      });
    }
  });

  const getSysArchLabel = (pathNodeIds: string[], _startId: string): { label: string } => {
    const cmdNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.COMMAND);
    const evtNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.EVENT);

    if (cmdNode && evtNode) {
      return { label: `${schema.entities[cmdNode].title} / ${schema.entities[evtNode].title}` };
    }
    if (cmdNode) return { label: schema.entities[cmdNode].title };
    if (evtNode) return { label: schema.entities[evtNode].title };

    const lastNode = pathNodeIds[pathNodeIds.length - 1];
    if (lastNode && schema.entities[lastNode]) {
      return { label: schema.entities[lastNode].title };
    }
    return { label: '' };
  };

  const sysRelations = deriveRelations(schema, 'SYS_ARCH', localAddedNodes, getSysArchLabel);

  const updatedRelations = [
    ...schema.relations.filter(r => !r.views || !r.views.includes('SYS_ARCH')),
    ...sysRelations
  ];

  const aggregateIds = sysNodes
    .map(n => n.id)
    .filter(id => {
      const ent = schema.entities[id];
      const type = getEntityType(ent);
      return ent && (type === TYPES.AGGREGATE || type === TYPES.DATABASE);
    });

  const sysGroups = aggregateIds.length > 0 ? [
    {
      id: 'sys_boundary',
      title: 'System Boundary',
      nodeIds: aggregateIds,
      color: 'color-mix(in srgb, var(--ctp-green) 5%, transparent)',
      borderColor: 'var(--ctp-green)',
      textColor: 'var(--ctp-green)'
    }
  ] : [];

  const nodeIds = sysNodes.map(n => n.id);
  const nodeSet = new Set(nodeIds);
  const laidOutSysNodes = layoutSysArch(sysNodes, nodeIds, nodeSet, updatedRelations, 'SYS_ARCH', schema.entities);

  return {
    nodes: laidOutSysNodes,
    groups: sysGroups,
    relations: updatedRelations,
    layoutInfo: computeLayoutInfo(laidOutSysNodes)
  };
}

export function layoutSysArch(
  nodes: FlowchartViewNode[],
  nodeIds: string[],
  _nodeSet: Set<string>,
  relations: FlowchartRelation[],
  _viewKey: string,
  entities: Record<string, FlowchartEntity>
): FlowchartViewNode[] {
  const getCollapsedId = buildCanonicalIdMapper(entities);

  const adj = new Map<string, Set<string>>();
  nodeIds.forEach(id => adj.set(id, new Set<string>()));

  relations.forEach(r => {
    const isOriginal = !r.views || r.views.includes('EVENT_STORMING') || !r.views.includes('SYS_ARCH');
    if (!isOriginal) return;

    const fromId = getCollapsedId(r.from);
    const toId = getCollapsedId(r.to);

    if (adj.has(fromId) && adj.has(toId) && fromId !== toId) {
      adj.get(fromId)!.add(toId);
      adj.get(toId)!.add(fromId);
    }
  });

  const userNodes = nodeIds.filter(id => {
    const ent = entities[id];
    const type = ent?.type || ent?.viewTypes?.EVENT_STORMING || 'default';
    return type === TYPES.USER;
  });
  userNodes.sort();

  const externalNodes = nodeIds.filter(id => {
    const ent = entities[id];
    const type = ent?.type || ent?.viewTypes?.EVENT_STORMING || 'default';
    return type === TYPES.EXTERNAL;
  });
  externalNodes.sort();

  const internalNodeIds = nodeIds.filter(
    id => !userNodes.includes(id) && !externalNodes.includes(id)
  );

  const queue: string[] = [];
  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const hopCount = new Map<string, number>();

  const startNode = internalNodeIds[0] || nodeIds[0] || '';
  if (startNode) {
    queue.push(startNode);
    visited.add(startNode);
    hopCount.set(startNode, 0);
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const neighbors = adj.get(curr) || new Set<string>();
    neighbors.forEach(nbr => {
      if (internalNodeIds.includes(nbr) && !visited.has(nbr)) {
        visited.add(nbr);
        parent.set(nbr, curr);
        hopCount.set(nbr, hopCount.get(curr)! + 1);
        queue.push(nbr);
      }
    });
  }

  internalNodeIds.forEach(id => {
    if (!visited.has(id)) {
      visited.add(id);
      parent.set(id, startNode);
      hopCount.set(id, 1);
    }
  });

  const childrenOf = new Map<string, string[]>();
  internalNodeIds.forEach(id => childrenOf.set(id, []));
  internalNodeIds.forEach(id => {
    const p = parent.get(id);
    if (p) {
      childrenOf.get(p)!.push(id);
    }
  });
  childrenOf.forEach((list) => {
    list.sort();
  });

  const relX = new Map<string, number>();
  const relY = new Map<string, number>();
  const occupied = new Set<string>();

  const occupy = (id: string, x: number, y: number) => {
    relX.set(id, x);
    relY.set(id, y);
    occupied.add(`${x},${y}`);
  };

  const relativeOffset = new Map<string, [number, number]>();
  const dir = new Map<string, [number, number]>();

  if (startNode) {
    occupy(startNode, 0, 0);
    dir.set(startNode, [0, 0]);
  }

  const getOutwardOffsets = (dx: number, dy: number): [number, number][] => {
    if (dx === 0 && dy === -1) return [[0, -1], [-1, -1], [1, -1], [-2, -1], [2, -1]];
    if (dx === 0 && dy === 1) return [[0, 1], [-1, 1], [1, 1], [-2, 1], [2, 1]];
    if (dx === 1 && dy === 0) return [[1, 0], [1, -1], [1, 1], [1, -2], [1, 2]];
    if (dx === -1 && dy === 0) return [[-1, 0], [-1, -1], [-1, 1], [-1, -2], [-1, 2]];
    if (dx === 1 && dy === -1) return [[1, -1], [1, 0], [0, -1], [2, -1], [1, -2]];
    if (dx === 1 && dy === 1) return [[1, 1], [1, 0], [0, 1], [2, 1], [1, 2]];
    if (dx === -1 && dy === -1) return [[-1, -1], [-1, 0], [0, -1], [-2, -1], [-1, -2]];
    if (dx === -1 && dy === 1) return [[-1, 1], [-1, 0], [0, 1], [-2, 1], [-1, 2]];
    return [[dx, dy]];
  };

  const sortedByHop = [...internalNodeIds].sort((a, b) => (hopCount.get(a) ?? 0) - (hopCount.get(b) ?? 0));

  const firstHopNonUsers = startNode ? (childrenOf.get(startNode) || []) : [];
  const SECTORS: [number, number][] = [[0, -1], [1, 0], [0, 1], [1, -1], [1, 1], [-1, -1], [-1, 1]];
  firstHopNonUsers.forEach((id, idx) => {
    const s = SECTORS[idx % SECTORS.length];
    dir.set(id, s);
    relativeOffset.set(id, s);
  });

  sortedByHop.forEach(id => {
    if (id === startNode) return;
    if ((hopCount.get(id) ?? 0) <= 1) return;

    const p = parent.get(id)!;
    const pDir = dir.get(p) || [0, -1];
    const siblings = childrenOf.get(p) || [];
    const idx = siblings.indexOf(id);
    const offsets = getOutwardOffsets(pDir[0], pDir[1]);
    const offset = offsets[idx % offsets.length] || pDir;

    relativeOffset.set(id, offset);
    dir.set(id, [Math.sign(offset[0]), Math.sign(offset[1])]);
  });

  sortedByHop.forEach(id => {
    if (id === startNode) return;

    const p = parent.get(id)!;
    const px = relX.get(p) || 0;
    const py = relY.get(p) || 0;
    const offset = relativeOffset.get(id) || dir.get(id) || [0, -1];
    const tx = px + offset[0];
    const ty = py + offset[1];

    if (!occupied.has(`${tx},${ty}`)) {
      occupy(id, tx, ty);
    } else {
      let d = 1;
      let placed = false;
      const childDir = dir.get(id) || [0, -1];

      while (!placed) {
        const candidates: [number, number][] = [];
        for (let ox = -d; ox <= d; ox++) {
          for (let oy = -d; oy <= d; oy++) {
            if (Math.max(Math.abs(ox), Math.abs(oy)) === d) {
              const cx = tx + ox;
              const cy = ty + oy;
              if (!occupied.has(`${cx},${cy}`)) {
                candidates.push([cx, cy]);
              }
            }
          }
        }

        if (candidates.length > 0) {
          candidates.sort((a, b) => {
            const distA = a[0]*a[0] + a[1]*a[1];
            const distB = b[0]*b[0] + b[1]*b[1];
            if (distA !== distB) return distB - distA;

            const dotA = a[0] * childDir[0] + a[1] * childDir[1];
            const dotB = b[0] * childDir[0] + b[1] * childDir[1];
            return dotB - dotA;
          });

          const best = candidates[0];
          occupy(id, best[0], best[1]);
          placed = true;
        } else {
          d++;
        }
      }
    }
  });

  const internalXs = internalNodeIds.map(id => relX.get(id) ?? 0);
  const internalYs = internalNodeIds.map(id => relY.get(id) ?? 0);
  const minInternalX = internalXs.length > 0 ? Math.min(...internalXs) : 0;
  const maxInternalX = internalXs.length > 0 ? Math.max(...internalXs) : 0;
  const minInternalY = internalYs.length > 0 ? Math.min(...internalYs) : 0;
  const maxInternalY = internalYs.length > 0 ? Math.max(...internalYs) : 0;

  const centerY = (minInternalY + maxInternalY) / 2;

  userNodes.forEach((uid, idx) => {
    const uy = Math.round(centerY + idx - (userNodes.length - 1) / 2);
    occupy(uid, minInternalX - 1, uy);
  });

  externalNodes.forEach((eid, idx) => {
    const ey = Math.round(centerY + idx - (externalNodes.length - 1) / 2);
    occupy(eid, maxInternalX + 1, ey);
  });

  const xs = Array.from(relX.values());
  const ys = Array.from(relY.values());
  const minX = xs.length > 0 ? Math.min(...xs) : 0;
  const minY = ys.length > 0 ? Math.min(...ys) : 0;

  const finalCol = new Map<string, number>();
  const finalRow = new Map<string, number>();

  nodeIds.forEach(id => {
    const rx = relX.get(id) ?? 0;
    const ry = relY.get(id) ?? 0;
    finalCol.set(id, (rx - minX) * 2);
    finalRow.set(id, ry - minY);
  });

  return nodes.map(n => ({
    ...n,
    grid: [finalCol.get(n.id)!, finalRow.get(n.id)!]
  }));
}
