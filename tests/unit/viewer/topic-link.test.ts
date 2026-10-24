import { describe, expect, it } from 'vitest'
import { MAX_LINK_HASH, readTopicLink, topicLinkHash, topicLinkUrl } from '../../../src/viewer/topic-link'

const oui = '// @loom-topic tea\n// === topic.oui ===\nroot = Topic("Tea — ชา 茶", "Food", "Leaves", [SectionRef("intro")])\n'

describe('topic links (decisions 178–179)', () => {
  it('carries a topic through the hash and back, unicode included', async () => {
    const hash = await topicLinkHash(oui)
    expect(hash.startsWith('present&oui=')).toBe(true)
    expect(hash).toMatch(/^[\w&=-]+$/)
    expect(await readTopicLink(`#${hash}`)).toEqual({ present: true, oui })
  })

  it('reads #present alone', async () => {
    expect(await readTopicLink('#present')).toEqual({ present: true })
    expect(await readTopicLink('')).toEqual({ present: false })
  })

  it('compresses a real topic well below the link limit', async () => {
    const big = oui + 'x = Text("A", ["' + 'Repeated words make a long text. '.repeat(400) + '"])\n'
    const hash = await topicLinkHash(big)
    expect(hash.length).toBeLessThan(big.length / 4)
    expect(hash.length).toBeLessThan(MAX_LINK_HASH)
  })

  it('builds a Viewer URL, or none when the link would be too long', async () => {
    expect(await topicLinkUrl('https://x.test/viewer.html', oui)).toMatch(/^https:\/\/x\.test\/viewer\.html#present&oui=/)
    const random = Array.from(crypto.getRandomValues(new Uint8Array(40_000)), (b) => String.fromCharCode(33 + (b % 90))).join('')
    expect(await topicLinkUrl('https://x.test/viewer.html', random)).toBeNull()
  })

  it('rejects a damaged link', async () => {
    await expect(readTopicLink('#oui=not-deflate')).rejects.toThrow()
  })
})
