import { OUIFieldKey } from '../../../OUIFieldKey'
import { JourneyStage, UserJourney } from '../../user-journey-openui'
import type { JourneyStageData, UserJourneySectionData } from '../../user-journey'
import './user-journey.css'

export function UserJourneyFormEditor({ data, onChange }: { data: UserJourneySectionData; onChange: (data: UserJourneySectionData) => void }) {
  const patch = (value: Partial<UserJourneySectionData>) => onChange({ ...data, ...value })
  const move = (index: number, offset: number) => {
    const stages = [...data.stages]
    ;[stages[index], stages[index + offset]] = [stages[index + offset], stages[index]]
    patch({ stages })
  }
  return <div className="journey-form" data-testid="user-journey-form-editor">
    {(['person', 'goal'] as const).map((key) => <label key={key} className="visual-form-label"><OUIFieldKey of={UserJourney} field={key}>{key === 'person' ? 'Person / role' : 'Overall goal'}</OUIFieldKey><input className="visual-form-input" value={data[key]} onChange={(e) => patch({ [key]: e.target.value })} /></label>)}
    <p>Write the experience, not implementation details. Leave unknown outcomes blank. Reordering stages changes their narration beat numbers.</p>
    {data.stages.map((stage, index) => {
      const update = (key: keyof JourneyStageData, value: string) => {
        const optional = key === 'friction' || key === 'recovery' || key === 'outcome'
        patch({ stages: data.stages.map((s, i) => i === index ? { ...s, [key]: optional && !value.trim() ? undefined : value } : s) })
      }
      return <fieldset key={index}><legend>Stage {index + 1}: {stage.name}</legend>
        {(['name', 'goal', 'action', 'response', 'friction', 'recovery', 'outcome'] as const).map((key) => <label key={key} className="visual-form-label"><OUIFieldKey of={JourneyStage} field={key}>{key[0].toUpperCase() + key.slice(1)}</OUIFieldKey><textarea className="visual-form-textarea" value={stage[key] ?? ''} onChange={(e) => update(key, e.target.value)} /></label>)}
        <div className="journey-form-actions"><button type="button" disabled={index === 0} onClick={() => move(index, -1)}>Move earlier</button><button type="button" disabled={index === data.stages.length - 1} onClick={() => move(index, 1)}>Move later</button><button type="button" disabled={data.stages.length <= 1} onClick={() => patch({ stages: data.stages.filter((_, i) => i !== index) })}>Remove stage</button></div>
      </fieldset>
    })}
    <button type="button" onClick={() => patch({ stages: [...data.stages, { name: 'New stage', goal: 'What the person wants', action: 'What the person does', response: 'What the product or service does' }] })}>Add stage</button>
  </div>
}
