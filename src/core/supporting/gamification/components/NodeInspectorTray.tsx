import React from 'react'
import { HexNodeData, ItemReward } from '../types'
import { encryptToMagicRunes, canUnlockBoss, isSanctuaryType } from '../game-rules'
import { getSectionTypeInfo } from './HexGridCanvas'
import { Button, Badge } from '../../../ui-system'

import { Swords, Sparkles, Key, CheckCircle, Lock, Play, Flame } from 'lucide-react'

interface NodeInspectorTrayProps {
  selectedNode: HexNodeData | null
  nodes?: HexNodeData[]
  inventory: ItemReward[]
  onLaunchEncounter: (node: HexNodeData) => void
}

export const NodeInspectorTray: React.FC<NodeInspectorTrayProps> = ({
  selectedNode,
  nodes,
  inventory,
  onLaunchEncounter,
}) => {
  if (!selectedNode) return null

  const isCapital = selectedNode.type === 'capital'
  const isSanctuary = isSanctuaryType(selectedNode.type)
  const isQuiz = selectedNode.type === 'quiz_encounter'
  const isReflection = selectedNode.type === 'reflection_decryption'
  const isBoss = selectedNode.type === 'boss_lair'

  const isLocked = selectedNode.status === 'locked'
  const isCleared = selectedNode.status === 'cleared'
  const isBossUnlockable = isBoss ? canUnlockBoss(inventory, selectedNode) : true

  // Mask title in magic runes if locked (except capital)
  const displayTitle = isLocked && !isCapital
    ? encryptToMagicRunes(selectedNode.title)
    : selectedNode.title

  const getNodeIcon = () => {
    switch (selectedNode.type) {
      case 'capital': return '🏰'
      case 'reading_sanctuary': return '🏛️'
      case 'archive_spire': return '📜'
      case 'simulation_nexus': return '⚙️'
      case 'concept_monolith': return '💎'
      case 'observatory_gallery': return '🔭'
      case 'quiz_encounter': return selectedNode.monster?.icon || '👹'
      case 'reflection_decryption': return '🔮'
      case 'tradeoff_workshop': return '⚒️'
      case 'boss_lair': return '🐲'
      default: return '✨'
    }
  }

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
              <span>{getNodeIcon()}</span>
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
              {(!isLocked || isCapital) && (() => {
                const secInfo = getSectionTypeInfo(selectedNode)
                return (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 ${secInfo.color}`}>
                    <span>{secInfo.icon}</span>
                    <span>{secInfo.label}</span>
                  </span>
                )
              })()}
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
              {/* Reflection Volatile Arcane Bomb Hazard Preview */}
              {isReflection && !isCleared && (
                <div className="bg-[var(--ctp-crust)] px-2.5 py-1 rounded-lg border border-[var(--ctp-red)]/50 flex items-center gap-1.5 text-xs text-[var(--ctp-red)] shadow-[0_0_12px_rgba(231,130,132,0.2)]">
                  <Flame size={13} className="text-[var(--ctp-red)] animate-pulse" />
                  <span className="font-bold text-[var(--ctp-red)]">Volatile Arcane Bomb</span>
                  <span className="text-[var(--ctp-subtext0)] font-mono text-[11px]">(-15~40 HP on Fail/Timeout)</span>
                </div>
              )}

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
                  <span>+{selectedNode.healingAmount ?? 40} HP {
                    selectedNode.type === 'reading_sanctuary' ? 'Sanctuary Reading' :
                    selectedNode.type === 'archive_spire' ? 'Archive Study' :
                    selectedNode.type === 'simulation_nexus' ? 'Simulation Calibration' :
                    selectedNode.type === 'concept_monolith' ? 'Monolith Attunement' :
                    selectedNode.type === 'observatory_gallery' ? 'Observatory Focus' : 'Reading'
                  }</span>
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
                <span>Requires 2 Boss Keys</span>
              </>
            ) : isBoss && !isCleared ? (
              <>
                <Sparkles size={14} />
                <span>Unleash Key Artifacts</span>
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

      {/* Citadel Archives: Key Item Intelligence (Shown after Citadel is Cleared) */}
      {isCapital && isCleared && (() => {
        const boss = nodes?.find((n) => n.type === 'boss_lair')
        const allRewards = nodes?.flatMap((n) => (n.rewards || []).map((r) => ({ ...r, nodeTitle: n.title, nodeType: n.type }))) || []
        const requiredList = (boss?.requiredItems || []).map((reqId) => {
          const reward = allRewards.find((r) => r.id === reqId)
          const isCollected = inventory.some((item) => item.id === reqId)
          return {
            id: reqId,
            name: reward?.name || reqId,
            icon: reward?.icon || '🗝️',
            guardian: reward?.nodeTitle || 'Encounter',
            isCollected,
          }
        })

        if (requiredList.length === 0) return null

        const collectedCount = requiredList.filter((r) => r.isCollected).length

        return (
          <div className="mt-3.5 pt-3 border-t border-[var(--ctp-surface1)]/60 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--ctp-mauve)] flex items-center gap-1.5">
                <span>📜</span> Citadel Intelligence: Boss Key Item Quests
              </span>
              <Badge variant={collectedCount === requiredList.length ? 'success' : 'secondary'} className="text-[10px] font-mono">
                {collectedCount}/{requiredList.length} Collected
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {requiredList.map((req) => (
                <div
                  key={req.id}
                  className={`p-2 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                    req.isCollected
                      ? 'bg-[var(--ctp-blue)]/10 border-[var(--ctp-blue)]/40 text-[var(--ctp-text)]'
                      : 'bg-[var(--ctp-crust)]/60 border-[var(--ctp-surface1)] text-[var(--ctp-subtext0)]'
                  }`}
                >
                  <span className="text-base shrink-0">{req.isCollected ? req.icon : '🔒'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate text-[11px] flex items-center gap-1">
                      <span>{req.name}</span>
                      {req.isCollected && <span className="text-[var(--ctp-green)] text-[10px]">✓</span>}
                    </div>
                    <div className="text-[10px] text-[var(--ctp-subtext0)] truncate">
                      {req.isCollected ? 'Secured in inventory' : `Guarded at ${req.guardian}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Boss Lair Key Items Seal Checklist */}
      {isBoss && (() => {
        const allRewards = nodes?.flatMap((n) => n.rewards || []) || []
        const requiredList = (selectedNode.requiredItems || []).map((reqId) => {
          const reward = allRewards.find((r) => r.id === reqId) || inventory.find((r) => r.id === reqId)
          const isCollected = inventory.some((item) => item.id === reqId)
          return {
            id: reqId,
            name: reward?.name || reqId,
            icon: reward?.icon || '🗝️',
            isCollected,
          }
        })

        if (requiredList.length === 0) return null

        return (
          <div className="mt-3.5 pt-3 border-t border-[var(--ctp-surface1)]/60 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--ctp-maroon)] flex items-center gap-1.5">
                <span>🗝️</span> Dragon Lair Prerequisite Seals
              </span>
              <span className="font-mono text-[11px] text-[var(--ctp-subtext0)]">
                {inventory.filter((inv) => selectedNode.requiredItems?.includes(inv.id)).length}/{requiredList.length} Keys Held
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {requiredList.map((req) => (
                <Badge
                  key={req.id}
                  variant="secondary"
                  className={`text-[10px] px-2 py-0.5 flex items-center gap-1 border ${
                    req.isCollected
                      ? 'bg-[var(--ctp-green)]/20 text-[var(--ctp-green)] border-[var(--ctp-green)]/40'
                      : 'bg-[var(--ctp-crust)] text-[var(--ctp-red)] border-[var(--ctp-red)]/30 opacity-75'
                  }`}
                >
                  <span>{req.isCollected ? '✓' : '🔒'}</span>
                  <span>{req.name}</span>
                </Badge>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
