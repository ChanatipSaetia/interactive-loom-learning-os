import type { UnifiedFlowchartSchema } from '../types';
import { MASTER_MAPPING_MATRIX, TYPES } from '../types';
import { getEntityType, policyShouldMapToDecision, countOutgoingRelations, countOutgoingPolicies, computeLayoutInfo } from './utils';
import { layoutEventStorming } from './event-storming';
import { deriveSysArch } from './sys-arch';
import { deriveSwimlanes } from './swimlanes';
import { deriveSequence } from './sequence';
import { deriveDataFlow } from './data-flow';
import { deriveStateMachine } from './state-machine';

import { buildCanonicalIdMapper } from '../abstract-flow/derive';

export function autoDeriveViews(schema: UnifiedFlowchartSchema): UnifiedFlowchartSchema {
  const mutableEntities = { ...schema.entities };
  const mutableRelations = [...schema.relations];
  const mutableViews = { ...(schema.views || {}) };

  // Auto-generate EVENT_STORMING view from entities if not provided
  if (!mutableViews.EVENT_STORMING) {
    const entityIds = Object.keys(mutableEntities);
    mutableViews.EVENT_STORMING = {
      name: 'Event Storming',
      icon: 'Component',
      nodes: entityIds.map(id => ({ id, root: mutableEntities[id]?.root })),
      groups: []
    };
  }

if (mutableViews.EVENT_STORMING) {
    // No duplication needed — each entity is its own node
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

    const groups = view.groups;
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

  const updatedRelations = newSchema.relations.map(r => ({
    ...r,
    views: r.views || ['EVENT_STORMING']
  }));

  newSchema = {
    ...newSchema,
    relations: updatedRelations,
  };

  const esView = newSchema.views.EVENT_STORMING;
  if (!esView) return newSchema;

  const derivedViews = { ...newSchema.views };

  const getESNode = (nodeId: string) => esView.nodes.find(n => n.id === nodeId);
  const getCollapsedId = buildCanonicalIdMapper(newSchema.entities);

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
            // In the activity view a Policy is a Decision only when it is itself a
            // genuine fork (>= 2 outgoing). Single-edge Policies fanned out from a
            // branching Event are represented by that Event's Decision instead.
            const isFork = vk === 'SWIMLANES'
              ? countOutgoingRelations(newSchema, nodeId) >= 2
              : policyShouldMapToDecision(newSchema, nodeId, esType);
            if (isFork) {
              derivedTypes[vk] = TYPES.DECISION;
            }
          } else {
            derivedTypes[vk] = mappedType;
          }
        }
      });

      // A branching Event (>= 2 outgoing Policies) becomes the Decision diamond in
      // the activity view, sitting in the lane of whoever produced the event.
      if (esType === TYPES.EVENT && countOutgoingPolicies(newSchema, nodeId) >= 2) {
        derivedTypes.SWIMLANES = TYPES.DECISION;
      }
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
