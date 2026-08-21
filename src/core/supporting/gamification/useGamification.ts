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
          setTopicState(savedTopicState)
        } else {
          // Initialize fresh campaign state
          const initialTopicState: TopicCampaignState = {
            topicId,
            topicTitle: loadedCampaign.topicTitle,
            characterHp: 100,
            maxCharacterHp: 100,
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

  // Select node action — Repeat visits to safe havens (sanctuary or capital) generate System Chaos (+15 per repeat visit)
  const selectNode = useCallback((nodeId: string) => {
    if (!campaign) return
    const target = campaign.nodes.find((n) => n.id === nodeId)
    const isSafeHaven = target?.type === 'reading_sanctuary' || target?.type === 'capital'

    setTopicState((prev) => {
      if (!prev) return null
      const currentVisits = prev.readingVisitCounts?.[nodeId] ?? 0
      const nextVisits = currentVisits + 1

      // First time visit generates 0 Chaos. Repeat visits add +15 Chaos (enrages monsters across the realm).
      const chaosIncrement = (isSafeHaven && currentVisits >= 1) ? 15 : 0
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

    const combatResult = resolveCombatTurn(
      monster,
      globalProfile.attributes,
      isCorrect,
      topicState.activeBuffs,
      topicState.chaosLevel
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

      const nextState: TopicCampaignState = {
        ...prev,
        characterHp: nextHp,
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
      const nextState: TopicCampaignState = {
        ...prev,
        characterHp: nextHp,
      }
      characterAdapter.saveTopicCampaign(topicId, nextState)
      return nextState
    })
  }, [characterAdapter, topicId])

  // Complete node and award key items
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

      const nextState: TopicCampaignState = {
        ...prev,
        clearedNodeIds: nextCleared,
        inventory: nextInventory,
      }
      characterAdapter.saveTopicCampaign(topicId, nextState)
      return nextState
    })
  }, [campaign, characterAdapter, topicId])

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

  // Reset campaign
  const resetCampaign = useCallback(async (targetTopicId?: string) => {
    const idToReset = targetTopicId || topicId
    await characterAdapter.resetTopicCampaign(idToReset)

    if (idToReset === topicId && campaign) {
      const freshTopicState: TopicCampaignState = {
        topicId,
        topicTitle: campaign.topicTitle,
        characterHp: 100,
        maxCharacterHp: 100,
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
  }, [characterAdapter, topicId, campaign])

  return {
    campaign,
    topicState,
    globalProfile,
    isLoading,
    error,
    selectNode,
    resolveQuizAnswer,
    completeNode,
    takeDamage,
    awardExp,
    applySanctuaryTickHeal,
    applyCraftedBuff,
    allocateStatPoint,
    resetCampaign,
  }
}
