import React from 'react'
import { Play, RotateCcw, Info } from 'lucide-react'
import type { GlobalCharacterState, TopicCampaignState, DifficultyLevel } from '../../types'
import { DIFFICULTY_CONFIGS } from '../../types'
import type { TopicRoute } from '../../../../learning-engine/composition/routes'
import { Button, Badge } from '../../../../ui-system'
import { Dropdown, type DropdownOption } from '../../../../ui-system/motion/dropdown'

interface TopicCampaignCardProps {
  topic: TopicRoute
  globalChar: GlobalCharacterState
  isCurrent: boolean
  campaign: TopicCampaignState | null
  topicDifficulty: DifficultyLevel
  onSelectTopic: (topicId: string) => void
  onSelectDifficulty: (topicId: string, diff: DifficultyLevel) => void
  onResetCampaign: (topicId: string) => void
}

export const TopicCampaignCard: React.FC<TopicCampaignCardProps> = ({
  topic,
  globalChar,
  isCurrent,
  campaign,
  topicDifficulty,
  onSelectTopic,
  onSelectDifficulty,
  onResetCampaign,
}) => {
  // Read saved topic state from localStorage if available
  let topicStarted = false
  try {
    const raw = localStorage.getItem(`loom_gamification_campaign_${topic.id}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.isStarted === true || (Array.isArray(parsed.clearedNodeIds) && parsed.clearedNodeIds.length > 0)) {
        topicStarted = true
      }
    }
  } catch {
    // Ignore parse errors
  }

  const isStarted = isCurrent ? (campaign?.isStarted || (campaign?.clearedNodeIds?.length ?? 0) > 0) : topicStarted
  const playCount = globalChar?.topicPlayCounts?.[topic.id] ?? (isStarted ? 1 : 0)
  const currentDiff = (isStarted && campaign?.difficulty) ? campaign.difficulty : topicDifficulty
  const activeDiffConf = DIFFICULTY_CONFIGS[topicDifficulty] || DIFFICULTY_CONFIGS.normal
  const topicBadges = Array.from(
    new Map(
      (globalChar?.unlockedBadges.filter(
        (b) => b.topicId === topic.id || b.topicTitle === topic.label
      ) || []).map((b) => [b.id, b])
    ).values()
  )

  const difficultyOptions: DropdownOption[] = (['easy', 'normal', 'hard', 'nightmare'] as DifficultyLevel[]).map((diff) => {
    const conf = DIFFICULTY_CONFIGS[diff]
    return {
      value: diff,
      label: `${conf.icon} ${conf.label}`,
    }
  })

  return (
    <div
      className="bg-[var(--ctp-surface0)]/90 hover:bg-[var(--ctp-surface0)] border border-[var(--ctp-surface1)] hover:border-[var(--ctp-blue)]/60 rounded-2xl p-4 sm:p-5 shadow-xl transition-all duration-300 flex flex-col justify-between gap-3 sm:gap-4 group"
    >
      <div className="space-y-2.5 sm:space-y-3">
        {/* Header: Icon, Title, Category, Status Badge */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[var(--ctp-blue)]/10 border border-[var(--ctp-blue)]/30 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-105 transition-transform shrink-0">
              {topic.id === 'gamification' ? '🧠' : '📐'}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-[var(--ctp-text)] group-hover:text-[var(--ctp-blue)] transition-colors truncate">
                {topic.label}
              </h3>
              <span className="text-[10px] sm:text-xs font-mono text-[var(--ctp-blue)] block truncate">{topic.category}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {playCount > 0 && (
              <Badge variant="secondary" className="text-[9px] font-mono px-1.5 py-0.5 border border-[var(--ctp-surface1)]">
                🎮 {playCount} {playCount === 1 ? 'Play' : 'Plays'}
              </Badge>
            )}
            {isStarted && (
              <div className="relative group/headerdiff flex items-center">
                <Badge variant="secondary" className="text-[9px] font-mono px-1.5 py-0.5 bg-[var(--ctp-peach)] text-black font-bold border-transparent cursor-help">
                  {DIFFICULTY_CONFIGS[currentDiff]?.icon} {DIFFICULTY_CONFIGS[currentDiff]?.label}
                </Badge>
                {/* Tooltip for header diff */}
                <div className="absolute top-full right-0 mt-2 hidden group-hover/headerdiff:flex flex-col w-56 p-2.5 bg-[var(--ctp-crust)] border border-[var(--ctp-surface2)] rounded-xl shadow-2xl z-50 text-left pointer-events-none">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--ctp-text)]">
                    <span>{DIFFICULTY_CONFIGS[currentDiff]?.icon}</span>
                    <span>{DIFFICULTY_CONFIGS[currentDiff]?.label}</span>
                  </div>
                  <p className="text-[10px] text-[var(--ctp-subtext0)] mt-1 leading-snug">
                    {DIFFICULTY_CONFIGS[currentDiff]?.description}
                  </p>
                </div>
              </div>
            )}
            <Badge variant="default" className="text-[9px] uppercase py-0.5 px-2">
              Hex Campaign
            </Badge>
          </div>
        </div>

        <p className="text-xs text-[var(--ctp-subtext0)] leading-snug line-clamp-2">
          {topic.description}
        </p>

        {/* Earned Badges Row (Compact inline icons) */}
        {topicBadges.length > 0 && (
          <div className="bg-[var(--ctp-crust)]/70 px-2.5 py-1.5 rounded-xl border border-[var(--ctp-blue)]/30 flex items-center justify-between gap-2">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[var(--ctp-blue)] tracking-wider shrink-0">
              Badges ({topicBadges.length}):
            </span>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {topicBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="group/badge relative cursor-help"
                >
                  <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-[var(--ctp-surface0)] hover:bg-[var(--ctp-surface1)] border border-[var(--ctp-blue)]/40 flex items-center justify-center text-sm sm:text-base shadow-sm transition-transform hover:scale-110">
                    {badge.icon}
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover/badge:flex flex-col w-48 p-2 bg-[var(--ctp-crust)] border border-[var(--ctp-blue)]/50 rounded-xl shadow-2xl z-50 text-left pointer-events-none">
                    <div className="flex items-center gap-1.5 font-bold text-[var(--ctp-blue)] text-xs">
                      <span>{badge.icon}</span>
                      <span className="truncate">{badge.title}</span>
                    </div>
                    <p className="text-[10px] text-[var(--ctp-text)] mt-1 leading-tight">
                      {badge.description}
                    </p>
                    {badge.difficulty && (
                      <span className="text-[9px] uppercase font-semibold text-[var(--ctp-peach)] mt-1">
                        Tier: {badge.difficulty}
                      </span>
                    )}
                    <span className="text-[9px] text-[var(--ctp-subtext0)] mt-0.5">
                      Earned: {badge.unlockedAt}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1.5">
        <Button
          className="flex-1 bg-gradient-to-r from-[var(--primary)] to-[color-mix(in_srgb,var(--primary)_85%,black)] hover:brightness-110 text-[var(--primary-foreground)] border border-[color-mix(in_srgb,var(--primary)_40%,transparent)] shadow-[0_6px_20px_color-mix(in_srgb,var(--primary)_35%,transparent)] font-bold text-xs sm:text-sm py-2 sm:py-2.5 h-9 sm:h-10 flex items-center justify-center gap-1.5 transition-all"
          onClick={() => onSelectTopic(topic.id)}
        >
          <Play size={14} fill="currentColor" />
          <span>{isStarted ? 'Resume Campaign' : 'Start Campaign'}</span>
        </Button>
        {!isStarted && (
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-36 sm:w-48">
              <Dropdown
                value={topicDifficulty}
                onChange={(val) => onSelectDifficulty(topic.id, val as DifficultyLevel)}
                options={difficultyOptions}
                className="w-full sm:min-w-0"
                triggerClassName="h-9 sm:h-10 text-xs sm:text-sm bg-[var(--ctp-surface1)]/80 hover:bg-[var(--ctp-surface1)] border-[var(--ctp-surface2)] text-[var(--ctp-text)] font-semibold rounded-xl px-3"
                optionsClassName="right-0 left-auto bg-[var(--ctp-crust)] border border-[var(--ctp-surface1)] rounded-xl min-w-[210px] w-auto shadow-2xl p-1 z-50"
                optionClassName="hover:bg-[var(--ctp-surface0)] text-[var(--ctp-text)] rounded-lg px-2.5 py-1.5 transition-colors"
                optionActiveClassName="bg-[var(--ctp-blue)] text-black font-bold"
                renderOption={(opt) => {
                  const conf = DIFFICULTY_CONFIGS[opt.value as DifficultyLevel]
                  const isActive = opt.value === topicDifficulty
                  return (
                    <div className={`flex items-center justify-between w-full gap-2 text-xs py-0.5 ${isActive ? 'text-black' : ''}`}>
                      <span className="flex items-center gap-1.5 font-bold whitespace-nowrap">
                        <span>{conf.icon}</span>
                        <span>{conf.label}</span>
                      </span>
                      <span className={`text-[10px] font-mono whitespace-nowrap ${isActive ? 'text-black/80 font-bold' : 'text-[var(--ctp-subtext0)]'}`}>
                        {conf.damageMultiplier}x dmg
                      </span>
                    </div>
                  )
                }}
              />
            </div>

            {/* Info Tooltip for Selected Difficulty */}
            <div className="relative group/diffinfo flex items-center">
              <button
                type="button"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--ctp-surface1)]/80 hover:bg-[var(--ctp-surface1)] border border-[var(--ctp-surface2)] text-[var(--ctp-subtext0)] hover:text-[var(--ctp-text)] flex items-center justify-center transition-colors cursor-help"
                aria-label="Difficulty Details"
                title={`${activeDiffConf.label} Details`}
              >
                <Info size={15} />
              </button>

              {/* Tooltip Popup */}
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover/diffinfo:flex flex-col w-56 sm:w-64 p-3 bg-[var(--ctp-crust)] border border-[var(--ctp-surface2)] rounded-xl shadow-2xl z-50 text-left pointer-events-none">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--ctp-text)]">
                  <span>{activeDiffConf.icon}</span>
                  <span>{activeDiffConf.label}</span>
                </div>
                <p className="text-[11px] text-[var(--ctp-subtext0)] mt-1 leading-snug">
                  {activeDiffConf.description}
                </p>
                <div className="mt-2 pt-2 border-t border-[var(--ctp-surface1)] space-y-1 text-[10px] font-mono">
                  <div className="flex justify-between text-[var(--ctp-red)]">
                    <span>Monster Damage:</span>
                    <span className="font-bold">{activeDiffConf.damageMultiplier}x</span>
                  </div>
                  <div className="flex justify-between text-[var(--ctp-green)]">
                    <span>EXP Reward:</span>
                    <span className="font-bold">{activeDiffConf.expBonusMultiplier}x</span>
                  </div>
                  <div className="flex justify-between text-[var(--ctp-peach)]">
                    <span>Chaos Speed:</span>
                    <span className="font-bold">{activeDiffConf.chaosMultiplier}x</span>
                  </div>
                  <div className="flex justify-between text-[var(--ctp-blue)]">
                    <span>Sanctuary Pulses:</span>
                    <span className="font-bold">{activeDiffConf.maxSanctuaryPulses}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {isStarted && (
          <Button
            variant="ghost"
            className="border border-[var(--ctp-red)]/30 hover:bg-[var(--ctp-red)]/10 text-[var(--ctp-red)] text-xs px-2.5 py-2 sm:py-2.5 h-9 sm:h-10 shrink-0"
            onClick={() => onResetCampaign(topic.id)}
            title="Reset Campaign: Removes all saved data for this topic"
          >
            <RotateCcw size={14} />
          </Button>
        )}
      </div>
    </div>
  )
}
