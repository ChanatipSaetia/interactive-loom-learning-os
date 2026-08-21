import React from 'react'
import { Award } from 'lucide-react'
import type { GlobalCharacterState, DerivedCharacterStats } from '../../types'
import { deriveStatPercentage } from '../../game-rules'
import { Button, Badge } from '../../../../ui-system'

interface CharacterHeroBannerProps {
  globalChar: GlobalCharacterState
  derivedStats?: DerivedCharacterStats
  derivedCampaignsStarted: number
  onAllocateStat: (stat: 'armor' | 'evasion' | 'intelligence') => void
  onOpenBadges: () => void
}

export const CharacterHeroBanner: React.FC<CharacterHeroBannerProps> = ({
  globalChar,
  derivedStats,
  derivedCampaignsStarted,
  onAllocateStat,
  onOpenBadges,
}) => {
  const effectiveArmor = derivedStats?.armor ?? deriveStatPercentage(globalChar.attributes.armor ?? 0)
  const effectiveEvasion = derivedStats?.evasion ?? deriveStatPercentage(globalChar.attributes.evasion ?? 0)
  const effectiveIntelligence = derivedStats?.intelligence ?? deriveStatPercentage(globalChar.attributes.intelligence ?? 0)

  return (
    <header className="bg-gradient-to-r from-[#292c3c] via-[#303446] to-[#292c3c] border border-[#414559] rounded-3xl p-5 sm:p-6 lg:p-7 shadow-2xl flex flex-col gap-5">
      {/* Row 1: Champion Identity, Level, and EXP Progress */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#8caaee] via-[#ca9ee6] to-[#f4b8e4] flex items-center justify-center text-2xl sm:text-3xl shadow-xl border border-[#8caaee]/50 shrink-0">
            🧙‍♂️
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-extrabold text-[#b5bfe2] tracking-tight truncate">
                Architecture Champion
              </h1>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="bg-[#8caaee]/20 text-[#8caaee] border-[#8caaee]/40 text-xs px-2.5 py-0.5 font-bold">
                  Lvl {globalChar.level}
                </Badge>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#a5adce] mt-0.5 line-clamp-1">
              Persistent Cross-Campaign Learning Avatar · Level up and forge stats!
            </p>
          </div>
        </div>

        {/* EXP Progress Box */}
        <div className="w-full sm:w-64 lg:w-72 bg-[#232634]/70 border border-[#414559]/50 rounded-xl p-2.5 space-y-1 shrink-0">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#a5adce]">
            <span>EXP Progress</span>
            <span className="text-[#a6d189] font-bold">{globalChar.exp} / {globalChar.nextLevelExp}</span>
          </div>
          <div className="w-full bg-[#181825] h-2 rounded-full overflow-hidden border border-[#414559]/40">
            <div
              className="bg-gradient-to-r from-[#8caaee] to-[#a6d189] h-full transition-all duration-500"
              style={{ width: `${(globalChar.exp / globalChar.nextLevelExp) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Row 2: Character Attributes & Badges Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-6 bg-[#232634]/90 p-3 sm:px-6 sm:py-3.5 rounded-2xl border border-[#414559] shadow-inner">
        <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-8 flex-1">
          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left bg-[#1e1e2e]/50 sm:bg-transparent p-2 sm:p-0 rounded-xl">
            <span className="text-xl sm:text-2xl">🛡️</span>
            <div>
              <span className="text-[10px] sm:text-xs text-[#a5adce] font-semibold block">Armor</span>
              <span className="text-sm sm:text-base font-bold text-[#e5c890]">
                {globalChar.attributes.armor}{' '}
                <span className="text-xs font-normal text-[#a5adce]">({effectiveArmor}%)</span>
              </span>
            </div>
            {globalChar.unallocatedPoints > 0 && (
              <Button size="sm" variant="ghost" className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-[#a6d189] hover:bg-[#a6d189]/20" onClick={() => onAllocateStat('armor')}>
                +
              </Button>
            )}
          </div>

          <div className="hidden sm:block w-px h-8 bg-[#414559]" />

          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left bg-[#1e1e2e]/50 sm:bg-transparent p-2 sm:p-0 rounded-xl">
            <span className="text-xl sm:text-2xl">⚡</span>
            <div>
              <span className="text-[10px] sm:text-xs text-[#a5adce] font-semibold block">Evasion</span>
              <span className="text-sm sm:text-base font-bold text-[#8caaee]">
                {globalChar.attributes.evasion}{' '}
                <span className="text-xs font-normal text-[#a5adce]">({effectiveEvasion}%)</span>
              </span>
            </div>
            {globalChar.unallocatedPoints > 0 && (
              <Button size="sm" variant="ghost" className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-[#a6d189] hover:bg-[#a6d189]/20" onClick={() => onAllocateStat('evasion')}>
                +
              </Button>
            )}
          </div>

          <div className="hidden sm:block w-px h-8 bg-[#414559]" />

          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left bg-[#1e1e2e]/50 sm:bg-transparent p-2 sm:p-0 rounded-xl">
            <span className="text-xl sm:text-2xl">💡</span>
            <div>
              <span className="text-[10px] sm:text-xs text-[#a5adce] font-semibold block">Intel</span>
              <span className="text-sm sm:text-base font-bold text-[#ca9ee6]">
                {globalChar.attributes.intelligence}{' '}
                <span className="text-xs font-normal text-[#a5adce]">({effectiveIntelligence}%)</span>
              </span>
            </div>
            {globalChar.unallocatedPoints > 0 && (
              <Button size="sm" variant="ghost" className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-[#a6d189] hover:bg-[#a6d189]/20" onClick={() => onAllocateStat('intelligence')}>
                +
              </Button>
            )}
          </div>

          <div className="hidden sm:block w-px h-8 bg-[#414559]" />

          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left bg-[#1e1e2e]/50 sm:bg-transparent p-2 sm:p-0 rounded-xl col-span-3 sm:col-span-1">
            <span className="text-xl sm:text-2xl">🏆</span>
            <div>
              <span className="text-[10px] sm:text-xs text-[#a5adce] font-semibold block">Campaigns</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-[#a6d189]">
                {globalChar.totalCampaignsSucceeded ?? 0} <span className="text-[10px] font-normal text-[#a5adce]">won</span> / {derivedCampaignsStarted} <span className="text-[10px] font-normal text-[#a5adce]">started</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t border-[#414559]/50 sm:border-0 shrink-0">
          {globalChar.unallocatedPoints > 0 && (
            <Badge
              variant="success"
              className="animate-pulse px-2.5 py-1.5 text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1 shadow-sm"
            >
              <span>✨</span>
              <span>{globalChar.unallocatedPoints} Stat Pts!</span>
            </Badge>
          )}

          <Button
            variant="ghost"
            onClick={onOpenBadges}
            className="border border-[#414559] hover:bg-[#414559]/50 text-xs py-1.5 px-3 h-auto shrink-0 flex items-center justify-center"
          >
            <Award size={14} className="mr-1.5 text-[#e5c890] shrink-0" />
            <span>Badges ({globalChar.unlockedBadges.length})</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
