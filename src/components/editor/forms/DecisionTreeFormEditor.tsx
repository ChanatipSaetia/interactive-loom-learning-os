import { useCallback } from 'react'
import type {
  OKFDecisionTreeSectionData,
  OKFDecisionTreeNode,
  OKFDecisionTreeChoice,
  OKFDecisionTreeLeaf,
} from '../../../core/okf/types'

interface DecisionTreeFormEditorProps {
  data: OKFDecisionTreeSectionData
  onChange: (data: OKFDecisionTreeSectionData) => void
}

function DecisionTreeChoiceEditor({
  choice,
  index,
  nodeIds,
  onChange,
  onRemove,
}: {
  choice: OKFDecisionTreeChoice
  index: number
  nodeIds: string[]
  onChange: (choice: OKFDecisionTreeChoice) => void
  onRemove: () => void
}) {
  return (
    <fieldset className="visual-form-nested" data-testid={`dt-choice-${index}`}>
      <legend>
        Choice {String.fromCharCode(65 + index)}
        <button className="form-remove-btn" onClick={onRemove} data-testid={`dt-choice-remove-${index}`}>×</button>
      </legend>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">ID</span>
          <input
            className="visual-form-input"
            value={choice.id}
            onChange={(e) => onChange({ ...choice, id: e.target.value })}
            data-testid={`dt-choice-${index}-id`}
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
            data-testid={`dt-choice-${index}-text`}
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
            data-testid={`dt-choice-${index}-next`}
          >
            {nodeIds.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Rationale</span>
          <textarea
            className="visual-form-textarea"
            value={choice.rationale ?? ''}
            onChange={(e) => onChange({ ...choice, rationale: e.target.value })}
            rows={2}
            data-testid={`dt-choice-${index}-rationale`}
          />
        </label>
      </div>
      <div className="visual-form-field visual-form-field--bool">
        <label className="visual-form-label">
          <input
            type="checkbox"
            checked={choice.recommended ?? false}
            onChange={(e) => onChange({ ...choice, recommended: e.target.checked })}
            data-testid={`dt-choice-${index}-recommended`}
          />
          <span className="visual-form-key">Recommended</span>
        </label>
      </div>
    </fieldset>
  )
}

function DecisionTreeLeafEditor({
  leaf,
  onChange,
}: {
  leaf: OKFDecisionTreeLeaf
  onChange: (leaf: OKFDecisionTreeLeaf) => void
}) {
  return (
    <fieldset className="visual-form-nested" data-testid="dt-leaf">
      <legend>Leaf (Outcome)</legend>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Recommendation</span>
          <textarea
            className="visual-form-textarea"
            value={leaf.recommendation}
            onChange={(e) => onChange({ ...leaf, recommendation: e.target.value })}
            rows={2}
            data-testid="dt-leaf-recommendation"
          />
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Explanation</span>
          <textarea
            className="visual-form-textarea"
            value={leaf.explanation}
            onChange={(e) => onChange({ ...leaf, explanation: e.target.value })}
            rows={3}
            data-testid="dt-leaf-explanation"
          />
        </label>
      </div>
    </fieldset>
  )
}

function DecisionTreeNodeEditor({
  nodeId,
  node,
  nodeIds,
  onChange,
  onRemove,
  canRemove,
}: {
  nodeId: string
  node: OKFDecisionTreeNode
  nodeIds: string[]
  onChange: (node: OKFDecisionTreeNode) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const handleChoiceChange = useCallback(
    (ci: number, updatedChoice: OKFDecisionTreeChoice) => {
      const choices = node.choices ? [...node.choices] : []
      choices[ci] = updatedChoice
      onChange({ ...node, choices })
    },
    [node, onChange]
  )

  const handleLeafChange = useCallback(
    (updatedLeaf: OKFDecisionTreeLeaf) => {
      onChange({ ...node, leaf: updatedLeaf })
    },
    [node, onChange]
  )

  return (
    <fieldset className="visual-form-nested" data-testid={`dt-node-${nodeId}`}>
      <legend>
        Node: {nodeId} {canRemove ? <button className="form-remove-btn" onClick={onRemove} data-testid={`dt-node-remove-${nodeId}`}>×</button> : null}
      </legend>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Prompt</span>
          <textarea
            className="visual-form-textarea"
            value={node.prompt ?? ''}
            onChange={(e) => onChange({ ...node, prompt: e.target.value })}
            rows={2}
            data-testid={`dt-node-${nodeId}-prompt`}
          />
        </label>
      </div>
      {node.choices && (
        <div className="visual-form-field visual-form-field--array">
          <span className="visual-form-key">Choices ({node.choices.length})</span>
          <div className="visual-form-object-list">
            {node.choices.map((choice, ci) => (
              <DecisionTreeChoiceEditor
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
      {node.leaf && (
        <DecisionTreeLeafEditor
          leaf={node.leaf}
          onChange={handleLeafChange}
        />
      )}
    </fieldset>
  )
}

export function DecisionTreeFormEditor({ data, onChange }: DecisionTreeFormEditorProps) {
  const nodeIds = Object.keys(data.nodes)

  const handleNodeChange = useCallback(
    (nodeId: string, updatedNode: OKFDecisionTreeNode) => {
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
    <div className="visual-form" data-testid="decision-tree-form-editor">
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">ID</span>
          <input
            className="visual-form-input"
            value={data.id}
            onChange={(e) => onChange({ ...data, id: e.target.value })}
            data-testid="dt-id"
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
            data-testid="dt-title"
          />
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Root Node</span>
          <select
            className="visual-form-input"
            value={data.root}
            onChange={(e) => onChange({ ...data, root: e.target.value })}
            data-testid="dt-root"
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
            <DecisionTreeNodeEditor
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
