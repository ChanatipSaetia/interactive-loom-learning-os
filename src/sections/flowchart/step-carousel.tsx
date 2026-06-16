import { GitBranch } from 'lucide-react';
import type { FlowchartStepData, FlowchartStepLinear, FlowchartStepBranchOption } from './types';

interface StepCarouselProps {
  activeSteps: FlowchartStepData[];
  activeStep: FlowchartStepData | FlowchartStepBranchOption | null;
  handleStepClick: (step: FlowchartStepLinear | FlowchartStepBranchOption) => void;
  instanceId: string;
}

export function StepCarousel({
  activeSteps,
  activeStep,
  handleStepClick,
  instanceId
}: StepCarouselProps) {
  if (!activeSteps || activeSteps.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        left: 0,
        right: 0,
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none'
      }}
    >
      <div
        className="hide-scrollbar"
        style={{
          width: '100%',
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          paddingBottom: '16px',
          paddingTop: '8px',
          alignItems: 'center',
          paddingLeft: '24px',
          paddingRight: '24px',
          pointerEvents: 'auto',
          scrollBehavior: 'smooth'
        }}
      >
        {activeSteps.map((step: FlowchartStepData, idx: number) => {
          if (step.type === 'linear') {
            const isActive = activeStep?.id === step.id;
            return (
              <div
                id={`step-card-${instanceId}-${step.id}`}
                key={step.id}
                onClick={() => handleStepClick(step)}
                style={{
                  flexShrink: 0,
                  width: '256px',
                  padding: '12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--ctp-blue)' : 'var(--border-light)',
                  backgroundColor: isActive ? 'var(--ctp-surface0)' : 'var(--ctp-base)',
                  transition: 'all 0.3s ease',
                  opacity: activeStep && !isActive ? 0.6 : 1
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}
                >
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: isActive ? 'var(--ctp-blue)' : 'var(--ctp-surface1)',
                      color: isActive ? 'var(--ctp-crust)' : 'var(--ctp-text)'
                    }}
                  >
                    Phase {idx + 1}
                  </span>
                </div>
                <h3
                  style={{
                    margin: '0 0 4px 0',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: isActive ? 'var(--ctp-blue)' : 'var(--ctp-text)'
                  }}
                >
                  {step.title}
                </h3>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--ctp-subtext0)' }}>
                  {step.reason}
                </p>
              </div>
            );
          }

          if (step.type === 'branch') {
            return (
              <div
                key={step.id}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  paddingLeft: '20px',
                  marginLeft: '8px',
                  borderLeft: '2px dashed var(--ctp-overlay1)',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '-11px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'var(--ctp-base)',
                    border: '2px solid var(--ctp-overlay1)',
                    borderRadius: '50%',
                    padding: '2px',
                    color: 'var(--ctp-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <GitBranch size={12} />
                </div>
                {step.branches.map((branch: FlowchartStepBranchOption) => {
                  const isActive = activeStep?.id === branch.id;
                  return (
                    <div
                      id={`step-card-${instanceId}-${branch.id}`}
                      key={branch.id}
                      onClick={() => handleStepClick(branch)}
                      style={{
                        width: '224px',
                        padding: '10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: isActive ? 'var(--ctp-blue)' : 'var(--border-light)',
                        backgroundColor: isActive ? 'var(--ctp-surface0)' : 'var(--ctp-base)',
                        transition: 'all 0.3s ease',
                        opacity: activeStep && !isActive ? 0.6 : 1
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '4px'
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: isActive ? 'var(--ctp-blue)' : 'var(--ctp-text)'
                          }}
                        >
                          {branch.title}
                        </h3>
                      </div>
                      <p style={{ margin: 0, fontSize: '10px', color: 'var(--ctp-subtext0)' }}>
                        {branch.reason}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
