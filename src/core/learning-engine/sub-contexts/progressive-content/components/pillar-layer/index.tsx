import React, { useState } from 'react'
import type { PillarLayerSectionData, PillarLayerBlock, PillarLayerLayer } from '../../schema'
import { PillarLayerHelpModal } from './PillarLayerHelpModal'
import { SectionTitleBar } from '../../../../../delivery/web-app-shell/SectionTitleBar'
import './pillar-layer.css'

export interface PillarLayerSectionProps {
  title?: string
  description?: string
  section?: PillarLayerSectionData
  layers?: PillarLayerLayer[]
  matrix_blocks?: PillarLayerBlock[]
  sectionIndex?: number
}



function detectShapeFromOffsets(offsets: Array<[number, number]>): string | undefined {
  if (!offsets || offsets.length === 0) return undefined
  const rMax = Math.max(...offsets.map(([dr]) => dr))
  const cMax = Math.max(...offsets.map(([_, dc]) => dc))
  if (rMax <= 0 || cMax <= 0) return 'rect'

  const set = new Set(offsets.map(([dr, dc]) => `${dr},${dc}`))

  if (set.has('0,0') && set.has('1,0') && set.has('1,1') && !set.has('0,1')) {
    return 'l-bottom-left'
  }
  if (set.has('0,1') && set.has('1,0') && set.has('1,1') && !set.has('0,0')) {
    return 'l-bottom-right'
  }
  if (set.has('0,0') && set.has('0,1') && set.has('1,0') && !set.has('1,1')) {
    return 'l-top-left'
  }
  if (set.has('0,0') && set.has('0,1') && set.has('1,1') && !set.has('1,0')) {
    return 'l-top-right'
  }

  return undefined
}

function getBlockClipPath(shape?: string, colSpan = 1, rowSpan = 1): string | undefined {
  if (!shape || shape === 'rect' || colSpan <= 1 || rowSpan <= 1) {
    return undefined
  }

  const xCutPct = Math.round(((colSpan - 1) / colSpan) * 100)
  const xStemPct = Math.round((1 / colSpan) * 100)
  const yCutPct = Math.round(((rowSpan - 1) / rowSpan) * 100)
  const yStemPct = Math.round((1 / rowSpan) * 100)

  switch (shape) {
    case 'l-bottom-left':
      return `polygon(0 0, ${xStemPct}% 0, ${xStemPct}% ${yCutPct}%, 100% ${yCutPct}%, 100% 100%, 0 100%)`
    case 'l-bottom-right':
      return `polygon(${xCutPct}% 0, 100% 0, 100% 100%, 0 100%, 0 ${yCutPct}%, ${xCutPct}% ${yCutPct}%)`
    case 'l-top-left':
      return `polygon(0 0, 100% 0, 100% ${yStemPct}%, ${xStemPct}% ${yStemPct}%, ${xStemPct}% 100%, 0 100%)`
    case 'l-top-right':
      return `polygon(0 0, 100% 0, 100% 100%, ${xCutPct}% 100%, ${xCutPct}% ${yStemPct}%, 0 ${yStemPct}%)`
    default:
      return undefined
  }
}

interface SvgBlockCoord {
  id: string
  block: PillarLayerBlock
  idx: number
  x: number
  y: number
  w: number
  h: number
  cx: number
  topY: number
  botY: number
  colStart: number
  colSpan: number
  rowStart: number
  rowSpan: number
}

interface SvgEdge {
  id: string
  fromId: string
  toId: string
  path: string
  color: string
  strokeHex: string
  isActive: boolean
}

