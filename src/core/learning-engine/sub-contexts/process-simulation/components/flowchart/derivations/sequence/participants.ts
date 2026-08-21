import type { UnifiedFlowchartSchema, FlowchartViewNode } from '../../types';
import { TYPES, MASTER_MAPPING_MATRIX } from '../../types';
import { getEntityType } from '../utils';

/**
 * Finds target participant columns handling events.
 */
export function findTargetParticipant(
  schema: UnifiedFlowchartSchema,
  evtId: string,
  getCollapsedId: (id: string) => string
): string[] {
  const targets = new Set<string>();
  const policyRels = schema.relations.filter(r =>
    (!r.views || r.views.includes('EVENT_STORMING')) &&
    r.from === evtId &&
    getEntityType(schema.entities[r.to]) === TYPES.POLICY
  );

  for (const pr of policyRels) {
    const polId = pr.to;
    const cmdRels = schema.relations.filter(r =>
      (!r.views || r.views.includes('EVENT_STORMING')) &&
      r.from === polId &&
      getEntityType(schema.entities[r.to]) === TYPES.COMMAND
    );

    for (const cr of cmdRels) {
      const cmdId = cr.to;
      const handledByRel = schema.relations.find(r =>
        (!r.views || r.views.includes('EVENT_STORMING')) &&
        r.from === cmdId && r.handledBy
      );
      if (handledByRel) {
        targets.add(getCollapsedId(handledByRel.to));
      }
    }

    const actorRels = schema.relations.filter(r =>
      (!r.views || r.views.includes('EVENT_STORMING')) &&
      r.from === polId &&
      getEntityType(schema.entities[r.to]) === TYPES.USER
    );
    for (const ar of actorRels) {
      targets.add(getCollapsedId(ar.to));
    }
  }

  return Array.from(targets);
}

/**
 * Extracts and sorts sequence participant column nodes.
 */
export function deriveParticipants(
  schema: UnifiedFlowchartSchema,
  esViewNodes: FlowchartViewNode[],
  getCollapsedId: (id: string) => string
): { seqNodes: FlowchartViewNode[]; localAddedNodes: Set<string> } {
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

  const sortedParticipants = Array.from(localAddedNodes)
    .sort((a, b) => {
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

  return { seqNodes, localAddedNodes };
}
