import type { FlowchartStateMachine, FlowchartStep, UnifiedFlowchartSchema } from './types';

/**
 * The state-machine state the journey is in at `stepIndex`: the state entered
 * (`enters`) by the latest event of this or an earlier stop, else the initial
 * state. Null when the flowchart has no state machine. `machine` picks one
 * when several systems have a state machine (default: the first).
 */
export function stateAtStep(
  schema: UnifiedFlowchartSchema,
  steps: FlowchartStep[] | undefined,
  stepIndex: number,
  machine: FlowchartStateMachine | undefined = Object.values(schema.entities).find(e => e.stateMachine)?.stateMachine
): string | null {
  if (!machine) return null;
  const declared = new Set(machine.states.map(s => s.id));
  let state: string | null = declared.has(machine.initialState) ? machine.initialState : null;
  (steps ?? []).slice(0, Math.max(0, stepIndex + 1)).forEach(step => {
    step.nodeIds?.forEach(id => {
      const entered = schema.entities[id]?.entersState;
      if (entered && declared.has(entered)) state = entered;
    });
  });
  return state;
}
