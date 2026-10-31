import './timeline.css'
import type { TimelineSectionData } from '../../timeline'
import { TIMELINE_COLORS } from '../../timeline'
import { OUIFieldKey } from '../../../OUIFieldKey'
import { Timeline, TimelineActivity, TimelineGroup, TimelineLane } from '../../timeline-openui'

const nextId = (prefix: string, items: Array<{ id: string }>) => {
  let i = 1
  while (items.some((item) => item.id === `${prefix}${i}`)) i++
  return `${prefix}${i}`
}
export function TimelineFormEditor({ data, onChange }: { data: TimelineSectionData; onChange: (data: TimelineSectionData) => void }) {
  const patch = (value: Partial<TimelineSectionData>) => onChange({ ...data, ...value })
  const removeActivities = (ids: string[], laneId?: string) => {
    const removed = new Set(ids)
    patch({
      lanes: laneId ? data.lanes.filter((l) => l.id !== laneId) : data.lanes,
      activities: data.activities.filter((a) => !removed.has(a.id)).map((a) => ({ ...a, depends_on: a.depends_on?.filter((id) => !removed.has(id)) })),
      groups: data.groups.map((g) => ({ ...g, activities: g.activities.filter((id) => !removed.has(id)) })).filter((g) => g.activities.length),
    })
  }
  return <div className="timeline-form" data-testid="timeline-form-editor">
    <label className="visual-form-label"><OUIFieldKey of={Timeline} field="unit">Time unit</OUIFieldKey><input className="visual-form-input" value={data.unit} onChange={(e) => patch({ unit: e.target.value })} /></label>
    <label className="visual-form-label"><OUIFieldKey of={Timeline} field="description">Description</OUIFieldKey><textarea className="visual-form-textarea" value={data.description ?? ''} onChange={(e) => patch({ description: e.target.value })} /></label>
    <label className="visual-form-label"><OUIFieldKey of={Timeline} field="takeaway">Takeaway</OUIFieldKey><textarea className="visual-form-textarea" value={data.takeaway ?? ''} onChange={(e) => patch({ takeaway: e.target.value })} /></label>
    <h3>Participants / resources</h3>
    {data.lanes.map((lane, index) => <fieldset key={lane.id} className="timeline-form-card"><legend>{lane.id}</legend>
      <label className="visual-form-label"><OUIFieldKey of={TimelineLane} field="title">Name</OUIFieldKey><input className="visual-form-input" value={lane.title} onChange={(e) => patch({ lanes: data.lanes.map((l, i) => i === index ? { ...l, title: e.target.value } : l) })} /></label>
      <label className="visual-form-label"><OUIFieldKey of={TimelineLane} field="color">Color</OUIFieldKey><select className="visual-form-input" value={lane.color ?? 'blue'} onChange={(e) => patch({ lanes: data.lanes.map((l, i) => i === index ? { ...l, color: e.target.value as typeof lane.color } : l) })}>{TIMELINE_COLORS.map((c) => <option key={c}>{c}</option>)}</select></label>
      <button type="button" disabled={data.lanes.length <= 1 || data.activities.every((a) => a.lane === lane.id)} onClick={() => removeActivities(data.activities.filter((a) => a.lane === lane.id).map((a) => a.id), lane.id)}>Remove lane and its activities</button>
    </fieldset>)}
    <button type="button" onClick={() => patch({ lanes: [...data.lanes, { id: nextId('lane', data.lanes), title: 'New lane', color: 'blue' }] })}>Add lane</button>
    <h3>Tasks</h3>
    {data.activities.map((activity, index) => {
      const update = (value: Partial<typeof activity>) => patch({ activities: data.activities.map((a, i) => i === index ? { ...a, ...value } : a) })
      return <fieldset key={activity.id} className="timeline-form-card"><legend>{activity.id}</legend>
        <label className="visual-form-label"><OUIFieldKey of={TimelineActivity} field="title">Name</OUIFieldKey><input className="visual-form-input" value={activity.title} onChange={(e) => update({ title: e.target.value })} /></label>
        <label className="visual-form-label"><OUIFieldKey of={TimelineActivity} field="lane">Lane</OUIFieldKey><select className="visual-form-input" value={activity.lane} onChange={(e) => update({ lane: e.target.value })}>{data.lanes.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></label>
        <div className="timeline-form-times">{(['start', 'duration'] as const).map((key) => <label key={key} className="visual-form-label"><span><OUIFieldKey of={TimelineActivity} field={key}>{key === 'start' ? 'Start' : 'Duration'}</OUIFieldKey> ({data.unit})</span><input className="visual-form-input" type="number" min={0} step="any" value={activity[key]} onChange={(e) => update({ [key]: e.target.valueAsNumber })} /></label>)}</div>
        <label className="visual-form-label"><OUIFieldKey of={TimelineActivity} field="description">Description</OUIFieldKey><textarea className="visual-form-textarea" value={activity.description ?? ''} onChange={(e) => update({ description: e.target.value })} /></label>
        <div><OUIFieldKey of={TimelineActivity} field="dependsOn">Waits for</OUIFieldKey>{data.activities.filter((a) => a.id !== activity.id).map((a) => <label key={a.id} className="timeline-form-check"><input type="checkbox" checked={activity.depends_on?.includes(a.id) ?? false} onChange={(e) => update({ depends_on: e.target.checked ? [...(activity.depends_on ?? []), a.id] : activity.depends_on?.filter((id) => id !== a.id) })} />{a.title}</label>)}</div>
        <button type="button" disabled={data.activities.length <= 1} onClick={() => removeActivities([activity.id])}>Remove activity</button>
      </fieldset>
    })}
    <button type="button" onClick={() => {
      const id = nextId('activity', data.activities)
      patch({ activities: [...data.activities, { id, title: 'New activity', lane: data.lanes[0].id, start: 0, duration: 20 }], groups: data.groups.map((g, i) => i === data.groups.length - 1 ? { ...g, activities: [...g.activities, id] } : g) })
    }}>Add activity</button>
    <h3>Presentation groups</h3><p className="timeline-hint">Group parallel work together. Without groups, activities sharing a start time are explained together.</p>
    {data.groups.map((group, index) => {
      const update = (value: Partial<typeof group>) => patch({ groups: data.groups.map((g, i) => i === index ? { ...g, ...value } : g) })
      return <fieldset key={group.id} className="timeline-form-card"><legend>{group.id}</legend>
        <label className="visual-form-label"><OUIFieldKey of={TimelineGroup} field="title">Name</OUIFieldKey><input className="visual-form-input" value={group.title} onChange={(e) => update({ title: e.target.value })} /></label>
        <label className="visual-form-label"><OUIFieldKey of={TimelineGroup} field="description">Description</OUIFieldKey><textarea className="visual-form-textarea" value={group.description ?? ''} onChange={(e) => update({ description: e.target.value })} /></label>
        <div><OUIFieldKey of={TimelineGroup} field="activities">Activities explained together</OUIFieldKey>{data.activities.map((a) => <label key={a.id} className="timeline-form-check"><input type="checkbox" checked={group.activities.includes(a.id)} onChange={(e) => update({ activities: e.target.checked ? [...group.activities, a.id] : group.activities.filter((id) => id !== a.id) })} />{a.title}</label>)}</div>
        <button type="button" disabled={index === 0} onClick={() => { const groups = [...data.groups]; [groups[index - 1], groups[index]] = [groups[index], groups[index - 1]]; patch({ groups }) }}>Move earlier</button>
        <button type="button" disabled={index === data.groups.length - 1} onClick={() => { const groups = [...data.groups]; [groups[index + 1], groups[index]] = [groups[index], groups[index + 1]]; patch({ groups }) }}>Move later</button>
        <button type="button" onClick={() => patch({ groups: data.groups.filter((_, i) => i !== index) })}>Remove group</button>
      </fieldset>
    })}
    <button type="button" onClick={() => patch({ groups: [...data.groups, { id: nextId('group', data.groups), title: 'New stage', activities: data.activities.map((a) => a.id) }] })}>Add group</button>
  </div>
}
