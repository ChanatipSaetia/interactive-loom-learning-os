// @ts-expect-error Node's fs has no types in this project (see tests/unit/sections/present/helpers.ts)
import { readFileSync, readdirSync } from 'fs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Client, InMemoryTransport } from '@modelcontextprotocol/client'
import { APP_URI, DEFAULT_APP_URL, appShell, createLoomServer, type LearnerStore } from '../../../src/mcp/server'
import { checkTopic } from '../../../src/mcp/check'
import { mergeEvents, stampEvent, type LearnerEvent } from '../../../src/core/supporting/learner-progress'

/** A topic folder as one .loom.oui text, as Studio exports it. */
function topicSource(id: string): string {
  const dir = `public/content/${id}`
  let text = `// @loom-topic ${id}\n// === topic.oui ===\n${readFileSync(`${dir}/topic.oui`, 'utf8')}`
  for (const f of (readdirSync(`${dir}/sections`) as string[]).sort()) text += `// === sections/${f} ===\n${readFileSync(`${dir}/sections/${f}`, 'utf8')}`
  return text
}

const textOf = (result: unknown) => ((result as { content: Array<{ text: string }> }).content).map((c) => c.text).join('')

describe('checkTopic', () => {
  const oui = topicSource('chinese101-day1')

  it('accepts a valid topic', () => {
    const check = checkTopic(oui)
    expect(check.ok).toBe(true)
    expect(check.report).toBeNull()
    expect(check.sections).toContain('quiz')
  })

  it('names the file and line of an error, as a fix request', () => {
    const check = checkTopic(oui.replace('root = Quiz(', 'root = Quizz('))
    expect(check.ok).toBe(false)
    expect(check.report).toContain('sections/quiz.oui')
    expect(check.report).toContain('Quizz')
    expect(check.report).toContain('Fix only what they point at')
  })

  it('reports text that is not a topic', () => {
    const check = checkTopic('')
    expect(check.ok).toBe(false)
    expect(check.report).toContain('could not open the topic')
  })
})

