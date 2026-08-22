import React from 'react'
import type { TopicCampaignState, GlobalCharacterState, HexNodeData } from '../../types'
import { DIFFICULTY_CONFIGS } from '../../types'
import { Badge } from '../../../../ui-system'

interface CampaignHudBarProps {
  campaign: TopicCampaignState
  globalChar: GlobalCharacterState
  currentTopicId: string | null
  hasBossItems: boolean
  bossNode: HexNodeData | undefined
  nodes?: HexNodeData[]
}

export const CampaignHudBar: React.FC<CampaignHudBarProps> = ({
  campaign,
  globalChar,
  currentTopicId,
  hasBossItems,
  bossNode,
  nodes,
}) => {
  const isCapitalCleared =
    nodes?.some((n) => n.type === 'capital' && n.status === 'cleared') ??
    campaign.clearedNodeIds?.some((id) => nodes?.find((n) => n.id === id)?.type === 'capital') ??
    false

  const allRewards = nodes?.flatMap((n) => n.rewards || []) || []
  const requiredKeys = (bossNode?.requiredItems || []).map((reqId) => {
    const item = allRewards.find((r) => r.id === reqId) || campaign.inventory.find((r) => r.id === reqId)
    const isCollected = campaign.inventory.some((inv) => inv.id === reqId)
    return {
      id: reqId,
      name: item?.name || reqId,
      icon: item?.icon || '🗝️',
      isCollected,
    }
  })
  return (
    <div className="bg-[var(--ctp-surface0)] border border-[var(--ctp-surface1)] rounded-2xl p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 shadow-md">
      {/* Campaign Title & Difficulty Badge */}
      <div className="flex items-center gap-3 col-span-1 sm:col-span-2 lg:col-span-1">
        <span className="text-xl sm:text-2xl">🗺️</span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="text-xs sm:text-sm font-bold text-[var(--ctp-text)] truncate">{campaign.topicTitle}</h2>
            <Badge
              variant="secondary"
              className={`text-[9px] font-bold uppercase px-1.5 py-0 border ${
                campaign.difficulty === 'nightmare'
                  ? 'bg-[var(--ctp-red)]/20 text-[var(--ctp-red)] border-[var(--ctp-red)]/40'
                  : campaign.difficulty === 'hard'
                  ? 'bg-[var(--ctp-peach)]/20 text-[var(--ctp-peach)] border-[var(--ctp-peach)]/40'
                  : campaign.difficulty === 'normal'
                  ? 'bg-[var(--ctp-blue)]/20 text-[var(--ctp-blue)] border-[var(--ctp-blue)]/40'
                  : 'bg-[var(--ctp-green)]/20 text-[var(--ctp-green)] border-[var(--ctp-green)]/40'
              }`}
            >
              {DIFFICULTY_CONFIGS[campaign.difficulty || 'normal']?.icon} {campaign.difficulty || 'normal'}
            </Badge>
            <Badge variant="secondary" className="text-[9px] font-mono px-1.5 py-0 border border-[var(--ctp-surface1)]">
              Play #{globalChar?.topicPlayCounts?.[currentTopicId || ''] ?? 1}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-[var(--ctp-subtext0)]">
            <span>Topic Campaign Active</span>
            <span>·</span>
            <span className="font-mono text-[var(--ctp-green)]">
              🏛️ Pulses: {Math.max(0, (campaign.maxSanctuaryPulses ?? DIFFICULTY_CONFIGS[campaign.difficulty || 'normal']?.maxSanctuaryPulses ?? 5) - (campaign.sanctuaryPulsesUsed ?? 0))}/{campaign.maxSanctuaryPulses ?? DIFFICULTY_CONFIGS[campaign.difficulty || 'normal']?.maxSanctuaryPulses ?? 5}
            </span>
          </div>
        </div>
      </div>

      {/* Character HP Gauge */}
      <div className="flex items-center gap-2.5 bg-[var(--ctp-crust)]/60 p-2 sm:p-2.5 rounded-xl border border-[var(--ctp-surface1)]/40">
        <span className="text-base sm:text-lg">❤️</span>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between text-[11px] sm:text-xs mb-1 font-semibold">
            <span>HP</span>
            <span className={campaign.characterHp < 30 ? 'text-[var(--ctp-red)]' : 'text-[var(--ctp-green)]'}>
              {campaign.characterHp} / {campaign.maxCharacterHp}
            </span>
          </div>
          <div className="w-full bg-[var(--ctp-crust)] h-2 sm:h-2.5 rounded-full overflow-hidden border border-[var(--ctp-surface1)]">
            <div
              className={`h-full transition-all duration-300 ${
                campaign.characterHp < 30 ? 'bg-[var(--ctp-red)]' : 'bg-gradient-to-r from-[var(--ctp-green)] to-[var(--ctp-blue)]'
              }`}
              style={{ width: `${(campaign.characterHp / campaign.maxCharacterHp) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* System Chaos / Monster Enrage Gauge */}
      <div className="flex items-center gap-2.5 bg-[var(--ctp-crust)]/60 p-2 sm:p-2.5 rounded-xl border border-[var(--ctp-surface1)]/40">
        <span className="text-base sm:text-lg">🌀</span>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between text-[11px] sm:text-xs mb-1 font-semibold">
            <span>Chaos</span>
            <span className={campaign.chaosLevel > 60 ? 'text-[var(--ctp-red)]' : 'text-[var(--ctp-mauve)]'}>
              {campaign.chaosLevel}% (+{Math.round((campaign.chaosLevel / 200) * 100)}% Dmg)
            </span>
          </div>
          <div className="w-full bg-[var(--ctp-crust)] h-2 sm:h-2.5 rounded-full overflow-hidden border border-[var(--ctp-surface1)]">
            <div
              className={`h-full transition-all duration-300 ${
                campaign.chaosLevel > 70
                  ? 'bg-[var(--ctp-red)]'
                  : campaign.chaosLevel > 35
                  ? 'bg-[var(--ctp-yellow)]'
                  : 'bg-[var(--ctp-green)]'
              }`}
              style={{ width: `${(campaign.chaosLevel / 100) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Inventory & Forged Gear Tray */}
      <div className="flex flex-col justify-center gap-1.5 bg-[var(--ctp-crust)]/60 p-2 sm:p-2.5 rounded-xl border border-[var(--ctp-surface1)]/40 col-span-1 sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] text-[var(--ctp-subtext0)] font-semibold flex items-center gap-1">
            <span>🗝️ Keys:</span>
            <span className={hasBossItems ? 'text-[var(--ctp-green)]' : 'text-[var(--ctp-yellow)]'}>
              {campaign.inventory.length}/{bossNode?.requiredItems?.length || 2}
            </span>
          </span>
          <Badge
            variant={hasBossItems ? 'success' : 'warning'}
            className="text-[9px] uppercase font-mono px-1.5 py-0"
          >
            {hasBossItems ? 'Boss Ready' : 'Need Keys'}
          </Badge>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {/* Key items revealed once Citadel is cleared */}
          {isCapitalCleared && requiredKeys.length > 0 ? (
            <>
              {requiredKeys.map((item) => (
                <Badge
                  key={item.id}
                  variant="secondary"
                  className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 transition-all ${
                    item.isCollected
                      ? 'bg-[var(--ctp-blue)]/20 text-[var(--ctp-blue)] border-[var(--ctp-blue)]/40 font-semibold'
                      : 'bg-[var(--ctp-surface0)] text-[var(--ctp-subtext0)] border-dashed border-[var(--ctp-surface2)] opacity-65'
                  }`}
                  title={item.isCollected ? `Obtained: ${item.name}` : `Key Quest: ${item.name} (Not Yet Collected)`}
                >
                  <span>{item.isCollected ? item.icon : '🔒'}</span>
                  <span className="truncate max-w-[80px]">{item.name}</span>
                </Badge>
              ))}
              {campaign.activeBuffs.map((buff, idx) => (
                <Badge
                  key={`${buff.source}-${idx}`}
                  variant="secondary"
                  className="bg-[var(--ctp-green)]/20 text-[var(--ctp-green)] border-[var(--ctp-green)]/40 text-[10px] px-1.5 py-0 flex items-center gap-0.5"
                >
                  <span>⚒️</span>
                  <span className="truncate max-w-[80px]">+{buff.value}% {buff.stat}</span>
                </Badge>
              ))}
            </>
          ) : campaign.inventory.length === 0 && campaign.activeBuffs.length === 0 ? (
            <span className="text-[10px] text-[var(--ctp-subtext0)] italic">
              {isCapitalCleared ? '(No gear collected)' : 'Clear Citadel to reveal Key Quests'}
            </span>
          ) : (
            <>
              {campaign.inventory.map((item) => (
                <Badge
                  key={item.id}
                  variant="secondary"
                  className="bg-[var(--ctp-blue)]/20 text-[var(--ctp-blue)] border-[var(--ctp-blue)]/40 text-[10px] px-1.5 py-0 flex items-center gap-0.5"
                >
                  <span>{item.icon}</span>
                  <span className="truncate max-w-[80px]">{item.name}</span>
                </Badge>
              ))}
              {campaign.activeBuffs.map((buff, idx) => (
                <Badge
                  key={`${buff.source}-${idx}`}
                  variant="secondary"
                  className="bg-[var(--ctp-green)]/20 text-[var(--ctp-green)] border-[var(--ctp-green)]/40 text-[10px] px-1.5 py-0 flex items-center gap-0.5"
                >
                  <span>⚒️</span>
                  <span className="truncate max-w-[80px]">+{buff.value}% {buff.stat}</span>
                </Badge>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
