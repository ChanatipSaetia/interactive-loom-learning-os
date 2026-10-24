import { describe, expect, it } from 'vitest'
import { Client, InMemoryTransport } from '@modelcontextprotocol/client'
import { createLoomServer, topicHead, type LearnerStore } from '../../../src/mcp/server'
import { readLoomFolder } from '../../../src/viewer/library'

const TOPIC = '// @loom-topic punch\n// @loom-domain fight-animation\n// === topic.oui ===\nroot = Topic("Punch", "Fight Animation", "", [SectionRef("pose")])\n// === sections/pose.oui ===\nroot = Text("Pose", ["A long section…"])\n'

async function connect(store?: LearnerStore) {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
  await createLoomServer({ appUrl: 'http://localhost:5180/mcp-app/v1/', store }).connect(serverSide)
  const client = new Client({ name: 'test', version: '0' })
  await client.connect(clientSide)
  return client
}

const loomOf = (result: unknown) => (result as { structuredContent: { loom: { kind: string; name: string; files: Record<string, string> } } }).structuredContent.loom

describe('show_library and show_domain (decision 216)', () => {
  it('cut a topic to its header and topic.oui part', () => {
    expect(topicHead(TOPIC)).toBe('// @loom-topic punch\n// @loom-domain fight-animation\n// === topic.oui ===\nroot = Topic("Punch", "Fight Animation", "", [SectionRef("pose")])\n')
  })

  it('hosted: hand the files the chat read from the drive to the app, relative to the domain folder', async () => {
    const client = await connect()
    const result = await client.callTool({ name: 'show_domain', arguments: { domain: 'fight-animation', files: [
      { path: 'Loom/fight-animation/domain.oui', text: 'root = Domain("Fight Animation", "", [TopicRef("punch")])' },
      { path: 'fight-animation/topics/punch.loom.oui', text: TOPIC },
      { path: 'progress/punch-2026-10-24.md', text: '---\nloom-progress: 1\ndomain: fight-animation\ntopic: punch\ndate: 2026-10-24\n---\n## Sections\n- [x] Pose (`pose`)\n' },
    ] } })
    const loom = loomOf(result)
    expect(loom.kind).toBe('domain')
    expect(Object.keys(loom.files).sort()).toEqual(['domain.oui', 'progress/punch-2026-10-24.md', 'topics/punch.loom.oui'])
    expect(loom.files['topics/punch.loom.oui']).not.toContain('sections/pose.oui')
    // What the app draws from it
    const { domains: [domain] } = readLoomFolder(loom.files, loom.name)
    expect(domain.topics[0]).toMatchObject({ id: 'punch', title: 'Punch', sections: ['pose'] })
    expect(domain.notes).toHaveLength(1)
    await client.close()
  })

  it('ask the chat for the files when there are none to show', async () => {
    const client = await connect()
    const result = await client.callTool({ name: 'show_library', arguments: {} })
    expect(result.isError).toBe(true)
    expect((result.content as Array<{ text: string }>)[0].text).toContain('get_storage_guide')
    await client.close()
  })

  it('local: read the memory folder itself', async () => {
    const folder: Record<string, string> = {
      'index.oui': 'root = Library([DomainRef("fight-animation")])',
      'fight-animation/domain.oui': 'root = Domain("Fight Animation", "", [TopicRef("punch")])',
      'fight-animation/topics/punch.loom.oui': TOPIC,
    }
    const store = {
      device: 'test', appendEvents: async () => {}, readEvents: async () => [], saveTopic: async () => {}, listTopics: async () => [], readTopic: async () => null,
      async readLoomFiles(domain?: string) {
        return Object.fromEntries(Object.entries(folder).filter(([p]) => !domain || p.startsWith(`${domain}/`)).map(([p, t]) => [domain ? p.slice(domain.length + 1) : p, t]))
      },
    } satisfies LearnerStore
    const client = await connect(store)
    const library = loomOf(await client.callTool({ name: 'show_library', arguments: {} }))
    expect(library.kind).toBe('library')
    expect(readLoomFolder(library.files, 'Loom').domains[0].title).toBe('Fight Animation')
    const domain = loomOf(await client.callTool({ name: 'show_domain', arguments: { domain: 'fight-animation' } }))
    expect(Object.keys(domain.files).sort()).toEqual(['domain.oui', 'topics/punch.loom.oui'])
    await client.close()
  })
})

describe('the tutoring routine from the server (decision 218)', () => {
  it('tells every chat about it when it connects, and serves loom-tutor-app\'s text', async () => {
    const client = await connect()
    expect(client.getInstructions()).toContain('call get_tutor_guide once')
    const guide = ((await client.callTool({ name: 'get_tutor_guide', arguments: {} })).content as Array<{ text: string }>)[0].text
    expect(guide.startsWith('# Loom Tutor (Loom MCP App)')).toBe(true)
    expect(guide).not.toContain('name: loom-tutor-app')
    expect(guide).toContain('Moving from the old layout')
    await client.close()
  })
})