export const PillarLayerSection: React.FC<PillarLayerSectionProps> = ({
  title,
  description,
  section,
  layers: propLayers,
  matrix_blocks: propBlocks,
  sectionIndex = 0,
}) => {
  // Theme-aware accent colors via semantic CSS custom properties.
  // var(--primary) / var(--secondary) resolve per the user's selected [data-theme]
  // (see src/styles/variables.css), matching how all other sections theme.
  const primaryColor = 'var(--primary)'
  const secondaryColor = 'var(--secondary)'

  const layers = section?.layers || propLayers || []
  const matrix_blocks = section?.matrix_blocks || propBlocks || []
  const sectionTitle = title || section?.title
  const sectionDescription = description || section?.description

  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null)
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null)

  const targetBlockId = hoveredBlockId

  // Layout Constants for Fixed Block Dimensions & Scrollable SVG Viewport
  const HEADER_WIDTH = 220
  const COL_WIDTH = 220
  const ROW_HEIGHT = 110
  const GAP_X = 18
  const GAP_Y = 18
  const PADDING = 20

  const maxCols = Math.max(
    1,
    ...matrix_blocks.map((b) => {
      const cStart =
        b.col_offset !== undefined
          ? b.col_offset
          : b.offsets && b.offsets.length > 0
          ? Math.min(...b.offsets.map(([_, dc]) => dc))
          : 0
      const cSpan = b.col_span || 1
      return cStart + cSpan
    })
  )

  const svgWidth = PADDING * 2 + HEADER_WIDTH + GAP_X + maxCols * COL_WIDTH + (maxCols - 1) * GAP_X
  const svgHeight = PADDING * 2 + layers.length * ROW_HEIGHT + (layers.length - 1) * GAP_Y
  const effectiveCols = maxCols
  const gridTemplateColumns = `minmax(160px, 200px) repeat(${effectiveCols}, minmax(180px, 1fr))`

  // Map each block to SVG exact vector coordinate bounds
  const blockCoordMap = new Map<string, SvgBlockCoord>()
  matrix_blocks.forEach((block, idx) => {
    const lIdx = layers.findIndex((l) => l.id === block.layer_id)
    const rIndex = lIdx >= 0 ? lIdx : 0

    const cOffset =
      block.col_offset !== undefined
        ? block.col_offset
        : block.offsets && block.offsets.length > 0
        ? Math.min(...block.offsets.map(([_, dc]) => dc))
        : 0

    let colSpan = block.col_span || 1
    let rowSpan = block.row_span || 1

    if (block.offsets && block.offsets.length > 0) {
      const rMin = Math.min(...block.offsets.map(([dr]) => dr))
      const rMax = Math.max(...block.offsets.map(([dr]) => dr))
      const cMin = Math.min(...block.offsets.map(([_, dc]) => dc))
      const cMax = Math.max(...block.offsets.map(([_, dc]) => dc))
      rowSpan = rMax - rMin + 1
      colSpan = cMax - cMin + 1
    }

    const bx = PADDING + HEADER_WIDTH + GAP_X + cOffset * (COL_WIDTH + GAP_X)
    const by = PADDING + rIndex * (ROW_HEIGHT + GAP_Y)
    const bw = colSpan * COL_WIDTH + (colSpan - 1) * GAP_X
    const bh = rowSpan * ROW_HEIGHT + (rowSpan - 1) * GAP_Y

    const coord: SvgBlockCoord = {
      id: block.id || `block-${idx}`,
      block,
      idx,
      x: bx,
      y: by,
      w: bw,
      h: bh,
      cx: bx + bw / 2,
      topY: by,
      botY: by + bh,
      colStart: 2 + cOffset,
      colSpan,
      rowStart: rIndex + 2,
      rowSpan,
    }

    if (block.id) {
      blockCoordMap.set(block.id, coord)
    }
    blockCoordMap.set(`block-${idx}`, coord)
  })

  // Calculate Outgoing and Incoming Edge Counts per Block for Multi-Port Anchor Offsets
  const outgoingCounts = new Map<string, number>()
  const incomingCounts = new Map<string, number>()
  const outgoingIndices = new Map<string, number>()
  const incomingIndices = new Map<string, number>()

  matrix_blocks.forEach((b, idx) => {
    const fromId = b.id || `block-${idx}`
    if (!b.depends_on) return

    b.depends_on.forEach((depId) => {
      outgoingCounts.set(fromId, (outgoingCounts.get(fromId) || 0) + 1)
      incomingCounts.set(depId, (incomingCounts.get(depId) || 0) + 1)
    })
  })

  // Rewritten Edge Path Algorithm with Anchor Offsets & Theme Colors
  const svgEdges: SvgEdge[] = []

  matrix_blocks.forEach((b, idx) => {
    const fromId = b.id || `block-${idx}`
    const fromCoord = blockCoordMap.get(fromId)
    if (!fromCoord || !b.depends_on) return

    b.depends_on.forEach((depId) => {
      const toCoord = blockCoordMap.get(depId)
      if (!toCoord) return

      const outCount = outgoingCounts.get(fromId) || 1
      const inCount = incomingCounts.get(depId) || 1

      const outIdx = outgoingIndices.get(fromId) || 0
      const inIdx = incomingIndices.get(depId) || 0
      outgoingIndices.set(fromId, outIdx + 1)
      incomingIndices.set(depId, inIdx + 1)

      const isVertical = Math.abs(fromCoord.y - toCoord.y) >= ROW_HEIGHT / 2

      let x1: number, y1: number, x2: number, y2: number
      let path: string

      if (isVertical) {
        // Vertical Top-to-Bottom Flow
        x1 = fromCoord.x + ((outIdx + 1) * fromCoord.w) / (outCount + 1)
        y1 = fromCoord.botY
        x2 = toCoord.x + ((inIdx + 1) * toCoord.w) / (inCount + 1)
        y2 = toCoord.topY

        const dy = y2 - y1
        const cy1 = y1 + Math.min(60, Math.max(25, dy * 0.45))
        const cy2 = y2 - Math.min(60, Math.max(25, dy * 0.45))
        path = `M ${x1} ${y1} C ${x1} ${cy1}, ${x2} ${cy2}, ${x2} ${y2}`
      } else {
        // Horizontal Side-by-Side Flow
        const isFromLeft = fromCoord.x < toCoord.x
        x1 = isFromLeft ? fromCoord.x + fromCoord.w : fromCoord.x
        y1 = fromCoord.y + ((outIdx + 1) * fromCoord.h) / (outCount + 1)
        x2 = isFromLeft ? toCoord.x : toCoord.x + toCoord.w
        y2 = toCoord.y + ((inIdx + 1) * toCoord.h) / (inCount + 1)

        const dx = Math.abs(x2 - x1)
        const cx1 = isFromLeft ? x1 + Math.min(60, dx * 0.45) : x1 - Math.min(60, dx * 0.45)
        const cx2 = isFromLeft ? x2 - Math.min(60, dx * 0.45) : x2 + Math.min(60, dx * 0.45)
        path = `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`
      }

      const isActive = targetBlockId
        ? fromCoord.id === targetBlockId || toCoord.id === targetBlockId
        : false

      svgEdges.push({
        id: `${fromId}->${depId}`,
        fromId,
        toId: depId,
        path,
        color: secondaryColor,
        strokeHex: secondaryColor,
        isActive,
      })
    })
  })

  // Determine dependent block IDs for targetBlockId
  const dependentBlockIds = new Set<string>()
  if (targetBlockId) {
    dependentBlockIds.add(targetBlockId)
    matrix_blocks.forEach((b) => {
      if (b.id === targetBlockId && b.depends_on) {
        b.depends_on.forEach((d) => dependentBlockIds.add(d))
      }
      if (b.depends_on && b.depends_on.includes(targetBlockId)) {
        if (b.id) dependentBlockIds.add(b.id)
      }
    })
  }

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

      {/* Main SVG Vector Canvas Container */}
      <div
        className="pillar-layer-matrix"
        data-testid="pillar-layer-grid"
        style={{ gridTemplateColumns, width: '100%' }}
      >
        <svg
          className="pillar-layer-full-svg-canvas"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width={svgWidth}
          height={svgHeight}
          style={{ width: `${svgWidth}px`, height: `${svgHeight}px`, flexShrink: 0 }}
        >
          <defs>
            <filter id="svg-block-shadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="var(--ctp-crust)" floodOpacity="0.4" />
            </filter>
            <filter id="svg-block-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="var(--ctp-peach)" floodOpacity="0.7" />
            </filter>
          </defs>

          {/* SVG Layer Rows */}
          {layers.map((layer, lIdx) => {
            const ly = PADDING + lIdx * (ROW_HEIGHT + GAP_Y)
            const isHighlighted = hoveredLayerId === layer.id

            return (
              <g
                key={layer.id}
                className={`svg-layer-row ${isHighlighted ? 'is-highlighted' : ''}`}
                data-testid={`layer-row-${layer.id}`}
                onMouseEnter={() => setHoveredLayerId(layer.id)}
                onMouseLeave={() => setHoveredLayerId(null)}
              >
                {/* Layer Row Header Rect */}
                <rect
                  x={PADDING}
                  y={ly}
                  width={HEADER_WIDTH}
                  height={ROW_HEIGHT}
                  rx="8"
                  ry="8"
                  fill={isHighlighted ? 'var(--ctp-surface1)' : 'var(--ctp-surface0)'}
                  stroke={isHighlighted ? 'var(--ctp-peach)' : 'var(--ctp-overlay1)'}
                  strokeWidth={isHighlighted ? '2' : '1'}
                />
                {/* Layer Row Header Multi-line CSS Word-Wrapped Container */}
                <foreignObject
                  x={PADDING + 14}
                  y={ly + 10}
                  width={HEADER_WIDTH - 24}
                  height={ROW_HEIGHT - 20}
                  style={{ pointerEvents: 'none', overflow: 'hidden' }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: '4px',
                      color: 'var(--ctp-text)',
                      fontSize: '12px',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal',
                      lineHeight: '1.3',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '13px',
                        lineHeight: '1.25',
                        color: 'var(--ctp-text)',
                      }}
                    >
                      {layer.title}
                    </div>
                    {layer.description && (
                      <div
                        style={{
                          fontSize: '11px',
                          lineHeight: '1.3',
                          color: 'var(--ctp-subtext0)',
                          opacity: 0.95,
                        }}
                      >
                        {layer.description}
                      </div>
                    )}
                  </div>
                </foreignObject>

                {/* Layer Grid Horizontal Band Line */}
                <line
                  x1={PADDING + HEADER_WIDTH + GAP_X}
                  y1={ly + ROW_HEIGHT / 2}
                  x2={svgWidth - PADDING}
                  y2={ly + ROW_HEIGHT / 2}
                  stroke="var(--ctp-surface2)"
                  strokeDasharray="4 4"
                  opacity={0.4}
                />
              </g>
            )
          })}

          {/* SVG Theme-Colored Edge Connection Lines */}
          {svgEdges.map((edge) => (
            <path
              key={edge.id}
              d={edge.path}
              fill="none"
              className={`pillar-layer-dependency-path ${edge.isActive ? 'is-active' : ''}`}
              style={{
                stroke: edge.isActive ? 'var(--ctp-peach)' : secondaryColor,
              }}
            />
          ))}

          {/* SVG Lego Building Blocks */}
          {matrix_blocks.map((block: PillarLayerBlock, idx: number) => {
            const coord = blockCoordMap.get(block.id || `block-${idx}`)!
            const accentColor = primaryColor

            const isLayerHighlighted = hoveredLayerId && block.layer_id === hoveredLayerId
            const isDependencyTarget = targetBlockId && dependentBlockIds.has(block.id || `block-${idx}`)
            const isDimmed = targetBlockId && !dependentBlockIds.has(block.id || `block-${idx}`)

            const colClass = block.color ? `color-${block.color}` : ''
            const shape = block.shape || (block.offsets && block.offsets.length > 0 ? detectShapeFromOffsets(block.offsets) : undefined)
            const clipPath = getBlockClipPath(shape, coord.colSpan, coord.rowSpan)

            // Calculate Lego Interlock Studs along the top edge
            const studCount = Math.min(6, Math.max(3, Math.floor(coord.w / 40)))
            const studSpacing = coord.w / (studCount + 1)
            const studs = Array.from({ length: studCount }, (_, i) => coord.x + (i + 1) * studSpacing)

            return (
              <g
                key={block.id || `block-${idx}`}
                className={`svg-lego-block ${colClass} ${isLayerHighlighted ? 'is-highlighted' : ''} ${
                  isDependencyTarget ? 'is-dependency-active' : ''
                } ${isDimmed ? 'is-dimmed' : ''} ${
                  shape ? `shape-${shape}` : ''
                }`}
                data-testid={`pillar-layer-block-${idx}`}
                style={{
                  gridColumnStart: `${coord.colStart}`,
                  gridColumnEnd: `span ${coord.colSpan}`,
                  gridRowStart: `${coord.rowStart}`,
                  gridRowEnd: `span ${coord.rowSpan}`,
                  ...(clipPath ? { clipPath } : {}),
                }}
                onMouseEnter={() => {
                  setHoveredLayerId(block.layer_id || null)
                  if (block.id) setHoveredBlockId(block.id)
                }}
                onMouseLeave={() => {
                  setHoveredLayerId(null)
                  setHoveredBlockId(null)
                }}
              >
                {/* Lego Interlock Top Studs */}
                {studs.map((sx, si) => (
                  <circle
                    key={si}
                    cx={sx}
                    cy={coord.y + 2}
                    r="4"
                    fill={accentColor}
                    opacity={isDimmed ? '0.3' : '0.85'}
                  />
                ))}

                {/* Main Block Rect */}
                <rect
                  x={coord.x}
                  y={coord.y}
                  width={coord.w}
                  height={coord.h}
                  rx="8"
                  ry="8"
                  fill="var(--ctp-base)"
                  stroke={isDependencyTarget ? 'var(--ctp-peach)' : accentColor}
                  strokeWidth={isDependencyTarget ? '3' : '1.5'}
                  opacity={isDimmed ? 0.35 : 1}
                  filter={isDependencyTarget ? 'url(#svg-block-glow)' : 'url(#svg-block-shadow)'}
                />

                {/* Left Accent Bar */}
                <rect
                  x={coord.x}
                  y={coord.y}
                  width="5"
                  height={coord.h}
                  fill={accentColor}
                  rx="2"
                  ry="2"
                  opacity={isDimmed ? 0.35 : 1}
                />

                {/* Multi-line CSS Word-Wrapped Title & Description Container */}
                <foreignObject
                  x={coord.x + 14}
                  y={coord.y + 10}
                  width={coord.w - 22}
                  height={coord.h - 16}
                  style={{ pointerEvents: 'none', overflow: 'hidden' }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      color: 'var(--ctp-text)',
                      fontSize: '12px',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal',
                      lineHeight: '1.35',
                      opacity: isDimmed ? 0.35 : 1,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '13px',
                        lineHeight: '1.3',
                        color: 'var(--ctp-text)',
                      }}
                    >
                      {block.title}
                    </div>
                    {block.description && (
                      <div
                        style={{
                          fontSize: '11px',
                          lineHeight: '1.35',
                          color: 'var(--ctp-subtext1)',
                          opacity: 0.95,
                        }}
                      >
                        {block.description}
                      </div>
                    )}
                  </div>
                </foreignObject>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export default PillarLayerSection
