import React from 'react'
import type { GlobalCharacterState } from '../../types'
import { Button, Badge, Modal } from '../../../../ui-system'

interface BadgesModalProps {
  open: boolean
  onClose: () => void
  globalChar: GlobalCharacterState
  derivedCampaignsStarted: number
}

export const BadgesModal: React.FC<BadgesModalProps> = ({
  open,
  onClose,
  globalChar,
  derivedCampaignsStarted,
}) => {
  return (
    <Modal open={open} onClose={onClose} maxWidth="md" title="Achievements & Badges">
      <div className="p-2 text-[#c6d0f5] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-[#b5bfe2]">🏆 Unlocked Topic Achievements</h3>
          <Badge variant="secondary" className="text-xs">
            {globalChar.unlockedBadges.length} Total Badges
          </Badge>
        </div>

        {/* Campaign Career Overview */}
        <div className="grid grid-cols-3 gap-2.5 bg-[#232634] p-3 rounded-xl border border-[#414559]">
          <div className="text-center p-1.5">
            <span className="text-[10px] text-[#a5adce] block uppercase font-bold">Campaigns Started</span>
            <span className="text-base font-bold font-mono text-[#8caaee]">{derivedCampaignsStarted}</span>
          </div>
          <div className="text-center p-1.5 border-x border-[#414559]">
            <span className="text-[10px] text-[#a5adce] block uppercase font-bold">Victories (Cleared)</span>
            <span className="text-base font-bold font-mono text-[#a6d189]">{globalChar.totalCampaignsSucceeded ?? 0}</span>
          </div>
          <div className="text-center p-1.5">
            <span className="text-[10px] text-[#a5adce] block uppercase font-bold">Win Rate</span>
            <span className="text-base font-bold font-mono text-[#e5c890]">
              {derivedCampaignsStarted > 0
                ? `${Math.round(((globalChar.totalCampaignsSucceeded ?? 0) / derivedCampaignsStarted) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {globalChar.unlockedBadges.length === 0 ? (
            <div className="p-8 text-center bg-[#232634] rounded-2xl border border-[#414559] space-y-2">
              <span className="text-3xl block">🛡️</span>
              <p className="text-sm text-[#b5bfe2] font-semibold">No badges unlocked yet</p>
              <p className="text-xs text-[#737994]">
                Clear topic encounters, conquer bosses, achieve 0-damage flawless victories, or complete Master/Nightmare difficulty tiers!
              </p>
            </div>
          ) : (
            globalChar.unlockedBadges.map((badge) => (
              <div key={badge.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-[#232634] border border-[#8caaee]/30 hover:border-[#8caaee]/60 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[#1e1e2e] border border-[#414559] flex items-center justify-center text-2xl shrink-0">
                  {badge.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-[#8caaee]">{badge.title}</h4>
                    {badge.topicTitle && (
                      <Badge variant="default" className="text-[9px] bg-[#8caaee]/20 text-[#8caaee] border-[#8caaee]/40">
                        {badge.topicTitle}
                      </Badge>
                    )}
                    {badge.difficulty && (
                      <Badge
                        variant="secondary"
                        className={`text-[9px] uppercase ${
                          badge.difficulty === 'nightmare'
                            ? 'bg-[#ea999c]/20 text-[#ea999c] border-[#ea999c]/40'
                            : badge.difficulty === 'hard'
                            ? 'bg-[#ef9f76]/20 text-[#ef9f76] border-[#ef9f76]/40'
                            : 'bg-[#a6d189]/20 text-[#a6d189] border-[#a6d189]/40'
                        }`}
                      >
                        {badge.difficulty}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#a5adce] mt-0.5">{badge.description}</p>
                  <span className="text-[10px] text-[#737994] font-mono block mt-1">Earned: {badge.unlockedAt}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-[#414559]">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
