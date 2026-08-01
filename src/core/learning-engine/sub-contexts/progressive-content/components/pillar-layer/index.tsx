import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { PillarLayerSectionData, PillarLayerBlock, PillarLayerPillar, PillarLayerLayer } from '../../schema'
import { PillarLayerHelpModal } from './PillarLayerHelpModal'
import { SectionTitleBar } from '../../../../../delivery/web-app-shell/SectionTitleBar'
import { useUISystem } from '../../../../../ui-system'
import './pillar-layer.css'

export interface PillarLayerSectionProps {
  title?: string
  description?: string
  section?: PillarLayerSectionData
  pillars?: PillarLayerPillar[]
  layers?: PillarLayerLayer[]
  matrix_blocks?: PillarLayerBlock[]
  sectionIndex?: number
}

export const PillarLayerSection: React.FC<PillarLayerSectionProps> = ({
  title,
  description,
  section,
  pillars: propPillars,
  layers: propLayers,
  matrix_blocks: propBlocks,
  sectionIndex = 0,
}) => {
  const pillars = section?.pillars || propPillars || []
  const layers = section?.layers || propLayers || []
  const matrix_blocks = section?.matrix_blocks || propBlocks || []
  const sectionTitle = title || section?.title
  const sectionDescription = description || section?.description

  let uiSystem: ReturnType<typeof useUISystem> | null = null
  try {
    uiSystem = useUISystem()
  } catch {
    // Fallback when rendered outside UISystemProvider
  }

  const [activeBlock, setActiveBlock] = useState<PillarLayerBlock | null>(null)
  const [hoveredPillarId, setHoveredPillarId] = useState<string | null>(null)
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null)

  const gridTemplateColumns = `minmax(160px, 200px) repeat(${pillars.length}, minmax(180px, 1fr))`

  const handleBlockClick = (block: PillarLayerBlock) => {
    try {
      uiSystem?.sensory?.sound?.playClick()
    } catch {
      // safe fallback
    }
    setActiveBlock(block)
  }

  const handleBlockKeyDown = (e: React.KeyboardEvent, block: PillarLayerBlock) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleBlockClick(block)
    }
  }

  const activePillarName = pillars.find((p) => p.id === activeBlock?.pillar_id)?.title || activeBlock?.pillar_id
  const activeLayerName = layers.find((l) => l.id === activeBlock?.layer_id)?.title || activeBlock?.layer_id

  return (
    <div className="pillar-layer-section" data-testid="pillar-layer-section">
      {/* Standard Unified Section Title Bar */}
      <SectionTitleBar
        title={sectionTitle}
        sectionIndex={sectionIndex}
        HelpModal={PillarLayerHelpModal}
        titleTestId="pillar-layer-title"
      />

      {sectionDescription && (
        <p className="pillar-layer-description">{sectionDescription}</p>
      )}

      {/* 2D CSS Grid Container */}
      <div
        className="pillar-layer-matrix"
        data-testid="pillar-layer-grid"
        style={{ gridTemplateColumns }}
      >
        {/* Top Left Corner */}
        <div
          className="pillar-layer-corner-header"
          style={{ gridColumnStart: 1, gridRowStart: 1 }}
        >
          LAYERS \ PILLARS
        </div>

        {/* Pillar Header Cards (Row 1) */}
        {pillars.map((pillar, pIdx) => {
          const isHighlighted = hoveredPillarId === pillar.id
          const colClass = pillar.color ? `color-${pillar.color}` : ''

          return (
            <div
              key={pillar.id}
              className={`pillar-header-card ${colClass} ${isHighlighted ? 'is-highlighted' : ''}`}
              data-testid={`pillar-header-${pillar.id}`}
              style={{
                gridColumnStart: pIdx + 2,
                gridRowStart: 1,
              }}
              onMouseEnter={() => setHoveredPillarId(pillar.id)}
              onMouseLeave={() => setHoveredPillarId(null)}
            >
              <h4 className="pillar-header-title">{pillar.title}</h4>
              {pillar.subtitle && <p className="pillar-header-subtitle">{pillar.subtitle}</p>}
            </div>
          )
        })}

        {/* Layers (Rows 2..R+1) */}
        {layers.map((layer, lIdx) => {
          const rowStart = lIdx + 2
          const isFullWidth = layer.span === 'full'
          const isHighlighted = hoveredLayerId === layer.id

          return (
            <React.Fragment key={layer.id}>
              {/* Layer Title Row (Column 1) */}
              <div
                className={`layer-row-header ${isHighlighted ? 'is-highlighted' : ''}`}
                data-testid={`layer-row-${layer.id}`}
                style={{
                  gridColumnStart: 1,
                  gridRowStart: rowStart,
                }}
                onMouseEnter={() => setHoveredLayerId(layer.id)}
                onMouseLeave={() => setHoveredLayerId(null)}
              >
                <h5 className="layer-row-title">{layer.title}</h5>
                {layer.description && <p className="layer-row-description">{layer.description}</p>}
              </div>

              {/* Full Width Spanning Layer Content (Columns 2..C+1) */}
              {isFullWidth && layer.blocks && layer.blocks.length > 0 && (
                <div
                  className="full-width-layer-content"
                  data-testid={`full-width-layer-${layer.id}`}
                  style={{
                    gridColumnStart: 2,
                    gridColumnEnd: pillars.length + 2,
                    gridRowStart: rowStart,
                  }}
                >
                  {layer.blocks.map((block, idx) => (
                    <div key={idx} className="full-width-item-chip">
                      {block.title}
                    </div>
                  ))}
                </div>
              )}
            </React.Fragment>
          )
        })}

        {/* 2D Matrix Block Cards */}
        {matrix_blocks.map((block: PillarLayerBlock, idx: number) => {
          const pIdx = pillars.findIndex((p) => p.id === block.pillar_id)
          const lIdx = layers.findIndex((l) => l.id === block.layer_id)

          const colStart = pIdx >= 0 ? pIdx + 2 : 2
          const rowStart = lIdx >= 0 ? lIdx + 2 : 2
          const colSpan = block.col_span || 1
          const rowSpan = block.row_span || 1

          const isHighlighted =
            (hoveredPillarId && block.pillar_id === hoveredPillarId) ||
            (hoveredLayerId && block.layer_id === hoveredLayerId)

          const colClass = block.color ? `color-${block.color}` : ''

          return (
            <div
              key={block.id || `block-${idx}`}
              className={`matrix-block-card ${colClass} ${isHighlighted ? 'is-highlighted' : ''}`}
              data-testid={`pillar-layer-block-${idx}`}
              tabIndex={0}
              role="button"
              aria-label={`View details for ${block.title}`}
              style={{
                gridColumnStart: colStart,
                gridColumnEnd: `span ${colSpan}`,
                gridRowStart: rowStart,
                gridRowEnd: `span ${rowSpan}`,
              }}
              onMouseEnter={() => {
                setHoveredPillarId(block.pillar_id)
                setHoveredLayerId(block.layer_id)
              }}
              onMouseLeave={() => {
                setHoveredPillarId(null)
                setHoveredLayerId(null)
              }}
              onClick={() => handleBlockClick(block)}
              onKeyDown={(e) => handleBlockKeyDown(e, block)}
            >
              <h5 className="matrix-block-title">{block.title}</h5>
              {block.description && (
                <p className="matrix-block-description">{block.description}</p>
              )}
              {block.tags && block.tags.length > 0 && (
                <div className="matrix-block-tags">
                  {block.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="matrix-block-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Block Detail Drawer Modal */}
      {activeBlock && (
        <div
          className="pillar-layer-modal-overlay"
          onClick={() => setActiveBlock(null)}
          data-testid="pillar-layer-block-dialog"
        >
          <div
            className={`pillar-layer-modal-dialog ${activeBlock.color ? `color-${activeBlock.color}` : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pillar-layer-modal-header">
              <div>
                <h4 className="pillar-layer-modal-title">{activeBlock.title}</h4>
                <div className="pillar-layer-modal-badges">
                  <span className="pillar-layer-badge">Pillar: {activePillarName}</span>
                  <span className="pillar-layer-badge">Layer: {activeLayerName}</span>
                  {(activeBlock.col_span || 1) > 1 && (
                    <span className="pillar-layer-badge">Col Span: {activeBlock.col_span}</span>
                  )}
                  {(activeBlock.row_span || 1) > 1 && (
                    <span className="pillar-layer-badge">Row Span: {activeBlock.row_span}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="pillar-layer-modal-close"
                onClick={() => setActiveBlock(null)}
                data-testid="pillar-layer-block-dialog-close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="pillar-layer-modal-body">
              <p>{activeBlock.description || 'No detailed description provided for this component.'}</p>

              {activeBlock.tags && activeBlock.tags.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--ctp-frappe-subtext0)' }}>
                    Tags & Capabilities:
                  </strong>
                  <div className="matrix-block-tags" style={{ marginTop: '0.35rem' }}>
                    {activeBlock.tags.map((tag, idx) => (
                      <span key={idx} className="matrix-block-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pillar-layer-modal-footer">
              <button
                type="button"
                className="pillar-layer-btn-close"
                onClick={() => setActiveBlock(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PillarLayerSection
