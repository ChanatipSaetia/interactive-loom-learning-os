import { HelpCircle, X, BookOpen, Code, Blocks } from 'lucide-react'
import { standardOpenUISpec } from '../../openui-standard'

interface OpenUIHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

const EXAMPLE = `// @openui "Plans" "Pick the one that fits"
root = Card([header, tabs])
header = CardHeader("Plans", "Compare what you get")
tabs = Tabs([
  TabItem("free", "Free", [TextContent("Up to **3** projects.")]),
  TabItem("pro", "Pro", [TextContent("Unlimited projects.")])
])`

export function OpenUIHelpModal({ isOpen, onClose }: OpenUIHelpModalProps) {
  if (!isOpen) return null

  const groups = standardOpenUISpec.componentGroups

  return (
    <div className="fc-help-overlay" onClick={onClose} data-testid="openui-help-modal">
      <div className="fc-help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fc-help-header">
          <div className="fc-help-title">
            <HelpCircle size={18} className="text-primary" />
            <span>OpenUI Section Guide</span>
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
              An OpenUI section renders any program written with the standard OpenUI component library: cards, tabs,
              tables, charts, accordions, steps, callouts, code blocks and more. Use it when <code>text</code> or{' '}
              <code>bullets</code> can't express the layout you need.
            </p>
          </section>

          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <Code size={14} /> File format
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Start the section file with <code>// @openui "Title" "Optional heading"</code>. Everything below it is a
              plain OpenUI Lang program with a <code>root = …</code> statement.
            </p>
            <pre className="text-xs">{EXAMPLE}</pre>
          </section>

          <section className="fc-help-section">
            <h4 className="flex items-center gap-2 text-primary font-bold text-sm">
              <Blocks size={14} /> Components
            </h4>
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
              {groups.map((g) => (
                <li key={g.name}>
                  <strong>{g.name}:</strong> {g.components.join(', ')}
                </li>
              ))}
            </ul>
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
