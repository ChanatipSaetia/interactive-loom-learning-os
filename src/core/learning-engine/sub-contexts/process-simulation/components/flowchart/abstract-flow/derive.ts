/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AbstractFlow, LinearStep, BranchStep, BranchOption, FlowStep } from './types';
import { isLinearStep, isBranchStep } from './types';
import { TYPES } from '../types';
import type { UnifiedFlowchartSchema, FlowchartEntity, FlowchartRelation, FlowchartStepBranchInfo } from '../types';

/**
 * Maps entity IDs to their canonical representative based on (title, type) grouping.
 * Per-step duplicate instances (e.g. engine, engine2, engine3 or dev, dev2) share title and type,
 * so they resolve to the first declared entity ID of that group.
 */
export function buildCanonicalIdMapper(entities: Record<string, FlowchartEntity>): (id: string) => string {
  const canonicalMap: Record<string, string> = {};
  const seenKeyToId = new Map<string, string>();

  for (const [id, entity] of Object.entries(entities)) {
    if (!entity) continue;
    const type = entity.type || entity.viewTypes?.EVENT_STORMING || 'default';
    const key = `${entity.title}::${type}`;
    if (!seenKeyToId.has(key)) {
      seenKeyToId.set(key, id);
    }
    canonicalMap[id] = seenKeyToId.get(key)!;
  }

  return (id: string) => canonicalMap[id] || id;
}

/**
 * Derive a UnifiedFlowchartSchema from an AbstractFlow.
 *
 * Rules:
 * - Each reference to an actor or system per step creates a per-step entity node instance.
 * - The first reference keeps the canonical base ID; subsequent references generate numbered entity IDs (engine2, engine3).
 * - All instances of the same actor/system share the exact same title.
 * - Linear steps follow: [initiatedBy →] command → policy → handler → resultEvents.
 * - Branch steps: event → N×([initiatedBy →] policy → command → handler → resultEvents).
 * - continuesAs creates relations from resultEvents to the next step's policy/command.
 *   Self-edges (target equals the source event) are skipped.
 * - Actor → policy edges are skipped when the policy already receives an event-driven
 *   incoming edge from another step's continuesAs.
 */