describe('Loom MCP server', () => {
  let client: Client

  beforeEach(async () => {
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
    await createLoomServer({ appUrl: 'http://localhost:5180/mcp-app/v1/', check: checkTopic }).connect(serverSide)
    client = new Client({ name: 'test', version: '0' })
    await client.connect(clientSide)
  })
  afterEach(() => client.close())

  it('offers the guide, validation and show_topic with its app', async () => {
    const { tools } = await client.listTools()
    expect(tools.map((t) => t.name).sort()).toEqual(['get_authoring_guide', 'show_topic', 'validate_topic'])
    const show = tools.find((t) => t.name === 'show_topic')!
    expect((show._meta as { ui?: { resourceUri?: string } }).ui?.resourceUri).toBe(APP_URI)
  })

  it('returns the guide for the section types asked for', async () => {
    const quiz = textOf(await client.callTool({ name: 'get_authoring_guide', arguments: { sections: ['quiz'] } }))
    expect(quiz).toMatch(/^Quiz\(/m)
    expect(quiz).not.toMatch(/^Flowchart\(/m)
  })

  it('validates topics and answers with the errors to fix', async () => {
    const oui = topicSource('chinese101-day1')
    expect(textOf(await client.callTool({ name: 'validate_topic', arguments: { oui } }))).toMatch(/^valid: /)
    expect(textOf(await client.callTool({ name: 'validate_topic', arguments: { oui: oui.replace('root = Quiz(', 'root = Quizz(') } }))).toContain('sections/quiz.oui')
  })

  it('tells the model what show_topic showed, with a Viewer link for a chat that does not show apps', async () => {
    const text = textOf(await client.callTool({ name: 'show_topic', arguments: { oui: topicSource('chinese101-day1') } }))
    expect(text).toContain('6 sections')
    expect(text).toContain('Play')
    expect(text).toContain('http://localhost:5180/viewer.html#present&oui=')
  })

  it('leaves the link out for a chat that shows MCP Apps', async () => {
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
    await createLoomServer({ appUrl: 'http://localhost:5180/mcp-app/v1/', check: checkTopic }).connect(serverSide)
    const appsClient = new Client({ name: 'apps', version: '0' }, { capabilities: { extensions: { 'io.modelcontextprotocol/ui': { mimeTypes: ['text/html;profile=mcp-app'] } } } })
    await appsClient.connect(clientSide)
    const text = textOf(await appsClient.callTool({ name: 'show_topic', arguments: { oui: topicSource('chinese101-day1') } }))
    expect(text).not.toContain('viewer.html')
    await appsClient.close()
  })

  it('serves a shell that loads the app from its declared origin only', async () => {
    const { contents } = await client.readResource({ uri: APP_URI })
    const ui = contents[0] as unknown as { text: string; mimeType: string; _meta: { ui: { csp: { resourceDomains: string[]; connectDomains: string[] } } } }
    expect(ui.mimeType).toBe('text/html;profile=mcp-app')
    expect(ui.text).toContain('src="http://localhost:5180/mcp-app/v1/app.js"')
    expect(ui.text).toContain('href="http://localhost:5180/mcp-app/v1/app.css"')
    expect(ui._meta.ui.csp.resourceDomains).toContain('http://localhost:5180')
    expect(ui._meta.ui.csp.connectDomains).toEqual(['http://localhost:5180'])
  })
})

describe('Loom MCP server, hosted (slice 5)', () => {
  let client: Client

  beforeEach(async () => {
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
    await createLoomServer({ appUrl: 'https://loom-mcp.example.workers.dev/mcp-app/v1/' }).connect(serverSide)
    client = new Client({ name: 'test', version: '0' })
    await client.connect(clientSide)
  })
  afterEach(() => client.close())

  it('offers only the guide and show_topic, and leaves checking to the app', async () => {
    const { tools } = await client.listTools()
    expect(tools.map((t) => t.name).sort()).toEqual(['get_authoring_guide', 'show_topic'])
    const text = textOf(await client.callTool({ name: 'show_topic', arguments: { oui: topicSource('chinese101-day1').replace('root = Quiz(', 'root = Quizz(') } }))
    expect(text).toContain('The app checks the topic')
    expect(text).not.toContain('Quizz')
    expect(text).toContain('https://loom-mcp.example.workers.dev/viewer.html#present&oui=')
  })
})

describe('appShell', () => {
  it('loads the published app by default, under its versioned path', () => {
    expect(DEFAULT_APP_URL).toMatch(/\/mcp-app\/v1\/$/)
    expect(appShell(DEFAULT_APP_URL)).toContain(`${DEFAULT_APP_URL}app.js`)
  })
})

/** The memory folder's behaviour, kept in memory. */
function memoryStore(): LearnerStore & { events: LearnerEvent[]; topics: Map<string, string> } {
  const events: LearnerEvent[] = []
  const topics = new Map<string, string>()
  const notes = [
    { name: 'chinese101-day1-2026-10-24.md', text: '---\nloom-progress: 1\ntopic: chinese101-day1\ndate: 2026-10-24\n---\n# Progress: Chinese Day 1\n\nAnswers: 3 of 4 right\n' },
    { name: 'kafka-2026-10-20.md', text: '---\nloom-progress: 1\ntopic: kafka\ndate: 2026-10-20\n---\n# Progress: Kafka\n' },
  ]
  return {
    device: 'test-machine',
    events,
    topics,
    async appendEvents(list) { events.push(...list.map((e) => ({ ...e, device: 'test-machine' }))) },
    async readEvents() { return mergeEvents(events) },
    async saveTopic({ id, oui }) { topics.set(id, oui) },
    async listTopics() { return [...topics.keys()].sort() },
    async readTopic(id) { return topics.get(id) ?? null },
    async readNotes() { return notes },
  }
}

describe('Loom MCP server with a memory folder (slice 4)', () => {
  let client: Client
  let store: ReturnType<typeof memoryStore>

  beforeEach(async () => {
    store = memoryStore()
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
    await createLoomServer({ appUrl: 'http://localhost:5180/mcp-app/v1/', store, check: checkTopic }).connect(serverSide)
    client = new Client({ name: 'test', version: '0' })
    await client.connect(clientSide)
  })
  afterEach(() => client.close())

  it('adds the memory tools, record_events for the app only', async () => {
    const { tools } = await client.listTools()
    expect(tools.map((t) => t.name).sort()).toEqual(['get_authoring_guide', 'learner_summary', 'list_topics', 'open_topic', 'record_events', 'show_topic', 'validate_topic'])
    const record = tools.find((t) => t.name === 'record_events')!
    expect((record._meta as { ui?: { visibility?: string[] } }).ui?.visibility).toEqual(['app'])
  })

  it('saves a topic it shows and opens it again', async () => {
    const oui = topicSource('chinese101-day1')
    await client.callTool({ name: 'show_topic', arguments: { oui } })
    expect(textOf(await client.callTool({ name: 'list_topics', arguments: {} }))).toContain('chinese101-day1: not started')
    const opened = await client.callTool({ name: 'open_topic', arguments: { id: 'chinese101-day1' } })
    expect((opened.structuredContent as { oui: string }).oui).toBe(oui)
    const missing = await client.callTool({ name: 'open_topic', arguments: { id: 'nope' } })
    expect(missing.isError).toBe(true)
  })

  it('keeps well-formed events and summarizes them', async () => {
    const good = stampEvent({ topic: 'chinese101-day1', item: 'sections/quiz.oui#q1', kind: 'answered', result: 'wrong' }, 'mcp-app')
    const kept = await client.callTool({ name: 'record_events', arguments: { events: [good, { id: 'junk' }] } })
    expect(textOf(kept)).toBe('kept 1 of 2 events')
    expect(store.events[0].device).toBe('test-machine')
    const summary = textOf(await client.callTool({ name: 'learner_summary', arguments: {} }))
    expect(summary).toContain('0 of 1 answers right')
    expect(summary).toContain('sections/quiz.oui#q1')
  })

  it('adds the progress notes chats on other devices saved', async () => {
    const all = textOf(await client.callTool({ name: 'learner_summary', arguments: {} }))
    expect(all).toContain('No learning recorded on this computer yet.')
    expect(all).toContain('--- chinese101-day1-2026-10-24.md ---')
    expect(all).toContain('--- kafka-2026-10-20.md ---')
    const one = textOf(await client.callTool({ name: 'learner_summary', arguments: { topic: 'chinese101-day1' } }))
    expect(one).toContain('Answers: 3 of 4 right')
    expect(one).not.toContain('kafka')
  })
})
