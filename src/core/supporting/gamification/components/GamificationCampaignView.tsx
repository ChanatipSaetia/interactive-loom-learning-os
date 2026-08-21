import React from 'react'
import { useGamificationCampaign } from './gamification/useGamificationCampaign'
import { LobbyView } from './gamification/LobbyView'
import { ActiveCampaignView } from './gamification/ActiveCampaignView'

export const GamificationCampaignView: React.FC = () => {
  const game = useGamificationCampaign()
  const { isLoading, error, selectedTopicId, topicState: campaign, globalChar } = game

  if (isLoading || !globalChar || (selectedTopicId && !campaign)) {
    return (
      <div className="min-h-screen bg-[#1e1e2e] text-[#c6d0f5] flex items-center justify-center font-mono">
        <div className="text-center space-y-3">
          <span className="text-4xl animate-spin block">🌀</span>
          <p className="text-sm text-[#8caaee]">Loading Realm Map from Validation Gateway...</p>
          {error && <p className="text-xs text-[#e78284]">{error}</p>}
        </div>
      </div>
    )
  }

  // ─── LOBBY VIEW: If no campaign is active, render Global Status & Topic Campaign List ───
  if (!selectedTopicId || !campaign) {
    return <LobbyView game={game} />
  }

  // ─── ACTIVE CAMPAIGN VIEW: Map Canvas, HUD, and Section Viewport ───
  return <ActiveCampaignView game={game} />
}
