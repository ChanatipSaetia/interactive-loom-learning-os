/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import type { AbstractFlow, LinearStep, BranchStep, BranchOption, FlowStep } from './types';
import { isLinearStep, isBranchStep } from './types';
import { TYPES } from '../types';
import type { UnifiedFlowchartSchema, FlowchartEntity, FlowchartRelation } from '../types';

/**
 * Derive a UnifiedFlowchartSchema from an AbstractFlow.
 *
 * Rules:
 * - Each unique ref() to a system auto-duplicates with collapsedTo.
 * - First reference to a system creates the canonical entity.
 * - Linear steps follow: [initiatedBy →] command → policy → handler → resultEvents.
 * - Branch steps: event → N×(policy → command → handler → resultEvents).
 * - continuesAs creates relations from resultEvents to the next step's policy/command.
 */
export function deriveSchema(flow: AbstractFlow): UnifiedFlowchartSchema {
  const entities: Record<string, FlowchartEntity> = {};
  const relations: FlowchartRelation[] = [];
  const relCounter = { current: 0 };

  const actors = flow?.actors || {};
  const systems = flow?.systems || {};
  const steps = flow?.steps || [];
  const journeysList = flow?.journeys || [];

  // Track how many times each system ref has been used (for auto-duplication)
  const systemRefCount = new Map<string, number>();

  // Map abstract IDs to generated entity IDs
  const idMap = new Map<string, string>();

  // Track per-step handler/delegate entity IDs (for Event Storming highlighting)
  const stepHandlerMap = new Map<string, { handler: string; delegate?: string }>();

  // --- Phase 1: Declare actors ---
  for (const [id, actor] of Object.entries(actors)) {
    const entityId = id;
    entities[entityId] = {
      title: actor.title,
      desc: actor.desc,
      type: TYPES.USER,
    };
    idMap.set(id, entityId);
  }

  // --- Phase 2: Declare systems (canonical entities only) ---
  for (const [id, sys] of Object.entries(systems)) {
    const entityId = id;
    entities[entityId] = {
      title: sys.title,
      desc: sys.desc,
      type: sys.type === 'aggregate' ? TYPES.AGGREGATE : TYPES.EXTERNAL,
      stateMachine: sys.stateMachine,
      // Preserve user-declared collapsedTo (e.g. heralds2.collapsedTo: "heralds" from systems.yaml)
      ...(sys.collapsedTo ? { collapsedTo: sys.collapsedTo } : {}),
    };
    idMap.set(id, entityId);
    systemRefCount.set(id, 0);
  }

  // --- Phase 3: Process steps ---
  let isFirstStep = true;
  for (const step of steps) {
    if (isLinearStep(step)) {
      const { handler, delegate } = processLinearStep(step, entities, relations, relCounter, idMap, systemRefCount, isFirstStep, steps);
      stepHandlerMap.set(step.id, { handler, delegate });
      isFirstStep = false;
    } else if (isBranchStep(step)) {
      const handlers = processBranchStep(step, entities, relations, relCounter, idMap, systemRefCount, steps);
      for (const { stepId, handler, delegate } of handlers) {
        stepHandlerMap.set(stepId, { handler, delegate });
      }
    }
  }

  // --- Phase 4: Build journeys ---
  const journeys = journeysList.map(j => ({
    id: j.id,
    label: j.label,
    description: j.description,
    steps: (j.steps || []).map(s => {
      const stepData = findStepById(s.stepId, steps);
      const nodeIds = stepData
        ? collectNodeIds(s.stepId, stepData, entities, idMap, stepHandlerMap.get(s.stepId))
        : [resolveNodeId(s.stepId, idMap)];
      return {
        nodeIds,
        title: s.name,
        reason: s.description,
        processGroup: s.processGroup,
      };
    }),
  }));

  return {
    entities,
    relations,
    journeys,
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
 * Get or create a duplicated entity for a system ref.
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
    // First use — return canonical
    return sysId;
  }

  // Subsequent use — create duplicate
  const dupId = `${sysId}${count}`;
  const canonical = entities[sysId];
  entities[dupId] = {
    ...canonical,
    title: `${canonical.title} ${count}`,
    desc: canonical.desc,
    collapsedTo: sysId,
  };
  idMap.set(`${sysId}:${stepId}`, dupId);
  return dupId;
}

