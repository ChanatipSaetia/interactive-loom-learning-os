import { HelpCircle, X, BookOpen, Code, Type } from 'lucide-react'

interface TextHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TextHelpModal({ isOpen, onClose }: TextHelpModalProps) {
  if (!isOpen) return null

  return (
    <div className="fc-help-overlay" onClick={onClose} data-testid="text-help-modal">
      <div className="fc-help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fc-help-header">
          <div className="fc-help-title">
            <HelpCircle size={18} className="text-primary" />
            <span>Rich Text Section Guide</span>
          </div>
          <button className="fc-help-close" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        <div className="fc-help-content space-y-4">
          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <BookOpen size={14} /> Overview
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The Rich Text section displays structured markdown paragraphs with responsive typography, code highlighting, and interactive links.
            </p>
          </section>

          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <Type size={14} /> Supported Markdown Formatting
            </h4>
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
              <li><code>**Bold text**</code> for strong emphasis</li>
              <li><code>*Italic text*</code> for subtle emphasis</li>
              <li><code>`inline code`</code> for technical terms and syntax</li>
              <li><code>[Link Title](https://example.com)</code> for external resources</li>
              <li><code>## Heading 2</code> or <code>### Heading 3</code> for section titles</li>
            </ul>
          </section>

          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <Code size={14} /> Paragraph Structure
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Each entry in the <strong>paragraphs</strong> array represents an independent block of prose. Reorder paragraphs using the move controls to refine reading flow.
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
