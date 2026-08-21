import React, { useState, useEffect } from 'react'
import { HexGridCanvas } from './HexGridCanvas'
import { NodeInspectorTray } from './NodeInspectorTray'
import { EncounterDrawer } from './EncounterDrawer'
import { CombatStageHeader } from './CombatStageHeader'
import { SanctuaryTickMonitor } from './SanctuaryTickMonitor'
import { RunicCountdownRing } from './RunicCountdownRing'
import { TradeoffStatPreviewBar } from './TradeoffStatPreviewBar'
import { BossBattleArena } from './BossBattleArena'
import type { HexNodeData } from '../types'
import {
  canUnlockBoss,
  evaluateNodeUnlocks,
  resolveTimedReflectionDecryption,
} from '../game-rules'
import { useGamification } from '../useGamification'
import { Button, Badge, Modal } from '../../../ui-system'
import { useOKFBundled, bundleToSections } from '../../../learning-engine/composition/okf/sections'
import { SectionRegistry } from '../../../learning-engine/registry'
import { useTopics } from '../../../learning-engine/composition/routes'
import { useParams, useSearchParams } from 'react-router-dom'
import { Suspense, useMemo as useReactMemo } from 'react'
import { Map as MapIcon, ArrowLeft, RotateCcw, Award, Play } from 'lucide-react'

// Known hexmap topics available in public/hexmaps/
const KNOWN_HEXMAP_TOPIC_IDS = ['gamification', 'demo']

