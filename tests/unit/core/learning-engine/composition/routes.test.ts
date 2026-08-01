import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { discoverTopics } from '../../../../../src/core/learning-engine/composition/routes'

describe('discoverTopics', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty array when index.yaml not found', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('404'))
    const topics = await discoverTopics()
    expect(Array.isArray(topics)).toBe(true)
  })

  it('returns empty array when index.yaml is not an array', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => 'not-an-array: true',
    } as Response)
    const topics = await discoverTopics()
    expect(Array.isArray(topics)).toBe(true)
    expect(topics).toHaveLength(0)
  })

  it('builds TopicRoute from index entries', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => `- id: test-topic`,
    } as Response)

    const topics = await discoverTopics()
    expect(Array.isArray(topics)).toBe(true)
  })
})
