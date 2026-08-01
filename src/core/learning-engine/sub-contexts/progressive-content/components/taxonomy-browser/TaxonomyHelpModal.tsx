import { HelpCircle, X, Layers, ShieldCheck, Palette } from 'lucide-react'

interface TaxonomyHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TaxonomyHelpModal({ isOpen, onClose }: TaxonomyHelpModalProps) {
  if (!isOpen) return null

  return (
    <div className="fc-help-overlay" onClick={onClose} data-testid="taxonomy-help-modal">
      <div className="fc-help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fc-help-header">
          <div className="fc-help-title">
            <HelpCircle size={18} className="text-primary" />
            <span>Taxonomy Browser Section Guide</span>
          </div>
          <button className="fc-help-close" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        <div className="fc-help-content space-y-4">
          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <Layers size={14} /> Overview
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The Taxonomy Browser displays an interactive grid of domain categories. Clicking any category opens an in-depth modal showing conceptual analogies and scope boundaries.
            </p>
          </section>

          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <Palette size={14} /> Visual Identity
            </h4>
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
              <li><strong>Icon:</strong> Any valid Lucide icon name (e.g. <code>Layers</code>, <code>Cpu</code>, <code>Server</code>, <code>Database</code>).</li>
              <li><strong>Color Accent:</strong> Palette color key (<code>blue</code>, <code>peach</code>, <code>pink</code>, <code>mauve</code>, <code>green</code>, <code>teal</code>, etc.).</li>
            </ul>
          </section>

          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <ShieldCheck size={14} /> Scope Boundaries
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use <strong>In Scope</strong> and <strong>Out of Scope</strong> arrays to define explicit system responsibilities, preventing architectural creep.
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
