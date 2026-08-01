import { useState, useCallback } from 'react'
import { Plus, Trash2, HelpCircle, Columns, Rows, Grid } from 'lucide-react'
import { PillarLayerHelpModal } from './PillarLayerHelpModal'
import type { OKFPillarLayerSectionData } from '../../../../composition/okf/types'
import type { PillarLayerPillar, PillarLayerLayer, PillarLayerBlock } from '../../schema'

interface PillarLayerFormEditorProps {
  data: OKFPillarLayerSectionData
  onChange: (data: OKFPillarLayerSectionData) => void
}

const COLOR_OPTIONS = ['blue', 'mauve', 'green', 'peach', 'sapphire', 'teal', 'sky', 'lavender', 'maroon', 'yellow']

export function PillarLayerFormEditor({ data, onChange }: PillarLayerFormEditorProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'pillars' | 'layers' | 'blocks'>('pillars')

  const pillars = data.pillars || []
  const layers = data.layers || []
  const matrixBlocks = data.matrix_blocks || []

  // Add handlers
  const handleAddPillar = useCallback(() => {
    const newId = `p-${pillars.length + 1}`
    const updated = [
      ...pillars,
      { id: newId, title: `Pillar ${pillars.length + 1}`, color: 'blue' },
    ]
    onChange({ ...data, pillars: updated })
  }, [data, pillars, onChange])

  const handleUpdatePillar = useCallback(
    (index: number, pillar: PillarLayerPillar) => {
      const updated = [...pillars]
      updated[index] = pillar
      onChange({ ...data, pillars: updated })
    },
    [data, pillars, onChange]
  )

  const handleRemovePillar = useCallback(
    (index: number) => {
      const updated = pillars.filter((_, i) => i !== index)
      onChange({ ...data, pillars: updated })
    },
    [data, pillars, onChange]
  )

  const handleAddLayer = useCallback(() => {
    const newId = `l-${layers.length + 1}`
    const updated = [
      ...layers,
      { id: newId, title: `Layer ${layers.length + 1}`, span: 'matrix' as const },
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
    const defaultPillarId = pillars[0]?.id || 'p-1'
    const defaultLayerId = layers[0]?.id || 'l-1'
    const updated: PillarLayerBlock[] = [
      ...matrixBlocks,
      {
        title: `New Block ${matrixBlocks.length + 1}`,
        pillar_id: defaultPillarId,
        layer_id: defaultLayerId,
        col_span: 1,
        row_span: 1,
        color: 'mauve',
      },
    ]
    onChange({ ...data, matrix_blocks: updated })
  }, [data, matrixBlocks, pillars, layers, onChange])

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
    <div className="visual-form space-y-4" data-testid="pillar-layer-form-editor">
      {/* Editor Header */}
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-sm font-bold text-primary flex items-center gap-2">
          <Grid size={16} /> Pillar & Layer Editor
        </h3>
        <button
          type="button"
          onClick={() => setIsHelpOpen(true)}
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          <HelpCircle size={14} /> Help Guide
        </button>
      </div>

      {/* Title & Description Inputs */}
      <div className="space-y-2">
        <label className="text-xs font-semibold block text-muted-foreground">Section Title</label>
        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          placeholder="e.g. Microservices Architecture Matrix"
          className="w-full text-xs p-2 rounded bg-surface0 border border-surface1 text-text"
        />

        <label className="text-xs font-semibold block text-muted-foreground">Description</label>
        <input
          type="text"
          value={data.description || ''}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="e.g. 2D grid matrix of domain pillars and platform layers."
          className="w-full text-xs p-2 rounded bg-surface0 border border-surface1 text-text"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('pillars')}
          className={`text-xs px-3 py-1.5 font-semibold border-b-2 flex items-center gap-1 ${
            activeTab === 'pillars'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          <Columns size={13} /> Pillars ({pillars.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('layers')}
          className={`text-xs px-3 py-1.5 font-semibold border-b-2 flex items-center gap-1 ${
            activeTab === 'layers'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          <Rows size={13} /> Layers ({layers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('blocks')}
          className={`text-xs px-3 py-1.5 font-semibold border-b-2 flex items-center gap-1 ${
            activeTab === 'blocks'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          <Grid size={13} /> Matrix Blocks ({matrixBlocks.length})
        </button>
      </div>

      {/* Tab 1: Pillars */}
      {activeTab === 'pillars' && (
        <div className="space-y-3">
          {pillars.map((pillar, idx) => (
            <div key={pillar.id || idx} className="p-3 rounded bg-surface0 border border-surface1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-secondary">Pillar #{idx + 1} ({pillar.id})</span>
                <button
                  type="button"
                  onClick={() => handleRemovePillar(idx)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground block">ID</label>
                  <input
                    type="text"
                    value={pillar.id}
                    onChange={(e) => handleUpdatePillar(idx, { ...pillar, id: e.target.value })}
                    className="w-full text-xs p-1.5 rounded bg-base border text-text"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block">Title</label>
                  <input
                    type="text"
                    value={pillar.title}
                    onChange={(e) => handleUpdatePillar(idx, { ...pillar, title: e.target.value })}
                    className="w-full text-xs p-1.5 rounded bg-base border text-text"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground block">Subtitle</label>
                  <input
                    type="text"
                    value={pillar.subtitle || ''}
                    onChange={(e) => handleUpdatePillar(idx, { ...pillar, subtitle: e.target.value })}
                    className="w-full text-xs p-1.5 rounded bg-base border text-text"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block">Accent Color</label>
                  <select
                    value={pillar.color || 'blue'}
                    onChange={(e) => handleUpdatePillar(idx, { ...pillar, color: e.target.value })}
                    className="w-full text-xs p-1.5 rounded bg-base border text-text"
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddPillar}
            className="w-full py-2 text-xs font-semibold text-primary border border-dashed border-primary/50 rounded flex items-center justify-center gap-1 hover:bg-primary/10"
          >
            <Plus size={14} /> Add Pillar Column
          </button>
        </div>
      )}

      {/* Tab 2: Layers */}
      {activeTab === 'layers' && (
        <div className="space-y-3">
          {layers.map((layer, idx) => (
            <div key={layer.id || idx} className="p-3 rounded bg-surface0 border border-surface1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-secondary">Layer #{idx + 1} ({layer.id})</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLayer(idx)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
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
                <div>
                  <label className="text-[10px] text-muted-foreground block">Span Mode</label>
                  <select
                    value={layer.span || 'matrix'}
                    onChange={(e) =>
                      handleUpdateLayer(idx, { ...layer, span: e.target.value as 'matrix' | 'full' })
                    }
                    className="w-full text-xs p-1.5 rounded bg-base border text-text"
                  >
                    <option value="matrix">Matrix Row</option>
                    <option value="full">Full Width Row</option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddLayer}
            className="w-full py-2 text-xs font-semibold text-primary border border-dashed border-primary/50 rounded flex items-center justify-center gap-1 hover:bg-primary/10"
          >
            <Plus size={14} /> Add Layer Row
          </button>
        </div>
      )}

      {/* Tab 3: Matrix Blocks */}
      {activeTab === 'blocks' && (
        <div className="space-y-3">
          {matrixBlocks.map((block, idx) => (
            <div key={block.id || idx} className="p-3 rounded bg-surface0 border border-surface1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-secondary">Block #{idx + 1}: {block.title}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveBlock(idx)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground block">Title</label>
                  <input
                    type="text"
                    value={block.title}
                    onChange={(e) => handleUpdateBlock(idx, { ...block, title: e.target.value })}
                    className="w-full text-xs p-1.5 rounded bg-base border text-text"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block">Color Accent</label>
                  <select
                    value={block.color || 'mauve'}
                    onChange={(e) => handleUpdateBlock(idx, { ...block, color: e.target.value })}
                    className="w-full text-xs p-1.5 rounded bg-base border text-text"
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground block">Pillar (Col)</label>
                  <select
                    value={block.pillar_id}
                    onChange={(e) => handleUpdateBlock(idx, { ...block, pillar_id: e.target.value })}
                    className="w-full text-xs p-1.5 rounded bg-base border text-text"
                  >
                    {pillars.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block">Layer (Row)</label>
                  <select
                    value={block.layer_id}
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
                  <label className="text-[10px] text-muted-foreground block">Col Span</label>
                  <input
                    type="number"
                    min={1}
                    value={block.col_span || 1}
                    onChange={(e) =>
                      handleUpdateBlock(idx, { ...block, col_span: parseInt(e.target.value, 10) || 1 })
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
                      handleUpdateBlock(idx, { ...block, row_span: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full text-xs p-1.5 rounded bg-base border text-text"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddBlock}
            className="w-full py-2 text-xs font-semibold text-primary border border-dashed border-primary/50 rounded flex items-center justify-center gap-1 hover:bg-primary/10"
          >
            <Plus size={14} /> Add Matrix Block
          </button>
        </div>
      )}

      {/* Help Modal */}
      <PillarLayerHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  )
}
