import React, { useState, useEffect, useCallback } from 'react'
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
  evaluateTopicBadges,
} from '../game-rules'
import { DIFFICULTY_CONFIGS, type DifficultyLevel } from '../types'
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

  // Per-topic selected difficulty state for Lobby start
  const [topicDifficulties, setTopicDifficulties] = useState<Record<string, DifficultyLevel>>(() => {
    const initialMap: Record<string, DifficultyLevel> = {}
    KNOWN_HEXMAP_TOPIC_IDS.forEach((tid) => {
      try {
        const raw = localStorage.getItem(`loom_gamification_campaign_${tid}`)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed.difficulty) initialMap[tid] = parsed.difficulty
        }
      } catch {
        // ignore
      }
      if (!initialMap[tid]) initialMap[tid] = 'normal'
    })
    return initialMap
  })

  const handleSelectTopic = (topicId: string) => {
    // Save selected difficulty before switching
    const chosenDiff = topicDifficulties[topicId] || 'normal'
    try {
      const key = `loom_gamification_campaign_${topicId}`
      const raw = localStorage.getItem(key)
      const data = raw ? JSON.parse(raw) : {}
      localStorage.setItem(key, JSON.stringify({ ...data, difficulty: chosenDiff }))
    } catch {
      // ignore
    }
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
    setDifficulty: portSetDifficulty,
    resolveQuizAnswer: portResolveQuizAnswer,
    completeNode: portCompleteNode,
    takeDamage: portTakeDamage,
    awardExp: portAwardExp,
    unlockBadge: portUnlockBadge,
    clearBadges: portClearBadges,
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
  const [gameOverModalOpen, setGameOverModalOpen] = useState<boolean>(false)
  const [topicVictoryModalOpen, setTopicVictoryModalOpen] = useState<boolean>(false)
  const [earnedVictoryBadges, setEarnedVictoryBadges] = useState<import('../types').UnlockedBadge[]>([])
  const [combatLog, setCombatLog] = useState<string[]>([])
  const [snackbar, setSnackbar] = useState<{
    id: number
    text: string
    type: 'success' | 'danger' | 'warning' | 'info' | 'craft' | 'exp'
    icon: string
  } | null>(null)
  const [quizAttemptKey, setQuizAttemptKey] = useState<number>(0)
  const [quizFailed, setQuizFailed] = useState<boolean>(false)
  const [activeTradeoffMetrics, setActiveTradeoffMetrics] = useState<Array<{ id: string; label: string; value: number }>>([])

  // Helper to push action messages with semantic colors & icons to both combatLog and bottom-center Snackbar Toast
  const pushActionMessage = useCallback((
    text: string,
    type: 'success' | 'danger' | 'warning' | 'info' | 'craft' | 'exp' = 'info',
    icon: string = '⚡'
  ) => {
    setCombatLog((prev) => [text, ...prev])
    setSnackbar({
      id: Date.now(),
      text,
      type,
      icon,
    })
  }, [])

  // Auto-dismiss snackbar after 4 seconds
  useEffect(() => {
    if (!snackbar) return
    const timer = setTimeout(() => {
      setSnackbar(null)
    }, 4000)
    return () => clearTimeout(timer)
  }, [snackbar])

  // Check for Zero HP Defeat condition
  useEffect(() => {
    if (campaign && campaign.characterHp <= 0 && !gameOverModalOpen) {
      setActiveSectionModal(null)
      setGameOverModalOpen(true)
    }
  }, [campaign?.characterHp, gameOverModalOpen])

  // Restart campaign on Zero HP defeat
  const handleDefeatRestart = async () => {
    await portResetCampaign(currentTopicId)
    setGameOverModalOpen(false)
    pushActionMessage(
      `☠️ CAMPAIGN DEFEAT: Health dropped to 0! Campaign reset to Capital for a fresh attempt.`,
      'danger',
      '☠️'
    )
  }

  // Launch Section Handler (Increases System Chaos on section entry)
  const handleLaunchSection = (node: HexNodeData) => {
    portSelectNode(node.id)
    setQuizFailed(false)
    setQuizAttemptKey((prev) => prev + 1)
    setActiveSectionModal(node)
    pushActionMessage(
      `🎮 Entered ${node.title} [${node.type.toUpperCase()}]. Active Section Evaluation started!`,
      'info',
      '🎮'
    )
  }

  // Allocate Attribute Point
  const handleAllocateStat = (stat: 'armor' | 'evasion' | 'intelligence') => {
    portAllocateStatPoint(stat)
    pushActionMessage(`✨ Upgraded ${stat.toUpperCase()}! Stat increased!`, 'success', '✨')
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
    pushActionMessage(`🏛️ Sanctuary Rested! Restored character HP and cleansed System Chaos!`, 'success', '🏛️')
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
    pushActionMessage(
      `⚒️ Synthesized Artifact "${buffData.source}": +${buffData.value}% ${buffData.stat.toUpperCase()} equipped!`,
      'craft',
      '⚒️'
    )
    handlePassSection(selectedNode)
  }

  // Simulate Section Pass / Complete (Scaled with Difficulty EXP multiplier)
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
      pushActionMessage(`🎁 COLLECTED ITEM REWARD: ${reward.name} ${reward.icon}!`, 'warning', '🎁')
    }

    // EXP rewards: 5 for reading & capital, 20 for quiz & decrypt & tradeoff, 50 for boss
    let baseExp = 10
    if (targetNode.type === 'reading_sanctuary' || targetNode.type === 'capital') {
      baseExp = 5
    } else if (targetNode.type === 'quiz_encounter' || targetNode.type === 'reflection_decryption' || targetNode.type === 'tradeoff_workshop') {
      baseExp = 20
    } else if (targetNode.type === 'boss_lair') {
      baseExp = 50
    }

    const currentDiff = campaign?.difficulty || 'normal'
    const expMultiplier = DIFFICULTY_CONFIGS[currentDiff]?.expBonusMultiplier ?? 1.0
    const expToAward = Math.round(baseExp * expMultiplier)

    portCompleteNode(targetNode.id)
    portAwardExp(expToAward)
    pushActionMessage(
      `🎉 ENCOUNTER CLEARED: "${targetNode.title}" Completed! +${expToAward} EXP Gained (${DIFFICULTY_CONFIGS[currentDiff]?.label})!`,
      'exp',
      '🎉'
    )
    setActiveSectionModal(null)

    // Trigger Topic Victory Modal upon defeating the Boss Lair
    if (targetNode.type === 'boss_lair') {
      const newlyEarned = evaluateTopicBadges(
        currentTopicId,
        campaign?.topicTitle || 'Topic Realm',
        campaign?.difficulty || 'normal',
        campaign?.damageTakenInCampaign || 0,
        (campaign?.activeBuffs.length || 0) > 0,
        globalChar?.unlockedBadges || []
      )
      setEarnedVictoryBadges(newlyEarned)
      setTopicVictoryModalOpen(true)
    }
  }

  // Section Fail / Defeat / Timeout (System Chaos and Difficulty scale damage)
  const handleFailSection = (targetNode: HexNodeData) => {
    const currentChaos = campaign?.chaosLevel ?? 0
    const currentDiff = campaign?.difficulty || 'normal'
    const diffDamageMultiplier = DIFFICULTY_CONFIGS[currentDiff]?.damageMultiplier ?? 1.0
    let damage = 25

    if (targetNode.type === 'reflection_decryption') {
      const outcome = resolveTimedReflectionDecryption(false, 0, 60, currentChaos, diffDamageMultiplier)
      damage = outcome.damagePenalty
    } else {
      const chaosMultiplier = 1 + (currentChaos / 200)
      damage = Math.round(25 * chaosMultiplier * diffDamageMultiplier)
    }

    portTakeDamage(damage)
    const chaosNote = currentChaos > 0 ? ` (amplified by ${currentChaos}% System Chaos)` : ''
    pushActionMessage(
      `❌ SECTION FAILED: "${targetNode.title}"! Suffered ${damage} damage${chaosNote} [${DIFFICULTY_CONFIGS[currentDiff]?.label}]!`,
      'danger',
      '❌'
    )
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
        <header className="bg-gradient-to-r from-[#292c3c] via-[#303446] to-[#292c3c] border border-[#414559] rounded-3xl p-5 sm:p-6 lg:p-7 shadow-2xl flex flex-col gap-5">
          {/* Row 1: Champion Identity, Level, and EXP Progress */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#8caaee] via-[#ca9ee6] to-[#f4b8e4] flex items-center justify-center text-2xl sm:text-3xl shadow-xl border border-[#8caaee]/50 shrink-0">
                🧙‍♂️
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h1 className="text-lg sm:text-2xl font-extrabold text-[#b5bfe2] tracking-tight truncate">
                    Architecture Champion
                  </h1>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="bg-[#8caaee]/20 text-[#8caaee] border-[#8caaee]/40 text-xs px-2.5 py-0.5 font-bold">
                      Lvl {globalChar.level}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="border border-[#8caaee]/40 hover:bg-[#8caaee]/20 text-[#8caaee] text-[10px] sm:text-xs h-6 px-2"
                      onClick={() => portAwardExp(globalChar.nextLevelExp - globalChar.exp)}
                      title="Level up Champion (+1 Level, +1 Stat Point)"
                    >
                      + Level Up
                    </Button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-[#a5adce] mt-0.5 line-clamp-1">
                  Persistent Cross-Campaign Learning Avatar · Level up and forge stats!
                </p>
              </div>
            </div>

            {/* EXP Progress Box */}
            <div className="w-full sm:w-64 lg:w-72 bg-[#232634]/70 border border-[#414559]/50 rounded-xl p-2.5 space-y-1 shrink-0">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#a5adce]">
                <span>EXP Progress</span>
                <span className="text-[#a6d189] font-bold">{globalChar.exp} / {globalChar.nextLevelExp}</span>
              </div>
              <div className="w-full bg-[#181825] h-2 rounded-full overflow-hidden border border-[#414559]/40">
                <div
                  className="bg-gradient-to-r from-[#8caaee] to-[#a6d189] h-full transition-all duration-500"
                  style={{ width: `${(globalChar.exp / globalChar.nextLevelExp) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Character Attributes & Badges Navigation Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-6 bg-[#232634]/90 p-3 sm:px-6 sm:py-3.5 rounded-2xl border border-[#414559] shadow-inner">
            <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-8 flex-1">
              <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left bg-[#1e1e2e]/50 sm:bg-transparent p-2 sm:p-0 rounded-xl">
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

              <div className="hidden sm:block w-px h-8 bg-[#414559]" />

              <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left bg-[#1e1e2e]/50 sm:bg-transparent p-2 sm:p-0 rounded-xl">
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

              <div className="hidden sm:block w-px h-8 bg-[#414559]" />

              <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left bg-[#1e1e2e]/50 sm:bg-transparent p-2 sm:p-0 rounded-xl">
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

            <div className="flex flex-row items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t border-[#414559]/50 sm:border-0 shrink-0">
              {globalChar.unallocatedPoints > 0 && (
                <Badge
                  variant="success"
                  className="animate-pulse px-2.5 py-1.5 text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1 shadow-sm"
                >
                  <span>✨</span>
                  <span>{globalChar.unallocatedPoints} Stat Pts!</span>
                </Badge>
              )}

              <Button
                variant="ghost"
                onClick={() => setActiveBadgesModal(true)}
                className="border border-[#414559] hover:bg-[#414559]/50 text-xs py-1.5 px-3 h-auto shrink-0 flex items-center justify-center"
              >
                <Award size={14} className="mr-1.5 text-[#e5c890] shrink-0" />
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
              const topicBadges = globalChar.unlockedBadges.filter(
                (b) => b.topicId === topic.id || b.topicTitle === topic.label
              )
              const selectedDiff = topicDifficulties[topic.id] || (isCurrent ? campaign.difficulty : 'normal')

              return (
                <div
                  key={topic.id}
                  className="bg-[#292c3c]/90 hover:bg-[#303446] border border-[#414559] hover:border-[#8caaee]/60 rounded-2xl p-4 sm:p-5 shadow-xl transition-all duration-300 flex flex-col justify-between gap-3 sm:gap-4 group"
                >
                  <div className="space-y-2.5 sm:space-y-3">
                    {/* Header: Icon, Title, Category, Status Badge */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#8caaee]/10 border border-[#8caaee]/30 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-105 transition-transform shrink-0">
                          {topic.id === 'gamification' ? '🧠' : '📐'}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-[#b5bfe2] group-hover:text-[#8caaee] transition-colors truncate">
                            {topic.label}
                          </h3>
                          <span className="text-[10px] sm:text-xs font-mono text-[#8caaee] block truncate">{topic.category}</span>
                        </div>
                      </div>
                      <Badge variant="default" className="text-[9px] uppercase shrink-0 py-0.5 px-2">
                        Hex Campaign
                      </Badge>
                    </div>

                    <p className="text-xs text-[#a5adce] leading-snug line-clamp-2">
                      {topic.description}
                    </p>

                    {/* Earned Badges Row (Compact inline icons) */}
                    {topicBadges.length > 0 && (
                      <div className="bg-[#1e1e2e]/70 px-2.5 py-1.5 rounded-xl border border-[#8caaee]/30 flex items-center justify-between gap-2">
                        <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#8caaee] tracking-wider shrink-0">
                          Badges ({topicBadges.length}):
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {topicBadges.map((badge) => (
                            <div
                              key={badge.id}
                              className="group/badge relative cursor-help"
                            >
                              <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-[#292c3c] hover:bg-[#303446] border border-[#8caaee]/40 flex items-center justify-center text-sm sm:text-base shadow-sm transition-transform hover:scale-110">
                                {badge.icon}
                              </div>
                              {/* Tooltip */}
                              <div className="absolute bottom-full right-0 mb-2 hidden group-hover/badge:flex flex-col w-48 p-2 bg-[#181825] border border-[#8caaee]/50 rounded-xl shadow-2xl z-50 text-left pointer-events-none">
                                <div className="flex items-center gap-1.5 font-bold text-[#8caaee] text-xs">
                                  <span>{badge.icon}</span>
                                  <span className="truncate">{badge.title}</span>
                                </div>
                                <p className="text-[10px] text-[#c6d0f5] mt-1 leading-tight">
                                  {badge.description}
                                </p>
                                {badge.difficulty && (
                                  <span className="text-[9px] uppercase font-semibold text-[#ef9f76] mt-1">
                                    Tier: {badge.difficulty}
                                  </span>
                                )}
                                <span className="text-[9px] text-[#737994] mt-0.5">
                                  Earned: {badge.unlockedAt}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Progress and Difficulty Selector Stack */}
                    <div className="pt-2 border-t border-[#414559]/50 space-y-2">
                      <div className="flex items-center justify-between text-[11px] sm:text-xs text-[#a5adce]">
                        <span>Progress:</span>
                        <span className="font-mono font-bold text-[#a6d189]">
                          {clearedCount > 0 ? `${clearedCount} Nodes Cleared` : 'Ready to Start'}
                        </span>
                      </div>

                      {/* Difficulty Selector Chips */}
                      <div className="flex items-center justify-between gap-1.5 bg-[#1e1e2e]/70 p-1.5 rounded-xl border border-[#414559]/40">
                        <span className="text-[10px] text-[#a5adce] font-semibold pl-1 shrink-0">
                          {clearedCount > 0 ? 'Active:' : 'Tier:'}
                        </span>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {(['easy', 'normal', 'hard', 'nightmare'] as DifficultyLevel[]).map((diff) => {
                            const conf = DIFFICULTY_CONFIGS[diff]
                            const isActive = selectedDiff === diff
                            const isLocked = clearedCount > 0 && !isActive

                            if (isLocked) {
                              return null
                            }

                            return (
                              <div key={diff} className="relative group/tier">
                                <button
                                  type="button"
                                  disabled={clearedCount > 0}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (clearedCount > 0) return
                                    setTopicDifficulties((prev) => ({
                                      ...prev,
                                      [topic.id]: diff,
                                    }))
                                    if (isCurrent) {
                                      portSetDifficulty(diff)
                                    } else {
                                      try {
                                        const key = `loom_gamification_campaign_${topic.id}`
                                        const raw = localStorage.getItem(key)
                                        const data = raw ? JSON.parse(raw) : {}
                                        localStorage.setItem(key, JSON.stringify({ ...data, difficulty: diff }))
                                      } catch {
                                        // ignore
                                      }
                                    }
                                  }}
                                  className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg transition-all flex items-center gap-1 ${
                                    isActive
                                      ? diff === 'nightmare'
                                        ? 'bg-[#ea999c] text-[#232634] shadow-md scale-105'
                                        : diff === 'hard'
                                        ? 'bg-[#ef9f76] text-[#232634] shadow-md scale-105'
                                        : diff === 'normal'
                                        ? 'bg-[#8caaee] text-[#232634] shadow-md scale-105'
                                        : 'bg-[#a6d189] text-[#232634] shadow-md scale-105'
                                      : 'bg-[#303446] hover:bg-[#414559] text-[#a5adce]'
                                  }`}
                                >
                                  <span>{conf.icon}</span>
                                  <span className="capitalize">{diff}</span>
                                </button>

                                {/* Rich Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tier:flex flex-col w-48 sm:w-52 p-2 sm:p-2.5 bg-[#181825] border border-[#414559] rounded-xl shadow-2xl z-50 text-left pointer-events-none">
                                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#b5bfe2]">
                                    <span>{conf.icon}</span>
                                    <span>{conf.label}</span>
                                  </div>
                                  <p className="text-[10px] text-[#a5adce] mt-0.5 leading-tight">
                                    {conf.description}
                                  </p>
                                  <div className="mt-1.5 pt-1.5 border-t border-[#414559]/50 space-y-0.5 text-[9px] font-mono">
                                    <div className="flex justify-between text-[#e78284]">
                                      <span>Damage:</span>
                                      <span>{conf.damageMultiplier}x</span>
                                    </div>
                                    <div className="flex justify-between text-[#a6d189]">
                                      <span>EXP Reward:</span>
                                      <span>{conf.expBonusMultiplier}x</span>
                                    </div>
                                    <div className="flex justify-between text-[#ef9f76]">
                                      <span>Chaos Speed:</span>
                                      <span>{conf.chaosMultiplier}x</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1.5">
                    <Button
                      className="flex-1 bg-gradient-to-r from-[#8caaee] to-[#a6d189] hover:opacity-90 text-[#232634] font-bold text-xs sm:text-sm py-2 sm:py-2.5 shadow-lg flex items-center justify-center gap-1.5"
                      onClick={() => handleSelectTopic(topic.id)}
                    >
                      <Play size={14} fill="currentColor" />
                      <span>{clearedCount > 0 ? 'Resume Campaign' : 'Start Campaign'}</span>
                    </Button>
                    {clearedCount > 0 && (
                      <Button
                        variant="ghost"
                        className="border border-[#e78284]/30 hover:bg-[#e78284]/10 text-[#e78284] text-xs px-2.5 py-2 sm:py-2.5 h-auto"
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
          <div className="p-2 text-[#c6d0f5] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-[#b5bfe2]">🏆 Unlocked Topic Achievements</h3>
              <Badge variant="secondary" className="text-xs">
                {globalChar.unlockedBadges.length} Total Badges
              </Badge>
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

            <div className="flex items-center justify-between pt-3 border-t border-[#414559]">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="border border-[#8caaee]/40 hover:bg-[#8caaee]/20 text-[#8caaee] text-[10px] sm:text-xs h-7 px-2.5"
                  onClick={() => {
                    const now = new Date().toISOString().split('T')[0]
                    const demoBadge: import('../types').UnlockedBadge = {
                      id: `demo-badge-${Date.now()}`,
                      badgeType: 'topic_completion',
                      title: 'Architectural Pioneer',
                      icon: '🎖️',
                      description: 'Awarded for demonstrating domain architecture mastery across realm modules.',
                      topicId: 'gamification',
                      topicTitle: 'Gamification Engine',
                      difficulty: campaign.difficulty || 'normal',
                      unlockedAt: now,
                    }
                    portUnlockBadge(demoBadge)
                  }}
                  title="Inject a demo badge into local storage"
                >
                  + Add Demo Badge (Local)
                </Button>

                {globalChar.unlockedBadges.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="border border-[#e78284]/30 hover:bg-[#e78284]/10 text-[#e78284] text-[10px] sm:text-xs h-7 px-2.5"
                    onClick={() => {
                      portClearBadges()
                    }}
                    title="Clear all unlocked badges from local storage"
                  >
                    Clear Badges
                  </Button>
                )}
              </div>

              <Button variant="ghost" onClick={() => setActiveBadgesModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>

        {/* ─── Animated Semantic Snackbar Toast (Lobby) ─── */}
        {snackbar && (
          <div
            key={snackbar.id}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex items-center justify-center max-w-[92vw] sm:max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300 ease-out"
          >
            <div
              className={`backdrop-blur-xl border text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border-l-4 transition-all duration-300 relative overflow-hidden ${
                snackbar.type === 'success'
                  ? 'bg-[#1e2e28]/95 border-[#a6d189]/60 border-l-[#a6d189] text-[#a6d189] shadow-[#a6d189]/20'
                  : snackbar.type === 'danger'
                  ? 'bg-[#312028]/95 border-[#e78284]/60 border-l-[#e78284] text-[#ea999c] shadow-[#e78284]/20'
                  : snackbar.type === 'warning'
                  ? 'bg-[#312a20]/95 border-[#ef9f76]/60 border-l-[#ef9f76] text-[#ef9f76] shadow-[#ef9f76]/20'
                  : snackbar.type === 'craft'
                  ? 'bg-[#292233]/95 border-[#ca9ee6]/60 border-l-[#ca9ee6] text-[#ca9ee6] shadow-[#ca9ee6]/20'
                  : snackbar.type === 'exp'
                  ? 'bg-[#1f2838]/95 border-[#8caaee]/60 border-l-[#8caaee] text-[#8caaee] shadow-[#8caaee]/20'
                  : 'bg-[#1e1e2e]/95 border-[#414559] border-l-[#8caaee] text-[#c6d0f5] shadow-black/40'
              }`}
            >
              <div className="w-7 h-7 rounded-xl bg-[#181825]/80 flex items-center justify-center shrink-0 text-base shadow-inner animate-pulse">
                {snackbar.icon}
              </div>
              <span className="truncate pr-1 text-[#c6d0f5]">{snackbar.text}</span>
            </div>
          </div>
        )}
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
        {/* Campaign Title & Difficulty Badge */}
        <div className="flex items-center gap-3 col-span-1 sm:col-span-2 lg:col-span-1">
          <span className="text-xl sm:text-2xl">🗺️</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold text-[#b5bfe2] truncate">{campaign.topicTitle}</h2>
              <Badge
                variant="secondary"
                className={`text-[9px] font-bold uppercase px-1.5 py-0 border ${
                  campaign.difficulty === 'nightmare'
                    ? 'bg-[#ea999c]/20 text-[#ea999c] border-[#ea999c]/40'
                    : campaign.difficulty === 'hard'
                    ? 'bg-[#ef9f76]/20 text-[#ef9f76] border-[#ef9f76]/40'
                    : campaign.difficulty === 'normal'
                    ? 'bg-[#8caaee]/20 text-[#8caaee] border-[#8caaee]/40'
                    : 'bg-[#a6d189]/20 text-[#a6d189] border-[#a6d189]/40'
                }`}
              >
                {DIFFICULTY_CONFIGS[campaign.difficulty || 'normal']?.icon} {campaign.difficulty || 'normal'}
              </Badge>
            </div>
            <span className="text-[10px] sm:text-xs text-[#a5adce] block">Topic Campaign Active</span>
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
        <div className="p-2 text-[#c6d0f5] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-[#b5bfe2]">🏆 Unlocked Topic Achievements</h3>
            <Badge variant="secondary" className="text-xs">
              {globalChar.unlockedBadges.length} Total Badges
            </Badge>
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

          <div className="flex items-center justify-between pt-3 border-t border-[#414559]">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="border border-[#8caaee]/40 hover:bg-[#8caaee]/20 text-[#8caaee] text-[10px] sm:text-xs h-7 px-2.5"
                onClick={() => {
                  const now = new Date().toISOString().split('T')[0]
                  const demoBadge: import('../types').UnlockedBadge = {
                    id: `demo-badge-${Date.now()}`,
                    badgeType: 'topic_completion',
                    title: 'Architectural Pioneer',
                    icon: '🎖️',
                    description: 'Awarded for demonstrating domain architecture mastery across realm modules.',
                    topicId: currentTopicId,
                    topicTitle: campaign.topicTitle || 'Architecture Realm',
                    difficulty: campaign.difficulty || 'normal',
                    unlockedAt: now,
                  }
                  portUnlockBadge(demoBadge)
                }}
                title="Inject a demo badge into local storage"
              >
                + Add Demo Badge (Local)
              </Button>

              {globalChar.unlockedBadges.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="border border-[#e78284]/30 hover:bg-[#e78284]/10 text-[#e78284] text-[10px] sm:text-xs h-7 px-2.5"
                  onClick={() => {
                    portClearBadges()
                  }}
                  title="Clear all unlocked badges from local storage"
                >
                  Clear Badges
                </Button>
              )}
            </div>

            <Button variant="ghost" onClick={() => setActiveBadgesModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Topic Campaign Victory Celebration Modal ─── */}
      <Modal open={topicVictoryModalOpen} onClose={() => setTopicVictoryModalOpen(false)} maxWidth="md" title="Topic Campaign Cleared!">
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
                setTopicVictoryModalOpen(false)
                handleReturnToLobby()
              }}
            >
              <ArrowLeft size={16} />
              <span>Return to Realm Lobby</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full sm:w-1/2 border border-[#414559] hover:bg-[#414559]/50 text-xs py-2.5"
              onClick={() => setTopicVictoryModalOpen(false)}
            >
              <span>Explore Realm Map</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Animated Semantic Snackbar Toast (Active Campaign) ─── */}
      {snackbar && (
        <div
          key={snackbar.id}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex items-center justify-center max-w-[92vw] sm:max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300 ease-out"
        >
          <div
            className={`backdrop-blur-xl border text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border-l-4 transition-all duration-300 relative overflow-hidden ${
              snackbar.type === 'success'
                ? 'bg-[#1e2e28]/95 border-[#a6d189]/60 border-l-[#a6d189] text-[#a6d189] shadow-[#a6d189]/20'
                : snackbar.type === 'danger'
                ? 'bg-[#312028]/95 border-[#e78284]/60 border-l-[#e78284] text-[#ea999c] shadow-[#e78284]/20'
                : snackbar.type === 'warning'
                ? 'bg-[#312a20]/95 border-[#ef9f76]/60 border-l-[#ef9f76] text-[#ef9f76] shadow-[#ef9f76]/20'
                : snackbar.type === 'craft'
                ? 'bg-[#292233]/95 border-[#ca9ee6]/60 border-l-[#ca9ee6] text-[#ca9ee6] shadow-[#ca9ee6]/20'
                : snackbar.type === 'exp'
                ? 'bg-[#1f2838]/95 border-[#8caaee]/60 border-l-[#8caaee] text-[#8caaee] shadow-[#8caaee]/20'
                : 'bg-[#1e1e2e]/95 border-[#414559] border-l-[#8caaee] text-[#c6d0f5] shadow-black/40'
            }`}
          >
            <div className="w-7 h-7 rounded-xl bg-[#181825]/80 flex items-center justify-center shrink-0 text-base shadow-inner animate-pulse">
              {snackbar.icon}
            </div>
            <span className="truncate pr-1 text-[#c6d0f5]">{snackbar.text}</span>
          </div>
        </div>
      )}

      {/* ─── Zero HP Campaign Defeat Modal ─── */}
      <Modal open={gameOverModalOpen} onClose={() => {}} maxWidth="sm" title="Campaign Defeat">
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
              onClick={handleDefeatRestart}
            >
              <RotateCcw size={16} />
              <span>Restart Topic Campaign</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
