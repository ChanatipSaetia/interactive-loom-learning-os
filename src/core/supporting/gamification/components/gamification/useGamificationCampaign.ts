import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import type { HexNodeData, UnlockedBadge, DerivedCharacterStats } from '../../types'
import { DIFFICULTY_CONFIGS, GAME_RULES, type DifficultyLevel } from '../../game-config'
import {
  canUnlockBoss,
  evaluateNodeUnlocks,
  resolveTimedReflectionDecryption,
  evaluateTopicBadges,
  deriveStatPercentage,
  deriveHexTypeFromSectionType,
} from '../../game-rules'
import {
  ensureFixedCampaignCoordinates,
} from '../../layout'
import { useGamification } from '../../useGamification'
import { LocalStorageCharacterAdapter } from '../../adapters/local-storage-character-adapter'
import { useOKFBundled, bundleToSections } from '../../../../learning-engine/composition/okf/sections'
import { useTopics } from '../../../../learning-engine/composition/routes'

// Known hexmap topics available in public/hexmaps/
export const KNOWN_HEXMAP_TOPIC_IDS = ['gamification', 'demo', 'system-design', 'pixijs', 'pixijs-filters', 'world-history']

export type SnackbarType = 'success' | 'danger' | 'warning' | 'info' | 'craft' | 'exp'

export interface SnackbarItem {
  id: number
  text: string
  type: SnackbarType
  icon: string
}

