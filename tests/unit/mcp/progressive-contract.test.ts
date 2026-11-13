import { describe, expect, it } from 'vitest'
import { Client, InMemoryTransport } from '@modelcontextprotocol/client'
import { getAuthoringContract, authoringContractVersion } from '../../../src/core/learning-engine/composition/oui/authoring-contract'
import { getAuthoringGuide } from '../../../src/core/learning-engine/composition/oui/authoring-guide'
import { createLoomServer } from '../../../src/mcp/server'
import { measureTool, type ToolMeasurement } from '../../../src/mcp/measurement'
import { checkTopic } from '../../../src/mcp/check'
import { loadTopic } from '../../../src/mcp-app/McpApp'

describe('stateless progressive authoring contracts', () => {
  it('runs a fresh-client plan, focused retrieval, context, validation and presentation journey', async () => {
    const observations: ToolMeasurement[] = []
    const [a, b] = InMemoryTransport.createLinkedPair()
    await createLoomServer({ check: checkTopic, onMeasurement: (m) => observations.push(m) }).connect(b)
    const client = new Client({ name: 'fresh-author-fixture', version: '1' }, { capabilities: { extensions: { 'io.modelcontextprotocol/ui': { mimeTypes: ['text/html;profile=mcp-app'] } } } })
    await client.connect(a)
    const text = (r: unknown) => (r as { content: Array<{ text: string }> }).content.map((c) => c.text).join('')
    const plan = { schemaVersion: 1, topicId: 'loop', goal: 'Recognise a loop', objectives: [{ id: 'recognise', description: 'Recognise a loop', evidenceOfLearning: 'Submit a correct authored answer' }], sections: [{ id: 'quiz', title: 'Check', components: ['Quiz'], activity: 'Submit an answer', rationale: 'Collect explicit evidence', objectiveRefs: ['recognise'], assessment: { itemRefs: ['sections/quiz.oui#q1'], successCriterion: 'Correct answer' } }] }
    const files = { 'topic.oui': 'root = Topic("Loops", "Practice", "Recognise a loop", [SectionRef("quiz")])', 'sections/quiz.oui': "root = Page(\"Check\", Quiz(\"Check\", [q1]))\nq1 = QuizQuestion(\"q1\", \"Which repeats?\", [QuizChoice(\"a\", \"A loop\", true, \"Correct\")])" }
    const oui = '// @loom-topic loop\n' + Object.entries(files).map(([file, source]) => `// === ${file} ===\n${source}\n`).join('')
    try {
      expect(JSON.parse(text(await client.callTool({ name: 'read_reference', arguments: { path: 'capabilities/index.md' } }))).content).toContain('Quiz')
      expect(JSON.parse(text(await client.callTool({ name: 'validate_topic_plan', arguments: { plan } }))).valid).toBe(true)
      const guide = JSON.parse(text(await client.callTool({ name: 'read_reference', arguments: { path: 'components/Quiz.md' } })))
      expect(guide.content).toContain('QuizQuestion(')
      const context = JSON.parse(text(await client.callTool({ name: 'get_topic_context', arguments: { files, roots: ['sections/quiz.oui#q1'], plan } })))
      expect(context.designContext.sections[0].activity).toBe('Submit an answer')
      expect(context.truncated).toBe(false)
      const validation = JSON.parse(text(await client.callTool({ name: 'validate_topic', arguments: { oui, plan } })))
      expect(validation).toMatchObject({ valid: true, planAlignment: { status: 'aligned' } })
      expect(text(await client.callTool({ name: 'show_topic', arguments: { oui, plan } }))).not.toContain('oui=')
      const browser = loadTopic(oui, plan)
      expect(browser.report).toBeNull()
      expect(browser.topic?.sections[0].config?.type).toBe('quiz')
      expect(observations.map((m) => m.tool)).toEqual(['read_reference', 'validate_topic_plan', 'read_reference', 'get_topic_context', 'validate_topic', 'show_topic'])
    } finally { await client.close() }
  })
  it('refreshes stale/unknown contracts and allows explicit refresh after compaction', () => {
    const first = getAuthoringContract({ detail: 'focused', library: 'loom', components: ['Text'] })
    expect(first.coreIncluded).toBe(true)
    expect(first.coreContracts).toContain('Topic(')
    expect(first.coreContracts).toContain('SectionRef(')
    expect(first.coreContracts).toContain('NarrationStep(')
    expect(first.contractVersion).toBe(authoringContractVersion())
    const cached = getAuthoringContract({ detail: 'focused', library: 'loom', components: ['Quiz'], knownContractVersion: first.contractVersion })
    expect(cached.core).toBeNull()
    expect(cached.coreContracts).toBeNull()
    expect(cached.coreIncluded).toBe(false)
    expect(cached.contracts).toContain('Quiz(')
    expect(getAuthoringContract({ detail: 'focused', knownContractVersion: 'old' }).refresh).toBe('stale')
    expect(getAuthoringContract({ detail: 'index', knownContractVersion: first.contractVersion, forceRefresh: true }).coreIncluded).toBe(true)
  })
  it('keeps library-specific signatures, beat rules, unknown diagnostics and legacy guides', () => {
    const native = getAuthoringContract({ detail: 'focused', library: 'loom', sections: ['text'] })
    const standard = getAuthoringContract({ detail: 'focused', library: 'openui', components: ['Text'] })
    expect(native.contracts).toContain('paragraphs:')
    expect(standard.contracts).not.toContain('paragraphs:')
    expect(native.beats.text).toBeTruthy()
    expect(getAuthoringContract({ detail: 'focused', sections: ['unknown'] }).diagnostics[0].code).toBe('UNKNOWN_SECTION_TYPE')
    expect(getAuthoringGuide(['quiz'])).toContain('Quiz(')
  })
  it('measures safe aggregate boundaries and never includes content or credentials', async () => {
    const observations: ToolMeasurement[] = []
    const sensitive = { oui: 'private lesson', token: 'private credential' }
    expect(await measureTool('show_topic', 'delivery', sensitive, async () => ({ content: ['private result'] }), (m) => observations.push(m))).toEqual({ content: ['private result'] })
    expect(observations[0].requestBytes).toBeGreaterThan(0)
    expect(JSON.stringify(observations)).not.toMatch(/private|credential|oui/)
    await expect(measureTool('validate_topic', 'validation', {}, async () => { throw Error('failed') }, (m) => observations.push(m))).rejects.toThrow('failed')
    expect(observations[1].succeeded).toBe(false)
    expect(await measureTool('test', 'validation', {}, async () => 'ok', () => { throw Error('observer') })).toBe('ok')
  })
  it('keeps compact App delivery independent of topic size and preserves explicit fallback links', async () => {
    const observations: ToolMeasurement[] = []
    const [a, b] = InMemoryTransport.createLinkedPair()
    await createLoomServer({ onMeasurement: (m) => observations.push(m) }).connect(b)
    const client = new Client({ name: 'fresh-client', version: '1' }, { capabilities: { extensions: { 'io.modelcontextprotocol/ui': { mimeTypes: ['text/html;profile=mcp-app'] } } } })
    await client.connect(a)
    try {
      const catalog = await client.callTool({ name: 'read_reference', arguments: { path: 'capabilities/index.md' } })
      const text = (r: unknown) => (r as { content: Array<{ text: string }> }).content.map((c) => c.text).join('')
      expect(JSON.parse(text(catalog)).version).toMatch(/^reference-v1:/)
      const source = '// @loom-topic example\n' + 'source payload '.repeat(10000)
      const shown = text(await client.callTool({ name: 'show_topic', arguments: { oui: source } }))
      expect(shown).not.toContain('source payload')
      expect(shown).not.toContain('oui=')
      expect(shown.length).toBeLessThan(1000)
      const fallback = text(await client.callTool({ name: 'show_topic', arguments: { oui: source, viewerLink: true } }))
      expect(fallback).toContain('viewer.html')
      expect(fallback.length).toBeLessThan(13000)
      expect(observations.some((m) => m.tool === 'show_topic' && m.stage === 'delivery')).toBe(true)
    } finally { await client.close() }
  })
})