export function deriveSchema(flow: AbstractFlow): UnifiedFlowchartSchema {
  const entities: Record<string, FlowchartEntity> = {};
  const relations: FlowchartRelation[] = [];
  const relCounter = { current: 0 };

  const actors = flow?.actors || {};
  const systems = flow?.systems || {};
  const steps = flow?.steps || [];
  const journeysList = flow?.journeys || [];

  // Track how many times each actor / system ref has been used (for per-step instance creation)
  const actorRefCount = new Map<string, number>();
  const systemRefCount = new Map<string, number>();

  // Map abstract IDs to generated entity IDs
  const idMap = new Map<string, string>();

  // Track per-step handler/delegate/actor entity IDs (for Event Storming highlighting and journey nodes)
  const stepHandlerMap = new Map<string, StepParticipants>();

  // Precompute all continuesAs target entity IDs so a policy that already receives
  // an event-driven incoming edge does not also get an actor edge on the same port.
  const continuesAsTargets = new Set<string>();
  for (const step of steps) {
    if (isLinearStep(step) && step.continuesAs) {
      continuesAsTargets.add(resolveNextTargetEntity(step.continuesAs, steps));
    } else if (isBranchStep(step)) {
      for (const branch of step.branches) {
        if (branch.continuesAs) {
          continuesAsTargets.add(resolveNextTargetEntity(branch.continuesAs, steps));
        }
      }
    }
  }

  // --- Phase 1: Declare actors (canonical entities) ---
  for (const [id, actor] of Object.entries(actors)) {
    const entityId = id;
    entities[entityId] = {
      title: actor.title,
      desc: actor.desc,
      type: TYPES.USER,
    };
    idMap.set(id, entityId);
    actorRefCount.set(id, 0);
  }

  // --- Phase 2: Declare systems (canonical entities) ---
  for (const [id, sys] of Object.entries(systems)) {
    const entityId = id;
    entities[entityId] = {
      title: sys.title,
      desc: sys.desc,
      type: sys.type === 'aggregate' ? TYPES.AGGREGATE : TYPES.EXTERNAL,
      stateMachine: sys.stateMachine,
    };
    idMap.set(id, entityId);
    systemRefCount.set(id, 0);
  }

  // --- Phase 3: Process steps ---
  let isFirstStep = true;
  for (const step of steps) {
    if (isLinearStep(step)) {
      stepHandlerMap.set(step.id, processLinearStep(step, entities, relations, relCounter, idMap, actorRefCount, systemRefCount, isFirstStep, steps, continuesAsTargets));
      isFirstStep = false;
    } else if (isBranchStep(step)) {
      const handlers = processBranchStep(step, entities, relations, relCounter, idMap, actorRefCount, systemRefCount, steps, continuesAsTargets);
      for (const { stepId, ...participants } of handlers) {
        stepHandlerMap.set(stepId, participants);
      }
    }
  }

  // --- Phase 4: Build journeys ---
  const nodeIdsForStep = (stepId: string): string[] => {
    const stepData = findStepById(stepId, steps);
    return stepData
      ? collectNodeIds(stepId, stepData, entities, idMap, stepHandlerMap.get(stepId))
      : [resolveNodeId(stepId, idMap)];
  };

  // Where each branch option is taken across journeys, for "other path" links
  const optionTakenAt = new Map<string, { journeyId: string; stepIndex: number }[]>();
  journeysList.forEach(j => (j.steps || []).forEach((s, idx) => {
    optionTakenAt.set(s.stepId, [...(optionTakenAt.get(s.stepId) ?? []), { journeyId: j.id, stepIndex: idx }]);
  }));

  // Only real forks (2+ options) get branch info; a single labeled option is just a continuation
  const branchInfoFor = (stepId: string, journeyId: string, stepIndex: number): FlowchartStepBranchInfo | undefined => {
    const fork = steps.find((st): st is BranchStep => isBranchStep(st) && st.branches.some(b => b.id === stepId));
    if (!fork || fork.branches.length < 2) return undefined;
    const taken = fork.branches.find(b => b.id === stepId)!;
    // The step (or option) whose result event is the fork's branching event
    const producer = steps
      .flatMap((st): Array<LinearStep | BranchOption> => (isBranchStep(st) ? st.branches : [st]))
      .find(st => st.resultEvents.some(evt => evt.id === fork.event));
    return {
      optionId: taken.id,
      label: taken.label,
      forkNodeIds: [resolveNodeId(fork.event, idMap), ...(producer ? nodeIdsForStep(producer.id) : [])],
      alternatives: fork.branches
        .filter(b => b.id !== stepId)
        .map(b => {
          // Prefer another journey; fall back to another point of this one
          const places = optionTakenAt.get(b.id) ?? [];
          const takenBy = places.find(t => t.journeyId !== journeyId)
            ?? places.find(t => t.stepIndex !== stepIndex);
          return {
            optionId: b.id,
            label: b.label,
            nodeIds: nodeIdsForStep(b.id),
            ...(takenBy ? { journeyId: takenBy.journeyId, stepIndex: takenBy.stepIndex } : {}),
          };
        }),
    };
  };

  const journeys = journeysList.map(j => ({
    id: j.id,
    label: j.label,
    description: j.description,
    steps: (j.steps || []).map((s, idx) => {
      const branch = branchInfoFor(s.stepId, j.id, idx);
      const stepData = findStepById(s.stepId, steps);
      const participants = stepHandlerMap.get(s.stepId);
      return {
        nodeIds: nodeIdsForStep(s.stepId),
        ...(stepData ? {
          roles: {
            initiator: participants?.actor,
            handler: participants?.handler,
            delegate: participants?.delegate,
            recipient: participants?.recipient,
            command: stepData.command,
          },
        } : {}),
        title: s.name,
        reason: s.description,
        // A free-text phase label; the state-machine state comes from events' `enters`.
        processGroup: s.processGroup,
        ...(branch ? { branch } : {}),
      };
    }),
  }));

  // --- Phase 5: Deduplicate identical from/to relations ---
  // A branch fan-out and a continuesAs can both link the same event to the same policy
  // (e.g. evt_done → pol_qa_review). Keep one edge, preferring the labeled one.
  const deduped = new Map<string, FlowchartRelation>();
  for (const r of relations) {
    const key = `${r.from}→${r.to}`;
    const existing = deduped.get(key);
    if (!existing || (!existing.label && r.label)) {
      deduped.set(key, r);
    }
  }
  relations.length = 0;
  relations.push(...deduped.values());

  return {
    entities,
    relations,
    journeys,
    rawSteps: steps,
  };
}

