import { useEffect } from 'react'
import { X, HelpCircle, GitBranch, Share2 } from 'lucide-react'
import './decision-tree.css'

interface DecisionTreeHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DecisionTreeHelpModal({ isOpen, onClose }: DecisionTreeHelpModalProps) {
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
      className="dt-help-overlay"
      onClick={onClose}
      data-testid="dt-help-overlay"
    >
      <div
        className="dt-help-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="dt-help-modal"
        role="dialog"
        aria-labelledby="dt-help-title"
      >
        {/* Modal Header */}
        <div className="dt-help-header">
          <div className="dt-help-title-group">
            <HelpCircle className="dt-help-icon" size={20} />
            <h2 id="dt-help-title" className="dt-help-title">
              Decision Tree Concepts & Guide
            </h2>
          </div>
          <button
            className="dt-help-close-btn"
            onClick={onClose}
            data-testid="dt-help-close"
            aria-label="Close help guide"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="dt-help-body">
          {/* Section 1: Overview */}
          <section className="dt-help-section">
            <div className="dt-help-section-title">
              <GitBranch size={16} />
              <h3>What is a Decision Tree?</h3>
            </div>
            <p className="dt-help-desc">
              A <strong>Decision Tree</strong> guides learners through branching decision paths. Each node represents a question or decision point, leading to sub-nodes or final recommendation leaves.
            </p>
          </section>

          {/* Section 2: Node Anatomy */}
          <section className="dt-help-section">
            <div className="dt-help-section-title">
              <Share2 size={16} />
              <h3>Tree Nodes & Options</h3>
            </div>
            <div className="dt-help-grid">
              <div className="dt-help-card">
                <div className="card-badge card-badge--node">Decision Node</div>
                <p>
                  Contains a <code>label</code> (question title), <code>description</code>, and a set of branching <code>options</code> pointing to next node IDs.
                </p>
              </div>

              <div className="dt-help-card">
                <div className="card-badge card-badge--leaf">Recommendation Leaf</div>
                <p>
                  A final node with specific recommendation text, trade-offs, and architectural guidance.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
