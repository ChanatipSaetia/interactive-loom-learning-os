import { AlertTriangle } from 'lucide-react'
import type { ValidationDiagnostic } from '../../learning-engine/validation/types'
import './section-error-placeholder.css'

interface SectionErrorPlaceholderProps {
  sectionType?: string
  diagnostics: ValidationDiagnostic[]
  /** Show full diagnostics (authoring) instead of the learner-facing notice. Defaults to dev mode. */
  showDiagnostics?: boolean
}

/**
 * Keeps a failed section's slot in the lesson stream. Authors see every
 * diagnostic with its file, position, and fix hint; learners see a short notice.
 */
export function SectionErrorPlaceholder({
  sectionType,
  diagnostics,
  showDiagnostics = import.meta.env.DEV,
}: SectionErrorPlaceholderProps) {
  return (
    <div className="section-error-placeholder" data-testid="section-error-placeholder" data-section-type={sectionType}>
      <div className="section-error-placeholder-header">
        <AlertTriangle size={20} aria-hidden="true" />
        <h4>{showDiagnostics ? `Section failed validation${sectionType ? ` (${sectionType})` : ''}` : 'This section couldn’t be loaded'}</h4>
      </div>
      {showDiagnostics ? (
        <DiagnosticList diagnostics={diagnostics} />
      ) : (
        <p className="section-error-placeholder-notice">The rest of the lesson is still available.</p>
      )}
    </div>
  )
}

function DiagnosticList({ diagnostics }: { diagnostics: ValidationDiagnostic[] }) {
  return (
    <ul className="section-error-placeholder-diagnostics">
      {diagnostics.map((d, i) => (
        <li key={i}>
          <div className="section-error-placeholder-location">
            Tier {d.tier}
            {d.file && ` · ${d.file}`}
            {d.line !== undefined && `:${d.line}${d.column !== undefined ? `:${d.column}` : ''}`}
            {d.field && ` · ${d.field}`}
          </div>
          <div>{d.message}</div>
          {d.fixHint && <div className="section-error-placeholder-hint">Fix: {d.fixHint}</div>}
        </li>
      ))}
    </ul>
  )
}

/** Development-only badge listing Tier 3 warnings above a section that still renders. */
export function SectionValidationBadge({ diagnostics }: { diagnostics: ValidationDiagnostic[] }) {
  if (!import.meta.env.DEV || diagnostics.length === 0) return null
  return (
    <details className="section-validation-badge" data-testid="section-validation-badge">
      <summary>⚠ {diagnostics.length} validation warning{diagnostics.length === 1 ? '' : 's'}</summary>
      <DiagnosticList diagnostics={diagnostics} />
    </details>
  )
}
