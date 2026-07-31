import { useEffect } from 'react'
import { X, HelpCircle, Sparkles, BookOpen, Target, Lightbulb, MapPin } from 'lucide-react'

interface IntroHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function IntroHelpModal({ isOpen, onClose }: IntroHelpModalProps) {
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
      className="intro-help-overlay"
      onClick={onClose}
      data-testid="intro-help-overlay"
    >
      <div
        className="intro-help-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="intro-help-modal"
        role="dialog"
        aria-labelledby="intro-help-title"
      >
        {/* Modal Header */}
        <div className="intro-help-header">
          <div className="intro-help-title-group">
            <HelpCircle className="intro-help-icon" size={20} />
            <h2 id="intro-help-title" className="intro-help-title">
              Topic Intro & Overview Guide
            </h2>
          </div>
          <button
            className="intro-help-close-btn"
            onClick={onClose}
            data-testid="intro-help-close"
            aria-label="Close help guide"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="intro-help-body">
          {/* Section 1: Overview */}
          <section className="intro-help-section">
            <div className="intro-help-section-title">
              <Sparkles size={16} />
              <h3>The Intro Section Structure</h3>
            </div>
            <p className="intro-help-desc">
              The <strong>Intro Section</strong> sets up learner context at the start of a topic module. It breaks down complex ideas into 3 core pillars: <strong>Definition</strong>, <strong>What & Why</strong>, and an interactive <strong>Learning Roadmap</strong>.
            </p>
          </section>

          {/* Section 2: Core Components */}
          <section className="intro-help-section">
            <div className="intro-help-section-title">
              <BookOpen size={16} />
              <h3>Pillar Breakdown & YAML Schemas</h3>
            </div>

            <div className="intro-help-grid">
              <div className="intro-help-card">
                <div className="card-badge card-badge--hero">
                  <Sparkles size={12} style={{ marginRight: '4px' }} /> Hero & Metadata
                </div>
                <p>
                  Module title, subtitle, estimated completion time (e.g., <code>15 mins</code>), and number of modules.
                </p>
              </div>

              <div className="intro-help-card">
                <div className="card-badge card-badge--def">
                  <BookOpen size={12} style={{ marginRight: '4px' }} /> Definition
                </div>
                <p>
                  Formal 1-2 sentence core concept definition (under <code>what.definition</code>).
                </p>
              </div>

              <div className="intro-help-card">
                <div className="card-badge card-badge--what">
                  <Target size={12} style={{ marginRight: '4px' }} /> What This Covers
                </div>
                <p>
                  High-level summary (<code>what.summary</code>), bullet points (<code>what.bullets</code>), and topic tags.
                </p>
              </div>

              <div className="intro-help-card">
                <div className="card-badge card-badge--why">
                  <Lightbulb size={12} style={{ marginRight: '4px' }} /> Why It Matters
                </div>
                <p>
                  Practical rationale (<code>why.summary</code>) and key takeaway impact (<code>why.impact</code>).
                </p>
              </div>

              <div className="intro-help-card" style={{ gridColumn: '1 / -1' }}>
                <div className="card-badge card-badge--roadmap">
                  <MapPin size={12} style={{ marginRight: '4px' }} /> Learning Roadmap
                </div>
                <p>
                  Interactive pipeline showing upcoming sections (e.g. <code>flowchart</code>, <code>tradeoff-sandbox</code>, <code>quiz</code>). Each step can link to a section ID to smooth-scroll directly to it when clicked.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Authoring Tips */}
          <section className="intro-help-section">
            <div className="intro-help-section-title">
              <Target size={16} />
              <h3>Authoring Best Practices</h3>
            </div>
            <ul className="intro-help-list">
              <li>
                <strong>Keep Definitions Punchy:</strong> Ensure <code>what.definition</code> gives a clear, direct answer before diving into details.
              </li>
              <li>
                <strong>Highlight Practical Impact:</strong> Use <code>why.impact</code> for a bold single-line takeaway that answers "Why should I care?".
              </li>
              <li>
                <strong>Map Roadmap Steps:</strong> Specify exact section IDs in <code>roadmap</code> so learners can click pipeline steps to jump directly to those exercises.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
