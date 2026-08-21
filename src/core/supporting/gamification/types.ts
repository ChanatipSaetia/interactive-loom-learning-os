// ─── Hex Node Types ────────────────────────────────────────────────────────
export type HexNodeType =

  | 'capital'
  | 'reading_sanctuary'
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
  title: string
  type: HexNodeType
  coordinates?: HexGridCoordinate
  status: 'locked' | 'unlocked' | 'cleared' | 'threatened'
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



// ─── Difficulty Level ──────────────────────────────────────────────────────
export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'nightmare'

export interface DifficultyConfig {
  id: DifficultyLevel
  label: string
  icon: string
  damageMultiplier: number
  expBonusMultiplier: number
  chaosMultiplier: number
  description: string
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Apprentice (Easy)',
    icon: '🌱',
    damageMultiplier: 0.7,
    expBonusMultiplier: 1.0,
    chaosMultiplier: 0.5,
    description: 'Reduced monster damage (-30%) and slower Chaos generation. Ideal for gentle learning.',
  },
  normal: {
    id: 'normal',
    label: 'Architect (Normal)',
    icon: '⚔️',
    damageMultiplier: 1.0,
    expBonusMultiplier: 1.2,
    chaosMultiplier: 1.0,
    description: 'Balanced challenge with +20% EXP bonus.',
  },
  hard: {
    id: 'hard',
    label: 'Master (Hard)',
    icon: '🔥',
    damageMultiplier: 1.5,
    expBonusMultiplier: 1.6,
    chaosMultiplier: 1.5,
    description: '+50% monster damage & accelerated System Chaos. Yields +60% EXP bonus.',
  },
  nightmare: {
    id: 'nightmare',
    label: 'Grandmaster (Nightmare)',
    icon: '☠️',
    damageMultiplier: 2.0,
    expBonusMultiplier: 2.2,
    chaosMultiplier: 2.0,
    description: 'Double damage & intense Chaos buildup! Earn +120% EXP bonus for the bravest.',
  },
}

// ─── Global Character & Topic Campaign States ──────────────────────────────
export interface CharacterAttributes {
  armor: number // Reduces damage taken
  evasion: number // % Chance to dodge damage/retry choice
  intelligence: number // % Chance to get hints / highlight answers
}

export interface GlobalCharacterState {
  level: number
  exp: number
  nextLevelExp: number
  unallocatedPoints: number
  attributes: CharacterAttributes
  unlockedBadges: Array<{
    id: string
    title: string
    icon: string
    description: string
    unlockedAt: string
  }>
}

export interface TopicCampaignState {
  topicId: string
  topicTitle: string
  difficulty: DifficultyLevel
  characterHp: number
  maxCharacterHp: number
  turnCount: number
  chaosLevel: number // System Chaos / Entropy (0 to 100). Increases when entering sections, causes healing decay at sanctuaries.
  maxChaosLevel: number
  decayThreatLevel: number // Increases HP loss per turn if hexes neglected

  inventory: ItemReward[]
  clearedNodeIds: string[]
  activeBuffs: ActiveBuff[]
  readingVisitCounts?: Record<string, number>
}
