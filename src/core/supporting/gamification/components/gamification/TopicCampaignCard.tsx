import React from 'react'
import { Play, RotateCcw } from 'lucide-react'
import type { GlobalCharacterState, TopicCampaignState, DifficultyLevel } from '../../types'
import { DIFFICULTY_CONFIGS } from '../../types'
import type { TopicRoute } from '../../../../learning-engine/composition/routes'
import { Button, Badge } from '../../../../ui-system'

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
  const topicBadges = globalChar?.unlockedBadges.filter(
    (b) => b.topicId === topic.id || b.topicTitle === topic.label
  ) || []

  return (
    <div
      className="bg-[#292c3c]/90 hover:bg-[#303446] border border-[#414559] hover:border-[#8caaee]/60 rounded-2xl p-4 sm:p-5 shadow-xl transition-all duration-300 flex flex-col justify-between gap-3 sm:gap-4 group"
    >
      <div className="space-y-2.5 sm:space-y-3">
        {/* Header: Icon, Title, Category, Status Badge */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#8caaee]/10 border border-[#8caaee]/30 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-105 transition-transform shrink-0">
              {topic.id === 'gamification' ? '🧠' : '📐'}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-[#b5bfe2] group-hover:text-[#8caaee] transition-colors truncate">
                {topic.label}
              </h3>
              <span className="text-[10px] sm:text-xs font-mono text-[#8caaee] block truncate">{topic.category}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {playCount > 0 && (
              <Badge variant="secondary" className="text-[9px] font-mono px-1.5 py-0.5 border border-[#414559]">
                🎮 {playCount} {playCount === 1 ? 'Play' : 'Plays'}
              </Badge>
            )}
            <Badge variant="default" className="text-[9px] uppercase py-0.5 px-2">
              Hex Campaign
            </Badge>
          </div>
        </div>

        <p className="text-xs text-[#a5adce] leading-snug line-clamp-2">
          {topic.description}
        </p>

        {/* Earned Badges Row (Compact inline icons) */}
        {topicBadges.length > 0 && (
          <div className="bg-[#1e1e2e]/70 px-2.5 py-1.5 rounded-xl border border-[#8caaee]/30 flex items-center justify-between gap-2">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#8caaee] tracking-wider shrink-0">
              Badges ({topicBadges.length}):
            </span>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {topicBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="group/badge relative cursor-help"
                >
                  <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-[#292c3c] hover:bg-[#303446] border border-[#8caaee]/40 flex items-center justify-center text-sm sm:text-base shadow-sm transition-transform hover:scale-110">
                    {badge.icon}
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover/badge:flex flex-col w-48 p-2 bg-[#181825] border border-[#8caaee]/50 rounded-xl shadow-2xl z-50 text-left pointer-events-none">
                    <div className="flex items-center gap-1.5 font-bold text-[#8caaee] text-xs">
                      <span>{badge.icon}</span>
                      <span className="truncate">{badge.title}</span>
                    </div>
                    <p className="text-[10px] text-[#c6d0f5] mt-1 leading-tight">
                      {badge.description}
                    </p>
                    {badge.difficulty && (
                      <span className="text-[9px] uppercase font-semibold text-[#ef9f76] mt-1">
                        Tier: {badge.difficulty}
                      </span>
                    )}
                    <span className="text-[9px] text-[#737994] mt-0.5">
                      Earned: {badge.unlockedAt}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress and Difficulty Selector Stack - hidden when localStorage has campaign data */}
        {!topicStarted && (
          <div className="bg-[#1e1e2e]/50 p-2.5 sm:p-3 rounded-xl border border-[#414559]/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] sm:text-xs">
              <span className="text-[#a5adce] font-semibold">Realm Challenge Difficulty:</span>
              <span className="font-bold text-[#ef9f76] capitalize">
                {DIFFICULTY_CONFIGS[topicDifficulty]?.label}
              </span>
            </div>

            {/* Difficulty Selector Chips */}
            <div className="flex items-center justify-between gap-1 sm:gap-1.5 flex-wrap">
              <div className="flex items-center gap-1 sm:gap-1.5 w-full justify-between">
                {(['easy', 'normal', 'hard', 'nightmare'] as DifficultyLevel[]).map((diff) => {
                  const conf = DIFFICULTY_CONFIGS[diff]
                  const isActive = topicDifficulty === diff
                  return (
                    <div key={diff} className="relative group/tier flex-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectDifficulty(topic.id, diff)
                        }}
                        className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg transition-all flex items-center gap-1 w-full justify-center ${
                          isActive
                            ? diff === 'nightmare'
                              ? 'bg-[#ea999c] text-[#232634] shadow-md scale-105'
                              : diff === 'hard'
                              ? 'bg-[#ef9f76] text-[#232634] shadow-md scale-105'
                              : diff === 'normal'
                              ? 'bg-[#8caaee] text-[#232634] shadow-md scale-105'
                              : 'bg-[#a6d189] text-[#232634] shadow-md scale-105'
                            : 'bg-[#303446] hover:bg-[#414559] text-[#a5adce]'
                        }`}
                      >
                        <span>{conf.icon}</span>
                        <span className="capitalize">{diff}</span>
                      </button>

                      {/* Rich Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tier:flex flex-col w-48 sm:w-52 p-2 sm:p-2.5 bg-[#181825] border border-[#414559] rounded-xl shadow-2xl z-50 text-left pointer-events-none">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-[#b5bfe2]">
                          <span>{conf.icon}</span>
                          <span>{conf.label}</span>
                        </div>
                        <p className="text-[10px] text-[#a5adce] mt-0.5 leading-tight">
                          {conf.description}
                        </p>
                        <div className="mt-1.5 pt-1.5 border-t border-[#414559]/50 space-y-0.5 text-[9px] font-mono">
                          <div className="flex justify-between text-[#e78284]">
                            <span>Damage:</span>
                            <span>{conf.damageMultiplier}x</span>
                          </div>
                          <div className="flex justify-between text-[#a6d189]">
                            <span>EXP Reward:</span>
                            <span>{conf.expBonusMultiplier}x</span>
                          </div>
                          <div className="flex justify-between text-[#ef9f76]">
                            <span>Chaos Speed:</span>
                            <span>{conf.chaosMultiplier}x</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1.5">
        <Button
          className="flex-1 bg-gradient-to-r from-[#8caaee] to-[#a6d189] hover:opacity-90 text-[#232634] font-bold text-xs sm:text-sm py-2 sm:py-2.5 shadow-lg flex items-center justify-center gap-1.5"
          onClick={() => onSelectTopic(topic.id)}
        >
          <Play size={14} fill="currentColor" />
          <span>{isStarted ? 'Resume Campaign' : 'Start Campaign'}</span>
        </Button>
        {isStarted && (
          <Button
            variant="ghost"
            className="border border-[#e78284]/30 hover:bg-[#e78284]/10 text-[#e78284] text-xs px-2.5 py-2 sm:py-2.5 h-auto"
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
