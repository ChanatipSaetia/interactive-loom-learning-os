import { expect, it } from 'vitest'
import { Client, InMemoryTransport } from '@modelcontextprotocol/client'
import { createLoomServer } from '../../../src/mcp/server'
import { readReference, referencePaths, REFERENCE_ROOT } from '../../../src/core/learning-engine/composition/oui/reference-navigation'

function node(path: string) {
  const result = readReference(path)
  if (!('content' in result)) throw new Error(result.error)
  return result
}

it('navigates from a small entry through a selected capability to a component without loading siblings', () => {
  const entry = node('index.md')
  expect(entry.content!.length).toBeLessThan(1600)
  expect(entry.content).not.toContain('QuizQuestion(')
  expect(entry.next?.[0].path).toBe('workflow/understand.md')
  const choices = node('capabilities/index.md')
  expect(choices.content).toContain('capabilities/Flowchart.md')
  expect(choices.content).not.toContain('Flowchart(title:')
  const selected = node('capabilities/Flowchart.md')
  expect(selected.content).toContain('components/Flowchart.md')
  const component = node('components/Flowchart.md')
  expect(component.content).toContain('Flowchart(')
  expect(component.content).not.toContain('QuizQuestion(')
  expect(readReference('../secret')).toMatchObject({ error: 'REFERENCE_NOT_FOUND' })
  const paths = referencePaths()
  for (const path of paths.filter((p) => !p.startsWith('components/'))) {
    for (const next of node(path).next ?? []) expect(paths).toContain(next.path)
  }
})

it('exposes the same stateless node through MCP resources and the fallback reader', async () => {
  const [a, b] = InMemoryTransport.createLinkedPair()
  await createLoomServer().connect(b)
  const client = new Client({ name: 'navigation-test', version: '1' })
  await client.connect(a)
  try {
    const resources = await client.listResources()
    expect(resources.resources.some((r) => r.uri === `${REFERENCE_ROOT}index.md`)).toBe(true)
    const resource = await client.readResource({ uri: `${REFERENCE_ROOT}workflow/discover.md` })
    const tool = await client.callTool({ name: 'read_reference', arguments: { path: 'workflow/discover.md' } })
    expect(JSON.parse((resource.contents[0] as { text: string }).text)).toEqual(JSON.parse((tool.content as { text: string }[])[0].text))
  } finally { await client.close() }
})
