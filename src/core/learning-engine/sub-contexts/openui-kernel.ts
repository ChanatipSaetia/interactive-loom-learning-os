/**
 * OpenUI Lang Shared Kernel
 *
 * Helpers every subdomain uses to declare the OpenUI Lang components that
 * make up its `.oui` authoring vocabulary. Components are declared once
 * (name, description, Zod props) and carry a `toData` mapper that turns the
 * component's compiled props into the subdomain's section data shape.
 *
 * Positional argument order in OpenUI Lang follows the key order of the
 * `props` object, so every section component puts `title` first and the
 * shared `heading` / `lead` props last.
 *
 * See grill-log-openui-input.md for the design decisions.
 */
import { defineComponent, type DefinedComponent } from '@openuidev/lang-core'
import { z } from 'zod'

export type OUIProps = Record<string, unknown>

export interface LoomOUIComponent {
  /** Component call name in OpenUI Lang (e.g. "Quiz"). */
  name: string
  /** OpenUI component definition (framework-agnostic, no renderer). */
  definition: DefinedComponent
  /** Schema to embed in a parent's props: `z.array(Child.ref)`. */
  ref: z.ZodType
  /** Maps compiled props (children already compiled) to a domain object. */
  toData: (props: OUIProps) => unknown
  /** Present on section-level components: the OKF/section type it compiles to. */
  sectionType?: string
}

export interface LoomOUIComponentConfig<T extends z.ZodObject> {
  name: string
  description: string
  props: T
  toData?: (props: z.infer<T>) => unknown
}

export interface LoomOUISectionConfig<T extends z.ZodObject> extends LoomOUIComponentConfig<T> {
  sectionType: string
  toData: (props: z.infer<T>) => Record<string, unknown> & { type: string }
}

/** Declare a data component (child of a section, e.g. a quiz question). */
export function defineOUIComponent<T extends z.ZodObject>(config: LoomOUIComponentConfig<T>): LoomOUIComponent {
  const definition = defineComponent({
    name: config.name,
    description: config.description,
    props: config.props as never,
    component: null,
  }) as unknown as DefinedComponent
  return {
    name: config.name,
    definition,
    ref: definition.ref as unknown as z.ZodType,
    toData: (config.toData as LoomOUIComponent['toData'] | undefined) ?? ((props) => ({ ...props })),
  }
}

/** Declare a section-level component (the `root` of a section `.oui` file). */
export function defineOUISection<T extends z.ZodObject>(config: LoomOUISectionConfig<T>): LoomOUIComponent {
  return {
    ...defineOUIComponent(config),
    sectionType: config.sectionType,
  }
}

// ============================================================================
// Shared section props
// ============================================================================

/** `Lead(what?, why?, next?)` — the short "what / why / next" intro shown above a section. */
export const Lead = defineOUIComponent({
  name: 'Lead',
  description: 'Short lead-in shown above a section: what it shows, why it matters, and what comes next.',
  props: z.object({
    what: z.string().optional(),
    why: z.string().optional(),
    next: z.string().optional(),
  }),
})

/** Trailing props shared by every section component. Spread last into `props`. */
export const sectionTailProps = {
  heading: z.string().optional(),
  lead: Lead.ref.optional(),
}

// ============================================================================
// Reference helpers
// ============================================================================

/**
 * Schema for a prop that accepts either a reference to a component
 * (e.g. an `Actor`) or a plain string ID.
 */
export function refOrId(component: LoomOUIComponent): z.ZodType {
  return z.union([z.string(), component.ref])
}

/** Resolve a compiled reference (object with `id`) or a string to its ID. */
export function idOf(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'string') {
    return (value as { id: string }).id
  }
  return ''
}

/** Index an array of compiled objects by their `id` (preserves object identity). */
export function byId<T extends { id?: unknown }>(items: T[] | undefined): Record<string, T> {
  const record: Record<string, T> = {}
  for (const item of items ?? []) {
    const id = idOf(item)
    if (id) record[id] = item
  }
  return record
}
