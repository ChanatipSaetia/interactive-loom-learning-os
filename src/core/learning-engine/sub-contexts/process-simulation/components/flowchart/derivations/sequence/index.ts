import type { UnifiedFlowchartSchema, FlowchartRelation, FlowchartViewNode } from '../../types';
import { TYPES } from '../../types';
import { getEntityType, computeLayoutInfo } from '../utils';
import { deriveParticipants } from './participants';
import { findCommandInitiator, findEventRecipient } from './commands';
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

    // ── Command dispatched to an Aggregate/External/Service (handledBy) → solid arrow ──────
    const isHandlerSystem = toType === TYPES.AGGREGATE || toType === TYPES.EXTERNAL || toType === TYPES.SERVICE || toType === TYPES.DATABASE;
    if (fromType === TYPES.COMMAND && r.handledBy && isHandlerSystem) {
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
        stepNodeIds: [r.from, r.to],
      });
    }

    // ── Event produced by a Command, Aggregate, or External system → dashed arrow ───────────
    const isProducerSystem = fromType === TYPES.COMMAND || fromType === TYPES.AGGREGATE || fromType === TYPES.EXTERNAL || fromType === TYPES.SERVICE || fromType === TYPES.DATABASE;
    if (toType === TYPES.EVENT && isProducerSystem) {
      const eventEntity = schema.entities[r.to];

      // Find which participant produces this event
      let producer: string | undefined;
      if (fromType === TYPES.COMMAND) {
        const handledByRel = schema.relations.find(hbr =>
          (!hbr.views || hbr.views.includes('EVENT_STORMING')) &&
          hbr.from === r.from && hbr.handledBy
        );
        // A command no system runs: the event comes from whoever started the step
        producer = handledByRel
          ? getCollapsedId(handledByRel.to)
          : findCommandInitiator(schema, r.from, getCollapsedId) ?? undefined;
      } else {
        producer = getCollapsedId(r.from);
      }
      if (!producer) return;

      // An event goes to its declared recipient (sendsTo). Without one it is not
      // sent anywhere, so it stays on the producer's lifeline instead of being
      // guessed onto whoever acts next.
      const target = findEventRecipient(schema, r.to, getCollapsedId) ?? producer;

      emit({
        id: `seq_evt_${idx}`,
        from: producer,
        to: target,
        views: ['SEQUENCE'],
        label: eventEntity?.title ?? '',
        dashed: true,
        chronologicalIndex: idx,
        stepNodeIds: [r.from, r.to],
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
