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
      <div className="p-2 text-[var(--ctp-text)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-[var(--ctp-text)]">🏆 Unlocked Topic Achievements</h3>
          <Badge variant="secondary" className="text-xs">
            {globalChar.unlockedBadges.length} Total Badges
          </Badge>
        </div>

        {/* Campaign Career Overview */}
        <div className="grid grid-cols-3 gap-2.5 bg-[var(--ctp-surface0)] p-3 rounded-xl border border-[var(--ctp-surface1)]">
          <div className="text-center p-1.5">
            <span className="text-[10px] text-[var(--ctp-subtext0)] block uppercase font-bold">Campaigns Started</span>
            <span className="text-base font-bold font-mono text-[var(--ctp-blue)]">{derivedCampaignsStarted}</span>
          </div>
          <div className="text-center p-1.5 border-x border-[var(--ctp-surface1)]">
            <span className="text-[10px] text-[var(--ctp-subtext0)] block uppercase font-bold">Victories (Cleared)</span>
            <span className="text-base font-bold font-mono text-[var(--ctp-green)]">{globalChar.totalCampaignsSucceeded ?? 0}</span>
          </div>
          <div className="text-center p-1.5">
            <span className="text-[10px] text-[var(--ctp-subtext0)] block uppercase font-bold">Win Rate</span>
            <span className="text-base font-bold font-mono text-[var(--ctp-yellow)]">
              {derivedCampaignsStarted > 0
                ? `${Math.round(((globalChar.totalCampaignsSucceeded ?? 0) / derivedCampaignsStarted) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {globalChar.unlockedBadges.length === 0 ? (
            <div className="p-8 text-center bg-[var(--ctp-surface0)] rounded-2xl border border-[var(--ctp-surface1)] space-y-2">
              <span className="text-3xl block">🛡️</span>
              <p className="text-sm text-[var(--ctp-text)] font-semibold">No badges unlocked yet</p>
              <p className="text-xs text-[var(--ctp-subtext0)]">
                Clear topic encounters, conquer bosses, achieve 0-damage flawless victories, or complete Master/Nightmare difficulty tiers!
              </p>
            </div>
          ) : (
            Array.from(new Map(globalChar.unlockedBadges.map((b) => [b.id, b])).values()).map((badge) => (
              <div key={badge.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--ctp-surface0)] border border-[var(--ctp-blue)]/30 hover:border-[var(--ctp-blue)]/60 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[var(--ctp-crust)] border border-[var(--ctp-surface1)] flex items-center justify-center text-2xl shrink-0">
                  {badge.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-[var(--ctp-blue)]">{badge.title}</h4>
                    {badge.topicTitle && (
                      <Badge variant="default" className="text-[9px] bg-[var(--ctp-blue)]/20 text-[var(--ctp-blue)] border-[var(--ctp-blue)]/40">
                        {badge.topicTitle}
                      </Badge>
                    )}
                    {badge.difficulty && (
                      <Badge
                        variant="secondary"
                        className={`text-[9px] uppercase ${
                          badge.difficulty === 'nightmare'
                            ? 'bg-[var(--ctp-red)]/20 text-[var(--ctp-red)] border-[var(--ctp-red)]/40'
                            : badge.difficulty === 'hard'
                            ? 'bg-[var(--ctp-peach)]/20 text-[var(--ctp-peach)] border-[var(--ctp-peach)]/40'
                            : 'bg-[var(--ctp-green)]/20 text-[var(--ctp-green)] border-[var(--ctp-green)]/40'
                        }`}
                      >
                        {badge.difficulty}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[var(--ctp-subtext0)] mt-0.5">{badge.description}</p>
                  <span className="text-[10px] text-[var(--ctp-subtext0)] font-mono block mt-1">Earned: {badge.unlockedAt}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-[var(--ctp-surface1)]">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
