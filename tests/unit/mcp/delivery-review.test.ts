import { SECTION_FIXTURES } from '../core/learning-engine/composition/oui/fixtures'
import { checkTopic } from '../../../src/mcp/check'
import { expect, it } from 'vitest'
import { Client, InMemoryTransport } from '@modelcontextprotocol/client'
import { createLoomServer } from '../../../src/mcp/server'
import { reviewTopicSource } from '../../../src/core/learning-engine/composition/oui/source-plan-review'
import { topicPlanReview, type TopicPlan } from '../../../src/core/learning-engine/composition/oui/topic-plan'
import { reviewDelivery } from '../../../src/mcp/delivery-review'

const plan: TopicPlan = {
  schemaVersion: 1, topicId: 'frameworks', goal: 'Compare Svelte and React for a project',
  objectives: [{ id: 'choose', description: 'Justify an option for a project constraint', evidenceOfLearning: 'Explain which constraint determines the choice' }],
  sections: [{ id: 'choice', title: 'Choose for a project', objectiveRefs: ['choose'], components: ['TradeoffSandbox'], activity: 'Compare suitability under different project constraints', rationale: 'TradeoffSandbox preserves gains, costs and context-dependent suitability.', presentation: { target: 'both', strategy: 'Read explores options; Present compares each authored situation.' } }],
}
const prose = 'root = Page("Choose", LessonText("Options", ["Consider the team and project."]))'
const bundle = (page = prose) => `// @loom-topic frameworks\n// === topic.oui ===\nroot = Topic("Frameworks", "Web", "Choose", [SectionRef("choice")])\n// === sections/choice.oui ===\n${page}\n`
const textPlan: TopicPlan = { ...plan, sections: [{ ...plan.sections[0], components: ['LessonText'], rationale: 'Connected prose explains the concepts.' }] }

it('flags the actual failure pattern: prose keywords do not justify a prose-only comparison', () => {
  const review = topicPlanReview(textPlan, true)
  expect(review.advisoryDiagnostics.map((d) => d.code)).toEqual(expect.arrayContaining(['UNJUSTIFIED_TEXT_SELECTION', 'GOAL_COMPOSITION_REVIEW']))
  const narrowed = { ...textPlan, objectives: [{ ...plan.objectives[0], description: 'Explain the framework' }], sections: [{ ...textPlan.sections[0], title: 'Overview', activity: 'Read the overview' }] }
  expect(topicPlanReview(narrowed, true).advisoryDiagnostics.map((d) => d.code)).toContain('GOAL_COMPOSITION_REVIEW')
})
it('detects missing planned activities, including unused and string decoys', () => {
  for (const page of [prose, prose + '\nunused = TradeoffSandbox("Unused", [], [])', 'root = Page("Choose", LessonText("Words", ["TradeoffSandbox(…)"]))']) {
    expect(reviewTopicSource(bundle(page), plan).diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'COMPOSITION_MISMATCH', repairTarget: 'sections/choice.oui#root' })]))
  }
  const alias = 'root = page\npage = Page("Choose", activity)\nactivity = TradeoffSandbox("Choose", [], [])'
  expect(reviewTopicSource(bundle(alias), plan)).toMatchObject({ status: 'aligned', compilation: 'not-run', layout: 'not-measured' })
  expect(reviewTopicSource(bundle(prose.replace('root = ', '')), plan).status).toBe('mismatch')
})
it('requires repairs for missing fields, and binds explicit design resolutions to the current plan', () => {
  const review = topicPlanReview(textPlan, true)
  const resolutions = review.advisoryDiagnostics.map((d) => ({ code: d.code, path: d.path, planVersion: review.planVersion!, reason: 'This page preserves a nuanced argument that a compact table would obscure; source review still checks the exact declared composition.' }))
  expect(reviewDelivery(bundle(), textPlan, []).deliveryReview.status).toBe('blocked')
  expect(reviewDelivery(bundle(), textPlan, resolutions).deliveryReview.status).toBe('accepted-for-player-check')
  const changed = { ...textPlan, goal: textPlan.goal + ' in detail' }
  expect(reviewDelivery(bundle(), changed, resolutions).deliveryReview.errors.map((e) => e.code)).toContain('INVALID_ADVISORY_RESOLUTION')
  const missing: TopicPlan = { ...textPlan, sections: [{ ...textPlan.sections[0], presentation: undefined }] }
  const missingReview = topicPlanReview(missing, true)
  const blanket = missingReview.advisoryDiagnostics.map((d) => ({ ...resolutions[0], code: d.code, path: d.path, planVersion: missingReview.planVersion! }))
  expect(reviewDelivery(bundle(), missing, blanket).deliveryReview.status).toBe('blocked')
  expect(reviewDelivery(bundle(), missing, blanket).deliveryReview.unresolvedAdvisories.map((d) => d.code)).toContain('MISSING_PRESENTATION_STRATEGY')
})
it.each(['hosted', 'local'])('blocks a planned sandbox replaced by text before display or save on %s MCP', async (host) => {
  const [a, b] = InMemoryTransport.createLinkedPair()
  let checked = 0
  await createLoomServer(host === 'local' ? { check: () => { checked++; return { ok: true, sections: ['choice'], report: null } } } : {}).connect(b)
  const client = new Client({ name: 'delivery-regression', version: '1' })
  await client.connect(a)
  try {
    const missing = await client.callTool({ name: 'show_topic', arguments: { oui: bundle() } })
    expect(missing.isError).toBe(true)
    expect(missing.structuredContent).toMatchObject({ deliveryReview: { status: 'blocked', errors: [expect.objectContaining({ code: 'PLAN_REQUIRED' })] } })
    const mismatch = await client.callTool({ name: 'show_topic', arguments: { oui: bundle(), plan } })
    expect(mismatch.isError).toBe(true)
    expect(mismatch.structuredContent).toMatchObject({ sourceReview: { status: 'mismatch', diagnostics: [expect.objectContaining({ code: 'COMPOSITION_MISMATCH' })] } })
    expect(mismatch._meta?.loomTopic).toBeUndefined()
    expect(checked).toBe(0)
    const read = await client.callTool({ name: 'show_topic', arguments: { oui: bundle(), intent: 'reopen' } })
    expect(read.isError).not.toBe(true)
    const proseReview = topicPlanReview(textPlan, true)
    const accepted = await client.callTool({ name: 'show_topic', arguments: { oui: bundle(), plan: textPlan, advisoryResolutions: proseReview.advisoryDiagnostics.map((d) => ({ code: d.code, path: d.path, planVersion: proseReview.planVersion!, reason: 'We preserve a qualified argument that a simple table would hide; this explains the specific prose choice for this page.' })) } })
    expect(accepted.isError).not.toBe(true)
    expect(accepted.structuredContent).toMatchObject({ deliveryReview: { status: 'accepted-for-player-check' } })
    expect(accepted._meta?.loomTopic).toMatchObject({ oui: bundle(), plan: textPlan })
  } finally { await client.close() }
})

