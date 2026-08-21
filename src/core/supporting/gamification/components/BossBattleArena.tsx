import React, { useState } from 'react'
import { MonsterData, CharacterAttributes, ItemReward } from '../types'
import { resolveBossItemAction } from '../game-rules'
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
  onVictory,
  onTakeDamage,
}) => {
  const [currentMonsterHp, setCurrentMonsterHp] = useState(monster.currentHp ?? monster.maxHp)
  const [battlePhase, setBattlePhase] = useState<'phase-1' | 'phase-2' | 'victory'>('phase-1')
  const [combatLog, setCombatLog] = useState<string[]>([
    '🐲 Monolithic Titan rises from the legacy codebase! Use your Adapter Shield and Port Blade!',
  ])
  const [shieldActive, setShieldActive] = useState(false)

  const isEnraged = currentMonsterHp <= 50 && battlePhase !== 'victory'

  const handleUseItemSkill = (itemId: 'adapter_shield' | 'port_blade') => {
    const result = resolveBossItemAction(itemId, monster)
    setCombatLog((prev) => [result.message, ...prev])

    if (result.bossDamage > 0) {
      const nextHp = Math.max(0, currentMonsterHp - result.bossDamage)
      setCurrentMonsterHp(nextHp)

      if (nextHp === 0) {
        setBattlePhase('victory')
        setCombatLog((prev) => ['👑 MONOLITHIC TITAN DEFEATED! Hexagonal architecture is saved!', ...prev])
        onVictory({
          id: 'hexagonal-mastery-crown',
          name: 'Hexagonal Mastery Crown',
          icon: '👑',
          description: 'Mastery over decoupled software architectures.',
        })
      } else if (nextHp <= 50 && battlePhase === 'phase-1') {
        setBattlePhase('phase-2')
        setCombatLog((prev) => ['🔥 TITAN ENRAGES! Unleashing Tight-Coupling Shockwaves!', ...prev])
      }
    }

    if (result.shieldActive) {
      setShieldActive(true)
    }

    // Trigger boss counterattack after item skill
    if (result.bossDamage > 0) {
      if (shieldActive) {
        setShieldActive(false)
        setCombatLog((prev) => ['🛡️ Adapter Shield completely blocked the Titan counterattack!', ...prev])
      } else {
        const rawDamage = isEnraged ? 35 : 20
        const netDamage = Math.max(5, rawDamage - playerAttributes.armor)
        onTakeDamage(netDamage)
      }
    }
  }

  if (battlePhase === 'victory') {
    return (
      <div className="bg-[#232634] p-8 rounded-3xl border border-[#a6d189]/50 text-center space-y-5 max-w-2xl mx-auto shadow-2xl">
        <span className="text-7xl animate-bounce block">👑</span>
        <h2 className="text-2xl font-bold text-[#a6d189]">Campaign Victory Achieved!</h2>
        <p className="text-sm text-[#a5adce] leading-relaxed">
          You have conquered the Monolithic Complexity Titan using strict Port Contracts and Adapter Boundaries.
          The realm has been unified under Decoupled Architecture principles!
        </p>

        <div className="p-4 bg-[#181825] rounded-2xl border border-[#8caaee]/40 flex items-center justify-center gap-3">
          <Trophy size={24} className="text-[#e5c890]" />
          <span className="font-bold text-[#e5c890]">Reward Earned: Hexagonal Mastery Crown 👑</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Boss Encounter Header */}
      <div className="bg-[#232634] p-5 rounded-3xl border border-[#ea999c]/40 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ea999c]/30 to-[#e78284]/20 border border-[#ea999c]/50 flex items-center justify-center text-3xl shadow-lg">
            🐲
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#ea999c]">{monster.name}</h2>
              <Badge variant={isEnraged ? 'destructive' : 'warning'}>
                {isEnraged ? '🔥 PHASE 2: ENRAGED' : '🛡️ PHASE 1: TITAN SHIELD'}
              </Badge>
            </div>
            <span className="text-xs text-[#a5adce]">
              Final Architectural Showdown · Requires Tactical Item Execution
            </span>
          </div>
        </div>

        <div className="w-full md:w-64 text-right">
          <div className="flex justify-between text-xs mb-1 font-mono font-bold">
            <span className="text-[#a5adce]">Boss Health</span>
            <span className="text-[#ea999c]">{currentMonsterHp} / {monster.maxHp} HP</span>
          </div>
          <div className="w-full bg-[#181825] h-3 rounded-full overflow-hidden border border-[#414559]">
            <div
              className={`h-full transition-all duration-300 ${
                isEnraged ? 'bg-gradient-to-r from-[#e78284] to-[#ea999c]' : 'bg-[#e78284]'
              }`}
              style={{ width: `${(currentMonsterHp / monster.maxHp) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tactical Item Skills Command Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          className="bg-gradient-to-r from-[#8caaee] to-[#a6d189] hover:opacity-90 text-[#232634] font-bold p-4 h-auto flex flex-col items-start gap-1 rounded-2xl shadow-lg"
          onClick={() => handleUseItemSkill('adapter_shield')}
        >
          <div className="flex items-center gap-2">
            <span>🛡️</span>
            <span className="text-sm">Deploy Adapter Shield</span>
          </div>
          <span className="text-[11px] opacity-80 font-normal">
            Isolates incoming attack damage completely for 1 turn.
          </span>
        </Button>

        <Button
          className="bg-gradient-to-r from-[#ca9ee6] to-[#ea999c] hover:opacity-90 text-[#232634] font-bold p-4 h-auto flex flex-col items-start gap-1 rounded-2xl shadow-lg"
          onClick={() => handleUseItemSkill('port_blade')}
        >
          <div className="flex items-center gap-2">
            <span>⚔️</span>
            <span className="text-sm">Strike with Port Blade</span>
          </div>
          <span className="text-[11px] opacity-80 font-normal">
            Pierces titanium coupling dealing 40 True Damage.
          </span>
        </Button>
      </div>

      {/* Combat Log */}
      <div className="bg-[#181825] p-4 rounded-2xl border border-[#414559] space-y-1.5 font-mono text-xs max-h-40 overflow-y-auto">
        <span className="text-[#a5adce] font-bold block mb-1">📜 Boss Combat Log:</span>
        {combatLog.map((log, index) => (
          <div key={index} className="text-[#c6d0f5]">{log}</div>
        ))}
      </div>
    </div>
  )
}
