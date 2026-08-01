import { useEffect } from 'react'
import { X, HelpCircle, Sliders, Shield, Compass } from 'lucide-react'
import './tradeoff.css'

interface TradeoffHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TradeoffHelpModal({ isOpen, onClose }: TradeoffHelpModalProps) {
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
      className="to-help-overlay"
      onClick={onClose}
      data-testid="to-help-overlay"
    >
      <div
        className="to-help-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="to-help-modal"
        role="dialog"
        aria-labelledby="to-help-title"
      >
        {/* Modal Header */}
        <div className="to-help-header">
          <div className="to-help-title-group">
            <HelpCircle className="to-help-icon" size={20} />
            <h2 id="to-help-title" className="to-help-title">
              Trade-off Sandbox Concepts & Guide
            </h2>
          </div>
          <button
            className="to-help-close-btn"
            onClick={onClose}
            data-testid="to-help-close"
            aria-label="Close help guide"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="to-help-body">
          {/* Section 1: Overview */}
          <section className="to-help-section">
            <div className="to-help-section-title">
              <Sliders size={16} />
              <h3>What is a Trade-off Sandbox?</h3>
            </div>
            <p className="to-help-desc">
              The <strong>Trade-off Sandbox</strong> allows learners to interactively manipulate system parameters (sliders, toggles) and observe dynamic metrics and trade-off results in real-time.
            </p>
          </section>

          {/* Section 2: Structure Breakdown */}
          <section className="to-help-section">
            <div className="to-help-section-title">
              <Compass size={16} />
              <h3>Scenarios & Parameters Breakdown</h3>
            </div>
            <div className="to-help-grid">
              <div className="to-help-card">
                <div className="card-badge card-badge--scenario">Interactive Scenarios</div>
                <p>
                  Defines specific test scenarios (e.g. <em>High Concurrency Spike</em>, <em>Network Partition</em>) with default parameter states.
                </p>
              </div>

              <div className="to-help-card">
                <div className="card-badge card-badge--param">System Parameters</div>
                <p>
                  Configurable variables with min/max bounds, default values, step sizes, and display units (e.g. <code>batch_size</code>, <code>timeout_ms</code>).
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Authoring Tips */}
          <section className="to-help-section">
            <div className="to-help-section-title">
              <Shield size={16} />
              <h3>Authoring Best Practices</h3>
            </div>
            <ul className="to-help-list">
              <li>
                <strong>Realistic Sliders:</strong> Set meaningful min, max, and step increments so parameters match actual system behavior.
              </li>
              <li>
                <strong>Clear Units:</strong> Specify explicit units (e.g., <code>ms</code>, <code>RPS</code>, <code>MB</code>) for clear learner feedback.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
