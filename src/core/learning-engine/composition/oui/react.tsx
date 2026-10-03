/**
 * React bridge for `@openuidev/react-lang`.
 *
 * Builds a react-lang library from the Loom OpenUI components so a `.oui`
 * section can be rendered directly with OpenUI's `<Renderer>` (streaming,
 * live `$state`). Section components compile their evaluated props to
 * section data and render through the host's `renderSection`, i.e. the
 * existing SectionRegistry components. Data components (questions, steps,
 * …) are consumed by their section and render nothing themselves.
 */
import { useMemo, type ReactNode } from 'react'
import { createLibrary, defineComponent, Renderer, type OpenUIError } from '@openuidev/react-lang'
import type { z } from 'zod'
import type { SectionConfig } from '../../registry'
import { bundleToSections } from '../okf/sections'
import { compileSectionElement } from './compile'
import { LOOM_OUI_COMPONENTS, loomOUILibrary } from './library'

export type RenderSectionFn = (config: SectionConfig) => ReactNode

/** Create a react-lang library whose section components render via `renderSection`. */
export function createLoomReactLibrary(renderSection: RenderSectionFn) {
  const components = LOOM_OUI_COMPONENTS.map((c) => {
    const typeName = c.name
    return defineComponent({
      name: typeName,
      description: c.definition.description,
      props: c.definition.props as unknown as z.ZodObject,
      component: c.sectionType
        ? ({ props }) => {
            const payload = compileSectionElement({ type: 'element', typeName, props, partial: false, hasDynamicProps: false })
            return payload ? <>{renderSection(bundleToSections([payload])[0])}</> : null
          }
        : () => null,
    })
  })
  return createLibrary({
    id: 'loom-react',
    root: loomOUILibrary.root,
    components,
    componentGroups: loomOUILibrary.componentGroups,
  })
}

export interface OUISectionRendererProps {
  /** `.oui` section source (may be a partial, streaming response). */
  source: string
  renderSection: RenderSectionFn
  isStreaming?: boolean
  onError?: (errors: OpenUIError[]) => void
}

/** Render a `.oui` section with OpenUI's `<Renderer>`. */
export function OUISectionRenderer({ source, renderSection, isStreaming, onError }: OUISectionRendererProps) {
  const library = useMemo(() => createLoomReactLibrary(renderSection), [renderSection])
  return (
    <Renderer
      response={source}
      library={library}
      isStreaming={isStreaming}
      onError={onError}
      publishObservability={false}
    />
  )
}
