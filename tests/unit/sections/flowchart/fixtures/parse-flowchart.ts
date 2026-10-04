import { FlowchartSectionSchema } from '../../../../../src/core/learning-engine/sub-contexts/process-simulation/schema';
import { ref } from '../../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/types';
import type { AbstractFlow, FlowStep } from '../../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/types';

const REF_KEYS = ['initiatedBy', 'handledBy', 'delegatesTo', 'sendsTo'] as const;

function withRefs<T extends Record<string, unknown>>(step: T): T {
  const out: Record<string, unknown> = { ...step };
  for (const key of REF_KEYS) {
    const value = out[key];
    if (typeof value === 'string') out[key] = ref(value);
    else if (value && typeof value === 'object') out[key] = ref((value as { id: string }).id);
  }
  return out as T;
}

/** Validates raw flowchart data like the app does and returns it as an AbstractFlow. */
export function parseFlowchart(raw: unknown): { flow: AbstractFlow } {
  const flow = FlowchartSectionSchema.parse(raw).flow as Record<string, unknown>;
  const steps = (flow.steps ?? []) as Array<Record<string, unknown>>;
  return {
    flow: {
      actors: flow.actors ?? {},
      systems: flow.systems ?? {},
      steps: steps.map(step => step.type === 'branch'
        ? { ...step, branches: (step.branches as Array<Record<string, unknown>>).map(withRefs) }
        : { type: 'linear', policy: '', command: '', ...withRefs(step) }) as unknown as FlowStep[],
      journeys: flow.journeys ?? [],
    } as AbstractFlow,
  };
}
