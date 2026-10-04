import type { UnifiedFlowchartSchema, FlowchartRelation, FlowchartViewNode } from '../types';
import { TYPES } from '../types';
import { getEntityType, buildAdjacency, buildInDegree, buildIncoming, computeTopologicalColumns, compactColumns, computeLayoutInfo } from './utils';

export function deriveStateMachine(
  schema: UnifiedFlowchartSchema
) {
  const smNodes: FlowchartViewNode[] = [];
  const smRelations: FlowchartRelation[] = [];

  const smEntityEntry = Object.entries(schema.entities).find(([, e]) => !!e.stateMachine);

  if (smEntityEntry) {
    const [aggregateId, aggregateEntity] = smEntityEntry;
    const stateMachine = aggregateEntity.stateMachine!;
    const stateIds = new Set(stateMachine.states.map(s => s.id));
    const stateNodeId = (stateId: string) => `${aggregateId}_state_${stateId}`;

    // The initial state first, then the declared order
    const ordered = [
      ...stateMachine.states.filter(s => s.id === stateMachine.initialState),
      ...stateMachine.states.filter(s => s.id !== stateMachine.initialState),
    ];
    ordered.forEach((state, idx) => {
      schema.entities[stateNodeId(state.id)] = {
        title: state.label,
        desc: `State: ${state.label}`,
        type: TYPES.EVENT,
        viewTypes: { STATE_MACHINE: TYPES.EVENT },
        color: 'var(--ctp-mantle)',
        strokeColor: state.color
      };
      smNodes.push({ id: stateNodeId(state.id), grid: [idx * 2, 1] });
    });

    // Events declare the state they enter (`enters`); nothing else is inferred.
    const stateOf = (id: string): string | undefined => {
      const entered = schema.entities[id]?.entersState;
      return entered && stateIds.has(entered) ? entered : undefined;
    };
    const esRelations = schema.relations.filter(r => !r.views || r.views.includes('EVENT_STORMING'));
    const added = new Set<string>();
    const policyOf = (cmdId: string) =>
      esRelations.find(r => r.to === cmdId && getEntityType(schema.entities[r.from]) === TYPES.POLICY)?.from;
    const addTransition = (from: string, to: string, cmdId?: string, polId?: string) => {
      if (from === to) return;
      const key = `${from}->${to}`;
      if (added.has(key)) return;
      added.add(key);
      const cmdTitle = cmdId ? schema.entities[cmdId]?.title : '';
      const polTitle = polId ? schema.entities[polId]?.title : undefined;
      smRelations.push({
        id: `derived_state_machine_rel_${aggregateId}_${smRelations.length}`,
        from: stateNodeId(from),
        to: stateNodeId(to),
        views: ['STATE_MACHINE'],
        label: polTitle ? `${cmdTitle} \n[Guard: ${polTitle}]` : cmdTitle
      });
    };

    // From each state-entering event, walk forward to the next state-entering
    // events: each one reached is a transition, labelled with the command that
    // produced it (and that command's policy as the guard). A path with no
    // command on it is not a transition.
    const walk = (startId: string, fromState: string) => {
      const queue: Array<{ id: string; path: string[]; cmd?: string; pol?: string }> = [{ id: startId, path: [startId] }];
      while (queue.length > 0) {
        const { id, path, cmd, pol } = queue.shift()!;
        for (const rel of esRelations.filter(r => r.from === id)) {
          const next = rel.to;
          if (path.includes(next) || !schema.entities[next]) continue;
          const type = getEntityType(schema.entities[next]);
          const nextCmd = type === TYPES.COMMAND ? next : cmd;
          const nextPol = type === TYPES.POLICY ? next : pol;
          const entered = stateOf(next);
          if (entered && entered !== fromState) {
            if (nextCmd) addTransition(fromState, entered, nextCmd, policyOf(nextCmd) ?? nextPol);
          }
          else queue.push({ id: next, path: [...path, next], cmd: nextCmd, pol: nextPol });
        }
      }
    };

    const stateEvents = Object.keys(schema.entities).filter(id => stateOf(id));
    stateEvents.forEach(id => walk(id, stateOf(id)!));

    // Events entered without an earlier state-entering event leave the initial state.
    const reachedFromState = new Set<string>();
    stateEvents.forEach(start => {
      const seen = new Set([start]);
      const queue = [start];
      while (queue.length > 0) {
        const id = queue.shift()!;
        for (const rel of esRelations.filter(r => r.from === id)) {
          if (seen.has(rel.to)) continue;
          seen.add(rel.to);
          if (stateOf(rel.to)) reachedFromState.add(rel.to);
          else queue.push(rel.to);
        }
      }
    });
    stateEvents
      .filter(id => !reachedFromState.has(id) && stateIds.has(stateMachine.initialState))
      .forEach(id => {
        const producer = esRelations.find(r => r.to === id);
        const cmdRel = producer && getEntityType(schema.entities[producer.from]) === TYPES.COMMAND
          ? producer
          : esRelations.find(r => producer && r.to === producer.from && r.handledBy);
        const cmdId = cmdRel?.from;
        if (cmdId) addTransition(stateMachine.initialState, stateOf(id)!, cmdId, policyOf(cmdId));
      });
  }

  const updatedRelations = [
    ...schema.relations.filter(r => !r.views || !r.views.includes('STATE_MACHINE')),
    ...smRelations
  ];

  const laidOutSmNodes = layoutStates(smNodes, smRelations);

  return {
    nodes: laidOutSmNodes,
    groups: [],
    relations: updatedRelations,
    layoutInfo: computeLayoutInfo(laidOutSmNodes)
  };
}

