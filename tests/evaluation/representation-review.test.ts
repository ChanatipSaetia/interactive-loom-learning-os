// Authored decisions and artifacts, not outputs from an external assistant.
// @ts-expect-error Node fs types are not installed in this repository
import { mkdirSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SECTION_FIXTURES } from '../unit/core/learning-engine/composition/oui/fixtures'
import { DRAWING_EXAMPLE, DRAWING_NARRATION_EXAMPLE, TABLE_CHART_EXAMPLE, TABLE_CHART_NARRATION_EXAMPLE } from '../../src/core/learning-engine/composition/oui/authoring-prompt'
import { getCapabilityCatalog, getCapabilityIndex } from '../../src/core/learning-engine/composition/oui/capability-catalog'
import { getAuthoringGuide } from '../../src/core/learning-engine/composition/oui/authoring-guide'
import { validateTopicPlan, type TopicPlan } from '../../src/core/learning-engine/composition/oui/topic-plan'
import { resolveTopicContext } from '../../src/core/supporting/authoring-editor/assistant/context-graph'
import { checkTopic } from '../../src/mcp/check'

const table = "root = Page(\"Cache attributes\", Table([Col(\"Policy\", [\"private\", \"public\"]), Col(\"Shared cache\", [\"Disallowed\", \"Allowed subject to other rules\"])]))"
const corpus = [
  { id: 'classification', request: 'Explore categories and distinguish them', type: 'taxonomy-browser', alternatives: ['openui'], source: SECTION_FIXTURES['taxonomy-browser'] },
  { id: 'procedure', request: 'Read an ordered checklist', type: 'bullets', alternatives: ['openui'], source: SECTION_FIXTURES.bullets },
  { id: 'handoffs', request: 'Trace triggers and responsibility', type: 'flowchart', alternatives: ['openui'], source: SECTION_FIXTURES.flowchart },
  { id: 'options', request: 'Compare suitability and costs', type: 'tradeoff-sandbox', alternatives: ['openui'], source: SECTION_FIXTURES['tradeoff-sandbox'] },
  { id: 'parameters', request: 'Vary an input and inspect the calculated result', type: 'formula-sandbox', alternatives: ['openui'], source: SECTION_FIXTURES['formula-sandbox'] },
  { id: 'factual-comparison', request: 'Look up factual attribute differences', type: 'openui', alternatives: ['tradeoff-sandbox'], source: table },
  { id: 'quantities', request: 'Compare supplied illustrative temperature values', type: 'openui', alternatives: [], source: TABLE_CHART_EXAMPLE, narration: TABLE_CHART_NARRATION_EXAMPLE },
  { id: 'drawing', request: 'Inspect a labelled spatial mechanism', type: 'openui', alternatives: ['image-gallery'], source: DRAWING_EXAMPLE, narration: DRAWING_NARRATION_EXAMPLE },
  { id: 'argument', request: 'Read a connected argument', type: 'text', alternatives: ['openui'], source: SECTION_FIXTURES.text },
  { id: 'dense-review', request: 'Review whether a long table is readable', type: 'openui', alternatives: ['text', 'taxonomy-browser'], source: `root = Page("Review required", Table([Col("Notes", ["${'Long factual explanation. '.repeat(100)}"])]))` },
]

const supported = new Set(getCapabilityCatalog().components.map((component) => component.component))
const componentFor: Record<string, string> = { 'taxonomy-browser': 'TaxonomyBrowser', bullets: 'Bullets', flowchart: 'Flowchart', 'tradeoff-sandbox': 'TradeoffSandbox', 'formula-sandbox': 'FormulaSandbox', openui: 'Table', text: 'TextContent', quiz: 'Quiz', 'image-gallery': 'LearningGallery' }
const planFor = (id: string, type: string, action: string): TopicPlan => ({
  schemaVersion: 1, topicId: id, goal: action,
  objectives: [{ id: 'objective', description: action }],
  sections: [{ id: 'lesson', title: 'Lesson', components: [componentFor[type] ?? type], activity: action, rationale: 'Authored fixture decision; teaching fit requires separate evaluation.', objectiveRefs: ['objective'] }],
})
const bundleOf = (id: string, source: string, narration?: string) => `// @loom-topic ${id}\n// === topic.oui ===\nroot = Topic("Fixture", "Evaluation", "Authored example", [SectionRef("lesson")])\n// === sections/lesson.oui ===\n${source}\n${narration ? `// === sections/lesson.narrate.oui ===\n${narration}\n` : ''}`

