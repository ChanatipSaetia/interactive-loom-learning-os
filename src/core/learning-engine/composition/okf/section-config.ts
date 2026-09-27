import type { SectionConfig } from '../../registry'
import type { OKFBundled, OKFBundledSection } from './types'

/** Section types whose data carries its own title, where section.md's title stays the display title. */
const META_TITLE_WINS = new Set(['pillar-layer'])

/**
 * Validated section payload → component props. Payload fields map 1:1 onto
 * props, layered over the section.md frontmatter props (title, heading,
 * ordered, intro). Non-valid sections carry their diagnostics for the host.
 */
export function toSectionConfig({ meta, data, validation }: OKFBundledSection): SectionConfig {
  const metaProps: Record<string, unknown> = {}
  if (meta.title) metaProps.title = meta.title
  if (meta.heading) metaProps.heading = meta.heading
  if (meta.ordered !== undefined) metaProps.ordered = meta.ordered
  if (meta.intro) metaProps.intro = meta.intro

  const props: Record<string, unknown> = { ...metaProps }
  for (const [key, value] of Object.entries(data)) {
    if (key !== 'type' && value !== undefined) props[key] = value
  }
  if (META_TITLE_WINS.has(meta.type) && metaProps.title) props.title = metaProps.title

  const config: SectionConfig = { type: meta.type || data.type, props }
  if (validation && validation.status !== 'valid') config.validation = validation
  return config
}

export function toSectionConfigs(bundle: OKFBundled): SectionConfig[] {
  return bundle.map(toSectionConfig)
}
