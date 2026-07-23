import { useEffect } from 'react'
import { X, HelpCircle, Film, GitBranch, Award, CheckCircle, Star } from 'lucide-react'
import '../../sections/flowchart/flowchart.css'

interface ScenarioHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ScenarioHelpModal({ isOpen, onClose }: ScenarioHelpModalProps) {
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
      data-testid="sc-help-overlay"
    >
      <div
        className="flowchart-help-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="sc-help-modal"
        role="dialog"
        aria-labelledby="sc-help-title"
      >
        {/* Header */}
        <div className="flowchart-help-header">
          <div className="flowchart-help-title-group">
            <HelpCircle className="flowchart-help-icon" size={20} />
            <h2 id="sc-help-title" className="flowchart-help-title">
              Scenario Section — Concepts &amp; Authoring Guide
            </h2>
          </div>
          <button
            className="flowchart-help-close-btn"
            onClick={onClose}
            data-testid="sc-help-close"
            aria-label="Close help guide"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flowchart-help-body">

          {/* Section 1: What is a Scenario */}
          <section className="flowchart-help-section">
            <div className="flowchart-help-section-title">
              <Film size={16} />
              <h3>What is a Scenario Section?</h3>
            </div>
            <p className="flowchart-help-desc">
              A <strong>Scenario Section</strong> puts learners in the driver's seat of a real-world
              engineering situation (e.g. a production incident, architectural choice, or on-call decision).
              They navigate a series of decisions and receive immediate outcome feedback with a rating and key lesson.
            </p>
          </section>

          {/* Section 2: Node Types */}
          <section className="flowchart-help-section">
            <div className="flowchart-help-section-title">
              <GitBranch size={16} />
              <h3>Node Types</h3>
            </div>
            <div className="flowchart-help-grid">
              <div className="flowchart-help-card">
                <div className="flowchart-help-card-header">
                  <GitBranch size={14} className="text-primary" />
                  <strong>Decision Node</strong>
                </div>
                <p>
                  Contains a <code>prompt</code> (the situation/question) and a list of <code>choices</code>.
                  Each choice has an <code>id</code>, <code>text</code>, and a <code>next</code> pointer to
                  another node ID. Decision nodes do <em>not</em> have an <code>outcome</code>.
                </p>
              </div>
              <div className="flowchart-help-card">
                <div className="flowchart-help-card-header">
                  <Star size={14} className="text-secondary" />
                  <strong>Outcome Node</strong>
                </div>
                <p>
                  A terminal node with an <code>outcome</code> object containing: <code>verdict</code>
                  (what happened), <code>lesson</code> (the key takeaway), and a <code>rating</code>:
                </p>
                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1rem', fontSize: '0.8rem' }}>
                  <li><code>a</code> — Excellent ✓</li>
                  <li><code>b-plus</code> — Good</li>
                  <li><code>b-minus</code> — Fair</li>
                  <li><code>c</code> — Needs Improvement ✗</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3: Rating System */}
          <section className="flowchart-help-section">
            <div className="flowchart-help-section-title">
              <Award size={16} />
              <h3>Rating System</h3>
            </div>
            <p className="flowchart-help-desc">
              Ratings drive the outcome card colour and icon. Use them to signal the quality of the learner's
              choice path:
            </p>
            <div className="flowchart-help-cycle-flow" style={{ flexWrap: 'wrap' }}>
              <span className="cycle-pill" style={{ background: 'color-mix(in srgb, var(--ctp-green) 20%, transparent)', color: 'var(--ctp-green)', border: '1px solid color-mix(in srgb, var(--ctp-green) 40%, transparent)' }}>A — Excellent</span>
              <span className="cycle-pill" style={{ background: 'color-mix(in srgb, var(--ctp-teal) 20%, transparent)', color: 'var(--ctp-teal)', border: '1px solid color-mix(in srgb, var(--ctp-teal) 40%, transparent)' }}>B+ — Good</span>
              <span className="cycle-pill" style={{ background: 'color-mix(in srgb, var(--ctp-yellow) 20%, transparent)', color: 'var(--ctp-yellow)', border: '1px solid color-mix(in srgb, var(--ctp-yellow) 40%, transparent)' }}>B− — Fair</span>
              <span className="cycle-pill" style={{ background: 'color-mix(in srgb, var(--ctp-red) 20%, transparent)', color: 'var(--ctp-red)', border: '1px solid color-mix(in srgb, var(--ctp-red) 40%, transparent)' }}>C — Poor</span>
            </div>
          </section>

          {/* Section 4: Authoring Tips */}
          <section className="flowchart-help-section">
            <div className="flowchart-help-section-title">
              <CheckCircle size={16} />
              <h3>Authoring Tips</h3>
            </div>
            <ul className="flowchart-help-list">
              <li>
                <strong>Start Node:</strong> Set <code>startNode</code> (in Overview) to the ID of the first decision node. Defaults to <code>start</code>.
              </li>
              <li>
                <strong>Every branch must end:</strong> All paths through choice <code>next</code> pointers must
                eventually reach an outcome node or the player gets stuck.
              </li>
              <li>
                <strong>Realistic stakes:</strong> Use real numbers (latency, RPS, SLA %) in prompts to
                make choices feel consequential.
              </li>
              <li>
                <strong>Lessons over verdicts:</strong> The <code>lesson</code> field is what learners remember—
                make it a clear, actionable insight, not just a judgement.
              </li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  )
}