export function useGamificationCampaign() {
  const { topicId: routeTopicId } = useParams<{ topicId?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryTopicId = searchParams.get('topic')

  const initialTopicId = routeTopicId || queryTopicId || null
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(initialTopicId)
  const { topics } = useTopics()
  const characterAdapter = useMemo(() => new LocalStorageCharacterAdapter(), [])

  // Keep state in sync if URL changes
  useEffect(() => {
    if (routeTopicId) {
      setSelectedTopicId(routeTopicId)
    } else if (queryTopicId) {
      setSelectedTopicId(queryTopicId)
    }
  }, [routeTopicId, queryTopicId])

  // Filter topics that have an active hexmap
  const hexmapTopics = useMemo(() => {
    return topics.filter((t) => KNOWN_HEXMAP_TOPIC_IDS.includes(t.id))
  }, [topics])

  // Active topic ID is selectedTopicId (or null when in lobby)
  const currentTopicId = selectedTopicId

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

  const handleSelectTopic = async (topicId: string) => {
    // Check if campaign already exists and has started
    const raw = localStorage.getItem(`loom_gamification_campaign_${topicId}`)
    const hasStarted = raw ? (() => {
      try {
        const parsed = JSON.parse(raw)
        return parsed.isStarted === true || (Array.isArray(parsed.clearedNodeIds) && parsed.clearedNodeIds.length > 0)
      } catch {
        return false
      }
    })() : false

    // Only reset when starting a new campaign (no existing saved state)
    if (!hasStarted) {
      const chosenDiff = topicDifficulties[topicId] || 'normal'
      const maxPulses = DIFFICULTY_CONFIGS[chosenDiff].maxSanctuaryPulses
      localStorage.setItem(
        `loom_gamification_campaign_${topicId}`,
        JSON.stringify({
          topicId,
          difficulty: chosenDiff,
          maxSanctuaryPulses: maxPulses,
          characterHp: GAME_RULES.character.initialHp,
          maxCharacterHp: GAME_RULES.character.initialHp,
          damageTakenInCampaign: 0,
          turnCount: 0,
          chaosLevel: 0,
          isStarted: true,
          sanctuaryPulsesUsed: 0,
          inventory: [],
          clearedNodeIds: [],
          activeBuffs: [],
          readingVisitCounts: {},
          nodeCoordinates: undefined, // Fresh layout will be procedurally generated
        })
      )

      // Increment play count in global profile
      const profile = await characterAdapter.loadGlobalProfile()
      if (profile) {
        const currentPlays = profile.topicPlayCounts?.[topicId] ?? 0
        const updatedProfile = {
          ...profile,
          totalCampaignsStarted: (profile.totalCampaignsStarted ?? 0) + 1,
          topicPlayCounts: {
            ...profile.topicPlayCounts,
            [topicId]: currentPlays + 1,
          },
        }
        portSetGlobalProfile(updatedProfile)
      }
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
    applySanctuaryTickHeal: portApplySanctuaryTickHeal,
    applyCraftedBuff: portApplyCraftedBuff,
    allocateStatPoint: portAllocateStatPoint,
    resetCampaign: portResetCampaign,
    setGlobalProfile: portSetGlobalProfile,
  } = useGamification(currentTopicId)

  // Load real OKF bundle for current topic
  const { bundle: okfBundle } = useOKFBundled(currentTopicId)
  const bundleSectionsMap = useMemo(() => {
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
  // Automatically derives visual hex type from corresponding OKF section type if not explicitly distinct
  useEffect(() => {
    if (liveCampaign?.nodes && liveCampaign.nodes.length > 0) {
      const topicKey = currentTopicId || liveCampaign.topicId || 'default'
      const fixedCoords = ensureFixedCampaignCoordinates(
        topicKey,
        liveCampaign.nodes,
        campaign?.nodeCoordinates
      )
      const mergedNodes = liveCampaign.nodes.map((n) => {
        const secConfig = n.sectionRef ? bundleSectionsMap.get(n.sectionRef) : undefined
        const effectiveType = deriveHexTypeFromSectionType(secConfig?.type, n.type)
        const baseNode: HexNodeData = {
          ...n,
          type: effectiveType,
          sectionType: secConfig?.type || undefined,
          coordinates: fixedCoords[n.id] || n.coordinates,
        }



        if (campaign?.clearedNodeIds.includes(n.id)) {
          return { ...baseNode, status: 'cleared' as const }
        }
        return baseNode
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
  }, [liveCampaign, campaign?.clearedNodeIds, campaign?.nodeCoordinates, bundleSectionsMap, currentTopicId])


  // Active Section Modal & Instance Key for Retry / Re-encounter
  const [activeSectionModal, setActiveSectionModal] = useState<HexNodeData | null>(null)
  const [activeBadgesModal, setActiveBadgesModal] = useState<boolean>(false)
  const [gameOverModalOpen, setGameOverModalOpen] = useState<boolean>(false)
  const [topicVictoryModalOpen, setTopicVictoryModalOpen] = useState<boolean>(false)
  const [earnedVictoryBadges, setEarnedVictoryBadges] = useState<UnlockedBadge[]>([])
  const [combatLog, setCombatLog] = useState<string[]>([])
  const [snackbars, setSnackbars] = useState<SnackbarItem[]>([])
  const [quizAttemptKey, setQuizAttemptKey] = useState<number>(0)
  const [quizFailed, setQuizFailed] = useState<boolean>(false)
  const [activeTradeoffMetrics, setActiveTradeoffMetrics] = useState<Array<{ id: string; label: string; value: number }>>([])

  // Calculate dynamically derived campaign starts strictly as the sum of global topicPlayCounts
  const derivedCampaignsStarted = useMemo(() => {
    if (!globalChar?.topicPlayCounts) return 0
    return Object.values(globalChar.topicPlayCounts).reduce((acc, count) => acc + count, 0)
  }, [globalChar?.topicPlayCounts])

  // Derive effective percentages from raw point attributes using logarithmic scaling
  const derivedStats: DerivedCharacterStats = useMemo(() => {
    const raw = globalChar?.attributes || { armor: 0, evasion: 0, intelligence: 0 }
    return {
      armor: deriveStatPercentage(raw.armor ?? 0),
      evasion: deriveStatPercentage(raw.evasion ?? 0),
      intelligence: deriveStatPercentage(raw.intelligence ?? 0),
    }
  }, [globalChar?.attributes])

  // Helper to push action messages with semantic colors & icons to both combatLog and bottom-center Snackbar Toast
  const pushActionMessage = useCallback((
    text: string,
    type: SnackbarType = 'info',
    icon: string = '⚡'
  ) => {
    setCombatLog((prev) => [text, ...prev])
    const newId = Date.now() + Math.random()
    setSnackbars((prev) => {
      const updated = [...prev, { id: newId, text, type, icon }]
      return updated.slice(-4) // Keep up to 4 latest stacked snackbars
    })

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setSnackbars((prev) => prev.filter((item) => item.id !== newId))
    }, 4000)
  }, [])

  // Check for Zero HP Defeat condition
  useEffect(() => {
    if (campaign && campaign.characterHp <= 0 && !gameOverModalOpen) {
      setActiveSectionModal(null)
      setGameOverModalOpen(true)
    }
  }, [campaign?.characterHp, gameOverModalOpen])

  // Restart campaign on Zero HP defeat (starts new play attempt)
  const handleDefeatRestart = async () => {
    await portResetCampaign(currentTopicId || undefined, true)
    setGameOverModalOpen(false)
    pushActionMessage(
      `CAMPAIGN DEFEAT: Health dropped to 0! Campaign reset to Capital for a fresh attempt.`,
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
      `Entered ${node.title} [${node.type.toUpperCase()}]. Active Section Evaluation started!`,
      'info',
      '🎮'
    )
  }

  // Allocate Attribute Point
  const handleAllocateStat = (stat: 'armor' | 'evasion' | 'intelligence') => {
    portAllocateStatPoint(stat)
    pushActionMessage(`Upgraded ${stat.toUpperCase()}! Stat increased!`, 'success', '✨')
  }

  // Quiz Combat Result Execution
  const handleQuizAnswerCombat = (isCorrect: boolean, totalQuestions?: number, dodgedOverride?: boolean) => {
    if (!selectedNode || !selectedNode.monster) return undefined
    return portResolveQuizAnswer(isCorrect, selectedNode.id, totalQuestions, dodgedOverride)
  }

  // Healing Sanctuary Action with Chaos Healing Decay
  const handleRestSanctuary = useCallback((seconds: number = 10) => {
    if (!selectedNode) return
    portApplySanctuaryTickHeal(seconds, selectedNode.id)
    pushActionMessage(`Sanctuary Rested! Restored character HP through active reading.`, 'success', '🏛️')
  }, [selectedNode, portApplySanctuaryTickHeal, pushActionMessage])

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
      `Synthesized Artifact "${buffData.source}": +${buffData.value}% ${buffData.stat.toUpperCase()} equipped!`,
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
      pushActionMessage(`COLLECTED ITEM REWARD: ${reward.name}!`, 'warning', reward.icon || '🎁')
    }

    // EXP rewards by node type (scaled by difficulty EXP bonus)
    const { default: defaultExp, reading, encounter, boss } = GAME_RULES.xp.nodeRewards
    let baseExp: number = defaultExp
    if (targetNode.type === 'reading_sanctuary' || targetNode.type === 'capital') {
      baseExp = reading
    } else if (targetNode.type === 'quiz_encounter' || targetNode.type === 'reflection_decryption' || targetNode.type === 'tradeoff_workshop') {
      baseExp = encounter
    } else if (targetNode.type === 'boss_lair') {
      baseExp = boss
    }

    const currentDiff = campaign?.difficulty || 'normal'
    const expMultiplier = DIFFICULTY_CONFIGS[currentDiff].expBonusMultiplier
    const expToAward = Math.round(baseExp * expMultiplier)

    portCompleteNode(targetNode.id)
    portAwardExp(expToAward)
    pushActionMessage(
      `ENCOUNTER CLEARED: "${targetNode.title}" Completed! +${expToAward} EXP Gained (${DIFFICULTY_CONFIGS[currentDiff]?.label})!`,
      'exp',
      '🎉'
    )
    setActiveSectionModal(null)

    // Trigger Topic Victory Modal upon defeating the Boss Lair
    if (targetNode.type === 'boss_lair') {
      const newlyEarned = evaluateTopicBadges(
        currentTopicId || 'unknown',
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
  const handleFailSection = (targetNode: HexNodeData, customDamage?: number) => {
    const currentChaos = campaign?.chaosLevel ?? 0
    const currentDiff = campaign?.difficulty || 'normal'
    const diffDamageMultiplier = DIFFICULTY_CONFIGS[currentDiff].damageMultiplier
    let damage: number = GAME_RULES.failure.baseDamage

    if (typeof customDamage === 'number') {
      damage = customDamage
    } else if (targetNode.type === 'reflection_decryption') {
      const outcome = resolveTimedReflectionDecryption(false, 0, GAME_RULES.reflection.totalTimeSec, currentChaos, diffDamageMultiplier)
      damage = outcome.damagePenalty
    } else {
      const chaosMultiplier = 1 + currentChaos * GAME_RULES.combat.chaosDamageScalingPerLevel
      damage = Math.round(GAME_RULES.failure.baseDamage * chaosMultiplier * diffDamageMultiplier)
    }

    portTakeDamage(damage)
    const chaosNote = currentChaos > 0 ? ` (amplified by ${currentChaos}% System Chaos)` : ''
    pushActionMessage(
      targetNode.type === 'boss_lair'
        ? `💥 Boss Counterattack! Suffered ${damage} damage!`
        : `SECTION FAILED: "${targetNode.title}"! Suffered ${damage} damage${chaosNote} [${DIFFICULTY_CONFIGS[currentDiff]?.label}]!`,
      'danger',
      '❌'
    )
  }

  // Check Boss Unlock Criteria via domain game rule
  const bossNode = nodes.find((n) => n.type === 'boss_lair')
  const hasBossItems = campaign ? canUnlockBoss(campaign.inventory, bossNode) : false

  return {
    // Topic selection
    selectedTopicId,
    setSelectedTopicId,
    currentTopicId,
    topics,
    hexmapTopics,
    topicDifficulties,
    setTopicDifficulties,
    handleSelectTopic,
    handleReturnToLobby,
    // Gamification port state
    campaign: liveCampaign,
    topicState: campaign,
    globalChar,
    isLoading,
    error,
    portSelectNode,
    portSetDifficulty,
    portResolveQuizAnswer,
    portCompleteNode,
    portTakeDamage,
    portAwardExp,
    portApplySanctuaryTickHeal,
    portApplyCraftedBuff,
    portAllocateStatPoint,
    portResetCampaign,
    portSetGlobalProfile,
    // OKF bundle
    bundleSectionsMap,
    // Map & selection
    nodes,
    setNodes,
    selectedNode,
    setSelectedNode,
    // Modals & misc state
    activeSectionModal,
    setActiveSectionModal,
    activeBadgesModal,
    setActiveBadgesModal,
    gameOverModalOpen,
    setGameOverModalOpen,
    topicVictoryModalOpen,
    setTopicVictoryModalOpen,
    earnedVictoryBadges,
    setEarnedVictoryBadges,
    combatLog,
    setCombatLog,
    snackbars,
    setSnackbars,
    quizAttemptKey,
    setQuizAttemptKey,
    quizFailed,
    setQuizFailed,
    activeTradeoffMetrics,
    setActiveTradeoffMetrics,
    // Derived
    derivedCampaignsStarted,
    derivedStats,
    bossNode,
    hasBossItems,
    // Actions
    pushActionMessage,
    handleDefeatRestart,
    handleLaunchSection,
    handleAllocateStat,
    handleQuizAnswerCombat,
    handleRestSanctuary,
    handleCraftBuff,
    handlePassSection,
    handleFailSection,
  }
}

export type GamificationGame = ReturnType<typeof useGamificationCampaign>
