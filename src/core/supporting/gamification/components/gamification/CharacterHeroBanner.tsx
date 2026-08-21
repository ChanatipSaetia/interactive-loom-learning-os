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
    <header className="bg-gradient-to-r from-[var(--ctp-surface0)] via-[var(--ctp-base)] to-[var(--ctp-surface0)] border border-[var(--ctp-surface1)] rounded-3xl p-5 sm:p-6 lg:p-7 shadow-2xl flex flex-col gap-5">
      {/* Row 1: Champion Identity, Level, and EXP Progress */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[var(--ctp-blue)] via-[var(--ctp-mauve)] to-[var(--ctp-peach)] flex items-center justify-center text-2xl sm:text-3xl shadow-xl border border-[var(--ctp-blue)]/50 shrink-0">
            🧙‍♂️
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-extrabold text-[var(--ctp-text)] tracking-tight truncate">
                Architecture Champion
              </h1>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="bg-[var(--ctp-blue)]/20 text-[var(--ctp-blue)] border-[var(--ctp-blue)]/40 text-xs px-2.5 py-0.5 font-bold">
                  Lvl {globalChar.level}
                </Badge>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[var(--ctp-subtext0)] mt-0.5 line-clamp-1">
              Persistent Cross-Campaign Learning Avatar · Level up and forge stats!
            </p>
          </div>
        </div>

        {/* EXP Progress Box */}
        <div className="w-full sm:w-64 lg:w-72 bg-[var(--ctp-surface0)]/70 border border-[var(--ctp-surface1)]/50 rounded-xl p-2.5 space-y-1 shrink-0">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ctp-subtext0)]">
            <span>EXP Progress</span>
            <span className="text-[var(--ctp-green)] font-bold">{globalChar.exp} / {globalChar.nextLevelExp}</span>
          </div>
          <div className="w-full bg-[var(--ctp-crust)] h-2 rounded-full overflow-hidden border border-[var(--ctp-surface1)]/40">
            <div
              className="bg-gradient-to-r from-[var(--ctp-blue)] to-[var(--ctp-green)] h-full transition-all duration-500"
              style={{ width: `${(globalChar.exp / globalChar.nextLevelExp) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Row 2: Character Attributes & Badges Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-6 bg-[var(--ctp-surface0)]/90 p-3 sm:px-6 sm:py-3.5 rounded-2xl border border-[var(--ctp-surface1)] shadow-inner">
        <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-8 flex-1">
          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left bg-[var(--ctp-crust)]/50 sm:bg-transparent p-2 sm:p-0 rounded-xl">
            <span className="text-xl sm:text-2xl">🛡️</span>
            <div>
              <span className="text-[10px] sm:text-xs text-[var(--ctp-subtext0)] font-semibold block">Armor</span>
              <span className="text-sm sm:text-base font-bold text-[var(--ctp-yellow)]">
                {globalChar.attributes.armor}{' '}
                <span className="text-xs font-normal text-[var(--ctp-subtext0)]">({effectiveArmor}%)</span>
              </span>
            </div>
            {globalChar.unallocatedPoints > 0 && (
              <Button size="sm" variant="ghost" className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-[var(--ctp-green)] hover:bg-[var(--ctp-green)]/20" onClick={() => onAllocateStat('armor')}>
                +
              </Button>
            )}
          </div>

          <div className="hidden sm:block w-px h-8 bg-[var(--ctp-surface1)]" />

          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left bg-[var(--ctp-crust)]/50 sm:bg-transparent p-2 sm:p-0 rounded-xl">
            <span className="text-xl sm:text-2xl">⚡</span>
            <div>
              <span className="text-[10px] sm:text-xs text-[var(--ctp-subtext0)] font-semibold block">Evasion</span>
              <span className="text-sm sm:text-base font-bold text-[var(--ctp-blue)]">
                {globalChar.attributes.evasion}{' '}
                <span className="text-xs font-normal text-[var(--ctp-subtext0)]">({effectiveEvasion}%)</span>
              </span>
            </div>
            {globalChar.unallocatedPoints > 0 && (
              <Button size="sm" variant="ghost" className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-[var(--ctp-green)] hover:bg-[var(--ctp-green)]/20" onClick={() => onAllocateStat('evasion')}>
                +
              </Button>
            )}
          </div>

          <div className="hidden sm:block w-px h-8 bg-[var(--ctp-surface1)]" />

          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left bg-[var(--ctp-crust)]/50 sm:bg-transparent p-2 sm:p-0 rounded-xl">
            <span className="text-xl sm:text-2xl">💡</span>
            <div>
              <span className="text-[10px] sm:text-xs text-[var(--ctp-subtext0)] font-semibold block">Intel</span>
              <span className="text-sm sm:text-base font-bold text-[var(--ctp-mauve)]">
                {globalChar.attributes.intelligence}{' '}
                <span className="text-xs font-normal text-[var(--ctp-subtext0)]">({effectiveIntelligence}%)</span>
              </span>
            </div>
            {globalChar.unallocatedPoints > 0 && (
              <Button size="sm" variant="ghost" className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-[var(--ctp-green)] hover:bg-[var(--ctp-green)]/20" onClick={() => onAllocateStat('intelligence')}>
                +
              </Button>
            )}
          </div>

          <div className="hidden sm:block w-px h-8 bg-[var(--ctp-surface1)]" />

          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left bg-[var(--ctp-crust)]/50 sm:bg-transparent p-2 sm:p-0 rounded-xl col-span-3 sm:col-span-1">
            <span className="text-xl sm:text-2xl">🏆</span>
            <div>
              <span className="text-[10px] sm:text-xs text-[var(--ctp-subtext0)] font-semibold block">Campaigns</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-[var(--ctp-green)]">
                {globalChar.totalCampaignsSucceeded ?? 0} <span className="text-[10px] font-normal text-[var(--ctp-subtext0)]">won</span> / {derivedCampaignsStarted} <span className="text-[10px] font-normal text-[var(--ctp-subtext0)]">started</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t border-[var(--ctp-surface1)]/50 sm:border-0 shrink-0">
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
            className="border border-[var(--ctp-surface1)] hover:bg-[var(--ctp-surface1)]/50 text-xs py-1.5 px-3 h-auto shrink-0 flex items-center justify-center"
          >
            <Award size={14} className="mr-1.5 text-[var(--ctp-yellow)] shrink-0" />
            <span>Badges ({globalChar.unlockedBadges.length})</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
