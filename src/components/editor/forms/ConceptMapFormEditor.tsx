import { useState, useCallback } from 'react'
import { Share2, GitCommit, Plus, Trash2, HelpCircle } from 'lucide-react'
import { ConceptMapHelpModal } from '../../../core/subdomains/practice-assessment/components/concept-map/ConceptMapHelpModal'
import type {
  OKFConceptMapSectionData,
  OKFConceptNode,
  OKFConceptEdge,
} from '../../../core/okf/types'

interface ConceptMapFormEditorProps {
  data: OKFConceptMapSectionData
  onChange: (data: OKFConceptMapSectionData) => void
}

function ConceptNodeEditor({
  nodeId,
  node,
  onChange,
  onRemove,
  canRemove,
}: {
  nodeId: string
  node: OKFConceptNode
  onChange: (node: OKFConceptNode) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const handleFieldChange = useCallback(
    (field: keyof OKFConceptNode, value: string) => {
      onChange({ ...node, [field]: value })
    },
    [node, onChange]
  )

  return (
    <div className="visual-form-card" data-testid={`cm-node-${nodeId}`}>
      <div className="visual-form-card-header">
        <span className="card-header-title">
          <Share2 size={13} /> Node: <code className="card-code-pill">{node.title || nodeId}</code>
        </span>
        {canRemove && (
          <button
            className="form-remove-btn"
            onClick={onRemove}
            data-testid={`cm-node-remove-${nodeId}`}
            type="button"
            title="Remove node"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="visual-form-card-body">
        <div className="visual-form-grid-3">
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">ID</span>
              <input
                className="visual-form-input"
                value={node.id}
                onChange={(e) => handleFieldChange('id', e.target.value)}
                data-testid={`cm-node-${nodeId}-id`}
              />
            </label>
          </div>
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Title</span>
              <input
                className="visual-form-input"
                value={node.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                data-testid={`cm-node-${nodeId}-title`}
              />
            </label>
          </div>
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Category</span>
              <input
                className="visual-form-input"
                value={node.category}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                data-testid={`cm-node-${nodeId}-category`}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConceptEdgeEditor({
  edge,
  index,
  nodeIds,
  onChange,
  onRemove,
  canRemove,
}: {
  edge: OKFConceptEdge
  index: number
  nodeIds: string[]
  onChange: (edge: OKFConceptEdge) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const handleFieldChange = useCallback(
    (field: keyof OKFConceptEdge, value: string) => {
      onChange({ ...edge, [field]: value })
    },
    [edge, onChange]
  )

  return (
    <div className="visual-form-card" data-testid={`cm-edge-${index}`}>
      <div className="visual-form-card-header">
        <span className="card-header-title">
          <GitCommit size={13} /> Edge #{index + 1}: <code className="card-code-pill">{edge.from} → {edge.to}</code>
        </span>
        {canRemove && (
          <button
            className="form-remove-btn"
            onClick={onRemove}
            data-testid={`cm-edge-remove-${index}`}
            type="button"
            title="Remove edge"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="visual-form-card-body">
        <div className="visual-form-grid-3">
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">From</span>
              <select
                className="visual-form-select"
                value={edge.from}
                onChange={(e) => handleFieldChange('from', e.target.value)}
                data-testid={`cm-edge-${index}-from`}
              >
                {nodeIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">To</span>
              <select
                className="visual-form-select"
                value={edge.to}
                onChange={(e) => handleFieldChange('to', e.target.value)}
                data-testid={`cm-edge-${index}-to`}
              >
                {nodeIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Relation Label</span>
              <input
                className="visual-form-input"
                value={edge.label ?? ''}
                onChange={(e) => handleFieldChange('label', e.target.value)}
                placeholder="(optional)"
                data-testid={`cm-edge-${index}-label`}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

type ConceptMapSubTab = 'nodes' | 'edges'

export function ConceptMapFormEditor({ data, onChange }: ConceptMapFormEditorProps) {
  const [activeTab, setActiveTab] = useState<ConceptMapSubTab>('nodes')
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const nodeIds = Object.keys(data.nodes)

  const handleNodeChange = useCallback(
    (nodeId: string, updatedNode: OKFConceptNode) => {
      if (updatedNode.id !== nodeId) {
        const newNodes = { ...data.nodes }
        delete newNodes[nodeId]
        newNodes[updatedNode.id] = updatedNode
        onChange({ ...data, nodes: newNodes })
        return
      }
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
      const newEdges = data.edges.filter(
        (e) => e.from !== nodeId && e.to !== nodeId
      )
      onChange({ ...data, nodes: newNodes, edges: newEdges })
    },
    [data, onChange]
  )

  const handleAddNode = useCallback(() => {
    const newId = `node${Object.keys(data.nodes).length + 1}`
    const newNode: OKFConceptNode = {
      id: newId,
      title: '',
      category: 'default',
    }
    onChange({
      ...data,
      nodes: { ...data.nodes, [newId]: newNode },
    })
  }, [data, onChange])

  const handleEdgeChange = useCallback(
    (edgeIndex: number, updatedEdge: OKFConceptEdge) => {
      const updated = [...data.edges]
      updated[edgeIndex] = updatedEdge
      onChange({ ...data, edges: updated })
    },
    [data, onChange]
  )

  const handleRemoveEdge = useCallback(
    (edgeIndex: number) => {
      const updated = data.edges.filter((_, i) => i !== edgeIndex)
      onChange({ ...data, edges: updated })
    },
    [data, onChange]
  )

  const handleAddEdge = useCallback(() => {
    const newEdge: OKFConceptEdge = {
      from: nodeIds[0] ?? '',
      to: nodeIds[1] ?? nodeIds[0] ?? '',
      label: '',
    }
    onChange({ ...data, edges: [...data.edges, newEdge] })
  }, [data, onChange, nodeIds])

  return (
    <div className="visual-form" data-testid="concept-map-form-editor">
      {/* Editor Sub-Tabs */}
      <div className="flowchart-sub-tabs" data-testid="cm-sub-tabs" style={{ marginBottom: '16px' }}>
        <button
          className={`flowchart-sub-tab ${activeTab === 'nodes' ? 'active' : ''}`}
          onClick={() => setActiveTab('nodes')}
          data-testid="cm-tab-nodes"
          type="button"
        >
          <Share2 size={14} />
          <span>Nodes</span>
          <span className="sub-tab-badge">{Object.keys(data.nodes).length}</span>
        </button>
        <button
          className={`flowchart-sub-tab ${activeTab === 'edges' ? 'active' : ''}`}
          onClick={() => setActiveTab('edges')}
          data-testid="cm-tab-edges"
          type="button"
        >
          <GitCommit size={14} />
          <span>Edges</span>
          <span className="sub-tab-badge">{data.edges.length}</span>
        </button>

        <button
          className="cm-help-btn"
          onClick={() => setIsHelpOpen(true)}
          data-testid="cm-editor-help-btn"
          type="button"
          style={{ marginLeft: 'auto' }}
        >
          <HelpCircle size={13} />
          <span>Guide</span>
        </button>
      </div>

      <ConceptMapHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Nodes Sub-Tab */}
      {activeTab === 'nodes' && (
        <div className="visual-form-field visual-form-field--array" data-testid="cm-nodes-tab-content">
          <div className="visual-form-section-header">
            <span className="visual-form-key">Concept Nodes ({Object.keys(data.nodes).length})</span>
            <button
              className="form-add-btn"
              onClick={handleAddNode}
              data-testid="cm-add-node"
              type="button"
            >
              <Plus size={13} /> Add Node
            </button>
          </div>
          <div className="visual-form-object-list">
            {Object.entries(data.nodes).map(([id, node]) => (
              <ConceptNodeEditor
                key={id}
                nodeId={id}
                node={node}
                onChange={(updated) => handleNodeChange(id, updated)}
                onRemove={() => handleRemoveNode(id)}
                canRemove={Object.keys(data.nodes).length > 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Edges Sub-Tab */}
      {activeTab === 'edges' && (
        <div className="visual-form-field visual-form-field--array" data-testid="cm-edges-tab-content">
          <div className="visual-form-section-header">
            <span className="visual-form-key">Concept Edges ({data.edges.length})</span>
            <button
              className="form-add-btn"
              onClick={handleAddEdge}
              data-testid="cm-add-edge"
              type="button"
            >
              <Plus size={13} /> Add Edge
            </button>
          </div>
          <div className="visual-form-object-list">
            {data.edges.map((edge, i) => (
              <ConceptEdgeEditor
                key={i}
                edge={edge}
                index={i}
                nodeIds={nodeIds}
                onChange={(updated) => handleEdgeChange(i, updated)}
                onRemove={() => handleRemoveEdge(i)}
                canRemove={data.edges.length > 0}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
