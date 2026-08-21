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
      <div className="p-4 text-center text-[var(--ctp-text)] space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-[var(--ctp-red)]/20 border border-[var(--ctp-red)]/50 flex items-center justify-center text-4xl mx-auto shadow-xl">
          ☠️
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-extrabold text-[var(--ctp-red)]">Campaign Fallen!</h3>
          <p className="text-xs text-[var(--ctp-subtext0)] leading-relaxed">
            Your character HP reached 0. The monsters have overrun your expedition. Your campaign has retreated to the Realm Capital.
          </p>
        </div>

        <div className="bg-[var(--ctp-surface0)] p-3 rounded-xl border border-[var(--ctp-surface1)] text-xs text-[var(--ctp-subtext0)] space-y-1">
          <div className="flex justify-between">
            <span>Topic Realm:</span>
            <span className="font-bold text-[var(--ctp-text)]">{campaign.topicTitle}</span>
          </div>
          <div className="flex justify-between">
            <span>Difficulty Setting:</span>
            <span className="font-bold text-[var(--ctp-peach)]">{DIFFICULTY_CONFIGS[campaign.difficulty || 'normal']?.label}</span>
          </div>
          <div className="flex justify-between">
            <span>Global Champion Level:</span>
            <span className="font-bold text-[var(--ctp-blue)]">Level {globalChar.level} (Preserved)</span>
          </div>
        </div>

        <div className="pt-2">
          <Button
            className="w-full bg-gradient-to-r from-[var(--destructive)] to-[color-mix(in_srgb,var(--destructive)_85%,black)] hover:brightness-110 text-[var(--destructive-foreground)] border border-[color-mix(in_srgb,var(--destructive)_40%,transparent)] shadow-[0_4px_16px_color-mix(in_srgb,var(--destructive)_35%,transparent)] font-bold text-sm py-2.5 flex items-center justify-center gap-2 transition-all"
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
