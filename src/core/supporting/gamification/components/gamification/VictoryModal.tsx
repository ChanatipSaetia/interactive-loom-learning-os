import React from 'react'
import { ArrowLeft } from 'lucide-react'
import type { GlobalCharacterState, TopicCampaignState, UnlockedBadge, HexNodeData } from '../../types'
import { Button, Badge, Modal } from '../../../../ui-system'

interface VictoryModalProps {
  open: boolean
  onClose: () => void
  campaign: TopicCampaignState
  globalChar: GlobalCharacterState
  nodes: HexNodeData[]
  earnedVictoryBadges: UnlockedBadge[]
  currentTopicId: string | null
  onReturnToLobby: () => void
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  open,
  onClose,
  campaign,
  globalChar,
  nodes,
  earnedVictoryBadges,
  currentTopicId,
  onReturnToLobby,
}) => {
  return (
    <Modal open={open} onClose={onClose} maxWidth="md" title="Topic Campaign Cleared!">
      <div className="p-4 text-center text-[#c6d0f5] space-y-5">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#a6d189] via-[#8caaee] to-[#ca9ee6] flex items-center justify-center text-5xl mx-auto shadow-2xl border border-[#a6d189]/50 animate-bounce">
          🏆
        </div>

        <div className="space-y-1.5">
          <Badge variant="success" className="text-xs uppercase font-extrabold px-3 py-1">
            Realm Liberated!
          </Badge>
          <h3 className="text-2xl font-black text-[#b5bfe2] tracking-tight">
            {campaign.topicTitle} Conquered!
          </h3>
          <p className="text-xs sm:text-sm text-[#a5adce] max-w-md mx-auto leading-relaxed">
            You defeated the Architecture Boss and restored balance to this learning realm!
          </p>
        </div>

        {/* Victory Summary Stats */}
        <div className="bg-[#232634] p-4 rounded-2xl border border-[#414559] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-2 rounded-xl bg-[#1e1e2e]/60 border border-[#414559]/50">
            <span className="text-[10px] text-[#a5adce] font-semibold block">Difficulty</span>
            <span className="text-xs sm:text-sm font-bold text-[#ef9f76] uppercase">
              {campaign.difficulty || 'normal'}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-[#1e1e2e]/60 border border-[#414559]/50">
            <span className="text-[10px] text-[#a5adce] font-semibold block">Damage Taken</span>
            <span className={`text-xs sm:text-sm font-bold ${(campaign.damageTakenInCampaign || 0) === 0 ? 'text-[#a6d189]' : 'text-[#ea999c]'}`}>
              {(campaign.damageTakenInCampaign || 0) === 0 ? '0 (Flawless!)' : `${campaign.damageTakenInCampaign || 0} HP`}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-[#1e1e2e]/60 border border-[#414559]/50">
            <span className="text-[10px] text-[#a5adce] font-semibold block">Nodes Cleared</span>
            <span className="text-xs sm:text-sm font-bold text-[#8caaee]">
              {campaign.clearedNodeIds.length} / {nodes.length}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-[#1e1e2e]/60 border border-[#414559]/50">
            <span className="text-[10px] text-[#a5adce] font-semibold block">Champion Level</span>
            <span className="text-xs sm:text-sm font-bold text-[#ca9ee6]">
              Lvl {globalChar.level}
            </span>
          </div>
        </div>

        {/* Newly Awarded Topic Badges */}
        <div className="space-y-2.5 text-left">
          <h4 className="text-xs font-bold text-[#8caaee] uppercase tracking-wider pl-1">
            🏆 Badges & Achievements Earned:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {(earnedVictoryBadges.length > 0
              ? earnedVictoryBadges
              : globalChar.unlockedBadges.filter((b) => b.topicId === currentTopicId || b.topicTitle === campaign.topicTitle)
            ).map((badge) => (
              <div key={badge.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#232634] border border-[#a6d189]/40">
                <span className="text-2xl shrink-0">{badge.icon}</span>
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-[#a6d189] truncate">{badge.title}</h5>
                  <p className="text-[10px] text-[#a5adce] line-clamp-1">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            className="w-full sm:w-1/2 bg-gradient-to-r from-[#8caaee] to-[#a6d189] hover:opacity-90 text-[#232634] font-bold text-sm py-2.5 shadow-xl flex items-center justify-center gap-2"
            onClick={() => {
              onClose()
              onReturnToLobby()
            }}
          >
            <ArrowLeft size={16} />
            <span>Return to Realm Lobby</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full sm:w-1/2 border border-[#414559] hover:bg-[#414559]/50 text-xs py-2.5"
            onClick={onClose}
          >
            <span>Explore Realm Map</span>
          </Button>
        </div>
      </div>
    </Modal>
  )
}
