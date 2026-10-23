import { useId, useMemo } from 'react'
import { createLibrary, defineComponent, type Library } from '@openuidev/react-lang'
import type { LibraryJSONSchema } from '@openuidev/lang-core'
import { z } from 'zod'
import { sanitizeSvgMarkup } from './svg-markup'

/**
 * Components Loom adds to the standard OpenUI library (decision 118). `npm run openui:gen` snapshots
 * the library with them, so parsing, validation, editor tooling and the authoring prompt know them
 * like any standard component.
 */

const SvgSchema = z.object({
  markup: z.string(),
  caption: z.string().optional(),
})

function SvgDrawing({ markup, caption }: z.infer<typeof SvgSchema>) {
  const scope = `svg${useId().replace(/[^\w-]/g, '')}`
  const drawing = useMemo(() => sanitizeSvgMarkup(markup ?? '', scope, caption), [markup, scope, caption])
  return (
    <figure className="loom-svg" data-testid="openui-svg">
      {'svg' in drawing
        ? <div className="loom-svg-canvas" dangerouslySetInnerHTML={{ __html: drawing.svg }} />
        : <p className="loom-svg-error">{drawing.error}</p>}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

export const Svg = defineComponent({
  name: 'Svg',
  props: SvgSchema,
  description: 'A drawing written as inline SVG markup (one <svg viewBox="…"> element), with an optional caption under it. Color names of the Loom palette (blue, peach, green, mauve, red, yellow, teal, text, subtext0, overlay1, surface0, …) follow the theme; shapes without a fill take the text color. Give the shapes narration will point at an id. No scripts, links, images or foreignObject.',
  component: ({ props }) => <SvgDrawing markup={props.markup} caption={props.caption} />,
})

const LOOM_COMPONENTS = [Svg]

/** Name of the component group the Loom components join, and notes for writers. */
const GROUP = 'Content'
const NOTES = [
  '- Svg draws what is easier shown than told: a shape, a layout, a mechanism, a geometry. Write the markup in a single-quoted string so its attributes keep their double quotes; it may span several lines.',
]

/** The standard library with the Loom components added (to the Content group). */
export function withLoomComponents(library: Library): Library {
  const groups = (library.componentGroups ?? []).map((g) =>
    g.name === GROUP ? { ...g, components: [...g.components, ...LOOM_COMPONENTS.map((c) => c.name)], notes: [...(g.notes ?? []), ...NOTES] } : g)
  return createLibrary({
    components: [...Object.values(library.components), ...LOOM_COMPONENTS],
    componentGroups: groups,
    root: library.root,
  })
}

/**
 * Upstream's child unions (Card, TabItem, AccordionItem, …) list content components by name, so the
 * Loom components are added next to `Image` wherever it is a possible child.
 */
function withLoomChildren(schema: LibraryJSONSchema): LibraryJSONSchema {
  const names = LOOM_COMPONENTS.map((c) => c.name)
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(visit)
    if (!node || typeof node !== 'object') return
    const anyOf = (node as { anyOf?: Array<{ $ref?: string }> }).anyOf
    if (anyOf?.some((s) => s.$ref === '#/$defs/Image')) {
      for (const name of names) if (!anyOf.some((s) => s.$ref === `#/$defs/${name}`)) anyOf.push({ $ref: `#/$defs/${name}` })
    }
    Object.values(node).forEach(visit)
  }
  const copy = structuredClone(schema)
  visit(copy)
  return copy
}

/**
 * The snapshot `npm run openui:gen` writes (`schema.json`, `spec.json`): the standard library with
 * the Loom components, which may be written wherever an `Image` may.
 */
export function standardLibrarySnapshot(standard: Library) {
  const library = withLoomComponents(standard)
  const names = LOOM_COMPONENTS.map((c) => c.name).join(' | ')
  const components = Object.fromEntries(Object.entries(library.toSpec().components).map(([name, c]) => [name, {
    ...c,
    signature: c.signature.replace(/\| Image \|/g, `| Image | ${names} |`),
  }]))
  return {
    schema: withLoomChildren(library.toJSONSchema()),
    spec: { root: library.root, components, componentGroups: library.componentGroups ?? [] },
  }
}