function getNextRelId(counter: { current: number }): string {
  return `r${++counter.current}`;
}

/**
 * Resolve the target entity ID for a continuesAs step reference.
 * If nextId is a linear step, returns `pol_${nextId}`.
 * If nextId is a branch step, returns `evt_${branchStep.event}`.
 * If nextId is a branch option, returns `pol_${nextId}`.
 */
function resolveNextTargetEntity(nextId: string, steps: FlowStep[]): string {
  for (const s of steps) {
    if (s.type === 'linear' && s.id === nextId) {
      return `pol_${s.id}`;
    }
    if (s.type === 'branch') {
      if (s.id === nextId) {
        return `evt_${s.event}`;
      }
      const opt = s.branches?.find(b => b.id === nextId);
      if (opt) {
        return `pol_${opt.id}`;
      }
    }
  }
  return `pol_${nextId}`;
}

/**
 * Get or create a duplicated entity for an actor ref per step.
 * First use returns the canonical ID. Subsequent uses create duplicates.
 */
function getActorEntityId(
  actorId: string,
  entities: Record<string, FlowchartEntity>,
  actorRefCount: Map<string, number>,
  idMap: Map<string, string>,
  stepId: string,
): string {
  const count = actorRefCount.get(actorId) ?? 0;
  actorRefCount.set(actorId, count + 1);

  if (count === 0) {
    return actorId;
  }

  const dupId = `${actorId}${count + 1}`;
  const canonical = entities[actorId];
  if (canonical) {
    entities[dupId] = {
      title: canonical.title,
      desc: canonical.desc,
      type: TYPES.USER,
    };
  }
  idMap.set(`${actorId}:${stepId}`, dupId);
  return dupId;
}

/**
 * Get or create a duplicated entity for a system ref per step.
 * First use returns the canonical ID. Subsequent uses create duplicates.
 */
function getSystemEntityId(
  sysId: string,
  entities: Record<string, FlowchartEntity>,
  systemRefCount: Map<string, number>,
  idMap: Map<string, string>,
  stepId: string,
): string {
  const count = systemRefCount.get(sysId) ?? 0;
  systemRefCount.set(sysId, count + 1);

  if (count === 0) {
    return sysId;
  }

  const dupId = `${sysId}${count + 1}`;
  const canonical = entities[sysId];
  if (canonical) {
    entities[dupId] = {
      title: canonical.title,
      desc: canonical.desc,
      type: canonical.type,
      ...(canonical.stateMachine ? { stateMachine: canonical.stateMachine } : {}),
    };
  }
  idMap.set(`${sysId}:${stepId}`, dupId);
  return dupId;
}

