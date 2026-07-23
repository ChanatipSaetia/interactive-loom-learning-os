import { useEffect } from 'react'
import { X, HelpCircle, Layers, Volume2, MessageSquare, BookOpen, RotateCw } from 'lucide-react'
import './flashcards.css'

interface FlashcardsHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FlashcardsHelpModal({ isOpen, onClose }: FlashcardsHelpModalProps) {
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
      className="fc-help-overlay"
      onClick={onClose}
      data-testid="fc-help-overlay"
    >
      <div
        className="fc-help-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="fc-help-modal"
        role="dialog"
        aria-labelledby="fc-help-title"
      >
        {/* Modal Header */}
        <div className="fc-help-header">
          <div className="fc-help-title-group">
            <HelpCircle className="fc-help-icon" size={20} />
            <h2 id="fc-help-title" className="fc-help-title">
              Flashcard Deck Concepts & Authoring Guide
            </h2>
          </div>
          <button
            className="fc-help-close-btn"
            onClick={onClose}
            data-testid="fc-help-close"
            aria-label="Close help guide"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="fc-help-body">
          {/* Section 1: Flashcard Structure */}
          <section className="fc-help-section">
            <div className="fc-help-section-title">
              <RotateCw size={16} />
              <h3>Dual-Faced Card Anatomy</h3>
            </div>
            <p className="fc-help-desc">
              Flashcards feature a 3D flip card interaction split into two sides:
            </p>

            <div className="fc-help-grid">
              <div className="fc-help-card">
                <div className="card-badge card-badge--front">Front Face</div>
                <p>
                  Prominently displays the <code>word</code>, <code>pronunciation</code>, category badge, and a Text-to-Speech audio button (<Volume2 size={12} style={{ display: 'inline' }} />).
                </p>
              </div>

              <div className="fc-help-card">
                <div className="card-badge card-badge--back">Back Face</div>
                <p>
                  Provides tabbed deep-dives into <strong>Guidelines</strong> (definitions, rationale) and <strong>Interactive Dialogue</strong> (AI thought trace).
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Fields Breakdown */}
          <section className="fc-help-section">
            <div className="fc-help-section-title">
              <BookOpen size={16} />
              <h3>YAML Fields & Schema Details</h3>
            </div>
            <div className="fc-help-grid">
              <div className="fc-help-card">
                <div className="card-badge card-badge--field">Word & Pronunciation</div>
                <p><code>word</code> (term title) & <code>pronunciation</code> (phonetic guide).</p>
              </div>
              <div className="fc-help-card">
                <div className="card-badge card-badge--field">Category</div>
                <p>Design/architecture category (e.g., <em>hierarchy</em>, <em>interaction</em>, <em>accessibility</em>).</p>
              </div>
              <div className="fc-help-card">
                <div className="card-badge card-badge--field">Definitions</div>
                <p><code>shortDefinition</code> (quick summary) and <code>detailedDefinition</code> (in-depth explanation).</p>
              </div>
              <div className="fc-help-card">
                <div className="card-badge card-badge--field">Why It Matters</div>
                <p><code>whyItMatters</code> explains practical importance & engineering tradeoffs.</p>
              </div>
              <div className="fc-help-card" style={{ gridColumn: '1 / -1' }}>
                <div className="card-badge card-badge--dialogue">
                  <MessageSquare size={12} style={{ marginRight: '4px' }} /> Simulated Dialogue
                </div>
                <p>
                  An optional <code>dialogue</code> object (<code>user</code> prompt, <code>aiThoughts</code> internal reasoning, and <code>aiQuestion</code> follow-up) simulating an AI mentor conversation on the card's back face.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Interactive Controls */}
          <section className="fc-help-section">
            <div className="fc-help-section-title">
              <Layers size={16} />
              <h3>Interactive Controls & Navigation</h3>
            </div>
            <ul className="fc-help-list">
              <li>
                <strong>Flipping:</strong> Click anywhere on the card container or press spacebar to flip between Front and Back faces.
              </li>
              <li>
                <strong>Audio Playback:</strong> Click the speaker icon to hear natural speech pronunciation via browser Text-to-Speech.
              </li>
              <li>
                <strong>Deck Navigation:</strong> Use the Left/Right chevron buttons to navigate between cards in the deck.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
