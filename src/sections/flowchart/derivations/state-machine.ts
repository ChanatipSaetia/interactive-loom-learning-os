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

    const isDocPipeline = stateMachine.states.some(s => s.id === 'QUEUED');
    const isAgent = stateMachine.states.some(s => s.id === 'THINKING');

    let layouts: Record<string, [number, number]> = {};
    if (isDocPipeline) {
      layouts = {
        QUEUED: [0, 1],
        EXTRACTING: [2, 1],
        VALIDATING: [4, 1],
        HIGH_CONFIDENCE: [6, 1],
        LOW_CONFIDENCE: [4, 2],
        AUDITED: [6, 2],
        COMPLETED: [8, 1]
      };
    } else if (isAgent) {
      layouts = {
        IDLE: [0, 1],
        THINKING: [2, 1],
        EXECUTING_TOOL: [4, 1],
        DELEGATING: [4, 2],
        COMPLETED: [6, 1]
      };
    } else if (stateMachine.states.some(s => s.id === 'PLANNING')) {
      layouts = {
        IDLE: [0, 1],
        PLANNING: [2, 1],
        EXECUTING: [4, 1],
        EVALUATING: [6, 1],
        ESCALATED: [4, 2]
      };
    } else if (aggregateId === 'order_service') {
      layouts = {
        PENDING: [0, 1],
        INVENTORY_LOCKED: [2, 1],
        PAYMENT_AUTHORIZED: [4, 1],
        FRAUD_CLEARED: [6, 1],
        CONFIRMED: [8, 1],
        FRAUD_REVIEW: [4, 2],
        CANCELLED: [8, 2]
      };
    }

    const EVENT_TO_STATE_MAP: Record<string, string> = {
      evt_order_placed: 'PENDING',
      evt_inventory_locked: 'INVENTORY_LOCKED',
      evt_payment_authorized: 'PAYMENT_AUTHORIZED',
      evt_fraud_evaluated: 'FRAUD_CLEARED',
      evt_fraud_flagged: 'FRAUD_REVIEW',
      evt_review_decision: 'FRAUD_REVIEW',
      evt_order_confirmed: 'CONFIRMED',
      evt_order_approved: 'CONFIRMED',
      evt_order_cancelled: 'CANCELLED',

      evt_uploaded: 'QUEUED',
      evt_extracted: 'EXTRACTING',
      evt_validated: 'VALIDATING',
      evt_approved: 'HIGH_CONFIDENCE',
      evt_flagged: 'LOW_CONFIDENCE',
      evt_audited: 'AUDITED',
      evt_completed: 'COMPLETED',

      evt_started: 'THINKING',
      evt_reasoned: 'THINKING',
      evt_tool_executed: 'EXECUTING_TOOL',
      evt_done: 'COMPLETED',

      evt_goal: 'IDLE',
      evt_plan: 'PLANNING',
      evt_exec: 'EXECUTING',
      evt_eval: 'EVALUATING',
      evt_escalate: 'ESCALATED'
    };

    stateMachine.states.forEach((state, idx) => {
      const stateNodeId = `${aggregateId}_state_${state.id}`;
      schema.entities[stateNodeId] = {
        title: state.label,
        desc: `State: ${state.label}`,
        type: TYPES.EVENT,
        viewTypes: { STATE_MACHINE: TYPES.EVENT },
        color: 'var(--ctp-mantle)',
        strokeColor: state.color
      };

      const gridPos = layouts[state.id] || [idx * 2, 1];
      smNodes.push({
        id: stateNodeId,
        grid: gridPos
      });
    });

    if (isAgent) {
      smRelations.push({
        id: `derived_state_machine_rel_${aggregateId}_idle_thinking`,
        from: `${aggregateId}_state_IDLE`,
        to: `${aggregateId}_state_THINKING`,
        views: ['STATE_MACHINE'],
        label: 'Run Agent \n[Guard: Goal Submitted]'
      });
      smRelations.push({
        id: `derived_state_machine_rel_${aggregateId}_exec_delegating`,
        from: `${aggregateId}_state_EXECUTING_TOOL`,
        to: `${aggregateId}_state_DELEGATING`,
        views: ['STATE_MACHINE'],
        label: 'Delegate Task \n[Guard: Subagent Target]'
      });
      smRelations.push({
        id: `derived_state_machine_rel_${aggregateId}_delegating_exec`,
        from: `${aggregateId}_state_DELEGATING`,
        to: `${aggregateId}_state_EXECUTING_TOOL`,
        views: ['STATE_MACHINE'],
        label: 'Return Output'
      });
    } else if (stateMachine.states.some(s => s.id === 'PLANNING')) {
      smRelations.push({
        id: `derived_state_machine_rel_${aggregateId}_idle_planning`,
        from: `${aggregateId}_state_IDLE`,
        to: `${aggregateId}_state_PLANNING`,
        views: ['STATE_MACHINE'],
        label: 'Submit Goal \n[Guard: Plan on Goal]'
      });
      smRelations.push({
        id: `derived_state_machine_rel_${aggregateId}_planning_exec`,
        from: `${aggregateId}_state_PLANNING`,
        to: `${aggregateId}_state_EXECUTING`,
        views: ['STATE_MACHINE'],
        label: 'Generate Plan \n[Guard: Execute on Planned]'
      });
      smRelations.push({
        id: `derived_state_machine_rel_${aggregateId}_exec_eval`,
        from: `${aggregateId}_state_EXECUTING`,
        to: `${aggregateId}_state_EVALUATING`,
        views: ['STATE_MACHINE'],
        label: 'Run Tools \n[Guard: Evaluate on Executed]'
      });
      smRelations.push({
        id: `derived_state_machine_rel_${aggregateId}_eval_idle`,
        from: `${aggregateId}_state_EVALUATING`,
        to: `${aggregateId}_state_IDLE`,
        views: ['STATE_MACHINE'],
        label: 'Succeed \n[Guard: Finish on Success]'
      });
      smRelations.push({
        id: `derived_state_machine_rel_${aggregateId}_eval_escalated`,
        from: `${aggregateId}_state_EVALUATING`,
        to: `${aggregateId}_state_ESCALATED`,
        views: ['STATE_MACHINE'],
        label: 'Escalate \n[Guard: Escalate on Failure]'
      });
      smRelations.push({
        id: `derived_state_machine_rel_${aggregateId}_escalated_planning`,
        from: `${aggregateId}_state_ESCALATED`,
        to: `${aggregateId}_state_PLANNING`,
        views: ['STATE_MACHINE'],
        label: 'Retry / Re-plan \n[Guard: Re-plan on Escalated]'
      });
    }

    const addedTransitions = new Set<string>();

    Object.keys(schema.entities).forEach(startId => {
      const stateA = EVENT_TO_STATE_MAP[startId];
      if (!stateA) return;

      const queue: Array<{
        currentId: string;
        path: string[];
        firstCmdId?: string;
        firstPolId?: string;
      }> = [{ currentId: startId, path: [startId] }];

      while (queue.length > 0) {
        const { currentId, path, firstCmdId, firstPolId } = queue.shift()!;

        const outRels = schema.relations.filter(r =>
          (!r.views || r.views.includes('EVENT_STORMING')) && r.from === currentId
        );

        outRels.forEach(rel => {
          const nextId = rel.to;
          if (path.includes(nextId)) return;

          const nextEntity = schema.entities[nextId];
          if (!nextEntity) return;

          const nextRole = getEntityType(nextEntity);
          const newFirstCmd = firstCmdId || (nextRole === TYPES.COMMAND ? nextId : undefined);
          const newFirstPol = firstPolId || (nextRole === TYPES.POLICY ? nextId : undefined);

          const stateB = EVENT_TO_STATE_MAP[nextId];
          if (stateB && stateB !== stateA) {
            const transitionKey = `${stateA}->${stateB}`;
            if (!addedTransitions.has(transitionKey)) {
              addedTransitions.add(transitionKey);

              const fromNodeId = `${aggregateId}_state_${stateA}`;
              const toNodeId = `${aggregateId}_state_${stateB}`;

              const cmdTitle = newFirstCmd ? schema.entities[newFirstCmd]?.title : 'Transition';
              const polTitle = newFirstPol ? schema.entities[newFirstPol]?.title : undefined;
              const label = polTitle ? `${cmdTitle} \n[Guard: ${polTitle}]` : cmdTitle;

              smRelations.push({
                id: `derived_state_machine_rel_${aggregateId}_${smRelations.length}`,
                from: fromNodeId,
                to: toNodeId,
                views: ['STATE_MACHINE'],
                label
              });
            }
          } else {
            queue.push({
              currentId: nextId,
              path: [...path, nextId],
              firstCmdId: newFirstCmd,
              firstPolId: newFirstPol
            });
          }
        });
      }
    });
  }

  const updatedRelations = [
    ...schema.relations.filter(r => !r.views || !r.views.includes('STATE_MACHINE')),
    ...smRelations
  ];

  const nodeIds = smNodes.map(n => n.id);
  const nodeSet = new Set(nodeIds);
  const laidOutSmNodes = layoutGeneral(smNodes, nodeIds, nodeSet, updatedRelations, 'STATE_MACHINE');

  return {
    nodes: laidOutSmNodes,
    groups: [],
    relations: updatedRelations,
    layoutInfo: computeLayoutInfo(laidOutSmNodes)
  };
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

  if (nodeIds.includes('temp_center')) {
    const otherCols = nodeIds.filter(id => id !== 'temp_center').map(id => compactedCol.get(id) || 0);
    const minC = otherCols.length > 0 ? Math.min(...otherCols) : 0;
    const maxC = otherCols.length > 0 ? Math.max(...otherCols) : 0;

    const otherRows = nodeIds.filter(id => id !== 'temp_center').map(id => row.get(id) || 0);
    const minR = otherRows.length > 0 ? Math.min(...otherRows) : 0;
    const maxR = otherRows.length > 0 ? Math.max(...otherRows) : 0;

    compactedCol.set('temp_center', Math.round((minC + maxC) / 2));
    row.set('temp_center', Math.round((minR + maxR) / 2));
  }

  return nodes.map(n => ({
    ...n,
    grid: [compactedCol.get(n.id)!, row.get(n.id)!]
  }));
}
