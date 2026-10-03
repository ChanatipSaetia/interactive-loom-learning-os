import type {
  HexNodeData,
  HexNodeType,
  ItemReward,
  MonsterData,
  CharacterAttributes,
  ActiveBuff,
  CraftedArtifact,
} from './types'
import { getAutoFlowConnections } from './layout'
import { GAME_RULES, type DifficultyLevel } from './game-config'

/**
 * Identifies whether a hex node type represents a sanctuary / progressive content reading node.
 */
export function isSanctuaryType(type?: string): boolean {
  return (
    type === 'reading_sanctuary' ||
    type === 'archive_spire' ||
    type === 'simulation_nexus' ||
    type === 'concept_monolith' ||
    type === 'observatory_gallery'
  )
}

/**
 * Automatically derives the appropriate HexNodeType from an OKF section type.
 * When a hex node references an OKF section, this ensures the visual hex variant
 * matches the section content automatically, even if the YAML declared a generic reading_sanctuary.
 */
export function deriveHexTypeFromSectionType(
  sectionType?: string,
  declaredType?: string
): HexNodeType {
  // If the declared type is already an explicit challenge or special type, keep it unless it's generic reading_sanctuary
  if (
    declaredType &&
    declaredType !== 'reading_sanctuary' &&
    declaredType !== 'capital'
  ) {
    return declaredType as HexNodeType
  }

  if (!sectionType) {
    return (declaredType as HexNodeType) || 'reading_sanctuary'
  }

  switch (sectionType) {
    case 'flowchart':
    case 'scenario':
      return 'simulation_nexus'
    case 'taxonomy-browser':
    case 'taxonomy':
    case 'bullets':
      return 'archive_spire'
    case 'concept-map':
    case 'flashcards':
      return 'concept_monolith'
    case 'image-gallery':
    case 'gallery':
      return 'observatory_gallery'
    case 'quiz':
      return declaredType === 'capital' ? 'capital' : (declaredType as HexNodeType) || 'quiz_encounter'
    case 'reflection-sequence':
    case 'reflection-template':
    case 'reflection':
      return declaredType === 'capital' ? 'capital' : (declaredType as HexNodeType) || 'reflection_decryption'
    case 'tradeoff-sandbox':
    case 'formula-sandbox':
    case 'tradeoffs':
      return declaredType === 'capital' ? 'capital' : (declaredType as HexNodeType) || 'tradeoff_workshop'
    case 'intro':
      return declaredType === 'capital' ? 'capital' : 'reading_sanctuary'
    case 'text':
    case 'pillar-layer':
    case 'decision-tree':
    default:
      return declaredType === 'capital' ? 'capital' : 'reading_sanctuary'
  }
}

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
  const required = bossNode.requiredItems || GAME_RULES.boss.defaultKeyItems
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
  const { tickIntervalSec, baseTickHealing, visitMultipliers, minTickHealing, tickChaosPenaltyPerLevel } = GAME_RULES.sanctuary
  const tickCount = Math.floor(activeSeconds / tickIntervalSec)
  if (tickCount <= 0) {
    return { effectiveHealing: 0, nextChaosLevel: chaosLevel }
  }

  const visitIndex = visitCount <= 1 ? 0 : visitCount === 2 ? 1 : visitMultipliers.length - 1
  const visitMultiplier = visitMultipliers[visitIndex]
  const chaosPenalty = Math.floor(chaosLevel * tickChaosPenaltyPerLevel)

  const tickHeal = Math.max(minTickHealing, Math.round(baseTickHealing * visitMultiplier) - chaosPenalty)
  const effectiveHealing = tickHeal * tickCount
  const nextChaosLevel = chaosLevel

  return { effectiveHealing, nextChaosLevel }
}

/**
 * Calculates System Chaos penalty and effective HP restored when resting at a Reading Sanctuary.
 */
