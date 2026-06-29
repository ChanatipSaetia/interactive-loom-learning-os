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

     // Find events and commands on this path and create self-loops on the participant
    // that handles them (the AGGREGATE), not every participant whose path touches them.
    pathNodeIds.forEach(id => {
      const entity = schema.entities[id];
      const entityType = getEntityType(entity);

      if (entityType === TYPES.EVENT) {
        // Find the AGGREGATE that produces this event (preferred over COMMAND).
        const aggRel = schema.relations.find(r =>
          (!r.views || r.views.includes('EVENT_STORMING')) &&
          r.to === id && !r.handledBy &&
          getEntityType(schema.entities[r.from]) === TYPES.AGGREGATE
        );
        const cmdRel = schema.relations.find(r =>
          (!r.views || r.views.includes('EVENT_STORMING')) &&
          r.to === id && !r.handledBy &&
          getEntityType(schema.entities[r.from]) === TYPES.COMMAND
        );
        const producingParticipant = aggRel
          ? getCollapsedId(aggRel.from)
          : (cmdRel ? getCollapsedId(cmdRel.from) : collapsedStart);

        const loopKey = `${producingParticipant}-${id}`;
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
            id: `derived_sequence_self_${producingParticipant}_${id}_${selfLoops.length}`,
            from: producingParticipant,
            to: producingParticipant,
            views: ['SEQUENCE'],
            label: entity.title,
            dashed: true,
            chronologicalIndex: chronologicalIndex !== -1 ? chronologicalIndex : 999
          });
        }
      }

      if (entityType === TYPES.COMMAND) {
        // If a COMMAND is handled by an AGGREGATE, self-loop on that AGGREGATE
        // (same participant executes the command internally).
        const handledByRel = schema.relations.find(r =>
          (!r.views || r.views.includes('EVENT_STORMING')) &&
          r.from === id && r.handledBy &&
          getEntityType(schema.entities[r.to]) === TYPES.AGGREGATE
        );
        if (!handledByRel) return;

        const handlingParticipant = getCollapsedId(handledByRel.to);
        const loopKey = `${handlingParticipant}-${id}`;
        if (!visitedSelfLoops.has(loopKey)) {
          visitedSelfLoops.add(loopKey);
          let chronologicalIndex = schema.relations.findIndex(r =>
            (!r.views || r.views.includes('EVENT_STORMING')) &&
            r.from === id
          );
          if (chronologicalIndex === -1) {
            chronologicalIndex = schema.relations.findIndex(r =>
              (!r.views || r.views.includes('EVENT_STORMING')) &&
              r.to === id
            );
          }
          selfLoops.push({
            id: `derived_sequence_self_${handlingParticipant}_${id}_${selfLoops.length}`,
            from: handlingParticipant,
            to: handlingParticipant,
            views: ['SEQUENCE'],
            label: entity.title,
            dashed: false,
            chronologicalIndex: chronologicalIndex !== -1 ? chronologicalIndex : 999
          });
        }
      }
    });

   const evtNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.EVENT);
    const cmdNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.COMMAND);

    // Determine the destination participant from the path.
    const lastPathNode = pathNodeIds[pathNodeIds.length - 1];
    const destParticipant = lastPathNode ? getCollapsedId(lastPathNode) : collapsedStart;

    const cmdIsHandledByDest = (cmdId: string, dest: string) => {
      // Check if this command is handled by the destination AGGREGATE (via handledBy relation).
      const handledByRel = schema.relations.find(r =>
        (!r.views || r.views.includes('EVENT_STORMING')) &&
        r.from === cmdId && r.handledBy &&
        getEntityType(schema.entities[r.to]) === TYPES.AGGREGATE &&
        getCollapsedId(r.to) === dest
      );
      return !!handledByRel;
    };

    if (evtNode && cmdNode) {
      // Don't combine them! The event is already a self-loop.
      // If the command is handled by the destination AGGREGATE, it's a self-loop there,
      // so skip the inter-participant message.
      if (!cmdIsHandledByDest(cmdNode, destParticipant)) {
        return {
          label: schema.entities[cmdNode].title,
          dashed: false
        };
      }
      return { label: '', dashed: false };
    }
    if (evtNode) {
      return { label: schema.entities[evtNode].title, dashed: true };
    }
    if (cmdNode) {
      // If the command is handled by the destination AGGREGATE, skip the inter-participant message.
      if (cmdIsHandledByDest(cmdNode, destParticipant)) return { label: '', dashed: false };
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

  // Replace BFS command-labeled edges with explicit initiator→handler edges.
  // The BFS uses the first COMMAND on each path as the label, which produces
  // spurious edges (e.g. rider→engine labelled "throttle" when "intake" is
  // the command handled by engine). Instead, for every COMMAND with a
  // handledBy relation, explicitly create an edge from the participant that
  // initiates the command to the AGGREGATE that handles it.
  const cmdHandledByMap = new Map<string, { handler: string; title: string; rel: FlowchartRelation }>();
  schema.relations
    .filter(r =>
      (!r.views || r.views.includes('EVENT_STORMING')) &&
      r.handledBy &&
      getEntityType(schema.entities[r.from]) === TYPES.COMMAND &&
      getEntityType(schema.entities[r.to]) === TYPES.AGGREGATE
    )
    .forEach(r => {
      cmdHandledByMap.set(r.from, {
        handler: getCollapsedId(r.to),
        title: schema.entities[r.from].title,
        rel: r
      });
    });

  const cmdTitles = new Set(Array.from(cmdHandledByMap.values()).map(v => v.title));

  const findInitiator = (cmdId: string): string | null => {
    const direct = schema.relations.find(r =>
      (!r.views || r.views.includes('EVENT_STORMING')) &&
      r.to === cmdId &&
      (getEntityType(schema.entities[r.from]) === TYPES.USER ||
       getEntityType(schema.entities[r.from]) === TYPES.AGGREGATE ||
       getEntityType(schema.entities[r.from]) === TYPES.EXTERNAL ||
       getEntityType(schema.entities[r.from]) === TYPES.DATABASE)
    );
    if (direct) return getCollapsedId(direct.from);

    const policies = schema.relations.filter(r =>
      (!r.views || r.views.includes('EVENT_STORMING')) &&
      r.to === cmdId && getEntityType(schema.entities[r.from]) === TYPES.POLICY
    );
    for (const pr of policies) {
      const events = schema.relations.filter(r =>
        (!r.views || r.views.includes('EVENT_STORMING')) &&
        r.to === pr.from && getEntityType(schema.entities[r.from]) === TYPES.EVENT
      );
      for (const er of events) {
        const evtCollapsed = getCollapsedId(er.from);
        const fromParticipant = schema.relations.find(r =>
          (!r.views || r.views.includes('EVENT_STORMING')) &&
          r.from === evtCollapsed &&
          (getEntityType(schema.entities[r.from]) === TYPES.USER ||
           getEntityType(schema.entities[r.from]) === TYPES.AGGREGATE ||
           getEntityType(schema.entities[r.from]) === TYPES.EXTERNAL ||
           getEntityType(schema.entities[r.from]) === TYPES.DATABASE)
        );
        if (fromParticipant) return getCollapsedId(fromParticipant.from);

        const toParticipant = schema.relations.find(r =>
          (!r.views || r.views.includes('EVENT_STORMING')) &&
          r.to === evtCollapsed &&
          (getEntityType(schema.entities[r.from]) === TYPES.USER ||
           getEntityType(schema.entities[r.from]) === TYPES.AGGREGATE ||
           getEntityType(schema.entities[r.from]) === TYPES.EXTERNAL ||
           getEntityType(schema.entities[r.from]) === TYPES.DATABASE)
        );
        if (toParticipant) return getCollapsedId(toParticipant.from);
      }
    }
    return null;
  };

  // Classify each handled command as either dispatched (initiator ≠ handler →
  // shown as a single inter-participant arrow) or self-handled (initiator ===
  // handler → shown as a command self-loop on that aggregate).
  const explicitCmdEdges: FlowchartRelation[] = [];
  const selfHandledCmdTitles = new Set<string>();
  for (const [cmdId, { handler, title, rel }] of cmdHandledByMap) {
    const initiator = findInitiator(cmdId);
    if (!initiator) continue;
    if (initiator === handler) {
      // Self-handled: keep the command self-loop (created by getSequenceLabel).
      selfHandledCmdTitles.add(title);
      continue;
    }
    // Dispatched: emit a single inter-participant arrow initiator→handler.
    explicitCmdEdges.push({
      id: `derived_seq_cmd_${cmdId}`,
      from: initiator,
      to: handler,
      views: ['SEQUENCE'],
      label: title,
      dashed: false,
      chronologicalIndex: schema.relations.indexOf(rel)
    });
  }

  const nonCmdAndEventLoops = combinedSeqRelations.filter(r => {
    // Drop empty-label inter-participant edges (getSequenceLabel returns '' when a
    // command is handled by the destination); keep empty-label self-loops if any.
    if (!r.label) return r.from === r.to;
    if (!cmdTitles.has(r.label)) return true;
    // Command-labelled edge. Keep only the self-loop for a self-handled command;
    // drop everything else (BFS inter-participant edges and the redundant
    // self-loop of a dispatched command). explicitCmdEdges supplies the dispatch.
    return r.from === r.to && selfHandledCmdTitles.has(r.label);
  });

  const filteredRelations = [
    ...nonCmdAndEventLoops,
    ...explicitCmdEdges
  ];

  filteredRelations.sort((a, b) => {
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
    ...filteredRelations
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
    // branch span. Because filteredRelations is already sorted by
    // chronologicalIndex, this selects a contiguous block and the box hugs just
    // this fork's alternative paths.
    const enclosedSeqRels = filteredRelations.filter(r => {
      const c = r.chronologicalIndex;
      return typeof c === 'number' && c >= minChrono && c <= maxChrono;
    });

    if (enclosedSeqRels.length === 0) return;

    const participantIds = new Set<string>();
    enclosedSeqRels.forEach(r => {
      participantIds.add(getCollapsedId(r.from));
      participantIds.add(getCollapsedId(r.to));
    });

    const relIndices = enclosedSeqRels.map(r => filteredRelations.indexOf(r));
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
