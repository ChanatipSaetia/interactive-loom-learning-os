import React, { Suspense, useState, useEffect } from 'react'
import { DIFFICULTY_CONFIGS } from '../../game-config'
import { MonsterData } from '../../types'
import { isSanctuaryType } from '../../game-rules'
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
    derivedStats,
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
            {(() => {
              const secConfig = node.sectionRef ? bundleSectionsMap.get(node.sectionRef) : null
              const isQuiz =
                (node.type === 'quiz_encounter' ||
                secConfig?.type === 'quiz' ||
                node.sectionRef?.includes('quiz') ||
                node.id.includes('quiz')) &&
                node.type !== 'boss_lair'

              if (!isQuiz) return null

              const monsterData = node.monster || {
                id: `monster-${node.id}`,
                name: 'Goblin Glitch Fiend',
                icon: '👹',
                maxHp: 100,
                currentHp: 100,
                damage: 15,
                type: 'goblin' as const,
              }

              return (
                <CombatStageHeader
                  monster={{
                    ...monsterData,
                    currentHp: campaign.monsterHpMap?.[node.id] !== undefined
                      ? campaign.monsterHpMap[node.id]
                      : (monsterData.currentHp ?? monsterData.maxHp),
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
              )
            })()}

            {/* Sanctuary Reading Tick Monitor */}
            {isSanctuaryType(node.type) && (
              <SanctuaryTickMonitor
                healingAmount={node.healingAmount ?? 40}
                visitCount={campaign.readingVisitCounts?.[node.id] ?? 1}
                chaosLevel={campaign.chaosLevel}
                pulsesUsed={campaign.sanctuaryPulsesUsed ?? 0}
                maxTicks={campaign.maxSanctuaryPulses ?? DIFFICULTY_CONFIGS[campaign.difficulty || 'normal']?.maxSanctuaryPulses ?? 5}
                characterHp={campaign.characterHp}
                maxCharacterHp={campaign.maxCharacterHp}
                onTickHeal={handleRestSanctuary}
              />
            )}

            {/* Runic Magic Countdown Ring with Dynamic Slot Progression */}
            {(() => {
              const secConfig = node.sectionRef ? bundleSectionsMap.get(node.sectionRef) : null
              const isReflection =
                node.type === 'reflection_decryption' ||
                secConfig?.type === 'reflection-sequence' ||
                secConfig?.type === 'reflection-template' ||
                node.sectionRef?.includes('reflection') ||
                node.id.includes('reflection')

              if (!isReflection) return null

              // Build list of sequence challenges with their respective item/step counts
              const sequenceList = Array.isArray(secConfig?.props?.challenges) && secConfig.props.challenges.length > 0
                ? (secConfig.props.challenges as Array<{ items?: unknown[] }>).map((ch, idx: number) => ({
                    index: idx,
                    itemCount: Array.isArray(ch.items) ? ch.items.length : 4,
                    isCleared: idx < clearedReflectionSlots || node.status === 'cleared',
                  }))
                : [{
                    index: 0,
                    itemCount: Array.isArray(secConfig?.props?.items) ? secConfig.props.items.length : 4,
                    isCleared: clearedReflectionSlots > 0 || node.status === 'cleared',
                  }]

              return (
                <RunicCountdownRing
                  isSolved={node.status === 'cleared'}
                  evasionBonusSeconds={derivedStats.evasion}
                  intelligenceChance={derivedStats.intelligence}
                  sequences={sequenceList}
                  currentSequenceIndex={clearedReflectionSlots}
                  lastDecryptedSequence={lastDecryptedSlot}
                  onTimeout={() => {
                    // Apply the fail penalty, then close the encounter — otherwise the
                    // countdown just sits at 0s forever with the modal stuck open (the
                    // "Close Encounter" button closes via the same setActiveSectionModal
                    // call, so timing out should behave the same way).
                    handleFailSection(node)
                    setActiveSectionModal(null)
                  }}
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
        // Boss Lair Encounter Climax: Dedicated Key-Item Boss Battle Arena
        if (node.type === 'boss_lair') {
          const bossMonster: MonsterData = node.monster || {
            id: 'topic-boss',
            name: node.title || 'Topic Boss',
            icon: '🐲',
            maxHp: 250,
            damage: 40,
            type: 'boss',
          }

          return (
            <div className="text-[var(--ctp-text)] space-y-6 w-full max-w-7xl mx-auto">
              <BossBattleArena
                monster={bossMonster}
                playerAttributes={globalChar.attributes}
                playerHp={campaign.characterHp}
                maxPlayerHp={campaign.maxCharacterHp}
                inventory={campaign.inventory}
                onVictory={() => handlePassSection(node)}
                onTakeDamage={(dmg) => handleFailSection(node, dmg)}
              />
            </div>
          )
        }

        const sectionConfig = node.sectionRef ? bundleSectionsMap.get(node.sectionRef) : null
        const DynamicComponent = sectionConfig ? SectionRegistry.get(sectionConfig.type) : null

        return (
          <div className="text-[var(--ctp-text)] space-y-6 w-full max-w-7xl mx-auto">
            {/* Dynamic Section Renderer if OKF bundle has matching sectionRef */}
            {DynamicComponent && sectionConfig ? (
              <div className="space-y-4">
                <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--ctp-blue)]">Loading section data...</div>}>
                  <DynamicComponent
                    key={`${node.id}-${quizAttemptKey}`}
                    {...sectionConfig.props}
                    intelligenceChance={derivedStats.intelligence}
                    evadeChance={derivedStats.evasion}
                    onEvent={(event: { type?: string; isCorrect?: boolean; dodged?: boolean; intelligenceTriggered?: boolean; challengeIndex?: number; totalChallenges?: number }) => {
                      if (event.type === 'QuizOptionSelected') {
                        const totalQuestions = Array.isArray(sectionConfig?.props?.questions)
                          ? sectionConfig.props.questions.length
                          : 2
                        const combatResult = handleQuizAnswerCombat(
                          !!event.isCorrect,
                          totalQuestions,
                          event.isCorrect ? undefined : event.dodged === true
                        )
                        if (event.isCorrect) {
                          setMonsterAttackedTimestamp(Date.now())
                          pushActionMessage(
                            `Attack Hit! Struck ${node.monster?.name || 'Monster'} with accurate answer!`,
                            'exp',
                            '⚔️'
                          )
                        } else if (event.dodged || combatResult?.isDodged) {
                          pushActionMessage(
                            `Dodged! Fast Evasion speed slipped ${node.monster?.name || 'Monster'}'s counterattack — retry the question!`,
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
                    onResultChange={(result: { status?: string; accuracy?: number; payload?: Record<string, unknown> }) => {
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
                {isSanctuaryType(node.type) && node.status !== 'cleared' && (
                  <div className="pt-4 border-t border-[var(--ctp-surface1)] flex justify-end">
                    <Button
                      className="bg-gradient-to-r from-[var(--primary)] to-[color-mix(in_srgb,var(--primary)_85%,black)] hover:brightness-110 text-[var(--primary-foreground)] border border-[color-mix(in_srgb,var(--primary)_40%,transparent)] shadow-[0_4px_16px_color-mix(in_srgb,var(--primary)_35%,transparent)] font-bold text-sm px-6 py-2.5 flex items-center gap-2 transition-all"
                      onClick={() => handlePassSection(node)}
                    >
                      <span>
                        {node.type === 'reading_sanctuary' ? '🏛️' :
                         node.type === 'archive_spire' ? '📜' :
                         node.type === 'simulation_nexus' ? '⚙️' :
                         node.type === 'concept_monolith' ? '💎' :
                         node.type === 'observatory_gallery' ? '🔭' : '🏛️'}
                      </span>
                      <span>
                        Complete Reading & {
                          node.type === 'reading_sanctuary' ? 'Attune Sanctuary' :
                          node.type === 'archive_spire' ? 'Study Archives' :
                          node.type === 'simulation_nexus' ? 'Calibrate Simulation' :
                          node.type === 'concept_monolith' ? 'Attune Monolith' :
                          node.type === 'observatory_gallery' ? 'Focus Observatory' : 'Attune Sanctuary'
                        } (+5 XP)
                      </span>
                    </Button>
                  </div>
                )}
                {node.type === 'capital' && node.status !== 'cleared' && (
                  <div className="pt-4 border-t border-[var(--ctp-surface1)] flex justify-end">
                    <Button
                      className="bg-gradient-to-r from-[var(--primary)] to-[color-mix(in_srgb,var(--primary)_85%,black)] hover:brightness-110 text-[var(--primary-foreground)] border border-[color-mix(in_srgb,var(--primary)_40%,transparent)] shadow-[0_4px_16px_color-mix(in_srgb,var(--primary)_35%,transparent)] font-bold text-sm px-6 py-2.5 flex items-center gap-2 transition-all"
                      onClick={() => handlePassSection(node)}
                    >
                      <span>📖</span>
                      <span>Complete Reading & Reveal Hex Map (+5 XP)</span>
                    </Button>
                  </div>
                )}
                {quizFailed && node.type === 'quiz_encounter' && (
                  <div className="p-4 bg-[var(--ctp-surface0)] rounded-2xl border border-[var(--ctp-red)]/50 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in shadow-xl">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">👾</span>
                      <div>
                        <span className="text-sm font-bold text-[var(--ctp-red)] block">Monster Still Standing!</span>
                        <span className="text-xs text-[var(--ctp-subtext0)]">The monster was not fully defeated. Restart the battle encounter to try again.</span>
                      </div>
                    </div>
                    <Button
                      className="bg-gradient-to-r from-[var(--destructive)] to-[color-mix(in_srgb,var(--destructive)_85%,black)] hover:brightness-110 text-[var(--destructive-foreground)] border border-[color-mix(in_srgb,var(--destructive)_40%,transparent)] shadow-[0_4px_16px_color-mix(in_srgb,var(--destructive)_35%,transparent)] font-bold text-xs px-5 py-2.5 shrink-0 flex items-center gap-1.5 transition-all"
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
            ) : (
              <div className="p-8 text-center bg-[var(--ctp-surface0)] rounded-2xl border border-[var(--ctp-surface1)]">
                <h3 className="text-lg font-bold text-[var(--ctp-blue)] mb-2">{node.title}</h3>
                <p className="text-sm text-[var(--ctp-subtext0)] mb-6">{node.description}</p>
                {node.status !== 'cleared' && (
                  <Button
                    className="bg-gradient-to-r from-[var(--primary)] to-[color-mix(in_srgb,var(--primary)_85%,black)] hover:brightness-110 text-[var(--primary-foreground)] border border-[color-mix(in_srgb,var(--primary)_40%,transparent)] shadow-[0_4px_16px_color-mix(in_srgb,var(--primary)_35%,transparent)] font-bold text-sm px-6 py-2.5 transition-all"
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
