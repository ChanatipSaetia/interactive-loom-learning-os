import type {
  HexNodeData,
  ItemReward,
  MonsterData,
  CharacterAttributes,
  ActiveBuff,
  CraftedArtifact,
} from './types'
import { getAutoFlowConnections } from './layout'

// ─── Magic Rune Encryption ───
const RUNE_CHAR_MAP: Record<string, string> = {
  a: 'ᚨ', b: 'ᛒ', c: 'ᚲ', d: 'ᛞ', e: 'ᛖ', f: 'ᚠ', g: 'ᚷ', h: 'ᚺ',
  i: 'ᛁ', j: 'ᛃ', k: 'ᚲ', l: 'ᛚ', m: 'ᛗ', n: 'ᚾ', o: 'ᛟ', p: 'ᛈ',
  q: 'ᚴ', r: 'ᛱ', s: 'ᛊ', t: 'ᛏ', u: 'ᚢ', v: 'ᚡ', w: 'ṹ', x: 'ᚷ',
  y: 'ᛦ', z: 'ᛉ', ' ': ' ',
}

/**
 * Encrypts locked hex node title or description into ancient magic rune text.
 */
export function encryptToMagicRunes(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((char) => RUNE_CHAR_MAP[char] || '᚛')
    .join('')
}

/**
 * Verifies whether the player inventory possesses all required key items to unlock the Boss Lair.
 */
export function canUnlockBoss(inventory: ItemReward[], bossNode?: HexNodeData): boolean {
  if (!bossNode || bossNode.type !== 'boss_lair') return false
  const required = bossNode.requiredItems || ['adapter-shield', 'port-blade']
  return required.every((reqId) => inventory.some((item) => item.id === reqId))
}

/**
 * Evaluates auto-flow graph dependencies and unlocks downstream hex nodes whose prerequisite
 * parent nodes in `getAutoFlowConnections` are all cleared.
 */
export function evaluateNodeUnlocks(nodes: HexNodeData[]): HexNodeData[] {
  const autoConns = getAutoFlowConnections(nodes)

  return nodes.map((node) => {
    // Keep capital or already cleared nodes in their cleared status
    if (node.type === 'capital' || node.status === 'cleared') {
      return node
    }

    // Find all prerequisite parent connections targeting this node
    const parentConns = autoConns.filter((c) => c.toId === node.id)

    // If node has parent prerequisites, it is ONLY unlocked when ALL parent nodes are cleared
    if (parentConns.length > 0) {
      const allParentsCleared = parentConns.every((c) => {
        const parent = nodes.find((n) => n.id === c.fromId)
        return parent?.status === 'cleared'
      })

      return {
        ...node,
        status: allParentsCleared ? ('unlocked' as const) : ('locked' as const),
      }
    }

    return node
  })
}

/**
 * Calculates time-based Sanctuary Healing with visit-count decay and chaos dampening.
 * Learner gains healing ticks every 10 seconds of active reading.
 * - Visit 1: Full tick heal (e.g. 10 HP per 10s tick)
 * - Visit 2: 50% tick heal (e.g. 5 HP per 10s tick)
 * - Visit 3+: 2 HP minimum tick heal
 * Reduced by (chaosLevel * 0.05).
 */
export function calculateSanctuaryTickHealing(
  activeSeconds: number,
  visitCount: number,
  chaosLevel: number = 0
): { effectiveHealing: number; nextChaosLevel: number } {
  const tickCount = Math.floor(activeSeconds / 10)
  if (tickCount <= 0) {
    return { effectiveHealing: 0, nextChaosLevel: chaosLevel }
  }

  const baseTick = 10
  const visitMultiplier = visitCount <= 1 ? 1.0 : visitCount === 2 ? 0.5 : 0.2
  const chaosPenalty = Math.floor(chaosLevel * 0.05)

  const tickHeal = Math.max(2, Math.round(baseTick * visitMultiplier) - chaosPenalty)
  const effectiveHealing = tickHeal * tickCount
  const nextChaosLevel = Math.max(0, chaosLevel - tickCount * 2)

  return { effectiveHealing, nextChaosLevel }
}

/**
 * Calculates System Chaos penalty and effective HP restored when resting at a Reading Sanctuary.
 */
export function calculateSanctuaryHealing(
  baseHealing: number,
  chaosLevel: number
): { effectiveHealing: number; nextChaosLevel: number } {
  const penalty = chaosLevel * 0.25
  const effectiveHealing = Math.max(5, Math.round(baseHealing - penalty))
  const nextChaosLevel = Math.max(0, chaosLevel - 10)
  return { effectiveHealing, nextChaosLevel }
}

