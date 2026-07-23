import { useEffect } from 'react'
import { X, HelpCircle, Share2, GitCommit, ArrowRight, Eye, MousePointer } from 'lucide-react'

interface ConceptMapHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ConceptMapHelpModal({ isOpen, onClose }: ConceptMapHelpModalProps) {
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
      className="cm-help-overlay"
      onClick={onClose}
      data-testid="cm-help-overlay"
    >
      <div
        className="cm-help-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="cm-help-modal"
        role="dialog"
        aria-labelledby="cm-help-title"
      >
        {/* Modal Header */}
        <div className="cm-help-header">
          <div className="cm-help-title-group">
            <HelpCircle className="cm-help-icon" size={20} />
            <h2 id="cm-help-title" className="cm-help-title">
              Concept Map Guide & Concepts
            </h2>
          </div>
          <button
            className="cm-help-close-btn"
            onClick={onClose}
            data-testid="cm-help-close"
            aria-label="Close help guide"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="cm-help-body">
          {/* Section 1: Overview */}
          <section className="cm-help-section">
            <div className="cm-help-section-title">
              <Share2 size={16} />
              <h3>What is a Concept Map?</h3>
            </div>
            <p className="cm-help-desc">
              A <strong>Concept Map</strong> is a visual graph that illustrates relationships between concepts, patterns, mechanisms, and systems. Nodes represent key domain ideas, while directed edges show how they connect.
            </p>

            <div className="cm-help-edge-flow">
              <span className="cm-pill cm-pill--node">Node A (From)</span>
              <ArrowRight size={14} className="cm-arrow" />
              <span className="cm-pill cm-pill--edge">Relationship Label</span>
              <ArrowRight size={14} className="cm-arrow" />
              <span className="cm-pill cm-pill--node">Node B (To)</span>
            </div>
          </section>

          {/* Section 2: Categories & Color Legend */}
          <section className="cm-help-section">
            <div className="cm-help-section-title">
              <GitCommit size={16} />
              <h3>Node Categories & Color Legend</h3>
            </div>
            <div className="cm-help-grid">
              <div className="cm-help-card">
                <div className="card-badge card-badge--pattern">pattern</div>
                <p>Architectural design patterns (e.g. <code>EventStorming</code>, <code>Saga</code>).</p>
              </div>
              <div className="cm-help-card">
                <div className="card-badge card-badge--mechanism">mechanism</div>
                <p>Technical mechanisms or protocols (e.g. <code>PubSub</code>, <code>RPC</code>).</p>
              </div>
              <div className="cm-help-card">
                <div className="card-badge card-badge--concept">concept</div>
                <p>General domain concepts or core principles.</p>
              </div>
              <div className="cm-help-card">
                <div className="card-badge card-badge--role">role</div>
                <p>System roles or actor responsibilities.</p>
              </div>
              <div className="cm-help-card">
                <div className="card-badge card-badge--system">system</div>
                <p>Services or infrastructure subsystems.</p>
              </div>
              <div className="cm-help-card">
                <div className="card-badge card-badge--data">data</div>
                <p>Data entities or state payloads.</p>
              </div>
              <div className="cm-help-card">
                <div className="card-badge card-badge--process">process</div>
                <p>Execution workflows or process steps.</p>
              </div>
              <div className="cm-help-card">
                <div className="card-badge card-badge--default">default</div>
                <p>Standard uncategorized nodes.</p>
              </div>
            </div>
          </section>

          {/* Section 3: Interactive Features */}
          <section className="cm-help-section">
            <div className="cm-help-section-title">
              <Eye size={16} />
              <h3>Interactive Map Features</h3>
            </div>
            <ul className="cm-help-list">
              <li>
                <strong>Hover Highlighting:</strong> Hovering over any node highlights all of its direct incoming/outgoing connections while dimming unrelated nodes.
              </li>
              <li>
                <strong>Component Grouping:</strong> Disconnected graphs are automatically detected and can be toggled via the graph badge (e.g. <code>1 / 2</code>).
              </li>
              <li>
                <strong>Zoom & Pan:</strong> Use mouse wheel, pinch gesture, or drag the canvas to pan across large concept graphs.
              </li>
            </ul>
          </section>

          {/* Section 4: Editor Guide */}
          <section className="cm-help-section">
            <div className="cm-help-section-title">
              <MousePointer size={16} />
              <h3>Authoring & Editing Guide</h3>
            </div>
            <ul className="cm-help-list">
              <li>
                <strong>Adding Nodes:</strong> Provide a unique <code>ID</code>, descriptive <code>Title</code>, and select a <code>Category</code> to apply color coding.
              </li>
              <li>
                <strong>Adding Edges:</strong> Select a <code>From</code> node and a <code>To</code> node, then add an optional <code>Relation Label</code> (e.g., <em>triggers</em>, <em>contains</em>, <em>depends on</em>).
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
