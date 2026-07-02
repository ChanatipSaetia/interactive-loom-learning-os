import type { FlowchartRelation, FlowchartEntity, FlowchartViewNode } from '../../types';
import { TYPES } from '../../types';

export interface FlowGroup {
  id: number;
  commands: string[];
  handlers: string[];
  actors: string[];
  externals: string[];
  events: string[];
  policies: string[];
  dbs: string[];
  allNodes: Set<string>;
  /** True when this group contains the root node of the Event Storming flow. */
  isRoot: boolean;
}

export interface GroupingResult {
  groups: FlowGroup[];
  groupOrder: number[];
}

function entityType(entities: Record<string, FlowchartEntity>, id: string): string {
  const e = entities[id];
  return e?.type || e?.viewTypes?.EVENT_STORMING || 'default';
}

export function buildGroups(
  nodeIds: string[],
  nodeSet: Set<string>,
  relations: FlowchartRelation[],
  viewKey: string,
  entities: Record<string, FlowchartEntity>,
  getRole: (id: string) => 'db' | 'handler' | 'timeline',
  nodes: FlowchartViewNode[],
): GroupingResult {
  const rels = relations.filter(rel => {
    const isForView = !rel.views || rel.views.includes(viewKey);
    return isForView && nodeSet.has(rel.from) && nodeSet.has(rel.to);
  });

  // Find root node ID
  const rootNodeId = nodes.find(n => n.root)?.id;

  const outEdges = new Map<string, string[]>();
  nodeIds.forEach(id => outEdges.set(id, []));
  rels.forEach(rel => { if (outEdges.has(rel.from)) outEdges.get(rel.from)!.push(rel.to); });

  const timelineNodes = nodeIds.filter(id => getRole(id) === 'timeline');
  const cmdNodes = timelineNodes.filter(id => entityType(entities, id) === TYPES.COMMAND);

  // Find handler for each command
  const cmdHandler = new Map<string, string>();
  cmdNodes.forEach(cmd => {
    const hb = rels.find(r => r.from === cmd && r.handledBy);
    if (hb && nodeSet.has(hb.to)) {
      cmdHandler.set(cmd, hb.to);
    } else {
      const fallback = outEdges.get(cmd)!.find(t => getRole(t) === 'handler');
      if (fallback) cmdHandler.set(cmd, fallback);
    }
  });

  // Find actor for each command (user who issues it)
  const cmdActor = new Map<string, string>();
  cmdNodes.forEach(cmd => {
    const actor = outEdges.get(cmd)!.find(
      t => getRole(t) === 'handler' && entityType(entities, t) === TYPES.USER,
    );
    if (actor) cmdActor.set(cmd, actor);
    // Also check incoming: Actor -> Command
    const incoming = rels.filter(r => r.to === cmd);
    for (const r of incoming) {
      if (getRole(r.from) === 'handler' && entityType(entities, r.from) === TYPES.USER) {
        cmdActor.set(cmd, r.from);
        break;
      }
    }
  });

  const groups: FlowGroup[] = [];
  const assigned = new Set<string>();

  const addNodeToGroup = (g: FlowGroup, id: string) => {
    if (g.allNodes.has(id)) return;
    g.allNodes.add(id);
    const t = entityType(entities, id);
    const role = getRole(id);

    if (t === TYPES.COMMAND) g.commands.push(id);
    else if (t === TYPES.EVENT) g.events.push(id);
    else if (t === TYPES.POLICY) g.policies.push(id);
    else if (role === 'handler') {
      if (t === TYPES.USER) g.actors.push(id);
      else if (t === TYPES.EXTERNAL) g.externals.push(id);
      else g.handlers.push(id);
    }
    else if (role === 'db') g.dbs.push(id);
  };

  // Directional BFS from each command
  const expandGroup = (seedCmd: string) => {
    const g: FlowGroup = {
      id: groups.length,
      commands: [],
      handlers: [],
      actors: [],
      externals: [],
      events: [],
      policies: [],
      dbs: [],
      allNodes: new Set(),
      isRoot: false,
    };

    // Seed: command + handler + actor
    addNodeToGroup(g, seedCmd);

    const seedHandler = cmdHandler.get(seedCmd);
    if (seedHandler) addNodeToGroup(g, seedHandler);

    const seedActor = cmdActor.get(seedCmd);
    if (seedActor) addNodeToGroup(g, seedActor);

    // Directional BFS: handler -> events -> policies -> [STOP at command]
    const visited = new Set<string>();
    const queue: string[] = [];

    // Seed BFS from handler
    if (seedHandler && !visited.has(seedHandler)) {
      visited.add(seedHandler);
      queue.push(seedHandler);
    }

    let safety = 0;
    const maxIter = nodeIds.length * 3;

    while (queue.length > 0 && safety < maxIter) {
      safety++;
      const curr = queue.shift()!;
      const currType = entityType(entities, curr);
      const currRole = getRole(curr);

      for (const tgt of outEdges.get(curr)!) {
        const tgtType = entityType(entities, tgt);
        const tgtRole = getRole(tgt);

        // Stop at next command — it starts its own group
        if (tgtType === TYPES.COMMAND) continue;

        // Skip already globally assigned nodes (first-come-first-served)
        if (assigned.has(tgt)) continue;

        if (currRole === 'handler') {
          // Handler emits events
          if (tgtType === TYPES.EVENT && !g.allNodes.has(tgt)) {
            addNodeToGroup(g, tgt);
            if (!visited.has(tgt)) {
              visited.add(tgt);
              queue.push(tgt);
            }
          }
          // Handler connects to DBs / externals / other aggregates — add without traverse
          if (tgtRole === 'db' && !g.allNodes.has(tgt)) {
            addNodeToGroup(g, tgt);
          }
          if (tgtRole === 'handler' && tgtType === TYPES.EXTERNAL && !g.allNodes.has(tgt)) {
            addNodeToGroup(g, tgt);
          }
          if (tgtRole === 'handler' && tgtType === TYPES.AGGREGATE && !g.allNodes.has(tgt)) {
            addNodeToGroup(g, tgt);
          }
          if (tgtRole === 'handler' && tgtType === TYPES.USER && !g.allNodes.has(tgt)) {
            addNodeToGroup(g, tgt);
          }
        }

        // Event -> Policy (forward only)
        if (currType === TYPES.EVENT) {
          if (tgtType === TYPES.POLICY && !g.allNodes.has(tgt)) {
            addNodeToGroup(g, tgt);
            if (!visited.has(tgt)) {
              visited.add(tgt);
              queue.push(tgt);
            }
          }
          // Event -> User (return to actor, add without traverse)
          if (tgtRole === 'handler' && tgtType === TYPES.USER && !g.allNodes.has(tgt)) {
            addNodeToGroup(g, tgt);
          }
        }

        // Policy -> [STOP, next command starts its own group]
        // Don't traverse from policies to anything
      }
    }

    if (rootNodeId && g.allNodes.has(rootNodeId)) g.isRoot = true;
    groups.push(g);
    g.allNodes.forEach(id => assigned.add(id));
  };

  // Process commands in schema order
  cmdNodes.forEach(cmd => {
    if (!assigned.has(cmd)) expandGroup(cmd);
  });

  // Orphan nodes (no command owns them) — create single-node groups
  timelineNodes.forEach(id => {
    if (!assigned.has(id)) {
      const g: FlowGroup = {
        id: groups.length,
        commands: [],
        handlers: [],
        actors: [],
        externals: [],
        events: [],
        policies: [],
        dbs: [],
        allNodes: new Set(),
        isRoot: false,
      };
      addNodeToGroup(g, id);
      if (rootNodeId && g.allNodes.has(rootNodeId)) g.isRoot = true;
      groups.push(g);
      assigned.add(id);
    }
  });

  // Topological order of groups by inter-group edges
  const groupOut = new Map<number, number[]>();
  const groupInDeg = new Map<number, number>();
  groups.forEach((_, i) => { groupOut.set(i, []); groupInDeg.set(i, 0); });

  rels.forEach(rel => {
    const fromIdx = groups.findIndex(gr => gr.allNodes.has(rel.from));
    const toIdx = groups.findIndex(gr => gr.allNodes.has(rel.to));
    if (fromIdx >= 0 && toIdx >= 0 && fromIdx !== toIdx) {
      if (!groupOut.get(fromIdx)!.includes(toIdx)) {
        groupOut.get(fromIdx)!.push(toIdx);
        groupInDeg.set(toIdx, groupInDeg.get(toIdx)! + 1);
      }
    }
  });

  const topoOrder: number[] = [];
  const enqueued = new Set<number>();
  const q: number[] = [];
  const enqueue = (i: number) => {
    if (!enqueued.has(i)) { enqueued.add(i); q.push(i); }
  };
  groups.forEach((_, i) => { if (groupInDeg.get(i) === 0) enqueue(i); });
  // Cyclic graph: no zero-in-degree node exists. Seed with the root group
  // (or group 0) to break the cycle deterministically.
  if (q.length === 0 && groups.length > 0) {
    const rootIdx = groups.findIndex(g => g.isRoot);
    enqueue(rootIdx >= 0 ? rootIdx : 0);
  }

  while (q.length > 0) {
    const gi = q.shift()!;
    topoOrder.push(gi);
    groupOut.get(gi)!.forEach(next => {
      groupInDeg.set(next, groupInDeg.get(next)! - 1);
      // Only enqueue once: with back-edges (cycles) a node's in-degree can be
      // driven to 0 after it was already seeded, which previously produced a
      // duplicate index in groupOrder and corrupted the depth layers.
      if (groupInDeg.get(next)! <= 0) enqueue(next);
    });
  }

  // Any group never reached (left inside a cycle) is appended once so every
  // group is positioned exactly once.
  groups.forEach((_, i) => { if (!enqueued.has(i)) { enqueued.add(i); topoOrder.push(i); } });

  return { groups, groupOrder: topoOrder };
}
