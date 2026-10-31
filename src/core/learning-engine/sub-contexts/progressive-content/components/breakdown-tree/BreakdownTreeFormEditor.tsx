import { OUIFieldKey } from '../../../OUIFieldKey'
import { BreakdownTree, BreakdownNode } from '../../breakdown-tree-openui'
import { BREAKDOWN_COLORS, breakdownModel, type BreakdownTreeSectionData } from '../../breakdown-tree'
import './breakdown-tree.css'

export function BreakdownTreeFormEditor({ data, onChange }: { data: BreakdownTreeSectionData; onChange: (data: BreakdownTreeSectionData) => void }) {
  const model = breakdownModel(data)
  const patch = (value: Partial<BreakdownTreeSectionData>) => onChange({ ...data, ...value })
  return <div className="breakdown-form" data-testid="breakdown-tree-form-editor">
    <label className="visual-form-label"><OUIFieldKey of={BreakdownTree} field="mode">Measurement</OUIFieldKey><select className="visual-form-input" value={data.mode} onChange={(e) => patch({ mode: e.target.value as typeof data.mode, unit: e.target.value === 'probability' ? '' : data.unit })}><option value="quantity">Quantities and shares</option><option value="probability">Conditional probabilities</option></select></label>
    <p className="breakdown-hint">{data.mode === 'probability' ? 'Enter fractions from 0 to 1. Root = 1; every split must sum to 1.' : 'Use one unit. Children must add up to their parent.'}</p>
    {data.mode === 'quantity' && <label className="visual-form-label"><OUIFieldKey of={BreakdownTree} field="unit">Unit</OUIFieldKey><input className="visual-form-input" value={data.unit} onChange={(e) => patch({ unit: e.target.value })} /></label>}
    {(['description', 'takeaway'] as const).map((key) => <label key={key} className="visual-form-label"><OUIFieldKey of={BreakdownTree} field={key}>{key === 'description' ? 'Context and source' : 'Takeaway'}</OUIFieldKey><textarea className="visual-form-textarea" value={data[key] ?? ''} onChange={(e) => patch({ [key]: e.target.value })} /></label>)}
    <h3>Parts of the whole</h3>
    {data.nodes.map((node, index) => {
      const update = (value: Partial<typeof node>) => patch({ nodes: data.nodes.map((n, i) => i === index ? { ...n, ...value } : n) })
      return <fieldset key={node.id} className="breakdown-form-card"><legend>{node.id}</legend>
        <label className="visual-form-label"><OUIFieldKey of={BreakdownNode} field="title">Name</OUIFieldKey><input className="visual-form-input" value={node.title} onChange={(e) => update({ title: e.target.value })} /></label>
        <label className="visual-form-label"><OUIFieldKey of={BreakdownNode} field="value">{data.mode === 'probability' ? 'Conditional probability (0–1)' : `Amount${data.unit ? ` (${data.unit})` : ''}`}</OUIFieldKey><input className="visual-form-input" type="number" min={0} max={data.mode === 'probability' ? 1 : undefined} step="any" value={node.value} onChange={(e) => update({ value: e.target.valueAsNumber })} /></label>
        <label className="visual-form-label"><OUIFieldKey of={BreakdownNode} field="parent">Parent</OUIFieldKey><select className="visual-form-input" value={node.parent ?? ''} onChange={(e) => update({ parent: e.target.value || undefined })}><option value="">Root / whole</option>{data.nodes.filter((n) => !model.path(n.id).some((a) => a.id === node.id)).map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}</select></label>
        <label className="visual-form-label"><OUIFieldKey of={BreakdownNode} field="description">Explanation</OUIFieldKey><textarea className="visual-form-textarea" value={node.description ?? ''} onChange={(e) => update({ description: e.target.value })} /></label>
        <label className="visual-form-label"><OUIFieldKey of={BreakdownNode} field="color">Color</OUIFieldKey><select className="visual-form-input" value={node.color ?? ''} onChange={(e) => update({ color: (e.target.value || undefined) as typeof node.color })}><option value="">Inherit parent</option>{BREAKDOWN_COLORS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <div className="breakdown-form-actions"><button type="button" onClick={() => {
          let i = 1
          while (model.nodes.has(`part${i}`)) i++
          patch({ nodes: [...data.nodes, { id: `part${i}`, title: 'New part', value: model.children(node.id).length ? 0 : data.mode === 'probability' ? 1 : node.value, parent: node.id }] })
        }}>Add child</button>
        <button type="button" disabled={!node.parent} onClick={() => patch({ nodes: data.nodes.filter((n) => !model.path(n.id).some((a) => a.id === node.id)) })}>Remove branch</button></div>
      </fieldset>
    })}
  </div>
}
