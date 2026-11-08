import { describe, expect, it } from 'vitest'
import { checkSection } from '../../../src/mcp/check'
import { Client, InMemoryTransport } from '@modelcontextprotocol/client'
import { createLoomServer } from '../../../src/mcp/server'

describe('targeted section repair', () => {
  it('validates real OUI, reports dangling refs and attributes file, section and line', () => {
    expect(checkSection("root = Page(\"T\", LessonText(\"T\", [\"One\"]))", 'sections/text.oui').valid).toBe(true)
    const broken = checkSection("root = Page(\"T\", LessonText(\"T\", [missing]))", 'sections/text.oui')
    expect(broken.valid).toBe(false)
    expect(broken.diagnostics[0]).toMatchObject({ file: 'sections/text.oui', section: 'text', line: 1, statement: 'root' })
    expect(checkSection('root = Typo("T")', 'sections/text.oui').valid).toBe(false)
  })
  it('checks narration beat alignment against the exact current section', () => {
    const text = "root = Page(\"T\", LessonText(\"T\", [\"One\"]))"
    const valid = 'root = Narration([NarrationStep("p1", "One")])'
    expect(checkSection(valid, 'sections/text.narrate.oui', text).valid).toBe(true)
    expect(checkSection(valid.replace('p1', 'p999'), 'sections/text.narrate.oui', text).diagnostics.length).toBeGreaterThan(0)
  })
  it('only exposes compiler tools when an explicit local/browser checker is provided', async () => {
    const [a, b] = InMemoryTransport.createLinkedPair()
    const server = createLoomServer({ checkSection })
    await server.connect(b)
    const client = new Client({ name: 'section-test', version: '1' })
    await client.connect(a)
    try {
      expect((await client.listTools()).tools.map((t) => t.name)).toContain('validate_section')
      const result = await client.callTool({ name: 'validate_section', arguments: { source: "root = Page(\"T\", LessonText(\"T\", [\"One\"]))", file: 'sections/text.oui' } })
      expect(result.isError).not.toBe(true)
    } finally { await client.close() }
  })
})
