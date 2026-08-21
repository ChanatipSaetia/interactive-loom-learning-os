import { describe, it, expect } from 'vitest'
import {
  calculateSanctuaryTickHealing,
  synthesizeTradeoffArtifact,
  resolveTimedReflectionDecryption,
  resolveBossItemAction,
  resolveCombatTurn,
} from '../../../../../src/core/supporting/gamification/game-rules'

describe('Gamification Domain Game Rules Advanced Suite', () => {
  describe('calculateSanctuaryTickHealing', () => {
    it('calculates full tick heal for visit 1 without chaos', () => {
      const { effectiveHealing, nextChaosLevel } = calculateSanctuaryTickHealing(30, 1, 0)
      // 30 seconds = 3 ticks of 10 HP = 30 HP
      expect(effectiveHealing).toBe(30)
      expect(nextChaosLevel).toBe(0)
    })

    it('applies diminishing return decay on subsequent visits', () => {
      const visit2 = calculateSanctuaryTickHealing(20, 2, 0)
      // 20s = 2 ticks of 5 HP = 10 HP
      expect(visit2.effectiveHealing).toBe(10)

      const visit3 = calculateSanctuaryTickHealing(20, 3, 0)
      // 20s = 2 ticks of 2 HP (minimum) = 4 HP
      expect(visit3.effectiveHealing).toBe(4)
    })
  })

  describe('synthesizeTradeoffArtifact', () => {
    it('derives positive buff from peak metric and vulnerability from sacrificed metric', () => {
      const metrics = [
        { id: 'latency', label: 'Low Latency', value: 90 },
        { id: 'cost', label: 'Cost Efficiency', value: 80 },
        { id: 'devex', label: 'Developer Experience', value: 30 },
      ]

      const artifact = synthesizeTradeoffArtifact('Realtime Architecture', metrics)
      expect(artifact.buff.stat).toBe('evasion')
      expect(artifact.buff.value).toBe(20) // (90 - 50) * 0.5
      expect(artifact.vulnerability).toBeDefined()
      expect(artifact.vulnerability?.stat).toBe('extra_damage')
      expect(artifact.vulnerability?.value).toBe(8) // (50 - 30) * 0.4
    })

    it('respects optional tradeoffMapping in hex map campaign', () => {
      const metrics = [
        { id: 'custom_speed', label: 'Speed', value: 85 },
        { id: 'custom_armor', label: 'Armor', value: 60 },
      ]
      const tradeoffMapping = { custom_speed: 'intelligence' }

      const artifact = synthesizeTradeoffArtifact('Custom System', metrics, tradeoffMapping)
      expect(artifact.buff.stat).toBe('intelligence')
      expect(artifact.vulnerability).toBeUndefined() // worst value is 60 > 40
    })
  })

  describe('resolveTimedReflectionDecryption', () => {
    it('awards bonus EXP on fast completion', () => {
      const result = resolveTimedReflectionDecryption(true, 30, 60)
      expect(result.success).toBe(true)
      expect(result.timeBonusExp).toBe(10)
      expect(result.damagePenalty).toBe(0)
    })

    it('inflicts penalty on timeout scaled by difficulty', () => {
      const normalResult = resolveTimedReflectionDecryption(false, 0, 60, 0, 1.0)
      expect(normalResult.success).toBe(false)
      expect(normalResult.damagePenalty).toBe(15)

      const hardResult = resolveTimedReflectionDecryption(false, 0, 60, 0, 1.5)
      expect(hardResult.damagePenalty).toBe(23) // round(15 * 1.5)

      const nightmareResult = resolveTimedReflectionDecryption(false, 0, 60, 0, 2.0)
      expect(nightmareResult.damagePenalty).toBe(30)
    })
  })

  describe('resolveBossItemAction', () => {
    const boss = {
      id: 'boss',
      name: 'Monolith Titan',
      type: 'boss',
      maxHp: 100,
      currentHp: 100,
      damage: 25,
      icon: '🐲',
    }

    it('handles Adapter Shield and Port Blade actions', () => {
      const shield = resolveBossItemAction('adapter_shield', boss)
      expect(shield.shieldActive).toBe(true)
      expect(shield.bossDamage).toBe(0)

      const blade = resolveBossItemAction('port_blade', boss)
      expect(blade.shieldActive).toBe(false)
      expect(blade.bossDamage).toBe(40)
    })
  })

  describe('resolveCombatTurn with active buffs and difficulty', () => {
    it('applies active buffs and vulnerabilities during combat turns', () => {
      const monster = {
        id: 'orc',
        name: 'Orc',
        type: 'orc',
        maxHp: 50,
        currentHp: 50,
        damage: 20,
        icon: '👹',
      }
      const attributes = { armor: 5, evasion: 0, intelligence: 10 }
      const activeBuffs = [
        { stat: 'armor' as const, value: 5, source: 'shield' },
        { stat: 'extra_damage' as const, value: 3, source: 'vulnerability', isPenalty: true },
      ]

      // Wrong answer: monster attacks
      // Damage = max(5, 20 - (5 + 5) + 3) = 13 damage
      const result = resolveCombatTurn(monster, attributes, false, activeBuffs)
      expect(result.playerDamageTaken).toBe(13)
    })

    it('scales monster damage with difficulty multiplier', () => {
      const monster = {
        id: 'dragon',
        name: 'Dragon',
        type: 'boss',
        maxHp: 100,
        damage: 40,
        icon: '🐲',
      }
      const attributes = { armor: 10, evasion: 0, intelligence: 10 }

      // Hard (1.5x damage): 40 * 1.5 = 60. Minus 10 armor = 50 damage
      const hardResult = resolveCombatTurn(monster, attributes, false, [], 0, 1.5)
      expect(hardResult.playerDamageTaken).toBe(50)

      // Easy (0.7x damage): 40 * 0.7 = 28. Minus 10 armor = 18 damage
      const easyResult = resolveCombatTurn(monster, attributes, false, [], 0, 0.7)
      expect(easyResult.playerDamageTaken).toBe(18)
    })
  })
})
