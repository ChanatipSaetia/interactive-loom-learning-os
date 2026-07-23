import { HelpCircle, X, ListOrdered, Move, CheckCircle2 } from 'lucide-react'

interface ReflectionSequenceHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ReflectionSequenceHelpModal({ isOpen, onClose }: ReflectionSequenceHelpModalProps) {
  if (!isOpen) return null

  return (
    <div className="fc-help-overlay" onClick={onClose} data-testid="reflection-sequence-help-modal">
      <div className="fc-help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fc-help-header">
          <div className="fc-help-title">
            <HelpCircle size={18} className="text-primary" />
            <span>Reflection Sequence Challenge Guide</span>
          </div>
          <button className="fc-help-close" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        <div className="fc-help-content space-y-4">
          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <ListOrdered size={14} /> Overview
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The Reflection Sequence challenge tests learners on mapping procedural steps, message ordering, or execution sequences using interactive drag-and-drop or tap placement.
            </p>
          </section>

          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <Move size={14} /> Items & Solution Mapping
            </h4>
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
              <li><strong>Pool Items:</strong> The set of available cards presented to the learner in scrambled order.</li>
              <li><strong>Solution Array:</strong> The exact ordered sequence of item IDs required to solve the challenge.</li>
            </ul>
          </section>

          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <CheckCircle2 size={14} /> Multi-Challenge Support
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You can define multiple sequential challenges per section. Learners navigate between challenges using pagination controls.
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