it('separates structural validity from actionable experience-readiness feedback', async () => {
  const [a, b] = InMemoryTransport.createLinkedPair()
  await createLoomServer().connect(b)
  const client = new Client({ name: 'readiness-fixture', version: '1' })
  await client.connect(a)
  const plan = { schemaVersion: 1, topicId: 'setup', goal: 'Initialize a renderer', objectives: [{ id: 'setup', description: 'Follow initialization steps', evidenceOfLearning: 'Explain each setup step' }], sections: [{ id: 'setup', title: 'Setup', components: ['Bullets'], objectiveRefs: ['setup'], activity: 'Follow numbered setup instructions', rationale: 'Concise numbered instructions preserve the linear procedure', presentation: { target: 'both', strategy: 'Present each numbered item; Read keeps the checklist visible' } }] }
  const call = async (input: unknown) => JSON.parse((await client.callTool({ name: 'validate_topic_plan', arguments: { plan: input } })).content!.map((part) => 'text' in part ? part.text : '').join(''))
  try {
    expect(await call(plan)).toMatchObject({ valid: true, advisoryDiagnostics: [], experienceReadiness: { status: 'no-advisories', teachingQuality: 'not-evaluated' } })
    expect(await call({ ...plan, sections: [{ ...plan.sections[0], activity: 'Learn', rationale: undefined }] })).toMatchObject({ valid: true, experienceReadiness: { status: 'review-needed' } })
    expect(await call(null)).toMatchObject({ valid: false, experienceReadiness: { status: 'unverified' } })
  } finally { await client.close() }
})
