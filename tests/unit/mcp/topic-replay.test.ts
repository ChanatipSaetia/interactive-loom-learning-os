import { expect, it } from 'vitest'
import { Client, InMemoryTransport } from '@modelcontextprotocol/client'
import { createLoomServer } from '../../../src/mcp/server'
import { TOPIC_REPLAY_GUIDE } from '../../../src/core/learning-engine/composition/oui/topic-replay'
import { getStorageGuide } from '../../../src/core/learning-engine/composition/oui/storage-guide'
import { getTutorAppSkill, getTutorViewerSkill, LOOM_SERVER_INSTRUCTIONS } from '../../../src/core/learning-engine/composition/oui/tutor-skills'

it('shares unchanged-source reopening and missing-file recovery across tutor and storage instructions', () => {
  for (const guide of [getTutorAppSkill(), getTutorViewerSkill(), getStorageGuide()]) expect(guide).toContain(TOPIC_REPLAY_GUIDE)
  expect(LOOM_SERVER_INSTRUCTIONS).toContain('not regenerating')
})

it('exposes replay recovery through the existing stateless show tool without a storage endpoint', async () => {
  const [a, b] = InMemoryTransport.createLinkedPair()
  await createLoomServer().connect(b)
  const client = new Client({ name: 'reopen-regression', version: '1' })
  await client.connect(a)
  try {
    const names = (await client.listTools()).tools
    const show = names.find((t) => t.name === 'show_topic')!
    expect(show.description).toContain('never regenerate from a title or summary')
    expect(show.description).toContain('ask for the saved .loom.oui file')
    expect(names.some((t) => t.name === 'open_topic')).toBe(false)
    expect(names.some((t) => /download|upload/.test(t.name))).toBe(false)
  } finally { await client.close() }
})