/**
 * States read left to right by how many transitions they are from the first
 * (initial) state; states the same distance away stack in a column. Loops back
 * to earlier states do not push a state further right.
 */
function layoutStates(nodes: FlowchartViewNode[], transitions: FlowchartRelation[]): FlowchartViewNode[] {
  if (nodes.length === 0) return nodes;
  const depth = new Map<string, number>([[nodes[0].id, 0]]);
  const queue = [nodes[0].id];
  while (queue.length > 0) {
    const id = queue.shift()!;
    transitions.filter(t => t.from === id).forEach(t => {
      if (!depth.has(t.to)) {
        depth.set(t.to, depth.get(id)! + 1);
        queue.push(t.to);
      }
    });
  }
  const lastColumn = Math.max(0, ...depth.values());
  const rowsUsed = new Map<number, number>();
  return nodes.map(n => {
    const column = depth.get(n.id) ?? lastColumn + 1;
    const row = rowsUsed.get(column) ?? 0;
    rowsUsed.set(column, row + 1);
    return { ...n, grid: [column * 2, row] as [number, number] };
  });
}

export function layoutGeneral(
  nodes: FlowchartViewNode[],
  nodeIds: string[],
  nodeSet: Set<string>,
  relations: FlowchartRelation[],
  viewKey: string
): FlowchartViewNode[] {
  const adj = buildAdjacency(nodeIds, relations, viewKey, nodeSet);
  const inDegree = buildInDegree(nodeIds, relations, viewKey, nodeSet);
  const incoming = buildIncoming(nodeIds, relations, viewKey, nodeSet);

  const col = computeTopologicalColumns(nodeIds, inDegree, adj);

  const colGroups = new Map<number, string[]>();
  col.forEach((c, id) => {
    if (!colGroups.has(c)) colGroups.set(c, []);
    colGroups.get(c)!.push(id);
  });
  const sortedCols = Array.from(colGroups.keys()).sort((a, b) => a - b);

  const row = new Map<string, number>();

  sortedCols.forEach(c => {
    const colNodes = colGroups.get(c) || [];

    if (c === 0) {
      colNodes.sort((a, b) => nodeIds.indexOf(a) - nodeIds.indexOf(b));
      colNodes.forEach((id, idx) => row.set(id, idx));
    } else {
      const weights = new Map<string, number>();
      colNodes.forEach(id => {
        let sum = 0, count = 0;
        const parents = incoming.get(id) || [];
        parents.forEach(p => {
          const pCol = col.get(p)!;
          const pRow = row.get(p);
          if (pCol < c && pRow !== undefined) {
            sum += pRow;
            count++;
          }
        });
        weights.set(id, count > 0 ? sum / count : 999);
      });

      colNodes.sort((a, b) => {
        const wA = weights.get(a)!;
        const wB = weights.get(b)!;
        if (wA !== wB) return wA - wB;
        return nodeIds.indexOf(a) - nodeIds.indexOf(b);
      });

      colNodes.forEach((id, idx) => row.set(id, idx));
    }
  });

  const compactedCol = compactColumns(sortedCols, col);

  return nodes.map(n => ({
    ...n,
    grid: [compactedCol.get(n.id)!, row.get(n.id)!]
  }));
}
