import { useState } from 'react'
import { SectionTitleBar } from '../../../../../delivery/web-app-shell/SectionTitleBar'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { breakdownModel, breakdownPercent, breakdownValue, type BreakdownTreeSectionData } from '../../breakdown-tree'
import type { BreakdownNodeSelected } from '../../events'
import { BreakdownDiagram } from './BreakdownDiagram'

export interface BreakdownTreeSectionProps { title?: string; section?: BreakdownTreeSectionData; sectionIndex?: number; onEvent?: (event: BreakdownNodeSelected) => void }
export default function BreakdownTreeSection({ title, section, sectionIndex = 0, onEvent }: BreakdownTreeSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const pick = usePickAnchors()
  if (!section) return null
  const model = breakdownModel(section)
  const selected = selectedId ? model.nodes.get(selectedId) : undefined
  const metrics = selected ? model.metrics(selected) : undefined
  const parent = selected?.parent ? model.nodes.get(selected.parent) : undefined
  const select = (id: string) => {
    setSelectedId((current) => current === id ? null : id)
    onEvent?.({ type: 'BreakdownNodeSelected', nodeId: id, timestamp: Date.now() })
  }
  return <div className="breakdown-section" data-testid="breakdown-tree-section">
    <SectionTitleBar title={title || section.title} sectionIndex={sectionIndex} titleTestId="breakdown-tree-title" />
    {section.description && <p className="breakdown-description" {...pick(section, 'description')}>{section.description}</p>}
    <p className="breakdown-legend">{section.mode === 'probability' ? 'Branches: conditional probability · Cards: overall probability' : 'Branches: share of parent · Cards: amount and share of total'}</p>
    <BreakdownDiagram data={section} selectedId={selected?.id} activeIds={selected ? [...model.path(selected.id).map((n) => n.id), ...model.children(selected.id).map((n) => n.id)] : undefined} onSelect={select} />
    <p className="breakdown-hint">Select a part to inspect its path and percentages.</p>
    {selected && <div className="breakdown-details" aria-live="polite" {...pick(selected)}>
      <nav aria-label="Selected part path">{model.path(selected.id).map((n, i) => <span key={n.id}>{i > 0 && ' › '}<button type="button" onClick={() => select(n.id)}>{n.title}</button></span>)}</nav>
      <h3>{selected.title} · {breakdownValue(section, selected)}</h3>
      {selected.description && <p {...pick(selected, 'description')}>{selected.description}</p>}
      {parent && <p>{breakdownPercent(metrics?.parentShare)} of {parent.title} · {breakdownPercent(metrics?.totalShare)} of {model.root?.title}</p>}
      {section.mode === 'probability' && parent && <p className="breakdown-calculation">{model.path(selected.id).slice(1).map((n) => breakdownPercent(n.value)).join(' × ')} = {breakdownPercent(metrics?.totalShare)} overall</p>}
    </div>}
    {section.takeaway && <p className="breakdown-takeaway" {...pick(section, 'takeaway')}>{section.takeaway}</p>}
  </div>
}
