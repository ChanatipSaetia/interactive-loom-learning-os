import { describe, it, expect } from 'vitest'
import {
  encryptToMagicRunes,
  canUnlockBoss,
  evaluateNodeUnlocks,
  calculateSanctuaryHealing,
  resolveCombatTurn,
  calculateLevelProgress,
} from '../../../../../src/core/supporting/gamification/game-rules'
import type {
  HexNodeData,
  ItemReward,
  MonsterData,
  CharacterAttributes,
} from '../../../../../src/core/supporting/gamification/types'

// ─── Test Fixtures ───────────────────────────────────────────────────────────

const ATTRS: CharacterAttributes = { armor: 15, evasion: 20, intelligence: 10 }

const GOBLIN: MonsterData = {
  id: 'goblin-1',
  name: 'Dependency Goblin',
  type: 'Tightly Coupled Monster',
  maxHp: 100,
  currentHp: 80,
  damage: 30,
  icon: '👹',
}

const ITEM_SHIELD: ItemReward = { id: 'adapter-shield', name: 'Adapter Shield', icon: '🛡️', description: '' }
const ITEM_BLADE: ItemReward = { id: 'port-blade', name: 'Port Blade', icon: '⚔️', description: '' }

const BOSS_NODE: HexNodeData = {
  id: 'boss-dragon',
  title: 'Complexity Dragon',
  type: 'boss_lair',
  status: 'locked',
  description: 'Final Boss',
  requiredItems: ['adapter-shield', 'port-blade'],
}

const CAPITAL: HexNodeData = {
  id: 'capital-0',
  title: 'Architecture Capital',
  type: 'capital',
  status: 'cleared',
  description: 'Capital',
}

const SANCTUARY: HexNodeData = {
  id: 'sanctuary-1',
  title: 'Domain Entity Sanctuary',
  type: 'reading_sanctuary',
  status: 'locked',
  description: 'Sanctuary',
  healingAmount: 30,
}

// ─── encryptToMagicRunes ──────────────────────────────────────────────────────

describe('encryptToMagicRunes', () => {
  it('returns rune characters for known letters', () => {
    const result = encryptToMagicRunes('abc')
    expect(result).toBe('ᚨᛒᚲ')
  })

  it('preserves spaces', () => {
    const result = encryptToMagicRunes('a b')
    expect(result).toBe('ᚨ ᛒ')
  })

  it('uses fallback ᚛ for unknown characters', () => {
    const result = encryptToMagicRunes('!')
    expect(result).toBe('᚛')
  })

  it('encrypts a full title correctly', () => {
    const result = encryptToMagicRunes('hello')
    expect(typeof result).toBe('string')
    expect(result.length).toBe(5)
  })
})

// ─── canUnlockBoss ────────────────────────────────────────────────────────────

describe('canUnlockBoss', () => {
  it('returns false when inventory is empty', () => {
    expect(canUnlockBoss([], BOSS_NODE)).toBe(false)
  })

  it('returns false when only one required item is present', () => {
    expect(canUnlockBoss([ITEM_SHIELD], BOSS_NODE)).toBe(false)
  })

  it('returns true when all required items are in inventory', () => {
    expect(canUnlockBoss([ITEM_SHIELD, ITEM_BLADE], BOSS_NODE)).toBe(true)
  })

  it('returns false when bossNode is undefined', () => {
    expect(canUnlockBoss([ITEM_SHIELD, ITEM_BLADE], undefined)).toBe(false)
  })

  it('returns false when node type is not boss_lair', () => {
    expect(canUnlockBoss([ITEM_SHIELD, ITEM_BLADE], SANCTUARY)).toBe(false)
  })
})

// ─── evaluateNodeUnlocks ─────────────────────────────────────────────────────

describe('evaluateNodeUnlocks', () => {
  it('keeps capital in its existing status', () => {
    const nodes = [{ ...CAPITAL }]
    const result = evaluateNodeUnlocks(nodes)
    expect(result[0].status).toBe('cleared')
  })

  it('unlocks a locked sanctuary when capital is cleared', () => {
    const nodes: HexNodeData[] = [{ ...CAPITAL }, { ...SANCTUARY }]
    const result = evaluateNodeUnlocks(nodes)
    const sanctuary = result.find((n) => n.id === 'sanctuary-1')!
    expect(sanctuary.status).toBe('unlocked')
  })

  it('does not unlock a node when prerequisite parent is not cleared', () => {
    const nodes: HexNodeData[] = [
      { ...CAPITAL, status: 'unlocked' }, // not yet cleared
      { ...SANCTUARY },
    ]
    const result = evaluateNodeUnlocks(nodes)
    const sanctuary = result.find((n) => n.id === 'sanctuary-1')!
    expect(sanctuary.status).toBe('locked')
  })

  it('does not change already cleared nodes', () => {
    const cleared = { ...SANCTUARY, status: 'cleared' as const }
    const nodes: HexNodeData[] = [{ ...CAPITAL }, cleared]
    const result = evaluateNodeUnlocks(nodes)
    expect(result.find((n) => n.id === 'sanctuary-1')!.status).toBe('cleared')
  })
})

