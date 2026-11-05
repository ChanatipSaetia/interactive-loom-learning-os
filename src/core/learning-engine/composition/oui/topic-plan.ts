/** Portable AI-authored planning contract. AI authors plans; Loom checks structure. */
import { z } from 'zod'
import { COMPONENT_LIBRARIES, OUI_SECTION_TYPES } from './library'
import { EvidenceReferenceSchema, validateEvidenceReferences } from './source-provenance'

export const TopicPlanSchema = z.object({
  schemaVersion: z.literal(1),
  sources: z.array(EvidenceReferenceSchema).max(100).optional(),
  topicId: z.string().min(1).max(120),
  goal: z.string().min(1).max(4000),
  objectives: z.array(z.object({
    id: z.string().min(1).max(120), description: z.string().min(1).max(4000),
    prerequisiteIds: z.array(z.string().max(120)).max(100).optional(),
  }).strict()).min(1).max(100),
  sections: z.array(z.object({
    id: z.string().min(1).max(120), title: z.string().min(1).max(1000),
    objectiveRefs: z.array(z.string().max(120)).min(1).max(100),
    representation: z.string().min(1).max(120), activity: z.string().min(1).max(4000),
    rationale: z.string().min(1).max(4000).optional(),
    library: z.enum(COMPONENT_LIBRARIES).optional(),
    evidenceRefs: z.array(z.string().max(120)).max(100).optional(),
  }).strict()).min(1).max(100),
}).strict()
export type TopicPlan = z.infer<typeof TopicPlanSchema>

export interface PlanDiagnostic {
  code: 'INVALID_LIBRARY' | 'INVALID_EVIDENCE' | 'INVALID_INPUT' | 'INVALID_ID' | 'DUPLICATE_ID' | 'MISSING_OBJECTIVE' | 'MISSING_PREREQUISITE' | 'PREREQUISITE_CYCLE' | 'UNKNOWN_SECTION_TYPE' | 'UNCOVERED_OBJECTIVE'
  path: string
  message: string
}

export function validateTopicPlan(input: unknown, supportedSections: ReadonlySet<string>): PlanDiagnostic[] {
  const parsed = TopicPlanSchema.safeParse(input)
  if (!parsed.success) return parsed.error.issues.map((issue) => ({
    code: 'INVALID_INPUT' as const, path: issue.path.join('.'), message: issue.message,
  }))
  const plan = parsed.data
  const errors: PlanDiagnostic[] = []
  const objectives = new Map<string, TopicPlan['objectives'][number]>()
  const sections = new Set<string>()
  const validId = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/
  const add = (code: PlanDiagnostic['code'], path: string, message: string) => errors.push({ code, path, message })
  if (!validId.test(plan.topicId)) add('INVALID_ID', 'topicId', 'Use a stable lowercase topic ID with digits, - or _')
  for (const [i, obj] of plan.objectives.entries()) {
    const path = `objectives[${i}]`
    if (!validId.test(obj.id)) add('INVALID_ID', `${path}.id`, 'Use a lowercase ID with digits, - or _')
    if (objectives.has(obj.id)) add('DUPLICATE_ID', `${path}.id`, `Duplicate objective ${obj.id}`)
    objectives.set(obj.id, obj)
  }
  for (const [i, section] of plan.sections.entries()) {
    const path = `sections[${i}]`
    if (!validId.test(section.id)) add('INVALID_ID', `${path}.id`, 'Use a lowercase ID with digits, - or _')
    if (sections.has(section.id)) add('DUPLICATE_ID', `${path}.id`, `Duplicate section ${section.id}`)
    sections.add(section.id)
    if (section.library && section.library !== (section.representation === 'openui' ? 'openui' : 'loom')) add('INVALID_LIBRARY', `${path}.library`, 'Library must match the selected representation')
    if (!supportedSections.has(section.representation)) add('UNKNOWN_SECTION_TYPE', `${path}.representation`, `Unsupported representation ${section.representation}`)
    for (const id of section.objectiveRefs) if (!objectives.has(id)) add('MISSING_OBJECTIVE', `${path}.objectiveRefs`, `Unknown objective ${id}`)
  }
  for (const [i, obj] of plan.objectives.entries()) {
    for (const id of obj.prerequisiteIds ?? []) if (!objectives.has(id)) add('MISSING_PREREQUISITE', `objectives[${i}].prerequisiteIds`, `Unknown prerequisite ${id}`)
    if (!plan.sections.some((s) => s.objectiveRefs.includes(obj.id))) add('UNCOVERED_OBJECTIVE', `objectives[${i}]`, `No section teaches ${obj.id}`)
  }
  const visiting = new Set<string>(), visited = new Set<string>()
  const visit = (id: string): void => {
    if (visiting.has(id)) { add('PREREQUISITE_CYCLE', `objectives.${id}`, `Cycle involving ${id}`); return }
    if (visited.has(id)) return
    visiting.add(id)
    for (const dep of objectives.get(id)?.prerequisiteIds ?? []) if (objectives.has(dep)) visit(dep)
    visiting.delete(id)
    visited.add(id)
  }
  for (const id of objectives.keys()) visit(id)
  for (const diagnostic of validateEvidenceReferences(plan.sources ?? [], plan.sections.flatMap((section) => section.evidenceRefs ?? []), new Set(objectives.keys()))) {
    add('INVALID_EVIDENCE', `sources.${diagnostic.reference}`, diagnostic.code)
  }
  for (const [index, section] of plan.sections.entries()) for (const ref of section.evidenceRefs ?? []) {
    const source = plan.sources?.find((entry) => entry.id === ref)
    if (source && !source.supports.some((id) => section.objectiveRefs.includes(id))) add('INVALID_EVIDENCE', `sections[${index}].evidenceRefs`, `Source ${ref} supports none of this section's objectives`)
  }
  return errors
}

