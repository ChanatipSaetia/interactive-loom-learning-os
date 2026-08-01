import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { RotateCcw, ArrowRight, ChevronRight, ThumbsUp } from 'lucide-react'
import type { OKFDecisionTreeNode, OKFDecisionTreeChoice } from '../../../../composition/okf/types'
import { Button } from '../../../../../ui-system/motion/button'
import { useSound } from '../../../../../ui-system/sensory/SoundContext'
import { SectionTitleBar } from '../../../../../delivery/web-app-shell/SectionTitleBar'
import { DecisionTreeHelpModal } from './DecisionTreeHelpModal'
import './decision-tree.css'

export interface DecisionTreeSectionProps {
  id?: string
  title?: string
  root?: string
  nodes?: Record<string, OKFDecisionTreeNode>
  sectionIndex?: number
}

type HistoryEntry = { nodeId: string; choiceId?: string }

function Breadcrumb({ path, nodeTitles, stepIndex }: { path: HistoryEntry[]; nodeTitles: Map<string, string>; stepIndex: number }) {
  return (
    <div className="dt-breadcrumb" data-testid="dt-breadcrumb">
      {path.map((entry, idx) => {
        const title = nodeTitles.get(entry.nodeId) ?? entry.nodeId
        const isLast = idx === path.length - 1
        const displayTitle = isLast ? title : title.length > 20 ? title.slice(0, 20) + '…' : title
        return (
          <div key={`${entry.nodeId}-${idx}`} className="dt-breadcrumb-item">
            {idx > 0 && <ChevronRight className="dt-breadcrumb-arrow" />}
            <span
              className={`dt-breadcrumb-label ${isLast ? 'dt-breadcrumb-label-active' : ''}`}
              data-testid={`dt-breadcrumb-step-${idx}`}
            >
              {idx === stepIndex && !isLast ? (
                <span className="dt-breadcrumb-step-num">{stepIndex + 1}</span>
              ) : (
                <span className="dt-breadcrumb-check">{idx < stepIndex ? '✓' : ''}</span>
              )}
              {displayTitle}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function LeafDisplay({ node, onReset }: { node: OKFDecisionTreeNode; onReset: () => void }) {
  if (!node.leaf) return null

  return (
    <motion.div
      className="dt-leaf"
      data-testid="dt-leaf"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className="dt-leaf-card">
        <div className="dt-leaf-header">
          <div className="dt-leaf-icon" data-testid="dt-leaf-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h4 className="dt-leaf-heading" data-testid="dt-leaf-heading">
            Recommendation
          </h4>
        </div>

        <div className="dt-leaf-body">
          <div className="dt-leaf-recommendation">
            <p className="dt-leaf-rec-text" data-testid="dt-leaf-recommendation">
              {node.leaf.recommendation}
            </p>
          </div>

          {node.leaf.explanation && (
            <div className="dt-leaf-explanation">
              <span className="dt-leaf-block-label">Explanation</span>
              <p className="dt-leaf-block-text" data-testid="dt-leaf-explanation">
                {node.leaf.explanation}
              </p>
            </div>
          )}

          {node.leaf.tradeoffs && node.leaf.tradeoffs.length > 0 && (
            <div className="dt-leaf-tradeoffs">
              <span className="dt-leaf-block-label">Trade-offs</span>
              <ul className="dt-leaf-tradeoff-list" data-testid="dt-leaf-tradeoffs">
                {node.leaf.tradeoffs.map((t, idx) => (
                  <li key={idx} className="dt-leaf-tradeoff-item" data-testid={`dt-leaf-tradeoff-${idx}`}>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="dt-leaf-footer">
          <Button
            className="dt-reset-btn"
            data-testid="dt-reset-btn"
            onClick={onReset}
          >
            <RotateCcw className="dt-reset-icon" />
            Restart Advisor
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

function ChoiceButton({
  choice,
  index,
  onClick,
}: {
  choice: OKFDecisionTreeChoice
  index: number
  onClick: () => void
}) {
  const optionLetter = String.fromCharCode(65 + index)

  return (
    <motion.div
      key={choice.id}
      className={`dt-choice ${choice.recommended ? 'dt-choice-recommended' : ''}`}
      data-testid={`dt-choice-${choice.id}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className="dt-choice-badge" aria-hidden="true">
        {optionLetter}
      </div>
      <div className="dt-choice-content">
        <span className="dt-choice-label">
          {choice.text}
          {choice.recommended && (
            <span className="dt-recommended-badge" data-testid={`dt-recommended-${choice.id}`}>
              <ThumbsUp className="dt-recommended-icon" />
              Recommended
            </span>
          )}
        </span>
        {choice.rationale && (
          <span className="dt-choice-desc" data-testid={`dt-rationale-${choice.id}`}>{choice.rationale}</span>
        )}
      </div>
      <ArrowRight className="dt-choice-arrow" />
    </motion.div>
  )
}

function DecisionDisplay({
  node,
  path,
  nodeTitles,
  onChoose,
  stepIndex,
}: {
  node: OKFDecisionTreeNode
  path: HistoryEntry[]
  nodeTitles: Map<string, string>
  onChoose: (choiceId: string, nextId: string) => void
  stepIndex: number
}) {
  return (
    <div>
      {path.length > 1 && (
        <Breadcrumb path={path} nodeTitles={nodeTitles} stepIndex={stepIndex - 1} />
      )}

      <motion.div
        className="dt-decision"
        data-testid="dt-decision"
        key={node.id}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="dt-decision-header">
          <span className="dt-step-counter" data-testid="dt-step-counter">
            Step {path.length}
          </span>
        </div>

        <h4 className="dt-decision-prompt" data-testid="dt-decision-prompt">
          {node.prompt}
        </h4>

        <div className="dt-choices" data-testid="dt-choices">
          {node.choices?.map((choice, idx) => (
            <ChoiceButton
              key={choice.id ?? idx}
              choice={choice}
              index={idx}
              onClick={() => onChoose(choice.id ?? '', choice.next ?? '')}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function IntroDisplay({ title, onStart }: { title?: string; onStart: () => void }) {
  return (
    <motion.div
      className="dt-intro"
      data-testid="dt-intro"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className="dt-intro-card">
        <div className="dt-intro-header">
          <div className="dt-intro-icon" data-testid="dt-intro-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 3h5v5" />
              <path d="M8 3H3v5" />
              <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
              <path d="M21 3l-7.872 7.872A4 4 0 0 0 12 13.7V22" />
            </svg>
          </div>
          {title && (
            <h3 className="dt-intro-title" data-testid="dt-intro-title">
              {title}
            </h3>
          )}
        </div>
        <p className="dt-intro-text" data-testid="dt-intro-text">
          Interactive diagnostic advisor. Answer questions step-by-step to arrive at an architectural recommendation.
        </p>
        <Button
          className="dt-start-btn"
          data-testid="dt-start-btn"
          onClick={onStart}
        >
          Start Diagnosis
          <ArrowRight className="dt-btn-arrow" />
        </Button>
      </div>
    </motion.div>
  )
}

export default function DecisionTreeSection({
  title,
  root = 'root',
  nodes = {},
  sectionIndex = 0,
}: DecisionTreeSectionProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'leaf'>('intro')
  const [currentNodeId, setCurrentNodeId] = useState(root)
  const [history, setHistory] = useState<HistoryEntry[]>([{ nodeId: root }])
  const { playSound } = useSound()

  const currentNode = nodes[currentNodeId]

  const nodeTitles = useMemo(() => {
    const titles = new Map<string, string>()
    for (const node of Object.values(nodes)) {
      if (node.id) {
        titles.set(node.id, node.prompt ?? node.id)
      }
    }
    return titles
  }, [nodes])

  const isLeaf = useMemo(() => {
    return currentNode?.leaf !== undefined && currentNode.choices === undefined
  }, [currentNode])

  const handleStart = useCallback(() => {
    playSound('stepNext')
    setPhase('playing')
  }, [playSound])

  const handleChoose = useCallback((choiceId: string, nextId: string) => {
    setHistory((prev) => [...prev, { nodeId: nextId, choiceId }])
    const nextNode = nodes[nextId]
    if (nextNode?.leaf && !nextNode.choices) {
      playSound('success')
      setCurrentNodeId(nextId)
      setPhase('leaf')
    } else {
      playSound('click')
      setCurrentNodeId(nextId)
    }
  }, [nodes, playSound])

  const handleReset = useCallback(() => {
    playSound('click')
    setPhase('intro')
    setCurrentNodeId(root)
    setHistory([{ nodeId: root }])
  }, [root, playSound])

  if (Object.keys(nodes).length === 0) {
    return <div className="p-8 text-center text-muted-foreground font-mono text-sm">No decision tree data provided.</div>
  }

  return (
    <div className="dt-section" data-testid="dt-section">
      <SectionTitleBar title={title} sectionIndex={sectionIndex} HelpModal={DecisionTreeHelpModal} titleTestId="dt-title" />

      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <IntroDisplay
            key="intro"
            title={title}
            onStart={handleStart}
          />
        )}

        {phase === 'playing' && currentNode && !isLeaf && (
          <DecisionDisplay
            key={`decision-${currentNodeId}`}
            node={currentNode}
            path={history}
            nodeTitles={nodeTitles}
            onChoose={handleChoose}
            stepIndex={history.length}
          />
        )}

        {(phase === 'leaf' || (phase === 'playing' && isLeaf)) && currentNode && (
          <div>
            {history.length > 1 && phase === 'leaf' && (
              <Breadcrumb path={history} nodeTitles={nodeTitles} stepIndex={history.length - 1} />
            )}
            <LeafDisplay
              key={`leaf-${currentNodeId}`}
              node={currentNode}
              onReset={handleReset}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
