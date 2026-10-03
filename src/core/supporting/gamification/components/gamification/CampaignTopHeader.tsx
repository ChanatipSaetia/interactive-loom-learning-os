import React from 'react'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import type { GlobalCharacterState, DerivedCharacterStats } from '../../types'
import { deriveStatPercentage } from '../../game-rules'
import { Button, Badge } from '../../../../ui-system'

interface CampaignTopHeaderProps {
  globalChar: GlobalCharacterState
  derivedStats?: DerivedCharacterStats
  combatLog: string[]
  onReturnToLobby: () => void
  onAllocateStat: (stat: 'armor' | 'evasion' | 'intelligence') => void
  onReset: () => void
  onOpenBadges: () => void
}

export const CampaignTopHeader: React.FC<CampaignTopHeaderProps> = ({
  globalChar,
  derivedStats,
  combatLog,
  onReturnToLobby,
  onAllocateStat,
  onReset,
  onOpenBadges,
}) => {
  const effectiveArmor = derivedStats?.armor ?? deriveStatPercentage(globalChar.attributes.armor ?? 0)
  const effectiveEvasion = derivedStats?.evasion ?? deriveStatPercentage(globalChar.attributes.evasion ?? 0)
  const effectiveIntelligence = derivedStats?.intelligence ?? deriveStatPercentage(globalChar.attributes.intelligence ?? 0)

  return (
    <header className="bg-[var(--ctp-surface0)]/80 backdrop-blur-xl border border-[var(--ctp-surface1)] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Character Title & Level */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button
          variant="ghost"
          onClick={onReturnToLobby}
          className="border border-[var(--ctp-surface1)] hover:bg-[var(--ctp-surface1)]/50 text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center gap-1.5 shrink-0"
          title="Stop campaign and return to Realm Lobby"
        >
          <ArrowLeft size={14} />
          <span>Lobby</span>
        </Button>

        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[var(--ctp-blue)] to-[var(--ctp-mauve)] flex items-center justify-center text-xl sm:text-2xl shadow-lg border border-[var(--ctp-blue)]/40 shrink-0">
          🧙‍♂️
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-xl font-bold text-[var(--ctp-text)] truncate">Architecture Champion</h1>
            <Badge variant="secondary" className="bg-[var(--ctp-blue)]/20 text-[var(--ctp-blue)] border-[var(--ctp-blue)]/40 text-[10px] sm:text-xs">
              Lvl {globalChar.level}
            </Badge>
          </div>
          {/* EXP Bar */}
          <div className="w-full max-w-[180px] sm:w-48 bg-[var(--ctp-crust)] h-2 rounded-full overflow-hidden mt-1.5 sm:mt-2 border border-[var(--ctp-surface1)]">
            <div
              className="bg-gradient-to-r from-[var(--ctp-blue)] to-[var(--ctp-green)] h-full transition-all duration-500"
              style={{ width: `${(globalChar.exp / globalChar.nextLevelExp) * 100}%` }}
            />
          </div>
          <span className="text-[10px] sm:text-xs text-[var(--ctp-subtext0)] mt-0.5 sm:mt-1 block font-mono">
            {globalChar.exp} / {globalChar.nextLevelExp} EXP
          </span>
        </div>
      </div>

      {/* Global Character Stats & Allocation (Responsive Grid on Mobile) */}
      <div className="flex items-center justify-between md:justify-start gap-3 sm:gap-6 bg-[var(--ctp-base)] px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl border border-[var(--ctp-surface1)]">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-base sm:text-lg">🛡️</span>
          <div>
            <span className="text-[10px] sm:text-xs text-[var(--ctp-subtext0)] block">Armor</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--ctp-yellow)]">
              {globalChar.attributes.armor}{' '}
              <span className="text-[10px] sm:text-xs font-normal text-[var(--ctp-subtext0)]">({effectiveArmor}%)</span>
            </span>
          </div>
          {globalChar.unallocatedPoints > 0 && (
            <Button size="sm" variant="ghost" className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-[var(--ctp-green)]" onClick={() => onAllocateStat('armor')}>
              +
            </Button>
          )}
        </div>

        <div className="w-px h-6 sm:h-8 bg-[var(--ctp-surface1)]" />

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-base sm:text-lg">⚡</span>
          <div>
            <span className="text-[10px] sm:text-xs text-[var(--ctp-subtext0)] block">Evasion</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--ctp-blue)]">
              {globalChar.attributes.evasion}{' '}
              <span className="text-[10px] sm:text-xs font-normal text-[var(--ctp-subtext0)]">({effectiveEvasion}%)</span>
            </span>
          </div>
          {globalChar.unallocatedPoints > 0 && (
            <Button size="sm" variant="ghost" className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-[var(--ctp-green)]" onClick={() => onAllocateStat('evasion')}>
              +
            </Button>
          )}
        </div>

        <div className="w-px h-6 sm:h-8 bg-[var(--ctp-surface1)]" />

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-base sm:text-lg">💡</span>
          <div>
            <span className="text-[10px] sm:text-xs text-[var(--ctp-subtext0)] block">Intel</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--ctp-mauve)]">
              {globalChar.attributes.intelligence}{' '}
              <span className="text-[10px] sm:text-xs font-normal text-[var(--ctp-subtext0)]">({effectiveIntelligence}%)</span>
            </span>
          </div>
          {globalChar.unallocatedPoints > 0 && (
            <Button size="sm" variant="ghost" className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-[var(--ctp-green)]" onClick={() => onAllocateStat('intelligence')}>
              +
            </Button>
          )}
        </div>

        {globalChar.unallocatedPoints > 0 && (
          <Badge variant="success" className="animate-pulse text-[10px] ml-1">
            {globalChar.unallocatedPoints} Pts!
          </Badge>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 sm:gap-3">
        {combatLog.length > 0 && (
          <span className="text-xs font-mono text-[var(--ctp-mauve)] hidden lg:inline truncate max-w-xs">
            {combatLog[0]}
          </span>
        )}
        <Button
          variant="ghost"
          onClick={onReset}
          className="border border-[var(--ctp-red)]/40 hover:bg-[var(--ctp-red)]/20 text-[var(--ctp-red)] text-xs px-2.5 py-1.5"
          title="Reset campaign and start a new play run (+1 Play Count)"
        >
          <RotateCcw size={13} className="mr-1" />
          Reset
        </Button>
        <Button variant="ghost" onClick={onOpenBadges} className="border border-[var(--ctp-surface1)] hover:bg-[var(--ctp-surface1)]/50 text-xs px-2.5 py-1.5">
          🏆 Badges ({globalChar.unlockedBadges.length})
        </Button>
      </div>
    </header>
  )
}
