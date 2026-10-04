/**
 * OpenUI Lang Shared Kernel
 *
 * Helpers every subdomain uses to declare the OpenUI Lang components that
 * make up its `.oui` authoring vocabulary. Components are declared once
 * (name, description, Zod props, one description per prop) and carry a
 * `toData` mapper that turns the component's compiled props into the
 * subdomain's section data shape.
 *
 * Prop descriptions live in `fields`, not in Zod `.describe()`: lang-core
 * builds its JSON Schema with a private registry (dropping `.describe()`),
 * and describing a `Child.ref` clones it, which loses the `Child` type in
 * prompt signatures. The library re-attaches `fields` to its JSON Schema and
 * LLM prompt (see composition/oui/library.ts), where VS Code, the Studio code
 * editor and form tooltips read them.
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

// ============================================================================
// Call trees (data → OpenUI Lang printing)
// ============================================================================

/** A component call to print. `name` asks the printer to hoist it into its own statement. */
export interface OUICall {
  kind: 'call'
  component: string
  props: Record<string, OUIValue>
  name?: string
}

/**
 * A reference to another component by ID. Printed as the statement name when
 * that component is hoisted, otherwise as the plain string ID.
 */
export interface OUIRef {
  kind: 'ref'
  components: string[]
  id: string
}

export type OUIValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | OUICall
  | OUIRef
  | OUIValue[]
  | { [key: string]: OUIValue }

/** Shared section metadata the printer needs (title, heading, lead…). */
export interface OUISectionMetaInput {
  title?: string
  heading?: string
  ordered?: boolean
  intro?: { what?: string; why?: string; next?: string }
}

export interface LoomOUIComponent {
  /** Component call name in OpenUI Lang (e.g. "Quiz"). */
  name: string
  /** What the component is, shown in hovers and the LLM prompt. */
  description: string
  /** One description per prop, keyed by prop name. */
  fields: Readonly<Record<string, string>>
  /** OpenUI component definition (framework-agnostic, no renderer). */
  definition: DefinedComponent
  /** Schema to embed in a parent's props: `z.array(Child.ref)`. */
  ref: z.ZodType
  /** Maps compiled props (children already compiled) to a domain object. */
  toData: (props: OUIProps) => unknown
  /** Present on section-level components: the OKF/section type it compiles to. */
  sectionType?: string
  /** Section-level components: section data (+ meta) → call tree, the inverse of `toData`. */
  fromData?: (data: Record<string, unknown>, meta: OUISectionMetaInput) => OUICall
}

/** One description per prop of `T`; every prop must be described. */
export type OUIFieldDocs<T extends z.ZodObject> = { readonly [K in keyof T['shape']]: string }

export interface LoomOUIComponentConfig<T extends z.ZodObject> {
  name: string
  description: string
  props: T
  /** Description of each prop (VS Code / editor hovers, form tooltips, LLM prompt). */
  fields: OUIFieldDocs<T>
  toData?: (props: z.infer<T>) => unknown
}

export interface LoomOUISectionConfig<T extends z.ZodObject> extends LoomOUIComponentConfig<T> {
  sectionType: string
  toData: (props: z.infer<T>) => Record<string, unknown> & { type: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fromData: (data: any, meta: OUISectionMetaInput) => OUICall
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
    description: config.description,
    fields: config.fields as Readonly<Record<string, string>>,
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
    fromData: config.fromData,
  }
}

/** Build a call to `component` (props keyed by param name). */
export function call(component: LoomOUIComponent, props: Record<string, OUIValue>, name?: string): OUICall {
  return { kind: 'call', component: component.name, props, ...(name ? { name } : {}) }
}

/** Reference to a component instance (of any of `components`) by its ID. */
export function refTo(components: LoomOUIComponent | LoomOUIComponent[], id: string | undefined): OUIRef | undefined {
  if (id === undefined || id === null || id === '') return undefined
  const list = Array.isArray(components) ? components : [components]
  return { kind: 'ref', components: list.map((c) => c.name), id: String(id) }
}

/** Description of one prop of `component` (form tooltips), or undefined. */
export function fieldDoc(component: LoomOUIComponent, field: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(component.fields, field) ? component.fields[field] : undefined
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
  fields: {
    what: 'What this section shows, in one sentence.',
    why: 'Why it matters to the learner.',
    next: 'What the learner should do or look for next.',
  },
})

/** Trailing props shared by every section component. Spread last into `props`. */
export const sectionTailProps = {
  heading: z.string().optional(),
  lead: Lead.ref.optional(),
}

/** Descriptions of `title` plus `sectionTailProps`. Spread into every section's `fields`. */
export const sectionFields = {
  title: 'Section title, shown in the topic outline and as the section header.',
  heading: 'Optional sub-heading shown under the section title.',
  lead: 'Optional Lead(...) intro card: what the section shows, why it matters, what comes next.',
} as const

/** Printer counterpart of `sectionTailProps`: `heading` and `lead` from section meta. */
export function sectionTail(meta: OUISectionMetaInput): Record<string, OUIValue> {
  const intro = meta.intro
  const hasLead = intro && (intro.what || intro.why || intro.next)
  return {
    heading: meta.heading || undefined,
    lead: hasLead ? call(Lead, { what: intro!.what, why: intro!.why, next: intro!.next }) : undefined,
  }
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
