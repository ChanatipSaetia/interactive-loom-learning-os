import React, { useState } from 'react'
import { MonsterData, CharacterAttributes, ItemReward } from '../types'
import { resolveBossItemAction, deriveStatPercentage } from '../game-rules'
import { Button, Badge } from '../../../ui-system'
import { Trophy } from 'lucide-react'

interface BossBattleArenaProps {
  monster: MonsterData
  playerAttributes: CharacterAttributes
  playerHp?: number
  maxPlayerHp?: number
  inventory?: ItemReward[]
  onVictory: (rewardItem: ItemReward) => void
  onTakeDamage: (damage: number) => void
}

export const BossBattleArena: React.FC<BossBattleArenaProps> = ({
  monster,
  playerAttributes,
  playerHp,
  maxPlayerHp,
  inventory = [],
  onVictory,
  onTakeDamage,
}) => {
  const [currentMonsterHp, setCurrentMonsterHp] = useState(monster.currentHp ?? monster.maxHp)
  const [battlePhase, setBattlePhase] = useState<'phase-1' | 'phase-2' | 'victory'>('phase-1')
  const [shieldActive, setShieldActive] = useState(false)

  // Determine active item skill loadout: use campaign inventory or standard default key items
  const availableItems: ItemReward[] = inventory.length > 0
    ? inventory
    : [
        {
          id: 'adapter_shield',
          name: 'Adapter Shield',
          icon: '🛡️',
          description: 'Isolates incoming attack damage completely for 1 turn.',
        },
        {
          id: 'port_blade',
          name: 'Port Blade',
          icon: '⚔️',
          description: 'Pierces titanium coupling dealing 40 True Damage.',
        },
      ]

  const [combatLog, setCombatLog] = useState<string[]>([
    `${monster.icon || '🐲'} ${monster.name}: Monolithic Titan rises! Use your collected Key Items!`,
  ])

  const isEnraged = currentMonsterHp <= Math.min(50, monster.maxHp * 0.35) && battlePhase !== 'victory'

  const handleUseItemSkill = (item: ItemReward) => {
    const result = resolveBossItemAction(item.id, monster, item)
    setCombatLog((prev) => [result.message, ...prev])

    let activeShield = shieldActive
    if (result.shieldActive) {
      setShieldActive(true)
      activeShield = true
    }

    if (result.bossDamage > 0) {
      const nextHp = Math.max(0, currentMonsterHp - result.bossDamage)
      setCurrentMonsterHp(nextHp)

      if (nextHp === 0) {
        setBattlePhase('victory')
        setCombatLog((prev) => [
          `👑 ${monster.name.toUpperCase()} DEFEATED! Realm mastery achieved!`,
          ...prev,
        ])
        onVictory({
          id: 'hexagonal-mastery-crown',
          name: 'Hexagonal Mastery Crown',
          icon: '👑',
          description: 'Mastery over decoupled software architectures.',
        })
        return
      } else if (nextHp <= Math.min(50, monster.maxHp * 0.35) && battlePhase === 'phase-1') {
        setBattlePhase('phase-2')
        setCombatLog((prev) => [
          `🔥 ${monster.name.toUpperCase()} ENRAGES! Unleashing devastating attacks!`,
          ...prev,
        ])
      }

      // Boss counterattack after damage-dealing strike
      if (activeShield) {
        setShieldActive(false)
        setCombatLog((prev) => [
          `🛡️ Shield completely blocked ${monster.name}'s counterattack!`,
          ...prev,
        ])
      } else {
        const rawDamage = isEnraged ? (monster.damage || 35) + 10 : (monster.damage || 20)
        const armorReduction = deriveStatPercentage(playerAttributes?.armor || 0)
        const netDamage = Math.max(5, rawDamage - armorReduction)
        onTakeDamage(netDamage)
        setCombatLog((prev) => [
          `💥 ${monster.name} retaliated for ${netDamage} damage (${armorReduction}% blocked by armor)!`,
          ...prev,
        ])
      }
    }
  }

  if (battlePhase === 'victory') {
    return (
      <div className="bg-[var(--ctp-base)] p-8 rounded-3xl border border-[var(--ctp-green)]/50 text-center space-y-5 max-w-2xl mx-auto shadow-2xl animate-fade-in">
        <span className="text-7xl animate-bounce block">👑</span>
        <h2 className="text-2xl font-bold text-[var(--ctp-green)]">Campaign Victory Achieved!</h2>
        <p className="text-sm text-[var(--ctp-subtext0)] leading-relaxed">
          You have conquered the {monster.name} using your masterfully collected Key Items!
          The realm has been unified under Decoupled Architecture principles!
        </p>

        <div className="p-4 bg-[var(--ctp-surface0)] rounded-2xl border border-[var(--ctp-blue)]/40 flex items-center justify-center gap-3">
          <Trophy size={24} className="text-[var(--ctp-yellow)]" />
          <span className="font-bold text-[var(--ctp-yellow)]">Reward Earned: Hexagonal Mastery Crown 👑</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Boss Encounter Header */}
      <div className="bg-[var(--ctp-base)] p-5 rounded-3xl border border-[var(--ctp-maroon)]/40 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--ctp-maroon)]/30 to-[var(--ctp-red)]/20 border border-[var(--ctp-maroon)]/50 flex items-center justify-center text-3xl shadow-lg shrink-0">
            {monster.icon || '🐲'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-[var(--ctp-maroon)]">{monster.name}</h2>
              <Badge variant={isEnraged ? 'destructive' : 'warning'}>
                {isEnraged ? '🔥 PHASE 2: ENRAGED' : '🛡️ PHASE 1: BOSS SHIELD'}
              </Badge>
              {shieldActive && (
                <Badge variant="success">
                  🛡️ SHIELD ACTIVE
                </Badge>
              )}
            </div>
            <span className="text-xs text-[var(--ctp-subtext0)]">
              Final Boss Encounter · Tactical Key Item Combat Arena
            </span>
          </div>
        </div>

        <div className="w-full md:w-64 text-right">
          <div className="flex justify-between text-xs mb-1 font-mono font-bold">
            <span className="text-[var(--ctp-subtext0)]">Boss Health</span>
            <span className="text-[var(--ctp-maroon)]">{currentMonsterHp} / {monster.maxHp} HP</span>
          </div>
          <div className="w-full bg-[var(--ctp-crust)] h-3 rounded-full overflow-hidden border border-[var(--ctp-surface1)]">
            <div
              className={`h-full transition-all duration-300 ${
                isEnraged ? 'bg-gradient-to-r from-[var(--ctp-red)] to-[var(--ctp-maroon)]' : 'bg-[var(--ctp-red)]'
              }`}
              style={{ width: `${(currentMonsterHp / monster.maxHp) * 100}%` }}
            />
          </div>
          {playerHp !== undefined && maxPlayerHp !== undefined && (
            <div className="flex justify-between text-[11px] mt-2 font-mono text-[var(--ctp-subtext0)]">
              <span>Player Health:</span>
              <span className="font-bold text-[var(--ctp-green)]">{playerHp} / {maxPlayerHp} HP</span>
            </div>
          )}
        </div>
      </div>

      {/* Tactical Key Items Command Bar */}
      <div>
        <h3 className="text-xs font-bold text-[var(--ctp-blue)] uppercase tracking-wider mb-2">
          ⚔️ Tactical Key Item Skills ({availableItems.length} Available)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {availableItems.map((item, idx) => {
            const isShield = /shield|aegis|amulet|ward|barrier/i.test(item.id + item.name)
            const isBlade = /blade|sword|crystal|product|weapon|strike/i.test(item.id + item.name)
            const actionVerb = isShield ? 'Deploy' : isBlade ? 'Strike with' : 'Use'
            const gradient = isShield
              ? 'from-[var(--ctp-blue)] to-[var(--ctp-green)]'
              : isBlade
              ? 'from-[var(--ctp-mauve)] to-[var(--ctp-maroon)]'
              : 'from-[var(--ctp-yellow)] to-[var(--ctp-peach)]'

            return (
              <Button
                key={item.id || idx}
                className={`bg-gradient-to-r ${gradient} hover:opacity-90 text-[var(--ctp-crust)] font-bold p-4 h-auto flex flex-col items-start gap-1 rounded-2xl shadow-lg text-left`}
                onClick={() => handleUseItemSkill(item)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.icon || (isShield ? '🛡️' : '⚔️')}</span>
                  <span className="text-sm">{actionVerb} {item.name}</span>
                </div>
                <span className="text-[11px] opacity-90 font-normal">
                  {item.description || (isShield ? 'Isolates incoming attack damage completely for 1 turn.' : 'Pierces defenses dealing 40 True Damage.')}
                </span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Combat Log */}
      <div className="bg-[var(--ctp-surface0)] p-4 rounded-2xl border border-[var(--ctp-surface1)] space-y-1.5 font-mono text-xs max-h-48 overflow-y-auto shadow-inner">
        <span className="text-[var(--ctp-subtext0)] font-bold block mb-1">📜 Boss Combat Log:</span>
        {combatLog.map((log, index) => (
          <div key={index} className="text-[var(--ctp-text)]">{log}</div>
        ))}
      </div>
    </div>
  )
}
