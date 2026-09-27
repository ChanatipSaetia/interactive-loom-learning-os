import { useState, useCallback } from 'react'
import { Plus, Trash2, HelpCircle, Rows, Grid } from 'lucide-react'
import { PillarLayerHelpModal } from './PillarLayerHelpModal'
import type { OKFPillarLayerSectionData } from '../../../../composition/okf/types'
import { PILLAR_LAYER_BLOCK_COLORS, type PillarLayerLayer, type PillarLayerBlock, type PillarLayerBlockColor } from '../../schema'

interface PillarLayerFormEditorProps {
  data: OKFPillarLayerSectionData
  onChange: (data: OKFPillarLayerSectionData) => void
}

export function PillarLayerFormEditor({ data, onChange }: PillarLayerFormEditorProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'layers' | 'blocks'>('layers')

  const layers = data.layers || []
  const matrixBlocks = data.matrix_blocks || []

  // Add handlers
  const handleAddLayer = useCallback(() => {
    const newId = `l-${layers.length + 1}`
    const updated = [
      ...layers,
      { id: newId, title: `Layer ${layers.length + 1}` },
    ]
    onChange({ ...data, layers: updated })
  }, [data, layers, onChange])

  const handleUpdateLayer = useCallback(
    (index: number, layer: PillarLayerLayer) => {
      const updated = [...layers]
      updated[index] = layer
      onChange({ ...data, layers: updated })
    },
    [data, layers, onChange]
  )

  const handleRemoveLayer = useCallback(
    (index: number) => {
      const updated = layers.filter((_, i) => i !== index)
      onChange({ ...data, layers: updated })
    },
    [data, layers, onChange]
  )

  const handleAddBlock = useCallback(() => {
    const defaultLayerId = layers[0]?.id || 'l-1'
    const updated: PillarLayerBlock[] = [
      ...matrixBlocks,
      {
        title: `New Block ${matrixBlocks.length + 1}`,
        layer_id: defaultLayerId,
        col_span: 1,
        row_span: 1,
        color: 'mauve',
      },
    ]
    onChange({ ...data, matrix_blocks: updated })
  }, [data, matrixBlocks, layers, onChange])

  const handleUpdateBlock = useCallback(
    (index: number, block: PillarLayerBlock) => {
      const updated = [...matrixBlocks]
      updated[index] = block
      onChange({ ...data, matrix_blocks: updated })
    },
    [data, matrixBlocks, onChange]
  )

  const handleRemoveBlock = useCallback(
    (index: number) => {
      const updated = matrixBlocks.filter((_, i) => i !== index)
      onChange({ ...data, matrix_blocks: updated })
    },
    [data, matrixBlocks, onChange]
  )

  return (
    <div className="space-y-4 text-xs">
      {/* Editor Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div>
          <h3 className="font-semibold text-text text-sm">Layer Stacked Lego Architecture</h3>
          <p className="text-[11px] text-muted-foreground">
            Configure layers and Lego building blocks stacked bottom-to-top.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsHelpOpen(true)}
          className="p-1 rounded hover:bg-base text-muted-foreground hover:text-text"
          title="Section Guide"
        >
          <HelpCircle size={14} />
        </button>
      </div>

      {/* Basic Metadata */}
      <div className="space-y-2">
        <div>
          <label className="text-[10px] text-muted-foreground block mb-1">Section Title</label>
          <input
            type="text"
            value={data.title || ''}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            className="w-full text-xs p-1.5 rounded bg-base border text-text"
            placeholder="e.g. Hexagonal Architecture (Layer Stack)"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground block mb-1">Description</label>
          <textarea
            value={data.description || ''}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
            rows={2}
            className="w-full text-xs p-1.5 rounded bg-base border text-text"
            placeholder="Describe the architectural layer stack..."
          />
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('layers')}
          className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 text-xs font-medium ${
            activeTab === 'layers'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-text'
          }`}
        >
          <Rows size={12} /> Layers ({layers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('blocks')}
          className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 text-xs font-medium ${
            activeTab === 'blocks'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-text'
          }`}
        >
          <Grid size={12} /> Lego Blocks ({matrixBlocks.length})
        </button>
      </div>

      {/* Tab 1: Layers */}
      {activeTab === 'layers' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Architectural Layers</span>
            <button
              type="button"
              onClick={handleAddLayer}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-90"
            >
              <Plus size={12} /> Add Layer
            </button>
          </div>
          {layers.map((layer, idx) => (
            <div key={layer.id || idx} className="p-2.5 rounded border border-border bg-surface space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text">Layer #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLayer(idx)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground block">ID</label>
                  <input
                    type="text"
                    value={layer.id}
                    onChange={(e) => handleUpdateLayer(idx, { ...layer, id: e.target.value })}
                    className="w-full text-xs p-1.5 rounded bg-base border text-text"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block">Title</label>
                  <input
                    type="text"
                    value={layer.title}
                    onChange={(e) => handleUpdateLayer(idx, { ...layer, title: e.target.value })}
                    className="w-full text-xs p-1.5 rounded bg-base border text-text"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Matrix Lego Blocks */}
      {activeTab === 'blocks' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Lego Building Blocks</span>
            <button
              type="button"
              onClick={handleAddBlock}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-90"
            >
              <Plus size={12} /> Add Block
            </button>
          </div>
          {matrixBlocks.map((block, idx) => (
            <div key={block.id || idx} className="p-2.5 rounded border border-border bg-surface space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text">Block #{idx + 1}: {block.title}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveBlock(idx)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Title</label>
                <input
                  type="text"
                  value={block.title}
                  onChange={(e) => handleUpdateBlock(idx, { ...block, title: e.target.value })}
                  className="w-full text-xs p-1.5 rounded bg-base border text-text"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Description</label>
                <textarea
                  value={block.description || ''}
                  onChange={(e) => handleUpdateBlock(idx, { ...block, description: e.target.value })}
                  rows={2}
                  className="w-full text-xs p-1.5 rounded bg-base border text-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground block">Layer ID</label>
                  <select
                    value={block.layer_id || ''}
                    onChange={(e) => handleUpdateBlock(idx, { ...block, layer_id: e.target.value })}
                    className="w-full text-xs p-1.5 rounded bg-base border text-text"
                  >
                    {layers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title} ({l.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block">Block Shape</label>
                  <select
                    value={block.shape || 'rect'}
                    onChange={(e) =>
                      handleUpdateBlock(idx, {
                        ...block,
                        shape: e.target.value as PillarLayerBlock['shape'],
                      })
                    }
                    className="w-full text-xs p-1.5 rounded bg-base border text-text"
                  >
                    <option value="rect">Rectangle</option>
                    <option value="l-bottom-left">L-Shape (Bottom Left)</option>
                    <option value="l-bottom-right">L-Shape (Bottom Right)</option>
                    <option value="l-top-left">L-Shape (Top Left)</option>
                    <option value="l-top-right">L-Shape (Top Right)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground block">Col Span</label>
                  <input
                    type="number"
                    min={1}
                    value={block.col_span || 1}
                    onChange={(e) =>
                      handleUpdateBlock(idx, { ...block, col_span: parseInt(e.target.value) || 1 })
                    }
                    className="w-full text-xs p-1.5 rounded bg-base border text-text"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block">Row Span</label>
                  <input
                    type="number"
                    min={1}
                    value={block.row_span || 1}
                    onChange={(e) =>
                      handleUpdateBlock(idx, { ...block, row_span: parseInt(e.target.value) || 1 })
                    }
                    className="w-full text-xs p-1.5 rounded bg-base border text-text"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block">Color Accent</label>
                  <select
                    value={block.color || 'mauve'}
                    onChange={(e) => handleUpdateBlock(idx, { ...block, color: e.target.value as PillarLayerBlockColor })}
                    className="w-full text-xs p-1.5 rounded bg-base border text-text"
                  >
                    {PILLAR_LAYER_BLOCK_COLORS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section Help Guide Modal */}
      {isHelpOpen && <PillarLayerHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />}
    </div>
  )
}
