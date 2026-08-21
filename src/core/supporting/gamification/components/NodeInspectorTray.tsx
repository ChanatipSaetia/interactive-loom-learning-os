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
    <div className="bg-[#232634]/95 backdrop-blur-xl border border-[#414559] rounded-2xl p-4 shadow-2xl transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Node Identity & Type */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border ${
            isCleared ? 'bg-[#a6d189]/20 border-[#a6d189]/40 text-[#a6d189]' :
            isBoss ? 'bg-[#ea999c]/20 border-[#ea999c]/40 text-[#ea999c]' :
            isLocked ? 'bg-[#303446] border-[#414559] text-[#737994]' :
            'bg-[#8caaee]/20 border-[#8caaee]/40 text-[#8caaee]'
          }`}>
            {isCapital && '🏰'}
            {isSanctuary && '🏛️'}
            {isQuiz && (selectedNode.monster?.icon || '👹')}
            {isReflection && '🔮'}
            {isWorkshop && '⚒️'}
            {isBoss && '🐲'}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-base font-bold truncate ${isLocked && !isCapital ? 'font-mono text-[#ca9ee6]' : 'text-[#b5bfe2]'}`}>
                {displayTitle}
              </h3>
              <Badge variant={isCleared ? 'success' : isLocked ? 'secondary' : 'default'} className="text-[10px] uppercase">
                {isCleared ? '✓ Cleared' : isLocked ? '🔒 Locked' : '🔓 Unlocked'}
              </Badge>
            </div>
            <p className="text-xs text-[#a5adce] mt-0.5 line-clamp-1">
              {isLocked && !isCapital
                ? 'Shrouded under the Fog of War. Clear prerequisite cities to decrypt.'
                : selectedNode.description || 'Explore this territory to advance your architectural campaign.'}
            </p>
          </div>
        </div>

        {/* Dynamic Context Specs (Monster / Healing / Buff / Items) */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Monster Preview */}
          {selectedNode.monster && (
            <div className="bg-[#1e1e2e] px-3 py-1.5 rounded-lg border border-[#e78284]/30 flex items-center gap-2 text-xs">
              <Swords size={14} className="text-[#e78284]" />
              <span className="text-[#e78284] font-semibold">{selectedNode.monster.name}</span>
              <span className="text-[#a5adce] font-mono">({selectedNode.monster.currentHp ?? selectedNode.monster.maxHp} HP)</span>
            </div>
          )}

          {/* Sanctuary Healing */}
          {isSanctuary && (
            <div className="bg-[#1e1e2e] px-3 py-1.5 rounded-lg border border-[#a6d189]/30 flex items-center gap-2 text-xs text-[#a6d189]">
              <Sparkles size={14} />
              <span>+{selectedNode.healingAmount ?? 40} HP Sanctuary Reading</span>
            </div>
          )}

          {/* Buff Preview */}
          {selectedNode.buff && (
            <div className="bg-[#1e1e2e] px-3 py-1.5 rounded-lg border border-[#e5c890]/30 flex items-center gap-2 text-xs text-[#e5c890]">
              <Sparkles size={14} />
              <span>{selectedNode.buff.label}</span>
            </div>
          )}

          {/* Item Reward */}
          {selectedNode.rewards && selectedNode.rewards.length > 0 && (
            <div className="bg-[#1e1e2e] px-3 py-1.5 rounded-lg border border-[#8caaee]/30 flex items-center gap-2 text-xs text-[#8caaee]">
              <Key size={14} />
              <span>Reward: {selectedNode.rewards[0].name}</span>
            </div>
          )}

          {/* Action Launch Button */}
          <Button
            disabled={
              isLocked ||
              (isBoss && !isBossUnlockable) ||
              (isCleared && (isQuiz || isReflection || isBoss))
            }
            className={`font-bold text-xs px-5 py-2 flex items-center gap-2 ${
              isLocked || (isBoss && !isBossUnlockable) || (isCleared && (isQuiz || isReflection || isBoss))
                ? 'bg-[#414559] text-[#737994] cursor-not-allowed border border-[#51576d]'
                : isCleared
                ? 'bg-[#414559] hover:bg-[#51576d] text-[#c6d0f5]'
                : 'bg-gradient-to-r from-[#8caaee] to-[#a6d189] hover:opacity-90 text-[#232634] shadow-lg'
            }`}
            onClick={() => onLaunchEncounter(selectedNode)}
          >
            {isLocked ? (
              <>
                <Lock size={14} />
                <span>Prerequisites Locked</span>
              </>
            ) : isCleared ? (
              <>
                <CheckCircle size={14} />
                <span>{isQuiz || isReflection || isBoss ? 'Encounter Cleared' : 'Revisit Section'}</span>
              </>
            ) : (
              <>
                <Play size={14} fill="currentColor" />
                <span>Enter Encounter</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
