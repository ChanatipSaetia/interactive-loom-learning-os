import type { AbstractFlow, LinearStep, BranchStep } from './types';
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

  // Track how many times each system ref has been used (for auto-duplication)
  const systemRefCount = new Map<string, number>();

  // Map abstract IDs to generated entity IDs
  const idMap = new Map<string, string>();

  // --- Phase 1: Declare actors ---
  for (const [id, actor] of Object.entries(flow.actors)) {
    const entityId = id;
    entities[entityId] = {
      title: actor.title,
      desc: actor.desc,
      type: TYPES.USER,
    };
    idMap.set(id, entityId);
  }

  // --- Phase 2: Declare systems (canonical entities only) ---
  for (const [id, sys] of Object.entries(flow.systems)) {
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
  for (const step of flow.steps) {
    if (isLinearStep(step)) {
      processLinearStep(step, entities, relations, relCounter, idMap, systemRefCount, isFirstStep);
      isFirstStep = false;
    } else if (isBranchStep(step)) {
      processBranchStep(step, entities, relations, relCounter, idMap, systemRefCount);
    }
  }

  // --- Phase 4: Build journeys ---
  const journeys = flow.journeys.map(j => ({
    id: j.id,
    label: j.label,
    description: j.description,
    steps: j.steps.map(s => ({
      nodeId: resolveNodeId(s.nodeId, idMap),
      description: s.description,
      processGroup: s.processGroup,
    })),
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
): void {
  // Create command entity
  const cmdId = `cmd_${step.id}`;
  entities[cmdId] = {
    title: step.command,
    desc: step.description || step.command,
    type: TYPES.COMMAND,
    root: isFirstStep,
  };
  idMap.set(step.id, cmdId);

  // Actor → command (for root step)
  if (step.initiatedBy) {
    const actorId = idMap.get(step.initiatedBy.id);
    if (actorId) {
      relations.push({
        id: getNextRelId(relCounter),
        from: actorId,
        to: cmdId,
        views: ['EVENT_STORMING'],
      });
    }
  }

  // For non-root steps: create policy and link event → policy → command
  if (!isFirstStep) {
    const polId = `pol_${step.id}`;
    entities[polId] = {
      title: step.policy,
      desc: step.description || step.policy,
      type: TYPES.POLICY,
    };

    // Policy → Command
    relations.push({
      id: getNextRelId(relCounter),
      from: polId,
      to: cmdId,
      views: ['EVENT_STORMING'],
    });
  }

  // Get handler entity (auto-duplicate)
  const handlerId = getSystemEntityId(
    step.handledBy.id,
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
  if (step.delegatesTo) {
    const delegateId = getSystemEntityId(
      step.delegatesTo.id,
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

  // continuesAs: link result events to next step's policy
  if (step.continuesAs) {
    const nextPolId = `pol_${step.continuesAs}`;
    for (const evt of step.resultEvents) {
      const eventId = `evt_${evt.id}`;
      relations.push({
        id: getNextRelId(relCounter),
        from: eventId,
        to: nextPolId,
        views: ['EVENT_STORMING'],
      });
    }
  }
}

function processBranchStep(
  step: BranchStep,
  entities: Record<string, FlowchartEntity>,
  relations: FlowchartRelation[],
  relCounter: { current: number },
  idMap: Map<string, string>,
  systemRefCount: Map<string, number>,
): void {
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
      branch.handledBy.id,
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
    if (branch.delegatesTo) {
      const delegateId = getSystemEntityId(
        branch.delegatesTo.id,
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
      const nextPolId = `pol_${branch.continuesAs}`;
      for (const evt of branch.resultEvents) {
        const eventId = `evt_${evt.id}`;
        relations.push({
          id: getNextRelId(relCounter),
          from: eventId,
          to: nextPolId,
          views: ['EVENT_STORMING'],
        });
      }
    }
  }
}

function resolveNodeId(nodeId: string, idMap: Map<string, string>): string {
  return idMap.get(nodeId) || nodeId;
}