export function calculateSanctuaryHealing(
  baseHealing: number,
  chaosLevel: number
): { effectiveHealing: number; nextChaosLevel: number } {
  const { restChaosPenaltyPerLevel, minRestHealing, chaosRelief } = GAME_RULES.sanctuary
  const penalty = chaosLevel * restChaosPenaltyPerLevel
  const effectiveHealing = Math.max(minRestHealing, Math.round(baseHealing - penalty))
  const nextChaosLevel = Math.max(0, chaosLevel - chaosRelief)
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
  const { neutralMetricValue, buffRate, minBuffValue, sacrificeThreshold, vulnerabilityRate, minVulnerabilityValue, durationTurns } = GAME_RULES.artifact

  if (metrics.length === 0) {
    return {
      name: `Artifact of ${scenarioTitle}`,
      buff: { stat: 'armor', value: minBuffValue, label: `+${minBuffValue} Armor` },
      durationTurns,
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

  const buffValue = Math.max(minBuffValue, Math.round((best.value - neutralMetricValue) * buffRate))

  const artifact: CraftedArtifact = {
    name: `Artifact of ${best.label}`,
    buff: {
      stat: buffStat,
      value: buffValue,
      label: `+${buffValue} ${buffStat.toUpperCase()} from ${best.label}`,
    },
    durationTurns,
  }

  // Check for severe sacrifice (worst metric below sacrifice threshold)
  if (worst.value <= sacrificeThreshold) {
    const vulnValue = Math.max(minVulnerabilityValue, Math.round((neutralMetricValue - worst.value) * vulnerabilityRate))
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
  totalTimeSec: number = GAME_RULES.reflection.totalTimeSec,
  chaosLevel: number = 0,
  damageMultiplier: number = 1.0,
  expMultiplier: number = 1.0
): { success: boolean; timeBonusExp: number; damagePenalty: number } {
  const { baseTimeBonusExp, baseBacklashDamage, chaosBacklashScalingPerLevel } = GAME_RULES.reflection
  if (completed && timeRemainingSec > 0) {
    const timeRatio = timeRemainingSec / totalTimeSec
    const timeBonusExp = Math.round(baseTimeBonusExp * timeRatio * expMultiplier)
    return { success: true, timeBonusExp, damagePenalty: 0 }
  }

  // System Chaos amplifies magical backlash: base damage + scaling per Chaos level (up to +100% at 100 Chaos)
  const chaosDamageMultiplier = 1 + chaosLevel * chaosBacklashScalingPerLevel
  const damagePenalty = Math.round(baseBacklashDamage * chaosDamageMultiplier * damageMultiplier)
  return { success: false, timeBonusExp: 0, damagePenalty }
}

/**
 * Derives the effective stat percentage from allocated raw stat points using gentle logarithmic scaling.
 * Starts at 10% at 0 points, grants ~+1% on early points, and scales smoothly to a cap of 40% around 100 points.
 * Formula: min(40, round(10 + 30 * ln(1 + 0.05 * points) / ln(6)))
 */
export function deriveStatPercentage(points: number): number {
  const { basePercentage, growthPoints, growthRate, capPercentage, logBase } = GAME_RULES.stats
  if (points <= 0) return basePercentage
  const scaling = (growthPoints * Math.log(1 + growthRate * points)) / Math.log(logBase)
  return Math.min(capPercentage, Math.round(basePercentage + scaling))
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
  damageMultiplier: number = 1.0,
  totalQuestions: number = 2,
  dodgedOverride?: boolean
): CombatTurnResult {
  // Derive base stat percentages from raw points
  const { minDamageTaken, chaosDamageScalingPerLevel, chaosTagThreshold } = GAME_RULES.combat
  const baseArmor = typeof attributes.armor === 'number' ? deriveStatPercentage(attributes.armor) : GAME_RULES.stats.basePercentage
  const baseEvasion = typeof attributes.evasion === 'number' ? deriveStatPercentage(attributes.evasion) : GAME_RULES.stats.basePercentage

  // Aggregate buffs
  const totalArmor = baseArmor + activeBuffs
    .filter((b) => b.stat === 'armor' && !b.isPenalty)
    .reduce((sum, b) => sum + b.value, 0)

  const totalEvasion = baseEvasion + activeBuffs
    .filter((b) => b.stat === 'evasion' && !b.isPenalty)
    .reduce((sum, b) => sum + b.value, 0)

  const extraDamageVuln = activeBuffs
    .filter((b) => b.stat === 'extra_damage' || b.isPenalty)
    .reduce((sum, b) => sum + b.value, 0)

  const monsterHp = monster.currentHp ?? monster.maxHp

  if (isCorrect) {
    const questionsCount = Math.max(1, totalQuestions)
    const damageDealt = Math.ceil(monster.maxHp / questionsCount)
    const updatedMonsterHp = Math.max(0, monsterHp - damageDealt)
    const isMonsterDefeated = updatedMonsterHp === 0
    return {
      updatedMonsterHp,
      isMonsterDefeated,
      playerDamageTaken: 0,
      isDodged: false,
      combatLogMessage: isMonsterDefeated
        ? `💥 Critical Strike! Dealt ${damageDealt} damage and DEFEATED ${monster.name}!`
        : `⚔️ Direct Hit! Dealt ${damageDealt} damage to ${monster.name} (HP: ${updatedMonsterHp}/${monster.maxHp})`,
    }
  }

  // Wrong answer -> Monster attacks (Chaos & Difficulty enrage monster damage)
  // When the caller pre-rolled the evasion outcome (e.g. quiz grants an immediate retry), honor it.
  const isDodged = dodgedOverride ?? Math.random() * 100 < totalEvasion
  const chaosMultiplier = 1 + chaosLevel * chaosDamageScalingPerLevel // Up to +50% extra monster damage at 100 Chaos
  const scaledMonsterDamage = Math.round(monster.damage * chaosMultiplier * damageMultiplier)
  const rawDamage = Math.max(minDamageTaken, scaledMonsterDamage - totalArmor + extraDamageVuln)
  const playerDamageTaken = isDodged ? 0 : rawDamage

  const chaosTag = chaosLevel >= chaosTagThreshold ? ` [🔥 Chaos Buff +${Math.round(chaosLevel * chaosDamageScalingPerLevel * 100)}%]` : ''

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
 * Resolves boss combat actions utilizing key items (Adapter Shield, Port Blade, or any collected item reward).
 */
export function resolveBossItemAction(
  itemAction: string,
  boss: MonsterData,
  itemObj?: ItemReward
): { bossDamage: number; shieldActive: boolean; message: string } {
  const normalizedId = itemAction.toLowerCase().replace(/_/g, '-')
  const itemName = itemObj?.name || (normalizedId.includes('shield') ? 'Adapter Shield' : normalizedId.includes('blade') ? 'Port Blade' : itemAction)

  // Defensive Items (Shields, Aegis, Amulets, Armor)
  if (
    normalizedId.includes('shield') ||
    normalizedId.includes('aegis') ||
    normalizedId.includes('amulet') ||
    normalizedId.includes('ward') ||
    normalizedId.includes('barrier') ||
    (itemObj?.name && /shield|aegis|amulet|ward|barrier/i.test(itemObj.name))
  ) {
    if (normalizedId === 'adapter-shield' || normalizedId === 'adapter_shield') {
      return {
        bossDamage: 0,
        shieldActive: true,
        message: '🛡️ Activated Adapter Shield! Nullifies the next incoming boss attack completely.',
      }
    }
    return {
      bossDamage: 0,
      shieldActive: true,
      message: `🛡️ Activated ${itemName}! Nullifies the next incoming attack from ${boss.name} completely.`,
    }
  }

  // Offensive Items (Blades, Swords, Crystals, Product Weapon, etc.)
  const offensiveDamage = GAME_RULES.boss.offensiveItemDamage
  if (normalizedId === 'port-blade' || normalizedId === 'port_blade') {
    return {
      bossDamage: offensiveDamage,
      shieldActive: false,
      message: `⚡ Unleashed Port Blade! Slashed ${boss.name} for ${offensiveDamage} true damage!`,
    }
  }

  const damage = offensiveDamage
  return {
    bossDamage: damage,
    shieldActive: false,
    message: `⚡ Unleashed ${itemName}! Slashed ${boss.name} for ${damage} true damage!`,
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
  const { baseExpPerLevel, expGrowthRate, expRoundStep } = GAME_RULES.xp
  return Math.round(baseExpPerLevel * Math.pow(expGrowthRate, Math.max(0, level - 1)) / expRoundStep) * expRoundStep
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
    points += GAME_RULES.xp.statPointsPerLevel
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
  difficulty: DifficultyLevel = 'normal',
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
