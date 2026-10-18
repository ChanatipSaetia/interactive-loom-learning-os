import { Flowchart } from './index'
import { beatMarks, type PresentRendererProps } from '../../../present-kernel'
import type { FlowchartPresentData } from '../../present'
import '../present.css'

/**
 * Flowchart in Present mode (flowchartBeats): the section's own journey playback, held at the step of
 * the current beat. Its camera follows the active nodes and its caption narrates the step; a hidden copy
 * of each step's text gives the stage the words to time the beat by.
 */
export default function PresentFlowchart({ data, beat, sectionIndex }: PresentRendererProps<FlowchartPresentData>) {
  const steps = data.schema?.journeys?.[0]?.steps ?? []
  const mark = beatMarks(beat)
  return (
    <div className="present-flowchart" data-testid="present-flowchart" {...mark(0, { motion: 'fade' })}>
      <Flowchart title={data.title} schema={data.schema} sectionIndex={sectionIndex} present={{ step: steps.length ? Math.max(0, beat) : -1 }} />
      {steps.map((s, i) => (
        <span key={i} className="present-sr" {...mark(i, { motion: 'fade' })}>{s.title}. {s.reason}</span>
      ))}
    </div>
  )
}