/**
 * Synthesizes tactical buffs and vulnerabilities from trade-off sandbox metrics.
 * - Peak metric (>= 60) -> Positive buff based on tradeoffMapping or fallback.
 * - Sacrificed metric (<= 40) -> In-game vulnerability.
 */
export function synthesizeTradeoffArtifact(
  scenarioTitle: string,
  metrics: Array<{ id: string; label: string; value: number }>,
  tradeoffMapping?: Record<string, string>
): CraftedArtifact {
  if (metrics.length === 0) {
    return {
      name: `Artifact of ${scenarioTitle}`,
      buff: { stat: 'armor', value: 3, label: '+3 Armor' },
      durationTurns: 4,
    }
  }

  const sorted = [...metrics].sort((a, b) => b.value - a.value)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]

  // Map best metric to RPG stat (match metric.id or metric.label keywords first)
  let buffStat: 'armor' | 'evasion' | 'intelligence' | 'chaos_shield' = 'armor'
  const idLower = best.id.toLowerCase()
  const labelLower = best.label.toLowerCase()

  if (tradeoffMapping && tradeoffMapping[best.id]) {
    const mapped = tradeoffMapping[best.id] as 'armor' | 'evasion' | 'intelligence' | 'chaos_shield'
    if (['armor', 'evasion', 'intelligence', 'chaos_shield'].includes(mapped)) {
      buffStat = mapped
    }
  } else if (idLower.includes('armor') || labelLower.includes('armor') || idLower.includes('durability') || labelLower.includes('durability')) {
    buffStat = 'armor'
  } else if (
    idLower.includes('evasion') ||
    labelLower.includes('evasion') ||
    idLower.includes('latency') ||
    labelLower.includes('latency') ||
    idLower.includes('speed') ||
    labelLower.includes('speed')
  ) {
    buffStat = 'evasion'
  } else if (
    idLower.includes('intel') ||
    labelLower.includes('intel') ||
    idLower.includes('consistency') ||
    labelLower.includes('consistency')
  ) {
    buffStat = 'intelligence'
  } else {
    // Mathematical index fallback
    const bestIdx = metrics.findIndex((m) => m.id === best.id)
    if (bestIdx === 0) buffStat = 'evasion'
    else if (bestIdx === 1) buffStat = 'armor'
    else if (bestIdx === 2) buffStat = 'intelligence'
    else buffStat = 'chaos_shield'
  }

  const buffValue = Math.max(3, Math.round((best.value - 50) * 0.5))

  const artifact: CraftedArtifact = {
    name: `Artifact of ${best.label}`,
    buff: {
      stat: buffStat,
      value: buffValue,
      label: `+${buffValue} ${buffStat.toUpperCase()} from ${best.label}`,
    },
    durationTurns: 4,
  }

  // Check for severe sacrifice (worst <= 40)
  if (worst.value <= 40) {
    const vulnValue = Math.max(2, Math.round((50 - worst.value) * 0.4))
    artifact.vulnerability = {
      stat: 'extra_damage',
      value: vulnValue,
      label: `+${vulnValue} damage taken from low ${worst.label}`,
    }
  }

  return artifact
}

/**
 * Resolves timed reflection decryption outcome.
 * System Chaos amplifies magical backlash if decryption fails or times out.
 * Difficulty multiplier scales the damage penalty and time bonus.
 */
export function resolveTimedReflectionDecryption(
  completed: boolean,
  timeRemainingSec: number,
  totalTimeSec: number = 60,
  chaosLevel: number = 0,
  damageMultiplier: number = 1.0,
  expMultiplier: number = 1.0
): { success: boolean; timeBonusExp: number; damagePenalty: number } {
  if (completed && timeRemainingSec > 0) {
    const timeRatio = timeRemainingSec / totalTimeSec
    const timeBonusExp = Math.round(20 * timeRatio * expMultiplier)
    return { success: true, timeBonusExp, damagePenalty: 0 }
  }

  // System Chaos amplifies magical backlash: base 15 + up to +25 additional damage at 100 Chaos
  const chaosDamageMultiplier = 1 + (chaosLevel / 100)
  const damagePenalty = Math.round(15 * chaosDamageMultiplier * damageMultiplier)
  return { success: false, timeBonusExp: 0, damagePenalty }
}

