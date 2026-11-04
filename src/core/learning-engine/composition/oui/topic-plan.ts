/** Portable AI-authored planning contract. AI authors plans; Loom checks structure. */
export interface TopicPlan {
  schemaVersion: 1
  topicId: string
  goal: string
  objectives: Array<{ id: string; description: string; prerequisiteIds?: string[] }>
  sections: Array<{
    id: string
    title: string
    objectiveRefs: string[]
    representation: string
    activity: string
    evidenceRefs?: string[]
  }>
}

export interface PlanDiagnostic {
  code: 'INVALID_ID' | 'DUPLICATE_ID' | 'MISSING_OBJECTIVE' | 'MISSING_PREREQUISITE' | 'PREREQUISITE_CYCLE' | 'UNKNOWN_SECTION_TYPE' | 'UNCOVERED_OBJECTIVE'
  path: string
  message: string
}

export function validateTopicPlan(plan: TopicPlan, supportedSections: ReadonlySet<string>): PlanDiagnostic[] {
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
  return errors
}
