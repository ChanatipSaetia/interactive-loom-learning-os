import { HelpCircle, X, List, Layers, ArrowRight } from 'lucide-react'

interface BulletsHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BulletsHelpModal({ isOpen, onClose }: BulletsHelpModalProps) {
  if (!isOpen) return null

  return (
    <div className="fc-help-overlay" onClick={onClose} data-testid="bullets-help-modal">
      <div className="fc-help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fc-help-header">
          <div className="fc-help-title">
            <HelpCircle size={18} className="text-primary" />
            <span>Bullet Points Section Guide</span>
          </div>
          <button className="fc-help-close" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        <div className="fc-help-content space-y-4">
          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <List size={14} /> Overview
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The Bullet Points section presents key concepts, hierarchical breakdowns, or ordered steps with interactive collapsible cards.
            </p>
          </section>

          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <Layers size={14} /> Hierarchical Structure
            </h4>
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
              <li><strong>Top-Level Bullets:</strong> Rendered as expandable cards with primary accent markers.</li>
              <li><strong>Nested Children:</strong> Add sub-bullets inside items to create deep concept hierarchies.</li>
              <li><strong>Ordering:</strong> Toggle between Unordered (bullet markers) and Ordered (numbered lists).</li>
            </ul>
          </section>

          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <ArrowRight size={14} /> Best Practices
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Keep top-level bullet text concise (1-2 sentences). Use child bullets for supporting details, technical specifications, or examples.
            </p>
          </section>
        </div>

        <div className="fc-help-footer">
          <button className="fc-help-btn-primary" onClick={onClose} type="button">
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
