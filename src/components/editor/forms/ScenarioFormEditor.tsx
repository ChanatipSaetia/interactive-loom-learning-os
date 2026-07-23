import { useState, useCallback } from 'react'
import { Layers, Film, Settings, HelpCircle, Trash2 } from 'lucide-react'
import { ScenarioHelpModal } from '../../../sections/scenario/ScenarioHelpModal'
import '../../../sections/scenario/scenario.css'
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
    <div className="visual-form-card visual-form-card--sub" data-testid={`sc-choice-${index}`}>
      <div className="visual-form-card-header">
        <span className="card-header-title">
          <span className="card-code-pill">Choice {String.fromCharCode(65 + index)}</span>
        </span>
        <button
          className="form-remove-btn"
          onClick={onRemove}
          data-testid={`sc-choice-remove-${index}`}
          type="button"
          title="Remove choice"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="visual-form-card-body">
        <div className="visual-form-grid-2">
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
              <span className="visual-form-key">Next Node</span>
              <select
                className="visual-form-select"
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
      </div>
    </div>
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
    <div className="visual-form-card visual-form-card--sub" data-testid="sc-outcome">
      <div className="visual-form-card-header">
        <span className="card-header-title" style={{ color: 'var(--primary)' }}>
          Outcome Details
        </span>
      </div>

      <div className="visual-form-card-body">
        <div className="visual-form-grid-2">
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
              <span className="visual-form-key">Rating</span>
              <select
                className="visual-form-select"
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
      </div>
    </div>
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
    <div className="visual-form-card" data-testid={`sc-node-${nodeId}`}>
      <div className="visual-form-card-header">
        <span className="card-header-title">
          <Layers size={13} /> Node: <code className="card-code-pill">{nodeId}</code>
        </span>
        {canRemove && (
          <button
            className="form-remove-btn"
            onClick={onRemove}
            data-testid={`sc-node-remove-${nodeId}`}
            type="button"
            title="Remove node"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="visual-form-card-body">
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
      </div>
    </div>
  )
}

type ScenarioSubTab = 'overview' | 'nodes'

export function ScenarioFormEditor({ data, onChange }: ScenarioFormEditorProps) {
  const [activeTab, setActiveTab] = useState<ScenarioSubTab>('overview')
  const [isHelpOpen, setIsHelpOpen] = useState(false)
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
      {/* Sub-Tabs */}
      <div className="flowchart-sub-tabs" data-testid="sc-sub-tabs" style={{ marginBottom: '16px' }}>
        <button
          className={`flowchart-sub-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          data-testid="sc-tab-overview"
          type="button"
        >
          <Settings size={14} />
          <span>Overview</span>
        </button>
        <button
          className={`flowchart-sub-tab ${activeTab === 'nodes' ? 'active' : ''}`}
          onClick={() => setActiveTab('nodes')}
          data-testid="sc-tab-nodes"
          type="button"
        >
          <Film size={14} />
          <span>Nodes</span>
          <span className="sub-tab-badge">{Object.keys(data.nodes).length}</span>
        </button>

        <button
          className="sc-help-btn"
          onClick={() => setIsHelpOpen(true)}
          data-testid="scenario-editor-help-btn"
          type="button"
          style={{ marginLeft: 'auto' }}
        >
          <HelpCircle size={13} />
          <span>Guide</span>
        </button>
      </div>

      <ScenarioHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Overview Sub-Tab */}
      {activeTab === 'overview' && (
        <div className="visual-form-card" data-testid="sc-overview-card">
          <div className="visual-form-card-header">
            <span className="card-header-title">
              <Settings size={14} /> Scenario Overview & Settings
            </span>
          </div>
          <div className="visual-form-card-body">
            <div className="visual-form-grid-2">
              <div className="visual-form-field">
                <label className="visual-form-label">
                  <span className="visual-form-key">Scenario ID</span>
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
                  <span className="visual-form-key">Start Node</span>
                  <select
                    className="visual-form-select"
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
          </div>
        </div>
      )}

      {/* Nodes Sub-Tab */}
      {activeTab === 'nodes' && (
        <div className="visual-form-field visual-form-field--array" data-testid="sc-nodes-tab-content">
          <div className="visual-form-section-header">
            <span className="visual-form-key">Scenario Nodes ({Object.keys(data.nodes).length})</span>
          </div>
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
      )}
    </div>
  )
}
