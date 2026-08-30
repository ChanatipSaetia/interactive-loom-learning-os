import { useState, useEffect, useCallback, useMemo } from 'react'
import type { GamificationRuntimePort } from './ports'
import { DIFFICULTY_CONFIGS, GAME_RULES, type DifficultyLevel } from './game-config'
import type { GlobalCharacterState, TopicCampaignState, CharacterAttributes, ActiveBuff, MonsterData, ItemReward } from './types'
import type { HexCampaignData } from '../../generic/hex-map'
import { InRepoStorageAdapter } from '../../delivery/adapters/in-repo-storage'
import { ValidationGatewayCampaignAdapter } from './adapters/validation-gateway-campaign-adapter'
import { LocalStorageCharacterAdapter } from './adapters/local-storage-character-adapter'
import {
  calculateSanctuaryTickHealing,
  resolveCombatTurn,
  calculateLevelProgress,
  evaluateTopicBadges,
  deriveStatPercentage,
} from './game-rules'
import {
  ensureFixedCampaignCoordinates,
  regenerateCampaignCoordinates,
} from './layout'


export function useGamification(
  topicId?: string | null,
  availableSectionIds?: string[]
): GamificationRuntimePort {
  const [campaign, setCampaign] = useState<HexCampaignData | null>(null)
  const [topicState, setTopicState] = useState<TopicCampaignState | null>(null)
  const [globalProfile, setGlobalProfileState] = useState<GlobalCharacterState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const storage = useMemo(() => new InRepoStorageAdapter(), [])
  const campaignAdapter = useMemo(
    () => new ValidationGatewayCampaignAdapter(storage, availableSectionIds),
    [storage, availableSectionIds]
  )
  const characterAdapter = useMemo(() => new LocalStorageCharacterAdapter(), [])

  // Load initial campaign and profiles
  useEffect(() => {
    let mounted = true

    async function init() {
      setIsLoading(true)
      setError(null)
      try {
        const profile = await characterAdapter.loadGlobalProfile()
        if (!mounted) return
        setGlobalProfileState(profile)

        // If no topic selected (Lobby mode), do not initialize or write any topic campaign
        if (!topicId) {
          setCampaign(null)
          setTopicState(null)
          return
        }

        const [loadedCampaign, savedTopicState] = await Promise.all([
          campaignAdapter.loadCampaign(topicId),
          characterAdapter.loadTopicCampaign(topicId),
        ])

        if (!mounted) return

        setGlobalProfileState(profile)
        setCampaign(loadedCampaign)

        if (savedTopicState) {
          // Ensure difficulty, damage tracking, pulses and play count are initialized
          const diff = savedTopicState.difficulty || 'normal'
          const maxPulses = DIFFICULTY_CONFIGS[diff].maxSanctuaryPulses
          let nodeCoords = savedTopicState.nodeCoordinates
          let needsSave = false
          if (loadedCampaign?.nodes && loadedCampaign.nodes.length > 0) {
            const fixedCoords = ensureFixedCampaignCoordinates(topicId, loadedCampaign.nodes, nodeCoords)
            if (!nodeCoords || Object.keys(fixedCoords).some((k) => !nodeCoords![k])) {
              nodeCoords = fixedCoords
              needsSave = true
            }
          }
          const normalized: TopicCampaignState = {
            ...savedTopicState,
            difficulty: diff,
            damageTakenInCampaign: savedTopicState.damageTakenInCampaign || 0,
            sanctuaryPulsesUsed: savedTopicState.sanctuaryPulsesUsed ?? 0,
            maxSanctuaryPulses: maxPulses,
            isStarted: savedTopicState.isStarted ?? true,
            nodeCoordinates: nodeCoords,
          }
          setTopicState(normalized)
          if (needsSave) {
            await characterAdapter.saveTopicCampaign(topicId, normalized)
          }
        } else {
          // Initialize fresh campaign state (1st play)
          const initialTopicState = createFreshCampaignState(topicId, loadedCampaign.topicTitle, 'normal', loadedCampaign.nodes)
          setTopicState(initialTopicState)
          await characterAdapter.saveTopicCampaign(topicId, initialTopicState)

          // Record new campaign start and increment topicPlayCounts in global profile
          const currentPlays = profile.topicPlayCounts?.[topicId] ?? 0
          const updatedProfile: GlobalCharacterState = {
            ...profile,
            totalCampaignsStarted: (profile.totalCampaignsStarted ?? 0) + 1,
            topicPlayCounts: {
              ...profile.topicPlayCounts,
              [topicId]: currentPlays + 1,
            },
          }
          setGlobalProfileState(updatedProfile)
          await characterAdapter.saveGlobalProfile(updatedProfile)
        }
      } catch (err: unknown) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Failed to load gamification data')
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [topicId, campaignAdapter, characterAdapter])

  // Helper to create a fresh campaign state
  const createFreshCampaignState = useCallback((
    topicId: string,
    topicTitle: string,
    difficulty: DifficultyLevel = 'normal',
    nodes?: import('./types').HexNodeData[],
    forceNewLayout: boolean = false
  ): TopicCampaignState => {
    const maxPulses = DIFFICULTY_CONFIGS[difficulty].maxSanctuaryPulses
    let nodeCoordinates: Record<string, import('./types').HexGridCoordinate> | undefined
    if (nodes && nodes.length > 0) {
      nodeCoordinates = forceNewLayout
        ? regenerateCampaignCoordinates(topicId, nodes)
        : ensureFixedCampaignCoordinates(topicId, nodes)
    }

    return {
      topicId,
      topicTitle,
      difficulty,
      characterHp: GAME_RULES.character.initialHp,
      maxCharacterHp: GAME_RULES.character.initialHp,
      damageTakenInCampaign: 0,
      turnCount: 0,
      chaosLevel: 0,
      isStarted: true,
      sanctuaryPulsesUsed: 0,
      maxSanctuaryPulses: maxPulses,
      inventory: [],
      clearedNodeIds: [],
      activeBuffs: [],
      readingVisitCounts: {},
      nodeCoordinates,
    }
  }, [])

  // Change topic campaign difficulty
  const setDifficulty = useCallback((difficulty: DifficultyLevel) => {
    if (!topicId) return
    setTopicState((prev) => {
      if (!prev) return null
      const maxPulses = DIFFICULTY_CONFIGS[difficulty].maxSanctuaryPulses
      const next = { ...prev, difficulty, maxSanctuaryPulses: maxPulses }
      characterAdapter.saveTopicCampaign(topicId, next)
      return next
    })
  }, [characterAdapter, topicId])

  // Select node action — Repeat visits to safe havens (sanctuary or capital) generate System Chaos (+15 per repeat visit)
  const selectNode = useCallback((nodeId: string) => {
    if (!campaign || !topicId) return
    const target = campaign.nodes.find((n) => n.id === nodeId)
    const isSafeHaven = target?.type === 'reading_sanctuary' || target?.type === 'capital'

    setTopicState((prev) => {
      if (!prev) return null
      const currentVisits = prev.readingVisitCounts?.[nodeId] ?? 0
      const nextVisits = currentVisits + 1

      // First time visit generates 0 Chaos. Repeat visits add Chaos scaled by difficulty
      const chaosMultiplier = DIFFICULTY_CONFIGS[prev.difficulty].chaosMultiplier
      const chaosIncrement = (isSafeHaven && currentVisits >= 1) ? Math.round(GAME_RULES.chaos.repeatVisitIncrement * chaosMultiplier) : 0
      const nextChaos = Math.min(GAME_RULES.chaos.maxLevel, prev.chaosLevel + chaosIncrement)

      const next = {
        ...prev,
        turnCount: prev.turnCount + 1,
        chaosLevel: nextChaos,
        readingVisitCounts: {
          ...prev.readingVisitCounts,
          [nodeId]: nextVisits,
        },
      }
      characterAdapter.saveTopicCampaign(topicId, next)
      return next
    })
  }, [campaign, characterAdapter, topicId])

  // Resolve quiz answer
  const resolveQuizAnswer = useCallback((isCorrect: boolean, nodeMonsterId?: string, totalQuestions?: number, dodgedOverride?: boolean) => {
    if (!topicState || !globalProfile || !campaign || !topicId) return

    const targetNode = campaign.nodes.find((n) => n.id === nodeMonsterId || n.monster?.id === nodeMonsterId)
    const currentMonsterHp = targetNode?.id && topicState.monsterHpMap?.[targetNode.id] !== undefined
      ? topicState.monsterHpMap[targetNode.id]
      : (targetNode?.monster?.currentHp ?? targetNode?.monster?.maxHp ?? GAME_RULES.combat.defaultMonsterHp)

    const monster: MonsterData = {
      id: targetNode?.monster?.id || 'default-monster',
      name: targetNode?.monster?.name || 'Corrupted Bug',
      type: targetNode?.monster?.type || 'goblin',
      maxHp: targetNode?.monster?.maxHp || GAME_RULES.combat.defaultMonsterHp,
      currentHp: currentMonsterHp,
      damage: targetNode?.monster?.damage || GAME_RULES.combat.defaultMonsterDamage,
      icon: targetNode?.monster?.icon || '👾',
    }

    const diffMultiplier = DIFFICULTY_CONFIGS[topicState.difficulty].damageMultiplier

    const combatResult = resolveCombatTurn(
      monster,
      globalProfile.attributes,
      isCorrect,
      topicState.activeBuffs,
      topicState.chaosLevel,
      diffMultiplier,
      totalQuestions,
      dodgedOverride
    )

    setTopicState((prev) => {
      if (!prev) return null
      const nextHp = Math.max(0, prev.characterHp - combatResult.playerDamageTaken)
      const nextCleared = combatResult.isMonsterDefeated && targetNode && !prev.clearedNodeIds.includes(targetNode.id)
        ? [...prev.clearedNodeIds, targetNode.id]
        : prev.clearedNodeIds

      // Update monster HP in monsterHpMap
      const nextMonsterHpMap = {
        ...(prev.monsterHpMap || {}),
        ...(targetNode?.id ? { [targetNode.id]: combatResult.updatedMonsterHp } : {}),
      }

      // Add node rewards to inventory
      let nextInventory = prev.inventory
      if (combatResult.isMonsterDefeated && targetNode?.rewards) {
        const newRewards = targetNode.rewards.filter((r: ItemReward) => !prev.inventory.some((i) => i.id === r.id))
        nextInventory = [...prev.inventory, ...newRewards]
      }
      const nextDamageTaken = (prev.damageTakenInCampaign || 0) + combatResult.playerDamageTaken
      const nextState: TopicCampaignState = {
        ...prev,
        characterHp: nextHp,
        damageTakenInCampaign: nextDamageTaken,
        clearedNodeIds: nextCleared,
        monsterHpMap: nextMonsterHpMap,
        inventory: nextInventory,
      }
      characterAdapter.saveTopicCampaign(topicId, nextState)
      return nextState
    })

    return combatResult
  }, [topicState, globalProfile, campaign, characterAdapter, topicId])

  // Apply sanctuary healing ticks (consumes from global campaign pulse pool)
  const applySanctuaryTickHeal = useCallback((activeSeconds: number, nodeId: string) => {
    if (!topicId) return
    setTopicState((prev) => {
      if (!prev || !topicId) return null
      if (prev.characterHp >= prev.maxCharacterHp) return prev
      const maxPulses = prev.maxSanctuaryPulses ?? DIFFICULTY_CONFIGS[prev.difficulty].maxSanctuaryPulses
      const currentPulsesUsed = prev.sanctuaryPulsesUsed ?? 0
      if (currentPulsesUsed >= maxPulses) return prev

      const currentVisits = prev.readingVisitCounts?.[nodeId] ?? 1
      const { effectiveHealing, nextChaosLevel } = calculateSanctuaryTickHealing(
        activeSeconds,
        currentVisits,
        prev.chaosLevel
      )

      const nextHp = Math.min(prev.maxCharacterHp, prev.characterHp + effectiveHealing)
      const nextState: TopicCampaignState = {
        ...prev,
        characterHp: nextHp,
        chaosLevel: nextChaosLevel,
        sanctuaryPulsesUsed: currentPulsesUsed + 1,
      }
      characterAdapter.saveTopicCampaign(topicId, nextState)
      return nextState
    })
  }, [characterAdapter, topicId])

  // Apply crafted buff
  const applyCraftedBuff = useCallback((buff: ActiveBuff, vulnerability?: ActiveBuff) => {
    if (!topicId) return
    setTopicState((prev) => {
      if (!prev || !topicId) return null
      const nextBuffs = [...prev.activeBuffs, buff]
      if (vulnerability) {
        nextBuffs.push(vulnerability)
      }
      const nextState: TopicCampaignState = {
        ...prev,
        activeBuffs: nextBuffs,
      }
      characterAdapter.saveTopicCampaign(topicId, nextState)
      return nextState
    })
  }, [characterAdapter, topicId])

  // Allocate character attribute points (+1 raw point per allocation)
  const allocateStatPoint = useCallback((stat: keyof CharacterAttributes) => {
    setGlobalProfileState((prev) => {
      if (!prev || prev.unallocatedPoints <= 0) return prev
      const currentPoints = prev.attributes[stat] ?? 0
      const nextProfile: GlobalCharacterState = {
        ...prev,
        unallocatedPoints: prev.unallocatedPoints - 1,
        attributes: {
          ...prev.attributes,
          [stat]: currentPoints + 1,
        },
      }
      characterAdapter.saveGlobalProfile(nextProfile)
      return nextProfile
    })
  }, [characterAdapter])

  // Take damage directly (from decryption failure, trap, or timeout)
  const takeDamage = useCallback((damage: number) => {
    if (!topicId) return
    setTopicState((prev) => {
      if (!prev || !topicId) return null
      const nextHp = Math.max(0, prev.characterHp - damage)
      const nextDamageTaken = (prev.damageTakenInCampaign || 0) + damage
      const nextState: TopicCampaignState = {
        ...prev,
        characterHp: nextHp,
        damageTakenInCampaign: nextDamageTaken,
      }
      characterAdapter.saveTopicCampaign(topicId, nextState)
      return nextState
    })
  }, [characterAdapter, topicId])

  // Complete node and award key items & check topic completion badges if Boss Lair
  const completeNode = useCallback((nodeId: string) => {
    if (!topicId || !campaign) return

    const targetNode = campaign.nodes.find((n) => n.id === nodeId)
    const isBoss = targetNode?.type === 'boss_lair'

    setTopicState((prev) => {
      if (!prev || !topicId) return null
      if (prev.clearedNodeIds.includes(nodeId)) {
        return prev
      }

      const nextCleared = [...prev.clearedNodeIds, nodeId]

      let nextInventory = prev.inventory
      if (targetNode?.rewards) {
        const newRewards = targetNode.rewards.filter((r) => !prev.inventory.some((i) => i.id === r.id))
        nextInventory = [...prev.inventory, ...newRewards]
      }

      let updatedBadges = prev.unlockedBadges || []
      if (isBoss) {
        const earned = evaluateTopicBadges(
          topicId,
          prev.topicTitle,
          prev.difficulty,
          prev.damageTakenInCampaign || 0,
          prev.activeBuffs.length > 0,
          prev.unlockedBadges || []
        )
        const currentBadgeIds = new Set(updatedBadges.map((b) => b.id))
        const uniqueEarned = earned.filter((b) => !currentBadgeIds.has(b.id))
        updatedBadges = [...updatedBadges, ...uniqueEarned]
      }

      const nextState: TopicCampaignState = {
        ...prev,
        clearedNodeIds: nextCleared,
        inventory: nextInventory,
        unlockedBadges: updatedBadges,
      }
      characterAdapter.saveTopicCampaign(topicId, nextState)
      return nextState
    })

    if (isBoss) {
      setGlobalProfileState((g) => {
        if (!g) return g
        const earned = evaluateTopicBadges(
          topicId,
          campaign.topicTitle,
          topicState?.difficulty || 'normal',
          topicState?.damageTakenInCampaign || 0,
          (topicState?.activeBuffs.length || 0) > 0,
          g.unlockedBadges || []
        )
        const existingBadgeIds = new Set(g.unlockedBadges.map((b) => b.id))
        const uniqueEarned = earned.filter((b) => !existingBadgeIds.has(b.id))

        const nextG: GlobalCharacterState = {
          ...g,
          unlockedBadges: uniqueEarned.length > 0 ? [...g.unlockedBadges, ...uniqueEarned] : g.unlockedBadges,
          totalCampaignsSucceeded: (g.totalCampaignsSucceeded ?? 0) + 1,
        }
        characterAdapter.saveGlobalProfile(nextG)
        return nextG
      })
    }
  }, [campaign, characterAdapter, topicId, topicState])

  // Award EXP upon completing all section requirements
  const awardExp = useCallback((expAmount: number) => {
    setGlobalProfileState((prev) => {
      if (!prev) return null
      const progress = calculateLevelProgress(
        prev.level,
        prev.exp,
        expAmount,
        prev.nextLevelExp,
        prev.unallocatedPoints
      )

      const nextProfile: GlobalCharacterState = {
        ...prev,
        level: progress.nextLevel,
        exp: progress.nextExp,
        nextLevelExp: progress.nextNextLevelExp,
        unallocatedPoints: progress.nextUnallocatedPoints,
      }
      characterAdapter.saveGlobalProfile(nextProfile)
      return nextProfile
    })
  }, [characterAdapter])

  // Manually unlock a badge (persisted to Global Character profile)
  const unlockBadge = useCallback((badge: import('./types').UnlockedBadge) => {
    setGlobalProfileState((prev) => {
      if (!prev) return null
      const exists = prev.unlockedBadges.some((b) => b.id === badge.id)
      if (exists) return prev
      const nextProfile: GlobalCharacterState = {
        ...prev,
        unlockedBadges: [badge, ...prev.unlockedBadges],
      }
      characterAdapter.saveGlobalProfile(nextProfile)
      return nextProfile
    })
  }, [characterAdapter])

  // Clear all unlocked badges from Global Character profile
  const clearBadges = useCallback(() => {
    setGlobalProfileState((prev) => {
      if (!prev) return null
      const nextProfile: GlobalCharacterState = {
        ...prev,
        unlockedBadges: [],
      }
      characterAdapter.saveGlobalProfile(nextProfile)
      return nextProfile
    })
  }, [characterAdapter])

  // Reset campaign (clears current campaign progress; if isNewPlay = true, increments topicPlayCounts in global profile)
  const resetCampaign = useCallback(async (targetTopicId?: string, isNewPlay: boolean = false) => {
    const idToReset = targetTopicId || topicId
    if (!idToReset) return

    await characterAdapter.resetTopicCampaign(idToReset)

    if (idToReset === topicId && topicId && campaign) {
      const chosenDiff = topicState?.difficulty || 'normal'
      const freshTopicState = createFreshCampaignState(topicId, campaign.topicTitle, chosenDiff, campaign.nodes, true)
      setTopicState(freshTopicState)
      await characterAdapter.saveTopicCampaign(topicId, freshTopicState)

      if (isNewPlay) {
        setGlobalProfileState((g) => {
          if (!g) return g
          const currentTopicPlays = g.topicPlayCounts?.[idToReset] ?? 1
          const updatedG: GlobalCharacterState = {
            ...g,
            totalCampaignsStarted: (g.totalCampaignsStarted ?? 0) + 1,
            topicPlayCounts: {
              ...g.topicPlayCounts,
              [idToReset]: currentTopicPlays + 1,
            },
          }
          characterAdapter.saveGlobalProfile(updatedG)
          return updatedG
        })
      }
    }
  }, [characterAdapter, topicId, campaign, topicState?.difficulty])

  // Set global profile directly (used when play count is incremented externally)
  const setGlobalProfile = useCallback((profile: import('./types').GlobalCharacterState) => {
    setGlobalProfileState(profile)
    characterAdapter.saveGlobalProfile(profile)
  }, [characterAdapter])

  // Derived effective percentages calculated from raw points via logarithmic curve
  const derivedStats: import('./types').DerivedCharacterStats = useMemo(() => {
    const raw = globalProfile?.attributes || { armor: 0, evasion: 0, intelligence: 0 }
    return {
      armor: deriveStatPercentage(raw.armor ?? 0),
      evasion: deriveStatPercentage(raw.evasion ?? 0),
      intelligence: deriveStatPercentage(raw.intelligence ?? 0),
    }
  }, [globalProfile?.attributes])

  return {
    campaign,
    topicState,
    globalProfile,
    derivedStats,
    isLoading,
    error,
    selectNode,
    setDifficulty,
    resolveQuizAnswer,
    completeNode,
    takeDamage,
    awardExp,
    unlockBadge,
    clearBadges,
    applySanctuaryTickHeal,
    applyCraftedBuff,
    allocateStatPoint,
    resetCampaign,
    setGlobalProfile,
  }
}
