/** Compare explicit plan claims with compiled artifacts; never grade pedagogy. */
import { OUI_SECTION_TYPES } from './library'
import { TopicPlanSchema, validateTopicPlan } from './topic-plan'
import { textHash } from '../../../supporting/authoring-editor/assistant/statements'

export interface CompiledPlanArtifact {
  topicId: string
  files: Record<string, string>
  manifest: unknown | null
  sections: Array<{ name: string; config: { type: string } | null }>
}
export interface AlignmentDiagnostic {
  code: 'INVALID_PLAN' | 'TOPIC_MISMATCH' | 'MISSING_SECTION' | 'UNPLANNED_SECTION' | 'REPRESENTATION_MISMATCH' | 'UNCOMPILED_ARTIFACT'
  severity: 'warning'
  file: string
  sectionId?: string
  message: string
  repairTarget: string
}
export interface PlanAlignment {
  schemaVersion: 1
  /** Change hint for the exact source reviewed; not an authorization/write token. */
  contentHash: string
  status: 'not-provided' | 'unverified' | 'aligned' | 'mismatch'
  diagnostics: AlignmentDiagnostic[]
  /** Structure alone cannot establish these properties. */
  teachingQuality: 'not-evaluated'
  layout: 'not-measured'
}

export function reviewPlanArtifact(artifact: CompiledPlanArtifact, input?: unknown): PlanAlignment {
  const result: PlanAlignment = {
    schemaVersion: 1,
    contentHash: `artifact-v1:${textHash(JSON.stringify([artifact.topicId, Object.entries(artifact.files).sort(([a], [b]) => a.localeCompare(b))]))}`,
    status: 'not-provided', diagnostics: [], teachingQuality: 'not-evaluated', layout: 'not-measured',
  }
  if (input === undefined) return result
  const add = (code: AlignmentDiagnostic['code'], message: string, sectionId?: string) => {
    const file = sectionId ? `sections/${sectionId}.oui` : 'topic.oui'
    result.diagnostics.push({ code, severity: 'warning', file, sectionId, message, repairTarget: sectionId ? `${file}#root` : 'topic.oui#root' })
  }
  const supported = new Set([...OUI_SECTION_TYPES.values(), 'openui'])
  const parsed = TopicPlanSchema.safeParse(input)
  if (!parsed.success || validateTopicPlan(input, supported).length) {
    result.status = 'unverified'
    add('INVALID_PLAN', 'Validate and repair the TopicPlan before comparing artifacts.')
    return result
  }
  if (!artifact.manifest) {
    result.status = 'unverified'
    add('UNCOMPILED_ARTIFACT', 'Repair topic.oui and rerun compilation before comparing the plan.')
    return result
  }
  const plan = parsed.data
  if (plan.topicId !== artifact.topicId) add('TOPIC_MISMATCH', 'The plan topicId differs from the compiled topic. Supply the plan for this artifact or explicitly revise it.')
  const planned = new Map(plan.sections.map((section) => [section.id, section]))
  const actual = new Map(artifact.sections.map((section) => [section.name, section]))
  for (const section of plan.sections) {
    const compiled = actual.get(section.id)
    if (!compiled) add('MISSING_SECTION', 'This planned section is absent from the compiled topic outline.', section.id)
    else if (!compiled.config) add('UNCOMPILED_ARTIFACT', 'This section did not compile; its representation cannot be verified.', section.id)
    else if (compiled.config.type !== section.representation) add('REPRESENTATION_MISMATCH', `Plan specifies ${section.representation}; compiled artifact is ${compiled.config.type}. Repair the section or explicitly revise the plan.`, section.id)
  }
  for (const section of artifact.sections) if (!planned.has(section.name)) add('UNPLANNED_SECTION', 'This compiled section is absent from the supplied plan. Reconcile the plan before claiming alignment.', section.name)
  result.status = result.diagnostics.some((d) => d.code !== 'UNCOMPILED_ARTIFACT') ? 'mismatch'
    : result.diagnostics.length ? 'unverified' : 'aligned'
  return result
}
