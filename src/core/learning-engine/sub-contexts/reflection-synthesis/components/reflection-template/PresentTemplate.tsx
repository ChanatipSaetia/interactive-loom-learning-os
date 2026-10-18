import { useMemo } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { QUIET, beatMarks, focus, type BeatMarkAttributes, type BeatMarkOptions, type PresentRendererProps } from '../../../present-kernel'
import type { ReflectionTemplateChallenge } from '../../schema'
import { startingOrder, type TemplatePresentData } from '../../present'
import './reflection-template.css'
import '../present.css'

type Mark = (at: number, options?: BeatMarkOptions) => BeatMarkAttributes

const ZONE = /(\{[a-zA-Z0-9_-]+\})/g
const isZone = (segment: string) => /^\{[a-zA-Z0-9_-]+\}$/.test(segment)

function Challenge({ challenge, index, total, beat, mark }: {
  challenge: ReflectionTemplateChallenge
  index: number
  total: number
  beat: number
  mark: Mark
}) {
  const pick = usePickAnchors()
  const segments = useMemo(() => challenge.template.split(ZONE), [challenge.template])
  const zones = useMemo(() => segments.filter(isZone).map((s) => s.slice(1, -1)), [segments])
  const solution = useMemo(() => zones.map((z) => challenge.solution[z] ?? ''), [zones, challenge.solution])
  const ids = useMemo(() => startingOrder(challenge.chips.map((c) => c.id), solution), [challenge.chips, solution])
  const byId = useMemo(() => new Map(challenge.chips.map((c) => [c.id, c])), [challenge.chips])
  const at = 2 * index
  const solveAt = at + 1
  const solved = beat >= solveAt
  let zone = -1

  return (
    <div className="template-body present-reflection" {...mark(at, { motion: 'fade', ...(index < total - 1 && { until: solveAt }) })} {...pick(challenge)}>
      <div className="template-prompt present-reflection-prompt" {...mark(at, { motion: 'words' })} {...focus(beat === at)} {...pick(challenge, 'prompt')}><PresentWords text={challenge.prompt} /></div>

      {/* The narrator's line reads the sentence once it is filled in */}
      <div className="template-sentence-container present-template" {...mark(at, { delay: 450 })} {...QUIET} {...focus(beat === solveAt)} {...pick(challenge, 'template')}>
        {segments.map((seg, i) => {
          if (!isZone(seg)) return <span key={i}>{seg}</span>
          zone += 1
          const c = solved ? byId.get(solution[zone]) : undefined
          return (
            <span key={i} className={`reflection-blank-dropzone${c ? ' filled is-ok' : ''}`}>
              {c ? <span className="present-chip is-placed is-ok" {...mark(solveAt, { motion: 'pop', delay: 150 + zone * 220 })} {...pick(c)}>{c.text}</span> : '[ ? ]'}
            </span>
          )
        })}
      </div>

      {/* The bank keeps every chip's place, as in Read: a placed chip leaves a faded copy behind */}
      <div className="template-chips-bank present-chips" {...QUIET}>
        {ids.map((id, j) => {
          const c = byId.get(id)
          if (!c) return null
          return (
            <div key={id} className={`template-chip-item present-chip${solved ? ' used' : ''}`} {...mark(at, { delay: 700 + j * 60 })} {...pick(c)}>
              {c.text}
            </div>
          )
        })}
      </div>

      {solved && (
        <div className="template-footer present-reflection-foot">
          <div className="template-feedback-msg success present-reflection-result" role="status" {...mark(solveAt, { motion: 'fade', delay: 300 + zones.length * 220, sound: 'success' })}>
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
 * Reflection template in Present mode (templateBeats), solved by the stage (decision 103): per
 * challenge, the prompt and the sentence with blanks arrive; then the right chips pop into the
 * blanks while the narrator reads the finished sentence, and its explanation follows.
 */
export default function PresentTemplate({ data, beat }: PresentRendererProps<TemplatePresentData>) {
  const challenges = data.challenges ?? []
  const mark = beatMarks(beat)
  return (
    <div className="present-reflections" data-testid="present-template">
      {challenges.map((c, i) => (
        <Challenge key={i} challenge={c} index={i} total={challenges.length} beat={beat} mark={mark} />
      ))}
    </div>
  )
}
