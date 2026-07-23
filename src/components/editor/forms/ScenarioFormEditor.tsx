import { useState, useCallback } from 'react'
import { GitBranch, Star, HelpCircle, Trash2, Plus, Settings, Film } from 'lucide-react'
import { ScenarioHelpModal } from '../../../sections/scenario/ScenarioHelpModal'
import '../../../sections/scenario/scenario.css'
import type {
  OKFScenarioSectionData,
  OKFScenarioNode,
  OKFScenarioChoice,
  OKFScenarioOutcome,
  ScenarioRating,
} from '../../../core/okf/types'

interface ScenarioFormEditorProps {
  data: OKFScenarioSectionData
  onChange: (data: OKFScenarioSectionData) => void
}

// ─── Rating helpers ───────────────────────────────────────────────────────────

const RATING_OPTIONS: { value: ScenarioRating; label: string; color: string }[] = [
  { value: 'a',       label: 'A — Excellent',          color: 'var(--ctp-green)' },
  { value: 'b-plus',  label: 'B+ — Good',              color: 'var(--ctp-teal)' },
  { value: 'b-minus', label: 'B− — Fair',              color: 'var(--ctp-yellow)' },
  { value: 'c',       label: 'C — Needs Improvement',  color: 'var(--ctp-red)' },
]

