import type { UnifiedFlowchartSchema, FlowchartRelation, FlowchartViewNode, FlowchartViewGroup } from '../types';
import { TYPES, MASTER_MAPPING_MATRIX } from '../types';
import { getEntityType, deriveRelations, buildAdjacency, buildInDegree, computeTopologicalColumns, computeLayoutInfo } from './utils';

export function deriveSequence(
  schema: UnifiedFlowchartSchema,
  getCollapsedId: (id: string) => string,
  esViewNodes: FlowchartViewNode[]
) {
  const seqNodes: FlowchartViewNode[] = [];
  const localAddedNodes = new Set<string>();

  Object.entries(schema.entities).forEach(([id, entity]) => {
    const type = getEntityType(entity);
    const seqType = MASTER_MAPPING_MATRIX[type]?.SEQUENCE;
    if (seqType) {
      const collapsedId = getCollapsedId(id);
      localAddedNodes.add(collapsedId);
    }
  });

  const sortedParticipants = Array.from(localAddedNodes).sort((a, b) => {
    const esNodeA = esViewNodes.find(n => getCollapsedId(n.id) === a);
    const esNodeB = esViewNodes.find(n => getCollapsedId(n.id) === b);
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

    const lastNode = pathNodeIds[pathNodeIds.length - 1];
    if (lastNode && schema.entities[lastNode]) {
      return { label: schema.entities[lastNode].title, dashed: false };
    }
    return { label: '', dashed: false };
  };

  const seqRelations = deriveRelations(schema, 'SEQUENCE', localAddedNodes, getSequenceLabel);

  seqRelations.sort((a, b) => {
    const aIndex = schema.relations.findIndex(r => (!r.views || r.views.includes('EVENT_STORMING')) && getCollapsedId(r.from) === a.from);
    const bIndex = schema.relations.findIndex(r => (!r.views || r.views.includes('EVENT_STORMING')) && getCollapsedId(r.from) === b.from);
    return aIndex - bIndex;
  });

  const updatedRelations = [
    ...schema.relations.filter(r => !r.views || !r.views.includes('SEQUENCE')),
    ...seqRelations
  ];

  const seqGroups: FlowchartViewGroup[] = [];
  const policyEntities = Object.entries(schema.entities).filter(
    ([, entity]) => getEntityType(entity) === TYPES.POLICY
  );

  policyEntities.forEach(([polId, polEntity]) => {
    const esOutgoing = schema.relations.filter(
      r => (!r.views || r.views.includes('EVENT_STORMING')) && getCollapsedId(r.from) === polId
    );

    if (esOutgoing.length >= 2) {
      const downstreamNodeIds = new Set<string>();
      const queue = esOutgoing.map(r => getCollapsedId(r.to));
      queue.forEach(id => downstreamNodeIds.add(id));

      const visited = new Set<string>(queue);
      while (queue.length > 0) {
        const curr = queue.shift()!;
        const out = schema.relations.filter(
          r => (!r.views || r.views.includes('EVENT_STORMING')) && getCollapsedId(r.from) === curr
        );
        out.forEach(r => {
          const toCollapsed = getCollapsedId(r.to);
          if (!visited.has(toCollapsed)) {
            visited.add(toCollapsed);
            downstreamNodeIds.add(toCollapsed);
            queue.push(toCollapsed);
          }
        });
      }

      const enclosedSeqRels = seqRelations.filter(
        r => downstreamNodeIds.has(getCollapsedId(r.from)) || downstreamNodeIds.has(getCollapsedId(r.to))
      );

      if (enclosedSeqRels.length > 0) {
        const participantIds = new Set<string>();
        enclosedSeqRels.forEach(r => {
          participantIds.add(getCollapsedId(r.from));
          participantIds.add(getCollapsedId(r.to));
        });

        const relIndices = enclosedSeqRels.map(r => seqRelations.indexOf(r));
        const minRelIdx = Math.min(...relIndices);
        const maxRelIdx = Math.max(...relIndices);

        const msgStartY = 80;
        const msgSpacing = 48;
        const y = msgStartY + minRelIdx * msgSpacing - 18;
        const h = (maxRelIdx - minRelIdx + 1) * msgSpacing + 8;

        seqGroups.push({
          id: `seq_group_${polId}`,
          title: polEntity.title,
          nodeIds: Array.from(participantIds),
          y,
          h,
          color: 'color-mix(in srgb, var(--ctp-mauve) 5%, transparent)',
          borderColor: 'var(--ctp-mauve)',
          textColor: 'var(--ctp-mauve)'
        });
      }
    }
  });

  const nodeIds = seqNodes.map(n => n.id);
  const nodeSet = new Set(nodeIds);
  const laidOutSeqNodes = layoutSequence(seqNodes, nodeIds, nodeSet, updatedRelations, 'SEQUENCE');

  return {
    nodes: laidOutSeqNodes,
    groups: seqGroups,
    relations: updatedRelations,
    layoutInfo: computeLayoutInfo(laidOutSeqNodes)
  };
}

export function layoutSequence(
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