// ─── calculateSanctuaryHealing ───────────────────────────────────────────────

describe('calculateSanctuaryHealing', () => {
  it('returns full healing when chaos is 0', () => {
    const { effectiveHealing, nextChaosLevel } = calculateSanctuaryHealing(30, 0)
    expect(effectiveHealing).toBe(30)
    expect(nextChaosLevel).toBe(0)
  })

  it('applies 25% chaos penalty at 100% chaos', () => {
    const { effectiveHealing } = calculateSanctuaryHealing(30, 100)
    // penalty = 100 * 0.25 = 25, effectiveHealing = max(5, 30 - 25) = 5
    expect(effectiveHealing).toBe(5)
  })

  it('reduces chaos by 10', () => {
    const { nextChaosLevel } = calculateSanctuaryHealing(30, 50)
    expect(nextChaosLevel).toBe(40)
  })

  it('clamps chaos to not go below 0', () => {
    const { nextChaosLevel } = calculateSanctuaryHealing(30, 5)
    expect(nextChaosLevel).toBe(0)
  })

  it('clamps effective healing to minimum of 5', () => {
    const { effectiveHealing } = calculateSanctuaryHealing(5, 100)
    // penalty = 25, effectiveHealing = max(5, 5 - 25) = 5
    expect(effectiveHealing).toBe(5)
  })
})

// ─── resolveCombatTurn ───────────────────────────────────────────────────────

describe('resolveCombatTurn', () => {
  it('deals 50 damage on correct answer', () => {
    const result = resolveCombatTurn(GOBLIN, ATTRS, true)
    expect(result.updatedMonsterHp).toBe(30) // 80 - 50
    expect(result.playerDamageTaken).toBe(0)
    expect(result.isMonsterDefeated).toBe(false)
    expect(result.isDodged).toBe(false)
  })

  it('marks monster as defeated when HP reaches 0', () => {
    const nearDeadGoblin: MonsterData = { ...GOBLIN, currentHp: 50 }
    const result = resolveCombatTurn(nearDeadGoblin, ATTRS, true)
    expect(result.updatedMonsterHp).toBe(0)
    expect(result.isMonsterDefeated).toBe(true)
  })

  it('calculates flat damage reduction on incorrect answer with full armor', () => {
    // With very high armor, damage should be clamped to min 5
    const tankAttrs: CharacterAttributes = { armor: 1000, evasion: 0, intelligence: 0 }
    const result = resolveCombatTurn(GOBLIN, tankAttrs, false)
    if (!result.isDodged) {
      expect(result.playerDamageTaken).toBe(5) // max(5, 30 - 1000) = 5
    }
  })

  it('returns unchanged monster HP on incorrect answer', () => {
    // Evasion 0 so no dodge
    const noEvasionAttrs: CharacterAttributes = { armor: 0, evasion: 0, intelligence: 0 }
    const result = resolveCombatTurn(GOBLIN, noEvasionAttrs, false)
    expect(result.updatedMonsterHp).toBe(GOBLIN.currentHp)
    expect(result.isMonsterDefeated).toBe(false)
  })

  it('provides a non-empty combat log message', () => {
    const correct = resolveCombatTurn(GOBLIN, ATTRS, true)
    const incorrect = resolveCombatTurn(GOBLIN, ATTRS, false)
    expect(correct.combatLogMessage.length).toBeGreaterThan(0)
    expect(incorrect.combatLogMessage.length).toBeGreaterThan(0)
  })
})

// ─── calculateLevelProgress ──────────────────────────────────────────────────

describe('calculateLevelProgress', () => {
  it('does not level up when EXP is below threshold', () => {
    const result = calculateLevelProgress(5, 180, 40, 510, 2)
    expect(result.isLeveledUp).toBe(false)
    expect(result.nextLevel).toBe(5)
    expect(result.nextExp).toBe(220)
    expect(result.nextUnallocatedPoints).toBe(2)
  })

  it('levels up when EXP meets or exceeds threshold with exponential next threshold', () => {
    const result = calculateLevelProgress(5, 480, 50, 510, 2)
    expect(result.isLeveledUp).toBe(true)
    expect(result.nextLevel).toBe(6)
    expect(result.nextExp).toBe(20) // 530 - 510 overflow
    // Level 6 -> 7 requires 100 * (1.5 ^ 5) = 760 EXP
    expect(result.nextNextLevelExp).toBe(760)
    expect(result.nextUnallocatedPoints).toBe(3) // +1 point on level up
  })

  it('carries over overflow XP correctly through exponential leveling', () => {
    const result = calculateLevelProgress(1, 0, 120, 100, 0)
    expect(result.isLeveledUp).toBe(true)
    expect(result.nextLevel).toBe(2)
    expect(result.nextExp).toBe(20) // 120 - 100
    expect(result.nextNextLevelExp).toBe(150) // Level 2 -> 3 requires 150 EXP
    expect(result.nextUnallocatedPoints).toBe(1)
  })
})
