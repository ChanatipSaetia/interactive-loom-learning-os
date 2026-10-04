import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { RotateCcw, ArrowRight, ChevronRight, ThumbsUp, Undo2 } from 'lucide-react'
import type { OKFDecisionTreeNode, OKFDecisionTreeChoice } from '../../../../composition/okf/types'
import { Button } from '../../../../../ui-system/motion/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../../ui-system/motion/tabs'
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

const truncate = (text: string, max: number) => (text.length > max ? text.slice(0, max - 1) + '…' : text)

/**
 * The answers given so far, one crumb per answered question. Tapping a crumb goes back to that question
 * so the reader can pick a different answer; the last crumb names where they are now.
 */
function Breadcrumb({
  path,
  nodes,
  onBack,
}: {
  path: HistoryEntry[]
  nodes: Record<string, OKFDecisionTreeNode>
  onBack: (idx: number) => void
}) {
  const current = nodes[path[path.length - 1].nodeId]
  const currentLabel = current?.leaf && !current.choices ? 'Recommendation' : `Step ${path.length}`
  return (
    <nav className="dt-breadcrumb" data-testid="dt-breadcrumb" aria-label="Your answers">
      {path.slice(0, -1).map((entry, idx) => {
        const question = nodes[entry.nodeId]?.prompt ?? entry.nodeId
        const answerId = path[idx + 1].choiceId
        const answer = nodes[entry.nodeId]?.choices?.find((c) => c.id === answerId)?.text ?? question
        return (
          <div key={`${entry.nodeId}-${idx}`} className="dt-breadcrumb-item">
            {idx > 0 && <ChevronRight className="dt-breadcrumb-arrow" aria-hidden="true" />}
            <button
              type="button"
              className="dt-breadcrumb-label dt-breadcrumb-link"
              data-testid={`dt-breadcrumb-step-${idx}`}
              onClick={() => onBack(idx)}
              title={`${question} (tap to change your answer)`}
              aria-label={`Change answer to: ${question}. Current answer: ${answer}`}
            >
              <span className="dt-breadcrumb-check" aria-hidden="true">✓</span>
              {truncate(answer, 28)}
            </button>
          </div>
        )
      })}
      <div className="dt-breadcrumb-item">
        <ChevronRight className="dt-breadcrumb-arrow" aria-hidden="true" />
        <span
          className="dt-breadcrumb-label dt-breadcrumb-label-active"
          data-testid={`dt-breadcrumb-step-${path.length - 1}`}
          aria-current="step"
        >
          {currentLabel}
        </span>
      </div>
    </nav>
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
  isPrevious,
  onClick,
}: {
  choice: OKFDecisionTreeChoice
  index: number
  isPrevious: boolean
  onClick: () => void
}) {
  const optionLetter = String.fromCharCode(65 + index)

  return (
    <motion.div
      key={choice.id}
      className={`dt-choice ${choice.recommended ? 'dt-choice-recommended' : ''} ${isPrevious ? 'dt-choice-previous' : ''}`}
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
          {isPrevious && (
            <span className="dt-previous-badge" data-testid={`dt-previous-${choice.id}`}>
              <Undo2 className="dt-recommended-icon" />
              Your last answer
            </span>
          )}
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
  nodes,
  previousChoiceId,
  onChoose,
  onBack,
}: {
  node: OKFDecisionTreeNode
  path: HistoryEntry[]
  nodes: Record<string, OKFDecisionTreeNode>
  previousChoiceId?: string
  onChoose: (choiceId: string, nextId: string) => void
  onBack: (idx: number) => void
}) {
  return (
    <div>
      {path.length > 1 && <Breadcrumb path={path} nodes={nodes} onBack={onBack} />}

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
              isPrevious={choice.id !== undefined && choice.id === previousChoiceId}
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

const isLeafNode = (node?: OKFDecisionTreeNode) => node?.leaf !== undefined && node.choices === undefined

/** The history entries that lead from the root to `targetId`, or null when it can't be reached. */
function findPath(nodes: Record<string, OKFDecisionTreeNode>, root: string, targetId: string): HistoryEntry[] | null {
  const walk = (nodeId: string, trail: HistoryEntry[], seen: Set<string>): HistoryEntry[] | null => {
    if (nodeId === targetId) return trail
    if (seen.has(nodeId)) return null
    seen.add(nodeId)
    for (const choice of nodes[nodeId]?.choices ?? []) {
      if (!choice.next) continue
      const found = walk(choice.next, [...trail, { nodeId: choice.next, choiceId: choice.id }], seen)
      if (found) return found
    }
    return null
  }
  return walk(root, [{ nodeId: root }], new Set())
}

/**
 * Every question, answer and recommendation as an indented tree. The reader's current path is highlighted;
 * tapping a question or recommendation jumps there in the step-by-step view.
 */
function TreeView({
  nodes,
  root,
  path,
  onJump,
}: {
  nodes: Record<string, OKFDecisionTreeNode>
  root: string
  path: HistoryEntry[]
  onJump: (nodeId: string) => void
}) {
  const onPathNodes = new Set(path.map((e) => e.nodeId))
  const takenChoices = new Set(path.slice(1).map((e, idx) => `${path[idx].nodeId}:${e.choiceId}`))
  const currentId = path[path.length - 1].nodeId

  const renderNode = (nodeId: string, ancestors: Set<string>): ReactNode => {
    const node = nodes[nodeId]
    if (!node) return <span className="dt-tree-missing">Missing step “{nodeId}”</span>
    const stateClass = `${onPathNodes.has(nodeId) ? ' dt-tree-on-path' : ''}${nodeId === currentId ? ' dt-tree-current' : ''}`

    if (isLeafNode(node)) {
      return (
        <button
          type="button"
          className={`dt-tree-node dt-tree-leaf${stateClass}`}
          data-testid={`dt-tree-node-${nodeId}`}
          onClick={() => onJump(nodeId)}
        >
          <span className="dt-tree-kind">Recommendation</span>
          {node.leaf?.recommendation}
        </button>
      )
    }
    if (ancestors.has(nodeId)) {
      return <span className="dt-tree-loop">Back to “{truncate(node.prompt ?? nodeId, 40)}”</span>
    }
    const nextAncestors = new Set(ancestors).add(nodeId)
    return (
      <>
        <button
          type="button"
          className={`dt-tree-node dt-tree-question${stateClass}`}
          data-testid={`dt-tree-node-${nodeId}`}
          onClick={() => onJump(nodeId)}
        >
          {node.prompt ?? nodeId}
        </button>
        {node.choices && node.choices.length > 0 && (
          <ul className="dt-tree-branches">
            {node.choices.map((choice, idx) => (
              <li
                key={choice.id ?? idx}
                className={`dt-tree-branch${takenChoices.has(`${nodeId}:${choice.id}`) ? ' dt-tree-taken' : ''}`}
                data-testid={`dt-tree-choice-${nodeId}-${choice.id}`}
              >
                <span className="dt-tree-answer">
                  {choice.text}
                  {choice.recommended && <ThumbsUp className="dt-tree-recommended" aria-label="Recommended" />}
                </span>
                {choice.next && renderNode(choice.next, nextAncestors)}
              </li>
            ))}
          </ul>
        )}
      </>
    )
  }

  return (
    <div className="dt-tree" data-testid="dt-tree">
      <p className="dt-tree-hint">Tap a question or recommendation to jump there. Your current path is highlighted.</p>
      <div className="dt-tree-root">{renderNode(root, new Set())}</div>
    </div>
  )
}

export default function DecisionTreeSection({
  title,
  root = 'root',
  nodes = {},
  sectionIndex = 0,
}: DecisionTreeSectionProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'leaf'>('intro')
  const [history, setHistory] = useState<HistoryEntry[]>([{ nodeId: root }])
  // The answer the reader gave last time at the current question, after stepping back to it
  const [previousChoiceId, setPreviousChoiceId] = useState<string | undefined>()
  const [view, setView] = useState<'steps' | 'tree'>('steps')
  const { playSound } = useSound()

  const currentNodeId = history[history.length - 1].nodeId
  const currentNode = nodes[currentNodeId]
  const isLeaf = isLeafNode(currentNode)

  const handleStart = useCallback(() => {
    playSound('stepNext')
    setPhase('playing')
  }, [playSound])

  const handleChoose = useCallback((choiceId: string, nextId: string) => {
    setHistory((prev) => [...prev, { nodeId: nextId, choiceId }])
    setPreviousChoiceId(undefined)
    if (isLeafNode(nodes[nextId])) {
      playSound('success')
      setPhase('leaf')
    } else {
      playSound('click')
    }
  }, [nodes, playSound])

  const handleBack = useCallback((idx: number) => {
    playSound('click')
    setPreviousChoiceId(history[idx + 1]?.choiceId)
    setHistory(history.slice(0, idx + 1))
    setPhase('playing')
  }, [history, playSound])

  const handleJump = useCallback((nodeId: string) => {
    const onPathIdx = history.findIndex((e) => e.nodeId === nodeId)
    const newHistory = onPathIdx >= 0 ? history.slice(0, onPathIdx + 1) : findPath(nodes, root, nodeId)
    if (!newHistory) return
    playSound('click')
    setPreviousChoiceId(onPathIdx >= 0 ? history[onPathIdx + 1]?.choiceId : undefined)
    setHistory(newHistory)
    setPhase(isLeafNode(nodes[nodeId]) ? 'leaf' : 'playing')
    setView('steps')
  }, [history, nodes, root, playSound])

  const handleReset = useCallback(() => {
    playSound('click')
    setPhase('intro')
    setHistory([{ nodeId: root }])
    setPreviousChoiceId(undefined)
  }, [root, playSound])

  if (Object.keys(nodes).length === 0) {
    return <div className="p-8 text-center text-muted-foreground font-mono text-sm">No decision tree data provided.</div>
  }

  return (
    <div className="dt-section" data-testid="dt-section">
      <SectionTitleBar title={title} sectionIndex={sectionIndex} HelpModal={DecisionTreeHelpModal} titleTestId="dt-title" />

      <Tabs value={view} onValueChange={(v) => setView(v as 'steps' | 'tree')} variant="underline">
        <TabsList className="dt-view-tabs">
          <TabsTrigger value="steps" data-testid="dt-tab-steps">Step by step</TabsTrigger>
          <TabsTrigger value="tree" data-testid="dt-tab-tree">Whole tree</TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="dt-view-panel">
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
                key={`decision-${currentNodeId}-${history.length}`}
                node={currentNode}
                path={history}
                nodes={nodes}
                previousChoiceId={previousChoiceId}
                onChoose={handleChoose}
                onBack={handleBack}
              />
            )}

            {(phase === 'leaf' || (phase === 'playing' && isLeaf)) && currentNode && (
              <div key={`leaf-${currentNodeId}`}>
                {history.length > 1 && <Breadcrumb path={history} nodes={nodes} onBack={handleBack} />}
                <LeafDisplay
                  node={currentNode}
                  onReset={handleReset}
                />
              </div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="tree" className="dt-view-panel">
          <TreeView nodes={nodes} root={root} path={history} onJump={handleJump} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
