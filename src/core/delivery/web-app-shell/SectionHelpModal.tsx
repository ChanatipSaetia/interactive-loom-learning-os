import { useEffect } from 'react'
import { X, HelpCircle, BookOpen, Lightbulb, Settings } from 'lucide-react'
import './layout.css'

interface SectionHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SectionHelpModal({ isOpen, onClose }: SectionHelpModalProps) {
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
      className="section-help-overlay"
      onClick={onClose}
      data-testid="section-help-overlay"
      data-lenis-prevent
      data-lenis-prevent-wheel
      data-lenis-prevent-touch
    >
      <div
        className="section-help-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="section-help-modal"
        role="dialog"
        aria-labelledby="section-help-title"
        data-lenis-prevent
        data-lenis-prevent-wheel
        data-lenis-prevent-touch
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="section-help-header">
          <div className="section-help-title-group">
            <HelpCircle className="section-help-icon" size={20} />
            <h2 id="section-help-title" className="section-help-title">
              Section Help & Guide
            </h2>
          </div>
          <button
            className="section-help-close-btn"
            onClick={onClose}
            data-testid="section-help-close"
            aria-label="Close help guide"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="section-help-body">
          <section className="section-help-section">
            <div className="section-help-section-title">
              <BookOpen size={16} />
              <h3>What is this section?</h3>
            </div>
            <p className="section-help-desc">
              This section presents interactive learning content. Each section type offers a different way to engage with the material through quizzes, flowcharts, sandboxes, and more.
            </p>
          </section>

          <section className="section-help-section">
            <div className="section-help-section-title">
              <Lightbulb size={16} />
              <h3>How to use it</h3>
            </div>
            <ul className="section-help-tips">
              <li>Interact with the content to explore concepts</li>
              <li>Use controls within the section to navigate and make choices</li>
              <li>Observe feedback and explanations as you go</li>
            </ul>
          </section>

          <section className="section-help-section">
            <div className="section-help-section-title">
              <Settings size={16} />
              <h3>Section Actions</h3>
            </div>
            <ul className="section-help-tips">
              <li><strong>Edit</strong> - Click the pencil icon to edit this section's content</li>
              <li><strong>Help</strong> - Click the help icon to see this guide</li>
            </ul>
          </section>
        </div>

        <div className="section-help-footer">
          <button className="section-help-btn-primary" onClick={onClose} type="button">
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
