import { useEffect } from 'react'
import { X, HelpCircle, GitBranch, CheckSquare, Share2, Plus } from 'lucide-react'
import '../../../process-simulation/components/flowchart/flowchart.css'

interface DecisionTreeHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DecisionTreeHelpModal({ isOpen, onClose }: DecisionTreeHelpModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="flowchart-help-overlay"
      onClick={onClose}
      data-testid="dt-help-overlay"
    >
      <div
        className="flowchart-help-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="dt-help-modal"
        role="dialog"
        aria-labelledby="dt-help-title"
      >
        {/* Header */}
        <div className="flowchart-help-header">
          <div className="flowchart-help-title-group">
            <HelpCircle className="flowchart-help-icon" size={20} />
            <h2 id="dt-help-title" className="flowchart-help-title">
              Decision Tree — Concepts &amp; Authoring Guide
            </h2>
          </div>
          <button
            className="flowchart-help-close-btn"
            onClick={onClose}
            data-testid="dt-help-close"
            aria-label="Close help guide"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flowchart-help-body">

          {/* Section 1: What is a Decision Tree */}
          <section className="flowchart-help-section">
            <div className="flowchart-help-section-title">
              <GitBranch size={16} />
              <h3>What is a Decision Tree?</h3>
            </div>
            <p className="flowchart-help-desc">
              A <strong>Decision Tree</strong> guides learners through an interactive series of branching
              questions. Each node presents a prompt with selectable choices that lead to other nodes or
              final recommendation leaves. Great for teaching architectural trade-offs and decision-making frameworks.
            </p>
          </section>

          {/* Section 2: Node Types */}
          <section className="flowchart-help-section">
            <div className="flowchart-help-section-title">
              <Share2 size={16} />
              <h3>Node Types</h3>
            </div>
            <div className="flowchart-help-grid">
              <div className="flowchart-help-card">
                <div className="flowchart-help-card-header">
                  <GitBranch size={14} className="text-primary" />
                  <strong>Decision Node</strong>
                </div>
                <p>
                  Presents a <code>prompt</code> (the question) and a list of <code>choices</code>.
                  Each choice has an <code>id</code>, <code>text</code>, optional <code>rationale</code>,
                  and a <code>next</code> pointer to another node ID.
                  Mark one choice as <code>recommended</code> to highlight it with a badge.
                </p>
              </div>
              <div className="flowchart-help-card">
                <div className="flowchart-help-card-header">
                  <CheckSquare size={14} className="text-secondary" />
                  <strong>Leaf Node (Recommendation)</strong>
                </div>
                <p>
                  A terminal node with a final <code>recommendation</code> (the verdict),
                  an <code>explanation</code> of why, and a list of <code>tradeoffs</code>
                  (pros/cons bullets). Rendered as the success card after all decisions are made.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Authoring Tips */}
          <section className="flowchart-help-section">
            <div className="flowchart-help-section-title">
              <Plus size={16} />
              <h3>Authoring Tips</h3>
            </div>
            <ul className="flowchart-help-list">
              <li>
                <strong>Start Node:</strong> Set <code>root</code> in Tree Settings to the ID of the first decision node.
              </li>
              <li>
                <strong>Choice → Next:</strong> Every choice's <code>next</code> must point to an existing node ID.
                The sidebar dropdown shows all available IDs.
              </li>
              <li>
                <strong>Leaf nodes:</strong> Nodes with no choices and a <code>leaf</code> object are terminal.
                Ensure every branch terminates at a leaf.
              </li>
              <li>
                <strong>Recommended:</strong> Tick the checkbox on at most one choice per node to highlight the preferred path.
              </li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  )
}
