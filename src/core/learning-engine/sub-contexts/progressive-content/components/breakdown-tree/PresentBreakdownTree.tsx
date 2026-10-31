import { beatMarks, focus, QUIET, type PresentRendererProps } from '../../../present-kernel'
import type { BreakdownTreePresentData } from '../../present'
import { breakdownModel, breakdownValue } from '../../breakdown-tree'
import { BreakdownDiagram } from './BreakdownDiagram'
import '../present.css'

/** Overview and conclusion keep the whole; split beats enlarge a parent and its immediate parts. */
export default function PresentBreakdownTree({ data, beat }: PresentRendererProps<BreakdownTreePresentData>) {
  const section = data.section
  if (!section) return null
  const model = breakdownModel(section)
  const split = beat > 0 && beat <= model.splits.length ? model.splits[beat - 1] : undefined
  const summary = beat === model.splits.length + 1
  const mark = beatMarks(beat)
  return <div className="present-breakdown breakdown-section" data-testid="present-breakdown-tree">
    <div className="breakdown-context" {...QUIET}>
      <span>{model.root?.title} · {model.root ? breakdownValue(section, model.root) : ''}</span>
      <span>{section.mode === 'probability' ? 'Branch = conditional · Card = overall' : 'Branch = share of parent · Card = share of total'}</span>
    </div>
    {split && <p className="breakdown-breadcrumb" {...QUIET}>{model.path(split.id).map((n) => n.title).join(' › ')}</p>}
    <div className="breakdown-diagram-frame" {...mark(0, { motion: 'fade' })} {...QUIET}>
      <BreakdownDiagram data={section} rootId={split?.id} depthLimit={split ? 1 : undefined} activeIds={split ? [split.id, ...model.children(split.id).map((n) => n.id)] : undefined} />
    </div>
    <div className="breakdown-scene-caption" {...mark(beat, { motion: 'fade', until: beat })} {...focus(true)}>
      {split ? <><h3>{split.title}</h3>{split.description && <p>{split.description}</p>}</> : <p>{summary ? section.takeaway || section.title : section.description || section.title}</p>}
    </div>
  </div>
}
