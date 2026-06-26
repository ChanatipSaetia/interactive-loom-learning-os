import type { UnifiedFlowchartSchema, FlowchartRelation, FlowchartViewNode, FlowchartViewGroup } from '../types';
import { TYPES, MASTER_MAPPING_MATRIX } from '../types';
import { getEntityType, deriveRelations, computeLayoutInfo } from './utils';

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

  const getSequenceLabel = (pathNodeIds: string[], startId: string): { label: string; dashed?: boolean } => {
    const collapsedStart = getCollapsedId(startId);

    // Find all events on this path and turn them into self-loops on the sender participant!
    pathNodeIds.forEach(id => {
      const entity = schema.entities[id];
      if (entity && getEntityType(entity) === TYPES.EVENT) {
        const loopKey = `${collapsedStart}-${id}`;
        if (!visitedSelfLoops.has(loopKey)) {
          visitedSelfLoops.add(loopKey);
          let chronologicalIndex = schema.relations.findIndex(r => 
            (!r.views || r.views.includes('EVENT_STORMING')) && 
            r.to === id
          );
          if (chronologicalIndex === -1) {
            chronologicalIndex = schema.relations.findIndex(r => 
              (!r.views || r.views.includes('EVENT_STORMING')) && 
              r.from === id
            );
          }
          selfLoops.push({
            id: `derived_sequence_self_${collapsedStart}_${id}_${selfLoops.length}`,
            from: collapsedStart,
            to: collapsedStart,
            views: ['SEQUENCE'],
            label: entity.title,
            dashed: true,
            chronologicalIndex: chronologicalIndex !== -1 ? chronologicalIndex : 999
          });
        }
      }
    });

    const evtNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.EVENT);
    const cmdNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.COMMAND);

    if (evtNode && cmdNode) {
      // Don't combine them! The event is already a self-loop. Only return the command title.
      return {
        label: schema.entities[cmdNode].title,
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

  const danglingPaths: Array<{ startId: string; pathNodeIds: string[] }> = [];
  const selfLoops: FlowchartRelation[] = [];
  const visitedSelfLoops = new Set<string>();

  const seqRelations = deriveRelations(
    schema,
    'SEQUENCE',
    localAddedNodes,
    (pathNodeIds, startId) => getSequenceLabel(pathNodeIds, startId),
    (pathNodeIds, startId) => {
      danglingPaths.push({ startId, pathNodeIds });
    }
  );

  if (danglingPaths.length > 0) {
    const coreSysId = 'sys_core';
    if (!localAddedNodes.has(coreSysId)) {
      localAddedNodes.add(coreSysId);
      if (!schema.entities[coreSysId]) {
        schema.entities[coreSysId] = {
          title: 'Core System',
          desc: 'Central coordination and core routing engine.',
          type: TYPES.CORE_SYSTEM
        };
      }
    }

    danglingPaths.forEach(({ startId, pathNodeIds }) => {
      const collapsedStart = getCollapsedId(startId);
      const { label, dashed } = getSequenceLabel(pathNodeIds, startId);
      if (label) {
        let chronologicalIndex = 999;
        const labelNodeId = pathNodeIds.find(id => {
          const type = getEntityType(schema.entities[id]);
          return type === TYPES.COMMAND || type === TYPES.EVENT;
        }) || pathNodeIds[pathNodeIds.length - 1];

        if (labelNodeId) {
          let relIdx = schema.relations.findIndex(r => 
            (!r.views || r.views.includes('EVENT_STORMING')) && 
            r.to === labelNodeId
          );
          if (relIdx === -1) {
            relIdx = schema.relations.findIndex(r => 
              (!r.views || r.views.includes('EVENT_STORMING')) && 
              r.from === labelNodeId
            );
          }
          if (relIdx !== -1) {
            chronologicalIndex = relIdx;
          }
        }

        seqRelations.push({
          id: `derived_sequence_rel_${collapsedStart}_${coreSysId}_${seqRelations.length}`,
          from: collapsedStart,
          to: coreSysId,
          views: ['SEQUENCE'],
          label,
          dashed,
          chronologicalIndex
        });
      }
    });
  }

  const sortedParticipants = Array.from(localAddedNodes)
    .filter(id => id !== 'sys_core')
    .sort((a, b) => {
      const esNodeA = esViewNodes.find(n => getCollapsedId(n.id) === a);
      const esNodeB = esViewNodes.find(n => getCollapsedId(n.id) === b);
      const colA = esNodeA?.grid?.[0] ?? 0;
      const colB = esNodeB?.grid?.[0] ?? 0;
      return colA - colB;
    });

  if (localAddedNodes.has('sys_core')) {
    const devUserIndex = sortedParticipants.findIndex(id => schema.entities[id]?.type === TYPES.USER);
    const insertIndex = devUserIndex !== -1 ? devUserIndex + 1 : 1;
    sortedParticipants.splice(insertIndex, 0, 'sys_core');
  }

  sortedParticipants.forEach((id, colIdx) => {
    seqNodes.push({
      id,
      grid: [colIdx, 0]
    });
  });

  const combinedSeqRelations = [
    ...seqRelations,
    ...selfLoops
  ];

  combinedSeqRelations.sort((a, b) => {
    const aIdx = a.chronologicalIndex ?? 999;
    const bIdx = b.chronologicalIndex ?? 999;
    if (aIdx !== bIdx) return aIdx - bIdx;
    
    // Tie-breaker: put self loops first
    const aIsSelf = a.from === a.to;
    const bIsSelf = b.from === b.to;
    if (aIsSelf && !bIsSelf) return -1;
    if (!aIsSelf && bIsSelf) return 1;
    return 0;
  });

  const updatedRelations = [
    ...schema.relations.filter(r => !r.views || !r.views.includes('SEQUENCE')),
    ...combinedSeqRelations
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

      const enclosedSeqRels = combinedSeqRelations.filter(
        r => downstreamNodeIds.has(getCollapsedId(r.from)) || downstreamNodeIds.has(getCollapsedId(r.to))
      );

      if (enclosedSeqRels.length > 0) {
        const participantIds = new Set<string>();
        enclosedSeqRels.forEach(r => {
          participantIds.add(getCollapsedId(r.from));
          participantIds.add(getCollapsedId(r.to));
        });

        const relIndices = enclosedSeqRels.map(r => combinedSeqRelations.indexOf(r));
        const minRelIdx = Math.min(...relIndices);
        const maxRelIdx = Math.max(...relIndices);

        const msgStartY = 132;
        const msgSpacing = 40;
        const y = msgStartY + minRelIdx * msgSpacing - 12;
        const h = (maxRelIdx - minRelIdx + 1) * msgSpacing + 24;

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
  _nodeIds: string[],
  _nodeSet: Set<string>,
  _relations: FlowchartRelation[],
  _viewKey: string
): FlowchartViewNode[] {
  return nodes;
}
