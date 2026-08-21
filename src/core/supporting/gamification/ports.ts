import type {
  GlobalCharacterState,
  TopicCampaignState,
  CharacterAttributes,
  ActiveBuff,
  DifficultyLevel,
  UnlockedBadge,
} from './types'
import type { HexCampaignData } from '../../generic/hex-map'

/**
 * Driven Port: Hex Campaign Map Data Source
 */
export interface HexCampaignSourcePort {
  loadCampaign(topicId: string): Promise<HexCampaignData>
  saveCampaign?(topicId: string, campaign: HexCampaignData): Promise<void>
}

/**
 * Driven Port: Character and Campaign State Persistence
 */
export interface CharacterStatePort {
  loadGlobalProfile(): Promise<GlobalCharacterState>
  saveGlobalProfile(profile: GlobalCharacterState): Promise<void>
  loadTopicCampaign(topicId: string): Promise<TopicCampaignState | null>
  saveTopicCampaign(topicId: string, campaign: TopicCampaignState): Promise<void>
  resetTopicCampaign(topicId: string): Promise<void>
}

/**
 * Driving Port: Gamification Runtime Orchestration Context
 */
export interface GamificationRuntimePort {
  campaign: HexCampaignData | null
  topicState: TopicCampaignState | null
  globalProfile: GlobalCharacterState | null
  isLoading: boolean
  error: string | null

  // Actions
  selectNode: (nodeId: string) => void
  setDifficulty: (difficulty: DifficultyLevel) => void
  resolveQuizAnswer: (isCorrect: boolean, nodeMonsterId?: string) => void
  completeNode: (nodeId: string) => void
  takeDamage: (damage: number) => void
  awardExp: (expAmount: number) => void
  unlockBadge: (badge: UnlockedBadge) => void
  clearBadges: () => void
  applySanctuaryTickHeal: (activeSeconds: number, nodeId: string) => void
  applyCraftedBuff: (buff: ActiveBuff, vulnerability?: ActiveBuff) => void
  allocateStatPoint: (stat: keyof CharacterAttributes) => void
  resetCampaign: (targetTopicId?: string) => Promise<void>
}
