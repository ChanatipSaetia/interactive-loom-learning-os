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
  const laidOutViews = { ...schema.views };

  Object.keys(laidOutViews).forEach(viewKey => {
    if (viewKey === 'SEQUENCE') return;
    const view = laidOutViews[viewKey];

    const nodeIds = view.nodes.map(n => n.id);
    const nodeSet = new Set(nodeIds);

    const getRole = (id: string): 'db' | 'handler' | 'timeline' => {
      const entity = schema.entities[id];
      const type = entity?.type || entity?.viewTypes?.EVENT_STORMING || 'default';
      if (type === TYPES.DATABASE) return 'db';
      if (type === TYPES.AGGREGATE || type === TYPES.EXTERNAL || type === TYPES.SERVICE) return 'handler';
      return 'timeline';
    };

    let laidOutNodes = view.nodes;
    if (viewKey === 'EVENT_STORMING') {
      laidOutNodes = layoutEventStorming(view.nodes, nodeIds, nodeSet, schema.relations, viewKey, schema.entities, getRole);
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
        if (mappedType && policyShouldMapToDecision(newSchema, nodeId, esType)) {
          derivedTypes[vk] = mappedType;
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
