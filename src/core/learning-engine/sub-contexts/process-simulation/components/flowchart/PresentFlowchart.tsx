import { Flowchart } from './index'
import { beatMarks, QUIET, type PresentRendererProps } from '../../../present-kernel'
import { flowchartOverviewPages, type FlowchartPresentData } from '../../present'
import '../present.css'

/** Present frames one step at a time, so it zooms in closer than Read mode (0.5) and labels stay readable on a phone. */
const PRESENT_MAX_ZOOM = 1

/**
 * Flowchart in Present mode (flowchartBeats): the section's own journey playback, held at the step of
 * the current beat. Its camera follows the active nodes and its caption narrates the step; a hidden copy
 * of each step's text gives the stage the words to time the beat by.
 */
export default function PresentFlowchart({ data, beat, sectionIndex, narrationStep }: PresentRendererProps<FlowchartPresentData>) {
  const steps = data.schema?.journeys?.[0]?.steps ?? []
  const mark = beatMarks(beat)
  const pages = flowchartOverviewPages(data)
  const overview = beat < pages
  return (
    <div className="present-flowchart" data-testid="present-flowchart">
      <Flowchart title={data.title} schema={data.schema} sectionIndex={sectionIndex} present={{ step: steps.length && !overview ? beat - pages : -1, overview, overviewPage: Math.max(0, beat), overviewPages: pages, maxZoom: PRESENT_MAX_ZOOM, view: narrationStep?.view }} />
      {overview && pages > 1 && <div className="present-flowchart-overview-count" {...QUIET}>Overview {Math.max(0, beat) + 1} of {pages}</div>}
      {Array.from({ length: pages }, (_, i) => <span key={i} className="present-sr" {...mark(i, { motion: 'fade', until: i })}>Overview of {data.title || 'the flowchart'}, part {i + 1} of {pages}.</span>)}
      {steps.map((s, i) => (
        <span key={i} className="present-sr" {...mark(i + pages, { motion: 'fade', until: i + pages })}>{s.title}. {s.reason}</span>
      ))}
    </div>
  )
}
