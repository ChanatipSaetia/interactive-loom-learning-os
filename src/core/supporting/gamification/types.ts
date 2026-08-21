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
