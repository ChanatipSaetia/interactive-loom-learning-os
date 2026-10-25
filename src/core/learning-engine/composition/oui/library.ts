/**
 * Loom OpenUI Lang Library
 *
 * Assembles every subdomain's OpenUI components plus the topic/catalog
 * manifest components into one OpenUI library. This library is the single
 * source of truth for parsing `.oui` files, generating LLM prompts, and
 * driving editor tooling via its JSON Schema.
 *
 * lang-core drops prop descriptions from both outputs, so every component's
 * `fields` are re-attached here: to each `$defs.<Component>.properties.<prop>`
 * of the JSON Schema (VS Code, Studio hovers and signature help), and as a
 * per-prop list under each signature of the LLM prompt.
 */
import { createLibrary, generatePrompt, type Library, type LibraryJSONSchema, type PromptOptions, type PromptSpec } from '@openuidev/lang-core'
import { z } from 'zod'
import { defineOUIComponent, Lead, type LoomOUIComponent } from '../../sub-contexts/openui-kernel'
import { practiceAssessmentOUIComponents } from '../../sub-contexts/practice-assessment/openui'
import { processSimulationOUIComponents } from '../../sub-contexts/process-simulation/openui'
import { progressiveContentOUIComponents } from '../../sub-contexts/progressive-content/openui'
import { reflectionSynthesisOUIComponents } from '../../sub-contexts/reflection-synthesis/openui'
import { tradeoffSandboxOUIComponents } from '../../sub-contexts/tradeoff-sandbox/openui'
import { NARRATION_COMPONENTS } from './narration'

// ============================================================================
// Topic & catalog manifest components
// ============================================================================

/** `SectionRef("intro")` — points at `sections/intro.oui` next to `topic.oui`. */
export const SectionRef = defineOUIComponent({
  name: 'SectionRef',
  description: 'Includes the section file sections/<name>.oui of this topic.',
  props: z.object({
    name: z.string(),
  }),
  fields: {
    name: 'Section file name without .oui, e.g. "intro" for sections/intro.oui.',
  },
})

export const Topic = defineOUIComponent({
  name: 'Topic',
  description: 'Topic manifest (root of topic.oui): catalog metadata and the ordered list of sections.',
  props: z.object({
    title: z.string(),
    category: z.string(),
    description: z.string(),
    sections: z.array(SectionRef.ref),
    tags: z.array(z.string()).optional(),
    difficulty: z.string().optional(),
    updatedAt: z.string().optional(),
    isNew: z.boolean().optional(),
  }),
  fields: {
    title: 'Topic title shown in the catalog and topic header.',
    category: 'Catalog group the topic is listed under.',
    description: 'One- or two-sentence summary shown on the catalog card.',
    sections: 'The sections in reading order, as SectionRef calls.',
    tags: 'Optional keyword tags for search and filtering.',
    difficulty: 'Optional level, e.g. "beginner", "intermediate", "advanced".',
    updatedAt: 'Optional last-updated date, e.g. "2026-05-01".',
    isNew: 'Optional: true shows a "new" badge in the catalog.',
  },
  toData: (p) => ({ ...p, sections: (p.sections as Array<{ name: string }>).map((s) => s.name) }),
})

/** `TopicRef("demo")` — points at `<id>/topic.oui` in the content root. */
export const TopicRef = defineOUIComponent({
  name: 'TopicRef',
  description: 'Includes the topic folder <id>/topic.oui in the catalog.',
  props: z.object({
    id: z.string(),
  }),
  fields: {
    id: 'Topic folder name under the content root.',
  },
})

export const Catalog = defineOUIComponent({
  name: 'Catalog',
  description: 'Content catalog (root of index.oui): the ordered list of topics.',
  props: z.object({
    topics: z.array(TopicRef.ref),
  }),
  fields: {
    topics: 'The topics in catalog order, as TopicRef calls.',
  },
  toData: (p) => ({ topics: (p.topics as Array<{ id: string }>).map((t) => t.id) }),
})

// ============================================================================
// The learner's Loom folder: domains and the library (storage-guide.ts)
// ============================================================================

/** `DomainRef("fight-animation")` — points at `Loom/<id>/domain.oui`. */
export const DomainRef = defineOUIComponent({
  name: 'DomainRef',
  description: 'Includes the domain folder Loom/<id>/ (its domain.oui) in the library.',
  props: z.object({
    id: z.string(),
  }),
  fields: {
    id: 'Domain ID: the folder name under Loom/, lowercase letters, digits, - and _ (e.g. "fight-animation").',
  },
})

export const Domain = defineOUIComponent({
  name: 'Domain',
  description: "A learner's subject area (root of Loom/<domain-id>/domain.oui): its title, its topics in suggested learning order and the learner's goal.",
  props: z.object({
    title: z.string(),
    description: z.string(),
    topics: z.array(TopicRef.ref),
    goal: z.string().optional(),
  }),
  fields: {
    title: 'Domain name shown to the learner (e.g. "Fight Animation"); topics in it use it as their category.',
    description: 'One or two sentences on what the domain covers.',
    topics: 'Its topics in suggested learning order, as TopicRef calls naming files in topics/ (TopicRef("punch-basics") for topics/punch-basics.loom.oui).',
    goal: "Optional: what the learner wants to reach in this domain, in their words (e.g. \"animate a 10-second fight scene in Blender\").",
  },
  toData: (p) => ({ ...p, topics: (p.topics as Array<{ id: string }>).map((t) => t.id) }),
})

