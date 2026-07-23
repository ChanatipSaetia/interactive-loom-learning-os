import { useEffect } from 'react'
import { X, HelpCircle, Film, Award, CheckCircle } from 'lucide-react'
import './scenario.css'

interface ScenarioHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ScenarioHelpModal({ isOpen, onClose }: ScenarioHelpModalProps) {
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
      className="sc-help-overlay"
      onClick={onClose}
      data-testid="sc-help-overlay"
    >
      <div
        className="sc-help-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="sc-help-modal"
        role="dialog"
        aria-labelledby="sc-help-title"
      >
        {/* Modal Header */}
        <div className="sc-help-header">
          <div className="sc-help-title-group">
            <HelpCircle className="sc-help-icon" size={20} />
            <h2 id="sc-help-title" className="sc-help-title">
              Scenario Section Concepts & Authoring Guide
            </h2>
          </div>
          <button
            className="sc-help-close-btn"
            onClick={onClose}
            data-testid="sc-help-close"
            aria-label="Close help guide"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="sc-help-body">
          {/* Section 1: Overview */}
          <section className="sc-help-section">
            <div className="sc-help-section-title">
              <Film size={16} />
              <h3>What is a Scenario Section?</h3>
            </div>
            <p className="sc-help-desc">
              A <strong>Scenario Section</strong> presents real-world practical challenges (e.g. system outages, architectural tradeoffs) where learners evaluate scenarios, observe outcomes, and review structured evaluation feedback.
            </p>
          </section>

          {/* Section 2: Structure Breakdown */}
          <section className="sc-help-section">
            <div className="sc-help-section-title">
              <Award size={16} />
              <h3>Scenarios vs. Evaluations</h3>
            </div>
            <div className="sc-help-grid">
              <div className="sc-help-card">
                <div className="card-badge card-badge--scenario">Scenario Details</div>
                <p>
                  Defines the problem setup (<code>title</code>, <code>description</code>, <code>context</code>) and list of selectable options or choices.
                </p>
              </div>

              <div className="sc-help-card">
                <div className="card-badge card-badge--eval">Evaluation Criteria</div>
                <p>
                  Maps learner decisions to scoring parameters, key takeaways, and detailed explanations of why a choice is optimal or flawed.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Authoring Guide */}
          <section className="sc-help-section">
            <div className="sc-help-section-title">
              <CheckCircle size={16} />
              <h3>Authoring Best Practices</h3>
            </div>
            <ul className="sc-help-list">
              <li>
                <strong>Provide Realistic Context:</strong> Use real system parameters (e.g. 10k RPS, 99.99% SLA) to anchor the decision.
              </li>
              <li>
                <strong>Clear Explanations:</strong> Ensure evaluation criteria explicitly explain engineering trade-offs for each option.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
