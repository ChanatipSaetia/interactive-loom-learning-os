import { describe, expect, it } from 'vitest'
import { Client, InMemoryTransport } from '@modelcontextprotocol/client'
import { createLoomServer } from '../../../src/mcp/server'
import { checkTopic } from '../../../src/mcp/check'
import { getAuthoringContract } from '../../../src/core/learning-engine/composition/oui/authoring-contract'
import { reviewTopicPlan, type TopicPlan } from '../../../src/core/learning-engine/composition/oui/topic-plan'

import { THREE_SPLINE_REQUEST as request, TEXT_HEAVY_REPRO_PLAN as plan, TEXT_HEAVY_REPRO_OUI as oui } from '../../fixtures/ai-experience/text-selection'

const text = (r: unknown) => (r as { content: Array<{ text: string }> }).content.map((c) => c.text).join('')
const data = (r: unknown) => JSON.parse(text(r))

it('gives the authoring index the same learning-purpose cues as capability discovery', () => {
  const index = getAuthoringContract({ detail: 'index' })
  expect(index.componentGroups?.flatMap((group) => [...group.components])).toEqual(expect.arrayContaining(['Flashcards', 'Steps', 'Bullets', 'Table', 'TradeoffSandbox']))
  expect(index).toHaveProperty('flowchart.views')
  expect(index).toHaveProperty('compositionChoices')
})

it.each(['Text explains complex concepts clearly.', 'Text is the simplest format for a detailed explanation.', 'Detailed written explanations make the capabilities easy to understand.'])('does not accept a generic Text rationale as a capability-fit decision: %s', (rationale) => {
  const p = { ...plan, sections: plan.sections.map((section) => ({ ...section, rationale })) }
  expect(reviewTopicPlan(p).filter((d) => d.code === 'UNJUSTIFIED_TEXT_SELECTION')).toHaveLength(2)
  expect(reviewTopicPlan({ ...p, sections: p.sections.map((section) => ({ ...section, rationale: 'Connected prose preserves nuanced qualifications that a table would hide.' })) }).filter((d) => d.code === 'UNJUSTIFIED_TEXT_SELECTION')).toEqual([])
  expect(reviewTopicPlan({ ...p, sections: p.sections.map((section) => ({ ...section, components: ['Bullets'] })) }).filter((d) => d.code === 'UNJUSTIFIED_TEXT_SELECTION')).toEqual([])
})

describe.each(['local', 'hosted'] as const)('representation review through %s MCP', (host) => {
  it('keeps readiness visible after compilation and at delivery, without blocking legacy clients', async () => {
    const [a, b] = InMemoryTransport.createLinkedPair()
    await createLoomServer(host === 'local' ? { check: checkTopic } : {}).connect(b)
    const client = new Client({ name: 'selection-regression', version: '1' }, { capabilities: { extensions: { 'io.modelcontextprotocol/ui': { mimeTypes: ['text/html;profile=mcp-app'] } } } })
    await client.connect(a)
    try {
      const tools = (await client.listTools()).tools
      const description = tools.find((t) => t.name === 'read_reference')!.description!
      expect(description).toContain('index.md')
      expect(description).toContain('one linked file')
      expect(description).not.toContain('1–3 sections')
      const reviewed = data(await client.callTool({ name: 'validate_topic_plan', arguments: { plan } }))
      expect(reviewed).toMatchObject({ valid: true, experienceReadiness: { status: 'review-needed' } })
      expect(reviewed.advisoryDiagnostics.map((d: { code: string }) => d.code)).toContain('UNJUSTIFIED_TEXT_SELECTION')
      if (host === 'local') {
        const compiled = data(await client.callTool({ name: 'validate_topic', arguments: { oui, plan } }))
        expect(compiled).toMatchObject({ valid: true, planAlignment: { status: 'aligned' }, experienceReadiness: { status: 'review-needed' } })
      }
      const shown = await client.callTool({ name: 'show_topic', arguments: { oui, plan } })
      expect(text(shown)).toContain('review-needed')
      expect(text(shown)).toContain('UNJUSTIFIED_TEXT_SELECTION')
      expect(text(shown).length).toBeLessThan(1000)
      const legacy = text(await client.callTool({ name: 'show_topic', arguments: { intent: 'reopen', oui } }))
      expect(legacy).toContain('Showing')
      expect(legacy).toContain('readiness not reviewed')
      expect(legacy.length).toBeLessThan(1000)
    } finally { await client.close() }
  })
})


it('uses section-specific structure cues when generic objective/action wording hides the task', () => {
  const p: TopicPlan = { ...plan, objectives: plan.objectives.map((objective) => ({ ...objective, description: 'Understand the tools' })), sections: plan.sections.map((section) => ({ ...section, activity: 'Read the overview' })) }
  expect(reviewTopicPlan(p).filter((d) => d.code === 'UNJUSTIFIED_TEXT_SELECTION')).toHaveLength(2)
})

it('bounds delivery advisories and reports omissions instead of repeating a large plan', async () => {
  const [a, b] = InMemoryTransport.createLinkedPair()
  await createLoomServer().connect(b)
  const client = new Client({ name: 'bounded-review-fixture', version: '1' }, { capabilities: { extensions: { 'io.modelcontextprotocol/ui': { mimeTypes: ['text/html;profile=mcp-app'] } } } })
  await client.connect(a)
  const p = { ...plan, sections: Array.from({ length: 30 }, (_, i) => ({ ...plan.sections[0], id: `section-${i}`, objectiveRefs: plan.objectives.map((objective) => objective.id) })) }
  try {
    const result = await client.callTool({ name: 'show_topic', arguments: { oui, plan: p } })
    const review = result.structuredContent as { advisoryDiagnostics: unknown[]; advisoryCount: number; omittedAdvisoryCount: number }
    expect(review.advisoryDiagnostics).toHaveLength(3)
    expect(review.advisoryCount).toBeGreaterThan(3)
    expect(review.omittedAdvisoryCount).toBe(review.advisoryCount - 3)
    expect(text(result).length).toBeLessThan(1000)
    expect(text(result)).not.toContain(request)
    expect(text(result)).not.toContain('oui=')
  } finally { await client.close() }
})
