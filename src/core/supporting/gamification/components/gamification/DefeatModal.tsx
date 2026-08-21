import React from 'react'
import { RotateCcw } from 'lucide-react'
import type { GlobalCharacterState, TopicCampaignState } from '../../types'
import { DIFFICULTY_CONFIGS } from '../../types'
import { Button, Modal } from '../../../../ui-system'

interface DefeatModalProps {
  open: boolean
  campaign: TopicCampaignState
  globalChar: GlobalCharacterState
  onRestart: () => void
}

export const DefeatModal: React.FC<DefeatModalProps> = ({ open, campaign, globalChar, onRestart }) => {
  return (
    <Modal open={open} onClose={() => {}} maxWidth="sm" title="Campaign Defeat">
      <div className="p-4 text-center text-[#c6d0f5] space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-[#e78284]/20 border border-[#e78284]/50 flex items-center justify-center text-4xl mx-auto shadow-xl">
          ☠️
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-extrabold text-[#e78284]">Campaign Fallen!</h3>
          <p className="text-xs text-[#a5adce] leading-relaxed">
            Your character HP reached 0. The monsters have overrun your expedition. Your campaign has retreated to the Realm Capital.
          </p>
        </div>

        <div className="bg-[#232634] p-3 rounded-xl border border-[#414559] text-xs text-[#a5adce] space-y-1">
          <div className="flex justify-between">
            <span>Topic Realm:</span>
            <span className="font-bold text-[#b5bfe2]">{campaign.topicTitle}</span>
          </div>
          <div className="flex justify-between">
            <span>Difficulty Setting:</span>
            <span className="font-bold text-[#ef9f76]">{DIFFICULTY_CONFIGS[campaign.difficulty || 'normal']?.label}</span>
          </div>
          <div className="flex justify-between">
            <span>Global Champion Level:</span>
            <span className="font-bold text-[#8caaee]">Level {globalChar.level} (Preserved)</span>
          </div>
        </div>

        <div className="pt-2">
          <Button
            className="w-full bg-gradient-to-r from-[#e78284] to-[#ef9f76] hover:opacity-90 text-[#232634] font-bold text-sm py-2.5 shadow-xl flex items-center justify-center gap-2"
            onClick={onRestart}
          >
            <RotateCcw size={16} />
            <span>Restart Topic Campaign</span>
          </Button>
        </div>
      </div>
    </Modal>
  )
}
