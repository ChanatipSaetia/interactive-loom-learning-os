import type { CharacterStatePort } from '../ports'
import type { GlobalCharacterState, TopicCampaignState } from '../types'

const GLOBAL_PROFILE_KEY = 'loom_gamification_global_profile'
const CAMPAIGN_PREFIX = 'loom_gamification_campaign_'

const DEFAULT_GLOBAL_PROFILE: GlobalCharacterState = {
  level: 1,
  exp: 0,
  nextLevelExp: 100,
  unallocatedPoints: 0,
  attributes: {
    armor: 5,
    evasion: 10,
    intelligence: 0,
  },
  unlockedBadges: [],
}

export class LocalStorageCharacterAdapter implements CharacterStatePort {
  async loadGlobalProfile(): Promise<GlobalCharacterState> {
    try {
      const raw = localStorage.getItem(GLOBAL_PROFILE_KEY)
      if (raw) {
        return JSON.parse(raw) as GlobalCharacterState
      }
    } catch {
      // Fallback on parse failure
    }
    return DEFAULT_GLOBAL_PROFILE
  }

  async saveGlobalProfile(profile: GlobalCharacterState): Promise<void> {
    try {
      localStorage.setItem(GLOBAL_PROFILE_KEY, JSON.stringify(profile))
    } catch (e) {
      console.warn('Failed to save global character profile to localStorage:', e)
    }
  }

  async loadTopicCampaign(topicId: string): Promise<TopicCampaignState | null> {
    try {
      const raw = localStorage.getItem(`${CAMPAIGN_PREFIX}${topicId}`)
      if (raw) {
        return JSON.parse(raw) as TopicCampaignState
      }
    } catch {
      // Fallback on parse failure
    }
    return null
  }

  async saveTopicCampaign(topicId: string, campaign: TopicCampaignState): Promise<void> {
    try {
      localStorage.setItem(`${CAMPAIGN_PREFIX}${topicId}`, JSON.stringify(campaign))
    } catch (e) {
      console.warn(`Failed to save topic campaign state for ${topicId} to localStorage:`, e)
    }
  }

  async resetTopicCampaign(topicId: string): Promise<void> {
    try {
      localStorage.removeItem(`${CAMPAIGN_PREFIX}${topicId}`)
    } catch (e) {
      console.warn(`Failed to reset topic campaign state for ${topicId}:`, e)
    }
  }
}
