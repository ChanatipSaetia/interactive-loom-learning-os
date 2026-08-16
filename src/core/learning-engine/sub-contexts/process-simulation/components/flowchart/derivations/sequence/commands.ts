import type { UnifiedFlowchartSchema } from '../../types';
import { TYPES } from '../../types';
import { getEntityType } from '../utils';

/**
 * Resolves the initiating participant for a command node.
 * Walks backwards: direct actor → policy → actor.
 */
export function findCommandInitiator(
  schema: UnifiedFlowchartSchema,
  cmdId: string,
  getCollapsedId: (id: string) => string
): string | null {
  // Direct actor → command
  const directActor = schema.relations.find(r =>
    (!r.views || r.views.includes('EVENT_STORMING')) &&
    r.to === cmdId &&
    (getEntityType(schema.entities[r.from]) === TYPES.USER ||
     getEntityType(schema.entities[r.from]) === TYPES.EXTERNAL)
  );
  if (directActor) return getCollapsedId(directActor.from);

  // Policy → command; trace policy back to actor
  const policies = schema.relations.filter(r =>
    (!r.views || r.views.includes('EVENT_STORMING')) &&
    r.to === cmdId &&
    getEntityType(schema.entities[r.from]) === TYPES.POLICY
  );
  for (const pr of policies) {
    const actorRel = schema.relations.find(r =>
      (!r.views || r.views.includes('EVENT_STORMING')) &&
      r.to === pr.from &&
      (getEntityType(schema.entities[r.from]) === TYPES.USER ||
       getEntityType(schema.entities[r.from]) === TYPES.EXTERNAL)
    );
    if (actorRel) return getCollapsedId(actorRel.from);
  }

  return null;
}
