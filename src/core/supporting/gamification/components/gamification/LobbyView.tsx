import React from 'react'
import { Map as MapIcon } from 'lucide-react'
import type { DifficultyLevel } from '../../game-config'
import { Badge } from '../../../../ui-system'
import { CharacterHeroBanner } from './CharacterHeroBanner'
import { TopicCampaignCard } from './TopicCampaignCard'
import { BadgesModal } from './BadgesModal'
import { SnackbarToasts } from './SnackbarToasts'
import type { GamificationGame } from './useGamificationCampaign'

interface LobbyViewProps {
  game: GamificationGame
}

export const LobbyView: React.FC<LobbyViewProps> = ({ game }) => {
  const {
    globalChar,
    hexmapTopics,
    currentTopicId,
    topicState,
    topicDifficulties,
    setTopicDifficulties,
    portSetDifficulty,
    portResetCampaign,
    handleSelectTopic,
    handleAllocateStat,
    activeBadgesModal,
    setActiveBadgesModal,
    snackbars,
    setSnackbars,
    derivedCampaignsStarted,
  } = game

  // Guaranteed non-null by the time the orchestrator renders this view
  if (!globalChar) return null

  const handleSelectDifficulty = (topicId: string, diff: DifficultyLevel) => {
    setTopicDifficulties((prev) => ({
      ...prev,
      [topicId]: diff,
    }))
    if (topicId === currentTopicId) {
      portSetDifficulty(diff)
    } else {
      try {
        const key = `loom_gamification_campaign_${topicId}`
        const raw = localStorage.getItem(key)
        const data = raw ? JSON.parse(raw) : {}
        localStorage.setItem(key, JSON.stringify({ ...data, difficulty: diff }))
      } catch {
        // ignore
      }
    }
  }

  const handleResetCampaign = async (topicId: string) => {
    try {
      const key = `loom_gamification_campaign_${topicId}`
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
    if (topicId === currentTopicId) {
      await portResetCampaign(topicId, false)
    }
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-[var(--ctp-base)] text-[var(--ctp-text)] p-6 lg:p-10 flex flex-col gap-8 font-sans max-w-7xl mx-auto">
      {/* ─── Global Character Profile Hero Banner ─── */}
      <CharacterHeroBanner
        globalChar={globalChar}
        derivedStats={game.derivedStats}
        derivedCampaignsStarted={derivedCampaignsStarted}
        onAllocateStat={handleAllocateStat}
        onOpenBadges={() => setActiveBadgesModal(true)}
      />

      {/* ─── Campaign Topics Selection Grid ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--ctp-text)] flex items-center gap-2">
              <MapIcon className="text-[var(--ctp-blue)]" size={22} />
              Available Campaign Realms (Hex Maps)
            </h2>
            <p className="text-xs text-[var(--ctp-subtext0)] mt-0.5">
              Select a topic realm to launch into its strategic hex campaign or resume where you left off.
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {hexmapTopics.length} Realms Available
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {hexmapTopics.map((topic) => (
            <TopicCampaignCard
              key={topic.id}
              topic={topic}
              globalChar={globalChar}
              isCurrent={topic.id === currentTopicId}
              campaign={topicState}
              topicDifficulty={topicDifficulties[topic.id] || (topic.id === currentTopicId && topicState ? topicState.difficulty : 'normal')}
              onSelectTopic={handleSelectTopic}
              onSelectDifficulty={handleSelectDifficulty}
              onResetCampaign={handleResetCampaign}
            />
          ))}
        </div>
      </section>

      {/* ─── Badges Modal ─── */}
      <BadgesModal
        open={activeBadgesModal}
        onClose={() => setActiveBadgesModal(false)}
        globalChar={globalChar}
        derivedCampaignsStarted={derivedCampaignsStarted}
      />

      {/* ─── Animated Semantic Stacked Snackbar Toasts (Lobby) ─── */}
      <SnackbarToasts
        snackbars={snackbars}
        onDismiss={(id) => setSnackbars((prev) => prev.filter((s) => s.id !== id))}
      />
    </div>
  )
}
