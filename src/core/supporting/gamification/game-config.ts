// ─── Difficulty Level ──────────────────────────────────────────────────────
export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'nightmare'

export interface DifficultyConfig {
  id: DifficultyLevel
  label: string
  icon: string
  damageMultiplier: number
  expBonusMultiplier: number
  chaosMultiplier: number
  maxSanctuaryPulses: number
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
    maxSanctuaryPulses: 8,
    description: 'Reduced monster damage (-30%) and slower Chaos generation with 8 Sanctuary pulses. Ideal for gentle learning.',
  },
  normal: {
    id: 'normal',
    label: 'Architect (Normal)',
    icon: '⚔️',
    damageMultiplier: 1.0,
    expBonusMultiplier: 1.2,
    chaosMultiplier: 1.0,
    maxSanctuaryPulses: 5,
    description: 'Balanced challenge with 5 Sanctuary pulses and +20% EXP bonus.',
  },
  hard: {
    id: 'hard',
    label: 'Master (Hard)',
    icon: '🔥',
    damageMultiplier: 1.5,
    expBonusMultiplier: 1.6,
    chaosMultiplier: 1.5,
    maxSanctuaryPulses: 3,
    description: '+50% monster damage, accelerated Chaos, and limited to 3 Sanctuary pulses. Yields +60% EXP bonus.',
  },
  nightmare: {
    id: 'nightmare',
    label: 'Grandmaster (Nightmare)',
    icon: '☠️',
    damageMultiplier: 2.0,
    expBonusMultiplier: 2.2,
    chaosMultiplier: 2.0,
    maxSanctuaryPulses: 2,
    description: 'Double damage, intense Chaos, and only 2 Sanctuary pulses! Earn +120% EXP bonus for the bravest.',
  },
}

// ─── Campaign Game Rules Parameters ────────────────────────────────────────
export const GAME_RULES = {
  character: {
    initialHp: 100,
  },
  stats: {
    basePercentage: 10,
    growthPoints: 30,
    growthRate: 0.05,
    capPercentage: 40,
    logBase: 6,
  },
  xp: {
    baseExpPerLevel: 100,
    expGrowthRate: 1.5,
    expRoundStep: 10,
    statPointsPerLevel: 1,
    nodeRewards: {
      default: 10,
      reading: 5,
      encounter: 20,
      boss: 50,
    },
  },
  sanctuary: {
    tickIntervalSec: 10,
    baseTickHealing: 10,
    visitMultipliers: [1.0, 0.5, 0.2],
    minTickHealing: 2,
    tickChaosPenaltyPerLevel: 0.05,
    restChaosPenaltyPerLevel: 0.25,
    minRestHealing: 5,
    chaosRelief: 10,
  },
  chaos: {
    maxLevel: 100,
    repeatVisitIncrement: 15,
  },
  combat: {
    minDamageTaken: 5,
    chaosDamageScalingPerLevel: 0.005,
    chaosTagThreshold: 20,
    defaultMonsterHp: 30,
    defaultMonsterDamage: 10,
  },
  failure: {
    baseDamage: 25,
  },
  reflection: {
    totalTimeSec: 60,
    baseTimeBonusExp: 20,
    baseBacklashDamage: 15,
    chaosBacklashScalingPerLevel: 0.01,
  },
  artifact: {
    neutralMetricValue: 50,
    buffRate: 0.5,
    minBuffValue: 3,
    sacrificeThreshold: 40,
    vulnerabilityRate: 0.4,
    minVulnerabilityValue: 2,
    durationTurns: 4,
  },
  boss: {
    offensiveItemDamage: 40,
    defaultKeyItems: ['adapter-shield', 'port-blade'],
  },
} as const

export type GameRules = typeof GAME_RULES