describe('offline representation decision review', () => {
  it('checks a fixed corpus without treating authored choices as model success', () => {
    const start = performance.now()
    const results = corpus.map((fixture) => {
      const plan = planFor(fixture.id, fixture.id === 'drawing' ? 'Svg' : fixture.type, fixture.request)
      expect(validateTopicPlan(plan), fixture.id).toEqual([])
      for (const alternative of fixture.alternatives) expect(supported.has(componentFor[alternative] ?? alternative)).toBe(true)
      const check = checkTopic(bundleOf(fixture.id, fixture.source, fixture.narration), plan)
      expect(check.ok, `${fixture.id}: ${check.report}`).toBe(true)
      expect(check.planAlignment?.status, fixture.id).toBe('aligned')
      expect(check.planAlignment?.teachingQuality).toBe('not-evaluated')
      expect(check.planAlignment?.layout).toBe('not-measured')
      const context = resolveTopicContext({ files: { 'sections/lesson.oui': fixture.source }, roots: ['sections/lesson.oui'] })
      expect(context.truncated).toBe(false)
      for (const reference of context.componentReferences) {
        const guide = getAuthoringGuide([], [reference.name], reference.library)
        expect(guide).not.toContain('Unknown component')
      }
      return { id: fixture.id, request: fixture.request, authoredRepresentation: fixture.type, alternatives: fixture.alternatives, ouiAndNarrationValid: true, planAlignment: check.planAlignment?.status, modelSelection: 'not-run', teachingQuality: 'not-evaluated', layout: 'not-measured' }
    })
    const indexCharacters = JSON.stringify(getCapabilityIndex()).length
    const fullCharacters = JSON.stringify(getCapabilityCatalog()).length
    const report = {
      schemaVersion: 1, kind: 'synthetic-authored-representation-corpus', cases: results,
      discovery: { indexCharacters, fullCharacters, indexEstimatedTokens: Math.ceil(indexCharacters / 4), fullEstimatedTokens: Math.ceil(fullCharacters / 4), estimateMethod: 'characters/4; not provider token counts' },
      fixtureCheckLatencyMs: performance.now() - start,
      modelTokens: null, modelLatency: null, modelSelectionSuccess: null, learnerOutcomes: 'not-measured',
      renderAndGeometry: 'not-run-for-this-corpus; compiler validity does not establish readability',
    }
    mkdirSync('artifacts', { recursive: true })
    writeFileSync('artifacts/ai-representation-review.json', JSON.stringify(report, null, 2) + '\n')
  })

  it('detects plan drift even when an all-static artifact compiles', () => {
    const check = checkTopic(bundleOf('substitution', table), planFor('substitution', 'quiz', 'Submit an answer'))
    expect(check.ok).toBe(true)
    expect(check.planAlignment?.diagnostics[0].code).toBe('COMPOSITION_MISMATCH')
  })

  it('reviews a mixed lesson without making variety the success criterion', () => {
    const plan = planFor('mixed', 'text', 'Read the explanation')
    plan.sections.push({ ...plan.sections[0], id: 'practice', components: ['Quiz'], activity: 'Submit an answer' })
    const oui = bundleOf('mixed', SECTION_FIXTURES.text)
      .replace('[SectionRef("lesson")]', '[SectionRef("lesson"), SectionRef("practice")]')
      + `// === sections/practice.oui ===\n${SECTION_FIXTURES.quiz}\n`
    expect(checkTopic(oui, plan).planAlignment?.status).toBe('aligned')
    expect(checkTopic(oui, plan).ok).toBe(true)
  })
})
