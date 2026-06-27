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

  // An alt/opt combined fragment is drawn whenever a single Event fans out to
  // multiple Policies (alternative reactions to the same fact). The Event is the
  // branch point; each downstream Policy chain is one alternative. With >= 2
  // Policies the fragment is an `alt` (mutually exclusive alternatives); a lone
  // optional Policy reaction would be an `opt`.
  const eventEntities = Object.entries(schema.entities).filter(
    ([, entity]) => getEntityType(entity) === TYPES.EVENT
  );

  eventEntities.forEach(([evtId, evtEntity]) => {
    // Policies triggered directly by this Event.
    const policyRels = schema.relations.filter(
      r =>
        (!r.views || r.views.includes('EVENT_STORMING')) &&
        getCollapsedId(r.from) === evtId &&
        getEntityType(schema.entities[getCollapsedId(r.to)]) === TYPES.POLICY
    );

    if (policyRels.length < 2) return;

    const fragmentKind = 'alt';

    // Bounded BFS: walk each alternative branch only until it produces its first
    // Event — the point where that alternative's outcome materialises (and, in a
    // cyclic flow, where it typically loops back upstream). Without this stop the
    // agent loop lets every branch reach almost every node, so all fragments would
    // span the whole diagram and stack on top of one another.
    const branchNodeIds = new Set<string>();
    const queue = policyRels.map(r => getCollapsedId(r.to));
    const visited = new Set<string>(queue);
    queue.forEach(id => branchNodeIds.add(id));

    while (queue.length > 0) {
      const curr = queue.shift()!;
      // Reaching an Event closes the branch: include it but do not expand past it.
      if (getEntityType(schema.entities[curr]) === TYPES.EVENT) continue;
      const out = schema.relations.filter(
        r => (!r.views || r.views.includes('EVENT_STORMING')) && getCollapsedId(r.from) === curr
      );
      out.forEach(r => {
        const toCollapsed = getCollapsedId(r.to);
        if (!visited.has(toCollapsed)) {
          visited.add(toCollapsed);
          branchNodeIds.add(toCollapsed);
          queue.push(toCollapsed);
        }
      });
    }

    // Chronological span of the branch = the ES order of its Command/Event nodes,
    // plus the branch-point Event itself so the box opens at the fork.
    const esRelIndexOf = (nodeId: string): number => {
      let idx = schema.relations.findIndex(
        r => (!r.views || r.views.includes('EVENT_STORMING')) && getCollapsedId(r.to) === nodeId
      );
      if (idx === -1) {
        idx = schema.relations.findIndex(
          r => (!r.views || r.views.includes('EVENT_STORMING')) && getCollapsedId(r.from) === nodeId
        );
      }
      return idx;
    };

    const branchChrono = Array.from(branchNodeIds)
      .filter(id => {
        const t = getEntityType(schema.entities[id]);
        return t === TYPES.COMMAND || t === TYPES.EVENT;
      })
      .map(esRelIndexOf)
      .filter(idx => idx !== -1);

    const evtChrono = esRelIndexOf(evtId);
    if (evtChrono !== -1) branchChrono.push(evtChrono);

    if (branchChrono.length === 0) return;
    const minChrono = Math.min(...branchChrono);
    const maxChrono = Math.max(...branchChrono);

    // Enclose only the sequence messages whose chronological slot falls inside the
    // branch span. Because combinedSeqRelations is already sorted by
    // chronologicalIndex, this selects a contiguous block and the box hugs just
    // this fork's alternative paths.
    const enclosedSeqRels = combinedSeqRelations.filter(r => {
      const c = r.chronologicalIndex;
      return typeof c === 'number' && c >= minChrono && c <= maxChrono;
    });

    if (enclosedSeqRels.length === 0) return;

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
      id: `seq_group_${evtId}`,
      title: `${fragmentKind}: ${evtEntity.title}`,
      nodeIds: Array.from(participantIds),
      y,
      h,
      color: 'color-mix(in srgb, var(--ctp-mauve) 5%, transparent)',
      borderColor: 'var(--ctp-mauve)',
      textColor: 'var(--ctp-mauve)'
    });
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
