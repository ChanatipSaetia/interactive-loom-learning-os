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

it('routes every intent and preserves policies and availability without the retired tools', async () => {
  const entry = node('index.md')
  for (const path of ['workflow/edit.md', 'tutoring/index.md', 'storage/index.md', 'display/library.md', 'display/domain.md', 'runtime.md']) {
    expect(entry.next.map((n) => n.path)).toContain(path)
    expect(node(path).content).toBeTruthy()
  }
  expect(node('storage/overview.md').content).toContain('one subject area')
  expect(node('tutoring/overview.md').content).toContain('Loom MCP App')
  expect(node('tutoring/progress-notes.md').content).toContain('## Answers')
  expect(node('storage/saving.md').content).toContain('Replace, never duplicate')
  expect(node('capabilities/Flowchart.md').content).toContain('data-flow')
  expect(node('capabilities/Quiz.md').content).toContain('Submit an answer')
  for (const path of referencePaths().filter((p) => !p.startsWith('components/'))) {
    expect(node(path).content, path).not.toMatch(/get_authoring_guide|get_loom_capabilities|get_tutor_guide|get_storage_guide/)
    for (const next of node(path).next) expect(referencePaths()).toContain(next.path)
  }
})

it('accepts linked full URIs and relative paths as the same canonical reference', () => {
  for (const path of ['index.md', 'workflow/understand.md', 'components/Table.md']) {
    expect(readReference(REFERENCE_ROOT + path)).toEqual(readReference(path))
  }
  expect(readReference()).toEqual(readReference('index.md'))
  for (const path of ['topic-authoring.md', 'components.md', 'https://example.com/index.md', '../index.md', 'loom://references/%2e%2e/index.md', 'components/%2e%2e/index.md', 'loom://references/index.md?x=1', 'loom://references/%', 'components/toString.md']) {
    const result = readReference(path)
    expect(result).toMatchObject({ error: 'REFERENCE_NOT_FOUND', entryPath: 'index.md', next: [{ path: 'index.md', uri: REFERENCE_ROOT + 'index.md' }] })
    expect(node(result.next[0].path).content).toBeTruthy()
  }
})

it('returns nonempty structured data and identical text for default, path and URI tool calls', async () => {
  const [a, b] = InMemoryTransport.createLinkedPair()
  await createLoomServer().connect(b)
  const client = new Client({ name: 'reference-contract', version: '1' })
  await client.connect(a)
  try {
    let first: unknown
    for (const args of [{}, { path: 'index.md' }, { path: REFERENCE_ROOT + 'index.md' }]) {
      const result = await client.callTool({ name: 'read_reference', arguments: args })
      expect(result.isError).not.toBe(true)
      expect(result.structuredContent).toMatchObject({ path: 'index.md', content: expect.stringContaining('# Loom: start here'), next: expect.any(Array) })
      expect(JSON.parse((result.content as { text: string }[])[0].text)).toEqual(result.structuredContent)
      if (first) expect(result.structuredContent).toEqual(first)
      first = result.structuredContent
    }
    const failed = await client.callTool({ name: 'read_reference', arguments: { path: 'components.md' } })
    expect(failed.isError).toBe(true)
    expect(failed.structuredContent).toMatchObject({ error: 'REFERENCE_NOT_FOUND', entryPath: 'index.md' })
    const resource = await client.readResource({ uri: REFERENCE_ROOT + 'index.md' })
    expect(JSON.parse((resource.contents[0] as { text: string }).text)).toEqual(first)
  } finally { await client.close() }
})
