import { useMemo } from 'react'
import { ArrowRight, ThumbsUp } from 'lucide-react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { QUIET, beatMarks, focus, type PresentRendererProps } from '../../../present-kernel'
import { choicesOf, decisionTreeWalk, drawTree, type DecisionTreePresentData } from '../../present'
import './decision-tree.css'
import '../present.css'

const LETTERS = 'ABCDEFGH'
/** Tree drawing grid, in SVG units. */
const GX = 60
const GY = 70
const M = 22
const R = 9

/**
 * Decision tree in Present mode (decisionTreeBeats), answered by the stage (decision 103): the whole
 * tree draws in, level by level, beside the first question; then each beat takes the recommended
 * answer (else the first), lights its branch in the drawing and turns the card into the next
 * question, until a recommendation.
 */
export default function PresentDecisionTree({ data, beat }: PresentRendererProps<DecisionTreePresentData>) {
  const pick = usePickAnchors()
  const mark = beatMarks(beat)
  const nodes = useMemo(() => data.nodes ?? {}, [data.nodes])
  const root = data.root ?? ''
  const tree = useMemo(() => drawTree(root, nodes), [root, nodes])
  const pos = useMemo(() => new Map(tree.nodes.map((n) => [n.id, { x: M + n.x * GX + GX / 2, y: M + n.y * GY }])), [tree])
  const walk = useMemo(() => decisionTreeWalk(data), [data])
  const at = Math.min(Math.max(0, beat), Math.max(0, walk.length - 1))
  const path = walk.length ? walk.slice(0, at + 1).map((p) => p.nodeId) : [root]
  const hereId = path[path.length - 1]
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
        {leaf ? (
          <div key={`leaf-${at}`} className="dt-leaf" role="status" {...mark(at, { delay: 250, sound: 'success' })}>
            <div className="dt-leaf-card" {...focus(beat === at)} {...pick(leaf)}>
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
                <div className="dt-leaf-recommendation">
                  <p className="dt-leaf-rec-text" {...pick(leaf, 'recommendation')}>{leaf.recommendation}</p>
                </div>
                {leaf.explanation && (
                  <div className="dt-leaf-explanation">
                    <span className="dt-leaf-block-label">Explanation</span>
                    <p className="dt-leaf-block-text" {...pick(leaf, 'explanation')}>{leaf.explanation}</p>
                  </div>
                )}
                {!!leaf.tradeoffs?.length && (
                  <div className="dt-leaf-tradeoffs">
                    <span className="dt-leaf-block-label">Trade-offs</span>
                    <ul className="dt-leaf-tradeoff-list">
                      {leaf.tradeoffs.map((t, i) => (
                        <li key={i} className="dt-leaf-tradeoff-item" {...pick(leaf.tradeoffs, i)}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : node ? (
          <div key={`node-${at}`} className="dt-decision" {...mark(at, { motion: 'fade', delay: at === 0 ? 300 : 200 })} {...pick(node)}>
            <div className="dt-decision-header">
              <span className="dt-step-counter">Step {path.length}</span>
            </div>
            <h4 className="dt-decision-prompt" {...mark(at, { motion: 'words', delay: at === 0 ? 500 : 300 })} {...focus(beat === at)} {...pick(node, 'prompt')}>
              <PresentWords text={node.prompt ?? node.text ?? node.title ?? ''} />
            </h4>
            <div className="dt-choices" role="list" aria-label="Answers">
              {choices.map((c, j) => (
                <div
                  key={c.id ?? j}
                  role="listitem"
                  className={`dt-choice${c.recommended ? ' dt-choice-recommended' : ''}`}
                  data-testid={`present-dt-choice-${c.id ?? j}`}
                  {...mark(at, { delay: (at === 0 ? 1100 : 700) + j * 70 })}
                  {...pick(c)}
                >
                  <span className="dt-choice-badge" aria-hidden>{LETTERS[j]}</span>
                  <span className="dt-choice-content">
                    <span className="dt-choice-label" {...pick(c, 'text')}>
                      {c.text ?? c.label}
                      {c.recommended && (
                        <span className="dt-recommended-badge">
                          <ThumbsUp className="dt-recommended-icon" aria-hidden />
                          Recommended
                        </span>
                      )}
                    </span>
                    {c.rationale && <span className="dt-choice-desc" {...pick(c, 'rationale')}>{c.rationale}</span>}
                  </span>
                  <ArrowRight className="dt-choice-arrow" aria-hidden />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