export const GamificationCampaignView: React.FC = () => {
  const { topicId: routeTopicId } = useParams<{ topicId?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryTopicId = searchParams.get('topic')
  
  const initialTopicId = routeTopicId || queryTopicId || null
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(initialTopicId)
  const { topics } = useTopics()

  // Keep state in sync if URL changes
  useEffect(() => {
    if (routeTopicId) {
      setSelectedTopicId(routeTopicId)
    } else if (queryTopicId) {
      setSelectedTopicId(queryTopicId)
    }
  }, [routeTopicId, queryTopicId])

  // Filter topics that have an active hexmap
  const hexmapTopics = useReactMemo(() => {
    return topics.filter((t) => KNOWN_HEXMAP_TOPIC_IDS.includes(t.id))
  }, [topics])

  // Active topic ID defaults to selected or 'gamification'
  const currentTopicId = selectedTopicId || 'gamification'

  const handleSelectTopic = (topicId: string) => {
    setSelectedTopicId(topicId)
    setSearchParams({ topic: topicId })
  }

  const handleReturnToLobby = () => {
    setSelectedTopicId(null)
    setSearchParams({})
  }

  // Unified gamification driving port for current topic
  const {
    campaign: liveCampaign,
    topicState: campaign,
    globalProfile: globalChar,
    isLoading,
    error,
    selectNode: portSelectNode,
    resolveQuizAnswer: portResolveQuizAnswer,
    completeNode: portCompleteNode,
    takeDamage: portTakeDamage,
    awardExp: portAwardExp,
    applySanctuaryTickHeal: portApplySanctuaryTickHeal,
    applyCraftedBuff: portApplyCraftedBuff,
    allocateStatPoint: portAllocateStatPoint,
    resetCampaign: portResetCampaign,
  } = useGamification(currentTopicId)

  // Load real OKF bundle for current topic
  const { bundle: okfBundle } = useOKFBundled(currentTopicId)
  const bundleSectionsMap = useReactMemo(() => {
    if (!okfBundle) return new Map<string, { type: string; props: Record<string, unknown> }>()
    const map = new Map<string, { type: string; props: Record<string, unknown> }>()
    const configs = bundleToSections(okfBundle)
    okfBundle.forEach((sec, idx) => {
      const folder = sec.sectionFolder
      if (folder) {
        map.set(folder, configs[idx])
      }
    })
    return map
  }, [okfBundle])

  const [nodes, setNodes] = useState<HexNodeData[]>([])
  const [selectedNode, setSelectedNode] = useState<HexNodeData | null>(null)

  // Sync loaded campaign nodes from Validation Gateway & merged saved cleared state
  useEffect(() => {
    if (liveCampaign?.nodes && liveCampaign.nodes.length > 0) {
      const mergedNodes = liveCampaign.nodes.map((n) => {
        if (campaign?.clearedNodeIds.includes(n.id)) {
          return { ...n, status: 'cleared' as const }
        }
        return n
      })
      const evaluated = evaluateNodeUnlocks(mergedNodes)
      setNodes(evaluated)
      if (!selectedNode || !evaluated.some((n) => n.id === selectedNode.id)) {
        setSelectedNode(evaluated[0])
      } else {
        const freshSelected = evaluated.find((n) => n.id === selectedNode.id)
        if (freshSelected) {
          setSelectedNode(freshSelected)
        }
      }
    }
  }, [liveCampaign, campaign?.clearedNodeIds])

  // Active Section Modal & Instance Key for Retry / Re-encounter
  const [activeSectionModal, setActiveSectionModal] = useState<HexNodeData | null>(null)
  const [activeBadgesModal, setActiveBadgesModal] = useState<boolean>(false)
  const [combatLog, setCombatLog] = useState<string[]>([])
  const [quizAttemptKey, setQuizAttemptKey] = useState<number>(0)
  const [quizFailed, setQuizFailed] = useState<boolean>(false)
  const [activeTradeoffMetrics, setActiveTradeoffMetrics] = useState<Array<{ id: string; label: string; value: number }>>([])

  // Launch Section Handler (Increases System Chaos by +15 on section entry)
  const handleLaunchSection = (node: HexNodeData) => {
    portSelectNode(node.id)
    setQuizFailed(false)
    setQuizAttemptKey((prev) => prev + 1)
    setActiveSectionModal(node)
    setCombatLog((prev) => [
      `🎮 Entered ${node.title} [${node.type.toUpperCase()}]. Active Section Evaluation started!`,
      ...prev,
    ])
  }

  // Allocate Attribute Point
  const handleAllocateStat = (stat: 'armor' | 'evasion' | 'intelligence') => {
    portAllocateStatPoint(stat)
  }

  // Quiz Combat Result Execution
  const handleQuizAnswerCombat = (isCorrect: boolean) => {
    if (!selectedNode || !selectedNode.monster) return
    portResolveQuizAnswer(isCorrect, selectedNode.id)
  }

  // Healing Sanctuary Action with Chaos Healing Decay
  const handleRestSanctuary = () => {
    if (!selectedNode) return
    portApplySanctuaryTickHeal(30, selectedNode.id)
    setCombatLog((prev) => [
      `🏛️ Sanctuary Rested! Restored character HP and cleansed System Chaos!`,
      ...prev,
    ])
  }

  // Trade-off Crafting Buff Action
  const handleCraftBuff = (synthesizedArtifact?: { name: string; buff: { stat: 'armor' | 'evasion' | 'intelligence' | 'chaos_shield'; value: number; label: string }; vulnerability?: { stat: 'extra_damage' | 'healing_penalty'; value: number; label: string }; durationTurns: number }) => {
    if (!selectedNode) return
    const buffData = {
      stat: synthesizedArtifact?.buff.stat || 'armor',
      value: synthesizedArtifact?.buff.value ?? 10,
      source: synthesizedArtifact?.name || selectedNode.title || 'Trade-off Workshop',
    }
    portApplyCraftedBuff(buffData)
    setCombatLog((prev) => [
      `⚒️ Synthesized Artifact "${buffData.source}": +${buffData.value}% ${buffData.stat.toUpperCase()} equipped!`,
      ...prev,
    ])
    handlePassSection(selectedNode)
  }

  // Simulate Section Pass / Complete
  const handlePassSection = (targetNode: HexNodeData) => {
    setNodes((prevNodes) => {
      const withCleared = prevNodes.map((n) =>
        n.id === targetNode.id ? { ...n, status: 'cleared' as const } : n
      )
      const evaluated = evaluateNodeUnlocks(withCleared)
      const updatedTarget = evaluated.find((n) => n.id === targetNode.id)
      if (updatedTarget && selectedNode?.id === targetNode.id) {
        setSelectedNode(updatedTarget)
      }
      return evaluated
    })

    const reward = targetNode.rewards && targetNode.rewards.length > 0 ? targetNode.rewards[0] : null
    if (reward) {
      setCombatLog((prev) => [`🎁 COLLECTED ITEM REWARD: ${reward.name} ${reward.icon}!`, ...prev])
    }

    // EXP rewards: 5 for reading & capital, 20 for quiz & decrypt & tradeoff, 50 for boss
    let expToAward = 10
    if (targetNode.type === 'reading_sanctuary' || targetNode.type === 'capital') {
      expToAward = 5
    } else if (targetNode.type === 'quiz_encounter' || targetNode.type === 'reflection_decryption' || targetNode.type === 'tradeoff_workshop') {
      expToAward = 20
    } else if (targetNode.type === 'boss_lair') {
      expToAward = 50
    }

    portCompleteNode(targetNode.id)
    portAwardExp(expToAward)
    setCombatLog((prev) => [
      `🎉 ENCOUNTER CLEARED: "${targetNode.title}" Completed! +${expToAward} EXP Gained!`,
      ...prev,
    ])
    setActiveSectionModal(null)
  }

  // Section Fail / Defeat / Timeout (System Chaos scales damage)
  const handleFailSection = (targetNode: HexNodeData) => {
    const currentChaos = campaign?.chaosLevel ?? 0
    let damage = 25

    if (targetNode.type === 'reflection_decryption') {
      const outcome = resolveTimedReflectionDecryption(false, 0, 60, currentChaos)
      damage = outcome.damagePenalty
    } else {
      const chaosMultiplier = 1 + (currentChaos / 200)
      damage = Math.round(25 * chaosMultiplier)
    }

    portTakeDamage(damage)
    const chaosNote = currentChaos > 0 ? ` (amplified by ${currentChaos}% System Chaos)` : ''
    setCombatLog((prev) => [
      `❌ SECTION FAILED: "${targetNode.title}"! Character suffered ${damage} damage${chaosNote}!`,
      ...prev,
    ])
  }

  if (isLoading || !campaign || !globalChar) {
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

  // Check Boss Unlock Criteria via domain game rule
  const bossNode = nodes.find((n) => n.type === 'boss_lair')
  const hasBossItems = canUnlockBoss(campaign.inventory, bossNode)

  // ─── LOBBY VIEW: If no campaign is active, render Global Status & Topic Campaign List ───
  if (!selectedTopicId) {
    return (
      <div className="min-h-screen bg-[#1e1e2e] text-[#c6d0f5] p-6 lg:p-10 flex flex-col gap-8 font-sans max-w-7xl mx-auto">
        {/* ─── Global Character Profile Hero Banner ─── */}
        <header className="bg-gradient-to-r from-[#292c3c] via-[#303446] to-[#292c3c] border border-[#414559] rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-[#8caaee] via-[#ca9ee6] to-[#f4b8e4] flex items-center justify-center text-3xl sm:text-4xl shadow-xl border border-[#8caaee]/50 shrink-0">
              🧙‍♂️
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#b5bfe2] tracking-tight truncate">
                  Architecture Champion
                </h1>
                <Badge variant="secondary" className="bg-[#8caaee]/20 text-[#8caaee] border-[#8caaee]/40 text-xs sm:text-sm px-2.5 py-0.5 sm:px-3 sm:py-1 font-bold">
                  Lvl {globalChar.level}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-[#a5adce] mt-1 line-clamp-1 sm:line-clamp-none">
                Persistent Cross-Campaign Learning Avatar · Level up and forge stats!
              </p>
              {/* EXP Bar */}
              <div className="w-full max-w-xs sm:w-64 lg:w-80 bg-[#232634] h-2.5 sm:h-3 rounded-full overflow-hidden mt-2.5 sm:mt-3 border border-[#414559]">
                <div
                  className="bg-gradient-to-r from-[#8caaee] to-[#a6d189] h-full transition-all duration-500"
                  style={{ width: `${(globalChar.exp / globalChar.nextLevelExp) * 100}%` }}
                />
              </div>
              <span className="text-[11px] sm:text-xs font-mono text-[#a5adce] mt-1 sm:mt-1.5 block">
                {globalChar.exp} / {globalChar.nextLevelExp} EXP to Level {globalChar.level + 1}
              </span>
            </div>
          </div>

          {/* Stats & Badges Bar (Responsive Grid on Mobile) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 bg-[#232634]/90 p-4 sm:px-6 sm:py-4 rounded-2xl border border-[#414559] shadow-inner">
            <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-2.5 text-center sm:text-left bg-[#1e1e2e]/50 sm:bg-transparent p-2 sm:p-0 rounded-xl">
                <span className="text-xl sm:text-2xl">🛡️</span>
                <div>
                  <span className="text-[10px] sm:text-xs text-[#a5adce] font-semibold block">Armor</span>
                  <span className="text-sm sm:text-base font-bold text-[#e5c890]">{globalChar.attributes.armor}%</span>
                </div>
                {globalChar.unallocatedPoints > 0 && (
                  <Button size="sm" variant="ghost" className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-[#a6d189] hover:bg-[#a6d189]/20" onClick={() => handleAllocateStat('armor')}>
                    +
                  </Button>
                )}
              </div>

              <div className="hidden sm:block w-px h-10 bg-[#414559]" />

              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-2.5 text-center sm:text-left bg-[#1e1e2e]/50 sm:bg-transparent p-2 sm:p-0 rounded-xl">
                <span className="text-xl sm:text-2xl">⚡</span>
                <div>
                  <span className="text-[10px] sm:text-xs text-[#a5adce] font-semibold block">Evasion</span>
                  <span className="text-sm sm:text-base font-bold text-[#8caaee]">{globalChar.attributes.evasion}%</span>
                </div>
                {globalChar.unallocatedPoints > 0 && (
                  <Button size="sm" variant="ghost" className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-[#a6d189] hover:bg-[#a6d189]/20" onClick={() => handleAllocateStat('evasion')}>
                    +
                  </Button>
                )}
              </div>

              <div className="hidden sm:block w-px h-10 bg-[#414559]" />

              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-2.5 text-center sm:text-left bg-[#1e1e2e]/50 sm:bg-transparent p-2 sm:p-0 rounded-xl">
                <span className="text-xl sm:text-2xl">💡</span>
                <div>
                  <span className="text-[10px] sm:text-xs text-[#a5adce] font-semibold block">Intel</span>
                  <span className="text-sm sm:text-base font-bold text-[#ca9ee6]">{globalChar.attributes.intelligence}%</span>
                </div>
                {globalChar.unallocatedPoints > 0 && (
                  <Button size="sm" variant="ghost" className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-[#a6d189] hover:bg-[#a6d189]/20" onClick={() => handleAllocateStat('intelligence')}>
                    +
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t border-[#414559]/50 sm:border-0">
              {globalChar.unallocatedPoints > 0 && (
                <Badge variant="success" className="animate-pulse px-2.5 py-1 text-[11px] sm:text-xs">
                  {globalChar.unallocatedPoints} Stat Pts!
                </Badge>
              )}

              <Button variant="ghost" onClick={() => setActiveBadgesModal(true)} className="border border-[#414559] hover:bg-[#414559]/50 text-xs w-full sm:w-auto py-2">
                <Award size={14} className="mr-1.5 text-[#e5c890]" />
                <span>Badges ({globalChar.unlockedBadges.length})</span>
              </Button>
            </div>
          </div>
        </header>

        {/* ─── Campaign Topics Selection Grid ─── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#b5bfe2] flex items-center gap-2">
                <MapIcon className="text-[#8caaee]" size={22} />
                Available Campaign Realms (Hex Maps)
              </h2>
              <p className="text-xs text-[#a5adce] mt-0.5">
                Select a topic realm to launch into its strategic hex campaign or resume where you left off.
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {hexmapTopics.length} Realms Available
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hexmapTopics.map((topic) => {
              // Read saved topic state from localStorage if available
              let topicClearedCount = 0
              try {
                const raw = localStorage.getItem(`loom_gamification_campaign_${topic.id}`)
                if (raw) {
                  const parsed = JSON.parse(raw)
                  if (Array.isArray(parsed.clearedNodeIds)) {
                    topicClearedCount = parsed.clearedNodeIds.length
                  }
                }
              } catch {
                // Ignore parse errors
              }

              const isCurrent = topic.id === currentTopicId
              const clearedCount = isCurrent ? campaign.clearedNodeIds.length : topicClearedCount

              return (
                <div
                  key={topic.id}
                  className="bg-[#292c3c]/90 hover:bg-[#303446] border border-[#414559] hover:border-[#8caaee]/60 rounded-2xl p-6 shadow-xl transition-all duration-300 flex flex-col justify-between gap-5 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#8caaee]/10 border border-[#8caaee]/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                          {topic.id === 'gamification' ? '🧠' : '📐'}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#b5bfe2] group-hover:text-[#8caaee] transition-colors">
                            {topic.label}
                          </h3>
                          <span className="text-xs font-mono text-[#8caaee]">{topic.category}</span>
                        </div>
                      </div>
                      <Badge variant="default" className="text-[10px] uppercase">
                        Hex Campaign
                      </Badge>
                    </div>

                    <p className="text-xs text-[#a5adce] leading-relaxed line-clamp-2">
                      {topic.description}
                    </p>

                    {/* Progress Info */}
                    <div className="pt-2 border-t border-[#414559]/50 flex items-center justify-between text-xs text-[#a5adce]">
                      <span>Campaign Progress:</span>
                      <span className="font-mono font-bold text-[#a6d189]">
                        {clearedCount > 0 ? `${clearedCount} Nodes Cleared` : 'Ready to Start'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      className="flex-1 bg-gradient-to-r from-[#8caaee] to-[#a6d189] hover:opacity-90 text-[#232634] font-bold text-sm py-2.5 shadow-lg flex items-center justify-center gap-2"
                      onClick={() => handleSelectTopic(topic.id)}
                    >
                      <Play size={16} fill="currentColor" />
                      <span>{clearedCount > 0 ? 'Resume Campaign' : 'Start Campaign'}</span>
                    </Button>
                    {clearedCount > 0 && (
                      <Button
                        variant="ghost"
                        className="border border-[#e78284]/30 hover:bg-[#e78284]/10 text-[#e78284] text-xs px-3 py-2.5"
                        onClick={async () => {
                          await portResetCampaign(topic.id)
                          // Trigger local state re-render if current
                          if (!isCurrent) {
                            localStorage.removeItem(`loom_gamification_campaign_${topic.id}`)
                            window.location.reload()
                          }
                        }}
                        title="Reset this topic campaign state"
                      >
                        <RotateCcw size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ─── Badges Modal ─── */}
        <Modal open={activeBadgesModal} onClose={() => setActiveBadgesModal(false)} maxWidth="md" title="Achievements & Badges">
          <div className="p-2 text-[#c6d0f5]">
            <h3 className="text-lg font-bold text-[#b5bfe2] mb-4">🏆 Unlocked Achievements & Badges</h3>
            <div className="grid grid-cols-1 gap-3 mb-6">
              {globalChar.unlockedBadges.length === 0 ? (
                <p className="text-sm text-[#737994] italic p-4 text-center">No badges unlocked yet. Clear encounters and defeat bosses across realm campaigns!</p>
              ) : (
                globalChar.unlockedBadges.map((badge) => (
                  <div key={badge.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#232634] border border-[#8caaee]/30">
                    <span className="text-3xl">{badge.icon}</span>
                    <div>
                      <h4 className="text-sm font-bold text-[#8caaee]">{badge.title}</h4>
                      <p className="text-xs text-[#a5adce]">{badge.description}</p>
                      <span className="text-[10px] text-[#737994] block mt-1">Unlocked: {badge.unlockedAt}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setActiveBadgesModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    )
  }

  // ─── ACTIVE CAMPAIGN VIEW: Map Canvas, HUD, and Section Viewport ───
  return (
    <div className="min-h-screen bg-[#1e1e2e] text-[#c6d0f5] p-6 flex flex-col gap-6 font-sans">
      {/* ─── Top Global Character Profile Header ─── */}
      <header className="bg-[#303446]/80 backdrop-blur-xl border border-[#414559] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Character Title & Level */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            onClick={handleReturnToLobby}
            className="border border-[#414559] hover:bg-[#414559]/50 text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center gap-1.5 shrink-0"
            title="Stop campaign and return to Realm Lobby"
          >
            <ArrowLeft size={14} />
            <span>Lobby</span>
          </Button>

          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#8caaee] to-[#ca9ee6] flex items-center justify-center text-xl sm:text-2xl shadow-lg border border-[#8caaee]/40 shrink-0">
            🧙‍♂️
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-bold text-[#b5bfe2] truncate">Architecture Champion</h1>
              <Badge variant="secondary" className="bg-[#8caaee]/20 text-[#8caaee] border-[#8caaee]/40 text-[10px] sm:text-xs">
                Lvl {globalChar.level}
              </Badge>
            </div>
            {/* EXP Bar */}
            <div className="w-full max-w-[180px] sm:w-48 bg-[#232634] h-2 rounded-full overflow-hidden mt-1.5 sm:mt-2 border border-[#414559]">
              <div
                className="bg-gradient-to-r from-[#8caaee] to-[#a6d189] h-full transition-all duration-500"
                style={{ width: `${(globalChar.exp / globalChar.nextLevelExp) * 100}%` }}
              />
            </div>
            <span className="text-[10px] sm:text-xs text-[#a5adce] mt-0.5 sm:mt-1 block font-mono">
              {globalChar.exp} / {globalChar.nextLevelExp} EXP
            </span>
          </div>
        </div>

        {/* Global Character Stats & Allocation (Responsive Grid on Mobile) */}
        <div className="flex items-center justify-between md:justify-start gap-3 sm:gap-6 bg-[#232634] px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl border border-[#414559]">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-base sm:text-lg">🛡️</span>
            <div>
              <span className="text-[10px] sm:text-xs text-[#a5adce] block">Armor</span>
              <span className="text-xs sm:text-sm font-bold text-[#e5c890]">{globalChar.attributes.armor}%</span>
            </div>
            {globalChar.unallocatedPoints > 0 && (
              <Button size="sm" variant="ghost" className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-[#a6d189]" onClick={() => handleAllocateStat('armor')}>
                +
              </Button>
            )}
          </div>

          <div className="w-px h-6 sm:h-8 bg-[#414559]" />

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-base sm:text-lg">⚡</span>
            <div>
              <span className="text-[10px] sm:text-xs text-[#a5adce] block">Evasion</span>
              <span className="text-xs sm:text-sm font-bold text-[#8caaee]">{globalChar.attributes.evasion}%</span>
            </div>
            {globalChar.unallocatedPoints > 0 && (
              <Button size="sm" variant="ghost" className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-[#a6d189]" onClick={() => handleAllocateStat('evasion')}>
                +
              </Button>
            )}
          </div>

          <div className="w-px h-6 sm:h-8 bg-[#414559]" />

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-base sm:text-lg">💡</span>
            <div>
              <span className="text-[10px] sm:text-xs text-[#a5adce] block">Intel</span>
              <span className="text-xs sm:text-sm font-bold text-[#ca9ee6]">{globalChar.attributes.intelligence}%</span>
            </div>
            {globalChar.unallocatedPoints > 0 && (
              <Button size="sm" variant="ghost" className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-[#a6d189]" onClick={() => handleAllocateStat('intelligence')}>
                +
              </Button>
            )}
          </div>

          {globalChar.unallocatedPoints > 0 && (
            <Badge variant="success" className="animate-pulse text-[10px] ml-1">
              {globalChar.unallocatedPoints} Pts!
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          {combatLog.length > 0 && (
            <span className="text-xs font-mono text-[#ca9ee6] hidden lg:inline truncate max-w-xs">
              {combatLog[0]}
            </span>
          )}
          <Button variant="ghost" onClick={() => portResetCampaign()} className="border border-[#e78284]/40 hover:bg-[#e78284]/20 text-[#e78284] text-xs px-2.5 py-1.5">
            <RotateCcw size={13} className="mr-1" />
            Reset
          </Button>
          <Button variant="ghost" onClick={() => setActiveBadgesModal(true)} className="border border-[#414559] hover:bg-[#414559]/50 text-xs px-2.5 py-1.5">
            🏆 Badges ({globalChar.unlockedBadges.length})
          </Button>
        </div>
      </header>

      {/* ─── Topic Campaign HUD Bar (Responsive layout) ─── */}
      <div className="bg-[#292c3c] border border-[#414559] rounded-2xl p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 shadow-md">
        {/* Campaign Title */}
        <div className="flex items-center gap-3 col-span-1 sm:col-span-2 lg:col-span-1">
          <span className="text-xl sm:text-2xl">🗺️</span>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-[#b5bfe2] truncate">{campaign.topicTitle}</h2>
            <span className="text-[10px] sm:text-xs text-[#a5adce]">Topic Campaign Active</span>
          </div>
        </div>

        {/* Character HP Gauge */}
        <div className="flex items-center gap-2.5 bg-[#1e1e2e]/60 p-2 sm:p-2.5 rounded-xl border border-[#414559]/40">
          <span className="text-base sm:text-lg">❤️</span>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[11px] sm:text-xs mb-1 font-semibold">
              <span>HP</span>
              <span className={campaign.characterHp < 30 ? 'text-[#e78284]' : 'text-[#a6d189]'}>
                {campaign.characterHp} / {campaign.maxCharacterHp}
              </span>
            </div>
            <div className="w-full bg-[#1e1e2e] h-2 sm:h-2.5 rounded-full overflow-hidden border border-[#414559]">
              <div
                className={`h-full transition-all duration-300 ${
                  campaign.characterHp < 30 ? 'bg-[#e78284]' : 'bg-gradient-to-r from-[#a6d189] to-[#8caaee]'
                }`}
                style={{ width: `${(campaign.characterHp / campaign.maxCharacterHp) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* System Chaos / Monster Enrage Gauge */}
        <div className="flex items-center gap-2.5 bg-[#1e1e2e]/60 p-2 sm:p-2.5 rounded-xl border border-[#414559]/40">
          <span className="text-base sm:text-lg">🌀</span>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[11px] sm:text-xs mb-1 font-semibold">
              <span>Chaos</span>
              <span className={campaign.chaosLevel > 60 ? 'text-[#e78284]' : 'text-[#ca9ee6]'}>
                {campaign.chaosLevel}% (+{Math.round((campaign.chaosLevel / 200) * 100)}% Dmg)
              </span>
            </div>
            <div className="w-full bg-[#1e1e2e] h-2 sm:h-2.5 rounded-full overflow-hidden border border-[#414559]">
              <div
                className={`h-full transition-all duration-300 ${
                  campaign.chaosLevel > 70
                    ? 'bg-[#e78284]'
                    : campaign.chaosLevel > 35
                    ? 'bg-[#e5c890]'
                    : 'bg-[#a6d189]'
                }`}
                style={{ width: `${(campaign.chaosLevel / campaign.maxChaosLevel) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Inventory & Forged Gear Tray */}
        <div className="flex flex-col justify-center gap-1.5 bg-[#1e1e2e]/60 p-2 sm:p-2.5 rounded-xl border border-[#414559]/40 col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-[#a5adce] font-semibold flex items-center gap-1">
              <span>🗝️ Keys:</span>
              <span className={hasBossItems ? 'text-[#a6d189]' : 'text-[#e5c890]'}>
                {campaign.inventory.length}/{bossNode?.requiredItems?.length || 2}
              </span>
            </span>
            <Badge
              variant={hasBossItems ? 'success' : 'warning'}
              className="text-[9px] uppercase font-mono px-1.5 py-0"
            >
              {hasBossItems ? 'Boss Ready' : 'Need Keys'}
            </Badge>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {campaign.inventory.length === 0 && campaign.activeBuffs.length === 0 ? (
              <span className="text-[10px] text-[#737994] italic">(No gear collected)</span>
            ) : (
              <>
                {campaign.inventory.map((item) => (
                  <Badge
                    key={item.id}
                    variant="secondary"
                    className="bg-[#8caaee]/20 text-[#8caaee] border-[#8caaee]/40 text-[10px] px-1.5 py-0 flex items-center gap-0.5"
                  >
                    <span>{item.icon}</span>
                    <span className="truncate max-w-[80px]">{item.name}</span>
                  </Badge>
                ))}
                {campaign.activeBuffs.map((buff, idx) => (
                  <Badge
                    key={`${buff.source}-${idx}`}
                    variant="secondary"
                    className="bg-[#a6d189]/20 text-[#a6d189] border-[#a6d189]/40 text-[10px] px-1.5 py-0 flex items-center gap-0.5"
                  >
                    <span>⚒️</span>
                    <span className="truncate max-w-[80px]">+{buff.value}% {buff.stat}</span>
                  </Badge>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Main Map Canvas with Bottom NodeInspectorTray ─── */}
      <div className="flex flex-col gap-4">
        <HexGridCanvas
          nodes={nodes}
          selectedNodeId={selectedNode?.id || null}
          onSelectNode={setSelectedNode}
        />

        {/* Sleek Bottom Node Inspector Tray */}
        <NodeInspectorTray
          selectedNode={selectedNode}
          nodes={nodes}
          inventory={campaign.inventory}
          onLaunchEncounter={handleLaunchSection}
        />
      </div>

      {/* ─── REAL ENCOUNTER DRAWER VIEWPORT (BOTTOM DOCKED) ─── */}
      <EncounterDrawer
        node={activeSectionModal}
        isOpen={!!activeSectionModal}
        onClose={() => setActiveSectionModal(null)}
        headerWidget={
          activeSectionModal && (
            <>
              {/* Quiz Encounter Duel Stage Header */}
              {activeSectionModal.type === 'quiz_encounter' && activeSectionModal.monster && (
                <CombatStageHeader
                  monster={activeSectionModal.monster}
                  playerAttributes={globalChar.attributes}
                  playerHp={campaign.characterHp}
                  maxPlayerHp={campaign.maxCharacterHp}
                  inventory={campaign.inventory}
                  onUseItem={(itemId) => {
                    if ((itemId === 'product-blade' || itemId === 'port-blade') && activeSectionModal.monster) {
                      portResolveQuizAnswer(true, activeSectionModal.id)
                    }
                  }}
                  combatLogMessage={combatLog[0]}
                />
              )}

              {/* Sanctuary Reading Tick Monitor */}
              {activeSectionModal.type === 'reading_sanctuary' && (
                <SanctuaryTickMonitor
                  healingAmount={activeSectionModal.healingAmount ?? 40}
                  visitCount={1}
                  chaosLevel={campaign.chaosLevel}
                  onTickHeal={handleRestSanctuary}
                />
              )}

              {/* Runic Magic Countdown Ring */}
              {activeSectionModal.type === 'reflection_decryption' && (
                <RunicCountdownRing
                  isSolved={activeSectionModal.status === 'cleared'}
                  onTimeout={() => handleFailSection(activeSectionModal)}
                />
              )}

              {/* Trade-off Stat Preview Bar */}
              {activeSectionModal.type === 'tradeoff_workshop' && (
                <TradeoffStatPreviewBar
                  metrics={activeTradeoffMetrics}
                  tradeoffMapping={activeSectionModal.tradeoffMapping}
                  onForgeArtifact={handleCraftBuff}
                />
              )}
            </>
          )
        }
      >
        {activeSectionModal && (() => {
          const sectionConfig = activeSectionModal.sectionRef ? bundleSectionsMap.get(activeSectionModal.sectionRef) : null
          const DynamicComponent = sectionConfig ? SectionRegistry.get(sectionConfig.type) : null

          return (
            <div className="text-[#c6d0f5] space-y-6 w-full max-w-7xl mx-auto">
              {/* Dynamic Section Renderer if OKF bundle has matching sectionRef */}
              {DynamicComponent && sectionConfig ? (
                <div className="space-y-4">
                  <Suspense fallback={<div className="p-8 text-center text-sm text-[#8caaee]">Loading section data...</div>}>
                    <DynamicComponent
                      key={`${activeSectionModal.id}-${quizAttemptKey}`}
                      {...sectionConfig.props}
                      intelligenceChance={globalChar.attributes.intelligence}
                      onEvent={(event: any) => {
                        if (event.type === 'QuizOptionSelected') {
                          handleQuizAnswerCombat(event.isCorrect)
                          setCombatLog((prev) => [
                            event.isCorrect
                              ? `⚔️ Attack Hit! Struck ${activeSectionModal.monster?.name || 'Monster'} with accurate answer!`
                              : `💔 Attack Missed! Monster retaliated against incorrect answer!`,
                            ...prev,
                          ])
                        }
                      }}
                      onResultChange={(result: any) => {
                        if (activeSectionModal.type === 'tradeoff_workshop' && result?.payload && typeof result.payload === 'object') {
                          const mapped = Object.entries(result.payload).map(([key, val]) => ({
                            id: key,
                            label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                            value: typeof val === 'number' ? val : 50,
                          }))
                          if (mapped.length > 0) {
                            setActiveTradeoffMetrics(mapped)
                          }
                        }
                        if (activeSectionModal.type === 'quiz_encounter') {
                          if (result.status === 'completed' || result.status === 'failed') {
                            const isPassing = result.status === 'completed' && (result.accuracy ?? 0) >= 1.0
                            if (isPassing) {
                              setQuizFailed(false)
                              handlePassSection(activeSectionModal)
                            } else {
                              setQuizFailed(true)
                              handleFailSection(activeSectionModal)
                            }
                          }
                        }
                      }}
                    />
                  </Suspense>
                  {activeSectionModal.type === 'reading_sanctuary' && activeSectionModal.status !== 'cleared' && (
                    <div className="pt-4 border-t border-[#414559] flex justify-end">
                      <Button
                        className="bg-gradient-to-r from-[#a6d189] to-[#8caaee] hover:opacity-90 text-[#232634] font-bold text-sm px-6 py-2.5 shadow-lg flex items-center gap-2"
                        onClick={() => {
                          handleRestSanctuary()
                          handlePassSection(activeSectionModal)
                        }}
                      >
                        <span>🏛️</span>
                        <span>Complete Reading & Attune Sanctuary (+5 XP)</span>
                      </Button>
                    </div>
                  )}
                  {activeSectionModal.type === 'capital' && activeSectionModal.status !== 'cleared' && (
                    <div className="pt-4 border-t border-[#414559] flex justify-end">
                      <Button
                        className="bg-gradient-to-r from-[#8caaee] to-[#a6d189] hover:opacity-90 text-[#232634] font-bold text-sm px-6 py-2.5 shadow-lg flex items-center gap-2"
                        onClick={() => handlePassSection(activeSectionModal)}
                      >
                        <span>📖</span>
                        <span>Complete Reading & Reveal Hex Map (+5 XP)</span>
                      </Button>
                    </div>
                  )}
                  {quizFailed && activeSectionModal.type === 'quiz_encounter' && (
                    <div className="p-4 bg-[#232634] rounded-2xl border border-[#e78284]/50 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in shadow-xl">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">👾</span>
                        <div>
                          <span className="text-sm font-bold text-[#e78284] block">Monster Still Standing!</span>
                          <span className="text-xs text-[#a5adce]">The monster was not fully defeated. Restart the battle encounter to try again.</span>
                        </div>
                      </div>
                      <Button
                        className="bg-gradient-to-r from-[#e78284] to-[#ef9f76] hover:opacity-90 text-[#232634] font-bold text-xs px-5 py-2.5 shadow-lg shrink-0 flex items-center gap-1.5"
                        onClick={() => {
                          setQuizFailed(false)
                          setQuizAttemptKey((prev) => prev + 1)
                          setCombatLog((prev) => [`⚔️ Restarting encounter against ${activeSectionModal.title}! Combat reset.`, ...prev])
                        }}
                      >
                        <span>🔄</span>
                        <span>Restart Encounter</span>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#232634] rounded-2xl border border-[#414559]">
                  <h3 className="text-lg font-bold text-[#8caaee] mb-2">{activeSectionModal.title}</h3>
                  <p className="text-sm text-[#a5adce] mb-6">{activeSectionModal.description}</p>
                  {activeSectionModal.status !== 'cleared' && (
                    <Button
                      className="bg-gradient-to-r from-[#8caaee] to-[#a6d189] hover:opacity-90 text-[#232634] font-bold text-sm px-6 py-2.5 shadow-lg"
                      onClick={() => handlePassSection(activeSectionModal)}
                    >
                      Complete Section (+50 XP)
                    </Button>
                  )}
                </div>
              )}

              {/* Boss Battle Arena Climax */}
              {activeSectionModal.type === 'boss_lair' && activeSectionModal.monster && (
                <BossBattleArena
                  monster={activeSectionModal.monster}
                  playerAttributes={globalChar.attributes}
                  playerHp={campaign.characterHp}
                  maxPlayerHp={campaign.maxCharacterHp}
                  inventory={campaign.inventory}
                  onVictory={() => handlePassSection(activeSectionModal)}
                  onTakeDamage={() => handleFailSection(activeSectionModal)}
                />
              )}
            </div>
          )
        })()}
      </EncounterDrawer>

      {/* ─── Badges Modal ─── */}
      <Modal open={activeBadgesModal} onClose={() => setActiveBadgesModal(false)} maxWidth="md" title="Achievements & Badges">
        <div className="p-2 text-[#c6d0f5]">
          <h3 className="text-lg font-bold text-[#b5bfe2] mb-4">🏆 Unlocked Achievements & Badges</h3>
          <div className="grid grid-cols-1 gap-3 mb-6">
            {globalChar.unlockedBadges.length === 0 ? (
              <p className="text-sm text-[#737994] italic p-4 text-center">No badges unlocked yet. Clear encounters and defeat bosses across realm campaigns!</p>
            ) : (
              globalChar.unlockedBadges.map((badge) => (
                <div key={badge.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#232634] border border-[#8caaee]/30">
                  <span className="text-3xl">{badge.icon}</span>
                  <div>
                    <h4 className="text-sm font-bold text-[#8caaee]">{badge.title}</h4>
                    <p className="text-xs text-[#a5adce]">{badge.description}</p>
                    <span className="text-[10px] text-[#737994] block mt-1">Unlocked: {badge.unlockedAt}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setActiveBadgesModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