function processLinearStep(
  step: LinearStep,
  entities: Record<string, FlowchartEntity>,
  relations: FlowchartRelation[],
  relCounter: { current: number },
  idMap: Map<string, string>,
  actorRefCount: Map<string, number>,
  systemRefCount: Map<string, number>,
  isFirstStep: boolean,
  steps: FlowStep[] = [],
  _continuesAsTargets: Set<string> = new Set(),
): StepParticipants {
  // Create policy entity (always — even for root step)
  const polId = `pol_${step.id}`;
  entities[polId] = {
    title: step.policy,
    desc: step.description || step.policy,
    type: TYPES.POLICY,
    root: isFirstStep && !step.initiatedBy,
  };

  // Create command entity
  const cmdId = `cmd_${step.id}`;
  entities[cmdId] = {
    title: step.command,
    desc: step.description || step.command,
    type: TYPES.COMMAND,
  };
  idMap.set(step.id, cmdId);

  // Handle actor (initiatedBy) if present
  let actorId: string | undefined;
  if (step.initiatedBy) {
    const rawActorId = getId(step.initiatedBy);
    if (entities[rawActorId] || actorRefCount.has(rawActorId)) {
      actorId = getActorEntityId(rawActorId, entities, actorRefCount, idMap, step.id);
    } else {
      actorId = idMap.get(rawActorId) || rawActorId;
    }
    relations.push({
      id: getNextRelId(relCounter),
      from: actorId,
      to: polId,
      views: ['EVENT_STORMING'],
    });
  }

  // Policy → Command (always)
  relations.push({
    id: getNextRelId(relCounter),
    from: polId,
    to: cmdId,
    views: ['EVENT_STORMING'],
  });

  // Get handler entity (auto-duplicate per step); a step may have none
  const handlerId = step.handledBy
    ? getSystemEntityId(getId(step.handledBy), entities, systemRefCount, idMap, step.id)
    : undefined;

  // Command → handler (handledBy)
  if (handlerId) {
    relations.push({
      id: getNextRelId(relCounter),
      from: cmdId,
      to: handlerId,
      handledBy: true,
      views: ['EVENT_STORMING'],
    });
  }

  // Handler → delegate (side relation, not in event chain)
  let delegateId: string | undefined;
  if (handlerId && step.delegatesTo) {
    delegateId = getSystemEntityId(
      getId(step.delegatesTo),
      entities,
      systemRefCount,
      idMap,
      `${step.id}:delegate`,
    );
    relations.push({
      id: getNextRelId(relCounter),
      from: handlerId,
      to: delegateId,
      views: ['EVENT_STORMING'],
    });
  }

  // Handler → resultEvents (from the handler, never the delegate; from the command when no handler)
  for (const evt of step.resultEvents) {
    const eventId = `evt_${evt.id}`;
    if (!entities[eventId]) {
      entities[eventId] = {
        title: evt.title,
        desc: evt.desc || evt.title,
        type: TYPES.EVENT,
        ...(evt.enters ? { entersState: evt.enters } : {}),
      };
    }
    idMap.set(evt.id, eventId);

    relations.push({
      id: getNextRelId(relCounter),
      from: handlerId ?? cmdId,
      to: eventId,
      views: ['EVENT_STORMING'],
    });
  }

  const recipientId = addRecipient(step.sendsTo, step.resultEvents, step.id, entities, relations, relCounter, idMap, actorRefCount, systemRefCount);

  // continuesAs: link result events to next step's policy or branch event (skip self-edges)
  if (step.continuesAs) {
    const nextTargetId = resolveNextTargetEntity(step.continuesAs, steps);
    for (const evt of step.resultEvents) {
      const eventId = `evt_${evt.id}`;
      if (eventId === nextTargetId) continue;
      relations.push({
        id: getNextRelId(relCounter),
        from: eventId,
        to: nextTargetId,
        views: ['EVENT_STORMING'],
      });
    }
  }

  return { handler: handlerId, delegate: delegateId, actor: actorId, recipient: recipientId };
}

/** Who takes part in a step, as per-step entity ids. */
interface StepParticipants {
  handler?: string;
  delegate?: string;
  actor?: string;
  recipient?: string;
}

/** Relation tag for sendsTo links: read by the Sequence and System Architecture views only. */
export const SENDS_TO_VIEW = 'SENDS_TO';

