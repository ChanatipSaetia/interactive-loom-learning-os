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

  const assignTimelineColumns = (startNodes: string[]) => {
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

      const targets = Array.from(timelineAdj.get(u) || []);
      targets.forEach(v => {
        const nextCol = uCol + 1;
        if (nextCol > col.get(v)!) {
          col.set(v, nextCol);
          const count = pushCount.get(v) || 0;
          if (count < nodes.length) {
            pushCount.set(v, count + 1);
            queue.push(v);
          }
        }
      });
    }
  };

  let sources = timelineNodes.filter(id => timelineInDegree.get(id) === 0);
  if (sources.length === 0 && timelineNodes.length > 0) {
    sources = [timelineNodes[0]];
  }

  assignTimelineColumns(sources);

  let unreached = timelineNodes.filter(id => col.get(id) === -1);
  while (unreached.length > 0) {
    unreached.sort((a, b) => timelineInDegree.get(a)! - timelineInDegree.get(b)!);
    const nextSrc = unreached[0];
    col.set(nextSrc, 0);
    assignTimelineColumns([nextSrc]);
    unreached = timelineNodes.filter(id => col.get(id) === -1);
  }

  const stackCommands = new Set<string>();
  relations.forEach(rel => {
    const isForView = !rel.views || rel.views.includes(viewKey);
    if (isForView && rel.handledBy && nodeSet.has(rel.from) && nodeSet.has(rel.to)) {
      if (getRole(rel.from) === 'timeline' && getRole(rel.to) === 'handler') {
        stackCommands.add(rel.from);
      }
    }
  });

  const sortedTimelineByCol = timelineNodes
    .filter(id => col.get(id)! >= 0)
    .sort((a, b) => col.get(a)! - col.get(b)!);

  const gapBeforeCols = new Set<number>();
  sortedTimelineByCol.forEach((id, idx) => {
    if (stackCommands.has(id) && idx > 0) {
      const prevCol = col.get(sortedTimelineByCol[idx - 1])!;
      const thisCol = col.get(id)!;
      if (thisCol - prevCol === 1) {
        gapBeforeCols.add(thisCol);
      }
    }
  });

  const sortedGapCols = Array.from(gapBeforeCols).sort((a, b) => b - a);
  sortedGapCols.forEach(gapCol => {
    timelineNodes.forEach(id => {
      const c = col.get(id)!;
      if (c >= gapCol) {
        col.set(id, c + 1);
      }
    });
  });

  handlerNodes.forEach(h => {
    if (timelineOfHandler.has(h)) {
      const cmd = timelineOfHandler.get(h)!;
      col.set(h, col.get(cmd) !== undefined && col.get(cmd)! >= 0 ? col.get(cmd)! : 0);
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
  timelineNodes.forEach(u => {
    row.set(u, 2 + Math.max(0, branchLevel.get(u)!));
  });

  handlerNodes.forEach(h => {
    row.set(h, 1);
  });

  dbNodes.forEach(d => {
    row.set(d, 0);
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
