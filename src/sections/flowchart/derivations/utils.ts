import type { UnifiedFlowchartSchema, FlowchartRelation, FlowchartEntity, LayoutInfo } from '../types';
import { TYPES } from '../types';

export const getEntityType = (entity: FlowchartEntity | undefined): string => {
  return entity?.type || entity?.viewTypes?.EVENT_STORMING || 'default';
};

export function countOutgoingRelations(schema: UnifiedFlowchartSchema, entityId: string): number {
  return schema.relations.filter(r =>
    (!r.views || r.views.includes('EVENT_STORMING')) && r.from === entityId
  ).length;
}

/**
 * Number of Policies an Event fans out to. An Event with >= 2 outgoing Policies is
 * a branch point: in the activity (SWIMLANES) view it renders as the single
 * Decision diamond, with each Policy collapsing into a guard-labelled edge.
 */
export function countOutgoingPolicies(schema: UnifiedFlowchartSchema, entityId: string): number {
  return schema.relations.filter(r =>
    (!r.views || r.views.includes('EVENT_STORMING')) &&
    r.from === entityId &&
    getEntityType(schema.entities[r.to]) === TYPES.POLICY
  ).length;
}

export function policyShouldMapToDecision(schema: UnifiedFlowchartSchema, entityId: string, entityType: string): boolean {
  if (entityType !== TYPES.POLICY) return true;
  
  // A policy is a decision if it has multiple outcomes
  const outCount = countOutgoingRelations(schema, entityId);
  if (outCount >= 2) return true;

  // Or if it is one of multiple policies triggered by the same event
  const incomingEvents = schema.relations
    .filter(r => (!r.views || r.views.includes('EVENT_STORMING')) && r.to === entityId)
    .map(r => r.from)
    .filter(fromId => getEntityType(schema.entities[fromId]) === TYPES.EVENT);

  for (const evtId of incomingEvents) {
    if (countOutgoingRelations(schema, evtId) >= 2) {
      return true;
    }
  }

  return false;
}

export function isBoundaryType(entity: FlowchartEntity | undefined): boolean {
  const type = entity?.type || entity?.viewTypes?.EVENT_STORMING || '';
  return type === TYPES.USER || type === TYPES.EXTERNAL;
}

export function isStructuralType(entity: FlowchartEntity | undefined): boolean {
  const type = entity?.type || entity?.viewTypes?.EVENT_STORMING || '';
  return type === TYPES.AGGREGATE || type === TYPES.SERVICE || type === TYPES.DATABASE || type === TYPES.POLICY;
}

