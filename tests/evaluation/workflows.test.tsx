// Synthetic offline fixtures. No external research, model calls, real learner data or semantic quality scores.
// @ts-expect-error Node fs types are not installed in this repository
import { mkdirSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { getAuthoringGuide } from '../../src/core/learning-engine/composition/oui/authoring-guide'
import { validateTopicPlan } from '../../src/core/learning-engine/composition/oui/topic-plan'
import { getCapabilityCatalog } from '../../src/core/learning-engine/composition/oui/capability-catalog'
import { resolveTopicContext } from '../../src/core/supporting/authoring-editor/assistant/context-graph'
import { checkSection, checkTopic } from '../../src/mcp/check'
import { editTopicSource } from '../../src/mcp/edit-topic'
import { compileViewerTopic } from '../../src/viewer/compileTopic'
import { TopicView } from '../../src/viewer/ViewerApp'
import { registerCoreSections } from '../../src/core/learning-engine/registry/register-core-sections'
import { LearnerMemoryProvider, memoryAdapter } from '../../src/core/supporting/learner-progress'
import { createLearningCheckpoint } from '../../src/core/supporting/learner-progress/memory/checkpoint'

const files = {
  'topic.oui': 'root = Topic("Caching fixture", "Architecture", "Choose private caching", [SectionRef("quiz")])',
  'sections/quiz.oui': "root = Page(\"Caching check\", Quiz(\"Caching check\", [q1]))\nq1 = QuizQuestion(\"q1\", \"Which directive restricts caching to this browser?\", [c1, c2])\nc1 = QuizChoice(\"a\", \"private\", true, \"Only private caches\")\nc2 = QuizChoice(\"b\", \"public\", false, \"Shared caches may store it\")",
  'sections/quiz.narrate.oui': 'root = Narration([NarrationStep("q1", "Choose a cache policy")])',
}
const bundle = (input = files) => '// @loom-topic caching-fixture\n' + Object.entries(input).map(([file, source]) => `// === ${file} ===\n${source}\n`).join('')
const supported = new Set(getCapabilityCatalog().sections.map((section) => section.type))
const plan = { schemaVersion: 1, topicId: 'caching-fixture', goal: 'Choose a policy', objectives: [{ id: 'private-cache', description: 'Identify private caching' }], sections: [{ id: 'quiz', title: 'Check', objectiveRefs: ['private-cache'], representation: 'quiz', activity: 'Choose', evidenceRefs: ['rfc'] }], sources: [{ id: 'rfc', kind: 'web', uri: 'https://www.rfc-editor.org/rfc/rfc9111.html', revision: 'RFC9111', locator: 'section-5.2.2.7', supports: ['private-cache'] }] }

describe('offline AI experience evaluation', () => {
  it('measures fixed create/edit/validate/continue fixtures and context variants', async () => {
    expect(validateTopicPlan(plan, supported)).toEqual([])
    expect(checkTopic(bundle()).ok).toBe(true)
    expect(checkSection(files['sections/quiz.narrate.oui'], 'sections/quiz.narrate.oui', files['sections/quiz.oui']).diagnostics).toEqual([])
    const malformed = bundle().replace('QuizQuestion(', 'QuizQuestionTypo(')
    expect(checkTopic(malformed).ok).toBe(false)
    const repaired = editTopicSource('caching-fixture', malformed, [{ file: 'sections/quiz.oui', statements: files['sections/quiz.oui'].split('\n')[1] }])
    expect(repaired.ok).toBe(true)
    if (!repaired.ok) throw Error(repaired.error)
    expect(checkTopic(repaired.oui).ok).toBe(true)

    const start = performance.now()
    const context = resolveTopicContext({ files, roots: ['sections/quiz.oui#q1'] })
    const elapsedMs = performance.now() - start
    const required = ['sections/quiz.oui#q1', 'sections/quiz.oui#c1', 'sections/quiz.oui#c2']
    const returned = new Set(context.sources.map((statement) => statement.id))
    const recall = required.filter((id) => returned.has(id)).length / required.length
    expect(recall).toBe(1)
    expect(context.truncated).toBe(false)
    const variants = {
      fullGuide: getAuthoringGuide(['all']).length,
      sectionFiltered: getAuthoringGuide(['quiz']).length,
      dependencyAware: getAuthoringGuide([], context.components).length,
    }
    expect(variants.dependencyAware).toBeLessThan(variants.sectionFiltered)
    expect(variants.sectionFiltered).toBeLessThan(variants.fullGuide)

    registerCoreSections()
    const topic = compileViewerTopic({ topicId: 'caching-fixture', files })
    const port = memoryAdapter()
    render(<LearnerMemoryProvider port={port} device="offline-evaluation"><TopicView topic={topic} /></LearnerMemoryProvider>)
    const correct = await screen.findByTestId('quiz-choice-0-a')
    fireEvent.click(correct)
    const events = await port.readAll()
    const checkpoint = createLearningCheckpoint('caching-fixture', events)
    expect(checkpoint.correct).toBe(1)
    expect(checkpoint.assessment.mastery).toBe('not-inferred')

    const report = {
      schemaVersion: 1, kind: 'synthetic-offline-fixtures',
      cases: ['create', 'edit', 'validate', 'continue'],
      ouiValid: true, renderedAndAnswered: true, declaredObjectiveCoverage: 1,
      declaredEvidenceLinkageValid: true, sourceTruthVerified: false,
      narrationAligned: true, dependencyRecall: recall, repairCount: 1,
      guideCharacters: variants, contextCharacters: JSON.stringify(context).length,
      retrievalLatencyMs: elapsedMs, inputTokens: null, outputTokens: null,
      modelQuality: 'not-run', humanJudgment: 'not-run',
      crossAssistantContinuity: 'separate synthetic two-client MCP test in this harness',
    }
    mkdirSync('artifacts', { recursive: true })
    writeFileSync('artifacts/ai-experience-evaluation.json', JSON.stringify(report, null, 2) + '\n')
    console.log(JSON.stringify(report))
  })
})
