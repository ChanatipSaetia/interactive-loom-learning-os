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
    <header className="bg-[#303446]/80 backdrop-blur-xl border border-[#414559] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Character Title & Level */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button
          variant="ghost"
          onClick={onReturnToLobby}
          className="border border-[#414559] hover:bg-[#414559]/50 text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center gap-1.5 shrink-0"
          title="Stop campaign and return to Realm Lobby"
        >
          <ArrowLeft size={14} />
          <span>Lobby</span>
        </Button>

        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#8caaee] to-[#ca9ee6] flex items-center justify-center text-xl sm:text-2xl shadow-lg border border-[#8caaee]/40 shrink-0">
          🧙‍♂️
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-xl font-bold text-[#b5bfe2] truncate">Architecture Champion</h1>
            <Badge variant="secondary" className="bg-[#8caaee]/20 text-[#8caaee] border-[#8caaee]/40 text-[10px] sm:text-xs">
              Lvl {globalChar.level}
            </Badge>
          </div>
          {/* EXP Bar */}
          <div className="w-full max-w-[180px] sm:w-48 bg-[#232634] h-2 rounded-full overflow-hidden mt-1.5 sm:mt-2 border border-[#414559]">
            <div
              className="bg-gradient-to-r from-[#8caaee] to-[#a6d189] h-full transition-all duration-500"
              style={{ width: `${(globalChar.exp / globalChar.nextLevelExp) * 100}%` }}
            />
          </div>
          <span className="text-[10px] sm:text-xs text-[#a5adce] mt-0.5 sm:mt-1 block font-mono">
            {globalChar.exp} / {globalChar.nextLevelExp} EXP
          </span>
        </div>
      </div>

      {/* Global Character Stats & Allocation (Responsive Grid on Mobile) */}
      <div className="flex items-center justify-between md:justify-start gap-3 sm:gap-6 bg-[#232634] px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl border border-[#414559]">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-base sm:text-lg">🛡️</span>
          <div>
            <span className="text-[10px] sm:text-xs text-[#a5adce] block">Armor</span>
            <span className="text-xs sm:text-sm font-bold text-[#e5c890]">
              {globalChar.attributes.armor}{' '}
              <span className="text-[10px] sm:text-xs font-normal text-[#a5adce]">({effectiveArmor}%)</span>
            </span>
          </div>
          {globalChar.unallocatedPoints > 0 && (
            <Button size="sm" variant="ghost" className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-[#a6d189]" onClick={() => onAllocateStat('armor')}>
              +
            </Button>
          )}
        </div>

        <div className="w-px h-6 sm:h-8 bg-[#414559]" />

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-base sm:text-lg">⚡</span>
          <div>
            <span className="text-[10px] sm:text-xs text-[#a5adce] block">Evasion</span>
            <span className="text-xs sm:text-sm font-bold text-[#8caaee]">
              {globalChar.attributes.evasion}{' '}
              <span className="text-[10px] sm:text-xs font-normal text-[#a5adce]">({effectiveEvasion}%)</span>
            </span>
          </div>
          {globalChar.unallocatedPoints > 0 && (
            <Button size="sm" variant="ghost" className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-[#a6d189]" onClick={() => onAllocateStat('evasion')}>
              +
            </Button>
          )}
        </div>

        <div className="w-px h-6 sm:h-8 bg-[#414559]" />

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-base sm:text-lg">💡</span>
          <div>
            <span className="text-[10px] sm:text-xs text-[#a5adce] block">Intel</span>
            <span className="text-xs sm:text-sm font-bold text-[#ca9ee6]">
              {globalChar.attributes.intelligence}{' '}
              <span className="text-[10px] sm:text-xs font-normal text-[#a5adce]">({effectiveIntelligence}%)</span>
            </span>
          </div>
          {globalChar.unallocatedPoints > 0 && (
            <Button size="sm" variant="ghost" className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-[#a6d189]" onClick={() => onAllocateStat('intelligence')}>
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
          <span className="text-xs font-mono text-[#ca9ee6] hidden lg:inline truncate max-w-xs">
            {combatLog[0]}
          </span>
        )}
        <Button
          variant="ghost"
          onClick={onReset}
          className="border border-[#e78284]/40 hover:bg-[#e78284]/20 text-[#e78284] text-xs px-2.5 py-1.5"
          title="Reset campaign and start a new play run (+1 Play Count)"
        >
          <RotateCcw size={13} className="mr-1" />
          Reset
        </Button>
        <Button variant="ghost" onClick={onOpenBadges} className="border border-[#414559] hover:bg-[#414559]/50 text-xs px-2.5 py-1.5">
          🏆 Badges ({globalChar.unlockedBadges.length})
        </Button>
      </div>
    </header>
  )
}
