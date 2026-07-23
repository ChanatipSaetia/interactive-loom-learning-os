import { useEffect } from 'react'
import { X, HelpCircle, CheckSquare, Award } from 'lucide-react'
import './quiz.css'

interface QuizHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuizHelpModal({ isOpen, onClose }: QuizHelpModalProps) {
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
      className="qz-help-overlay"
      onClick={onClose}
      data-testid="qz-help-overlay"
    >
      <div
        className="qz-help-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="qz-help-modal"
        role="dialog"
        aria-labelledby="qz-help-title"
      >
        {/* Modal Header */}
        <div className="qz-help-header">
          <div className="qz-help-title-group">
            <HelpCircle className="qz-help-icon" size={20} />
            <h2 id="qz-help-title" className="qz-help-title">
              Quiz Section Concepts & Guide
            </h2>
          </div>
          <button
            className="qz-help-close-btn"
            onClick={onClose}
            data-testid="qz-help-close"
            aria-label="Close help guide"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="qz-help-body">
          {/* Section 1: Overview */}
          <section className="qz-help-section">
            <div className="qz-help-section-title">
              <CheckSquare size={16} />
              <h3>What is a Quiz Section?</h3>
            </div>
            <p className="qz-help-desc">
              The <strong>Quiz Section</strong> presents multiple-choice assessment questions with real-time feedback, detailed explanations, and score tracking.
            </p>
          </section>

          {/* Section 2: Structure Breakdown */}
          <section className="qz-help-section">
            <div className="qz-help-section-title">
              <Award size={16} />
              <h3>Questions & Explanations</h3>
            </div>
            <div className="qz-help-grid">
              <div className="qz-help-card">
                <div className="card-badge card-badge--question">Multiple Choice Questions</div>
                <p>
                  Each question has a <code>question</code> prompt, an array of <code>options</code> (with <code>id</code> and <code>text</code>), and an <code>answer</code> ID.
                </p>
              </div>

              <div className="qz-help-card">
                <div className="card-badge card-badge--explain">Explanations</div>
                <p>
                  Includes an <code>explanation</code> field providing pedagogical rationale after the learner selects an answer.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
