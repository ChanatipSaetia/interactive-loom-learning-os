import { GitBranch } from 'lucide-react';
import type { FlowchartStepData, FlowchartStepLinear, FlowchartStepBranchOption } from './types';

interface StepCarouselProps {
  activeSteps: FlowchartStepData[];
  activeStep: FlowchartStepData | FlowchartStepBranchOption | null;
  handleStepClick: (step: FlowchartStepLinear | FlowchartStepBranchOption) => void;
  instanceId: string;
  inline?: boolean;
}

export function StepCarousel({
  activeSteps,
  activeStep,
  handleStepClick,
  instanceId,
  inline = false
}: StepCarouselProps) {
  if (!activeSteps || activeSteps.length === 0) return null;

  const innerContent = (
    <div
      className="hide-scrollbar"
      style={{
        width: '100%',
        display: 'flex',
        gap: '10px',
        overflowX: 'auto',
        paddingBottom: inline ? '2px' : '12px',
        paddingTop: inline ? '2px' : '6px',
        alignItems: 'center',
        paddingLeft: inline ? '2px' : '16px',
        paddingRight: inline ? '2px' : '16px',
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
                width: '150px',
                padding: '8px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: isActive ? 'var(--ctp-blue)' : 'var(--border-light)',
                backgroundColor: isActive ? 'var(--ctp-surface0)' : 'var(--ctp-base)',
                transition: 'all 0.3s ease',
                opacity: activeStep && !isActive ? 0.6 : 1,
                pointerEvents: 'auto'
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
                <span
                  style={{
                    fontSize: '8.5px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    padding: '1px 6px',
                    borderRadius: '3px',
                    backgroundColor: isActive ? 'var(--ctp-blue)' : 'var(--ctp-surface1)',
                    color: isActive ? 'var(--ctp-crust)' : 'var(--ctp-text)'
                  }}
                >
                  Phase {idx + 1}
                </span>
              </div>
              <h3
                style={{
                  margin: '0 0 2px 0',
                  fontSize: '12.5px',
                  fontWeight: 'bold',
                  color: isActive ? 'var(--ctp-blue)' : 'var(--ctp-text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '10.5px',
                  lineHeight: '1.3',
                  color: 'var(--ctp-subtext0)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
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
                gap: '6px',
                paddingLeft: '14px',
                marginLeft: '4px',
                borderLeft: '2px dashed var(--ctp-overlay1)',
                position: 'relative',
                pointerEvents: 'none'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '-9px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'var(--ctp-base)',
                  border: '2px solid var(--ctp-overlay1)',
                  borderRadius: '50%',
                  padding: '2px',
                  color: 'var(--ctp-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}
              >
                <GitBranch size={10} />
              </div>
              {step.branches.map((branch: FlowchartStepBranchOption) => {
                const isActive = activeStep?.id === branch.id;
                return (
                  <div
                    id={`step-card-${instanceId}-${branch.id}`}
                    key={branch.id}
                    onClick={() => handleStepClick(branch)}
                    style={{
                      width: '140px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: isActive ? 'var(--ctp-blue)' : 'var(--border-light)',
                      backgroundColor: isActive ? 'var(--ctp-surface0)' : 'var(--ctp-base)',
                      transition: 'all 0.3s ease',
                      opacity: activeStep && !isActive ? 0.6 : 1,
                      pointerEvents: 'auto'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '2px'
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '11.5px',
                          fontWeight: 'bold',
                          color: isActive ? 'var(--ctp-blue)' : 'var(--ctp-text)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {branch.title}
                      </h3>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '10px',
                        lineHeight: '1.25',
                        color: 'var(--ctp-subtext0)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
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
  );

  if (inline) {
    return innerContent;
  }

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
      {innerContent}
    </div>
  );
}

