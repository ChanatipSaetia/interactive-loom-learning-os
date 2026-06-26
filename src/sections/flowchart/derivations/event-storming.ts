import type { FlowchartRelation, FlowchartViewNode, FlowchartEntity } from '../types';
import { TYPES } from '../types';

export function layoutEventStorming(
  nodes: FlowchartViewNode[],
  nodeIds: string[],
  nodeSet: Set<string>,
  relations: FlowchartRelation[],
  viewKey: string,
  entities: Record<string, FlowchartEntity>,
  getRole: (id: string) => 'db' | 'handler' | 'timeline'
): FlowchartViewNode[] {
  const timelineOfHandler = new Map<string, string>();
  const handlerOfDb = new Map<string, string>();

  const handlerNodes = nodeIds.filter(id => getRole(id) === 'handler');
  const dbNodes = nodeIds.filter(id => getRole(id) === 'db');
  const timelineNodes = nodeIds.filter(id => getRole(id) === 'timeline');

  const stackedHandlers = new Set<string>();
  relations.forEach(rel => {
    const isForView = !rel.views || rel.views.includes(viewKey);
    if (isForView && rel.handledBy && nodeSet.has(rel.from) && nodeSet.has(rel.to)) {
      const fromRole = getRole(rel.from);
      const toRole = getRole(rel.to);
      if (fromRole === 'timeline' && toRole === 'handler') {
        stackedHandlers.add(rel.to);
      }
    }
  });

  const handlerParent = new Map<string, string>();
  handlerNodes.forEach(h => {
    if (stackedHandlers.has(h)) return;
    relations.forEach(rel => {
      const isForView = !rel.views || rel.views.includes(viewKey);
      if (!isForView) return;
      if (rel.to === h && nodeSet.has(rel.from) && getRole(rel.from) === 'handler') {
        handlerParent.set(h, rel.from);
      }
    });
  });

  handlerNodes.forEach(h => {
    const connected = new Set<string>();
    relations.forEach(rel => {
      const isForView = !rel.views || rel.views.includes(viewKey);
      if (!isForView) return;
      if (rel.from === h && nodeSet.has(rel.to) && getRole(rel.to) === 'timeline') {
        connected.add(rel.to);
      }
      if (rel.to === h && nodeSet.has(rel.from) && getRole(rel.from) === 'timeline') {
        connected.add(rel.from);
      }
    });

    const connectedList = Array.from(connected);
    const cmd = connectedList.find(id => {
      const entity = entities[id];
      const t = entity?.type || entity?.viewTypes?.EVENT_STORMING || 'default';
      return t === TYPES.COMMAND;
    });

    if (cmd) {
      timelineOfHandler.set(h, cmd);
    } else if (connectedList.length > 0) {
      timelineOfHandler.set(h, connectedList[0]);
    }
  });

  dbNodes.forEach(d => {
    const connected = new Set<string>();
    relations.forEach(rel => {
      const isForView = !rel.views || rel.views.includes(viewKey);
      if (!isForView) return;
      if (rel.from === d && nodeSet.has(rel.to) && getRole(rel.to) === 'handler') {
        connected.add(rel.to);
      }
      if (rel.to === d && nodeSet.has(rel.from) && getRole(rel.from) === 'handler') {
        connected.add(rel.from);
      }
    });
    const connectedList = Array.from(connected);
    if (connectedList.length > 0) {
      handlerOfDb.set(d, connectedList[0]);
    }
  });

  const timelineAdj = new Map<string, Set<string>>();
  const timelineInDegree = new Map<string, number>();

  timelineNodes.forEach(id => {
    timelineAdj.set(id, new Set());
    timelineInDegree.set(id, 0);
  });

  timelineNodes.forEach(u => {
    const visited = new Set<string>();
    const queue = [u];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (visited.has(curr)) continue;
      visited.add(curr);

      relations.forEach(rel => {
        const isForView = !rel.views || rel.views.includes(viewKey);
        if (isForView && rel.from === curr) {
          const toRole = getRole(rel.to);
          if (toRole === 'timeline') {
            if (rel.to !== u) {
              timelineAdj.get(u)!.add(rel.to);
            }
          } else if (nodeSet.has(rel.to)) {
            queue.push(rel.to);
          }
        }
      });
    }
  });

  timelineNodes.forEach(u => {
    timelineAdj.get(u)!.forEach(v => {
      timelineInDegree.set(v, timelineInDegree.get(v)! + 1);
    });
  });

  const timelineOrder = new Map<string, number>();
  timelineNodes.forEach((id, idx) => timelineOrder.set(id, idx));

  const backEdges = new Set<string>();
  timelineNodes.forEach(u => {
    const uOrder = timelineOrder.get(u)!;
    timelineAdj.get(u)!.forEach(v => {
      const vOrder = timelineOrder.get(v)!;
      if (vOrder <= uOrder) {
        backEdges.add(`${u}->${v}`);
      }
    });
  });

  backEdges.forEach(key => {
    const [from, to] = key.split('->');
    timelineAdj.get(from)?.delete(to);
    timelineInDegree.set(to, Math.max(0, timelineInDegree.get(to)! - 1));
  });

  const col = new Map<string, number>();
  nodeIds.forEach(id => col.set(id, -1));

  let sources = timelineNodes.filter(id => timelineInDegree.get(id) === 0);
  if (sources.length === 0 && timelineNodes.length > 0) {
    sources = [timelineNodes[0]];
  }

  const groupStartNodes = timelineNodes.filter(u => {
    const uEntity = entities[u];
    const uType = uEntity?.type || uEntity?.viewTypes?.EVENT_STORMING || 'default';
    return uType === TYPES.COMMAND || timelineInDegree.get(u) === 0;
  });

  const groups: { start: string; nodes: Set<string>; internalCol: Map<string, number> }[] = [];
  const assignedToGroup = new Set<string>();

  const processGroup = (startNode: string) => {
    const groupNodes = new Set<string>();
    const internalCol = new Map<string, number>();
    
    const q: string[] = [startNode];
    internalCol.set(startNode, 0);
    groupNodes.add(startNode);
    assignedToGroup.add(startNode);

    while(q.length > 0) {
      const u = q.shift()!;
      const uCol = internalCol.get(u)!;
      const uEntity = entities[u];
      const uType = uEntity?.type || uEntity?.viewTypes?.EVENT_STORMING || 'default';

      const targets = Array.from(timelineAdj.get(u) || []);
      const outPolicies = targets.filter(tgt => {
        const tgtEntity = entities[tgt];
        const tgtType = tgtEntity?.type || tgtEntity?.viewTypes?.EVENT_STORMING || 'default';
        return tgtType === TYPES.POLICY;
      });

      targets.forEach(v => {
        const vEntity = entities[v];
        const vType = vEntity?.type || vEntity?.viewTypes?.EVENT_STORMING || 'default';

        if (vType === TYPES.COMMAND || (assignedToGroup.has(v) && !groupNodes.has(v))) {
          return;
        }

        let dist = 1;
        let hasActorRight = false;
        if (uType === TYPES.EVENT) {
           handlerNodes.forEach(h => {
             if (timelineOfHandler.get(h) === u) {
               const hEntity = entities[h];
               const hType = hEntity?.type || hEntity?.viewTypes?.EVENT_STORMING || 'default';
               if (hType === TYPES.USER) hasActorRight = true;
             }
           });
        }
        
        if (uType === TYPES.EVENT && vType === TYPES.POLICY && outPolicies.length > 1) {
          dist = 2;
        } else if (hasActorRight) {
          dist = 2;
        }

        const nextCol = uCol + dist;
        if (!internalCol.has(v) || nextCol > internalCol.get(v)!) {
          internalCol.set(v, nextCol);
          groupNodes.add(v);
          assignedToGroup.add(v);
          q.push(v);
        }
      });
    }
    groups.push({ start: startNode, nodes: groupNodes, internalCol });
  };

  groupStartNodes.forEach(startNode => {
    if (!assignedToGroup.has(startNode)) processGroup(startNode);
  });

  timelineNodes.forEach(node => {
    if (!assignedToGroup.has(node)) processGroup(node);
  });

  const groupIndexMap = new Map<string, number>();
  groups.forEach((g, idx) => {
    g.nodes.forEach(n => groupIndexMap.set(n, idx));
  });

  const groupAdj = new Map<number, Set<number>>();
  const groupInDegree = new Map<number, number>();
  groups.forEach((_, idx) => {
    groupAdj.set(idx, new Set());
    groupInDegree.set(idx, 0);
  });

  timelineNodes.forEach(u => {
    const uGroup = groupIndexMap.get(u)!;
    const targets = Array.from(timelineAdj.get(u) || []);
    targets.forEach(v => {
      const vGroup = groupIndexMap.get(v)!;
      if (uGroup !== vGroup) {
        if (!groupAdj.get(uGroup)!.has(vGroup)) {
          groupAdj.get(uGroup)!.add(vGroup);
          groupInDegree.set(vGroup, groupInDegree.get(vGroup)! + 1);
        }
      }
    });
  });

  const groupBaseCol = new Map<number, number>();
  groups.forEach((_, idx) => groupBaseCol.set(idx, 1));

  const groupQueue: number[] = [];
  groups.forEach((_, idx) => {
    if (groupInDegree.get(idx) === 0) groupQueue.push(idx);
  });

  while(groupQueue.length > 0) {
    const gIdx = groupQueue.shift()!;
    const baseCol = groupBaseCol.get(gIdx)!;
    
    let maxInternalCol = 0;
    groups[gIdx].internalCol.forEach(c => {
      if (c > maxInternalCol) maxInternalCol = c;
    });

    let maxPadding = 2;
    groupAdj.get(gIdx)!.forEach(nextGIdx => {
      const nextGroup = groups[nextGIdx];
      let hasActorOnLeft = false;
      
      nextGroup.nodes.forEach(u => {
        if (nextGroup.internalCol.get(u) === 0) {
          const uEntity = entities[u];
          const uType = uEntity?.type || uEntity?.viewTypes?.EVENT_STORMING || 'default';
          handlerNodes.forEach(h => {
            if (timelineOfHandler.get(h) === u) {
              const hEntity = entities[h];
              const hType = hEntity?.type || hEntity?.viewTypes?.EVENT_STORMING || 'default';
              if (hType === TYPES.USER && uType !== TYPES.EVENT) {
                hasActorOnLeft = true;
              }
            }
          });
        }
      });
      if (hasActorOnLeft) maxPadding = 3;
    });

    const nextBaseCol = baseCol + maxInternalCol + maxPadding;

    groupAdj.get(gIdx)!.forEach(nextGIdx => {
      if (nextBaseCol > groupBaseCol.get(nextGIdx)!) {
        groupBaseCol.set(nextGIdx, nextBaseCol);
      }
      const deg = groupInDegree.get(nextGIdx)! - 1;
      groupInDegree.set(nextGIdx, deg);
      if (deg === 0) groupQueue.push(nextGIdx);
    });
  }

  timelineNodes.forEach(id => {
    const gIdx = groupIndexMap.get(id)!;
    const bCol = groupBaseCol.get(gIdx)!;
    const iCol = groups[gIdx].internalCol.get(id)!;
    col.set(id, bCol + iCol);
  });



  handlerNodes.forEach(h => {
    if (timelineOfHandler.has(h)) {
      const cmd = timelineOfHandler.get(h)!;
      const cmdCol = col.get(cmd) !== undefined && col.get(cmd)! >= 0 ? col.get(cmd)! : 1;
      
      const hEntity = entities[h];
      const hType = hEntity?.type || hEntity?.viewTypes?.EVENT_STORMING || 'default';
      
      if (hType === TYPES.USER) {
        col.set(h, Math.max(0, cmdCol - 1));
      } else {
        col.set(h, cmdCol);
      }
    }
  });

  dbNodes.forEach(d => {
    const h = handlerOfDb.get(d);
    col.set(d, h && col.get(h) !== undefined && col.get(h)! >= 0 ? col.get(h)! : 0);
  });

  const orphanHandlers = handlerNodes.filter(h => !timelineOfHandler.has(h));
  orphanHandlers.forEach(h => {
    let current = h;
    const visited = new Set<string>();
    while (handlerParent.has(current) && !visited.has(current)) {
      visited.add(current);
      current = handlerParent.get(current)!;
    }
    if (col.get(current) !== undefined && col.get(current)! >= 0) {
      col.set(h, col.get(current)!);
    } else {
      col.set(h, 0);
    }
  });

  const branchLevel = new Map<string, number>();
  timelineNodes.forEach(id => branchLevel.set(id, -1));

  sources.forEach(src => {
    branchLevel.set(src, 0);
  });

  const queue = [...sources];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const u = queue.shift()!;
    if (visited.has(u)) continue;
    visited.add(u);

    const uLevel = branchLevel.get(u)!;
    const targets = Array.from(timelineAdj.get(u) || []);
    const forwardTargets = targets.filter(v => col.get(v)! > col.get(u)!);
    forwardTargets.sort((a, b) => nodeIds.indexOf(a) - nodeIds.indexOf(b));

    forwardTargets.forEach((v, idx) => {
      const nextLevel = idx === 0 ? uLevel : uLevel + idx;
      const currentVLevel = branchLevel.get(v)!;
      if (currentVLevel === -1 || nextLevel < currentVLevel) {
        branchLevel.set(v, nextLevel);
      }
      queue.push(v);
    });
  }

  const row = new Map<string, number>();

  let maxBranchLevel = 0;
  timelineNodes.forEach(u => {
    const l = Math.max(0, branchLevel.get(u)!);
    if (l > maxBranchLevel) maxBranchLevel = l;
  });

  const levelRow = new Map<number, number>();
  let currentRow = 2; // base row for level 0

  for (let L = 0; L <= maxBranchLevel; L++) {
    let hasHandlerOnTop = false;
    timelineNodes.forEach(u => {
      if (Math.max(0, branchLevel.get(u)!) === L) {
        handlerNodes.forEach(h => {
          if (timelineOfHandler.get(h) === u) {
            const hEntity = entities[h];
            const hType = hEntity?.type || hEntity?.viewTypes?.EVENT_STORMING || 'default';
            if (hType !== TYPES.USER) {
              hasHandlerOnTop = true;
            }
          }
        });
      }
    });

    if (L > 0) {
      if (hasHandlerOnTop) {
        currentRow += 1.5; // increase vertical gap
      } else {
        currentRow += 1;
      }
    }
    levelRow.set(L, currentRow);
  }

  timelineNodes.forEach(u => {
    row.set(u, levelRow.get(Math.max(0, branchLevel.get(u)!))!);
  });

  handlerNodes.forEach(h => {
    if (timelineOfHandler.has(h)) {
      const cmd = timelineOfHandler.get(h)!;
      const cmdRow = row.get(cmd) !== undefined ? row.get(cmd)! : 2;
      const cmdCol = col.get(cmd) !== undefined && col.get(cmd)! >= 0 ? col.get(cmd)! : 1;
      
      const hEntity = entities[h];
      const hType = hEntity?.type || hEntity?.viewTypes?.EVENT_STORMING || 'default';
      
      if (hType === TYPES.USER) {
        row.set(h, cmdRow);
        const cmdEntity = entities[cmd];
        const cmdType = cmdEntity?.type || cmdEntity?.viewTypes?.EVENT_STORMING || 'default';
        if (cmdType === TYPES.EVENT) {
          col.set(h, cmdCol + 1);
        } else {
          col.set(h, Math.max(0, cmdCol - 1));
        }
      } else {
        row.set(h, cmdRow - 0.625);
        col.set(h, cmdCol);
      }
    } else {
      row.set(h, 1);
    }
  });

  dbNodes.forEach(d => {
    if (handlerOfDb.has(d)) {
      const h = handlerOfDb.get(d)!;
      row.set(d, (row.get(h) !== undefined ? row.get(h)! : 1) - 1);
    } else {
      row.set(d, 0);
    }
  });

  const orphansByCol = new Map<number, string[]>();
  orphanHandlers.forEach(h => {
    const c = col.get(h)!;
    if (!orphansByCol.has(c)) orphansByCol.set(c, []);
    orphansByCol.get(c)!.push(h);
  });

  orphansByCol.forEach((handlers) => {
    handlers.forEach((h, idx) => {
      if (idx === 0) {
        row.set(h, 0);
      } else {
        row.set(h, 2 + idx);
      }
    });
  });

  return nodes.map(n => ({
    ...n,
    grid: [col.get(n.id)!, row.get(n.id)!]
  }));
}
