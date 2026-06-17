import type { FlowchartStateMachine } from '../types';

export interface StateMachineWidgetProps {
  stateMachine: FlowchartStateMachine;
  activeStateId: string | null;
}

export function StateMachineWidget({ stateMachine, activeStateId }: StateMachineWidgetProps) {
  const { states, initialState } = stateMachine;
  const resolvedActiveId = activeStateId ?? initialState;

  return (
    <div className="inspector-state-machine" data-testid="state-machine-widget">
      <div className="inspector-state-machine-states">
        {states.map((state) => {
          const isActive = state.id === resolvedActiveId;
          return (
            <div
              key={state.id}
              className={`inspector-state-node${isActive ? ' inspector-state-active' : ''}`}
              data-testid={`state-${state.id}`}
              style={{
                borderColor: isActive ? state.color : undefined,
              }}
            >
              <div
                className="inspector-state-indicator"
                style={{
                  backgroundColor: isActive ? state.color : 'var(--ctp-surface2)',
                }}
              />
              <span className="inspector-state-label">{state.label}</span>
            </div>
          );
        })}
      </div>

      {states.length > 1 && (
        <div className="inspector-state-machine-transitions" data-testid="state-transitions">
          {states.map((state, idx) => {
            if (idx === states.length - 1) return null;
            const fromActive = state.id === resolvedActiveId;
            const toActive = states[idx + 1].id === resolvedActiveId;
            return (
              <div
                key={`${state.id}-${states[idx + 1].id}`}
                className={`inspector-state-transition${fromActive || toActive ? ' inspector-state-transition-active' : ''}`}
                data-testid={`transition-${state.id}-${states[idx + 1].id}`}
              >
                <span
                  className="inspector-state-transition-dot"
                  style={{
                    backgroundColor: fromActive ? state.color : 'var(--ctp-surface2)',
                  }}
                />
                <span
                  className="inspector-state-transition-line"
                  style={{
                    borderColor: (fromActive || toActive)
                      ? (fromActive ? state.color : states[idx + 1].color)
                      : 'var(--ctp-surface2)',
                  }}
                />
                <span
                  className="inspector-state-transition-dot"
                  style={{
                    backgroundColor: toActive ? states[idx + 1].color : 'var(--ctp-surface2)',
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