/** Normalize native component names at the Studio compatibility boundary. */
export function sectionTypeOf(name: string): string {
  const trimmed = name.trim()
  return OUI_SECTION_TYPES.get(trimmed) ?? (trimmed === '// @openui' ? 'openui' : trimmed.toLowerCase())
}

export interface StudioPlanItem {
  action: 'create' | 'edit'
  name: string
  type: string
  representation?: string
  title: string
  idea: string
  activity?: string
  rationale?: string
  library?: 'loom' | 'openui'
  objectiveRefs?: string[]
}
export interface StudioPlan {
  goal: string
  items: StudioPlanItem[]
  /** Present for the shared contract; legacy UI plans remain supported. */
  topicPlan?: TopicPlan
}

/** Both hosts use the same semantic validator; old UI plans remain a compatibility input. */
export function readStudioPlan(args: string): StudioPlan | null {
  try {
    const parsed = JSON.parse(args)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    if (parsed.plan !== undefined) {
      const result = TopicPlanSchema.safeParse(parsed.plan)
      if (!result.success || validateTopicPlan(result.data, new Set([...OUI_SECTION_TYPES.values(), 'openui'])).length) return null
      const plan = result.data
      const actions = parsed.actions ?? {}
      if (!actions || typeof actions !== 'object' || Array.isArray(actions) || Object.entries(actions).some(([id, action]) => !plan.sections.some((section) => section.id === id) || (typeof action !== 'string' || !['create', 'edit'].includes(action)))) return null
      const objectives = new Map(plan.objectives.map((objective) => [objective.id, objective.description]))
      return {
        goal: plan.goal, topicPlan: plan,
        items: plan.sections.map((section) => ({
          action: actions[section.id] === 'edit' ? 'edit' : 'create', name: section.id,
          type: section.representation, representation: section.representation, title: section.title,
          idea: section.objectiveRefs.map((id) => objectives.get(id)).join('; '),
          activity: section.activity, rationale: section.rationale,
          library: section.library ?? (section.representation === 'openui' ? 'openui' : 'loom'),
          objectiveRefs: section.objectiveRefs,
        })),
      }
    }
    if (!Array.isArray(parsed.items)) return null
    const items = parsed.items.flatMap((raw: unknown): StudioPlanItem[] => {
      const item = raw as Record<string, unknown>
      if (!item || typeof item !== 'object') return []
      const text = (key: string) => typeof item[key] === 'string' ? (item[key] as string).trim() : ''
      const name = text('name').replace(/^sections\//, '').replace(/\.oui$/, '')
      if (!name && !text('title')) return []
      return [{ action: item.action === 'edit' ? 'edit' : 'create', name, type: text('type'), representation: sectionTypeOf(text('type')), title: text('title') || name, idea: text('idea') }]
    })
    return items.length ? { goal: typeof parsed.goal === 'string' ? parsed.goal.trim() : '', items } : null
  } catch { return null }
}

/** Preserve the design decisions when the author selects a subset to build. */
export function buildStudioPlanMessage(plan: StudioPlan, ticked: readonly number[]): string {
  const items = [...new Set(ticked)].map((i) => plan.items[i]).filter(Boolean)
  return [
    `Build ${items.length === 1 ? 'this section' : 'these sections'} from the plan${plan.goal ? ` (goal: ${plan.goal})` : ''}:`,
    ...items.map((item, i) => [
      `${i + 1}. ${item.action === 'edit' ? 'Change' : 'Create'} ${item.name ? `sections/${item.name}.oui` : 'a section'} (${item.type || 'section'}) "${item.title}": ${item.idea}`,
      ...(item.activity ? [`   Learner action: ${item.activity}`] : []),
      ...(item.rationale ? [`   Representation rationale: ${item.rationale}`] : []),
      ...(item.library ? [`   Component library: ${item.library}`] : []),
      ...(item.objectiveRefs ? [`   Objectives: ${item.objectiveRefs.join(', ')}`] : []),
    ].join('\n')),
    ...(plan.topicPlan && items.length !== plan.items.length ? ['The selection changed: adapt and revalidate objective coverage for these selected sections before generating.'] : []),
    '', 'Stage them all with the edit tools in this turn, then sum up what you staged.',
  ].join('\n')
}
