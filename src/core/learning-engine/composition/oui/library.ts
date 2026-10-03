/**
 * Loom OpenUI Lang Library
 *
 * Assembles every subdomain's OpenUI components plus the topic/catalog
 * manifest components into one OpenUI library. This library is the single
 * source of truth for parsing `.oui` files, generating LLM prompts, and
 * (Phase 2) driving editor tooling via `toJSONSchema()`.
 */
import { createLibrary, type Library, type LibraryJSONSchema } from '@openuidev/lang-core'
import { z } from 'zod'
import { defineOUIComponent, Lead, type LoomOUIComponent } from '../../sub-contexts/openui-kernel'
import { practiceAssessmentOUIComponents } from '../../sub-contexts/practice-assessment/openui'
import { processSimulationOUIComponents } from '../../sub-contexts/process-simulation/openui'
import { progressiveContentOUIComponents } from '../../sub-contexts/progressive-content/openui'
import { reflectionSynthesisOUIComponents } from '../../sub-contexts/reflection-synthesis/openui'
import { tradeoffSandboxOUIComponents } from '../../sub-contexts/tradeoff-sandbox/openui'

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
  toData: (p) => ({ ...p, sections: (p.sections as Array<{ name: string }>).map((s) => s.name) }),
})

/** `TopicRef("demo")` — points at `<id>/topic.oui` in the content root. */
export const TopicRef = defineOUIComponent({
  name: 'TopicRef',
  description: 'Includes the topic folder <id>/topic.oui in the catalog.',
  props: z.object({
    id: z.string(),
  }),
})

export const Catalog = defineOUIComponent({
  name: 'Catalog',
  description: 'Content catalog (root of index.oui): the ordered list of topics.',
  props: z.object({
    topics: z.array(TopicRef.ref),
  }),
  toData: (p) => ({ topics: (p.topics as Array<{ id: string }>).map((t) => t.id) }),
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

export const LOOM_OUI_COMPONENTS: LoomOUIComponent[] = [
  ...SUBDOMAIN_GROUPS.flatMap((g) => g.components),
  Lead,
  ...MANIFEST_COMPONENTS,
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

/** Framework-agnostic OpenUI library (no renderers) used for parsing and prompts. */
export const loomOUILibrary: Library = createLibrary({
  id: 'loom',
  root: 'Topic',
  components: LOOM_OUI_COMPONENTS.map((c) => c.definition),
  componentGroups: [
    ...SUBDOMAIN_GROUPS.map((g) => ({ name: g.name, components: g.components.map((c) => c.name) })),
    { name: 'Shared', components: [Lead.name] },
    { name: 'Topic & Catalog', components: MANIFEST_COMPONENTS.map((c) => c.name) },
  ],
})

let cachedJSONSchema: LibraryJSONSchema | null = null

/** JSON Schema of the whole library (parser input; editor tooling source). */
export function getLoomOUIJSONSchema(): LibraryJSONSchema {
  cachedJSONSchema ??= loomOUILibrary.toJSONSchema()
  return cachedJSONSchema
}