export interface CombatTurnResult {
  updatedMonsterHp: number
  isMonsterDefeated: boolean
  playerDamageTaken: number
  isDodged: boolean
  combatLogMessage: string
}

/**
 * Resolves a quiz battle combat turn against a monster.
 * When System Chaos increases (from repeated sanctuary/citadel visits), monsters grow enraged:
 * Base monster damage is boosted by +1% per 2 Chaos Levels (+50% monster damage at 100 Chaos).
 * Scaled by topic difficulty multiplier.
 */
export function resolveCombatTurn(
  monster: MonsterData,
  attributes: CharacterAttributes,
  isCorrect: boolean,
  activeBuffs: ActiveBuff[] = [],
  chaosLevel: number = 0,
  damageMultiplier: number = 1.0
): CombatTurnResult {
  // Aggregate buffs
  const totalArmor = attributes.armor + activeBuffs
    .filter((b) => b.stat === 'armor' && !b.isPenalty)
    .reduce((sum, b) => sum + b.value, 0)

  const totalEvasion = attributes.evasion + activeBuffs
    .filter((b) => b.stat === 'evasion' && !b.isPenalty)
    .reduce((sum, b) => sum + b.value, 0)

  const extraDamageVuln = activeBuffs
    .filter((b) => b.stat === 'extra_damage' || b.isPenalty)
    .reduce((sum, b) => sum + b.value, 0)

  const monsterHp = monster.currentHp ?? monster.maxHp

  if (isCorrect) {
    const updatedMonsterHp = Math.max(0, monsterHp - 50)
    const isMonsterDefeated = updatedMonsterHp === 0
    return {
      updatedMonsterHp,
      isMonsterDefeated,
      playerDamageTaken: 0,
      isDodged: false,
      combatLogMessage: isMonsterDefeated
        ? `💥 Critical Strike! Dealt 50 damage and DEFEATED ${monster.name}!`
        : `⚔️ Direct Hit! Dealt 50 damage to ${monster.name} (HP: ${updatedMonsterHp}/${monster.maxHp})`,
    }
  }

  // Wrong answer -> Monster attacks (Chaos & Difficulty enrage monster damage)
  const isDodged = Math.random() * 100 < totalEvasion
  const chaosMultiplier = 1 + (chaosLevel / 200) // Up to +50% extra monster damage at 100 Chaos
  const scaledMonsterDamage = Math.round(monster.damage * chaosMultiplier * damageMultiplier)
  const rawDamage = Math.max(5, scaledMonsterDamage - totalArmor + extraDamageVuln)
  const playerDamageTaken = isDodged ? 0 : rawDamage

  const chaosTag = chaosLevel >= 20 ? ` [🔥 Chaos Buff +${Math.round((chaosLevel / 200) * 100)}%]` : ''

  return {
    updatedMonsterHp: monsterHp,
    isMonsterDefeated: false,
    playerDamageTaken,
    isDodged,
    combatLogMessage: isDodged
      ? `💨 Dodged! Fast Evasion speed allowed you to dodge ${monster.name}'s attack!`
      : `🛡️ Monster Counter! Took ${playerDamageTaken} damage from ${monster.name}${chaosTag} (reduced by ${totalArmor} Armor)`,
  }
}

/**
 * Resolves boss combat actions utilizing key items (Adapter Shield, Port Blade).
 */
export function resolveBossItemAction(
  itemAction: 'adapter_shield' | 'port_blade',
  boss: MonsterData
): { bossDamage: number; shieldActive: boolean; message: string } {
  if (itemAction === 'adapter_shield') {
    return {
      bossDamage: 0,
      shieldActive: true,
      message: '🛡️ Activated Adapter Shield! Nullifies the next incoming boss attack completely.',
    }
  }

  return {
    bossDamage: 40,
    shieldActive: false,
    message: `⚡ Unleashed Port Blade! Slashed ${boss.name} for 40 true damage!`,
  }
}

export interface LevelProgressResult {
  nextLevel: number
  nextExp: number
  nextNextLevelExp: number
  nextUnallocatedPoints: number
  isLeveledUp: boolean
}

/**
 * Returns total XP threshold required to advance from `level` to `level + 1`.
 * Exponential scaling formula: 100 * (1.5 ^ (level - 1)), rounded to nearest 10.
 * Examples:
 *   Level 1 -> 2: 100 XP
 *   Level 2 -> 3: 150 XP
 *   Level 3 -> 4: 230 XP
 *   Level 4 -> 5: 340 XP
 *   Level 5 -> 6: 510 XP
 */
