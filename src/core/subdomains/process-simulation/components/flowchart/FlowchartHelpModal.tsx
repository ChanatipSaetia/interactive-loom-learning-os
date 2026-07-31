import { useEffect } from 'react'
import { X, HelpCircle, ArrowRight, Zap, Layers, GitCommit, GitBranch, Compass, Footprints } from 'lucide-react'

interface FlowchartHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FlowchartHelpModal({ isOpen, onClose }: FlowchartHelpModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="flowchart-help-overlay"
      onClick={onClose}
      data-testid="flowchart-help-overlay"
    >
      <div
        className="flowchart-help-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="flowchart-help-modal"
        role="dialog"
        aria-labelledby="flowchart-help-title"
      >
        {/* Modal Header */}
        <div className="flowchart-help-header">
          <div className="flowchart-help-title-group">
            <HelpCircle className="flowchart-help-icon" size={20} />
            <h2 id="flowchart-help-title" className="flowchart-help-title">
              Flowchart & Event Storming Concepts Guide
            </h2>
          </div>
          <button
            className="flowchart-help-close-btn"
            onClick={onClose}
            data-testid="flowchart-help-close"
            aria-label="Close help guide"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flowchart-help-body">
          {/* Section 1: Event Storming Cycle */}
          <section className="flowchart-help-section">
            <div className="flowchart-help-section-title">
              <Zap size={16} />
              <h3>The Event Storming Cycle</h3>
            </div>
            <p className="flowchart-help-desc">
              Flowchart steps follow strict Event Storming conventions. Every step begins with an Event, triggers a Policy, issues a Command to a Handler (Aggregate or External System), which emits new Result Events:
            </p>

            <div className="flowchart-help-cycle-flow">
              <span className="cycle-pill cycle-pill--event">Event</span>
              <ArrowRight size={14} className="cycle-arrow" />
              <span className="cycle-pill cycle-pill--policy">Policy</span>
              <ArrowRight size={14} className="cycle-arrow" />
              <span className="cycle-pill cycle-pill--command">Command</span>
              <ArrowRight size={14} className="cycle-arrow" />
              <span className="cycle-pill cycle-pill--handler">System Handler</span>
              <ArrowRight size={14} className="cycle-arrow" />
              <span className="cycle-pill cycle-pill--event">Result Event(s)</span>
            </div>
          </section>

          {/* Section 2: Step Types (Linear vs Branch) */}
          <section className="flowchart-help-section">
            <div className="flowchart-help-section-title">
              <GitCommit size={16} />
              <h3>Steps: Linear Steps vs. Branch Steps</h3>
            </div>
            <p className="flowchart-help-desc">
              Steps define the underlying operational logic of the flowchart. There are two step types:
            </p>
            <div className="flowchart-help-grid">
              <div className="flowchart-help-card">
                <div className="flowchart-help-card-header">
                  <GitCommit size={14} className="text-primary" />
                  <strong>Linear Step</strong>
                </div>
                <p>
                  A straight sequential progression (e.g., <code>run_agent</code>, <code>call_llm</code>). Connects directly to the next step via <em>Continues As</em>.
                </p>
              </div>
              <div className="flowchart-help-card">
                <div className="flowchart-help-card-header">
                  <GitBranch size={14} className="text-primary" />
                  <strong>Branch Step</strong>
                </div>
                <p>
                  A split point triggered by an event (e.g. <code>reasoned</code>) containing multiple branch paths (e.g. <code>execute_tool</code>, <code>call_mcp</code>, <code>direct_complete</code>).
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Journeys & Connecting Steps */}
          <section className="flowchart-help-section">
            <div className="flowchart-help-section-title">
              <Compass size={16} />
              <h3>Journeys & How to Connect Steps in the Editor</h3>
            </div>
            <p className="flowchart-help-desc">
              A <strong>Journey</strong> (or Story/Scenario) is an ordered sequence of step references that simulates a user scenario (e.g. <em>Happy Path</em> or <em>Feedback Loop</em>) during playback animation.
            </p>
            <div className="flowchart-help-instructions">
              <ol className="flowchart-help-steps-list">
                <li>
                  <strong>Create Steps (Steps Tab):</strong> Define your Linear or Branch steps. Each step or branch path automatically generates a unique ID (e.g. <code>run_agent</code>, <code>execute_tool</code>).
                </li>
                <li>
                  <strong>Open Journeys Tab:</strong> Switch to the <strong>Journeys</strong> sub-tab and click <strong>+ Add Journey</strong> (or select an existing journey).
                </li>
                <li>
                  <strong>Add Step Reference:</strong> Click <strong>+ Add Step Ref</strong> inside the journey card.
                </li>
                <li>
                  <strong>Connect Step ID:</strong> Open the <strong>Ref Step ID</strong> dropdown and select your target step or branch path ID from the list.
                </li>
                <li>
                  <strong>Add Playback Details:</strong> Enter a <em>Display Name</em> (e.g., "Launch Agent"), assign a <em>Process Group</em> (e.g., Planning/Execution), and write a <em>Playback Description</em> explaining what happens at this step.
                </li>
              </ol>
            </div>
          </section>

          {/* Section 4: Node Types & Legend */}
          <section className="flowchart-help-section">
            <div className="flowchart-help-section-title">
              <Layers size={16} />
              <h3>Node Types & Color Legend</h3>
            </div>
            <div className="flowchart-help-grid">
              <div className="flowchart-help-card">
                <div className="card-badge card-badge--event">Event</div>
                <p>Domain occurrence in past tense (e.g. <code>Agent Started</code>, <code>Tool Executed</code>).</p>
              </div>
              <div className="flowchart-help-card">
                <div className="card-badge card-badge--policy">Policy</div>
                <p>Reactive business rule evaluating what action to take (e.g. <code>Trigger Planning</code>).</p>
              </div>
              <div className="flowchart-help-card">
                <div className="card-badge card-badge--command">Command</div>
                <p>Action request dispatched to a system handler (e.g. <code>Call LLM</code>, <code>Execute Tool</code>).</p>
              </div>
              <div className="flowchart-help-card">
                <div className="card-badge card-badge--aggregate">Aggregate</div>
                <p>Internal domain aggregate managing state & business rules (e.g. <code>Agent Orchestrator</code>).</p>
              </div>
              <div className="flowchart-help-card">
                <div className="card-badge card-badge--external">External System</div>
                <p>External service or third-party provider (e.g. <code>LLM</code>, <code>MCP Servers</code>).</p>
              </div>
              <div className="flowchart-help-card">
                <div className="card-badge card-badge--user">Actor / User</div>
                <p>Human user or developer initiating the workflow (e.g. <code>Developer</code>, <code>QA Engineer</code>).</p>
              </div>
            </div>
          </section>

          {/* Section 5: View Perspectives */}
          <section className="flowchart-help-section">
            <div className="flowchart-help-section-title">
              <Footprints size={16} />
              <h3>Flowchart View Perspectives & Playback</h3>
            </div>
            <ul className="flowchart-help-list">
              <li>
                <strong>Event Storming:</strong> Full step-by-step chain showing events, policies, commands, and handlers.
              </li>
              <li>
                <strong>System Architecture:</strong> Structural diagram mapping dependencies between Aggregates and External Systems.
              </li>
              <li>
                <strong>Sequence Diagram:</strong> Timeline view of message exchanges between actors and systems over time.
              </li>
              <li>
                <strong>Swimlanes:</strong> Organizes policies and commands inside system boundary lanes.
              </li>
              <li>
                <strong>State Machine:</strong> Visualizes internal states and state transitions for domain aggregates.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
