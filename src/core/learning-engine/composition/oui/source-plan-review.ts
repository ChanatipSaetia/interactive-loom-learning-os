/** Bounded source/plan checks for hosted MCP. Never claims compiler validity. */
import { readTopicText } from '../../../supporting/authoring-editor/workspace/archive'
import { scan } from '../../../supporting/authoring-editor/oui-language/scanner'
import { textHash } from '../../../supporting/authoring-editor/assistant/statements'
import { inspectComposition } from './source-composition'
import { TopicPlanSchema, validateTopicPlan } from './topic-plan'

export interface SourceDiagnostic { code: string; file: string; message: string; repairTarget: string }
export function reviewTopicSource(oui: string, input: unknown) {
  const diagnostics: SourceDiagnostic[] = []
  const add = (code: string, file: string, message: string) => diagnostics.push({ code, file, message, repairTarget: `${file}#root` })
  const parsed = TopicPlanSchema.safeParse(input)
  let topic: ReturnType<typeof readTopicText>[number] | undefined
  if (!parsed.success || validateTopicPlan(input).length) add('INVALID_PLAN', 'topic.oui', 'Repair the supplied TopicPlan before delivery.')
  try {
    if (oui.length > 262144) throw new Error('Source review is limited to 256 Ki characters; split this topic.')
    const topics = readTopicText(oui)
    if (topics.length !== 1) throw new Error('Deliver exactly one topic per call.')
    topic = topics[0]
  } catch (error) { add('SOURCE_UNVERIFIED', 'topic.oui', error instanceof Error ? error.message : 'Unable to read topic source.') }
  if (topic && parsed.success && !diagnostics.length) {
    const plan = parsed.data
    if (topic.topicId !== plan.topicId) add('TOPIC_MISMATCH', 'topic.oui', 'Source topic ID differs from the plan.')
    const manifest = inspectComposition(topic.files['topic.oui'] ?? '')
    if (manifest.missing.size) add('SOURCE_REFERENCE_MISSING', 'topic.oui', 'The manifest has unresolved root dependencies.')
    if (manifest.rootComponent !== 'Topic') add('MANIFEST_ROOT_INVALID', 'topic.oui', 'The manifest needs a root = Topic(...) statement or a direct named alias.')
    const sections: string[] = []
    for (const statement of manifest.statements.filter((s) => manifest.visited.has(s.name))) {
      const tokens = scan(statement.text).filter((t) => !['comment', 'newline'].includes(t.type))
      tokens.forEach((token, i) => {
        if (token.type !== 'ident' || token.text !== 'SectionRef' || tokens[i + 1]?.text !== '(') return
        const value = tokens[i + 2]
        if (value?.type !== 'string' || !value.terminated || tokens[i + 3]?.text !== ')') { add('SECTION_REF_UNVERIFIED', 'topic.oui', 'Source review requires literal SectionRef names.'); return }
        const name = value.text.slice(1, -1)
        if (!/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(name)) { add('SECTION_REF_UNVERIFIED', 'topic.oui', 'Use literal lowercase section IDs.'); return }
        sections.push(name)
      })
    }
    if (new Set(sections).size !== sections.length) add('DUPLICATE_SECTION', 'topic.oui', 'SectionRef IDs must be unique.')
    for (const section of plan.sections) {
      const file = `sections/${section.id}.oui`
      if (!sections.includes(section.id) || !(file in topic.files)) { add('MISSING_SECTION', file, 'The planned page is absent from the manifest or source.'); continue }
      const actual = inspectComposition(topic.files[file])
      if (actual.rootComponent !== 'Page') add('PAGE_ROOT_INVALID', file, 'The page needs root = Page(...) or a direct named alias.')
      if (actual.missing.size) add('SOURCE_REFERENCE_MISSING', file, `Unresolved root dependencies: ${[...actual.missing].slice(0, 5).join(', ')}.`)
      for (const name of section.components) if (!actual.calls.has(name)) add('COMPOSITION_MISMATCH', file, `Planned ${name} is missing from the root composition. Implement it or revise and revalidate the plan.`)
      for (const ref of section.assessment?.itemRefs ?? []) if (!actual.statements.some((s) => s.name === ref.split('#')[1] && actual.visited.has(s.name))) add('ASSESSMENT_REFERENCE_MISSING', file, `Planned assessment ${ref} is absent or unreachable.`)
    }
    if (sections.length === plan.sections.length && sections.every((id) => plan.sections.some((s) => s.id === id)) && sections.some((id, i) => id !== plan.sections[i].id)) add('SECTION_ORDER_MISMATCH', 'topic.oui', 'Restore the planned learning order or revise and revalidate the plan.')
    for (const id of sections) if (!plan.sections.some((s) => s.id === id)) add('UNPLANNED_SECTION', `sections/${id}.oui`, 'This manifest page is not in the plan.')
    for (const [file, source] of Object.entries(topic.files)) {
      const composition = inspectComposition(source)
      if (composition.statements.filter((s) => s.name === 'root').length !== 1) add('ROOT_COUNT_INVALID', file, 'Every virtual file needs exactly one root assignment.')
      if (file.endsWith('.narrate.oui') && composition.rootComponent !== 'Narration') add('NARRATION_ROOT_INVALID', file, 'Narration needs root = Narration(...).')
    }
  }
  return { schemaVersion: 1, status: diagnostics.length ? 'mismatch' as const : 'aligned' as const, sourceVersion: `source-v1:${textHash(oui)}`, diagnostics, compilation: 'not-run' as const, layout: 'not-measured' as const, teachingQuality: 'not-evaluated' as const }
}
