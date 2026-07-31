import { HelpCircle, X, FileCode, Tag, CheckCircle2 } from 'lucide-react'

interface ReflectionTemplateHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ReflectionTemplateHelpModal({ isOpen, onClose }: ReflectionTemplateHelpModalProps) {
  if (!isOpen) return null

  return (
    <div className="fc-help-overlay" onClick={onClose} data-testid="reflection-template-help-modal">
      <div className="fc-help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fc-help-header">
          <div className="fc-help-title">
            <HelpCircle size={18} className="text-primary" />
            <span>Reflection Template Fill-In-Blank Guide</span>
          </div>
          <button className="fc-help-close" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        <div className="fc-help-content space-y-4">
          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <FileCode size={14} /> Overview
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The Reflection Template challenge asks learners to complete an explanation or formula sentence structure by dragging or tapping term chips into designated drop zones.
            </p>
          </section>

          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <Tag size={14} /> Drop Zone Syntax
            </h4>
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
              <li>Embed <code>{"{zone-id}"}</code> in the template string (e.g. <code>{"The system uses {zone-1} to handle {zone-2}."}</code>).</li>
              <li>Each <code>{"{zone-id}"}</code> renders as an interactive fill-in dropzone slot.</li>
            </ul>
          </section>

          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <CheckCircle2 size={14} /> Solution Mapping
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Map each <code>zone-id</code> key to the matching correct <code>chip-id</code> in the Solution Configuration section.
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
