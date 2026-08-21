import React from 'react'
import { synthesizeTradeoffArtifact } from '../game-rules'
import { Button, Badge } from '../../../ui-system'
import { Hammer, Sparkles, AlertTriangle } from 'lucide-react'

interface TradeoffStatPreviewBarProps {
  metrics: Array<{ id: string; label: string; value: number }>
  tradeoffMapping?: Record<string, string>
  onForgeArtifact: (artifact: { name: string; buff: { stat: 'armor' | 'evasion' | 'intelligence' | 'chaos_shield'; value: number; label: string }; vulnerability?: { stat: 'extra_damage' | 'healing_penalty'; value: number; label: string }; durationTurns: number }) => void
}

export const TradeoffStatPreviewBar: React.FC<TradeoffStatPreviewBarProps> = ({
  metrics,
  tradeoffMapping,
  onForgeArtifact,
}) => {
  const hasSelection = metrics.length > 0
  const artifact = hasSelection ? synthesizeTradeoffArtifact('Architectural Forge', metrics, tradeoffMapping) : null

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#232634] p-3.5 rounded-2xl border border-[#e5c890]/40 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#e5c890]/20 border border-[#e5c890]/40 flex items-center justify-center text-xl text-[#e5c890] shrink-0">
          ⚒️
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#e5c890]">Synthesized Weapon Artifact</span>
            {artifact && (
              <Badge variant="secondary" className="bg-[#e5c890]/20 text-[#e5c890] text-[10px]">
                {artifact.name}
              </Badge>
            )}
          </div>
          <span className="text-xs text-[#a5adce]">
            {hasSelection
              ? 'Tuning trade-off sliders actively shapes your combat armor and evasion modifiers'
              : 'Select trade-off choices in the workshop below to synthesize equipment buffs'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Positive Buff Preview Badge or No-Buff Notice */}
        {artifact ? (
          <div className="flex items-center gap-1.5 bg-[#181825] px-3 py-1.5 rounded-lg border border-[#a6d189]/40 text-xs text-[#a6d189] font-bold">
            <Sparkles size={14} />
            <span>{artifact.buff.label}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-[#181825] px-3 py-1.5 rounded-lg border border-[#737994]/40 text-xs text-[#737994] italic">
            <span>No Choices Selected (0 Buffs)</span>
          </div>
        )}

        {/* Vulnerability Penalty Badge if any */}
        {artifact?.vulnerability && (
          <div className="flex items-center gap-1.5 bg-[#181825] px-3 py-1.5 rounded-lg border border-[#e78284]/40 text-xs text-[#e78284] font-semibold">
            <AlertTriangle size={14} />
            <span>{artifact.vulnerability.label}</span>
          </div>
        )}

        {/* 1-Click Forge Action Button */}
        <Button
          disabled={!hasSelection || !artifact}
          className={`font-bold text-xs px-4 py-2 flex items-center gap-2 shadow-md ${
            !hasSelection || !artifact
              ? 'bg-[#414559] text-[#737994] cursor-not-allowed border border-[#51576d]'
              : 'bg-gradient-to-r from-[#e5c890] to-[#ef9f76] hover:opacity-90 text-[#232634]'
          }`}
          onClick={() => {
            if (artifact) {
              onForgeArtifact(artifact as any)
            }
          }}
        >
          <Hammer size={14} />
          <span>{hasSelection ? 'Forge & Equip Artifact' : 'Make Choices to Forge'}</span>
        </Button>
      </div>
    </div>
  )
}