/**
 * sendsTo: each result event is delivered to the recipient (the declared actor
 * or system). The link is kept out of Event Storming, which does not model
 * recipients; the Sequence and System Architecture views draw it as a message.
 */
function addRecipient(
  sendsTo: unknown,
  resultEvents: Array<{ id: string }>,
  _stepId: string,
  _entities: Record<string, FlowchartEntity>,
  relations: FlowchartRelation[],
  relCounter: { current: number },
  idMap: Map<string, string>,
  _actorRefCount: Map<string, number>,
  _systemRefCount: Map<string, number>,
): string | undefined {
  if (!sendsTo) return undefined;
  const recipientId = resolveNodeId(getId(sendsTo), idMap);
  for (const evt of resultEvents) {
    relations.push({
      id: getNextRelId(relCounter),
      from: `evt_${evt.id}`,
      to: recipientId,
      sendsTo: true,
      views: [SENDS_TO_VIEW],
    });
  }
  return recipientId;
}

function processBranchStep(
  step: BranchStep,
  entities: Record<string, FlowchartEntity>,
  relations: FlowchartRelation[],
  relCounter: { current: number },
  idMap: Map<string, string>,
  actorRefCount: Map<string, number>,
  systemRefCount: Map<string, number>,
  steps: FlowStep[] = [],
  _continuesAsTargets: Set<string> = new Set(),
): Array<{ stepId: string } & StepParticipants> {
  // Create branch event entity
  const branchEventId = `evt_${step.event}`;
  if (!entities[branchEventId]) {
    entities[branchEventId] = {
      title: step.event,
      desc: step.event,
      type: TYPES.EVENT,
    };
  }
  idMap.set(step.event, branchEventId);

  // Process each branch
  const handlerInfo: Array<{ stepId: string } & StepParticipants> = [];
  for (const branch of step.branches) {
    // Branch policy
    const polId = `pol_${branch.id}`;
    entities[polId] = {
      title: branch.policy,
      desc: branch.policy,
      type: TYPES.POLICY,
    };

    // Branch command
    const cmdId = `cmd_${branch.id}`;
    entities[cmdId] = {
      title: branch.command,
      desc: branch.command,
      type: TYPES.COMMAND,
    };
    idMap.set(branch.id, cmdId);

    // Handle actor if present on branch option
    let actorId: string | undefined;
    if (branch.initiatedBy) {
      const rawActorId = getId(branch.initiatedBy);
      if (entities[rawActorId] || actorRefCount.has(rawActorId)) {
        actorId = getActorEntityId(rawActorId, entities, actorRefCount, idMap, branch.id);
      } else {
        actorId = idMap.get(rawActorId) || rawActorId;
      }
      relations.push({
        id: getNextRelId(relCounter),
        from: actorId,
        to: polId,
        views: ['EVENT_STORMING'],
      });
    }

    // Get handler (auto-duplicate per step); an option may have none
    const handlerId = branch.handledBy
      ? getSystemEntityId(getId(branch.handledBy), entities, systemRefCount, idMap, branch.id)
      : undefined;

    // Event → Policy (branch point)
    relations.push({
      id: getNextRelId(relCounter),
      from: branchEventId,
      to: polId,
      label: branch.label,
      dashed: branch.dashed,
      views: ['EVENT_STORMING'],
    });

    // Policy → Command
    relations.push({
      id: getNextRelId(relCounter),
      from: polId,
      to: cmdId,
      views: ['EVENT_STORMING'],
    });

    // Command → Handler (handledBy)
    if (handlerId) {
      relations.push({
        id: getNextRelId(relCounter),
        from: cmdId,
        to: handlerId,
        handledBy: true,
        views: ['EVENT_STORMING'],
      });
    }

    // Handler → delegate (side relation, not in event chain)
    let delegateId: string | undefined;
    if (handlerId && branch.delegatesTo) {
      delegateId = getSystemEntityId(
        getId(branch.delegatesTo),
        entities,
        systemRefCount,
        idMap,
        `${branch.id}:delegate`,
      );
      relations.push({
        id: getNextRelId(relCounter),
        from: handlerId,
        to: delegateId,
        views: ['EVENT_STORMING'],
      });
    }

    // Handler → ResultEvents (from the handler; from the command when no handler)
    for (const evt of branch.resultEvents) {
      const eventId = `evt_${evt.id}`;
      if (!entities[eventId]) {
        entities[eventId] = {
          title: evt.title,
          desc: evt.desc || evt.title,
          type: TYPES.EVENT,
          ...(evt.enters ? { entersState: evt.enters } : {}),
        };
      }
      idMap.set(evt.id, eventId);

      relations.push({
        id: getNextRelId(relCounter),
        from: handlerId ?? cmdId,
        to: eventId,
        views: ['EVENT_STORMING'],
      });
    }

    const recipientId = addRecipient(branch.sendsTo, branch.resultEvents, branch.id, entities, relations, relCounter, idMap, actorRefCount, systemRefCount);
    handlerInfo.push({ stepId: branch.id, handler: handlerId, delegate: delegateId, actor: actorId, recipient: recipientId });

    // continuesAs: link branch result events to next step (skip self-edges)
    if (branch.continuesAs) {
      const nextTargetId = resolveNextTargetEntity(branch.continuesAs, steps);
      for (const evt of branch.resultEvents) {
        const eventId = `evt_${evt.id}`;
        if (eventId === nextTargetId) continue;
        relations.push({
          id: getNextRelId(relCounter),
          from: eventId,
          to: nextTargetId,
          views: ['EVENT_STORMING'],
        });
      }
    }
  }
  return handlerInfo;
}

