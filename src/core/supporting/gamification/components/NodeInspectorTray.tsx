import React from 'react'
import { HexNodeData, ItemReward } from '../types'
import { encryptToMagicRunes, canUnlockBoss } from '../game-rules'
import { Button, Badge } from '../../../ui-system'
import { Swords, Sparkles, Key, CheckCircle, Lock, Play } from 'lucide-react'

interface NodeInspectorTrayProps {
  selectedNode: HexNodeData | null
  nodes?: HexNodeData[]
  inventory: ItemReward[]
  onLaunchEncounter: (node: HexNodeData) => void
}

export const NodeInspectorTray: React.FC<NodeInspectorTrayProps> = ({
  selectedNode,
  inventory,
  onLaunchEncounter,
}) => {
  if (!selectedNode) return null

  const isCapital = selectedNode.type === 'capital'
  const isSanctuary = selectedNode.type === 'reading_sanctuary'
  const isQuiz = selectedNode.type === 'quiz_encounter'
  const isReflection = selectedNode.type === 'reflection_decryption'
  const isWorkshop = selectedNode.type === 'tradeoff_workshop'
  const isBoss = selectedNode.type === 'boss_lair'

  const isLocked = selectedNode.status === 'locked'
  const isCleared = selectedNode.status === 'cleared'
  const isBossUnlockable = isBoss ? canUnlockBoss(inventory, selectedNode) : true

  // Mask title in magic runes if locked (except capital)
  const displayTitle = isLocked && !isCapital
    ? encryptToMagicRunes(selectedNode.title)
    : selectedNode.title

  return (
    <div className="bg-[var(--ctp-surface0)]/95 backdrop-blur-xl border border-[var(--ctp-surface1)] rounded-2xl p-3.5 sm:p-4 shadow-2xl transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
        {/* Node Identity & Type */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl shrink-0 border ${
            isCleared ? 'bg-[var(--ctp-green)]/20 border-[var(--ctp-green)]/40 text-[var(--ctp-green)]' :
            isBoss && !isLocked ? 'bg-[var(--ctp-maroon)]/20 border-[var(--ctp-maroon)]/40 text-[var(--ctp-maroon)]' :
            isLocked && !isCapital ? 'bg-[var(--ctp-crust)] border-[var(--ctp-surface1)] text-[var(--ctp-subtext0)]' :
            'bg-[var(--ctp-blue)]/20 border-[var(--ctp-blue)]/40 text-[var(--ctp-blue)]'
          }`}>
            {isLocked && !isCapital ? (
              <span title="Fog of War" aria-label="Fog of War">🌫️</span>
            ) : (
              <>
                {isCapital && '🏰'}
                {isSanctuary && '🏛️'}
                {isQuiz && (selectedNode.monster?.icon || '👹')}
                {isReflection && '🔮'}
                {isWorkshop && '⚒️'}
                {isBoss && '🐲'}
              </>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-sm sm:text-base font-bold truncate ${isLocked && !isCapital ? 'font-mono text-[var(--ctp-mauve)]' : 'text-[var(--ctp-text)]'}`}>
                {displayTitle}
              </h3>
              <Badge variant={isCleared ? 'success' : isLocked ? 'secondary' : 'default'} className="text-[9px] sm:text-[10px] uppercase px-1.5 py-0">
                {isCleared ? '✓ Cleared' : isLocked ? '🔒 Locked' : '🔓 Unlocked'}
              </Badge>
            </div>
            <p className="text-[11px] sm:text-xs text-[var(--ctp-subtext0)] mt-0.5 line-clamp-1">
              {isLocked && !isCapital
                ? 'Shrouded under the Fog of War. Clear prerequisite cities to decrypt.'
                : selectedNode.description || 'Explore this territory to advance your architectural campaign.'}
            </p>
          </div>
        </div>

        {/* Dynamic Context Specs (Monster / Healing / Buff / Items) & Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 flex-wrap">
          {(!isLocked || isCapital) && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Monster Preview */}
              {selectedNode.monster && (
                <div className="bg-[var(--ctp-crust)] px-2.5 py-1 rounded-lg border border-[var(--ctp-red)]/30 flex items-center gap-1.5 text-xs">
                  <Swords size={13} className="text-[var(--ctp-red)]" />
                  <span className="text-[var(--ctp-red)] font-semibold">{selectedNode.monster.name}</span>
                  <span className="text-[var(--ctp-subtext0)] font-mono text-[11px]">({selectedNode.monster.currentHp ?? selectedNode.monster.maxHp} HP)</span>
                </div>
              )}

              {/* Sanctuary Healing */}
              {isSanctuary && (
                <div className="bg-[var(--ctp-crust)] px-2.5 py-1 rounded-lg border border-[var(--ctp-green)]/30 flex items-center gap-1.5 text-xs text-[var(--ctp-green)]">
                  <Sparkles size={13} />
                  <span>+{selectedNode.healingAmount ?? 40} HP Sanctuary Reading</span>
                </div>
              )}

              {/* Buff Preview */}
              {selectedNode.buff && (
                <div className="bg-[var(--ctp-crust)] px-2.5 py-1 rounded-lg border border-[var(--ctp-yellow)]/30 flex items-center gap-1.5 text-xs text-[var(--ctp-yellow)]">
                  <Sparkles size={13} />
                  <span>{selectedNode.buff.label}</span>
                </div>
              )}

              {/* Item Reward */}
              {selectedNode.rewards && selectedNode.rewards.length > 0 && (
                <div className="bg-[var(--ctp-crust)] px-2.5 py-1 rounded-lg border border-[var(--ctp-blue)]/30 flex items-center gap-1.5 text-xs text-[var(--ctp-blue)]">
                  <Key size={13} />
                  <span>Reward: {selectedNode.rewards[0].name}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Launch Button */}
          <Button
            disabled={
              isLocked ||
              (isBoss && !isBossUnlockable) ||
              (isCleared && (isQuiz || isReflection || isBoss))
            }
            className={`font-bold text-xs px-5 py-2.5 sm:py-2 w-full sm:w-auto flex items-center justify-center gap-2 transition-all ${
              isLocked || (isBoss && !isBossUnlockable) || (isCleared && (isQuiz || isReflection || isBoss))
                ? 'bg-[var(--ctp-surface1)] text-[var(--ctp-subtext0)] cursor-not-allowed border border-[var(--ctp-surface2)]'
                : isCleared
                ? 'bg-[var(--ctp-surface1)] hover:bg-[var(--ctp-surface2)] text-[var(--ctp-text)]'
                : 'bg-gradient-to-r from-[var(--primary)] to-[color-mix(in_srgb,var(--primary)_85%,black)] hover:brightness-110 text-[var(--primary-foreground)] border border-[color-mix(in_srgb,var(--primary)_40%,transparent)] shadow-[0_4px_16px_color-mix(in_srgb,var(--primary)_35%,transparent)]'
            }`}
            onClick={() => onLaunchEncounter(selectedNode)}
          >
            {isLocked ? (
              <>
                <Lock size={14} />
                <span>Prerequisites Locked</span>
              </>
            ) : isBoss && !isBossUnlockable ? (
              <>
                <Key size={14} />
                <span>Requires Boss Keys</span>
              </>
            ) : isCleared ? (
              <>
                <CheckCircle size={14} />
                <span>Review Encounter</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Enter Encounter</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
