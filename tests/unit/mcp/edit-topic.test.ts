// @ts-expect-error Node's fs has no types in this project (see tests/unit/sections/present/helpers.ts)
import { readFileSync, readdirSync } from 'fs'
import { describe, expect, it } from 'vitest'
import { Client, InMemoryTransport } from '@modelcontextprotocol/client'
import { createLoomServer, type LearnerStore } from '../../../src/mcp/server'
import { checkTopic } from '../../../src/mcp/check'
import { editTopicSource, registerEditTool } from '../../../src/mcp/edit-topic'

function topicSource(id: string): string {
  const dir = `public/content/${id}`
  let text = `// @loom-topic ${id}\n// === topic.oui ===\n${readFileSync(`${dir}/topic.oui`, 'utf8')}`
  for (const f of (readdirSync(`${dir}/sections`) as string[]).sort()) text += `// === sections/${f} ===\n${readFileSync(`${dir}/sections/${f}`, 'utf8')}`
  return text
}

const oui = topicSource('chinese101-day1')
/** A whole new q1 for the quiz (statements span lines; edits replace them whole, by name). */
const NEW_Q1 = `q1 = QuizQuestion(
  "q1",
  "'你好' means?",
  [
    QuizChoice("a", "Thank you", false, "No: that is 谢谢."),
    QuizChoice("b", "Hello", true, "Yes."),
  ],
)`

describe('editTopicSource', () => {
  it('replaces a statement by name and leaves everything else as it was', () => {
    const outcome = editTopicSource('chinese101-day1', oui, [{ file: 'sections/quiz.oui', statements: NEW_Q1 }])
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.oui).toContain(NEW_Q1)
    expect(outcome.oui).not.toContain('"\'你好\' (nǐ hǎo) แปลว่าอะไร?"')
    expect(outcome.oui).toContain('q2 = QuizQuestion(')
    expect(outcome.changed).toEqual(['replace q1 in sections/quiz.oui'])
    expect(checkTopic(outcome.oui).ok).toBe(true)
  })

  it('changes nothing when an edit cannot be placed', () => {
    const outcome = editTopicSource('chinese101-day1', oui, [{ file: 'sections/quiz.oui', statements: 'nope = DELETE' }])
    expect(outcome).toEqual({ ok: false, error: expect.stringContaining('has no statement "nope" to delete') })
    expect(editTopicSource('chinese101-day1', oui, [{ file: 'sections/missing.oui', statements: 'root = Intro("x")' }]).ok).toBe(false)
  })
})

describe('edit_topic on the local server', () => {
  it('edits the saved topic, saves it and shows the new version', async () => {
    const topics = new Map([['chinese101-day1', oui]])
    const store: LearnerStore = {
      device: 'test',
      appendEvents: async () => {},
      readEvents: async () => [],
      saveTopic: async ({ id, oui: text }) => { topics.set(id, text) },
      listTopics: async () => [...topics.keys()],
      readTopic: async (id) => topics.get(id) ?? null,
    }
    const server = createLoomServer({ appUrl: 'http://localhost:5180/mcp-app/v1/', store, check: checkTopic })
    registerEditTool(server, store, checkTopic)
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
    await server.connect(serverSide)
    const client = new Client({ name: 'test', version: '0' })
    await client.connect(clientSide)

    const broken = NEW_Q1.replace('= QuizQuestion(', '= Nope(')
    const result = await client.callTool({ name: 'edit_topic', arguments: { id: 'chinese101-day1', edits: [{ file: 'sections/quiz.oui', statements: broken }] } })
    const text = (result.content as Array<{ text: string }>)[0].text
    expect(text).toContain('Changed: replace q1 in sections/quiz.oui')
    expect(text).toContain('Fix them with edit_topic')
    expect(topics.get('chinese101-day1')).toContain(broken)
    expect((result.structuredContent as { oui: string }).oui).toBe(topics.get('chinese101-day1'))

    const missing = await client.callTool({ name: 'edit_topic', arguments: { id: 'nope', edits: [{ file: 'topic.oui', statements: 'x = 1' }] } })
    expect(missing.isError).toBe(true)
    await client.close()
  })
})
