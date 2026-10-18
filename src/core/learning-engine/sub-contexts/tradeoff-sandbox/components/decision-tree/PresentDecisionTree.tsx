import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { RotateCcw, ThumbsUp } from 'lucide-react'
import { useSound } from '../../../../../ui-system/sensory/SoundContext'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { SAY, beatMarks, type PresentRendererProps } from '../../../present-kernel'
import type { DecisionNodeSelected } from '../../events'
import type { DecisionTreeChoice } from '../../schema'
import { choicesOf, drawTree, nextOf, type DecisionTreePresentData } from '../../present'
import '../present.css'

const LETTERS = 'ABCDEFGH'
const EASE = [0.16, 1, 0.3, 1] as const
/** Tree drawing grid, in SVG units. */
const GX = 60
const GY = 70
const M = 22
const R = 9

/**
 * Decision tree in Present mode (decisionTreeBeats): the whole tree draws in, level by level, beside the
 * first question; then the learner answers. Each answer lights its branch in the drawing and the card
 * turns into the next question, until a recommendation. Start over goes back to the root.
 */
export default function PresentDecisionTree({ data, beat, active, gate, onEvent }: PresentRendererProps<DecisionTreePresentData>) {
  const pick = usePickAnchors()
  const { playSound } = useSound()
  const mark = beatMarks(beat)
  const nodes = useMemo(() => data.nodes ?? {}, [data.nodes])
  const root = data.root ?? ''
  const tree = useMemo(() => drawTree(root, nodes), [root, nodes])
  const pos = useMemo(() => new Map(tree.nodes.map((n) => [n.id, { x: M + n.x * GX + GX / 2, y: M + n.y * GY }])), [tree])
  const [path, setPath] = useState<string[]>([root])
  const hereId = path[path.length - 1]
  const node = nodes[hereId]
  const choices = choicesOf(node)
  const leaf = node?.leaf && !choices.length ? node.leaf : undefined
  const live = active && beat >= 1
  const taken = new Set(path.slice(1).map((id, i) => `${path[i]}->${id}`))

  const choose = (choice: DecisionTreeChoice) => {
    const to = nextOf(choice)
    if (!live || !nodes[to]) return
    const event: DecisionNodeSelected = { type: 'DecisionNodeSelected', nodeId: hereId, choiceId: choice.id ?? '', nextNodeId: to, timestamp: Date.now() }
    onEvent?.(event as unknown as { type: string })
    setPath((p) => [...p, to])
    const next = nodes[to]
    if (next.leaf && !choicesOf(next).length) {
      playSound('success')
      gate.solve()
    } else {
      playSound('whoosh')
    }
  }
  const startOver = () => {
    playSound('stepPrev')
    setPath([root])
  }

  const width = M * 2 + tree.width * GX
  const height = M * 2 + tree.depth * GY

  return (
    <div className="present-dt" data-testid="present-decision-tree">
      <svg className="present-dt-tree" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" aria-hidden>
        {tree.links.map((l, i) => {
          const a = pos.get(l.from)
          const b = pos.get(l.to)
          if (!a || !b) return null
          const mid = (a.y + b.y) / 2
          const depth = tree.nodes.find((n) => n.id === l.from)?.y ?? 0
          return (
            <path
              key={i}
              className={`present-dt-link${l.cross ? ' is-cross' : ''}${taken.has(`${l.from}->${l.to}`) ? ' is-taken' : ''}`}
              d={l.cross ? `M ${a.x} ${a.y} L ${b.x} ${b.y}` : `M ${a.x} ${a.y + R} C ${a.x} ${mid}, ${b.x} ${mid}, ${b.x} ${b.y - R}`}
              pathLength={1}
              {...mark(0, { motion: 'draw', delay: 200 + depth * 260 })}
            />
          )
        })}
        {tree.nodes.map((n) => {
          const p = pos.get(n.id)
          if (!p) return null
          const here = n.id === hereId
          const cls = ['present-dt-node', n.leaf && 'is-leaf', path.includes(n.id) && 'is-visited', here && 'is-here'].filter(Boolean).join(' ')
          return (
            <g key={n.id} className={cls} {...mark(0, { motion: 'pop', delay: 120 + n.y * 260 })}>
              <title>{nodes[n.id]?.leaf?.recommendation ?? nodes[n.id]?.prompt ?? n.id}</title>
              {here && <circle className="present-dt-ring" cx={p.x} cy={p.y} r={R + 6} />}
              {n.leaf ? <rect x={p.x - R} y={p.y - R} width={R * 2} height={R * 2} rx={4} /> : <circle cx={p.x} cy={p.y} r={R} />}
            </g>
          )
        })}
      </svg>
      <div className="present-dt-side">
        <AnimatePresence mode="wait" initial={false}>
          {leaf ? (
            <motion.div
              key={`leaf-${hereId}`}
              className="present-dt-card present-dt-leaf"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.45, ease: EASE }}
              role="status"
              {...pick(leaf)}
            >
              <p className="present-dt-kicker">Recommendation</p>
              <p className="present-dt-rec" {...SAY} {...pick(leaf, 'recommendation')}>{leaf.recommendation}</p>
              {leaf.explanation && <p className="present-dt-why" {...SAY} {...pick(leaf, 'explanation')}>{leaf.explanation}</p>}
              {!!leaf.tradeoffs?.length && (
                <ul className="present-dt-tradeoffs">
                  {leaf.tradeoffs.map((t, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.08, duration: 0.3, ease: EASE }} {...pick(leaf.tradeoffs, i)}>{t}</motion.li>
                  ))}
                </ul>
              )}
              <button type="button" className="present-button" onClick={startOver} disabled={!live} data-testid="present-dt-again">
                <RotateCcw size={16} aria-hidden /> Start over
              </button>
            </motion.div>
          ) : node ? (
            <motion.div
              key={`node-${hereId}`}
              className="present-dt-card"
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.4, ease: EASE }}
              {...pick(node)}
            >
              <p className="present-dt-kicker">Question {path.length}</p>
              <p className="present-dt-prompt" {...mark(0, { motion: 'words', delay: 500 })} {...pick(node, 'prompt')}>
                <PresentWords text={node.prompt ?? node.text ?? node.title ?? ''} />
              </p>
              <div className="present-dt-choices" role="group" aria-label="Your answer">
                {choices.map((c, j) => (
                  <button
                    key={c.id ?? j}
                    type="button"
                    className={`present-choice${live ? ' present-breathe' : ''}`}
                    onClick={() => choose(c)}
                    disabled={!live}
                    data-testid={`present-dt-choice-${c.id ?? j}`}
                    {...mark(0, { delay: 1100 + j * 70 })}
                    {...pick(c)}
                  >
                    <span className="present-choice-row">
                      <span className="present-choice-letter" aria-hidden>{LETTERS[j]}</span>
                      <span className="present-choice-text" {...pick(c, 'text')}>{c.text ?? c.label}</span>
                      {c.recommended && <ThumbsUp className="present-choice-mark present-dt-thumb" size={16} aria-label="Recommended" />}
                    </span>
                    {c.rationale && <span className="present-choice-why present-dt-rationale" {...pick(c, 'rationale')}>{c.rationale}</span>}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
