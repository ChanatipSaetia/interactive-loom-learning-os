import { useMemo } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { QUIET, beatMarks, focus, type BeatMarkAttributes, type BeatMarkOptions, type PresentRendererProps } from '../../../present-kernel'
import type { ReflectionTemplateChallenge } from '../../schema'
import { challengeStarts, isZone, startingOrder, templateSegments, templateZones, type TemplatePresentData } from '../../present'
import './reflection-template.css'
import '../present.css'

type Mark = (at: number, options?: BeatMarkOptions) => BeatMarkAttributes

function Challenge({ challenge, at, last, beat, mark }: {
  challenge: ReflectionTemplateChallenge
  /** The challenge's first beat (its prompt). */
  at: number
  last: boolean
  beat: number
  mark: Mark
}) {
  const pick = usePickAnchors()
  const segments = useMemo(() => templateSegments(challenge.template), [challenge.template])
  const zones = useMemo(() => templateZones(challenge.template), [challenge.template])
  const solution = useMemo(() => zones.map((z) => challenge.solution[z] ?? ''), [zones, challenge.solution])
  const ids = useMemo(() => startingOrder(challenge.chips.map((c) => c.id), solution), [challenge.chips, solution])
  const byId = useMemo(() => new Map(challenge.chips.map((c) => [c.id, c])), [challenge.chips])
  // Blank z is filled on beat at + z + 1 (`cn.step{z+1}`), then the sentence is confirmed (decision 115)
  const fillAt = (z: number) => at + z + 1
  const solveAt = at + zones.length + 1
  const solved = beat >= solveAt
  const used = new Set(solution.filter((_, z) => beat >= fillAt(z)))
  let zone = -1

  return (
    <div className="template-body present-reflection" {...mark(at, { motion: 'fade', ...(!last && { until: solveAt }) })} {...pick(challenge)}>
      <div className="template-prompt present-reflection-prompt" {...mark(at, { motion: 'words' })} {...focus(beat === at)} {...pick(challenge, 'prompt')}><PresentWords text={challenge.prompt} /></div>

      <div className="template-sentence-container present-template" {...mark(at, { delay: 450 })} {...focus(beat === solveAt)} {...pick(challenge, 'template')}>
        {segments.map((seg, i) => {
          if (!isZone(seg)) return <span key={i}>{seg}</span>
          zone += 1
          const c = beat >= fillAt(zone) ? byId.get(solution[zone]) : undefined
          return (
            <span key={i} className={`reflection-blank-dropzone${c ? ' filled' : ''}${c && solved ? ' is-ok' : ''}`} {...focus(beat === fillAt(zone))}>
              {c ? <span className={`present-chip is-placed${solved ? ' is-ok' : ''}`} {...mark(fillAt(zone), { motion: 'pop', delay: 150 })} {...pick(c)}>{c.text}</span> : '[ ? ]'}
            </span>
          )
        })}
      </div>

      {/* The bank keeps every chip's place, as in Read: a placed chip leaves a faded copy behind, its Pick anchor moving to the blank */}
      <div className="template-chips-bank present-chips" {...QUIET}>
        {ids.map((id, j) => {
          const c = byId.get(id)
          if (!c) return null
          return (
            <div key={id} className={`template-chip-item present-chip${used.has(id) ? ' used' : ''}`} {...mark(at, { delay: 700 + j * 60 })} {...(!used.has(id) && pick(c))}>
              {c.text}
            </div>
          )
        })}
      </div>

      {solved && (
        <div className="template-footer present-reflection-foot">
          <div className="template-feedback-msg success present-reflection-result" role="status" {...mark(solveAt, { motion: 'fade', delay: 300, sound: 'success' })}>
            <CheckCircle2 size={16} className="feedback-icon" aria-hidden />
            {/* The explanation may hold inline HTML, rendered as the Read view renders it */}
            <div
              className="feedback-text-content"
              {...pick(challenge, 'explanation')}
              dangerouslySetInnerHTML={{ __html: challenge.explanation ?? 'That completes it.' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Reflection template in Present mode (templateBeats), solved by the stage (decisions 103 and 115):
 * per challenge, the prompt and the sentence with blanks arrive; then each blank gets its chip in its
 * own beat, so the narration can explain it; then the sentence turns green over its explanation.
 */
export default function PresentTemplate({ data, beat }: PresentRendererProps<TemplatePresentData>) {
  const challenges = useMemo(() => data.challenges ?? [], [data.challenges])
  const starts = useMemo(() => challengeStarts(challenges.map((c) => templateZones(c.template).length)), [challenges])
  const mark = beatMarks(beat)
  return (
    <div className="present-reflections" data-testid="present-template">
      {challenges.map((c, i) => (
        <Challenge key={i} challenge={c} at={starts[i]} last={i === challenges.length - 1} beat={beat} mark={mark} />
      ))}
    </div>
  )
}
