import type { UnifiedFlowchartSchema } from '../types';
import { MASTER_MAPPING_MATRIX, TYPES } from '../types';
import { getEntityType, policyShouldMapToDecision, computeLayoutInfo } from './utils';
import { layoutEventStorming } from './event-storming';
import { deriveSysArch } from './sys-arch';
import { deriveSwimlanes } from './swimlanes';
import { deriveSequence } from './sequence';
import { deriveDataFlow } from './data-flow';
import { deriveStateMachine } from './state-machine';

export function autoDeriveViews(schema: UnifiedFlowchartSchema): UnifiedFlowchartSchema {
  let mutableEntities = { ...schema.entities };
  let mutableRelations = [...schema.relations];
  let mutableViews = { ...(schema.views || {}) };

  // Auto-generate EVENT_STORMING view from entities if not provided
  if (!mutableViews.EVENT_STORMING) {
    const entityIds = Object.keys(mutableEntities);
    mutableViews.EVENT_STORMING = {
      name: 'Event Storming',
      icon: 'Component',
      nodes: entityIds.map(id => ({ id })),
      groups: []
    };
  }

  if (mutableViews.EVENT_STORMING) {
    const view = mutableViews.EVENT_STORMING;
    const nodeSet = new Set(view.nodes.map(n => n.id));
    
    const getRole = (id: string): 'db' | 'handler' | 'timeline' => {
      const entity = mutableEntities[id];
      const type = entity?.type || entity?.viewTypes?.EVENT_STORMING || 'default';
      if (type === TYPES.DATABASE) return 'db';
      if (type === TYPES.AGGREGATE || type === TYPES.EXTERNAL || type === TYPES.SERVICE || type === TYPES.USER) return 'handler';
      return 'timeline';
    };

    const isCommand = (id: string): boolean => {
      const entity = mutableEntities[id];
      const type = entity?.type || entity?.viewTypes?.EVENT_STORMING || 'default';
      return type === TYPES.COMMAND;
    };

    const handlerToCommands = new Map<string, Set<string>>();
    const dbToHandlers = new Map<string, Set<string>>();

    mutableRelations.forEach(rel => {
      const isForES = !rel.views || rel.views.includes('EVENT_STORMING');
      if (!isForES) return;
      if (!nodeSet.has(rel.from) || !nodeSet.has(rel.to)) return;

      const fromRole = getRole(rel.from);
      const toRole = getRole(rel.to);
      const fromIsCmd = isCommand(rel.from);
      const toIsCmd = isCommand(rel.to);

      if (fromRole === 'handler' && toIsCmd) {
        if (!handlerToCommands.has(rel.from)) handlerToCommands.set(rel.from, new Set());
        handlerToCommands.get(rel.from)!.add(rel.to);
      }
      if (toRole === 'handler' && fromIsCmd) {
        if (!handlerToCommands.has(rel.to)) handlerToCommands.set(rel.to, new Set());
        handlerToCommands.get(rel.to)!.add(rel.from);
      }

      if (fromRole === 'db' && toRole === 'handler') {
        if (!dbToHandlers.has(rel.from)) dbToHandlers.set(rel.from, new Set());
        dbToHandlers.get(rel.from)!.add(rel.to);
      }
      if (toRole === 'db' && fromRole === 'handler') {
        if (!dbToHandlers.has(rel.to)) dbToHandlers.set(rel.to, new Set());
        dbToHandlers.get(rel.to)!.add(rel.from);
      }
    });

    const dbToCommands = new Map<string, Set<string>>();
    dbToHandlers.forEach((handlers, dbId) => {
      const cmds = new Set<string>();
      handlers.forEach(h => {
        const hCmds = handlerToCommands.get(h);
        if (hCmds) hCmds.forEach(c => cmds.add(c));
      });
      dbToCommands.set(dbId, cmds);
    });

    const replacements = new Map<string, Map<string, string>>();
    const duplicateNode = (originalId: string, cmdId: string) => {
      const dupId = `${originalId}_dup_${cmdId}`;
      if (!replacements.has(originalId)) replacements.set(originalId, new Map());
      replacements.get(originalId)!.set(cmdId, dupId);
      
      const originalEntity = mutableEntities[originalId];
      if (!mutableEntities[dupId]) {
        mutableEntities[dupId] = {
          ...originalEntity,
          collapsedTo: originalEntity.collapsedTo || originalId
        };
      }
      return dupId;
    };

    const newEsNodes: typeof view.nodes = [];
    view.nodes.forEach(n => {
      const id = n.id;
      const role = getRole(id);
      let cmds = new Set<string>();
      if (role === 'handler') cmds = handlerToCommands.get(id) || new Set();
      if (role === 'db') cmds = dbToCommands.get(id) || new Set();

      if (cmds.size > 1) {
        cmds.forEach(cmdId => {
          const dupId = duplicateNode(id, cmdId);
          newEsNodes.push({ ...n, id: dupId });
        });
      } else {
        newEsNodes.push(n);
      }
    });

    const rewiredRelations: typeof mutableRelations = [];
    mutableRelations.forEach(rel => {
      const isForES = !rel.views || rel.views.includes('EVENT_STORMING');
      if (!isForES || !nodeSet.has(rel.from) || !nodeSet.has(rel.to)) {
        rewiredRelations.push(rel);
        return;
      }

      const fromIsDuplicated = replacements.has(rel.from);
      const toIsDuplicated = replacements.has(rel.to);

      if (!fromIsDuplicated && !toIsDuplicated) {
        rewiredRelations.push(rel);
        return;
      }

      const fromCmds = fromIsDuplicated ? Array.from(replacements.get(rel.from)!.keys()) : [];
      const toCmds = toIsDuplicated ? Array.from(replacements.get(rel.to)!.keys()) : [];

      if (fromIsDuplicated && isCommand(rel.to)) {
        const dupId = replacements.get(rel.from)!.get(rel.to);
        if (dupId) {
          rewiredRelations.push({ ...rel, from: dupId });
          return;
        }
      }
      
      if (toIsDuplicated && isCommand(rel.from)) {
        const dupId = replacements.get(rel.to)!.get(rel.from);
        if (dupId) {
          rewiredRelations.push({ ...rel, to: dupId });
          return;
        }
      }

      if (fromIsDuplicated && toIsDuplicated) {
        const commonCmds = fromCmds.filter(c => toCmds.includes(c));
        commonCmds.forEach(cmd => {
          rewiredRelations.push({ 
            ...rel, 
            id: `${rel.id}_${cmd}`,
            from: replacements.get(rel.from)!.get(cmd)!,
            to: replacements.get(rel.to)!.get(cmd)!
          });
        });
        return;
      }

      if (fromIsDuplicated && !toIsDuplicated) {
        fromCmds.forEach(cmd => {
          rewiredRelations.push({
            ...rel,
            id: `${rel.id}_from_${cmd}`,
            from: replacements.get(rel.from)!.get(cmd)!
          });
        });
        return;
      }

      if (!fromIsDuplicated && toIsDuplicated) {
        toCmds.forEach(cmd => {
          rewiredRelations.push({
            ...rel,
            id: `${rel.id}_to_${cmd}`,
            to: replacements.get(rel.to)!.get(cmd)!
          });
        });
        return;
      }

      rewiredRelations.push(rel);
    });

    mutableRelations = rewiredRelations;
    mutableViews.EVENT_STORMING = {
      ...view,
      nodes: newEsNodes
    };
  }

  const laidOutViews = { ...mutableViews };

  Object.keys(laidOutViews).forEach(viewKey => {
    if (viewKey === 'SEQUENCE') return;
    const view = laidOutViews[viewKey];

    const nodeIds = view.nodes.map(n => n.id);
    const nodeSet = new Set(nodeIds);

    const getRole = (id: string): 'db' | 'handler' | 'timeline' => {
      const entity = mutableEntities[id];
      const type = entity?.type || entity?.viewTypes?.EVENT_STORMING || 'default';
      if (type === TYPES.DATABASE) return 'db';
      if (type === TYPES.AGGREGATE || type === TYPES.EXTERNAL || type === TYPES.SERVICE || type === TYPES.USER) return 'handler';
      return 'timeline';
    };

    let laidOutNodes = view.nodes;
    if (viewKey === 'EVENT_STORMING') {
      laidOutNodes = layoutEventStorming(view.nodes, nodeIds, nodeSet, mutableRelations, viewKey, mutableEntities, getRole);
    }

    let groups = view.groups;
    laidOutViews[viewKey] = {
      ...view,
      nodes: laidOutNodes,
      groups: groups,
      layoutInfo: computeLayoutInfo(laidOutNodes)
    };
  });

  let newSchema = {
    ...schema,
    entities: mutableEntities,
    relations: mutableRelations,
    views: laidOutViews
  };

  const viewKeys = Object.keys(newSchema.views);
  const hasOnlyEventStorming = viewKeys.length === 1 && viewKeys.includes('EVENT_STORMING');
  
  if (!hasOnlyEventStorming) {
    return newSchema;
  }

  const expandedEntities = { ...newSchema.entities };
  Object.entries(newSchema.entities).forEach(([canonicalId, entity]) => {
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

  // AUTOMATIC POLICY MERGING FOR DECISIONS
  const eventIds = Object.keys(expandedEntities).filter(id => getEntityType(expandedEntities[id]) === TYPES.EVENT);
  
  eventIds.forEach(eventId => {
    const outRels = newSchema.relations.filter(r => r.from === eventId && (!r.views || r.views.includes('EVENT_STORMING')));
    const policyRels = outRels.filter(r => getEntityType(expandedEntities[r.to]) === TYPES.POLICY);
    
    if (policyRels.length >= 2) {
      const decId = `dec_${eventId}`;
      expandedEntities[decId] = {
        title: 'Evaluate',
        desc: 'Decision point branching to multiple policies',
        type: TYPES.DECISION
      };
      
      policyRels.forEach(r => {
        const polId = r.to;
        expandedEntities[polId].collapsedTo = decId;
        expandedEntities[polId].branchLabel = r.label;
      });
    }
  });

  const updatedRelations = newSchema.relations.map(r => ({
    ...r,
    views: r.views || ['EVENT_STORMING']
  }));

  newSchema = {
    ...newSchema,
    relations: updatedRelations,
    entities: expandedEntities
  };

  const esView = newSchema.views.EVENT_STORMING;
  if (!esView) return newSchema;

  const derivedViews = { ...newSchema.views };

  const getESNode = (nodeId: string) => esView.nodes.find(n => n.id === nodeId);
  const getCollapsedId = (id: string) => newSchema.entities[id]?.collapsedTo || id;

  if (!derivedViews.SYS_ARCH) {
    const { nodes, groups, relations, layoutInfo } = deriveSysArch(newSchema, getCollapsedId, getESNode);
    newSchema.relations = relations;
    derivedViews.SYS_ARCH = {
      name: 'System Architecture',
      icon: 'Server',
      nodes,
      groups,
      layoutInfo
    };
  }

  if (!derivedViews.SWIMLANES) {
    const { nodes, groups, relations, layoutInfo } = deriveSwimlanes(newSchema, getCollapsedId, getESNode, esView.nodes);
    newSchema.relations = relations;
    derivedViews.SWIMLANES = {
      name: 'Activity Swimlanes',
      icon: 'Share2',
      nodes,
      groups,
      layoutInfo
    };
  }

  if (!derivedViews.SEQUENCE) {
    const { nodes, groups, relations, layoutInfo } = deriveSequence(newSchema, getCollapsedId, esView.nodes);
    newSchema.relations = relations;
    derivedViews.SEQUENCE = {
      name: 'Sequence Diagram',
      icon: 'List',
      nodes,
      groups,
      layoutInfo
    };
  }

  if (!derivedViews.DATA_FLOW) {
    const { nodes, groups, relations, layoutInfo } = deriveDataFlow(newSchema, getCollapsedId, getESNode);
    newSchema.relations = relations;
    derivedViews.DATA_FLOW = {
      name: 'Data Flow',
      icon: 'Share2',
      nodes,
      groups,
      layoutInfo
    };
  }

  if (!derivedViews.STATE_MACHINE) {
    const { nodes, groups, relations, layoutInfo } = deriveStateMachine(newSchema);
    newSchema.relations = relations;
    derivedViews.STATE_MACHINE = {
      name: 'State Machine',
      icon: 'Activity',
      nodes,
      groups,
      layoutInfo
    };
  }

  const finalEntities = { ...newSchema.entities };
  Object.keys(finalEntities).forEach(nodeId => {
    const entity = finalEntities[nodeId];
    const esType = getEntityType(entity);
    
    const derivedTypes: Record<string, string> = { EVENT_STORMING: esType };
    const mapping = MASTER_MAPPING_MATRIX[esType];
    if (mapping) {
      Object.entries(mapping).forEach(([vk, mappedType]) => {
        if (mappedType) {
          if (esType === TYPES.POLICY && (vk === 'SWIMLANES' || vk === 'DATA_FLOW')) {
            if (policyShouldMapToDecision(newSchema, nodeId, esType)) {
              derivedTypes[vk] = TYPES.DECISION;
            } else {
              derivedTypes[vk] = TYPES.PROCESS;
            }
          } else {
            derivedTypes[vk] = mappedType;
          }
        }
      });
    }

    finalEntities[nodeId] = {
      ...entity,
      viewTypes: {
        ...derivedTypes,
        ...(entity.viewTypes || {})
      }
    };
  });

  return {
    ...newSchema,
    entities: finalEntities,
    views: derivedViews
  };
}
