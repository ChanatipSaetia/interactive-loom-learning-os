import { useState, useCallback } from 'react'
import { GitBranch, CheckSquare, HelpCircle, Trash2, Plus, Settings } from 'lucide-react'
import { DecisionTreeHelpModal } from './DecisionTreeHelpModal'
import './decision-tree.css'
import type {
  OKFDecisionTreeSectionData,
  OKFDecisionTreeNode,
  OKFDecisionTreeChoice,
  OKFDecisionTreeLeaf,
} from '../../../../composition/okf/types'

interface DecisionTreeFormEditorProps {
  data: OKFDecisionTreeSectionData
  onChange: (data: OKFDecisionTreeSectionData) => void
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChoiceRow({
  choice,
  index,
  nodeIds,
  onChange,
  onRemove,
}: {
  choice: OKFDecisionTreeChoice
  index: number
  nodeIds: string[]
  onChange: (c: OKFDecisionTreeChoice) => void
  onRemove: () => void
}) {
  const letter = String.fromCharCode(65 + index)
  return (
    <div className="node-detail-choice" data-testid={`dt-choice-${index}`}>
      <div className="node-detail-choice-header">
        <span className="node-detail-choice-badge">{letter}</span>
        <span className="node-detail-choice-label">{choice.text || <em style={{ opacity: 0.5 }}>Untitled choice</em>}</span>
        <label className="node-detail-recommended-toggle" title="Mark as recommended path">
          <input
            type="checkbox"
            checked={choice.recommended ?? false}
            onChange={(e) => onChange({ ...choice, recommended: e.target.checked })}
            data-testid={`dt-choice-${index}-recommended`}
          />
          <span>Recommended</span>
        </label>
        <button className="form-remove-btn" onClick={onRemove} type="button" title="Remove choice" data-testid={`dt-choice-remove-${index}`}>
          <Trash2 size={12} />
        </button>
      </div>
      <div className="node-detail-choice-body">
        <div className="visual-form-grid-2">
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Choice Text</span>
              <input
                className="visual-form-input"
                value={choice.text}
                placeholder="e.g. Use a message queue"
                onChange={(e) => onChange({ ...choice, text: e.target.value })}
                data-testid={`dt-choice-${index}-text`}
              />
            </label>
          </div>
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Next Node →</span>
              <select
                className="visual-form-select"
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
        </div>
        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key">Rationale <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional — shown as sub-text)</span></span>
            <textarea
              className="visual-form-textarea"
              value={choice.rationale ?? ''}
              placeholder="Why would someone choose this?"
              onChange={(e) => onChange({ ...choice, rationale: e.target.value })}
              rows={2}
              data-testid={`dt-choice-${index}-rationale`}
            />
          </label>
        </div>
      </div>
    </div>
  )
}

function TradeoffList({
  items,
  onChange,
}: {
  items: string[]
  onChange: (items: string[]) => void
}) {
  return (
    <div className="node-detail-tradeoffs">
      {items.map((item, i) => (
        <div key={i} className="node-detail-tradeoff-row">
          <span className="node-detail-tradeoff-bullet">•</span>
          <input
            className="visual-form-input"
            value={item}
            placeholder="Trade-off point…"
            onChange={(e) => {
              const next = [...items]
              next[i] = e.target.value
              onChange(next)
            }}
            data-testid={`dt-tradeoff-${i}`}
          />
          <button
            className="form-remove-btn"
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            title="Remove"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button
        className="node-detail-add-btn"
        type="button"
        onClick={() => onChange([...items, ''])}
        data-testid="dt-add-tradeoff"
      >
        <Plus size={12} />
        Add Trade-off
      </button>
    </div>
  )
}

// ─── Node type helpers ────────────────────────────────────────────────────────

function isLeafNode(node: OKFDecisionTreeNode): boolean {
  return !!(node.leaf)
}

function NodeIcon({ node }: { node: OKFDecisionTreeNode }) {
  if (isLeafNode(node)) return <CheckSquare size={14} style={{ color: 'var(--secondary)' }} />
  return <GitBranch size={14} style={{ color: 'var(--primary)' }} />
}

// ─── Main exported component ──────────────────────────────────────────────────

export function DecisionTreeFormEditor({ data, onChange }: DecisionTreeFormEditorProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(() => Object.keys(data.nodes)[0] ?? '')
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const nodeIds = Object.keys(data.nodes)
  const selectedNode: OKFDecisionTreeNode | undefined = data.nodes[selectedNodeId]

  const handleNodeChange = useCallback(
    (nodeId: string, updatedNode: OKFDecisionTreeNode) => {
      onChange({ ...data, nodes: { ...data.nodes, [nodeId]: updatedNode } })
    },
    [data, onChange]
  )

  const handleAddNode = useCallback(() => {
    const newId = `node_${Date.now()}`
    const newNode: OKFDecisionTreeNode = { id: newId, prompt: '', choices: [] }
    onChange({ ...data, nodes: { ...data.nodes, [newId]: newNode } })
    setSelectedNodeId(newId)
  }, [data, onChange])

  const handleRemoveNode = useCallback(
    (nodeId: string) => {
      const newNodes = { ...data.nodes }
      delete newNodes[nodeId]
      onChange({ ...data, nodes: newNodes })
      const remaining = Object.keys(newNodes)
      setSelectedNodeId(remaining[0] ?? '')
    },
    [data, onChange]
  )

  const handleChoiceChange = useCallback(
    (ci: number, choice: OKFDecisionTreeChoice) => {
      if (!selectedNode) return
      const choices = [...(selectedNode.choices ?? [])]
      choices[ci] = choice
      handleNodeChange(selectedNodeId, { ...selectedNode, choices })
    },
    [selectedNode, selectedNodeId, handleNodeChange]
  )

  const handleLeafChange = useCallback(
    (leaf: OKFDecisionTreeLeaf) => {
      if (!selectedNode) return
      handleNodeChange(selectedNodeId, { ...selectedNode, leaf })
    },
    [selectedNode, selectedNodeId, handleNodeChange]
  )

  const toggleNodeType = useCallback(() => {
    if (!selectedNode) return
    if (isLeafNode(selectedNode)) {
      // Switch to decision
      const rest = { ...selectedNode } as Record<string, unknown>
      delete rest.leaf
      handleNodeChange(selectedNodeId, { ...rest, id: selectedNodeId, prompt: selectedNode.prompt ?? '', choices: [] })
    } else {
      // Switch to leaf
      const rest = { ...selectedNode } as Record<string, unknown>
      delete rest.choices
      handleNodeChange(selectedNodeId, { ...rest, id: selectedNodeId, leaf: { recommendation: '', explanation: '', tradeoffs: [] } })
    }
  }, [selectedNode, selectedNodeId, handleNodeChange])

  return (
    <div className="visual-form" data-testid="decision-tree-form-editor">

      {/* ── Top toolbar ── */}
      <div className="node-editor-toolbar">
        <span className="node-editor-toolbar-title">
          <GitBranch size={14} />
          Decision Tree
        </span>
        <button
          className="node-editor-toolbar-btn"
          onClick={() => setShowSettings((v) => !v)}
          type="button"
          title="Tree settings"
          data-testid="dt-settings-toggle"
        >
          <Settings size={13} />
          Settings
        </button>
        <button
          className="flowchart-help-btn"
          onClick={() => setIsHelpOpen(true)}
          data-testid="dt-editor-help-btn"
          type="button"
        >
          <HelpCircle size={13} />
          Guide
        </button>
      </div>

      {/* ── Settings panel (collapsible) ── */}
      {showSettings && (
        <div className="visual-form-card" style={{ marginBottom: '0.75rem' }} data-testid="dt-settings-panel">
          <div className="visual-form-card-header">
            <span className="card-header-title"><Settings size={13} /> Tree Settings</span>
          </div>
          <div className="visual-form-card-body">
            <div className="visual-form-grid-2">
              <div className="visual-form-field">
                <label className="visual-form-label">
                  <span className="visual-form-key">Title</span>
                  <input
                    className="visual-form-input"
                    value={data.title}
                    onChange={(e) => onChange({ ...data, title: e.target.value })}
                    data-testid="dt-title"
                    placeholder="Section title"
                  />
                </label>
              </div>
              <div className="visual-form-field">
                <label className="visual-form-label">
                  <span className="visual-form-key">Root Node</span>
                  <select
                    className="visual-form-select"
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
            </div>
            <div className="visual-form-field">
              <label className="visual-form-label">
                <span className="visual-form-key">Section ID</span>
                <input
                  className="visual-form-input"
                  value={data.id}
                  onChange={(e) => onChange({ ...data, id: e.target.value })}
                  data-testid="dt-id"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── Two-column layout: sidebar + detail ── */}
      <div className="node-editor-layout">

        {/* Sidebar: node list */}
        <div className="node-editor-sidebar">
          <div className="node-editor-sidebar-header">
            <span>Nodes</span>
            <span className="sub-tab-badge">{nodeIds.length}</span>
          </div>
          <div className="node-editor-list" data-testid="dt-node-list">
            {nodeIds.map((id) => {
              const node = data.nodes[id]
              const isSelected = id === selectedNodeId
              return (
                <button
                  key={id}
                  className={`node-editor-list-item ${isSelected ? 'node-editor-list-item--active' : ''}`}
                  onClick={() => setSelectedNodeId(id)}
                  type="button"
                  data-testid={`dt-node-item-${id}`}
                >
                  <NodeIcon node={node} />
                  <span className="node-editor-list-item-id">{id}</span>
                  {data.root === id && (
                    <span className="node-editor-list-root-badge">root</span>
                  )}
                </button>
              )
            })}
          </div>
          <button
            className="node-editor-add-btn"
            onClick={handleAddNode}
            type="button"
            data-testid="dt-add-node"
          >
            <Plus size={13} />
            Add Node
          </button>
        </div>

        {/* Detail panel: selected node */}
        <div className="node-editor-detail">
          {!selectedNode ? (
            <div className="node-editor-empty">
              <GitBranch size={32} style={{ opacity: 0.3 }} />
              <p>No node selected. Add a node from the sidebar.</p>
            </div>
          ) : (
            <>
              {/* Node ID + type toggle header */}
              <div className="node-detail-header">
                <div className="visual-form-field" style={{ flex: 1 }}>
                  <label className="visual-form-label">
                    <span className="visual-form-key">Node ID</span>
                    <input
                      className="visual-form-input"
                      value={selectedNodeId}
                      onChange={(e) => {
                        const newId = e.target.value
                        if (!newId || newId === selectedNodeId) return
                        const newNodes: typeof data.nodes = {}
                        for (const [k, v] of Object.entries(data.nodes)) {
                          newNodes[k === selectedNodeId ? newId : k] = v
                        }
                        // Fix any choice.next pointing to old id
                        for (const node of Object.values(newNodes)) {
                          if (node.choices) {
                            node.choices = node.choices.map((c) =>
                              c.next === selectedNodeId ? { ...c, next: newId } : c
                            )
                          }
                        }
                        onChange({
                          ...data,
                          root: data.root === selectedNodeId ? newId : data.root,
                          nodes: newNodes,
                        })
                        setSelectedNodeId(newId)
                      }}
                      data-testid="dt-node-id"
                    />
                  </label>
                </div>
                <div className="node-detail-type-toggle">
                  <button
                    className={`node-detail-type-btn ${!isLeafNode(selectedNode) ? 'node-detail-type-btn--active' : ''}`}
                    onClick={() => { if (isLeafNode(selectedNode)) toggleNodeType() }}
                    type="button"
                    data-testid="dt-type-decision"
                  >
                    <GitBranch size={13} /> Decision
                  </button>
                  <button
                    className={`node-detail-type-btn ${isLeafNode(selectedNode) ? 'node-detail-type-btn--active node-detail-type-btn--leaf' : ''}`}
                    onClick={() => { if (!isLeafNode(selectedNode)) toggleNodeType() }}
                    type="button"
                    data-testid="dt-type-leaf"
                  >
                    <CheckSquare size={13} /> Leaf
                  </button>
                </div>
                {nodeIds.length > 1 && (
                  <button
                    className="form-remove-btn"
                    onClick={() => handleRemoveNode(selectedNodeId)}
                    type="button"
                    title="Remove this node"
                    data-testid={`dt-node-remove-${selectedNodeId}`}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              {/* Decision node fields */}
              {!isLeafNode(selectedNode) && (
                <div className="node-detail-body" data-testid="dt-decision-fields">
                  <div className="visual-form-field">
                    <label className="visual-form-label">
                      <span className="visual-form-key">Prompt <span style={{ fontWeight: 400, opacity: 0.6 }}>(the question learners see)</span></span>
                      <textarea
                        className="visual-form-textarea"
                        value={selectedNode.prompt ?? ''}
                        placeholder="e.g. Your service is receiving 10× normal traffic. What do you do first?"
                        onChange={(e) => handleNodeChange(selectedNodeId, { ...selectedNode, prompt: e.target.value })}
                        rows={3}
                        data-testid="dt-node-prompt"
                      />
                    </label>
                  </div>

                  <div className="node-detail-section-label">
                    <span>Choices</span>
                    <span className="sub-tab-badge">{(selectedNode.choices ?? []).length}</span>
                  </div>
                  {(selectedNode.choices ?? []).map((choice, ci) => (
                    <ChoiceRow
                      key={choice.id || ci}
                      choice={choice}
                      index={ci}
                      nodeIds={nodeIds}
                      onChange={(c) => handleChoiceChange(ci, c)}
                      onRemove={() => {
                        const newChoices = (selectedNode.choices ?? []).filter((_, j) => j !== ci)
                        handleNodeChange(selectedNodeId, { ...selectedNode, choices: newChoices })
                      }}
                    />
                  ))}
                  <button
                    className="node-detail-add-btn"
                    type="button"
                    onClick={() => {
                      const choices = [...(selectedNode.choices ?? []), {
                        id: `choice_${Date.now()}`,
                        text: '',
                        next: nodeIds[0] ?? '',
                        recommended: false,
                      }]
                      handleNodeChange(selectedNodeId, { ...selectedNode, choices })
                    }}
                    data-testid="dt-add-choice"
                  >
                    <Plus size={12} /> Add Choice
                  </button>
                </div>
              )}

              {/* Leaf node fields */}
              {isLeafNode(selectedNode) && selectedNode.leaf && (
                <div className="node-detail-body" data-testid="dt-leaf-fields">
                  <div className="visual-form-field">
                    <label className="visual-form-label">
                      <span className="visual-form-key">Recommendation <span style={{ fontWeight: 400, opacity: 0.6 }}>(the final verdict)</span></span>
                      <textarea
                        className="visual-form-textarea"
                        value={selectedNode.leaf.recommendation}
                        placeholder="e.g. Use a circuit breaker pattern with exponential back-off"
                        onChange={(e) => handleLeafChange({ ...selectedNode.leaf!, recommendation: e.target.value })}
                        rows={3}
                        data-testid="dt-leaf-recommendation"
                      />
                    </label>
                  </div>
                  <div className="visual-form-field">
                    <label className="visual-form-label">
                      <span className="visual-form-key">Explanation</span>
                      <textarea
                        className="visual-form-textarea"
                        value={selectedNode.leaf.explanation}
                        placeholder="Why is this the right approach?"
                        onChange={(e) => handleLeafChange({ ...selectedNode.leaf!, explanation: e.target.value })}
                        rows={3}
                        data-testid="dt-leaf-explanation"
                      />
                    </label>
                  </div>
                  <div className="node-detail-section-label">Trade-offs</div>
                  <TradeoffList
                    items={selectedNode.leaf.tradeoffs ?? []}
                    onChange={(tradeoffs) => handleLeafChange({ ...selectedNode.leaf!, tradeoffs })}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <DecisionTreeHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  )
}
