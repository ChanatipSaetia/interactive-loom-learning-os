import { useCallback } from 'react'
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
    <fieldset className="visual-form-nested" data-testid={`cm-node-${nodeId}`}>
      <legend>
        {node.title || nodeId} {canRemove ? <button className="form-remove-btn" onClick={onRemove} data-testid={`cm-node-remove-${nodeId}`}>×</button> : null}
      </legend>
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
    </fieldset>
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
    <fieldset className="visual-form-nested" data-testid={`cm-edge-${index}`}>
      <legend>
        Edge {index + 1} {canRemove ? <button className="form-remove-btn" onClick={onRemove} data-testid={`cm-edge-remove-${index}`}>×</button> : null}
      </legend>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">From</span>
          <select
            className="visual-form-input"
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
            className="visual-form-input"
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
          <span className="visual-form-key">Label</span>
          <input
            className="visual-form-input"
            value={edge.label ?? ''}
            onChange={(e) => handleFieldChange('label', e.target.value)}
            placeholder="(optional)"
            data-testid={`cm-edge-${index}-label`}
          />
        </label>
      </div>
    </fieldset>
  )
}

export function ConceptMapFormEditor({ data, onChange }: ConceptMapFormEditorProps) {
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
      <div className="visual-form-field visual-form-field--array">
        <span className="visual-form-key">Nodes ({Object.keys(data.nodes).length})</span>
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
        <button
          className="form-add-btn"
          onClick={handleAddNode}
          data-testid="cm-add-node"
        >
          + Add Node
        </button>
      </div>

      <div className="visual-form-field visual-form-field--array">
        <span className="visual-form-key">Edges ({data.edges.length})</span>
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
        <button
          className="form-add-btn"
          onClick={handleAddEdge}
          data-testid="cm-add-edge"
        >
          + Add Edge
        </button>
      </div>
    </div>
  )
}
