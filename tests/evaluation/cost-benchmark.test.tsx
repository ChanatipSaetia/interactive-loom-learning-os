// Same authored artifacts across retrieval variants; no model selection claims.
// @ts-expect-error Node fs types are not installed in this repository
import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { SECTION_FIXTURES } from '../unit/core/learning-engine/composition/oui/fixtures'
import { getAuthoringContract } from '../../src/core/learning-engine/composition/oui/authoring-contract'
import { getCapabilityIndex } from '../../src/core/learning-engine/composition/oui/capability-catalog'
import { getAuthoringGuide } from '../../src/core/learning-engine/composition/oui/authoring-guide'
import { resolveTopicContext } from '../../src/core/supporting/authoring-editor/assistant/context-graph'
import { compileViewerTopic } from '../../src/viewer/compileTopic'
import { checkTopic } from '../../src/mcp/check'
import { TopicView } from '../../src/viewer/ViewerApp'
import { registerCoreSections } from '../../src/core/learning-engine/registry/register-core-sections'
import { LearnerMemoryProvider, memoryAdapter } from '../../src/core/supporting/learner-progress'
import { evaluateWorkflowRuns, percentile, type WorkflowRun } from '../../src/evaluation/workflow-run'

it('benchmarks complete synthetic tasks, preserves rendering and records p50/p95 budgets', async () => {
  registerCoreSections()
  const runs: WorkflowRun[] = []
  const focusedSizes: number[] = []
  for (const [index, types] of [['text', 'quiz', 'formula-sandbox'], ['text', 'quiz', 'flashcards'], ['text', 'quiz', 'scenario']].entries()) {
    const files = Object.fromEntries(types.map((type) => [`sections/${type}.oui`, SECTION_FIXTURES[type]]))
    files['topic.oui'] = `root = Topic("Fixture", "Evaluation", "Apply a concept", [${types.map((type) => `SectionRef("${type}")`).join(',')}])`
    files['sections/quiz.narrate.oui'] = 'root = Narration([NarrationStep("q1", "Choose the goal-directed loop")])'
    const oui = `// @loom-topic fixture-${index}\n` + Object.entries(files).map(([file, text]) => `// === ${file} ===\n${text}\n`).join('')
    const focused = getAuthoringContract({ detail: 'focused', sections: types, library: 'loom' })
    focusedSizes.push(focused.measurement.estimatedTokens)
    const documents = { 'full-guide': getAuthoringGuide(['all']), 'section-filtered': getAuthoringGuide(types), progressive: JSON.stringify(getCapabilityIndex()) + JSON.stringify(focused) }
    for (const variant of ['full-guide', 'section-filtered', 'progressive'] as const) {
      const start = performance.now()
      const context = resolveTopicContext({ files, roots: ['topic.oui'] })
      expect(context.truncated).toBe(false)
      const valid = checkTopic(oui)
      expect(valid.ok, valid.report ?? '').toBe(true)
      const port = memoryAdapter()
      render(<LearnerMemoryProvider port={port} device="cost-fixture"><TopicView topic={compileViewerTopic({ topicId: `fixture-${index}`, files })} /></LearnerMemoryProvider>)
      fireEvent.click(await screen.findByTestId('quiz-choice-0-a'))
      expect((await port.readAll()).some((event) => event.result === 'correct' && event.topicVersion)).toBe(true)
      cleanup()
      const docs = documents[variant]
      runs.push({ schemaVersion: 1, runId: `fixture-${index}-${variant}`, caseId: `fixture-${index}`, variant, origin: 'synthetic', documentationEstimatedTokens: Math.ceil(docs.length / 4), reviews: [],
        events: [{ type: 'validation.completed', latencyMs: performance.now() - start, inputBytes: new TextEncoder().encode(docs + oui).length, outputBytes: JSON.stringify(valid).length, estimatedInputTokens: Math.ceil((docs.length + oui.length) / 4), estimatedOutputTokens: Math.ceil(JSON.stringify(valid).length / 4) }],
        outcome: { ouiValid: true, rendered: true, narrationValid: true, objectiveCoverage: null, dependencyRecall: 1, evidenceSupport: null, repairCount: 0 },
      })
    }
  }
  const report = { ...evaluateWorkflowRuns(runs), kind: 'synthetic-fixed-artifact-retrieval-benchmark', focusedContracts: { p50: percentile(focusedSizes, 0.5), p95: percentile(focusedSizes, 0.95) }, runs }
  // Budgets apply to this measured short-topic corpus, never silently truncate
  // required contracts. Complex topics use an explicit reviewed exemption.
  expect(report.focusedContracts.p95).toBeLessThanOrEqual(2000)
  expect(report.groups.find((g) => g.variant === 'progressive')?.budgetViolations).toEqual([])
  expect(report.groups.every((g) => g.providerTokensPerSuccess === null)).toBe(true)
  mkdirSync('artifacts', { recursive: true })
  writeFileSync('artifacts/ai-workflow-benchmark.json', JSON.stringify(report, null, 2) + '\n')
})
