import { useMemo } from 'react'
import { ArrowRight, ThumbsUp } from 'lucide-react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { QUIET, beatMarks, focus, lead, type PresentRendererProps } from '../../../present-kernel'
import { choicesOf, decisionTreePlan, decisionTreeWalk, drawTree, type DecisionTreePresentData } from '../../present'
import './decision-tree.css'
import '../present.css'

const LETTERS = 'ABCDEFGH'
/** Tree drawing grid, in SVG units. */
const GX = 60
const GY = 70
const M = 22
const R = 9

/**
 * Decision tree in Present mode (decisionTreePlan), answered by the stage (decisions 103 and 110): the
 * whole tree draws in, level by level, beside the first question, its answers shown by label only;
 * then the answer taken lights up on that same card with its rationale while the others step back and
 * its branch lights in the drawing; then the card turns into the next question, until the
 * recommendation.
 */
export default function PresentDecisionTree({ data, beat }: PresentRendererProps<DecisionTreePresentData>) {
  const pick = usePickAnchors()
  const mark = beatMarks(beat)
  const nodes = useMemo(() => data.nodes ?? {}, [data.nodes])
  const root = data.root ?? ''
  const tree = useMemo(() => drawTree(root, nodes), [root, nodes])
  const pos = useMemo(() => new Map(tree.nodes.map((n) => [n.id, { x: M + n.x * GX + GX / 2, y: M + n.y * GY }])), [tree])
  const walk = useMemo(() => decisionTreeWalk(data), [data])
  const plan = useMemo(() => decisionTreePlan(data), [data])
  const at = Math.min(Math.max(0, beat), Math.max(0, plan.length - 1))
  const step = plan[at]
  const here = step?.node ?? 0
  // The beat this card arrived on (its question, or the recommendation) and the one it is answered on
  const askAt = step?.picked ? at - 1 : at
  const pickAt = step?.picked ? at : -1
  const chosen = step?.picked ? walk[here + 1]?.choice : undefined
  const path = walk.length ? walk.slice(0, here + (step?.picked ? 2 : 1)).map((p) => p.nodeId) : [root]
  const hereId = walk[here]?.nodeId ?? root
  const node = nodes[hereId]
  const choices = choicesOf(node)
  const leaf = node?.leaf && !choices.length ? node.leaf : undefined
  const taken = new Set(path.slice(1).map((id, i) => `${path[i]}->${id}`))

  const width = M * 2 + tree.width * GX
  const height = M * 2 + tree.depth * GY

  return (
    <div className="present-dt" data-testid="present-decision-tree">
      <svg className="present-dt-tree" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" aria-hidden {...QUIET}>
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
          const isHere = n.id === hereId
          const cls = ['present-dt-node', n.leaf && 'is-leaf', path.includes(n.id) && 'is-visited', isHere && 'is-here'].filter(Boolean).join(' ')
          return (
            <g key={n.id} className={cls} {...mark(0, { motion: 'pop', delay: 120 + n.y * 260 })}>
              <title>{nodes[n.id]?.leaf?.recommendation ?? nodes[n.id]?.prompt ?? n.id}</title>
              {isHere && <circle className="present-dt-ring" cx={p.x} cy={p.y} r={R + 6} />}
              {n.leaf ? <rect x={p.x - R} y={p.y - R} width={R * 2} height={R * 2} rx={4} /> : <circle cx={p.x} cy={p.y} r={R} />}
            </g>
          )
        })}
      </svg>
      <div className="present-dt-side">
        {leaf ? (
          <div key={`leaf-${here}`} className="dt-leaf" role="status" {...mark(askAt, { motion: 'zoom', delay: 250, sound: 'success' })}>
            <div className="dt-leaf-card" {...pick(leaf)}>
              <div className="dt-leaf-header">
                <div className="dt-leaf-icon" aria-hidden>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h4 className="dt-leaf-heading">Recommendation</h4>
              </div>
              <div className="dt-leaf-body">
                <div className="dt-leaf-recommendation" {...focus(beat === askAt)}>
                  <p className="dt-leaf-rec-text" {...mark(askAt, { motion: 'words', delay: 450 })} {...pick(leaf, 'recommendation')}><PresentWords text={leaf.recommendation} /></p>
                </div>
                {leaf.explanation && (
                  <div className="dt-leaf-explanation" {...mark(askAt, { delay: 900 })}>
                    <span className="dt-leaf-block-label">Explanation</span>
                    <p className="dt-leaf-block-text" {...pick(leaf, 'explanation')}>{lead(leaf.explanation, 2)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : node ? (
          <div key={`node-${here}`} className={`dt-decision${chosen ? ' is-answered' : ''}`} {...mark(askAt, { motion: 'fade', delay: askAt === 0 ? 300 : 200 })} {...pick(node)}>
            <div className="dt-decision-header">
              <span className="dt-step-counter">Step {here + 1}</span>
            </div>
            <h4 className="dt-decision-prompt" {...mark(askAt, { motion: 'words', delay: askAt === 0 ? 500 : 300 })} {...focus(beat === askAt)} {...pick(node, 'prompt')}>
              <PresentWords text={node.prompt ?? node.text ?? node.title ?? ''} />
            </h4>
            <div className="dt-choices" role="list" aria-label="Answers">
              {choices.map((c, j) => {
                const isPicked = !!chosen && c === chosen
                const cls = ['dt-choice', isPicked && 'dt-choice-recommended is-picked', chosen && !isPicked && 'is-dim'].filter(Boolean).join(' ')
                return (
                  <div
                    key={c.id ?? j}
                    role="listitem"
                    className={cls}
                    data-testid={`present-dt-choice-${c.id ?? j}`}
                    {...mark(askAt, { delay: (askAt === 0 ? 1100 : 700) + j * 70 })}
                    {...focus(isPicked && beat === pickAt)}
                    {...pick(c)}
                  >
                    <span className="dt-choice-badge" aria-hidden>{LETTERS[j]}</span>
                    <span className="dt-choice-content">
                      <span className="dt-choice-label" {...pick(c, 'text')}>
                        {c.text ?? c.label}
                        {isPicked && c.recommended && (
                          <span className="dt-recommended-badge" {...mark(pickAt, { motion: 'pop', delay: 200 })}>
                            <ThumbsUp className="dt-recommended-icon" aria-hidden />
                            Recommended
                          </span>
                        )}
                      </span>
                      {/* Only the answer taken says why, as it is taken */}
                      {isPicked && c.rationale && <span className="dt-choice-desc" {...mark(pickAt, { motion: 'unfold', delay: 380 })} {...pick(c, 'rationale')}>{c.rationale}</span>}
                    </span>
                    <ArrowRight className="dt-choice-arrow" aria-hidden />
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