function processLinearStep(
  step: LinearStep,
  entities: Record<string, FlowchartEntity>,
  relations: FlowchartRelation[],
  relCounter: { current: number },
  idMap: Map<string, string>,
  systemRefCount: Map<string, number>,
  isFirstStep: boolean,
  steps: FlowStep[] = [],
): { handler: string; delegate?: string } {
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

  if (isFirstStep) {
    // Root step: ACTOR → POLICY → COMMAND (or just mark policy as root when no actor)
    if (step.initiatedBy) {
      const actorId = idMap.get(getId(step.initiatedBy));
      if (actorId) {
        relations.push({
          id: getNextRelId(relCounter),
          from: actorId,
          to: polId,
          views: ['EVENT_STORMING'],
        });
      }
    } else {
      entities[polId].root = true;
    }
  }

  // Policy → Command (always)
  relations.push({
    id: getNextRelId(relCounter),
    from: polId,
    to: cmdId,
    views: ['EVENT_STORMING'],
  });

  // Get handler entity (auto-duplicate)
  const handlerId = getSystemEntityId(
    getId(step.handledBy),
    entities,
    systemRefCount,
    idMap,
    step.id,
  );

  // Command → handler (handledBy)
  relations.push({
    id: getNextRelId(relCounter),
    from: cmdId,
    to: handlerId,
    handledBy: true,
    views: ['EVENT_STORMING'],
  });

  // Handler → delegate (side relation, not in event chain)
  let delegateId: string | undefined;
  if (step.delegatesTo) {
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

  // Handler → resultEvents (always from handler, never from delegate)
  for (const evt of step.resultEvents) {
    const eventId = `evt_${evt.id}`;
    if (!entities[eventId]) {
      entities[eventId] = {
        title: evt.title,
        desc: evt.desc || evt.title,
        type: TYPES.EVENT,
      };
    }
    idMap.set(evt.id, eventId);

    relations.push({
      id: getNextRelId(relCounter),
      from: handlerId,
      to: eventId,
      views: ['EVENT_STORMING'],
    });
  }

  // continuesAs: link result events to next step's policy or branch event
  if (step.continuesAs) {
    const nextTargetId = resolveNextTargetEntity(step.continuesAs, steps);
    for (const evt of step.resultEvents) {
      const eventId = `evt_${evt.id}`;
      relations.push({
        id: getNextRelId(relCounter),
        from: eventId,
        to: nextTargetId,
        views: ['EVENT_STORMING'],
      });
    }
  }

  return { handler: handlerId, delegate: delegateId };
}

function processBranchStep(
  step: BranchStep,
  entities: Record<string, FlowchartEntity>,
  relations: FlowchartRelation[],
  relCounter: { current: number },
  idMap: Map<string, string>,
  systemRefCount: Map<string, number>,
  steps: FlowStep[] = [],
): Array<{ stepId: string; handler: string; delegate?: string }> {
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
  const handlerInfo: Array<{ stepId: string; handler: string; delegate?: string }> = [];
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

    // Get handler (auto-duplicate)
    const handlerId = getSystemEntityId(
      getId(branch.handledBy),
      entities,
      systemRefCount,
      idMap,
      branch.id,
    );

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
    relations.push({
      id: getNextRelId(relCounter),
      from: cmdId,
      to: handlerId,
      handledBy: true,
      views: ['EVENT_STORMING'],
    });

    // Handler → delegate (side relation, not in event chain)
    let delegateId: string | undefined;
    if (branch.delegatesTo) {
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

    handlerInfo.push({ stepId: branch.id, handler: handlerId, delegate: delegateId });

    // Handler → ResultEvents (always from handler)
    for (const evt of branch.resultEvents) {
      const eventId = `evt_${evt.id}`;
      if (!entities[eventId]) {
        entities[eventId] = {
          title: evt.title,
          desc: evt.desc || evt.title,
          type: TYPES.EVENT,
        };
      }
      idMap.set(evt.id, eventId);

      relations.push({
        id: getNextRelId(relCounter),
        from: handlerId,
        to: eventId,
        views: ['EVENT_STORMING'],
      });
    }

    // continuesAs: link branch result events to next step
    if (branch.continuesAs) {
      const nextTargetId = resolveNextTargetEntity(branch.continuesAs, steps);
      for (const evt of branch.resultEvents) {
        const eventId = `evt_${evt.id}`;
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
  handlerInfo?: { handler: string; delegate?: string },
): string[] {
  const ids: string[] = [];

  // Policy — always present (root and non-root steps both get a POLICY node now)
  const polId = `pol_${stepId}`;
  if (entities[polId]) ids.push(polId);

  // Command
  const cmdId = `cmd_${stepId}`;
  if (entities[cmdId]) ids.push(cmdId);

  // Handler — use per-step entity (may be a duplicate in Event Storming)
  if (handlerInfo) {
    ids.push(handlerInfo.handler);
  } else {
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
