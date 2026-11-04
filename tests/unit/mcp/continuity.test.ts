import { describe, expect, it } from 'vitest'
import { Client, InMemoryTransport } from '@modelcontextprotocol/client'
import { createLoomServer } from '../../../src/mcp/server'
import { createLearningRepository, type LearningRecordPort, type LearningRecord, type VersionedLearningRecord } from '../../../src/core/supporting/learner-progress/memory/repository'

// Synthetic durable-port fixture shared by separate client/server instances, never production storage.
function durableFixture(): LearningRecordPort {
  const rows = new Map<string, VersionedLearningRecord>()
  let revision = 0
  return {
    async read(key) { return rows.has(key) ? structuredClone(rows.get(key)!) : null },
    async compareAndSwap(key, expectedVersion, record) {
      if ((rows.get(key)?.version ?? null) !== expectedVersion) return null
      const saved = { version: String(++revision), record: structuredClone(record) }
      rows.set(key, saved)
      return structuredClone(saved)
    },
  }
}
const record: LearningRecord = { schemaVersion: 1, topicId: 'demo', oui: '// @loom-topic demo\n// === topic.oui ===\nroot = Topic("T", "C", "D", [])', sources: [{ id: 'ref', kind: 'web', uri: 'https://example.com/reference', revision: 'v1', supports: [] }], events: [{ id: 'answer-1', t: '2026-01-01T00:00:00Z', device: 'fixture-client', topic: 'demo', item: 'sections/quiz.oui#q1', kind: 'answered', result: 'wrong' }] }
const learner = { subject: 'verified-subject', scopes: ['learning:read', 'learning:write'] as const }
const textOf = (result: unknown) => JSON.parse((result as { content: Array<{ text: string }> }).content[0].text)
async function clientFor(port: LearningRecordPort, name: string) {
  const [a, b] = InMemoryTransport.createLinkedPair()
  await createLoomServer({ repository: createLearningRepository(port, learner) }).connect(b)
  const client = new Client({ name, version: '1' })
  await client.connect(a)
  return client
}

describe('authenticated cross-client continuity', () => {
  it('continues through a new server and different assistant without process-local state', async () => {
    const port = durableFixture()
    const first = await clientFor(port, 'ChatGPT-fixture')
    const saved = textOf(await first.callTool({ name: 'write_learning_record', arguments: { record, expectedVersion: null } }))
    await first.close()
    const second = await clientFor(port, 'other-MCP-client-fixture')
    try {
      const restored = textOf(await second.callTool({ name: 'read_learning_record', arguments: { topicId: 'demo' } }))
      expect(restored.record).toEqual(record)
      expect(restored.checkpoint.missed).toEqual(['sections/quiz.oui#q1'])
      const duplicate = textOf(await second.callTool({ name: 'write_learning_record', arguments: { record, expectedVersion: saved.version } }))
      expect(duplicate.checkpoint.answered).toBe(1)
      const stale = await second.callTool({ name: 'write_learning_record', arguments: { record, expectedVersion: saved.version } })
      expect(stale.isError).toBe(true)
      expect(textOf(stale).code).toBe('VERSION_CONFLICT')
      const spoof = await second.callTool({ name: 'read_learning_record', arguments: { topicId: 'demo', learnerId: 'someone-else' } })
      expect(spoof.isError).toBe(true)
    } finally { await second.close() }
  })
  it('isolates identity, enforces permissions, rejects collisions and preserves atomicity', async () => {
    const port = durableFixture()
    const repository = createLearningRepository(port, learner)
    const saved = await repository.write(record, null)
    expect(await createLearningRepository(port, { ...learner, subject: 'other' }).read('demo')).toBeNull()
    await expect(createLearningRepository(port, { subject: learner.subject, scopes: [] }).read('demo')).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await expect(createLearningRepository(port, { subject: learner.subject, scopes: ['learning:read'] }).write(record, saved.version)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await expect(repository.write({ ...record, events: [{ ...record.events[0], result: 'correct' }] }, saved.version)).rejects.toMatchObject({ code: 'EVENT_CONFLICT' })
    await expect(createLearningRepository(port, { subject: learner.subject, scopes: ['learning:write'] }).write(record, saved.version)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    const outcomes = await Promise.allSettled([repository.write(record, saved.version), repository.write(record, saved.version)])
    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1)
    expect(outcomes.filter((outcome) => outcome.status === 'rejected')).toHaveLength(1)
  })
  it('rejects cross-topic events, private payloads and mismatched source headers', async () => {
    const repository = createLearningRepository(durableFixture(), learner)
    for (const invalid of [
      { ...record, topicId: 'other' },
      { ...record, events: [{ ...record.events[0], topic: 'other' }] },
      { ...record, events: [{ ...record.events[0], privateTranscript: 'must not store' }] },
    ]) await expect(repository.write(invalid, null)).rejects.toThrow()
  })
})