export function deriveRelations(
  schema: UnifiedFlowchartSchema,
  viewKey: string,
  participantIds: Set<string>,
  getLabel: (nodesOnPath: string[], startId: string) => { label: string; dashed?: boolean },
  onDanglingPath?: (pathNodeIds: string[], startId: string) => void
): FlowchartRelation[] {
  const relations: FlowchartRelation[] = [];
  const visitedPaths = new Set<string>();

  const getCollapsedId = (id: string): string => schema.entities[id]?.collapsedTo || id;

  participantIds.forEach(startId => {
    const collapsedStart = getCollapsedId(startId);

    const startingInstanceIds = Object.keys(schema.entities).filter(
      id => getCollapsedId(id) === startId
    );
    if (!startingInstanceIds.includes(startId)) {
      startingInstanceIds.push(startId);
    }

    const queue: Array<{
      startingInstanceId: string;
      currentId: string;
      path: string[];
      intermediateNodeIds: string[];
    }> = startingInstanceIds.map(id => ({ startingInstanceId: id, currentId: id, path: [id], intermediateNodeIds: [] }));

    while (queue.length > 0) {
      const { startingInstanceId, currentId, path, intermediateNodeIds } = queue.shift()!;

      const outRels = schema.relations.filter(r => 
        (!r.views || r.views.includes('EVENT_STORMING')) && r.from === currentId
      );

      if (outRels.length === 0 && currentId !== startingInstanceId) {
        if (onDanglingPath) {
          onDanglingPath([...path.slice(1)], startingInstanceId);
        }
      }

      for (const rel of outRels) {
        const nextId = rel.to;
        const collapsedNext = getCollapsedId(nextId);

        if (path.includes(nextId) || path.includes(collapsedNext)) continue;

        if (participantIds.has(collapsedNext)) {
          if (collapsedNext !== collapsedStart) {
            const pathNodeIds = [...path.slice(1), nextId];
            const { label, dashed } = getLabel(pathNodeIds, startingInstanceId);

            const startEntity = schema.entities[collapsedStart];
            const endEntity = schema.entities[collapsedNext];
            const bothBoundary = isBoundaryType(startEntity) && isBoundaryType(endEntity);
            const hasIntermediates = intermediateNodeIds.length > 0 || pathNodeIds.length > 0;
            
            // The flow enters the destination via a genuine command dispatch
            // (handledBy) when the destination boundary node is the handler of a
            // Command on this path — e.g. `cmd_call_mcp -> mcp_servers`. That is a
            // real invocation and must survive, mirroring how an External that
            // handles a command into an internal node (e.g. Execute Tool) is kept.
            const isHandledDispatch = !!rel.handledBy;

            if (bothBoundary && hasIntermediates && !isHandledDispatch) {
              const hasDirectESRel = schema.relations.some(r =>
                (!r.views || r.views.includes('EVENT_STORMING')) &&
                ((r.from === collapsedStart && r.to === collapsedNext) ||
                 (r.from === collapsedNext && r.to === collapsedStart))
              );
              if (!hasDirectESRel) continue;
            }

            const relKey = `${collapsedStart}->${collapsedNext}:${label}`;
            if (!visitedPaths.has(relKey)) {
              visitedPaths.add(relKey);

              let chronologicalIndex = 999;
              const labelNodeId = pathNodeIds.find(id => {
                const type = getEntityType(schema.entities[id]);
                return type === TYPES.COMMAND || type === TYPES.EVENT;
              }) || pathNodeIds[pathNodeIds.length - 1];

              if (labelNodeId) {
                let relIdx = schema.relations.findIndex(r => 
                  (!r.views || r.views.includes('EVENT_STORMING')) && 
                  r.to === labelNodeId
                );
                if (relIdx === -1) {
                  relIdx = schema.relations.findIndex(r => 
                    (!r.views || r.views.includes('EVENT_STORMING')) && 
                    r.from === labelNodeId
                  );
                }
                if (relIdx !== -1) {
                  chronologicalIndex = relIdx;
                }
              }

              relations.push({
                id: `derived_${viewKey.toLowerCase()}_rel_${collapsedStart}_${collapsedNext}_${relations.length}`,
                from: collapsedStart,
                to: collapsedNext,
                views: [viewKey],
                label,
                dashed,
                chronologicalIndex
              });
            }
          }
        } else {
          const nextIntermediates = isStructuralType(schema.entities[nextId])
            ? [...intermediateNodeIds, nextId]
            : intermediateNodeIds;
          queue.push({
            startingInstanceId,
            currentId: nextId,
            path: [...path, nextId],
            intermediateNodeIds: nextIntermediates
          });
        }
      }
    }
  });

  return relations;
}

export function buildAdjacency(
  nodeIds: string[],
  relations: FlowchartRelation[],
  viewKey: string,
  nodeSet: Set<string>
): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  nodeIds.forEach(id => adj.set(id, []));
  relations.forEach(rel => {
    const isForView = !rel.views || rel.views.includes(viewKey);
    if (isForView && nodeSet.has(rel.from) && nodeSet.has(rel.to)) {
      adj.get(rel.from)!.push(rel.to);
    }
  });
  return adj;
}

export function buildInDegree(
  nodeIds: string[],
  relations: FlowchartRelation[],
  viewKey: string,
  nodeSet: Set<string>
): Map<string, number> {
  const inDegree = new Map<string, number>();
  nodeIds.forEach(id => inDegree.set(id, 0));
  relations.forEach(rel => {
    const isForView = !rel.views || rel.views.includes(viewKey);
    if (isForView && nodeSet.has(rel.from) && nodeSet.has(rel.to)) {
      inDegree.set(rel.to, inDegree.get(rel.to)! + 1);
    }
  });
  return inDegree;
}

export function buildIncoming(
  nodeIds: string[],
  relations: FlowchartRelation[],
  viewKey: string,
  nodeSet: Set<string>
): Map<string, string[]> {
  const incoming = new Map<string, string[]>();
  nodeIds.forEach(id => incoming.set(id, []));
  relations.forEach(rel => {
    const isForView = !rel.views || rel.views.includes(viewKey);
    if (isForView && nodeSet.has(rel.from) && nodeSet.has(rel.to)) {
      incoming.get(rel.to)!.push(rel.from);
    }
  });
  return incoming;
}

