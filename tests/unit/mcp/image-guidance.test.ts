import { expect, it } from 'vitest'
import { Client, InMemoryTransport } from '@modelcontextprotocol/client'
import { APP_URI, createLoomServer } from '../../../src/mcp/server'
import { readReference, referencePaths } from '../../../src/core/learning-engine/composition/oui/reference-navigation'
import { IMAGE_DELIVERY_GUIDE } from '../../../src/core/learning-engine/composition/oui/image-delivery-guide'
import { getWriterSkillReferences } from '../../../src/core/learning-engine/composition/oui/skill-references'
import { validateOUISection } from '../../../src/core/learning-engine/validation/oui-gateway'

it.each([
  [{ appUrl: 'https://assets.example.test/player/' }, 'hosted-assets', ['https://assets.example.test', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'], ['https://assets.example.test']],
  [{ appHtml: '<html>Bundled player</html>' }, 'bundled', ['data:'], []],
] as const)('reports the actual requested resource policy without expanding CSP: %s', async (options, mode, resources, connections) => {
  const [a, b] = InMemoryTransport.createLinkedPair()
  await createLoomServer(options).connect(b)
  const client = new Client({ name: 'image-policy', version: '1' })
  await client.connect(a)
  try {
    const resource = await client.readResource({ uri: APP_URI })
    const csp = (resource.contents[0] as unknown as { _meta: { ui: { csp: unknown } } })._meta.ui.csp
    expect(csp).toEqual({ resourceDomains: [...resources], connectDomains: [...connections] })
    const runtime = await client.callTool({ name: 'read_reference', arguments: { path: 'runtime.md' } })
    const data = JSON.parse((runtime.content as { text: string }[])[0].text)
    expect(data.deployment.imagePolicy).toEqual({ mode, resourceDomains: [...resources], connectDomains: [...connections], enforcement: 'host-controlled', imageUploadAvailable: false })
    expect(data.next.map((next: { path: string }) => next.path)).toContain('contracts/images.md')
  } finally { await client.close() }
})

it('keeps image constraints focused and available through MCP and installed skills', () => {
  expect(referencePaths()).toContain('contracts/images.md')
  expect(readReference('contracts/images.md')).toHaveProperty('content', expect.stringContaining(IMAGE_DELIVERY_GUIDE))
  expect(readReference('components/Image.md')).toHaveProperty('content', expect.stringContaining(IMAGE_DELIVERY_GUIDE))
  expect(readReference('components/Table.md')).toHaveProperty('content', expect.not.stringContaining(IMAGE_DELIVERY_GUIDE))
  expect(getWriterSkillReferences()['references/core/images.md']).toContain(IMAGE_DELIVERY_GUIDE)
  expect(readReference('capabilities/Image.md')).toHaveProperty('next', expect.arrayContaining([expect.objectContaining({ path: 'contracts/images.md' })]))
})

it('does not confuse source validity with permission to load a remote image', () => {
  const result = validateOUISection('root = Page("Photo", Image("A teaching example", "https://unlisted.example.test/photo.png"))')
  expect(result.diagnostics).toEqual([])
  expect(IMAGE_DELIVERY_GUIDE).toContain('262144 JavaScript characters')
  expect(IMAGE_DELIVERY_GUIDE).toContain('does not explicitly declare data:')
})
