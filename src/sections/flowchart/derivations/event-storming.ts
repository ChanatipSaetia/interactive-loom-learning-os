import type { FlowchartRelation, FlowchartViewNode, FlowchartEntity } from '../types';
import { TYPES } from '../types';

const GROUP_GAP = 3;

function entityType(entities: Record<string, FlowchartEntity>, id: string): string {
  const e = entities[id];
  return e?.type || e?.viewTypes?.EVENT_STORMING || 'default';
}

function esRelations(
  relations: FlowchartRelation[],
  viewKey: string,
  nodeSet: Set<string>
): FlowchartRelation[] {
  return relations.filter(rel => {
    const isForView = !rel.views || rel.views.includes(viewKey);
    return isForView && nodeSet.has(rel.from) && nodeSet.has(rel.to);
  });
}

export function layoutEventStorming(
  nodes: FlowchartViewNode[],
  nodeIds: string[],
  nodeSet: Set<string>,
  relations: FlowchartRelation[],
  viewKey: string,
  entities: Record<string, FlowchartEntity>,
  getRole: (id: string) => 'db' | 'handler' | 'timeline'
): FlowchartViewNode[] {
  const rels = esRelations(relations, viewKey, nodeSet);
  const handlerNodes = nodeIds.filter(id => getRole(id) === 'handler');
  const timelineNodes = nodeIds.filter(id => getRole(id) === 'timeline');

  const cmdNodes = timelineNodes.filter(id => entityType(entities, id) === TYPES.COMMAND);
  const eventNodes = timelineNodes.filter(id => entityType(entities, id) === TYPES.EVENT);

  // Build adjacency
  const outEdges = new Map<string, string[]>();
  const inEdges = new Map<string, string[]>();
  nodeIds.forEach(id => { outEdges.set(id, []); inEdges.set(id, []); });
  rels.forEach(rel => {
    outEdges.get(rel.from)!.push(rel.to);
    inEdges.get(rel.to)!.push(rel.from);
  });

  // --- Phase 1: Find handler for each command ---
  const cmdHandler = new Map<string, string>();
  cmdNodes.forEach(cmd => {
    let handler: string | undefined;
    const hb = rels.find(r => r.from === cmd && r.handledBy);
    if (hb && nodeSet.has(hb.to)) handler = hb.to;
    if (!handler) {
      handler = outEdges.get(cmd)!.find(t => getRole(t) === 'handler')!;
    }
    if (handler) cmdHandler.set(cmd, handler);
  });

  // --- Phase 2: Find actor for each command ---
  const cmdActor = new Map<string, string>();
  cmdNodes.forEach(cmd => {
    const actor = inEdges.get(cmd)!.find(
      f => getRole(f) === 'handler' && entityType(entities, f) === TYPES.USER
    );
    if (actor) cmdActor.set(cmd, actor);
  });

  // --- Phase 3: Find events emitted by each handler ---
  const handlerEvents = new Map<string, string[]>();
  const allHandlers = new Set([...handlerNodes, ...cmdHandler.values()]);
  allHandlers.forEach(h => {
    const evts = outEdges.get(h)!.filter(t => entityType(entities, t) === TYPES.EVENT);
    if (evts.length > 0) handlerEvents.set(h, evts);
  });

  // --- Phase 4: Find event -> user return ---
  const eventUser = new Map<string, string>();
  eventNodes.forEach(evt => {
    const user = outEdges.get(evt)!.find(
      t => getRole(t) === 'handler' && entityType(entities, t) === TYPES.USER
    );
    if (user) eventUser.set(evt, user);
  });

  // --- Phase 5: Build flow groups via BFS from each command ---
  interface FlowGroup {
    commands: string[];
    handlers: string[];
    actors: string[];
    events: string[];
    policies: string[];
    dbs: string[];
    allNodes: Set<string>;
  }

  const groups: FlowGroup[] = [];
  const assigned = new Set<string>();

  const expandGroup = (seedCmd: string) => {
    const g: FlowGroup = {
      commands: [],
      handlers: [],
      actors: [],
      events: [],
      policies: [],
      dbs: [],
      allNodes: new Set(),
    };

    const addNode = (id: string) => {
      if (g.allNodes.has(id)) return;
      g.allNodes.add(id);
      const t = entityType(entities, id);
      const role = getRole(id);
      if (t === TYPES.COMMAND) g.commands.push(id);
      else if (t === TYPES.EVENT) g.events.push(id);
      else if (t === TYPES.POLICY) g.policies.push(id);
      else if (role === 'handler') {
        if (t === TYPES.USER) g.actors.push(id);
        else g.handlers.push(id);
      }
      else if (role === 'db') g.dbs.push(id);
    };

    // Seed: command + its handler + its actor
    addNode(seedCmd);
    const seedHandler = cmdHandler.get(seedCmd);
    if (seedHandler) addNode(seedHandler);
    const seedActor = cmdActor.get(seedCmd);
    if (seedActor) addNode(seedActor);

    // Also add incoming policies (backward from command)
    const incomingPolicies = inEdges.get(seedCmd)!.filter(
      f => entityType(entities, f) === TYPES.POLICY
    );
    incomingPolicies.forEach(pol => addNode(pol));

    // BFS from handler to discover events -> policies -> commands
    const visited = new Set<string>();
    const q: string[] = seedHandler ? [seedHandler] : [seedCmd];
    q.forEach(n => visited.add(n));

    // Also seed BFS from incoming policies
    incomingPolicies.forEach(pol => {
      if (!visited.has(pol)) {
        visited.add(pol);
        q.push(pol);
      }
    });

    let safety = 0;
    const maxIter = nodeIds.length * 3;

    while (q.length > 0 && safety < maxIter) {
      safety++;
      const curr = q.shift()!;
      const currType = entityType(entities, curr);
      const currRole = getRole(curr);

      // From handler: discover emitted events and connected DBs/externals
      if (currRole === 'handler') {
        for (const tgt of outEdges.get(curr)!) {
          const tgtType = entityType(entities, tgt);
          if (tgtType === TYPES.EVENT && !g.allNodes.has(tgt)) {
            addNode(tgt);
            if (!visited.has(tgt)) {
              visited.add(tgt);
              q.push(tgt);
            }
          }
          if (getRole(tgt) === 'db' && !g.allNodes.has(tgt)) {
            addNode(tgt);
          }
        }
      }

      // From event: discover outgoing policies
      if (currType === TYPES.EVENT) {
        for (const tgt of outEdges.get(curr)!) {
          if (entityType(entities, tgt) === TYPES.POLICY && !g.allNodes.has(tgt)) {
            addNode(tgt);
            if (!visited.has(tgt)) {
              visited.add(tgt);
              q.push(tgt);
            }
          }
        }
      }

      // From policy: discover outgoing commands (but don't expand further)
      if (currType === TYPES.POLICY) {
        for (const tgt of outEdges.get(curr)!) {
          if (entityType(entities, tgt) === TYPES.COMMAND) {
            // Don't add next command — it starts its own group
          }
        }
      }

      // From command (only seed): discover outgoing events/policies directly
      if (currType === TYPES.COMMAND) {
        for (const tgt of outEdges.get(curr)!) {
          const tgtType = entityType(entities, tgt);
          if (tgtType === TYPES.POLICY && !g.allNodes.has(tgt)) {
            addNode(tgt);
            if (!visited.has(tgt)) {
              visited.add(tgt);
              q.push(tgt);
            }
          }
          if (getRole(tgt) === 'handler' && !g.allNodes.has(tgt)) {
            addNode(tgt);
            if (!visited.has(tgt)) {
              visited.add(tgt);
              q.push(tgt);
            }
          }
        }
      }
    }

    groups.push(g);
    g.allNodes.forEach(id => assigned.add(id));
  };

  cmdNodes.forEach(cmd => {
    if (!assigned.has(cmd)) expandGroup(cmd);
  });

  // Remaining unassigned timeline nodes
  timelineNodes.forEach(id => {
    if (!assigned.has(id)) expandGroup(id);
  });

  // --- Phase 6: Topological order of groups ---
  const groupOut = new Map<number, number[]>();
  const groupInDegree = new Map<number, number>();
  groups.forEach((_, i) => {
    groupOut.set(i, []);
    groupInDegree.set(i, 0);
  });

  rels.forEach(rel => {
    const fromGroup = groups.findIndex(g => g.allNodes.has(rel.from));
    const toGroup = groups.findIndex(g => g.allNodes.has(rel.to));
    if (fromGroup >= 0 && toGroup >= 0 && fromGroup !== toGroup) {
      if (!groupOut.get(fromGroup)!.includes(toGroup)) {
        groupOut.get(fromGroup)!.push(toGroup);
        groupInDegree.set(toGroup, groupInDegree.get(toGroup)! + 1);
      }
    }
  });

  const topoGroups: number[] = [];
  const gQueue: number[] = [];
  groups.forEach((_, i) => {
    if (groupInDegree.get(i) === 0) gQueue.push(i);
  });
  if (gQueue.length === 0 && groups.length > 0) gQueue.push(0);

  while (gQueue.length > 0) {
    const gi = gQueue.shift()!;
    topoGroups.push(gi);
    groupOut.get(gi)!.forEach(next => {
      groupInDegree.set(next, groupInDegree.get(next)! - 1);
      if (groupInDegree.get(next) === 0) gQueue.push(next);
    });
  }

  // --- Phase 7: Assign grid positions ---
  const col = new Map<string, number>();
  const row = new Map<string, number>();

  const CMD_COL = 0;
  const EVT_COL = 1;
  const POL_COL = 2;

  // Per-group column offsets
  const groupOffset = new Map<number, number>();
  let runningCol = 0;

  topoGroups.forEach(gi => {
    const g = groups[gi];
    groupOffset.set(gi, runningCol);

    // Identify branching events
    const branchPolicies = new Map<string, number>();
    g.events.forEach(evt => {
      const pols = outEdges.get(evt)!.filter(t => g.policies.includes(t));
      if (pols.length > 0) branchPolicies.set(evt, pols.length);
    });

    // Command column: stack commands with handlers
    g.commands.forEach((cmd, cIdx) => {
      col.set(cmd, CMD_COL);
      row.set(cmd, 2 + cIdx * 1.5);

      const h = cmdHandler.get(cmd);
      if (h) {
        col.set(h, CMD_COL);
        const hType = entityType(entities, h);
        row.set(
          h,
          hType === TYPES.USER
            ? 2 + cIdx * 1.5
            : 2 + cIdx * 1.5 - 0.625
        );
      }

      const a = cmdActor.get(cmd);
      if (a) {
        const handlerIsActor =
          cmdHandler.has(cmd) && entityType(entities, cmdHandler.get(cmd)!) === TYPES.USER;
        if (!handlerIsActor && !g.handlers.includes(a)) {
          col.set(a, CMD_COL - 1);
          row.set(a, 2 + cIdx * 1.5);
        }
      }
    });

    // Event column: stack events, with user return to the right
    g.events.forEach((evt, eIdx) => {
      const isBranch = branchPolicies.get(evt)! > 1;
      col.set(evt, EVT_COL);
      row.set(evt, 2 + eIdx * (isBranch ? 1.5 : 1.2));

      const u = eventUser.get(evt);
      if (u) {
        col.set(u, EVT_COL + 1);
        row.set(u, 2 + eIdx * (isBranch ? 1.5 : 1.2));
      }
    });

    // Policy column: branching policies spread on different rows with gap
    g.policies.forEach(pol => {
      const inEvents = inEdges.get(pol)!.filter(f => g.events.includes(f));
      const srcEvent = inEvents[0];
      const srcEvtIdx = g.events.indexOf(srcEvent);
      const isBranch = srcEvtIdx >= 0 && branchPolicies.get(srcEvent)! > 1;

      if (isBranch && srcEvtIdx >= 0) {
        // Gap between event and branching policies
        col.set(pol, POL_COL + 0.5);
        // Spread siblings vertically around source event row
        const srcRow = row.get(srcEvent)!;
        const siblings = g.policies.filter(p => {
          const pe = inEdges.get(p)!.filter(f => g.events.includes(f));
          return pe.includes(srcEvent);
        });
        const sibIdx = siblings.indexOf(pol);
        const totalSibs = siblings.length;
        row.set(pol, srcRow - (totalSibs - 1) * 0.5 + sibIdx * 1.0);
      } else {
        col.set(pol, POL_COL);
        row.set(pol, 2 + g.policies.indexOf(pol) * 1.2);
      }
    });

    // DBs attached to handlers
    g.dbs.forEach(db => {
      const handlerInGroup = g.handlers.find(
        h => rels.some(r => (r.from === h && r.to === db) || (r.from === db && r.to === h))
      );
      if (handlerInGroup && col.has(handlerInGroup)) {
        col.set(db, col.get(handlerInGroup)!);
        row.set(db, row.get(handlerInGroup)! - 0.75);
      } else {
        col.set(db, 0);
        row.set(db, 0.5);
      }
    });

    // Calculate group width for next offset
    let maxInternal = 0;
    g.allNodes.forEach(id => {
      const c = col.get(id) ?? 0;
      if (c > maxInternal) maxInternal = c;
    });
    runningCol = maxInternal + GROUP_GAP;
  });

  // Apply group offsets to final positions
  const finalCol = new Map<string, number>();
  const finalRow = new Map<string, number>();

  nodes.forEach(n => {
    const gi = groups.findIndex(g => g.allNodes.has(n.id));
    const offset = gi >= 0 ? groupOffset.get(gi) ?? 0 : 0;
    finalCol.set(n.id, (col.get(n.id) ?? 0) + offset);
    finalRow.set(n.id, row.get(n.id) ?? 1);
  });

  // Unassigned nodes
  nodeIds.forEach(id => {
    if (!finalCol.has(id)) {
      finalCol.set(id, 0);
      finalRow.set(id, 1);
    }
  });

  // --- Phase 8: Collision resolution ---
  for (let iteration = 0; iteration < 10; iteration++) {
    const positions = new Map<string, string[]>();
    nodes.forEach(n => {
      const c = finalCol.get(n.id) ?? 0;
      const r = finalRow.get(n.id) ?? 0;
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
            finalRow.set(id, r + idx * 0.5);
          }
        });
      }
    });
    if (!hasCollision) break;
  }

  return nodes.map(n => ({
    ...n,
    grid: [finalCol.get(n.id)!, finalRow.get(n.id)!],
  }));
}
