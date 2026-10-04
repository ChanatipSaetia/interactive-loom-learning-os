import { HelpCircle, X, Grid, Columns, Rows, ShieldCheck, Waypoints } from 'lucide-react'

interface PillarLayerHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PillarLayerHelpModal({ isOpen, onClose }: PillarLayerHelpModalProps) {
  if (!isOpen) return null

  return (
    <div className="fc-help-overlay" onClick={onClose} data-testid="pillar-layer-help-modal">
      <div className="fc-help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fc-help-header">
          <div className="fc-help-title">
            <HelpCircle size={18} className="text-primary" />
            <span>Pillar & Layer Section Guide</span>
          </div>
          <button className="fc-help-close" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        <div className="fc-help-content space-y-4">
          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <Waypoints size={14} /> Reading the Stack
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Layers run from top to bottom, and each block lists what it <strong>uses</strong>. Tap a block to trace
              what it <strong>needs</strong> (marked below it) and what it <strong>affects</strong> if it changes
              (marked above it); everything else fades. On narrow screens each layer becomes a band and blocks wrap
              under it; on wide screens they keep their columns and spans.
            </p>
          </section>

          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <Grid size={14} /> 2D Grid Architecture
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The Pillar and Layer section structures systems into horizontal strata (Layers) and vertical functional domains (Pillars). Blocks are positioned anywhere in the 2D matrix.
            </p>
          </section>

          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <Columns size={14} /> Columns (Pillars) & Rows (Layers)
            </h4>
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
              <li><strong>Pillars:</strong> Vertical columns (e.g. <code>Identity</code>, <code>Commerce</code>, <code>Analytics</code>).</li>
              <li><strong>Full-Width Layers:</strong> Horizontal rows spanning across all pillars (e.g. <code>API Gateway</code>, <code>Cloud Infra</code>).</li>
              <li><strong>Matrix Layers:</strong> Standard rows containing grid cell blocks.</li>
            </ul>
          </section>

          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <Rows size={14} /> 2D Spanning (col_span & row_span)
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Set <code>col_span</code> to span multiple pillars horizontally, or <code>row_span</code> to span multiple layers vertically (e.g. cross-cutting security controllers).
            </p>
          </section>

          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <ShieldCheck size={14} /> Spatial Integrity & Validation
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tier 3 validation automatically verifies grid boundary constraints and ensures no two rectangular blocks collide on the 2D grid matrix.
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
