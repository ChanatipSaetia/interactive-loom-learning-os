/** Portable AI-authored planning contract. AI authors plans; Loom checks structure. */
import { z } from 'zod'
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
    evidenceRefs: z.array(z.string().max(120)).max(100).optional(),
  }).strict()).min(1).max(100),
}).strict()
export type TopicPlan = z.infer<typeof TopicPlanSchema>

export interface PlanDiagnostic {
  code: 'INVALID_EVIDENCE' | 'INVALID_INPUT' | 'INVALID_ID' | 'DUPLICATE_ID' | 'MISSING_OBJECTIVE' | 'MISSING_PREREQUISITE' | 'PREREQUISITE_CYCLE' | 'UNKNOWN_SECTION_TYPE' | 'UNCOVERED_OBJECTIVE'
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
  const validId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  const add = (code: PlanDiagnostic['code'], path: string, message: string) => errors.push({ code, path, message })
  if (!validId.test(plan.topicId)) add('INVALID_ID', 'topicId', 'Use a stable kebab-case topic ID')
  for (const [i, obj] of plan.objectives.entries()) {
    const path = `objectives[${i}]`
    if (!validId.test(obj.id)) add('INVALID_ID', `${path}.id`, 'Use a kebab-case ID')
    if (objectives.has(obj.id)) add('DUPLICATE_ID', `${path}.id`, `Duplicate objective ${obj.id}`)
    objectives.set(obj.id, obj)
  }
  for (const [i, section] of plan.sections.entries()) {
    const path = `sections[${i}]`
    if (!validId.test(section.id)) add('INVALID_ID', `${path}.id`, 'Use a kebab-case ID')
    if (sections.has(section.id)) add('DUPLICATE_ID', `${path}.id`, `Duplicate section ${section.id}`)
    sections.add(section.id)
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