function resolveNodeId(nodeId: string, idMap: Map<string, string>): string {
  return idMap.get(nodeId) || nodeId;
}

/** Find a linear step or branch option by id. */
function findStepById(
  stepId: string,
  steps: FlowStep[],
): LinearStep | BranchOption | undefined {
  for (const step of steps) {
    if (step.type === 'linear' && step.id === stepId) return step;
    if (step.type === 'branch') {
      const branch = step.branches.find(b => b.id === stepId);
      if (branch) return branch;
    }
  }
}

/** Collect all generated entity IDs from a step's full chain. */
function collectNodeIds(
  stepId: string,
  step: LinearStep | BranchOption,
  entities: Record<string, FlowchartEntity>,
  idMap: Map<string, string>,
  handlerInfo?: StepParticipants,
): string[] {
  const ids: string[] = [];

  // Actor — if present
  if (handlerInfo?.actor) {
    ids.push(handlerInfo.actor);
  } else if (step.initiatedBy) {
    ids.push(resolveNodeId(getId(step.initiatedBy), idMap));
  }

  // Policy — always present
  const polId = `pol_${stepId}`;
  if (entities[polId]) ids.push(polId);

  // Command
  const cmdId = `cmd_${stepId}`;
  if (entities[cmdId]) ids.push(cmdId);

  // Handler — use per-step entity (a step may have none)
  if (handlerInfo?.handler) {
    ids.push(handlerInfo.handler);
  } else if (!handlerInfo && step.handledBy) {
    ids.push(resolveNodeId(getId(step.handledBy), idMap));
  }

  // Delegate (optional) — use per-step entity
  if (handlerInfo?.delegate) {
    ids.push(handlerInfo.delegate);
  } else if (step.delegatesTo) {
    ids.push(resolveNodeId(getId(step.delegatesTo), idMap));
  }

  // Result events
  for (const evt of step.resultEvents) {
    const eventId = `evt_${evt.id}`;
    if (entities[eventId]) ids.push(eventId);
  }

  return ids;
}

function getId(ref: any): string {
  if (typeof ref === 'string') return ref;
  return ref?.id || '';
}
