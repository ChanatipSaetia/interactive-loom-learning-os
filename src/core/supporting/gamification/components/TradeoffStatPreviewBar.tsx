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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--ctp-surface0)] p-3.5 rounded-2xl border border-[var(--ctp-yellow)]/40 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--ctp-yellow)]/20 border border-[var(--ctp-yellow)]/40 flex items-center justify-center text-xl text-[var(--ctp-yellow)] shrink-0">
          ⚒️
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--ctp-yellow)]">Synthesized Weapon Artifact</span>
            {artifact && (
              <Badge variant="secondary" className="bg-[var(--ctp-yellow)]/20 text-[var(--ctp-yellow)] text-[10px]">
                {artifact.name}
              </Badge>
            )}
          </div>
          <span className="text-xs text-[var(--ctp-subtext0)]">
            {hasSelection
              ? 'Tuning trade-off sliders actively shapes your combat armor and evasion modifiers'
              : 'Select trade-off choices in the workshop below to synthesize equipment buffs'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Positive Buff Preview Badge or No-Buff Notice */}
        {artifact ? (
          <div className="flex items-center gap-1.5 bg-[var(--ctp-crust)] px-3 py-1.5 rounded-lg border border-[var(--ctp-green)]/40 text-xs text-[var(--ctp-green)] font-bold">
            <Sparkles size={14} />
            <span>{artifact.buff.label}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-[var(--ctp-crust)] px-3 py-1.5 rounded-lg border border-[var(--ctp-surface1)]/40 text-xs text-[var(--ctp-subtext0)] italic">
            <span>No Choices Selected (0 Buffs)</span>
          </div>
        )}

        {/* Vulnerability Penalty Badge if any */}
        {artifact?.vulnerability && (
          <div className="flex items-center gap-1.5 bg-[var(--ctp-crust)] px-3 py-1.5 rounded-lg border border-[var(--ctp-red)]/40 text-xs text-[var(--ctp-red)] font-semibold">
            <AlertTriangle size={14} />
            <span>{artifact.vulnerability.label}</span>
          </div>
        )}

        {/* 1-Click Forge Action Button */}
        <Button
          disabled={!hasSelection || !artifact}
          className={`font-bold text-xs px-4 py-2 flex items-center gap-2 transition-all ${
            !hasSelection || !artifact
              ? 'bg-[var(--ctp-surface1)] text-[var(--ctp-subtext0)] cursor-not-allowed border border-[var(--ctp-surface2)]'
              : 'bg-gradient-to-r from-[var(--primary)] to-[color-mix(in_srgb,var(--primary)_85%,black)] hover:brightness-110 text-[var(--primary-foreground)] border border-[color-mix(in_srgb,var(--primary)_40%,transparent)] shadow-[0_4px_16px_color-mix(in_srgb,var(--primary)_35%,transparent)]'
          }`}
          onClick={() => {
            if (artifact) {
              onForgeArtifact(artifact)
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
