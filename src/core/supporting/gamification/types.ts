import type { DifficultyLevel } from './game-config'

// ─── Hex Node Types ────────────────────────────────────────────────────────
export type HexNodeType =
  | 'capital'
  | 'reading_sanctuary'
  | 'archive_spire'
  | 'simulation_nexus'
  | 'concept_monolith'
  | 'observatory_gallery'
  | 'quiz_encounter'
  | 'reflection_decryption'
  | 'tradeoff_workshop'
  | 'boss_lair'

export interface HexGridCoordinate {
  q: number
  r: number
}

export interface ItemReward {
  id: string
  name: string
  icon: string
  description: string
}

export interface MonsterData {
  id: string
  name: string
  type: string
  maxHp: number
  currentHp?: number
  damage: number
  icon: string
}

export interface ActiveBuff {
  stat: 'armor' | 'evasion' | 'intelligence' | 'chaos_shield' | 'extra_damage' | 'healing_penalty'
  value: number
  source: string
  durationTurns?: number
  isPenalty?: boolean
}

export interface CraftedArtifact {
  name: string
  buff: {
    stat: 'armor' | 'evasion' | 'intelligence' | 'chaos_shield'
    value: number
    label: string
  }
  vulnerability?: {
    stat: 'extra_damage' | 'healing_penalty'
    value: number
    label: string
  }
  durationTurns: number
}

export interface HexNodeData {
  id: string
  parentId?: string
  unlockedBy?: string[]
  dependsOn?: string[]
  title: string
  type: HexNodeType
  coordinates?: HexGridCoordinate
  status: 'locked' | 'unlocked' | 'cleared'
  sectionRef?: string
  description: string
  monster?: MonsterData
  rewards?: ItemReward[]
  requiredItems?: string[]
  healingAmount?: number
  buff?: {
    stat: 'armor' | 'evasion' | 'intelligence'
    value: number
    label: string
  }
  tradeoffMapping?: Record<string, string>
  sectionData?: Record<string, unknown>
}



// ─── Badges & Achievements ──────────────────────────────────────────────────
export type BadgeType = 'topic_completion' | 'flawless_victory' | 'mastery_clear' | 'tactical_craftsman'

export interface BadgeDefinition {
  id: string
  badgeType: BadgeType
  title: string
  icon: string
  description: string
  topicId?: string
}

export interface UnlockedBadge {
  id: string
  badgeType: BadgeType
  title: string
  icon: string
  description: string
  topicId?: string
  topicTitle?: string
  difficulty?: DifficultyLevel
  unlockedAt: string
}

// ─── Global Character & Topic Campaign States ──────────────────────────────
export interface CharacterAttributes {
  armor: number // Raw allocated points
  evasion: number // Raw allocated points
  intelligence: number // Raw allocated points
}

export interface DerivedCharacterStats {
  armor: number // Derived effective % damage reduction (10% to 40%)
  evasion: number // Derived effective % dodge chance / bonus seconds (10% to 40%)
  intelligence: number // Derived effective % hint / reveal chance (10% to 40%)
}

export interface GlobalCharacterState {
  level: number
  exp: number
  nextLevelExp: number
  unallocatedPoints: number
  attributes: CharacterAttributes
  unlockedBadges: UnlockedBadge[]
  totalCampaignsStarted?: number
  totalCampaignsSucceeded?: number
  topicPlayCounts?: Record<string, number>
}

export interface TopicCampaignState {
  topicId: string
  topicTitle: string
  difficulty: DifficultyLevel
  characterHp: number
  maxCharacterHp: number
  damageTakenInCampaign: number
  turnCount: number
  chaosLevel: number // System Chaos / Entropy (0 to 100). Increases when entering sections, causes healing decay at sanctuaries.

  // Global campaign sanctuary pulse pool & start marker
  isStarted?: boolean
  sanctuaryPulsesUsed?: number
  maxSanctuaryPulses?: number

  inventory: ItemReward[]
  clearedNodeIds: string[]
  activeBuffs: ActiveBuff[]
  readingVisitCounts?: Record<string, number>
  monsterHpMap?: Record<string, number>
  unlockedBadges?: UnlockedBadge[]
  nodeCoordinates?: Record<string, HexGridCoordinate>
}