export function computeTopologicalColumns(
  nodeIds: string[],
  inDegree: Map<string, number>,
  adj: Map<string, string[]>
): Map<string, number> {
  const col = new Map<string, number>();
  nodeIds.forEach(id => col.set(id, -1));

  const assignColumns = (startNodes: string[], maxNodes: number) => {
    const queue: string[] = [];
    const pushCount = new Map<string, number>();

    startNodes.forEach(node => {
      col.set(node, Math.max(0, col.get(node)!));
      queue.push(node);
      pushCount.set(node, 1);
    });

    while (queue.length > 0) {
      const u = queue.shift()!;
      const uCol = col.get(u)!;

      (adj.get(u) || []).forEach(v => {
        const nextCol = uCol + 1;
        if (nextCol > col.get(v)!) {
          col.set(v, nextCol);
          const count = pushCount.get(v) || 0;
          if (count < maxNodes) {
            pushCount.set(v, count + 1);
            queue.push(v);
          }
        }
      });
    }
  };

  let sources = nodeIds.filter(id => inDegree.get(id) === 0);
  if (sources.length === 0 && nodeIds.length > 0) {
    sources = [nodeIds[0]];
  }

  assignColumns(sources, nodeIds.length);

  let unreached = nodeIds.filter(id => col.get(id) === -1);
  while (unreached.length > 0) {
    unreached.sort((a, b) => inDegree.get(a)! - inDegree.get(b)!);
    const nextSrc = unreached[0];
    col.set(nextSrc, 0);
    assignColumns([nextSrc], nodeIds.length);
    unreached = nodeIds.filter(id => col.get(id) === -1);
  }

  return col;
}

export function compactColumns(
  sortedCols: number[],
  col: Map<string, number>
): Map<string, number> {
  const compactedCol = new Map<string, number>();
  sortedCols.forEach((c, newColIdx) => {
    col.forEach((v, id) => {
      if (v === c) compactedCol.set(id, newColIdx);
    });
  });
  return compactedCol;
}

export function isType(entities: Record<string, FlowchartEntity>, id: string, type: string): boolean {
  const entity = entities[id];
  return entity?.type === type || entity?.viewTypes?.EVENT_STORMING === type;
}

export function computeLayoutInfo(nodes: any[]): LayoutInfo {
  let maxRow = 0, maxCol = 0;
  nodes.forEach(n => {
    if (n.grid) {
      maxRow = Math.max(maxRow, n.grid[1]);
      maxCol = Math.max(maxCol, n.grid[0]);
    }
  });
  return {
    rowCount: maxRow + 1,
    colCount: maxCol + 1,
    nodeCount: nodes.length
  };
}

export function buildCycleFreeGraph(
  nodeIds: string[],
  relations: FlowchartRelation[],
  viewKey: string,
  nodeSet: Set<string>
): { adj: Map<string, string[]>; inDegree: Map<string, number> } {
  const adj = new Map<string, string[]>();
  nodeIds.forEach(id => adj.set(id, []));

  const inDegree = new Map<string, number>();
  nodeIds.forEach(id => inDegree.set(id, 0));

  const backEdges = new Set<string>();
  const visited = new Set<string>();
  const recStack = new Set<string>();

  const tempAdj = new Map<string, string[]>();
  nodeIds.forEach(id => tempAdj.set(id, []));
  relations.forEach(rel => {
    const isForView = !rel.views || rel.views.includes(viewKey);
    if (isForView && nodeSet.has(rel.from) && nodeSet.has(rel.to)) {
      tempAdj.get(rel.from)!.push(rel.to);
    }
  });

  const dfs = (u: string) => {
    visited.add(u);
    recStack.add(u);

    const neighbors = tempAdj.get(u) || [];
    neighbors.forEach(v => {
      if (recStack.has(v)) {
        const rel = relations.find(r => 
          (!r.views || r.views.includes(viewKey)) && 
          r.from === u && r.to === v
        );
        if (rel) {
          backEdges.add(rel.id);
        }
      } else if (!visited.has(v)) {
        dfs(v);
      }
    });

    recStack.delete(u);
  };

  nodeIds.forEach(id => {
    if (!visited.has(id)) {
      dfs(id);
    }
  });

  relations.forEach(rel => {
    const isForView = !rel.views || rel.views.includes(viewKey);
    if (isForView && nodeSet.has(rel.from) && nodeSet.has(rel.to) && !backEdges.has(rel.id)) {
      adj.get(rel.from)!.push(rel.to);
      inDegree.set(rel.to, inDegree.get(rel.to)! + 1);
    }
  });

  return { adj, inDegree };
}
