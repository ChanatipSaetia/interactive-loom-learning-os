import { useState, useEffect, useCallback, useMemo } from 'react'
import type { GamificationRuntimePort } from './ports'
import type { GlobalCharacterState, TopicCampaignState, CharacterAttributes, ActiveBuff } from './types'
import type { HexCampaignData } from '../../generic/hex-map'
import { InRepoStorageAdapter } from '../../delivery/adapters/in-repo-storage'
import { ValidationGatewayCampaignAdapter } from './adapters/validation-gateway-campaign-adapter'
import { LocalStorageCharacterAdapter } from './adapters/local-storage-character-adapter'
import {
  calculateSanctuaryTickHealing,
  resolveCombatTurn,
  calculateLevelProgress,
  evaluateTopicBadges,
} from './game-rules'

export function useGamification(
  topicId: string,
  availableSectionIds?: string[]
): GamificationRuntimePort {
  const [campaign, setCampaign] = useState<HexCampaignData | null>(null)
  const [topicState, setTopicState] = useState<TopicCampaignState | null>(null)
  const [globalProfile, setGlobalProfile] = useState<GlobalCharacterState | null>(null)
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
        const [profile, loadedCampaign, savedTopicState] = await Promise.all([
          characterAdapter.loadGlobalProfile(),
          campaignAdapter.loadCampaign(topicId),
          characterAdapter.loadTopicCampaign(topicId),
        ])

        if (!mounted) return

        setGlobalProfile(profile)
        setCampaign(loadedCampaign)

        if (savedTopicState) {
          // Ensure difficulty and damage tracking are set on older saved states
          const normalized = {
            ...savedTopicState,
            difficulty: savedTopicState.difficulty || 'normal',
            damageTakenInCampaign: savedTopicState.damageTakenInCampaign || 0,
          }
          setTopicState(normalized)
        } else {
          // Initialize fresh campaign state
          const initialTopicState: TopicCampaignState = {
            topicId,
            topicTitle: loadedCampaign.topicTitle,
            difficulty: 'normal',
            characterHp: 100,
            maxCharacterHp: 100,
            damageTakenInCampaign: 0,
            turnCount: 0,
            chaosLevel: 0,
            maxChaosLevel: 100,
            decayThreatLevel: 0,
            inventory: [],
            clearedNodeIds: [],
            activeBuffs: [],
            readingVisitCounts: {},
          }
          setTopicState(initialTopicState)
          await characterAdapter.saveTopicCampaign(topicId, initialTopicState)
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

  // Change topic campaign difficulty
  const setDifficulty = useCallback((difficulty: import('./types').DifficultyLevel) => {
    setTopicState((prev) => {
      if (!prev) return null
      const next = { ...prev, difficulty }
      characterAdapter.saveTopicCampaign(topicId, next)
      return next
    })
  }, [characterAdapter, topicId])

  // Select node action — Repeat visits to safe havens (sanctuary or capital) generate System Chaos (+15 per repeat visit)
  const selectNode = useCallback((nodeId: string) => {
    if (!campaign) return
    const target = campaign.nodes.find((n) => n.id === nodeId)
    const isSafeHaven = target?.type === 'reading_sanctuary' || target?.type === 'capital'

    setTopicState((prev) => {
      if (!prev) return null
      const currentVisits = prev.readingVisitCounts?.[nodeId] ?? 0
      const nextVisits = currentVisits + 1

      // First time visit generates 0 Chaos. Repeat visits add +15 Chaos scaled by difficulty
      const diffMultiplier = prev.difficulty === 'easy' ? 0.5 : prev.difficulty === 'hard' ? 1.5 : prev.difficulty === 'nightmare' ? 2.0 : 1.0
      const chaosIncrement = (isSafeHaven && currentVisits >= 1) ? Math.round(15 * diffMultiplier) : 0
      const nextChaos = Math.min(prev.maxChaosLevel, prev.chaosLevel + chaosIncrement)

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
    console.debug(`Selected gamification node: ${nodeId}`)
  }, [campaign, characterAdapter, topicId])

  // Resolve quiz answer
  const resolveQuizAnswer = useCallback((isCorrect: boolean, nodeMonsterId?: string) => {
    if (!topicState || !globalProfile || !campaign) return

    const targetNode = campaign.nodes.find((n) => n.id === nodeMonsterId || n.monster?.id === nodeMonsterId)
    const monster = targetNode?.monster ?? {
      id: 'default-monster',
      name: 'Corrupted Bug',
      type: 'goblin',
      maxHp: 30,
      currentHp: 30,
      damage: 10,
      icon: '👾',
    }

    const diffMultiplier = topicState.difficulty === 'easy' ? 0.7 : topicState.difficulty === 'hard' ? 1.5 : topicState.difficulty === 'nightmare' ? 2.0 : 1.0

    const combatResult = resolveCombatTurn(
      monster,
      globalProfile.attributes,
      isCorrect,
      topicState.activeBuffs,
      topicState.chaosLevel,
      diffMultiplier
    )

    setTopicState((prev) => {
      if (!prev) return null
      const nextHp = Math.max(0, prev.characterHp - combatResult.playerDamageTaken)
      const nextCleared = combatResult.isMonsterDefeated && targetNode && !prev.clearedNodeIds.includes(targetNode.id)
        ? [...prev.clearedNodeIds, targetNode.id]
        : prev.clearedNodeIds

      // Add node rewards to inventory
      let nextInventory = prev.inventory
      if (combatResult.isMonsterDefeated && targetNode?.rewards) {
        const newRewards = targetNode.rewards.filter((r) => !prev.inventory.some((i) => i.id === r.id))
        nextInventory = [...prev.inventory, ...newRewards]
      }
      const nextDamageTaken = (prev.damageTakenInCampaign || 0) + combatResult.playerDamageTaken
      const nextState: TopicCampaignState = {
        ...prev,
        characterHp: nextHp,
        damageTakenInCampaign: nextDamageTaken,
        clearedNodeIds: nextCleared,
        inventory: nextInventory,
      }
      characterAdapter.saveTopicCampaign(topicId, nextState)
      return nextState
    })
  }, [topicState, globalProfile, campaign, characterAdapter, topicId])

  // Apply sanctuary healing ticks
  const applySanctuaryTickHeal = useCallback((activeSeconds: number, nodeId: string) => {
    setTopicState((prev) => {
      if (!prev) return null
      const currentVisits = prev.readingVisitCounts?.[nodeId] ?? 0
      const nextVisits = currentVisits + 1
      const { effectiveHealing, nextChaosLevel } = calculateSanctuaryTickHealing(
        activeSeconds,
        nextVisits,
        prev.chaosLevel
      )

      const nextHp = Math.min(prev.maxCharacterHp, prev.characterHp + effectiveHealing)
      const nextState: TopicCampaignState = {
        ...prev,
        characterHp: nextHp,
        chaosLevel: nextChaosLevel,
        readingVisitCounts: {
          ...prev.readingVisitCounts,
          [nodeId]: nextVisits,
        },
      }
      characterAdapter.saveTopicCampaign(topicId, nextState)
      return nextState
    })
  }, [characterAdapter, topicId])

  // Apply crafted buff
  const applyCraftedBuff = useCallback((buff: ActiveBuff, vulnerability?: ActiveBuff) => {
    setTopicState((prev) => {
      if (!prev) return null
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

  // Allocate character attribute points
  const allocateStatPoint = useCallback((stat: keyof CharacterAttributes) => {
    setGlobalProfile((prev) => {
      if (!prev || prev.unallocatedPoints <= 0) return prev
      const nextProfile: GlobalCharacterState = {
        ...prev,
        unallocatedPoints: prev.unallocatedPoints - 1,
        attributes: {
          ...prev.attributes,
          [stat]: prev.attributes[stat] + (stat === 'evasion' ? 2 : 1),
        },
      }
      characterAdapter.saveGlobalProfile(nextProfile)
      return nextProfile
    })
  }, [characterAdapter])

  // Take damage directly (from decryption failure, trap, or timeout)
  const takeDamage = useCallback((damage: number) => {
    setTopicState((prev) => {
      if (!prev) return null
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
    setTopicState((prev) => {
      if (!prev || !campaign) return prev
      const targetNode = campaign.nodes.find((n) => n.id === nodeId)
      const nextCleared = !prev.clearedNodeIds.includes(nodeId)
        ? [...prev.clearedNodeIds, nodeId]
        : prev.clearedNodeIds

      let nextInventory = prev.inventory
      if (targetNode?.rewards) {
        const newRewards = targetNode.rewards.filter((r) => !prev.inventory.some((i) => i.id === r.id))
        nextInventory = [...prev.inventory, ...newRewards]
      }

      // If Boss Lair is defeated, evaluate topic badges
      let updatedBadges = prev.unlockedBadges || []
      if (targetNode?.type === 'boss_lair') {
        const earned = evaluateTopicBadges(
          topicId,
          prev.topicTitle,
          prev.difficulty,
          prev.damageTakenInCampaign || 0,
          prev.activeBuffs.length > 0,
          globalProfile?.unlockedBadges || []
        )
        if (earned.length > 0) {
          updatedBadges = [...updatedBadges, ...earned]
          setGlobalProfile((g) => {
            if (!g) return g
            const nextG = {
              ...g,
              unlockedBadges: [...g.unlockedBadges, ...earned],
            }
            characterAdapter.saveGlobalProfile(nextG)
            return nextG
          })
        }
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
  }, [campaign, characterAdapter, topicId, globalProfile])

  // Award EXP upon completing all section requirements
  const awardExp = useCallback((expAmount: number) => {
    setGlobalProfile((prev) => {
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
    setGlobalProfile((prev) => {
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
    setGlobalProfile((prev) => {
      if (!prev) return null
      const nextProfile: GlobalCharacterState = {
        ...prev,
        unlockedBadges: [],
      }
      characterAdapter.saveGlobalProfile(nextProfile)
      return nextProfile
    })
  }, [characterAdapter])

  // Reset campaign
  const resetCampaign = useCallback(async (targetTopicId?: string) => {
    const idToReset = targetTopicId || topicId
    await characterAdapter.resetTopicCampaign(idToReset)

    if (idToReset === topicId && campaign) {
      const freshTopicState: TopicCampaignState = {
        topicId,
        topicTitle: campaign.topicTitle,
        difficulty: topicState?.difficulty || 'normal',
        characterHp: 100,
        maxCharacterHp: 100,
        damageTakenInCampaign: 0,
        turnCount: 0,
        chaosLevel: 0,
        maxChaosLevel: 100,
        decayThreatLevel: 0,
        inventory: [],
        clearedNodeIds: [],
        activeBuffs: [],
        readingVisitCounts: {},
      }
      setTopicState(freshTopicState)
      await characterAdapter.saveTopicCampaign(topicId, freshTopicState)
    }
  }, [characterAdapter, topicId, campaign, topicState?.difficulty])

  return {
    campaign,
    topicState,
    globalProfile,
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
  }
}
