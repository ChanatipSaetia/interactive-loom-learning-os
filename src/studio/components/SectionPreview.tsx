import { Suspense, useMemo } from 'react'
import { SectionRegistry } from '../../core/learning-engine/registry'
import { bundleToSections } from '../../core/learning-engine/composition/okf/sections'
import type { OUISectionPayload } from '../../core/learning-engine/composition/oui/compile'
import { SectionErrorBoundary } from '../../core/ui-system/primitives/SectionErrorBoundary'

/** Small stable hash so the preview remounts when the section data changes. */
function hash(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

/** Renders a compiled section with the same components as the learning app. */
export function SectionPreview({ payload }: { payload: OUISectionPayload | null }) {
  const config = useMemo(() => (payload ? bundleToSections([payload])[0] : null), [payload])
  const key = useMemo(() => (payload ? hash(JSON.stringify(payload)) : 'empty'), [payload])

  if (!config) return <p className="studio-empty">Nothing to preview yet. Fix the errors in the code.</p>
  const Component = SectionRegistry.get(config.type)
  if (!Component) return <p className="studio-warning">No renderer registered for "{config.type}".</p>

  return (
    <div className="studio-preview topic-content" data-testid="studio-preview" data-section-type={config.type}>
      <SectionErrorBoundary key={key} sectionName={String(config.props.title ?? config.type)}>
        <Suspense fallback={<div className="section-loading">Loading section…</div>}>
          <div className="section-wrapper" data-section-type={config.type}>
            <Component key={key} sectionIndex={0} {...config.props} />
          </div>
        </Suspense>
      </SectionErrorBoundary>
    </div>
  )
}
