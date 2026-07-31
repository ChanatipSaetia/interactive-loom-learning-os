import { useEffect } from 'react'
import { X, HelpCircle, Binary, Calculator } from 'lucide-react'
import './formula.css'

interface FormulaHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FormulaHelpModal({ isOpen, onClose }: FormulaHelpModalProps) {
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
      className="fm-help-overlay"
      onClick={onClose}
      data-testid="fm-help-overlay"
    >
      <div
        className="fm-help-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="fm-help-modal"
        role="dialog"
        aria-labelledby="fm-help-title"
      >
        {/* Modal Header */}
        <div className="fm-help-header">
          <div className="fm-help-title-group">
            <HelpCircle className="fm-help-icon" size={20} />
            <h2 id="fm-help-title" className="fm-help-title">
              Formula Sandbox Concepts & Guide
            </h2>
          </div>
          <button
            className="fm-help-close-btn"
            onClick={onClose}
            data-testid="fm-help-close"
            aria-label="Close help guide"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="fm-help-body">
          {/* Section 1: Overview */}
          <section className="fm-help-section">
            <div className="fm-help-section-title">
              <Calculator size={16} />
              <h3>What is a Formula Sandbox?</h3>
            </div>
            <p className="fm-help-desc">
              The <strong>Formula Sandbox</strong> lets learners manipulate numerical variables in mathematical or system performance equations to observe real-time dynamic output calculations.
            </p>
          </section>

          {/* Section 2: Structure Breakdown */}
          <section className="fm-help-section">
            <div className="fm-help-section-title">
              <Binary size={16} />
              <h3>Formula Expression & Variables</h3>
            </div>
            <div className="fm-help-grid">
              <div className="fm-help-card">
                <div className="card-badge card-badge--expr">Formula Expression</div>
                <p>
                  LaTeX or mathematical expression (e.g. <code>RPS = \frac&#123;N&#125;&#123;T&#125;</code>) defining the calculated equation.
                </p>
              </div>

              <div className="fm-help-card">
                <div className="card-badge card-badge--var">Variables</div>
                <p>
                  Array of input variables with <code>symbol</code>, <code>label</code>, <code>min</code>, <code>max</code>, <code>step</code>, <code>default</code>, and <code>unit</code>.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
