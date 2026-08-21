import { HexNodeData, ItemReward, MonsterData, CharacterAttributes } from './types'
import { getAutoFlowConnections } from './layout'

// ─── Magic Rune Encryption ───
const RUNE_CHAR_MAP: Record<string, string> = {
  a: 'ᚨ', b: 'ᛒ', c: 'ᚲ', d: 'ᛞ', e: 'ᛖ', f: 'ᚠ', g: 'ᚷ', h: 'ᚺ',
  i: 'ᛁ', j: 'ᛃ', k: 'ᚲ', l: 'ᛚ', m: 'ᛗ', n: 'ᚾ', o: 'ᛟ', p: 'ᛈ',
  q: 'ᚴ', r: 'ᛱ', s: 'ᛊ', t: 'ᛏ', u: 'ᚢ', v: 'ᚡ', w: 'ᚹ', x: 'ᚷ',
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
    // Keep capital, boss, cleared, or already unlocked nodes in their status
    if (node.type === 'capital' || node.status === 'cleared' || node.status === 'unlocked') {
      return node
    }

    // Find all prerequisite parent connections targeting this node
    const parentConns = autoConns.filter((c) => c.toId === node.id)

    // If node has parent prerequisites, unlock it only when ALL parent nodes are cleared
    if (parentConns.length > 0) {
      const allParentsCleared = parentConns.every((c) => {
        const parent = nodes.find((n) => n.id === c.fromId)
        return parent?.status === 'cleared'
      })

      if (allParentsCleared) {
        return { ...node, status: 'unlocked' as const }
      }
    }

    return node
  })
}

/**
 * Calculates System Chaos penalty and effective HP restored when resting at a Reading Sanctuary.
 * Healing decays based on System Chaos: effectiveHealing = max(5, round(baseHealing - chaosLevel * 0.25)).
 * System Chaos is also reduced by -10.
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

export interface CombatTurnResult {
  updatedMonsterHp: number
  isMonsterDefeated: boolean
  playerDamageTaken: number
  isDodged: boolean
  combatLogMessage: string
}

/**
 * Resolves a quiz battle combat turn against a monster.
 * - Correct answer: deals 50 damage to monster.
 * - Incorrect answer: calculates player damage taken (max(5, monster.damage - armor)),
 *   with an evasion % check to dodge all damage.
 */
export function resolveCombatTurn(
  monster: MonsterData,
  attributes: CharacterAttributes,
  isCorrect: boolean
): CombatTurnResult {
  if (isCorrect) {
    const updatedMonsterHp = Math.max(0, monster.currentHp - 50)
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

  // Wrong answer -> Monster attacks
  const isDodged = Math.random() * 100 < attributes.evasion
  const rawDamage = Math.max(5, monster.damage - attributes.armor)
  const playerDamageTaken = isDodged ? 0 : rawDamage

  return {
    updatedMonsterHp: monster.currentHp,
    isMonsterDefeated: false,
    playerDamageTaken,
    isDodged,
    combatLogMessage: isDodged
      ? `💨 Dodged! Fast Evasion speed allowed you to dodge ${monster.name}'s attack!`
      : `🛡️ Monster Counter! Took ${playerDamageTaken} damage from ${monster.name} (reduced by ${attributes.armor} Armor)`,
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
 * Calculates XP gain, level thresholds, overflow XP, and unallocated stat point rewards upon monster defeat.
 */
export function calculateLevelProgress(
  currentLevel: number,
  currentExp: number,
  expGained: number,
  nextLevelExp: number,
  currentUnallocatedPoints: number
): LevelProgressResult {
  const totalExp = currentExp + expGained
  if (totalExp >= nextLevelExp) {
    return {
      nextLevel: currentLevel + 1,
      nextExp: totalExp - nextLevelExp,
      nextNextLevelExp: nextLevelExp + 100,
      nextUnallocatedPoints: currentUnallocatedPoints + 1,
      isLeveledUp: true,
    }
  }
  return {
    nextLevel: currentLevel,
    nextExp: totalExp,
    nextNextLevelExp: nextLevelExp,
    nextUnallocatedPoints: currentUnallocatedPoints,
    isLeveledUp: false,
  }
}
