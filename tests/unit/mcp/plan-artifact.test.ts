import { describe, expect, it } from 'vitest'
import { Client, InMemoryTransport } from '@modelcontextprotocol/client'
import { checkTopic } from '../../../src/mcp/check'
import { createLoomServer } from '../../../src/mcp/server'
import type { TopicPlan } from '../../../src/core/learning-engine/composition/oui/topic-plan'

const plan: TopicPlan = {
  schemaVersion: 1, topicId: 'explanation', goal: 'Explain a distinction',
  objectives: [{ id: 'distinguish', description: 'Explain the difference' }],
  sections: [{ id: 'argument', title: 'Argument', representation: 'text', activity: 'Read a connected argument', objectiveRefs: ['distinguish'] }],
}
const bundle = (source = 'root = Text("Argument", ["First premise", "Conclusion"])', id = 'explanation') =>
  `// @loom-topic ${id}\n// === topic.oui ===\nroot = Topic("Explanation", "Reasoning", "Explain", [SectionRef("argument")])\n// === sections/argument.oui ===\n${source}\n`

describe('compiled plan/artifact review', () => {
  it('accepts legitimate connected prose without imposing an interaction quota', () => {
    const check = checkTopic(bundle(), plan)
    expect(check.ok).toBe(true)
    expect(check.planAlignment).toMatchObject({ schemaVersion: 1, status: 'aligned', diagnostics: [], layout: 'not-measured', teachingQuality: 'not-evaluated' })
    expect(checkTopic(bundle()).planAlignment?.status).toBe('not-provided')
  })
  it('reports a syntactically valid representation substitution separately from OUI errors', () => {
    const check = checkTopic(bundle(), { ...plan, sections: [{ ...plan.sections[0], representation: 'quiz' }] })
    expect(check.ok).toBe(true)
    expect(check.report).toBeNull()
    expect(check.planAlignment).toMatchObject({ status: 'mismatch', diagnostics: [{ code: 'REPRESENTATION_MISMATCH', severity: 'warning', sectionId: 'argument', file: 'sections/argument.oui', repairTarget: 'sections/argument.oui#root' }] })
  })
  it('distinguishes missing and unplanned sections and topic identity', () => {
    const check = checkTopic(bundle(), { ...plan, topicId: 'other', sections: [{ ...plan.sections[0], id: 'expected' }] })
    expect(check.planAlignment?.diagnostics.map((d) => d.code)).toEqual(['TOPIC_MISMATCH', 'MISSING_SECTION', 'UNPLANNED_SECTION'])
  })
  it('never claims alignment for malformed plans or uncompiled artifacts', () => {
    expect(checkTopic(bundle(), null).planAlignment?.status).toBe('unverified')
    const broken = checkTopic(bundle('root = Typo("broken")'), plan)
    expect(broken.ok).toBe(false)
    expect(broken.planAlignment).toMatchObject({ status: 'unverified', diagnostics: [{ code: 'UNCOMPILED_ARTIFACT' }] })
    const brokenManifest = checkTopic(bundle().replace('Topic(', 'TopicTypo('), plan)
    expect(brokenManifest.planAlignment?.status).toBe('unverified')
  })
  it('binds review to source changes and remains deterministic', () => {
    const hash = checkTopic(bundle(), plan).planAlignment?.contentHash
    expect(checkTopic(bundle(), plan).planAlignment?.contentHash).toBe(hash)
    expect(checkTopic(bundle() + '// unsaved revision', plan).planAlignment?.contentHash).not.toBe(hash)
  })
  it('reports declared assessment targets that were not generated', () => {
    const planned = { ...plan, sections: [{ ...plan.sections[0], assessment: { itemRefs: ['sections/argument.oui#missing'], successCriterion: 'Explicit correct answer' } }] }
    expect(checkTopic(bundle(), planned).planAlignment?.diagnostics.map((d) => d.code)).toContain('ASSESSMENT_REFERENCE_MISSING')
  })
  it('exposes advisory review through existing local MCP validation and preserves legacy output', async () => {
    const [a, b] = InMemoryTransport.createLinkedPair()
    await createLoomServer({ check: checkTopic }).connect(b)
    const client = new Client({ name: 'plan-review-fixture', version: '1' })
    await client.connect(a)
    try {
      const textOf = (result: unknown) => (result as { content: Array<{ text: string }> }).content[0].text
      expect(textOf(await client.callTool({ name: 'validate_topic', arguments: { oui: bundle() } }))).toMatch(/^valid:/)
      const result = JSON.parse(textOf(await client.callTool({ name: 'validate_topic', arguments: { oui: bundle(), plan } })))
      expect(result).toMatchObject({ valid: true, planAlignment: { status: 'aligned' } })
    } finally { await client.close() }
  })
  it('discloses an injected legacy checker that cannot review a plan', async () => {
    const [a, b] = InMemoryTransport.createLinkedPair()
    await createLoomServer({ check: () => ({ ok: true, sections: [], report: null }) }).connect(b)
    const client = new Client({ name: 'legacy-checker-fixture', version: '1' })
    await client.connect(a)
    try {
      const result = await client.callTool({ name: 'validate_topic', arguments: { oui: bundle(), plan } })
      expect(JSON.parse((result.content as Array<{ text: string }>)[0].text).planAlignment.status).toBe('unverified')
    } finally { await client.close() }
  })
})