function ratingColor(rating: ScenarioRating): string {
  return RATING_OPTIONS.find((r) => r.value === rating)?.color ?? 'var(--ctp-overlay0)'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChoiceRow({
  choice,
  index,
  nodeIds,
  onChange,
  onRemove,
}: {
  choice: OKFScenarioChoice
  index: number
  nodeIds: string[]
  onChange: (c: OKFScenarioChoice) => void
  onRemove: () => void
}) {
  const letter = String.fromCharCode(65 + index)
  return (
    <div className="node-detail-choice" data-testid={`sc-choice-${index}`}>
      <div className="node-detail-choice-header">
        <span className="node-detail-choice-badge">{letter}</span>
        <span className="node-detail-choice-label">{choice.text || <em style={{ opacity: 0.5 }}>Untitled choice</em>}</span>
        <button className="form-remove-btn" onClick={onRemove} type="button" title="Remove" data-testid={`sc-choice-remove-${index}`}>
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
                placeholder="e.g. Roll back the deployment"
                onChange={(e) => onChange({ ...choice, text: e.target.value })}
                data-testid={`sc-choice-${index}-text`}
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
                data-testid={`sc-choice-${index}-next`}
              >
                {nodeIds.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Node type helpers ────────────────────────────────────────────────────────

function isOutcomeNode(node: OKFScenarioNode): boolean {
  return !!node.outcome
}

function NodeIcon({ node }: { node: OKFScenarioNode }) {
  if (isOutcomeNode(node)) {
    const color = ratingColor(node.outcome!.rating)
    return <Star size={14} style={{ color }} />
  }
  return <GitBranch size={14} style={{ color: 'var(--primary)' }} />
}

// ─── Main exported component ──────────────────────────────────────────────────

export function ScenarioFormEditor({ data, onChange }: ScenarioFormEditorProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(() => Object.keys(data.nodes)[0] ?? '')
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const nodeIds = Object.keys(data.nodes)
  const selectedNode: OKFScenarioNode | undefined = data.nodes[selectedNodeId]

  const handleNodeChange = useCallback(
    (nodeId: string, updatedNode: OKFScenarioNode) => {
      onChange({ ...data, nodes: { ...data.nodes, [nodeId]: updatedNode } })
    },
    [data, onChange]
  )

  const handleAddNode = useCallback(() => {
    const newId = `node_${Date.now()}`
    const newNode: OKFScenarioNode = { id: newId, prompt: '', choices: [] }
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
    (ci: number, choice: OKFScenarioChoice) => {
      if (!selectedNode) return
      const choices = [...(selectedNode.choices ?? [])]
      choices[ci] = choice
      handleNodeChange(selectedNodeId, { ...selectedNode, choices })
    },
    [selectedNode, selectedNodeId, handleNodeChange]
  )

  const handleOutcomeChange = useCallback(
    (outcome: OKFScenarioOutcome) => {
      if (!selectedNode) return
      handleNodeChange(selectedNodeId, { ...selectedNode, outcome })
    },
    [selectedNode, selectedNodeId, handleNodeChange]
  )

  const toggleNodeType = useCallback(() => {
    if (!selectedNode) return
    if (isOutcomeNode(selectedNode)) {
      // Switch to decision
      const { outcome: _o, ...rest } = selectedNode
      handleNodeChange(selectedNodeId, { ...rest, prompt: selectedNode.prompt ?? '', choices: [] })
    } else {
      // Switch to outcome
      const { choices: _c, ...rest } = selectedNode
      handleNodeChange(selectedNodeId, { ...rest, outcome: { verdict: '', lesson: '', rating: 'a' } })
    }
  }, [selectedNode, selectedNodeId, handleNodeChange])

  return (
    <div className="visual-form" data-testid="scenario-form-editor">

      {/* ── Top toolbar ── */}
      <div className="node-editor-toolbar">
        <span className="node-editor-toolbar-title">
          <Film size={14} />
          Scenario
        </span>
        <button
          className="node-editor-toolbar-btn"
          onClick={() => setShowSettings((v) => !v)}
          type="button"
          data-testid="sc-settings-toggle"
        >
          <Settings size={13} />
          Settings
        </button>
        <button
          className="flowchart-help-btn"
          onClick={() => setIsHelpOpen(true)}
          data-testid="scenario-editor-help-btn"
          type="button"
        >
          <HelpCircle size={13} />
          Guide
        </button>
      </div>

      {/* ── Settings panel (collapsible) ── */}
      {showSettings && (
        <div className="visual-form-card" style={{ marginBottom: '0.75rem' }} data-testid="sc-settings-panel">
          <div className="visual-form-card-header">
            <span className="card-header-title"><Settings size={13} /> Scenario Settings</span>
          </div>
          <div className="visual-form-card-body">
            <div className="visual-form-grid-2">
              <div className="visual-form-field">
                <label className="visual-form-label">
                  <span className="visual-form-key">Title</span>
                  <input
                    className="visual-form-input"
                    value={data.title ?? ''}
                    onChange={(e) => onChange({ ...data, title: e.target.value })}
                    data-testid="sc-title"
                    placeholder="Section title"
                  />
                </label>
              </div>
              <div className="visual-form-field">
                <label className="visual-form-label">
                  <span className="visual-form-key">Start Node</span>
                  <select
                    className="visual-form-select"
                    value={data.startNode ?? ''}
                    onChange={(e) => onChange({ ...data, startNode: e.target.value })}
                    data-testid="sc-startNode"
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
                <span className="visual-form-key">Intro Text</span>
                <textarea
                  className="visual-form-textarea"
                  value={data.intro ?? ''}
                  placeholder="Brief description shown on the intro card before the scenario begins"
                  onChange={(e) => onChange({ ...data, intro: e.target.value })}
                  rows={2}
                  data-testid="sc-intro"
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
          <div className="node-editor-list" data-testid="sc-node-list">
            {nodeIds.map((id) => {
              const node = data.nodes[id]
              const isSelected = id === selectedNodeId
              return (
                <button
                  key={id}
                  className={`node-editor-list-item ${isSelected ? 'node-editor-list-item--active' : ''}`}
                  onClick={() => setSelectedNodeId(id)}
                  type="button"
                  data-testid={`sc-node-item-${id}`}
                >
                  <NodeIcon node={node} />
                  <span className="node-editor-list-item-id">{id}</span>
                  {(data.startNode ?? 'start') === id && (
                    <span className="node-editor-list-root-badge">start</span>
                  )}
                </button>
              )
            })}
          </div>
          <button
            className="node-editor-add-btn"
            onClick={handleAddNode}
            type="button"
            data-testid="sc-add-node"
          >
            <Plus size={13} />
            Add Node
          </button>
        </div>

        {/* Detail panel: selected node */}
        <div className="node-editor-detail">
          {!selectedNode ? (
            <div className="node-editor-empty">
              <Film size={32} style={{ opacity: 0.3 }} />
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
                        // Fix choice.next references
                        for (const node of Object.values(newNodes)) {
                          if (node.choices) {
                            node.choices = node.choices.map((c) =>
                              c.next === selectedNodeId ? { ...c, next: newId } : c
                            )
                          }
                        }
                        onChange({
                          ...data,
                          startNode: (data.startNode ?? 'start') === selectedNodeId ? newId : data.startNode,
                          nodes: newNodes,
                        })
                        setSelectedNodeId(newId)
                      }}
                      data-testid="sc-node-id"
                    />
                  </label>
                </div>
                <div className="node-detail-type-toggle">
                  <button
                    className={`node-detail-type-btn ${!isOutcomeNode(selectedNode) ? 'node-detail-type-btn--active' : ''}`}
                    onClick={() => { if (isOutcomeNode(selectedNode)) toggleNodeType() }}
                    type="button"
                    data-testid="sc-type-decision"
                  >
                    <GitBranch size={13} /> Decision
                  </button>
                  <button
                    className={`node-detail-type-btn ${isOutcomeNode(selectedNode) ? 'node-detail-type-btn--active node-detail-type-btn--leaf' : ''}`}
                    onClick={() => { if (!isOutcomeNode(selectedNode)) toggleNodeType() }}
                    type="button"
                    data-testid="sc-type-outcome"
                  >
                    <Star size={13} /> Outcome
                  </button>
                </div>
                {nodeIds.length > 1 && (
                  <button
                    className="form-remove-btn"
                    onClick={() => handleRemoveNode(selectedNodeId)}
                    type="button"
                    title="Remove this node"
                    data-testid={`sc-node-remove-${selectedNodeId}`}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              {/* Decision node fields */}
              {!isOutcomeNode(selectedNode) && (
                <div className="node-detail-body" data-testid="sc-decision-fields">
                  <div className="visual-form-field">
                    <label className="visual-form-label">
                      <span className="visual-form-key">Prompt <span style={{ fontWeight: 400, opacity: 0.6 }}>(the situation learners face)</span></span>
                      <textarea
                        className="visual-form-textarea"
                        value={selectedNode.prompt ?? ''}
                        placeholder="e.g. Your API latency just spiked to 5 seconds. What do you do first?"
                        onChange={(e) => handleNodeChange(selectedNodeId, { ...selectedNode, prompt: e.target.value })}
                        rows={3}
                        data-testid="sc-node-prompt"
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
                      }]
                      handleNodeChange(selectedNodeId, { ...selectedNode, choices })
                    }}
                    data-testid="sc-add-choice"
                  >
                    <Plus size={12} /> Add Choice
                  </button>
                </div>
              )}

              {/* Outcome node fields */}
              {isOutcomeNode(selectedNode) && selectedNode.outcome && (
                <div className="node-detail-body" data-testid="sc-outcome-fields">
                  <div className="visual-form-field">
                    <label className="visual-form-label">
                      <span className="visual-form-key">Rating</span>
                      <select
                        className="visual-form-select"
                        value={selectedNode.outcome.rating}
                        style={{ color: ratingColor(selectedNode.outcome.rating), fontWeight: 600 }}
                        onChange={(e) => handleOutcomeChange({ ...selectedNode.outcome!, rating: e.target.value as ScenarioRating })}
                        data-testid="sc-outcome-rating"
                      >
                        {RATING_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="visual-form-field">
                    <label className="visual-form-label">
                      <span className="visual-form-key">Verdict <span style={{ fontWeight: 400, opacity: 0.6 }}>(what happened)</span></span>
                      <textarea
                        className="visual-form-textarea"
                        value={selectedNode.outcome.verdict}
                        placeholder="e.g. The deployment caused a cascading failure affecting 40% of users"
                        onChange={(e) => handleOutcomeChange({ ...selectedNode.outcome!, verdict: e.target.value })}
                        rows={3}
                        data-testid="sc-outcome-verdict"
                      />
                    </label>
                  </div>
                  <div className="visual-form-field">
                    <label className="visual-form-label">
                      <span className="visual-form-key">Key Lesson <span style={{ fontWeight: 400, opacity: 0.6 }}>(the takeaway)</span></span>
                      <textarea
                        className="visual-form-textarea"
                        value={selectedNode.outcome.lesson}
                        placeholder="e.g. Always validate database migrations in staging with production-size datasets"
                        onChange={(e) => handleOutcomeChange({ ...selectedNode.outcome!, lesson: e.target.value })}
                        rows={3}
                        data-testid="sc-outcome-lesson"
                      />
                    </label>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ScenarioHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  )
}
