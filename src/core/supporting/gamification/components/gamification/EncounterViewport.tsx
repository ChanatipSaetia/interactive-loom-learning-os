import React, { Suspense, useState, useEffect } from 'react'
import { DIFFICULTY_CONFIGS } from '../../types'
import { Button } from '../../../../ui-system'
import { SectionRegistry } from '../../../../learning-engine/registry'
import { EncounterDrawer } from '../EncounterDrawer'
import { CombatStageHeader } from '../CombatStageHeader'
import { SanctuaryTickMonitor } from '../SanctuaryTickMonitor'
import { RunicCountdownRing } from '../RunicCountdownRing'
import { TradeoffStatPreviewBar } from '../TradeoffStatPreviewBar'
import { BossBattleArena } from '../BossBattleArena'
import type { GamificationGame } from './useGamificationCampaign'

interface EncounterViewportProps {
  game: GamificationGame
}

export const EncounterViewport: React.FC<EncounterViewportProps> = ({ game }) => {
  const node = game.activeSectionModal
  const {
    bundleSectionsMap,
    globalChar,
    topicState: campaign,
    quizAttemptKey,
    quizFailed,
    setQuizFailed,
    setQuizAttemptKey,
    setCombatLog,
    activeTradeoffMetrics,
    setActiveTradeoffMetrics,
    handleQuizAnswerCombat,
    portResolveQuizAnswer,
    pushActionMessage,
    handlePassSection,
    handleFailSection,
    handleRestSanctuary,
    handleCraftBuff,
    setActiveSectionModal,
  } = game

  const [playerAttackedTimestamp, setPlayerAttackedTimestamp] = useState<number>(0)
  const [monsterAttackedTimestamp, setMonsterAttackedTimestamp] = useState<number>(0)
  const [clearedReflectionSlots, setClearedReflectionSlots] = useState<number>(0)
  const [lastDecryptedSlot, setLastDecryptedSlot] = useState<number | undefined>(undefined)

  // Reset reflection slots when node changes
  useEffect(() => {
    setClearedReflectionSlots(0)
    setLastDecryptedSlot(undefined)
  }, [node?.id])

  if (!globalChar || !campaign) return null

  return (
    <EncounterDrawer
      node={node}
      isOpen={!!node}
      onClose={() => setActiveSectionModal(null)}
      headerWidget={
        node && (
          <>
            {/* Quiz Encounter Duel Stage Header */}
            {node.type === 'quiz_encounter' && node.monster && (
              <CombatStageHeader
                monster={{
                  ...node.monster,
                  currentHp: campaign.monsterHpMap?.[node.id] !== undefined
                    ? campaign.monsterHpMap[node.id]
                    : (node.monster.currentHp ?? node.monster.maxHp),
                }}
                playerAttributes={globalChar.attributes}
                playerHp={campaign.characterHp}
                maxPlayerHp={campaign.maxCharacterHp}
                inventory={campaign.inventory}
                playerAttackedTimestamp={playerAttackedTimestamp}
                monsterAttackedTimestamp={monsterAttackedTimestamp}
                onUseItem={(itemId) => {
                  if ((itemId === 'product-blade' || itemId === 'port-blade') && node.monster) {
                    portResolveQuizAnswer(true, node.id)
                  }
                }}
              />
            )}

            {/* Sanctuary Reading Tick Monitor */}
            {node.type === 'reading_sanctuary' && (
              <SanctuaryTickMonitor
                healingAmount={node.healingAmount ?? 40}
                visitCount={campaign.readingVisitCounts?.[node.id] ?? 1}
                chaosLevel={campaign.chaosLevel}
                pulsesUsed={campaign.sanctuaryPulsesUsed ?? 0}
                maxTicks={campaign.maxSanctuaryPulses ?? DIFFICULTY_CONFIGS[campaign.difficulty || 'normal']?.maxSanctuaryPulses ?? 5}
                onTickHeal={handleRestSanctuary}
              />
            )}

            {/* Runic Magic Countdown Ring with Dynamic Slot Progression */}
            {node.type === 'reflection_decryption' && (() => {
              const secConfig = node.sectionRef ? bundleSectionsMap.get(node.sectionRef) : null
              const totalSlots = Array.isArray(secConfig?.props?.items) && secConfig.props.items.length > 0
                ? secConfig.props.items.length
                : (Array.isArray(secConfig?.props?.solution) && secConfig.props.solution.length > 0
                  ? secConfig.props.solution.length
                  : (Array.isArray(secConfig?.props?.challenges) && secConfig.props.challenges[0]?.items?.length
                    ? secConfig.props.challenges[0].items.length
                    : 4))

              return (
                <RunicCountdownRing
                  isSolved={node.status === 'cleared'}
                  evasionBonusSeconds={globalChar.attributes.evasion}
                  intelligenceChance={globalChar.attributes.intelligence}
                  totalSlots={totalSlots}
                  clearedSlots={clearedReflectionSlots}
                  lastDecryptedSlot={lastDecryptedSlot}
                  onTimeout={() => handleFailSection(node)}
                  onStatTriggered={(stat, details) => {
                    if (stat === 'evasion') {
                      pushActionMessage(details, 'success', '💨')
                    } else {
                      pushActionMessage(details, 'craft', '💡')
                    }
                  }}
                />
              )
            })()}

            {/* Trade-off Stat Preview Bar */}
            {node.type === 'tradeoff_workshop' && (
              <TradeoffStatPreviewBar
                metrics={activeTradeoffMetrics}
                tradeoffMapping={node.tradeoffMapping}
                onForgeArtifact={handleCraftBuff}
              />
            )}
          </>
        )
      }
    >
      {node && (() => {
        const sectionConfig = node.sectionRef ? bundleSectionsMap.get(node.sectionRef) : null
        const DynamicComponent = sectionConfig ? SectionRegistry.get(sectionConfig.type) : null

        return (
          <div className="text-[#c6d0f5] space-y-6 w-full max-w-7xl mx-auto">
            {/* Dynamic Section Renderer if OKF bundle has matching sectionRef */}
            {DynamicComponent && sectionConfig ? (
              <div className="space-y-4">
                <Suspense fallback={<div className="p-8 text-center text-sm text-[#8caaee]">Loading section data...</div>}>
                  <DynamicComponent
                    key={`${node.id}-${quizAttemptKey}`}
                    {...sectionConfig.props}
                    intelligenceChance={globalChar.attributes.intelligence}
                    onEvent={(event: any) => {
                      if (event.type === 'QuizOptionSelected') {
                        const totalQuestions = Array.isArray(sectionConfig?.props?.questions)
                          ? sectionConfig.props.questions.length
                          : 2
                        const combatResult = handleQuizAnswerCombat(event.isCorrect, totalQuestions)
                        if (event.isCorrect) {
                          setMonsterAttackedTimestamp(Date.now())
                          pushActionMessage(
                            `Attack Hit! Struck ${node.monster?.name || 'Monster'} with accurate answer!`,
                            'exp',
                            '⚔️'
                          )
                        } else if (combatResult?.isDodged) {
                          pushActionMessage(
                            `Dodged! Fast Evasion speed allowed you to dodge ${node.monster?.name || 'Monster'}'s attack!`,
                            'success',
                            '💨'
                          )
                        } else {
                          setPlayerAttackedTimestamp(Date.now())
                          pushActionMessage(
                            `Attack Missed! Monster retaliated against incorrect answer!`,
                            'danger',
                            '💔'
                          )
                        }

                        // If Intelligence (Arcane Insight) triggered to reveal the answer
                        if (event.intelligenceTriggered) {
                          pushActionMessage(
                            `Arcane Insight! Intelligence revealed the correct answer!`,
                            'craft',
                            '💡'
                          )
                        }
                      }
                      if (event.type === 'ReflectionAnswered') {
                        if (event.isCorrect) {
                          const slotIdx = typeof event.challengeIndex === 'number' ? event.challengeIndex : clearedReflectionSlots
                          setLastDecryptedSlot(slotIdx)
                          setClearedReflectionSlots((prev) => Math.max(prev, slotIdx + 1))
                          pushActionMessage(
                            `Runic Rune #${slotIdx + 1} Decrypted! Magic glyph bound to sequence slot!`,
                            'success',
                            '🔮'
                          )
                        } else {
                          pushActionMessage(
                            `Runic Decryption Failed! Invalid pattern entered!`,
                            'danger',
                            '⚠️'
                          )
                        }
                      }
                      if (event.type === 'ReflectionCompleted') {
                        setClearedReflectionSlots(event.totalChallenges ?? 3)
                        pushActionMessage(
                          `Runic Cipher Solved! All magic sequence slots unlocked!`,
                          'exp',
                          '✨'
                        )
                      }
                    }}
                    onResultChange={(result: any) => {
                      if (node.type === 'tradeoff_workshop' && result?.payload && typeof result.payload === 'object') {
                        const mapped = Object.entries(result.payload).map(([key, val]) => ({
                          id: key,
                          label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                          value: typeof val === 'number' ? val : 50,
                        }))
                        if (mapped.length > 0) {
                          setActiveTradeoffMetrics(mapped)
                        }
                      }
                      if (node.type === 'quiz_encounter') {
                        if (result.status === 'completed' || result.status === 'failed') {
                          const isPassing = result.status === 'completed' && (result.accuracy ?? 0) >= 1.0
                          if (isPassing) {
                            setQuizFailed(false)
                            handlePassSection(node)
                          } else {
                            setQuizFailed(true)
                            handleFailSection(node)
                          }
                        }
                      }
                      if (node.type === 'reflection_decryption') {
                        if (result.status === 'completed') {
                          handlePassSection(node)
                        } else if (result.status === 'failed') {
                          handleFailSection(node)
                        }
                      }
                    }}
                  />
                </Suspense>
                {node.type === 'reading_sanctuary' && node.status !== 'cleared' && (
                  <div className="pt-4 border-t border-[#414559] flex justify-end">
                    <Button
                      className="bg-gradient-to-r from-[#a6d189] to-[#8caaee] hover:opacity-90 text-[#232634] font-bold text-sm px-6 py-2.5 shadow-lg flex items-center gap-2"
                      onClick={() => {
                        handleRestSanctuary()
                        handlePassSection(node)
                      }}
                    >
                      <span>🏛️</span>
                      <span>Complete Reading & Attune Sanctuary (+5 XP)</span>
                    </Button>
                  </div>
                )}
                {node.type === 'capital' && node.status !== 'cleared' && (
                  <div className="pt-4 border-t border-[#414559] flex justify-end">
                    <Button
                      className="bg-gradient-to-r from-[#8caaee] to-[#a6d189] hover:opacity-90 text-[#232634] font-bold text-sm px-6 py-2.5 shadow-lg flex items-center gap-2"
                      onClick={() => handlePassSection(node)}
                    >
                      <span>📖</span>
                      <span>Complete Reading & Reveal Hex Map (+5 XP)</span>
                    </Button>
                  </div>
                )}
                {quizFailed && node.type === 'quiz_encounter' && (
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
                        setCombatLog((prev) => [`⚔️ Restarting encounter against ${node.title}! Combat reset.`, ...prev])
                      }}
                    >
                      <span>🔄</span>
                      <span>Restart Encounter</span>
                    </Button>
                  </div>
                )}
              </div>
            ) : node.type === 'boss_lair' && node.monster ? (
              /* Boss Battle Arena Climax */
              <BossBattleArena
                monster={node.monster}
                playerAttributes={globalChar.attributes}
                playerHp={campaign.characterHp}
                maxPlayerHp={campaign.maxCharacterHp}
                inventory={campaign.inventory}
                onVictory={() => handlePassSection(node)}
                onTakeDamage={() => handleFailSection(node)}
              />
            ) : (
              <div className="p-8 text-center bg-[#232634] rounded-2xl border border-[#414559]">
                <h3 className="text-lg font-bold text-[#8caaee] mb-2">{node.title}</h3>
                <p className="text-sm text-[#a5adce] mb-6">{node.description}</p>
                {node.status !== 'cleared' && (
                  <Button
                    className="bg-gradient-to-r from-[#8caaee] to-[#a6d189] hover:opacity-90 text-[#232634] font-bold text-sm px-6 py-2.5 shadow-lg"
                    onClick={() => handlePassSection(node)}
                  >
                    Complete Section (+50 XP)
                  </Button>
                )}
              </div>
            )}
          </div>
        )
      })()}
    </EncounterDrawer>
  )
}
