import type { UnifiedFlowchartSchema, FlowchartRelation, FlowchartViewNode, FlowchartEntity } from '../types';
import { TYPES, MASTER_MAPPING_MATRIX } from '../types';
import { getEntityType, deriveRelations, buildCycleFreeGraph, computeTopologicalColumns, compactColumns, isType, computeLayoutInfo, countOutgoingPolicies, policyShouldMapToDecision } from './utils';

export function deriveDataFlow(
  schema: UnifiedFlowchartSchema,
  getCollapsedId: (id: string) => string,
  getESNode: (id: string) => FlowchartViewNode | undefined
) {
  const dfNodes: FlowchartViewNode[] = [];
  const localAddedNodes = new Set<string>();

  Object.entries(schema.entities).forEach(([id, entity]) => {
    const type = getEntityType(entity);
    const esNode = getESNode(id);
    if (!esNode) return;

    // Exclude POLICY nodes from data flow unless they are branching (represent decisions).
    if (type === TYPES.POLICY && !policyShouldMapToDecision(schema, id, type)) return;

    // Keep branching Events (>= 2 outgoing Policies) as Decision nodes.
    if (type === TYPES.EVENT && countOutgoingPolicies(schema, id) >= 2) {
      const collapsedId = getCollapsedId(id);
      if (!localAddedNodes.has(collapsedId)) {
        localAddedNodes.add(collapsedId);
        dfNodes.push({
          id: collapsedId,
          grid: [esNode.grid ? esNode.grid[0] : 0, 0]
        });
      }
      return;
    }

    const dfType = MASTER_MAPPING_MATRIX[type]?.DATA_FLOW;
    if (dfType) {
      const collapsedId = getCollapsedId(id);
      if (localAddedNodes.has(collapsedId)) return;
      localAddedNodes.add(collapsedId);

      dfNodes.push({
        id: collapsedId,
        grid: [esNode.grid ? esNode.grid[0] : 0, 0]
      });
    }
  });

  const getDataFlowLabel = (pathNodeIds: string[], startInstanceId: string): { label: string } => {
    const startInstanceEntity = schema.entities[startInstanceId];
    if (startInstanceEntity?.branchLabel) {
      return { label: startInstanceEntity.branchLabel };
    }

    const cmdNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.COMMAND);

    let dataObjectTitle = '';
    const startEntity = schema.entities[getCollapsedId(startInstanceId)];
    if (startEntity && getEntityType(startEntity) === TYPES.EVENT) {
      dataObjectTitle = startEntity.viewTitles?.DATA_FLOW || startEntity.title;
    } else {
      const evtNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.EVENT);
      if (evtNode) {
        const evtEntity = schema.entities[evtNode];
        dataObjectTitle = evtEntity.viewTitles?.DATA_FLOW || evtEntity.title;
      }
    }

    let componentName = '';
    const compNode = pathNodeIds.find(id => {
      const type = getEntityType(schema.entities[id]);
      return type === TYPES.AGGREGATE || type === TYPES.SERVICE || type === TYPES.DATABASE || type === TYPES.EXTERNAL;
    });

    if (compNode) {
      componentName = schema.entities[compNode].title;
      const type = getEntityType(schema.entities[compNode]);
      let typeLabel = 'aggregate';
      if (type === TYPES.DATABASE) typeLabel = 'db';
      else if (type === TYPES.SERVICE) typeLabel = 'service';
      else if (type === TYPES.EXTERNAL) typeLabel = 'external';
      componentName = `${componentName} [${typeLabel}]`;
    }

    if (cmdNode) {
      return { label: schema.entities[cmdNode].title };
    }

    if (dataObjectTitle) {
      return { label: dataObjectTitle };
    }
    if (componentName) {
      return { label: componentName };
    }

    const lastNode = pathNodeIds[pathNodeIds.length - 1];
    if (lastNode && schema.entities[lastNode]) {
      return { label: schema.entities[lastNode].title };
    }
    return { label: '' };
  };

  const dfRelations = deriveRelations(schema, 'DATA_FLOW', localAddedNodes, getDataFlowLabel);

  // When multiple edges exist between the same pair of nodes, keep only the one
  // that goes through an aggregate (its label contains "[aggregate]", "[db]", or "[external]").
  const dedupedDfRelations = dfRelations.filter(rel => {
    const hasComponent = rel.label && /\[(aggregate|service|db|external)\]/.test(rel.label);
    if (hasComponent) return true;

    // Check if another relation between the same pair exists with a component.
    const dominated = dfRelations.some(other =>
      other !== rel &&
      other.from === rel.from &&
      other.to === rel.to &&
      other.label && /\[(aggregate|service|db|external)\]/.test(other.label)
    );
    return !dominated;
  });

  const updatedRelations = [
    ...schema.relations.filter(r => !r.views || !r.views.includes('DATA_FLOW')),
    ...dedupedDfRelations
  ];

  const nodeIds = dfNodes.map(n => n.id);
  const nodeSet = new Set(nodeIds);
  const laidOutDfNodes = layoutDataFlow(dfNodes, nodeIds, nodeSet, updatedRelations, 'DATA_FLOW', schema.entities);

  return {
    nodes: laidOutDfNodes,
    groups: [],
    relations: updatedRelations,
    layoutInfo: computeLayoutInfo(laidOutDfNodes)
  };
}

export function layoutDataFlow(
  nodes: FlowchartViewNode[],
  nodeIds: string[],
  nodeSet: Set<string>,
  relations: FlowchartRelation[],
  viewKey: string,
  entities: Record<string, FlowchartEntity>
): FlowchartViewNode[] {
  const { adj, inDegree } = buildCycleFreeGraph(nodeIds, relations, viewKey, nodeSet);
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

    const dataFlowGap = 1;
    userInCol.forEach((id, idx) => row.set(id, idx));
    const maxUserRow = userInCol.length > 0 ? userInCol.length - 1 : -1;
    otherInCol.forEach((id, idx) => row.set(id, maxUserRow + dataFlowGap + idx));
  });

  const compactedCol = compactColumns(sortedCols, col);
  const spacedCol = new Map<string, number>();
  compactedCol.forEach((val, key) => {
    spacedCol.set(key, val * 2);
  });

  return nodes.map(n => ({
    ...n,
    grid: [spacedCol.get(n.id)!, row.get(n.id)!]
  }));
}
