import type { UnifiedFlowchartSchema, FlowchartRelation, FlowchartViewNode, FlowchartViewGroup, FlowchartEntity, LayoutInfo } from './types';
import { MASTER_MAPPING_MATRIX, TYPES } from './types';

// Helper to resolve the entity's primary type (event storming node type)
const getEntityType = (entity: FlowchartEntity | undefined): string => {
  return entity?.type || entity?.viewTypes?.EVENT_STORMING || 'default';
};

/**
 * Count outgoing EVENT_STORMING relations for an entity.
 */
function countOutgoingRelations(
  schema: UnifiedFlowchartSchema,
  entityId: string
): number {
  // Count across all instances (canonical + refs) that resolve to this entity
  const instances = Object.keys(schema.entities).filter(
    id => (schema.entities[id]?.collapsedTo || id) === entityId || id === entityId
  );
  return schema.relations.filter(r =>
    (!r.views || r.views.includes('EVENT_STORMING')) && instances.includes(r.from)
  ).length;
}

/**
 * A Policy only maps to Decision in derived views when it's a branching point (2+ outgoing).
 * Linear Policies (0-1 outgoing) are omitted from SWIMLANES/DATA_FLOW to reduce clutter.
 */
function policyShouldMapToDecision(
  schema: UnifiedFlowchartSchema,
  entityId: string,
  entityType: string
): boolean {
  if (entityType !== TYPES.POLICY) return true;
  return countOutgoingRelations(schema, entityId) >= 2;
}

/**
 * Automatically derives SYS_ARCH, SWIMLANES, SEQUENCE, and DATA_FLOW views 
 * from the master EVENT_STORMING view if they are not explicitly declared.
 */
