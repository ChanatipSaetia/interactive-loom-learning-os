// @ts-expect-error Node's fs has no types in this project (see tests/unit/sections/present/helpers.ts)
import { readFileSync, readdirSync } from 'fs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Client, InMemoryTransport } from '@modelcontextprotocol/client'
import { APP_URI, DEFAULT_APP_URL, appShell, checkTopic, createLoomServer } from '../../../src/mcp/server'

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
    await createLoomServer({ appUrl: 'http://localhost:5180/mcp-app/v1/' }).connect(serverSide)
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

  it('tells the model what show_topic showed', async () => {
    const text = textOf(await client.callTool({ name: 'show_topic', arguments: { oui: topicSource('chinese101-day1') } }))
    expect(text).toContain('6 sections')
    expect(text).toContain('Play')
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

describe('appShell', () => {
  it('loads the published app by default, under its versioned path', () => {
    expect(DEFAULT_APP_URL).toMatch(/\/mcp-app\/v1\/$/)
    expect(appShell(DEFAULT_APP_URL)).toContain(`${DEFAULT_APP_URL}app.js`)
  })
})
