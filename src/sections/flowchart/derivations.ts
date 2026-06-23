import type { UnifiedFlowchartSchema, FlowchartRelation, FlowchartViewNode, FlowchartViewGroup, FlowchartEntity } from './types';
import { MASTER_MAPPING_MATRIX, TYPES } from './types';

// Helper to resolve the entity's primary type (event storming node type)
const getEntityType = (entity: FlowchartEntity | undefined): string => {
  return entity?.type || entity?.viewTypes?.EVENT_STORMING || 'default';
};

/**
 * Automatically derives SYS_ARCH, SWIMLANES, SEQUENCE, and DATA_FLOW views 
 * from the master EVENT_STORMING view if they are not explicitly declared.
 */
export function autoDeriveViews(schema: UnifiedFlowchartSchema): UnifiedFlowchartSchema {
  // If views are already fully configured, return the schema as-is
  const viewKeys = Object.keys(schema.views);
  const hasOnlyEventStorming = viewKeys.length === 1 && viewKeys.includes('EVENT_STORMING');
  
  if (!hasOnlyEventStorming) {
    return schema;
  }

  // Clone entities to avoid mutating the original schema directly and expand refs
  const expandedEntities = { ...schema.entities };
  Object.entries(schema.entities).forEach(([canonicalId, entity]) => {
    if (entity.refs && entity.refs.length > 0) {
      entity.refs.forEach(refId => {
        if (!expandedEntities[refId]) {
          expandedEntities[refId] = {
            ...entity,
            collapsedTo: canonicalId,
            title: entity.title,
            desc: entity.desc
          };
        }
      });
    }
  });

  const updatedRelations = schema.relations.map(r => ({
    ...r,
    views: r.views || ['EVENT_STORMING']
  }));

  schema = {
    ...schema,
    relations: updatedRelations,
    entities: expandedEntities
  };

  const esView = schema.views.EVENT_STORMING;
  if (!esView) return schema;

  const derivedViews = { ...schema.views };

  // Helper to find the original Event Storming node position
  const getESNode = (nodeId: string): FlowchartViewNode | undefined => {
    return esView.nodes.find(n => n.id === nodeId);
  };

  // Helper to get collapsed target ID
  const getCollapsedId = (id: string): string => {
    return schema.entities[id]?.collapsedTo || id;
  };

  // ----------------------------------------------------
  // 1. Derive SYS_ARCH (System Architecture)
  // ----------------------------------------------------
  if (!derivedViews.SYS_ARCH) {
    const sysNodes: FlowchartViewNode[] = [];
    const addedNodes = new Set<string>();
    
    // Filter structural entities using MASTER_MAPPING_MATRIX
    Object.entries(schema.entities).forEach(([id, entity]) => {
      const type = getEntityType(entity);
      const esNode = getESNode(id);
      if (!esNode) return;

      const sysType = MASTER_MAPPING_MATRIX[type]?.SYS_ARCH;
      if (sysType) {
        const collapsedId = getCollapsedId(id);
        if (addedNodes.has(collapsedId)) return;
        addedNodes.add(collapsedId);

        let row = 1;
        if (sysType === TYPES.USER) row = 0;
        else if (sysType === TYPES.SERVICE) row = 1;
        else if (sysType === TYPES.DATABASE) row = 2;
        else if (sysType === TYPES.EXTERNAL) row = 3;

        sysNodes.push({
          id: collapsedId,
          grid: [esNode.grid ? esNode.grid[0] : 0, row]
        });
      }
    });

    // Derive relations using our path tracer
    const getSysArchLabel = (pathNodeIds: string[]): { label: string } => {
      const cmdNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.COMMAND);
      const evtNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.EVENT);

      if (cmdNode && evtNode) {
        return { label: `${schema.entities[cmdNode].title} / ${schema.entities[evtNode].title}` };
      }
      if (cmdNode) return { label: schema.entities[cmdNode].title };
      if (evtNode) return { label: schema.entities[evtNode].title };

      return { label: '' };
    };

    const sysRelations = deriveRelations(schema, 'SYS_ARCH', addedNodes, getSysArchLabel);

    schema.relations = [
      ...schema.relations.filter(r => !r.views || !r.views.includes('SYS_ARCH')),
      ...sysRelations
    ];

    derivedViews.SYS_ARCH = {
      name: 'System Architecture',
      icon: 'Server',
      nodes: sysNodes,
      groups: []
    };
  }

  // ----------------------------------------------------
  // 2. Derive SWIMLANES (Activity Swimlanes)
  // ----------------------------------------------------
  if (!derivedViews.SWIMLANES) {
    const swimNodes: FlowchartViewNode[] = [];
    const addedNodes = new Set<string>();
    const swimGroups: FlowchartViewGroup[] = [
      { id: 'lane_actor', title: 'User Activity', isLane: true, row: 0 },
      { id: 'lane_core', title: 'Automated Core', isLane: true, row: 1 },
      { id: 'lane_ext', title: 'External Integration', isLane: true, row: 2 }
    ];

    Object.entries(schema.entities).forEach(([id, entity]) => {
      const type = getEntityType(entity);
      const esNode = getESNode(id);
      if (!esNode) return;

      const swimType = MASTER_MAPPING_MATRIX[type]?.SWIMLANES;
      if (swimType) {
        const collapsedId = getCollapsedId(id);
        if (addedNodes.has(collapsedId)) return;
        addedNodes.add(collapsedId);

        let row = 1;
        if (swimType === TYPES.USER) row = 0;
        else if (swimType === TYPES.EXTERNAL) row = 2;

        swimNodes.push({
          id: collapsedId,
          grid: [esNode.grid ? esNode.grid[0] : 0, row]
        });
      }
    });

    const getSwimlaneLabel = (pathNodeIds: string[]): { label: string } => {
      const evtNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.EVENT);
      if (evtNode) return { label: schema.entities[evtNode].title };
      return { label: '' };
    };

    const swimRelations = deriveRelations(schema, 'SWIMLANES', addedNodes, getSwimlaneLabel);

    schema.relations = [
      ...schema.relations.filter(r => !r.views || !r.views.includes('SWIMLANES')),
      ...swimRelations
    ];

    derivedViews.SWIMLANES = {
      name: 'Activity Swimlanes',
      icon: 'Share2',
      nodes: swimNodes,
      groups: swimGroups
    };
  }

  // ----------------------------------------------------
  // 3. Derive SEQUENCE (Sequence Diagram)
  // ----------------------------------------------------
  if (!derivedViews.SEQUENCE) {
    const seqNodes: FlowchartViewNode[] = [];
    const addedNodes = new Set<string>();

    Object.entries(schema.entities).forEach(([id, entity]) => {
      const type = getEntityType(entity);
      const seqType = MASTER_MAPPING_MATRIX[type]?.SEQUENCE;
      if (seqType) {
        const collapsedId = getCollapsedId(id);
        addedNodes.add(collapsedId);
      }
    });

    // Sort participant lifelines by their original Event Storming column index
    const sortedParticipants = Array.from(addedNodes).sort((a, b) => {
      const esNodeA = esView.nodes.find(n => getCollapsedId(n.id) === a);
      const esNodeB = esView.nodes.find(n => getCollapsedId(n.id) === b);
      const colA = esNodeA?.grid?.[0] ?? 0;
      const colB = esNodeB?.grid?.[0] ?? 0;
      return colA - colB;
    });

    sortedParticipants.forEach((id, colIdx) => {
      seqNodes.push({
        id,
        grid: [colIdx, 0]
      });
    });

    const getSequenceLabel = (pathNodeIds: string[]): { label: string; dashed?: boolean } => {
      const evtNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.EVENT);
      const cmdNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.COMMAND);

      if (evtNode && cmdNode) {
        return {
          label: `${schema.entities[evtNode].title} / ${schema.entities[cmdNode].title}`,
          dashed: false
        };
      }
      if (evtNode) {
        return { label: schema.entities[evtNode].title, dashed: true };
      }
      if (cmdNode) {
        return { label: schema.entities[cmdNode].title, dashed: false };
      }
      return { label: '', dashed: false };
    };

    const seqRelations = deriveRelations(schema, 'SEQUENCE', addedNodes, getSequenceLabel);

    // Sort relations chronologically based on their source/path order
    seqRelations.sort((a, b) => {
      const aIndex = schema.relations.findIndex(r => (!r.views || r.views.includes('EVENT_STORMING')) && getCollapsedId(r.from) === a.from);
      const bIndex = schema.relations.findIndex(r => (!r.views || r.views.includes('EVENT_STORMING')) && getCollapsedId(r.from) === b.from);
      return aIndex - bIndex;
    });

    schema.relations = [
      ...schema.relations.filter(r => !r.views || !r.views.includes('SEQUENCE')),
      ...seqRelations
    ];

    derivedViews.SEQUENCE = {
      name: 'Sequence Diagram',
      icon: 'List',
      nodes: seqNodes,
      groups: []
    };
  }

  // ----------------------------------------------------
  // 4. Derive DATA_FLOW (Data Flow Diagram)
  // ----------------------------------------------------
  if (!derivedViews.DATA_FLOW) {
    const dfNodes: FlowchartViewNode[] = [];
    const addedNodes = new Set<string>();

    Object.entries(schema.entities).forEach(([id, entity]) => {
      const type = getEntityType(entity);
      const esNode = getESNode(id);
      if (!esNode) return;

      const dfType = MASTER_MAPPING_MATRIX[type]?.DATA_FLOW;
      if (dfType) {
        const collapsedId = getCollapsedId(id);
        if (addedNodes.has(collapsedId)) return;
        addedNodes.add(collapsedId);

        let row = 1;
        if (dfType === TYPES.USER) row = 0;
        else if (dfType === TYPES.HOTSPOT) row = 2;

        dfNodes.push({
          id: collapsedId,
          grid: [esNode.grid ? esNode.grid[0] : 0, row]
        });
      }
    });

    const getDataFlowLabel = (pathNodeIds: string[], startId: string): { label: string } => {
      const cmdNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.COMMAND);
      if (!cmdNode) return { label: '' };

      const cmdTitle = schema.entities[cmdNode].title;

      // Find if there is an Event (Data Object) on the path or at the start
      let dataObjectTitle = '';
      const startEntity = schema.entities[startId];
      if (startEntity && getEntityType(startEntity) === TYPES.EVENT) {
        dataObjectTitle = startEntity.viewTitles?.DATA_FLOW || startEntity.title;
      } else {
        const evtNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.EVENT);
        if (evtNode) {
          const evtEntity = schema.entities[evtNode];
          dataObjectTitle = evtEntity.viewTitles?.DATA_FLOW || evtEntity.title;
        }
      }

      // Find the component (Aggregate, DB, or External system)
      let componentName = '';
      const compNode = pathNodeIds.find(id => {
        const type = getEntityType(schema.entities[id]);
        return type === TYPES.AGGREGATE || type === TYPES.DATABASE || type === TYPES.EXTERNAL;
      });

      if (compNode) {
        componentName = schema.entities[compNode].title;
        const type = getEntityType(schema.entities[compNode]);
        let typeLabel = 'aggregate';
        if (type === TYPES.DATABASE) typeLabel = 'db';
        else if (type === TYPES.EXTERNAL) typeLabel = 'external';
        componentName = `${componentName} [${typeLabel}]`;
      }

      if (dataObjectTitle && componentName) {
        return { label: `${cmdTitle} (${dataObjectTitle} in ${componentName})` };
      }
      if (dataObjectTitle) {
        return { label: `${cmdTitle} (${dataObjectTitle})` };
      }
      return { label: cmdTitle };
    };

    const dfRelations = deriveRelations(schema, 'DATA_FLOW', addedNodes, getDataFlowLabel);

    schema.relations = [
      ...schema.relations.filter(r => !r.views || !r.views.includes('DATA_FLOW')),
      ...dfRelations
    ];

    derivedViews.DATA_FLOW = {
      name: 'Data Flow',
      icon: 'Share2',
      nodes: dfNodes,
      groups: []
    };
  }

  // ----------------------------------------------------
  // 5. Derive STATE_MACHINE (State Machine)
  // ----------------------------------------------------
  if (!derivedViews.STATE_MACHINE) {
    const smNodes: FlowchartViewNode[] = [];
    const smRelations: FlowchartRelation[] = [];

    // Find the first entity with a stateMachine definition
    const smEntityEntry = Object.entries(schema.entities).find(([, e]) => !!e.stateMachine);

    if (smEntityEntry) {
      const [aggregateId, aggregateEntity] = smEntityEntry;
      const stateMachine = aggregateEntity.stateMachine!;

      // Spaced grid layouts for state machines
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

      // Add each state as a temporary entity in the compiled schema
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

      // Add manual transitions for non-event-sourced states (like IDLE/DELEGATING/ESCALATED)
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

      // Traversal branch tracker to avoid duplicate transition relations
      const addedTransitions = new Set<string>();

      // Traverse flow relations skipping intermediate events to find transitions
      Object.keys(schema.entities).forEach(startId => {
        const stateA = EVENT_TO_STATE_MAP[startId];
        if (!stateA) return;

        // BFS queue: { currentId, path, firstCmdId, firstPolId }
        const queue: Array<{
          currentId: string;
          path: string[];
          firstCmdId?: string;
          firstPolId?: string;
        }> = [{ currentId: startId, path: [startId] }];

        while (queue.length > 0) {
          const { currentId, path, firstCmdId, firstPolId } = queue.shift()!;

          // Find outgoing EVENT_STORMING relations
          const outRels = schema.relations.filter(r =>
            (!r.views || r.views.includes('EVENT_STORMING')) && r.from === currentId
          );

          outRels.forEach(rel => {
            const nextId = rel.to;
            if (path.includes(nextId)) return; // Avoid cycles

            const nextEntity = schema.entities[nextId];
            if (!nextEntity) return;

            const nextRole = getEntityType(nextEntity);
            const newFirstCmd = firstCmdId || (nextRole === TYPES.COMMAND ? nextId : undefined);
            const newFirstPol = firstPolId || (nextRole === TYPES.POLICY ? nextId : undefined);

            const stateB = EVENT_TO_STATE_MAP[nextId];
            if (stateB && stateB !== stateA) {
              // Found a transition from stateA to stateB!
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
              // Continue BFS traversal (skipping intermediate event/command/policy nodes)
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

    schema.relations = [
      ...schema.relations.filter(r => !r.views || !r.views.includes('STATE_MACHINE')),
      ...smRelations
    ];

    derivedViews.STATE_MACHINE = {
      name: 'State Machine',
      icon: 'Activity',
      nodes: smNodes,
      groups: []
    };
  }

  // Update entity viewTypes to match derived configurations from MASTER_MAPPING_MATRIX
  const finalEntities = { ...schema.entities };
  Object.keys(finalEntities).forEach(nodeId => {
    const entity = finalEntities[nodeId];
    const esType = getEntityType(entity);
    
    const derivedTypes: Record<string, string> = { EVENT_STORMING: esType };
    const mapping = MASTER_MAPPING_MATRIX[esType];
    if (mapping) {
      Object.entries(mapping).forEach(([vk, mappedType]) => {
        if (mappedType) {
          derivedTypes[vk] = mappedType;
        }
      });
    }

    finalEntities[nodeId] = {
      ...entity,
      viewTypes: {
        ...derivedTypes,
        ...(entity.viewTypes || {}) // Keep any explicit overrides
      }
    };
  });

  return {
    ...schema,
    entities: finalEntities,
    views: derivedViews
  };
}

/**
 * Traverses EVENT_STORMING relations to find paths between participant ids.
 */
function deriveRelations(
  schema: UnifiedFlowchartSchema,
  viewKey: string,
  participantIds: Set<string>,
  getLabel: (nodesOnPath: string[], startId: string) => { label: string; dashed?: boolean }
): FlowchartRelation[] {
  const relations: FlowchartRelation[] = [];
  const visitedPaths = new Set<string>();

  const getCollapsedId = (id: string): string => {
    return schema.entities[id]?.collapsedTo || id;
  };

  participantIds.forEach(startId => {
    const collapsedStart = getCollapsedId(startId);

    // Find all instances that collapse to this startId
    const startingInstanceIds = Object.keys(schema.entities).filter(
      id => getCollapsedId(id) === startId
    );
    if (!startingInstanceIds.includes(startId)) {
      startingInstanceIds.push(startId);
    }

    // BFS queue: { currentId, path }
    const queue: Array<{
      currentId: string;
      path: string[];
    }> = startingInstanceIds.map(id => ({ currentId: id, path: [id] }));

    while (queue.length > 0) {
      const { currentId, path } = queue.shift()!;

      // Find all outgoing relations in EVENT_STORMING
      const outRels = schema.relations.filter(r => 
        (!r.views || r.views.includes('EVENT_STORMING')) && r.from === currentId
      );

      for (const rel of outRels) {
        const nextId = rel.to;
        const collapsedNext = getCollapsedId(nextId);

        // Avoid loops
        if (path.includes(nextId) || path.includes(collapsedNext)) continue;

        if (participantIds.has(collapsedNext)) {
          if (collapsedNext !== collapsedStart) {
            const pathNodeIds = [...path.slice(1), nextId];
            const { label, dashed } = getLabel(pathNodeIds, startId);
            
            const relKey = `${collapsedStart}->${collapsedNext}:${label}`;
            if (!visitedPaths.has(relKey)) {
              visitedPaths.add(relKey);
              relations.push({
                id: `derived_${viewKey.toLowerCase()}_rel_${collapsedStart}_${collapsedNext}_${relations.length}`,
                from: collapsedStart,
                to: collapsedNext,
                views: [viewKey],
                label,
                dashed
              });
            }
          }
        } else {
          // Intermediate node, continue BFS
          queue.push({
            currentId: nextId,
            path: [...path, nextId]
          });
        }
      }
    }
  });

  return relations;
}
