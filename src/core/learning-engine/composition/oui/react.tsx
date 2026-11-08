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
import { Suspense, useMemo, type ReactNode } from 'react'
import { createLibrary, defineComponent, Renderer, type OpenUIError } from '@openuidev/react-lang'
import type { z } from 'zod'
import { SectionRegistry, type SectionConfig } from '../../registry'
import { bundleToSections } from '../okf/sections'
import { compileSectionElement, type OUIAnchor } from './compile'
import { PickAnchorProvider, usePickAnchorScope } from '../../../ui-system/pick-anchor'
import { LOOM_OUI_COMPONENTS, getLoomOUIJSONSchema, getUnifiedOUISpec } from './library'
import { loomOpenUILibrary } from '../../sub-contexts/progressive-content/components/openui/themed-charts'

export type RenderSectionFn = (config: SectionConfig, statementId?: string) => ReactNode

export function renderLearningActivity(config: SectionConfig, statementId?: string, onEvent?: (event: { type: string; [key: string]: unknown }) => void) {
  const Component = SectionRegistry.get(config.type)
  return Component ? <div className="loom-page-activity"><Suspense fallback={<p>Loading activity…</p>}><Component {...config.props}
    {...(onEvent && { onEvent: (event: { type: string; [key: string]: unknown }) => onEvent({ ...event, activityId: statementId ?? 'root.body' }) })} /></Suspense></div> : null
}

/** Create a react-lang library whose section components render via `renderSection`. */
export function createLoomReactLibrary(renderSection: RenderSectionFn) {
  const components = LOOM_OUI_COMPONENTS.map((c) => {
    const typeName = c.name
    return defineComponent({
      name: typeName,
      description: c.definition.description,
      props: c.definition.props as unknown as z.ZodObject,
      component: c.name === 'Page' ? ({ props, renderNode }) => <>{renderNode(props.body)}</> : c.sectionType
        ? ({ props, statementId }) => {
            const parent = usePickAnchorScope()
            const anchors = new WeakMap<object, OUIAnchor>()
            const ids = new Map<string, OUIAnchor>()
            const payload = compileSectionElement({ type: 'element', typeName, props, statementId: statementId ?? 'root.body', partial: false, hasDynamicProps: false }, (value, anchor, element) => {
              if (value && typeof value === 'object') anchors.set(value, anchor)
              if (element && typeof element.id === 'string') ids.set(`${element.component}:${element.id}`, anchor)
            })
            const format = (anchor?: OUIAnchor) => anchor ? `${anchor.statement}${anchor.path}` : undefined
            const scope = parent ? { ...parent,
              anchorOf: (value: unknown) => value && typeof value === 'object' ? format(anchors.get(value)) ?? parent.anchorOf(value) : undefined,
              anchorOfId: (component: string, id: string) => format(ids.get(`${component}:${id}`)) ?? parent.anchorOfId?.(component, id),
            } : null
            return payload ? <PickAnchorProvider scope={scope}>{renderSection(bundleToSections([payload])[0], statementId)}</PickAnchorProvider> : null
          }
        : () => null,
    })
  })
  const library = createLibrary({
    id: 'loom-react',
    root: 'Page',
    components: [...Object.values(loomOpenUILibrary.components), ...components],
    componentGroups: getUnifiedOUISpec().componentGroups,
  })
  return { ...library, toJSONSchema: getLoomOUIJSONSchema }
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
