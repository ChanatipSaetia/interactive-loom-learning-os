import React, { useState } from 'react'
import { MonsterData, CharacterAttributes, ItemReward } from '../types'
import { Button } from '../../../ui-system'
import { Swords, Shield, Zap } from 'lucide-react'

interface CombatStageHeaderProps {
  monster: MonsterData
  playerAttributes: CharacterAttributes
  playerHp: number
  maxPlayerHp: number
  inventory: ItemReward[]
  onUseItem?: (itemId: string) => void
  combatLogMessage?: string
}

export const CombatStageHeader: React.FC<CombatStageHeaderProps> = ({
  monster,
  playerAttributes,
  playerHp,
  maxPlayerHp,
  inventory,
  onUseItem,
  combatLogMessage,
}) => {
  const [activeItemFeedback, setActiveItemFeedback] = useState<string | null>(null)

  const monsterHp = monster.currentHp ?? monster.maxHp
  const monsterHpPercent = Math.max(0, (monsterHp / monster.maxHp) * 100)
  const playerHpPercent = Math.max(0, (playerHp / maxPlayerHp) * 100)

  const handleTriggerItem = (item: ItemReward) => {
    if (onUseItem) {
      onUseItem(item.id)
    }
    setActiveItemFeedback(`Used ${item.name}! Skill Activated.`)
    setTimeout(() => setActiveItemFeedback(null), 3000)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
        {/* Left: Player Combatant Card */}
        <div className="flex items-center gap-3 bg-[#232634] p-3 rounded-2xl border border-[#8caaee]/30">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8caaee] to-[#ca9ee6] flex items-center justify-center text-2xl shrink-0 shadow-md">
            🧙‍♂️
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-bold text-[#8caaee] truncate">Architect Champion</span>
              <span className="font-mono text-[#a6d189]">{playerHp}/{maxPlayerHp} HP</span>
            </div>
            <div className="w-full bg-[#181825] h-2.5 rounded-full overflow-hidden border border-[#414559]">
              <div
                className="h-full bg-gradient-to-r from-[#a6d189] to-[#8caaee] transition-all duration-300"
                style={{ width: `${playerHpPercent}%` }}
              />
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#a5adce]">
              <span className="flex items-center gap-0.5"><Shield size={10} /> {playerAttributes.armor}% Arm</span>
              <span className="flex items-center gap-0.5"><Zap size={10} /> {playerAttributes.evasion}% Eva</span>
            </div>
          </div>
        </div>

        {/* Center: Duel VS Banner & Usable Item Actions */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 font-bold text-xs text-[#ea999c] tracking-widest uppercase">
            <Swords size={16} />
            <span>Tactical Encounter</span>
          </div>

          {/* Quick-Action Key Items */}
          <div className="flex items-center gap-2 mt-2">
            {inventory.map((item) => (
              <Button
                key={item.id}
                size="sm"
                variant="ghost"
                className="h-8 px-2.5 text-xs bg-[#232634] border border-[#8caaee]/40 text-[#8caaee] hover:bg-[#8caaee]/20 flex items-center gap-1.5 font-bold"
                onClick={() => handleTriggerItem(item)}
                title={`Use ${item.name}`}
              >
                <span>{item.icon || '⚔️'}</span>
                <span>{item.name}</span>
              </Button>
            ))}
          </div>

          {activeItemFeedback && (
            <span className="text-[11px] text-[#a6d189] animate-pulse mt-1 font-semibold">
              ✨ {activeItemFeedback}
            </span>
          )}
        </div>

        {/* Right: Monster Combatant Card */}
        <div className="flex items-center gap-3 bg-[#232634] p-3 rounded-2xl border border-[#e78284]/30">
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-bold text-[#e78284] truncate">{monster.name}</span>
              <span className="font-mono text-[#e78284]">{monsterHp}/{monster.maxHp} HP</span>
            </div>
            <div className="w-full bg-[#181825] h-2.5 rounded-full overflow-hidden border border-[#414559]">
              <div
                className="h-full bg-gradient-to-r from-[#e78284] to-[#ea999c] transition-all duration-300"
                style={{ width: `${monsterHpPercent}%` }}
              />
            </div>
            <div className="flex justify-end items-center gap-2 mt-1.5 text-[10px] text-[#a5adce]">
              <span>⚔️ Attack: {monster.damage} Dmg</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#e78284]/30 to-[#303446] border border-[#e78284]/40 flex items-center justify-center text-2xl shrink-0 shadow-md">
            {monster.icon || '👹'}
          </div>
        </div>
      </div>

      {/* Combat Log Message Bar */}
      {combatLogMessage && (
        <div className="bg-[#181825] px-3 py-1.5 rounded-lg border border-[#414559] text-xs font-mono text-[#c6d0f5] text-center truncate">
          {combatLogMessage}
        </div>
      )}
    </div>
  )
}
