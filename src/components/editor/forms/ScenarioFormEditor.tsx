import { useCallback } from 'react'
import type {
  OKFScenarioSectionData,
  OKFScenarioNode,
  OKFScenarioChoice,
  OKFScenarioOutcome,
} from '../../../core/okf/types'

interface ScenarioFormEditorProps {
  data: OKFScenarioSectionData
  onChange: (data: OKFScenarioSectionData) => void
}

function ScenarioChoiceEditor({
  choice,
  index,
  nodeIds,
  onChange,
  onRemove,
}: {
  choice: OKFScenarioChoice
  index: number
  nodeIds: string[]
  onChange: (choice: OKFScenarioChoice) => void
  onRemove: () => void
}) {
  return (
    <fieldset className="visual-form-nested" data-testid={`sc-choice-${index}`}>
      <legend>
        Choice {String.fromCharCode(65 + index)}
        <button className="form-remove-btn" onClick={onRemove} data-testid={`sc-choice-remove-${index}`}>×</button>
      </legend>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">ID</span>
          <input
            className="visual-form-input"
            value={choice.id}
            onChange={(e) => onChange({ ...choice, id: e.target.value })}
            data-testid={`sc-choice-${index}-id`}
          />
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Text</span>
          <input
            className="visual-form-input"
            value={choice.text}
            onChange={(e) => onChange({ ...choice, text: e.target.value })}
            data-testid={`sc-choice-${index}-text`}
          />
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Next Node</span>
          <select
            className="visual-form-input"
            value={choice.next}
            onChange={(e) => onChange({ ...choice, next: e.target.value })}
            data-testid={`sc-choice-${index}-next`}
          >
            {nodeIds.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </label>
      </div>
    </fieldset>
  )
}

function ScenarioOutcomeEditor({
  outcome,
  onChange,
}: {
  outcome: OKFScenarioOutcome
  onChange: (outcome: OKFScenarioOutcome) => void
}) {
  return (
    <fieldset className="visual-form-nested" data-testid="sc-outcome">
      <legend>Outcome</legend>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Verdict</span>
          <input
            className="visual-form-input"
            value={outcome.verdict}
            onChange={(e) => onChange({ ...outcome, verdict: e.target.value })}
            data-testid="sc-outcome-verdict"
          />
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Lesson</span>
          <textarea
            className="visual-form-textarea"
            value={outcome.lesson}
            onChange={(e) => onChange({ ...outcome, lesson: e.target.value })}
            rows={2}
            data-testid="sc-outcome-lesson"
          />
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Rating</span>
          <select
            className="visual-form-input"
            value={outcome.rating}
            onChange={(e) => onChange({ ...outcome, rating: e.target.value as OKFScenarioOutcome['rating'] })}
            data-testid="sc-outcome-rating"
          >
            <option value="a">A</option>
            <option value="b-plus">B+</option>
            <option value="b-minus">B-</option>
            <option value="c">C</option>
          </select>
        </label>
      </div>
    </fieldset>
  )
}

function ScenarioNodeEditor({
  nodeId,
  node,
  nodeIds,
  onChange,
  onRemove,
  canRemove,
}: {
  nodeId: string
  node: OKFScenarioNode
  nodeIds: string[]
  onChange: (node: OKFScenarioNode) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const handleChoiceChange = useCallback(
    (ci: number, updatedChoice: OKFScenarioChoice) => {
      const choices = node.choices ? [...node.choices] : []
      choices[ci] = updatedChoice
      onChange({ ...node, choices })
    },
    [node, onChange]
  )

  const handleOutcomeChange = useCallback(
    (updatedOutcome: OKFScenarioOutcome) => {
      onChange({ ...node, outcome: updatedOutcome })
    },
    [node, onChange]
  )

  return (
    <fieldset className="visual-form-nested" data-testid={`sc-node-${nodeId}`}>
      <legend>
        Node: {nodeId} {canRemove ? <button className="form-remove-btn" onClick={onRemove} data-testid={`sc-node-remove-${nodeId}`}>×</button> : null}
      </legend>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Prompt</span>
          <textarea
            className="visual-form-textarea"
            value={node.prompt ?? ''}
            onChange={(e) => onChange({ ...node, prompt: e.target.value })}
            rows={2}
            data-testid={`sc-node-${nodeId}-prompt`}
          />
        </label>
      </div>
      {node.choices && (
        <div className="visual-form-field visual-form-field--array">
          <span className="visual-form-key">Choices ({node.choices.length})</span>
          <div className="visual-form-object-list">
            {node.choices.map((choice, ci) => (
              <ScenarioChoiceEditor
                key={choice.id || ci}
                choice={choice}
                index={ci}
                nodeIds={nodeIds}
                onChange={(updated) => handleChoiceChange(ci, updated)}
                onRemove={() => {
                  const choices = node.choices?.filter((_, j) => j !== ci)
                  onChange({ ...node, choices })
                }}
              />
            ))}
          </div>
        </div>
      )}
      {node.outcome && (
        <ScenarioOutcomeEditor
          outcome={node.outcome}
          onChange={handleOutcomeChange}
        />
      )}
    </fieldset>
  )
}

export function ScenarioFormEditor({ data, onChange }: ScenarioFormEditorProps) {
  const nodeIds = Object.keys(data.nodes)

  const handleNodeChange = useCallback(
    (nodeId: string, updatedNode: OKFScenarioNode) => {
      onChange({
        ...data,
        nodes: { ...data.nodes, [nodeId]: updatedNode },
      })
    },
    [data, onChange]
  )

  const handleRemoveNode = useCallback(
    (nodeId: string) => {
      const newNodes = { ...data.nodes }
      delete newNodes[nodeId]
      onChange({ ...data, nodes: newNodes })
    },
    [data, onChange]
  )

  return (
    <div className="visual-form" data-testid="scenario-form-editor">
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">ID</span>
          <input
            className="visual-form-input"
            value={data.id}
            onChange={(e) => onChange({ ...data, id: e.target.value })}
            data-testid="scenario-id"
          />
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Title</span>
          <input
            className="visual-form-input"
            value={data.title}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            data-testid="scenario-title"
          />
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Intro</span>
          <textarea
            className="visual-form-textarea"
            value={data.intro}
            onChange={(e) => onChange({ ...data, intro: e.target.value })}
            rows={3}
            data-testid="scenario-intro"
          />
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Start Node</span>
          <select
            className="visual-form-input"
            value={data.startNode}
            onChange={(e) => onChange({ ...data, startNode: e.target.value })}
            data-testid="scenario-startNode"
          >
            {nodeIds.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="visual-form-field visual-form-field--array">
        <span className="visual-form-key">Nodes ({Object.keys(data.nodes).length})</span>
        <div className="visual-form-object-list">
          {Object.entries(data.nodes).map(([id, node]) => (
            <ScenarioNodeEditor
              key={id}
              nodeId={id}
              node={node}
              nodeIds={nodeIds}
              onChange={(updated) => handleNodeChange(id, updated)}
              onRemove={() => handleRemoveNode(id)}
              canRemove={Object.keys(data.nodes).length > 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
