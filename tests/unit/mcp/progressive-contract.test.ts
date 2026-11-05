import { describe, expect, it } from 'vitest'
import { Client, InMemoryTransport } from '@modelcontextprotocol/client'
import { getAuthoringContract, authoringContractVersion } from '../../../src/core/learning-engine/composition/oui/authoring-contract'
import { getAuthoringGuide } from '../../../src/core/learning-engine/composition/oui/authoring-guide'
import { createLoomServer } from '../../../src/mcp/server'
import { measureTool, type ToolMeasurement } from '../../../src/mcp/measurement'

describe('stateless progressive authoring contracts', () => {
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
      const catalog = await client.callTool({ name: 'get_loom_capabilities', arguments: { detail: 'index' } })
      const text = (r: unknown) => (r as { content: Array<{ text: string }> }).content.map((c) => c.text).join('')
      expect(JSON.parse(text(catalog)).contractVersion).toBe(authoringContractVersion())
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
