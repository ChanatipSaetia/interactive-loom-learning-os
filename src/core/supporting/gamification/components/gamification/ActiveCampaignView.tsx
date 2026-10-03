import React, { useRef } from 'react'
import { HexGridCanvas, HexGridCanvasRef } from '../HexGridCanvas'
import { CampaignTopHeader } from './CampaignTopHeader'
import { CampaignHudBar } from './CampaignHudBar'
import { EncounterViewport } from './EncounterViewport'
import { BadgesModal } from './BadgesModal'

import { VictoryModal } from './VictoryModal'
import { DefeatModal } from './DefeatModal'
import { SnackbarToasts } from './SnackbarToasts'
import type { GamificationGame } from './useGamificationCampaign'

interface ActiveCampaignViewProps {
  game: GamificationGame
}

export const ActiveCampaignView: React.FC<ActiveCampaignViewProps> = ({ game }) => {
  const hexCanvasRef = useRef<HexGridCanvasRef>(null)

  const {
    globalChar,
    topicState: campaign,
    currentTopicId,
    nodes,
    selectedNode,
    setSelectedNode,
    combatLog,
    handleReturnToLobby,
    handleAllocateStat,
    handleLaunchSection,
    handlePassSection,
    activeBadgesModal,
    setActiveBadgesModal,
    snackbars,
    setSnackbars,
    gameOverModalOpen,
    handleDefeatRestart,
    topicVictoryModalOpen,
    setTopicVictoryModalOpen,
    earnedVictoryBadges,
    derivedCampaignsStarted,
    hasBossItems,
    bossNode,
    pushActionMessage,
    portResetCampaign,
  } = game

  // Guaranteed non-null by the time the orchestrator renders this view
  if (!globalChar || !campaign) return null

  const handleLaunchWithWalk = (targetNode: typeof selectedNode) => {
    if (!targetNode) return
    if (targetNode.type === 'boss_lair') {
      pushActionMessage('Unleashing Key Artifacts! The Celestial Beam strikes the Boss Dragon!', 'success', '✨')
      if (hexCanvasRef.current) {
        hexCanvasRef.current.triggerBossKeyAttack(targetNode, campaign.inventory, () => {
          handlePassSection(targetNode)
        })
      } else {
        handlePassSection(targetNode)
      }
      return
    }

    if (hexCanvasRef.current) {
      hexCanvasRef.current.triggerWalkTransition(targetNode, () => {
        handleLaunchSection(targetNode)
      })
    } else {
      handleLaunchSection(targetNode)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--ctp-base)] text-[var(--ctp-text)] p-6 flex flex-col gap-6 font-sans">
      {/* ─── Top Global Character Profile Header ─── */}
      <CampaignTopHeader
        globalChar={globalChar}
        derivedStats={game.derivedStats}
        combatLog={combatLog}
        onReturnToLobby={handleReturnToLobby}
        onAllocateStat={handleAllocateStat}
        onReset={async () => {
          await portResetCampaign(undefined, true)
          pushActionMessage('Campaign Reset! Started a new play attempt with full HP & pulses.', 'info', '🔄')
        }}
        onOpenBadges={() => setActiveBadgesModal(true)}
      />

      {/* ─── Topic Campaign HUD Bar (Responsive layout) ─── */}
      <CampaignHudBar
        campaign={campaign}
        globalChar={globalChar}
        currentTopicId={currentTopicId}
        hasBossItems={hasBossItems}
        bossNode={bossNode}
        nodes={nodes}
      />

      {/* ─── Main Map Canvas with Floating Tooltip Actions ─── */}
      <div className="flex flex-col gap-4">
        <HexGridCanvas
          ref={hexCanvasRef}
          nodes={nodes}
          selectedNodeId={selectedNode?.id || null}
          onSelectNode={setSelectedNode}
          chaosLevel={campaign.chaosLevel}
          inventory={campaign.inventory}
          onLaunchEncounter={handleLaunchWithWalk}
        />
      </div>


      {/* ─── REAL ENCOUNTER DRAWER VIEWPORT (BOTTOM DOCKED) ─── */}
      <EncounterViewport game={game} />

      {/* ─── Badges Modal ─── */}
      <BadgesModal
        open={activeBadgesModal}
        onClose={() => setActiveBadgesModal(false)}
        globalChar={globalChar}
        derivedCampaignsStarted={derivedCampaignsStarted}
      />

      {/* ─── Topic Campaign Victory Celebration Modal ─── */}
      <VictoryModal
        open={topicVictoryModalOpen}
        onClose={() => setTopicVictoryModalOpen(false)}
        campaign={campaign}
        globalChar={globalChar}
        nodes={nodes}
        earnedVictoryBadges={earnedVictoryBadges}
        currentTopicId={currentTopicId}
        onReturnToLobby={handleReturnToLobby}
      />

      {/* ─── Animated Semantic Stacked Snackbar Toasts (Active Campaign) ─── */}
      <SnackbarToasts
        snackbars={snackbars}
        onDismiss={(id) => setSnackbars((prev) => prev.filter((s) => s.id !== id))}
      />

      {/* ─── Zero HP Campaign Defeat Modal ─── */}
      <DefeatModal
        open={gameOverModalOpen}
        campaign={campaign}
        globalChar={globalChar}
        onRestart={handleDefeatRestart}
      />
    </div>
  )
}
