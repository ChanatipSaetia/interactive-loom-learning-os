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
  const pending: Array<{ rel: Omit<FlowchartRelation, 'seqIndex'>; stepRank: number; idx: number }> = [];

  // Messages read in flow order. Each step keeps its messages together and
  // steps keep their declared order, except that a step never comes before
  // the step it follows from (a stable topological sort over step-to-step
  // links; a loop back is broken at the earliest-declared step).
  const esRelations = schema.relations.filter(r => !r.views || r.views.includes('EVENT_STORMING'));
  const isCommand = (id: string) => getEntityType(schema.entities[id]) === TYPES.COMMAND;
  const commands: string[] = [];
  esRelations.forEach(r => {
    [r.from, r.to].forEach(id => { if (isCommand(id) && !commands.includes(id)) commands.push(id); });
  });
  const declared = new Map(commands.map((id, i) => [id, i]));
  // A -> B when A's events lead to B's command without passing another command
  const next = new Map<string, Set<string>>(commands.map(id => [id, new Set<string>()]));
  commands.forEach(cmd => {
    const seen = new Set([cmd]);
    const queue = [cmd];
    while (queue.length > 0) {
      const id = queue.shift()!;
      esRelations.filter(r => r.from === id).forEach(r => {
        if (seen.has(r.to) || getEntityType(schema.entities[r.to]) === TYPES.USER) return;
        seen.add(r.to);
        if (isCommand(r.to)) next.get(cmd)!.add(r.to);
        else queue.push(r.to);
      });
    }
  });
  const indegree = new Map(commands.map(id => [id, 0]));
  next.forEach(targets => targets.forEach(t => indegree.set(t, indegree.get(t)! + 1)));
  const stepOrder: string[] = [];
  const remaining = new Set(commands);
  while (remaining.size > 0) {
    const ready = [...remaining].filter(id => indegree.get(id) === 0);
    const pick = (ready.length > 0 ? ready : [...remaining]).sort((a, b) => declared.get(a)! - declared.get(b)!)[0];
    remaining.delete(pick);
    stepOrder.push(pick);
    next.get(pick)!.forEach(t => { if (remaining.has(t)) indegree.set(t, indegree.get(t)! - 1); });
  }
  const stepRank = new Map(stepOrder.map((id, i) => [id, i]));
  const commandOf = (nodeId: string) =>
    isCommand(nodeId) ? nodeId : esRelations.find(r => r.to === nodeId && r.handledBy)?.from ?? nodeId;
  const stepRankOf = (nodeId: string) => stepRank.get(commandOf(nodeId)) ?? Number.MAX_SAFE_INTEGER;

  let currentIdx = 0;
  const emit = (rel: Omit<FlowchartRelation, 'seqIndex'>) => {
    pending.push({ rel, stepRank: stepRankOf(rel.stepNodeIds?.[0] ?? ''), idx: currentIdx });
  };

  // ── Scan schema.relations: one message per Command (handledBy) + one per produced Event
  schema.relations.forEach((r, idx) => {
    currentIdx = idx;
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
        ...(schema.entities[r.from]?.async ? { async: true } : {}),
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

  pending
    .sort((a, b) => a.stepRank - b.stepRank || a.idx - b.idx)
    .forEach(({ rel }) => {
      const seqIdx = orderedRelations.length;
      const full: FlowchartRelation = { ...rel, seqIndex: seqIdx };
      orderedRelations.push(full);
      altRegistry.register(full, seqIdx);
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
