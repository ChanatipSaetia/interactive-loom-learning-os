import type { FlowchartStateMachine } from '../types';

export interface StateMachineWidgetProps {
  stateMachine: FlowchartStateMachine;
  activeStateId: string | null;
  onStateClick?: (stateId: string) => void;
}

export function StateMachineWidget({ stateMachine, activeStateId, onStateClick }: StateMachineWidgetProps) {
  const { states, initialState } = stateMachine;
  const resolvedActiveId = activeStateId ?? initialState;
  const clickable = !!onStateClick;

  return (
    <div className="inspector-state-machine" data-testid="state-machine-widget">
      <div className="inspector-state-machine-states">
        {states.map((state) => {
          const isActive = state.id === resolvedActiveId;
          return (
            <button
              key={state.id}
              type="button"
              className={`inspector-state-node${isActive ? ' inspector-state-active' : ''}${clickable ? ' inspector-state-clickable' : ''}`}
              data-testid={`state-${state.id}`}
              onClick={clickable ? () => onStateClick?.(state.id) : undefined}
              disabled={!clickable}
              style={{
                borderColor: isActive ? state.color : undefined,
                cursor: clickable ? 'pointer' : 'default',
              }}
            >
              <div
                className="inspector-state-indicator"
                style={{
                  backgroundColor: isActive ? state.color : 'var(--ctp-surface2)',
                }}
              />
              <span className="inspector-state-label">{state.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
