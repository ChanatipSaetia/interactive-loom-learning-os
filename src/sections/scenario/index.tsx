import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { RotateCcw, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import type { OKFScenarioNode, ScenarioRating } from '../../core/okf/types'
import { Button } from '../../components/motion/button'
import { useSound } from '../../context/SoundContext'
import { SectionTitleBar } from '../../components/layout/SectionTitleBar'
import { ScenarioHelpModal } from './ScenarioHelpModal'
import './scenario.css'

export interface ScenarioSectionProps {
  id?: string
  title?: string
  intro?: string
  nodes?: Record<string, OKFScenarioNode>
  startNode?: string
  sectionIndex?: number
}

const RATING_COLORS: Record<ScenarioRating, string> = {
  'a': 'var(--ctp-green)',
  'b-plus': 'var(--ctp-teal)',
  'b-minus': 'var(--ctp-yellow)',
  'c': 'var(--ctp-red)',
}

const RATING_BG: Record<ScenarioRating, string> = {
  'a': 'color-mix(in srgb, var(--ctp-green) 8%, transparent)',
  'b-plus': 'rgba(117, 191, 165, 0.08)',
  'b-minus': 'rgba(213, 199, 136, 0.08)',
  'c': 'color-mix(in srgb, var(--ctp-red) 8%, transparent)',
}

const RATING_LABELS: Record<ScenarioRating, string> = {
  'a': 'Excellent',
  'b-plus': 'Good',
  'b-minus': 'Fair',
  'c': 'Needs Improvement',
}

type HistoryEntry = { nodeId: string; choiceId?: string }

function RatingBadge({ rating }: { rating: ScenarioRating }) {
  const color = RATING_COLORS[rating]
  const label = RATING_LABELS[rating]

  return (
    <span
      className="scenario-rating-badge"
      data-testid="scenario-rating-badge"
      style={{
        backgroundColor: color,
        color: 'var(--ctp-crust)',
      }}
    >
      {label}
    </span>
  )
}

function OutcomeDisplay({ node, onRestart }: { node: OKFScenarioNode; onRestart: () => void }) {
  if (!node.outcome) return null

  return (
    <motion.div
      className="scenario-outcome"
      data-testid="scenario-outcome"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
    >
      <div
        className="scenario-outcome-card"
        style={{
          borderColor: RATING_COLORS[node.outcome.rating],
          backgroundColor: RATING_BG[node.outcome.rating],
        }}
      >
        <div className="scenario-outcome-header">
          {node.outcome.rating === 'a' || node.outcome.rating === 'b-plus' ? (
            <CheckCircle2 className="scenario-outcome-icon" data-testid="scenario-outcome-icon" />
          ) : (
            <AlertCircle className="scenario-outcome-icon" data-testid="scenario-outcome-icon" />
          )}
          <h4 className="scenario-outcome-title" data-testid="scenario-outcome-title">
            Outcome
          </h4>
          <RatingBadge rating={node.outcome.rating} />
        </div>

        <div className="scenario-outcome-body">
          <div className="scenario-outcome-block">
            <span className="scenario-outcome-block-label">What Happened</span>
            <p className="scenario-outcome-block-text" data-testid="scenario-outcome-verdict">
              {node.outcome.verdict}
            </p>
          </div>
          <div className="scenario-outcome-block">
            <span className="scenario-outcome-block-label">Key Lesson</span>
            <p className="scenario-outcome-block-text" data-testid="scenario-outcome-lesson">
              {node.outcome.lesson}
            </p>
          </div>
        </div>

        <div className="scenario-outcome-footer">
          <Button
            variant="outline"
            size="sm"
            onClick={onRestart}
            data-testid="scenario-restart-btn"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restart Scenario
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

function DecisionDisplay({
  node,
  history,
  onChoose,
  onBack,
  isLastChoice,
}: {
  node: OKFScenarioNode
  history: HistoryEntry[]
  onChoose: (choiceId: string, nextId: string) => void
  onBack: () => void
  isLastChoice: boolean
}) {
  return (
    <motion.div
      className="scenario-decision"
      data-testid="scenario-decision"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className="scenario-decision-header">
        <span className="scenario-step-counter" data-testid="scenario-step-counter">
          Step {history.length} of {isLastChoice ? history.length : '…'}
        </span>
        {history.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            data-testid="scenario-back-btn"
            className="scenario-back-btn"
          >
            Back
          </Button>
        )}
      </div>

      <h4 className="scenario-decision-prompt" data-testid="scenario-decision-prompt">
        {node.prompt}
      </h4>

      <div className="scenario-choices" data-testid="scenario-choices">
        {node.choices?.map((choice, idx) => {
          const optionLetter = String.fromCharCode(65 + idx)
          return (
            <motion.button
              key={choice.id}
              className="scenario-choice"
              data-testid={`scenario-choice-${choice.id}`}
              onClick={() => onChoose(choice.id, choice.next)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.06, ease: [0.25, 1, 0.5, 1] }}
            >
              <div className="scenario-choice-badge" aria-hidden="true">
                {optionLetter}
              </div>
              <span className="scenario-choice-text">{choice.text}</span>
              <ArrowRight className="scenario-choice-arrow" />
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

function IntroDisplay({
  title,
  intro,
  onStart,
}: {
  title?: string
  intro?: string
  onStart: () => void
}) {
  return (
    <motion.div
      className="scenario-intro"
      data-testid="scenario-intro"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className="scenario-intro-card">
        <div className="scenario-intro-header">
          <div className="scenario-intro-icon" data-testid="scenario-intro-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          {title && (
            <h3 className="scenario-intro-title" data-testid="scenario-intro-title">
              {title}
            </h3>
          )}
        </div>
        {intro && (
          <p className="scenario-intro-text" data-testid="scenario-intro-text">
            {intro}
          </p>
        )}
        <Button
          variant="primary"
          size="sm"
          onClick={onStart}
          data-testid="scenario-start-btn"
          className="scenario-start-btn"
        >
          Begin Scenario
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  )
}

export default function ScenarioSection({
  title,
  intro,
  nodes = {},
  startNode = 'start',
  sectionIndex = 0,
}: ScenarioSectionProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'outcome'>('intro')
  const [currentNodeId, setCurrentNodeId] = useState(startNode)
  const [history, setHistory] = useState<HistoryEntry[]>([{ nodeId: startNode }])
  const { playSound } = useSound()

  const currentNode = useMemo(() => nodes[currentNodeId], [nodes, currentNodeId])

  const isOutcome = useMemo(() => {
    return currentNode?.outcome !== undefined
  }, [currentNode])

  const isLastChoice = useMemo(() => {
    if (!currentNode?.choices) return false
    return currentNode.choices.every((c) => {
      const nextNode = nodes[c.next]
      return nextNode?.outcome !== undefined
    })
  }, [currentNode, nodes])

  const handleStart = useCallback(() => {
    playSound('stepNext')
    setPhase('playing')
  }, [playSound])

  const handleChoose = useCallback((choiceId: string, nextId: string) => {
    setHistory((prev) => [...prev, { nodeId: nextId, choiceId }])
    const nextNode = nodes[nextId]
    if (nextNode?.outcome) {
      if (nextNode.outcome.rating === 'a' || nextNode.outcome.rating === 'b-plus') {
        playSound('success')
      } else {
        playSound('error')
      }
      setCurrentNodeId(nextId)
      setPhase('outcome')
    } else {
      playSound('click')
      setCurrentNodeId(nextId)
    }
  }, [nodes, playSound])

  const handleBack = useCallback(() => {
    playSound('stepPrev')
    setHistory((prev) => {
      if (prev.length <= 1) return prev
      const newHistory = prev.slice(0, -1)
      const lastEntry = newHistory[newHistory.length - 1]
      setCurrentNodeId(lastEntry.nodeId)
      return newHistory
    })
  }, [playSound])

  const handleRestart = useCallback(() => {
    playSound('click')
    setPhase('intro')
    setCurrentNodeId(startNode)
    setHistory([{ nodeId: startNode }])
  }, [startNode, playSound])


  if (Object.keys(nodes).length === 0) {
    return <div className="p-8 text-center text-muted-foreground font-mono text-sm">No scenario data provided.</div>
  }

  const outcomeNode = phase === 'outcome' ? currentNode : undefined

  return (
    <div className="scenario-section" data-testid="scenario-section">
      <SectionTitleBar title={title} sectionIndex={sectionIndex} HelpModal={ScenarioHelpModal} />

      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <IntroDisplay
            key="intro"
            title={title}
            intro={intro}
            onStart={handleStart}
          />
        )}

        {phase === 'playing' && currentNode && !isOutcome && (
          <DecisionDisplay
            key={`decision-${currentNodeId}`}
            node={currentNode}
            history={history}
            onChoose={handleChoose}
            onBack={handleBack}
            isLastChoice={isLastChoice}
          />
        )}

        {phase === 'outcome' && outcomeNode && (
          <OutcomeDisplay
            key={`outcome-${currentNodeId}`}
            node={outcomeNode}
            onRestart={handleRestart}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
