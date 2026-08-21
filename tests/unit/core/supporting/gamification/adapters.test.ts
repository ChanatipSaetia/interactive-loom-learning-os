import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageCharacterAdapter } from '../../../../../src/core/supporting/gamification/adapters/local-storage-character-adapter'
import type { TopicCampaignState } from '../../../../../src/core/supporting/gamification/types'

describe('Gamification LocalStorageCharacterAdapter', () => {
  let adapter: LocalStorageCharacterAdapter

  beforeEach(() => {
    localStorage.clear()
    adapter = new LocalStorageCharacterAdapter()
  })

  it('loads default global character profile when empty', async () => {
    const profile = await adapter.loadGlobalProfile()
    expect(profile.level).toBe(1)
    expect(profile.attributes.armor).toBe(5)
  })

  it('persists and retrieves updated global profile', async () => {
    const profile = await adapter.loadGlobalProfile()
    profile.level = 3
    profile.attributes.armor = 10
    await adapter.saveGlobalProfile(profile)

    const loaded = await adapter.loadGlobalProfile()
    expect(loaded.level).toBe(3)
    expect(loaded.attributes.armor).toBe(10)
  })

  it('persists, retrieves, and resets topic campaign state', async () => {
    const topicState: TopicCampaignState = {
      topicId: 'demo',
      topicTitle: 'Demo Realm',
      difficulty: 'normal',
      characterHp: 85,
      maxCharacterHp: 100,
      damageTakenInCampaign: 15,
      turnCount: 4,
      chaosLevel: 10,
      inventory: [{ id: 'shield', name: 'Shield', icon: '🛡️', description: '' }],
      clearedNodeIds: ['capital', 'camp-1'],
      activeBuffs: [],
    }

    await adapter.saveTopicCampaign('demo', topicState)
    const loaded = await adapter.loadTopicCampaign('demo')
    expect(loaded?.characterHp).toBe(85)
    expect(loaded?.clearedNodeIds).toHaveLength(2)

    await adapter.resetTopicCampaign('demo')
    const afterReset = await adapter.loadTopicCampaign('demo')
    expect(afterReset).toBeNull()
  })
})
