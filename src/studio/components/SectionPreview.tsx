import { Suspense, useEffect, useMemo, useRef } from 'react'
import { SectionRegistry } from '../../core/learning-engine/registry'
import { bundleToSections } from '../../core/learning-engine/composition/okf/sections'
import { sourceMapOf, type OUISectionPayload } from '../../core/learning-engine/composition/oui/compile'
import { PickSection } from '../../core/supporting/authoring-editor/pick'
import { SectionErrorBoundary } from '../../core/ui-system/primitives/SectionErrorBoundary'

/** Small stable hash so the preview remounts when the section data changes. */
function hash(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

/**
 * Elements drawn by `statement`: those anchored at it exactly, else the
 * outermost ones inside it (e.g. `q2.question` when q2 itself is not tagged).
 */
function elementsOf(root: HTMLElement, statement: string): Element[] {
  const tagged = [...root.querySelectorAll('[data-oui-anchor]')]
  const exact = tagged.filter((el) => el.getAttribute('data-oui-anchor') === statement)
  if (exact.length) return exact
  const inside = tagged.filter((el) => /^[.[]/.test(el.getAttribute('data-oui-anchor')!.slice(statement.length))
    && el.getAttribute('data-oui-anchor')!.startsWith(statement))
  const depth = (el: Element) => el.getAttribute('data-oui-anchor')!.length
  const shallowest = Math.min(...inside.map(depth))
  return inside.filter((el) => depth(el) === shallowest)
}

/**
 * Renders a compiled section with the same components as the learning app.
 * `highlight` outlines what one statement draws (the code line under the pointer).
 */
export function SectionPreview({ payload, file, highlight }: { payload: OUISectionPayload | null; file: string; highlight?: string }) {
  const config = useMemo(() => (payload ? bundleToSections([payload])[0] : null), [payload])
  const key = useMemo(() => (payload ? hash(JSON.stringify(payload)) : 'empty'), [payload])
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root || !highlight) return
    const marked = elementsOf(root, highlight)
    marked.forEach((el) => el.classList.add('pick-linked'))
    return () => marked.forEach((el) => el.classList.remove('pick-linked'))
  }, [highlight, key])

  if (!config) return <p className="studio-empty">Nothing to preview yet. Fix the errors in the code.</p>
  const Component = SectionRegistry.get(config.type)
  if (!Component) return <p className="studio-warning">No renderer registered for "{config.type}".</p>

  return (
    <div ref={rootRef} className="studio-preview topic-content" data-testid="studio-preview" data-section-type={config.type}>
      <SectionErrorBoundary key={key} sectionName={String(config.props.title ?? config.type)}>
        <Suspense fallback={<div className="section-loading">Loading section…</div>}>
          <PickSection file={file} label={String(config.props.title ?? config.type)} sourceMap={sourceMapOf(payload)}>
            <div className="section-wrapper" data-section-type={config.type}>
              <Component key={key} sectionIndex={0} {...config.props} />
            </div>
          </PickSection>
        </Suspense>
      </SectionErrorBoundary>
    </div>
  )
}