it('does not save or return playable source for a rejected new topic', async () => {
  const [a, b] = InMemoryTransport.createLinkedPair()
  let saved = 0
  await createLoomServer({
    store: { device: 'test', appendEvents: async () => {}, readEvents: async () => [], saveTopic: async () => { saved++ }, listTopics: async () => [], readTopic: async () => null },
    check: () => ({ ok: true, topicId: 'frameworks', sections: ['choice'], report: null }),
  }).connect(b)
  const client = new Client({ name: 'no-save-rejected', version: '1' })
  await client.connect(a)
  try {
    const result = await client.callTool({ name: 'show_topic', arguments: { oui: bundle(), plan } })
    expect(result.isError).toBe(true)
    expect(saved).toBe(0)
    expect(result._meta?.loomTopic).toBeUndefined()
  } finally { await client.close() }
})

it.each(['hosted', 'local'])('accepts an implemented, compiler-valid sandbox on %s', async (host) => {
  const source = bundle(SECTION_FIXTURES['tradeoff-sandbox'])
  expect(checkTopic(source).ok).toBe(true)
  const [a, b] = InMemoryTransport.createLinkedPair()
  await createLoomServer(host === 'local' ? { check: checkTopic } : {}).connect(b)
  const client = new Client({ name: 'real-sandbox-delivery', version: '1' })
  await client.connect(a)
  try {
    const result = await client.callTool({ name: 'show_topic', arguments: { oui: source, plan } })
    expect(result.isError).not.toBe(true)
    expect(result.structuredContent).toMatchObject({ sourceReview: { status: 'aligned' }, deliveryReview: { status: 'accepted-for-player-check', sourceValidity: host === 'local' ? 'valid' : 'not-compiled' } })
    expect(result._meta?.loomTopic).toMatchObject({ oui: source, plan })
  } finally { await client.close() }
})
it('allows justified prose without requiring an arbitrary interactive component', () => {
  const proseRequest: TopicPlan = { ...textPlan, goal: 'Compare these interpretations in three sentences', sections: [{ ...textPlan.sections[0], rationale: 'Connected prose preserves nuanced qualifications that a compact table would hide.' }] }
  expect(topicPlanReview(proseRequest, true).advisoryDiagnostics).toEqual([])
  expect(reviewDelivery(bundle(), proseRequest, []).deliveryReview.status).toBe('accepted-for-player-check')
})
