import type { UnifiedFlowchartSchema, FlowchartRelation, FlowchartViewNode } from '../../types';
import { TYPES } from '../../types';
import { getEntityType, computeLayoutInfo } from '../utils';
import { deriveParticipants, findTargetParticipant } from './participants';
import { findCommandInitiator } from './commands';
import { buildAltGroupRegistry } from './alt-groups';

const MSG_START_Y = 160;
const MSG_SPACING = 44;

export function deriveSequence(
  schema: UnifiedFlowchartSchema,
  getCollapsedId: (id: string) => string,
  esViewNodes: FlowchartViewNode[]
) {
  const { seqNodes } = deriveParticipants(schema, esViewNodes, getCollapsedId);
  const altRegistry = buildAltGroupRegistry(schema, getCollapsedId);

  const orderedRelations: FlowchartRelation[] = [];

  const emit = (rel: Omit<FlowchartRelation, 'seqIndex'>) => {
    const seqIdx = orderedRelations.length;
    const full: FlowchartRelation = { ...rel, seqIndex: seqIdx };
    orderedRelations.push(full);
    altRegistry.register(full, seqIdx);
  };

  // ── Single linear scan over schema.relations in declaration order ──────────
  // One message per Command (handledBy) + one message per produced Event.
  // No BFS, no participant-pair deduplication, no secondary passes.
  schema.relations.forEach((r, idx) => {
    if (r.views && !r.views.includes('EVENT_STORMING')) return;

    const fromType = getEntityType(schema.entities[r.from]);
    const toType   = getEntityType(schema.entities[r.to]);

    // ── Command dispatched to an Aggregate (handledBy) → solid arrow ──────
    if (fromType === TYPES.COMMAND && r.handledBy && toType === TYPES.AGGREGATE) {
      const handler  = getCollapsedId(r.to);
      const initiator = findCommandInitiator(schema, r.from, getCollapsedId);
      const from = (!initiator || initiator === handler) ? handler : initiator;

      emit({
        id: `seq_cmd_${idx}`,
        from,
        to: handler,
        views: ['SEQUENCE'],
        label: schema.entities[r.from]?.title ?? '',
        dashed: false,
        chronologicalIndex: idx,
      });
    }

    // ── Event produced by a Command or Aggregate → dashed arrow ───────────
    if (toType === TYPES.EVENT &&
        (fromType === TYPES.COMMAND || fromType === TYPES.AGGREGATE)) {
      const eventEntity = schema.entities[r.to];

      // Find which participant produces this event
      let producer: string;
      if (fromType === TYPES.COMMAND) {
        const handledByRel = schema.relations.find(hbr =>
          (!hbr.views || hbr.views.includes('EVENT_STORMING')) &&
          hbr.from === r.from && hbr.handledBy
        );
        producer = handledByRel
          ? getCollapsedId(handledByRel.to)
          : getCollapsedId(r.from);
      } else {
        producer = getCollapsedId(r.from);
      }

      // Find which downstream participant receives this event (via policy chain)
      const targets = findTargetParticipant(schema, r.to, getCollapsedId);
      const target = targets.length > 0 ? targets[0] : producer;

      emit({
        id: `seq_evt_${idx}`,
        from: producer,
        to: target,
        views: ['SEQUENCE'],
        label: eventEntity?.title ?? '',
        dashed: true,
        chronologicalIndex: idx,
      });
    }
  });

  // ── Resolve alt groups: sets yOffset on orderedRelations, returns seqGroups ─
  const seqGroups = altRegistry.resolve(orderedRelations, MSG_START_Y, MSG_SPACING);

  const updatedRelations = [
    ...schema.relations.filter(r => !r.views || !r.views.includes('SEQUENCE')),
    ...orderedRelations,
  ];

  const nodeIds = seqNodes.map(n => n.id);
  const laidOutSeqNodes = layoutSequence(seqNodes, nodeIds);

  return {
    nodes: laidOutSeqNodes,
    groups: seqGroups,
    relations: updatedRelations,
    layoutInfo: computeLayoutInfo(laidOutSeqNodes),
  };
}

export function layoutSequence(
  nodes: FlowchartViewNode[],
  _nodeIds: string[]
): FlowchartViewNode[] {
  return nodes;
}
