import type { ReactNode } from 'react'
import type { SectionConfig } from '../../learning-engine/registry'
import { SectionErrorPlaceholder, SectionValidationBadge } from '../../ui-system/primitives/SectionErrorPlaceholder'

/**
 * Applies a section's Validation Gateway outcome: failed sections keep their
 * slot as a placeholder; sections with warnings render with a dev-only badge.
 */
export function ValidatedSection({ config, children }: { config: SectionConfig; children: ReactNode }) {
  const validation = config.validation
  if (validation?.status === 'error') {
    return <SectionErrorPlaceholder sectionType={config.type || undefined} diagnostics={validation.diagnostics} />
  }
  return (
    <>
      {validation?.status === 'warning' && <SectionValidationBadge diagnostics={validation.diagnostics} />}
      {children}
    </>
  )
}