export const LibraryIndex = defineOUIComponent({
  name: 'Library',
  description: "The learner's library (root of Loom/index.oui): the list of their domains.",
  props: z.object({
    domains: z.array(DomainRef.ref),
  }),
  fields: {
    domains: 'The domains, as DomainRef calls, most recently studied first.',
  },
  toData: (p) => ({ domains: (p.domains as Array<{ id: string }>).map((d) => d.id) }),
})

// ============================================================================
// Library assembly
// ============================================================================

const SUBDOMAIN_GROUPS: Array<{ name: string; components: LoomOUIComponent[] }> = [
  { name: 'Progressive Content', components: progressiveContentOUIComponents },
  { name: 'Process Simulation', components: processSimulationOUIComponents },
  { name: 'Trade-off Sandbox', components: tradeoffSandboxOUIComponents },
  { name: 'Reflection & Synthesis', components: reflectionSynthesisOUIComponents },
  { name: 'Practice & Assessment', components: practiceAssessmentOUIComponents },
]

const MANIFEST_COMPONENTS = [Topic, SectionRef, Catalog, TopicRef]
const DRIVE_COMPONENTS = [Domain, DomainRef, LibraryIndex]

export const LOOM_OUI_COMPONENTS: LoomOUIComponent[] = [
  ...SUBDOMAIN_GROUPS.flatMap((g) => g.components),
  Lead,
  ...MANIFEST_COMPONENTS,
  ...DRIVE_COMPONENTS,
  ...NARRATION_COMPONENTS,
]

const componentsByName = new Map(LOOM_OUI_COMPONENTS.map((c) => [c.name, c]))

/** Look up a Loom component (and its `toData` mapper) by OpenUI call name. */
export function getLoomOUIComponent(name: string): LoomOUIComponent | undefined {
  return componentsByName.get(name)
}

/** Section-level components, keyed by OpenUI name → section type. */
export const OUI_SECTION_TYPES: ReadonlyMap<string, string> = new Map(
  LOOM_OUI_COMPONENTS.filter((c) => c.sectionType).map((c) => [c.name, c.sectionType as string]),
)

let library: Library | null = null

/**
 * Framework-agnostic OpenUI library (no renderers) used for parsing and prompts.
 * Built on first use: creating it draws a random ID, which Cloudflare Workers
 * forbid while a module loads (the hosted MCP endpoint, `src/mcp/worker.ts`).
 */
export function getLoomOUILibrary(): Library {
  library ??= createLibrary({
    id: 'loom',
    root: 'Topic',
    components: LOOM_OUI_COMPONENTS.map((c) => c.definition),
    componentGroups: [
      ...SUBDOMAIN_GROUPS.map((g) => ({ name: g.name, components: g.components.map((c) => c.name) })),
      { name: 'Shared', components: [Lead.name] },
      { name: 'Topic & Catalog', components: MANIFEST_COMPONENTS.map((c) => c.name) },
      { name: "The learner's Loom folder (Loom/index.oui, Loom/<domain-id>/domain.oui)", components: DRIVE_COMPONENTS.map((c) => c.name) },
      { name: 'Narration (sections/<name>.narrate.oui)', components: NARRATION_COMPONENTS.map((c) => c.name) },
    ],
  })
  return library
}

let cachedJSONSchema: LibraryJSONSchema | null = null

type JSONSchemaNode = { description?: string; properties?: Record<string, JSONSchemaNode> }

/**
 * JSON Schema of the whole library (parser input; editor tooling source),
 * with each component's `fields` as its property descriptions.
 */
export function getLoomOUIJSONSchema(): LibraryJSONSchema {
  if (!cachedJSONSchema) {
    const schema = getLoomOUILibrary().toJSONSchema()
    const defs = (schema as { $defs?: Record<string, JSONSchemaNode> }).$defs ?? {}
    for (const component of LOOM_OUI_COMPONENTS) {
      const properties = defs[component.name]?.properties ?? {}
      for (const [prop, description] of Object.entries(component.fields)) {
        if (properties[prop]) properties[prop].description = description
      }
    }
    cachedJSONSchema = schema
  }
  return cachedJSONSchema
}

/** Component description followed by one `- prop: description` line per prop, in signature order. */
export function promptDescription(component: LoomOUIComponent): string {
  const props = Object.keys((component.definition.props as unknown as { shape: Record<string, unknown> }).shape)
  const lines = props.filter((p) => component.fields[p]).map((p) => `  - ${p}: ${component.fields[p]}`)
  return [component.description, ...lines].join('\n')
}

/**
 * LLM system prompt for writing Loom `.oui` files: lang-core's OpenUI Lang
 * prompt (syntax rules, signatures, hoisting) with every prop documented.
 */
export function getLoomOUIPrompt(options: PromptOptions = {}): string {
  const spec = getLoomOUILibrary().toSpec()
  const components: PromptSpec['components'] = {}
  for (const [name, entry] of Object.entries(spec.components)) {
    const component = componentsByName.get(name)
    components[name] = component ? { ...entry, description: promptDescription(component) } : entry
  }
  // generatePrompt (what Library.prompt() calls) rather than generateSystemPrompt, which also sends sampled telemetry.
  return generatePrompt({ root: spec.root, componentGroups: spec.componentGroups, components, ...options })
}