export function getRequiredExpForLevel(level: number): number {
  return Math.round(100 * Math.pow(1.5, Math.max(0, level - 1)) / 10) * 10
}

/**
 * Calculates XP gain, level thresholds, overflow XP, and unallocated stat point rewards upon monster defeat.
 * Level requirement scales exponentially with each level.
 */
export function calculateLevelProgress(
  currentLevel: number,
  currentExp: number,
  expGained: number,
  nextLevelExp: number,
  currentUnallocatedPoints: number
): LevelProgressResult {
  let level = currentLevel
  let exp = currentExp + expGained
  let requiredExp = nextLevelExp
  let points = currentUnallocatedPoints
  let leveledUp = false

  while (exp >= requiredExp) {
    exp -= requiredExp
    level += 1
    points += 1
    leveledUp = true
    requiredExp = getRequiredExpForLevel(level)
  }

  return {
    nextLevel: level,
    nextExp: exp,
    nextNextLevelExp: requiredExp,
    nextUnallocatedPoints: points,
    isLeveledUp: leveledUp,
  }
}

/**
 * Evaluates which topic-specific and difficulty badges should be awarded upon boss defeat or topic completion.
 */
export function evaluateTopicBadges(
  topicId: string,
  topicTitle: string,
  difficulty: import('./types').DifficultyLevel = 'normal',
  damageTaken: number = 0,
  hasCraftedBuff: boolean = false,
  existingBadges: import('./types').UnlockedBadge[] = []
): import('./types').UnlockedBadge[] {
  const newBadges: import('./types').UnlockedBadge[] = []
  const now = new Date().toISOString().split('T')[0]

  // 1. Topic Completion Badge
  const completionBadgeId = `badge-complete-${topicId}`
  if (!existingBadges.some((b) => b.id === completionBadgeId)) {
    newBadges.push({
      id: completionBadgeId,
      badgeType: 'topic_completion',
      title: `${topicTitle} Liberator`,
      icon: '🏅',
      description: `Successfully liberated the ${topicTitle} realm from architectural monsters.`,
      topicId,
      topicTitle,
      difficulty,
      unlockedAt: now,
    })
  }

  // 2. Flawless Victory Badge (0 Damage taken throughout the entire campaign)
  const flawlessBadgeId = `badge-flawless-${topicId}`
  if (damageTaken === 0 && !existingBadges.some((b) => b.id === flawlessBadgeId)) {
    newBadges.push({
      id: flawlessBadgeId,
      badgeType: 'flawless_victory',
      title: `Flawless Strategist: ${topicTitle}`,
      icon: '⭐',
      description: `Cleared the entire ${topicTitle} campaign without taking a single point of damage!`,
      topicId,
      topicTitle,
      difficulty,
      unlockedAt: now,
    })
  }

  // 3. Mastery Badge (Cleared on Hard or Nightmare difficulty)
  if (difficulty === 'hard' || difficulty === 'nightmare') {
    const masteryBadgeId = `badge-mastery-${topicId}-${difficulty}`
    if (!existingBadges.some((b) => b.id === masteryBadgeId)) {
      newBadges.push({
        id: masteryBadgeId,
        badgeType: 'mastery_clear',
        title: `${topicTitle} ${difficulty === 'nightmare' ? 'Grandmaster' : 'Master'}`,
        icon: difficulty === 'nightmare' ? '☠️' : '⚔️',
        description: `Conquered the ${topicTitle} realm on ${difficulty.toUpperCase()} difficulty tier!`,
        topicId,
        topicTitle,
        difficulty,
        unlockedAt: now,
      })
    }
  }

  // 4. Tactical Craftsman (Utilized synthesized trade-off workshop gear)
  if (hasCraftedBuff) {
    const craftsmanBadgeId = `badge-craftsman-${topicId}`
    if (!existingBadges.some((b) => b.id === craftsmanBadgeId)) {
      newBadges.push({
        id: craftsmanBadgeId,
        badgeType: 'tactical_craftsman',
        title: `Architectural Blacksmith`,
        icon: '⚒️',
        description: `Synthesized specialized trade-off gear to conquer ${topicTitle}.`,
        topicId,
        topicTitle,
        difficulty,
        unlockedAt: now,
      })
    }
  }

  return newBadges
}