export function autoDeriveViews(schema: UnifiedFlowchartSchema): UnifiedFlowchartSchema {
  // Automatically lay out all existing views in the schema except SEQUENCE (needs derivation)
  const laidOutViews = { ...schema.views };
  Object.keys(laidOutViews).forEach(viewKey => {
    if (viewKey === 'SEQUENCE') return;
    const view = laidOutViews[viewKey];
    const laidOutNodes = layoutNodes(view.nodes, schema.relations, viewKey, schema.entities);
    laidOutViews[viewKey] = {
      ...view,
      nodes: laidOutNodes,
      layoutInfo: computeLayoutInfo(laidOutNodes)
    };
  });
  schema = {
    ...schema,
    views: laidOutViews
  };

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

        sysNodes.push({
          id: collapsedId,
          grid: [esNode.grid ? esNode.grid[0] : 0, 0]
        });
      }
    });

    // Derive relations using our path tracer
    const getSysArchLabel = (pathNodeIds: string[], _startId: string): { label: string } => {
      const cmdNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.COMMAND);
      const evtNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.EVENT);

      if (cmdNode && evtNode) {
        return { label: `${schema.entities[cmdNode].title} / ${schema.entities[evtNode].title}` };
      }
      if (cmdNode) return { label: schema.entities[cmdNode].title };
      if (evtNode) return { label: schema.entities[evtNode].title };

      // Fallback: use the last structural entity on the path
      const lastNode = pathNodeIds[pathNodeIds.length - 1];
      if (lastNode && schema.entities[lastNode]) {
        return { label: schema.entities[lastNode].title };
      }
      return { label: '' };
    };

    const sysRelations = deriveRelations(schema, 'SYS_ARCH', addedNodes, getSysArchLabel);

    schema.relations = [
      ...schema.relations.filter(r => !r.views || !r.views.includes('SYS_ARCH')),
      ...sysRelations
    ];

    const laidOutSysNodes = layoutNodes(sysNodes, schema.relations, 'SYS_ARCH', schema.entities);
    derivedViews.SYS_ARCH = {
      name: 'System Architecture',
      icon: 'Server',
      nodes: laidOutSysNodes,
      groups: [],
      layoutInfo: computeLayoutInfo(laidOutSysNodes)
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
      if (swimType && policyShouldMapToDecision(schema, id, type)) {
        const collapsedId = getCollapsedId(id);
        if (addedNodes.has(collapsedId)) return;
        addedNodes.add(collapsedId);

        swimNodes.push({
          id: collapsedId,
          grid: [esNode.grid ? esNode.grid[0] : 0, 0]
        });
      }
    });

   const getSwimlaneLabel = (pathNodeIds: string[], _startId: string): { label: string } => {
      const evtNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.EVENT);
      if (evtNode) return { label: schema.entities[evtNode].title };

      // Fallback: use the last structural entity on the path
      const lastNode = pathNodeIds[pathNodeIds.length - 1];
      if (lastNode && schema.entities[lastNode]) {
        return { label: schema.entities[lastNode].title };
      }
      return { label: '' };
    };

    const swimRelations = deriveRelations(schema, 'SWIMLANES', addedNodes, getSwimlaneLabel);

    schema.relations = [
      ...schema.relations.filter(r => !r.views || !r.views.includes('SWIMLANES')),
      ...swimRelations
    ];

    const laidOutSwimNodes = layoutNodes(swimNodes, schema.relations, 'SWIMLANES', schema.entities);
    derivedViews.SWIMLANES = {
      name: 'Activity Swimlanes',
      icon: 'Share2',
      nodes: laidOutSwimNodes,
      groups: swimGroups,
      layoutInfo: computeLayoutInfo(laidOutSwimNodes)
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

    const getSequenceLabel = (pathNodeIds: string[], _startId: string): { label: string; dashed?: boolean } => {
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

      // Fallback: use the last structural entity on the path
      const lastNode = pathNodeIds[pathNodeIds.length - 1];
      if (lastNode && schema.entities[lastNode]) {
        return { label: schema.entities[lastNode].title, dashed: false };
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

    const laidOutSeqNodes = layoutNodes(seqNodes, schema.relations, 'SEQUENCE', schema.entities);
    derivedViews.SEQUENCE = {
      name: 'Sequence Diagram',
      icon: 'List',
      nodes: laidOutSeqNodes,
      groups: [],
      layoutInfo: computeLayoutInfo(laidOutSeqNodes)
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
      if (dfType && policyShouldMapToDecision(schema, id, type)) {
        const collapsedId = getCollapsedId(id);
        if (addedNodes.has(collapsedId)) return;
        addedNodes.add(collapsedId);

        dfNodes.push({
          id: collapsedId,
          grid: [esNode.grid ? esNode.grid[0] : 0, 0]
        });
      }
    });

    const getDataFlowLabel = (pathNodeIds: string[], startId: string): { label: string } => {
      const cmdNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.COMMAND);

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

      if (cmdNode) {
        const cmdTitle = schema.entities[cmdNode].title;
        if (dataObjectTitle && componentName) {
          return { label: `${cmdTitle} (${dataObjectTitle} in ${componentName})` };
        }
        if (dataObjectTitle) {
          return { label: `${cmdTitle} (${dataObjectTitle})` };
        }
        return { label: cmdTitle };
      }

      // Fallback: use data object and component info without command
      if (dataObjectTitle && componentName) {
        return { label: `${dataObjectTitle} in ${componentName}` };
      }
      if (dataObjectTitle) {
        return { label: dataObjectTitle };
      }
      if (componentName) {
        return { label: componentName };
      }

      // Last resort: use the last entity on the path
      const lastNode = pathNodeIds[pathNodeIds.length - 1];
      if (lastNode && schema.entities[lastNode]) {
        return { label: schema.entities[lastNode].title };
      }
      return { label: '' };
    };

   const dfRelations = deriveRelations(schema, 'DATA_FLOW', addedNodes, getDataFlowLabel);

    schema.relations = [
      ...schema.relations.filter(r => !r.views || !r.views.includes('DATA_FLOW')),
      ...dfRelations
    ];

    const laidOutDfNodes = layoutNodes(dfNodes, schema.relations, 'DATA_FLOW', schema.entities);
    derivedViews.DATA_FLOW = {
      name: 'Data Flow',
      icon: 'Share2',
      nodes: laidOutDfNodes,
      groups: [],
      layoutInfo: computeLayoutInfo(laidOutDfNodes)
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

   const laidOutSmNodes = layoutNodes(smNodes, smRelations, 'STATE_MACHINE', schema.entities);

    derivedViews.STATE_MACHINE = {
      name: 'State Machine',
      icon: 'Activity',
      nodes: laidOutSmNodes,
      groups: [],
      layoutInfo: computeLayoutInfo(laidOutSmNodes)
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
        if (mappedType && policyShouldMapToDecision(schema, nodeId, esType)) {
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
 * Check if an entity type is a "boundary" type (Actor/User or External API).
 * Boundary nodes represent system perimeter and should not have direct
 * structural relations in derived views unless explicitly connected in
 * the Event Storming source of truth.
 */
function isBoundaryType(entity: FlowchartEntity | undefined): boolean {
  const type = entity?.type || entity?.viewTypes?.EVENT_STORMING || '';
  return type === TYPES.USER || type === TYPES.EXTERNAL;
}

/**
 * Check if an entity type is structural (Aggregate, Service, Database, Policy).
 * These represent internal system components that mediate between boundaries.
 */
function isStructuralType(entity: FlowchartEntity | undefined): boolean {
  const type = entity?.type || entity?.viewTypes?.EVENT_STORMING || '';
  return type === TYPES.AGGREGATE || type === TYPES.SERVICE || type === TYPES.DATABASE || type === TYPES.POLICY;
}

/**
 * Traverses EVENT_STORMING relations to find paths between participant ids.
 * Filters out spurious edges between boundary types (User ↔ External) that
 * arise from BFS traversing through domain events/commands and hitting
 * direct structural shortcuts between unrelated participants.
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

    // BFS queue: { currentId, path, intermediateNodeIds }
    const queue: Array<{
      currentId: string;
      path: string[];
      intermediateNodeIds: string[];
    }> = startingInstanceIds.map(id => ({ currentId: id, path: [id], intermediateNodeIds: [] }));

    while (queue.length > 0) {
      const { currentId, path, intermediateNodeIds } = queue.shift()!;

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

            // Filter: reject spurious edges between boundary types (User ↔ External)
            // that are traced through intermediate nodes. Only allow direct ES relations
            // between boundaries. This prevents BFS from creating false structural
            // connectivity when domain events/commands pass through actor boundaries.
            const startEntity = schema.entities[collapsedStart];
            const endEntity = schema.entities[collapsedNext];
            const bothBoundary = isBoundaryType(startEntity) && isBoundaryType(endEntity);
            const hasIntermediates = intermediateNodeIds.length > 0 || pathNodeIds.length > 0;
            
            if (bothBoundary && hasIntermediates) {
              // Check if there's a direct ES relation between these two boundaries
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
          const nextIntermediates = isStructuralType(schema.entities[nextId])
            ? [...intermediateNodeIds, nextId]
            : intermediateNodeIds;
          queue.push({
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

/**
 * Graph layout algorithm to dynamically position nodes using DAG topological levels (columns)
 * and barycenter heuristics (rows) to minimize edge crossings.
 * Each view type has specific layout rules:
 * - EVENT_STORMING: DB/Aggregate/Timeline layering with auto-expanding timeline branches
 * - SYS_ARCH: Dynamic rows based on node count, User top, DB bottom
 * - SWIMLANES: One row per entity type
 * - DATA_FLOW: User on top, rest dynamic below
 * - SEQUENCE: Columns only, all nodes row 0
 * - STATE_MACHINE: Dynamic barycenter layout
 */
function layoutNodes(
  nodes: FlowchartViewNode[],
  relations: FlowchartRelation[],
  viewKey: string,
  entities: Record<string, FlowchartEntity> = {}
): FlowchartViewNode[] {
  if (nodes.length === 0) return [];

  const nodeIds = nodes.map(n => n.id);
  const nodeSet = new Set(nodeIds);

  const getRole = (id: string): 'db' | 'handler' | 'timeline' => {
    const entity = entities[id];
    const type = entity?.type || entity?.viewTypes?.EVENT_STORMING || 'default';
    if (type === TYPES.DATABASE) return 'db';
    if (type === TYPES.AGGREGATE || type === TYPES.EXTERNAL || type === TYPES.SERVICE) return 'handler';
    return 'timeline';
  };

  // ----------------------------------------------------
  // EVENT_STORMING: DB/Aggregate/Timeline layering
  // ----------------------------------------------------
  if (viewKey === 'EVENT_STORMING') {
    return layoutEventStorming(nodes, nodeIds, nodeSet, relations, viewKey, entities, getRole);
  }

  // ----------------------------------------------------
  // SEQUENCE: Columns only, all nodes row 0
  // ----------------------------------------------------
  if (viewKey === 'SEQUENCE') {
    return layoutSequence(nodes, nodeIds, nodeSet, relations, viewKey);
  }

  // ----------------------------------------------------
  // SYS_ARCH: Dynamic rows, User top, DB bottom
  // ----------------------------------------------------
  if (viewKey === 'SYS_ARCH') {
    return layoutSysArch(nodes, nodeIds, nodeSet, relations, viewKey, entities);
  }

  // ----------------------------------------------------
  // SWIMLANES: One row per entity type
  // ----------------------------------------------------
  if (viewKey === 'SWIMLANES') {
    return layoutSwimlanes(nodes, nodeIds, nodeSet, relations, viewKey, entities);
  }

  // ----------------------------------------------------
  // DATA_FLOW: User on top, rest dynamic below
  // ----------------------------------------------------
  if (viewKey === 'DATA_FLOW') {
    return layoutDataFlow(nodes, nodeIds, nodeSet, relations, viewKey, entities);
  }

  // ----------------------------------------------------
  // STATE_MACHINE & CUSTOM: General barycenter layout
  // ----------------------------------------------------
  return layoutGeneral(nodes, nodeIds, nodeSet, relations, viewKey);
}

// ----------------------------------------------------
// EVENT STORMING LAYOUT (preserves existing logic)
// ----------------------------------------------------
function layoutEventStorming(
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

// ----------------------------------------------------
// SYS_ARCH LAYOUT: Dynamic rows, User top, DB bottom
// ----------------------------------------------------
function layoutSysArch(
  nodes: FlowchartViewNode[],
  nodeIds: string[],
  nodeSet: Set<string>,
  relations: FlowchartRelation[],
  viewKey: string,
  entities: Record<string, FlowchartEntity>
): FlowchartViewNode[] {
  const adj = buildAdjacency(nodeIds, relations, viewKey, nodeSet);
  const inDegree = buildInDegree(nodeIds, relations, viewKey, nodeSet);

  const col = computeTopologicalColumns(nodeIds, inDegree, adj);

  const userNodes = nodeIds.filter(id => isType(entities, id, TYPES.USER));
  userNodes.forEach(id => col.set(id, 0));

  const colGroups = new Map<number, string[]>();
  col.forEach((c, id) => {
    if (!colGroups.has(c)) colGroups.set(c, []);
    colGroups.get(c)!.push(id);
  });
  const sortedCols = Array.from(colGroups.keys()).sort((a, b) => a - b);

 // Compute total nodes per category to determine global row ranges
  let totalUsers = 0, totalOther = 0;
  sortedCols.forEach(c => {
    const colNodes = colGroups.get(c) || [];
    totalUsers += colNodes.filter(id => isType(entities, id, TYPES.USER)).length;
    totalOther += colNodes.filter(id => !isType(entities, id, TYPES.USER) && !isType(entities, id, TYPES.DATABASE)).length;
  });

  // Dynamic row gap: spread nodes vertically based on total count to avoid crowding
  const gapPerCol = Math.max(1, Math.ceil(nodeIds.length / sortedCols.length / 3));

  const row = new Map<string, number>();
  const userOffset = 0;
  const otherOffset = totalUsers + gapPerCol;
  const dbOffset = otherOffset + totalOther + gapPerCol;

  sortedCols.forEach(c => {
    const colNodes = colGroups.get(c) || [];
    const userInCol = colNodes.filter(id => isType(entities, id, TYPES.USER));
    const dbInCol = colNodes.filter(id => isType(entities, id, TYPES.DATABASE));
    const otherInCol = colNodes.filter(id => !isType(entities, id, TYPES.USER) && !isType(entities, id, TYPES.DATABASE));

    userInCol.forEach((id, idx) => row.set(id, userOffset + idx));
    otherInCol.forEach((id, idx) => row.set(id, otherOffset + idx));
    dbInCol.forEach((id, idx) => row.set(id, dbOffset + idx));
  });

  const compactedCol = compactColumns(sortedCols, col);

  return nodes.map(n => ({
    ...n,
    grid: [compactedCol.get(n.id)!, row.get(n.id)!]
  }));
}

// ----------------------------------------------------
// SWIMLANES LAYOUT: One row per entity type
// ----------------------------------------------------
function layoutSwimlanes(
  nodes: FlowchartViewNode[],
  nodeIds: string[],
  nodeSet: Set<string>,
  relations: FlowchartRelation[],
  viewKey: string,
  entities: Record<string, FlowchartEntity>
): FlowchartViewNode[] {
  const adj = buildAdjacency(nodeIds, relations, viewKey, nodeSet);
  const inDegree = buildInDegree(nodeIds, relations, viewKey, nodeSet);

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
    const userInCol = colNodes.filter(id => isType(entities, id, TYPES.USER));
    const externalInCol = colNodes.filter(id => isType(entities, id, TYPES.EXTERNAL));
    const otherInCol = colNodes.filter(id => !isType(entities, id, TYPES.USER) && !isType(entities, id, TYPES.EXTERNAL));

    userInCol.forEach(id => row.set(id, 0));
    otherInCol.forEach((id, idx) => row.set(id, 1 + idx));
    const maxOtherRow = otherInCol.length > 0 ? 1 + otherInCol.length - 1 : 0;
    externalInCol.forEach((id, idx) => row.set(id, Math.max(maxOtherRow, 1) + 1 + idx));
  });

  const compactedCol = compactColumns(sortedCols, col);

  return nodes.map(n => ({
    ...n,
    grid: [compactedCol.get(n.id)!, row.get(n.id)!]
  }));
}

// ----------------------------------------------------
// DATA_FLOW LAYOUT: User on top, rest dynamic
// ----------------------------------------------------
function layoutDataFlow(
  nodes: FlowchartViewNode[],
  nodeIds: string[],
  nodeSet: Set<string>,
  relations: FlowchartRelation[],
  viewKey: string,
  entities: Record<string, FlowchartEntity>
): FlowchartViewNode[] {
  const adj = buildAdjacency(nodeIds, relations, viewKey, nodeSet);
  const inDegree = buildInDegree(nodeIds, relations, viewKey, nodeSet);

  const col = computeTopologicalColumns(nodeIds, inDegree, adj);

  const userNodes = nodeIds.filter(id => isType(entities, id, TYPES.USER));

  userNodes.forEach(id => col.set(id, 0));

  const colGroups = new Map<number, string[]>();
  col.forEach((c, id) => {
    if (!colGroups.has(c)) colGroups.set(c, []);
    colGroups.get(c)!.push(id);
  });
  const sortedCols = Array.from(colGroups.keys()).sort((a, b) => a - b);

  const row = new Map<string, number>();

  sortedCols.forEach(c => {
    const colNodes = colGroups.get(c) || [];
    const userInCol = colNodes.filter(id => isType(entities, id, TYPES.USER));
    const otherInCol = colNodes.filter(id => !isType(entities, id, TYPES.USER));

    userInCol.forEach((id, idx) => row.set(id, idx));
    const maxUserRow = userInCol.length > 0 ? userInCol.length - 1 : -1;
    otherInCol.forEach((id, idx) => row.set(id, maxUserRow + 1 + idx));
  });

  const compactedCol = compactColumns(sortedCols, col);

  return nodes.map(n => ({
    ...n,
    grid: [compactedCol.get(n.id)!, row.get(n.id)!]
  }));
}

// ----------------------------------------------------
// SEQUENCE LAYOUT: Columns only, all row 0
// ----------------------------------------------------
function layoutSequence(
  nodes: FlowchartViewNode[],
  nodeIds: string[],
  nodeSet: Set<string>,
  relations: FlowchartRelation[],
  viewKey: string
): FlowchartViewNode[] {
  const adj = buildAdjacency(nodeIds, relations, viewKey, nodeSet);
  const inDegree = buildInDegree(nodeIds, relations, viewKey, nodeSet);

  const col = computeTopologicalColumns(nodeIds, inDegree, adj);

  const compactedCol = new Map<string, number>();
  const colSet = new Set(col.values());
  const sortedCols = Array.from(colSet).sort((a, b) => a - b);
  col.forEach((c, id) => {
    compactedCol.set(id, sortedCols.indexOf(c));
  });

  return nodes.map(n => ({
    ...n,
    grid: [compactedCol.get(n.id)!, 0]
  }));
}

// ----------------------------------------------------
// GENERAL LAYOUT: Barycenter heuristic (STATE_MACHINE, custom)
// ----------------------------------------------------
function layoutGeneral(
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

// ----------------------------------------------------
// Shared helpers
// ----------------------------------------------------

function buildAdjacency(
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

function buildInDegree(
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

function buildIncoming(
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

function computeTopologicalColumns(
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

function compactColumns(
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

function isType(entities: Record<string, FlowchartEntity>, id: string, type: string): boolean {
  const entity = entities[id];
  return entity?.type === type || entity?.viewTypes?.EVENT_STORMING === type;
}

function computeLayoutInfo(nodes: FlowchartViewNode[]): LayoutInfo {
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
