import React, { useMemo, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
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
  const cMax = Math.max(...offsets.map(([, dc]) => dc))
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

interface PlacedBlock {
  key: string
  block: PillarLayerBlock
  idx: number
  layerIdx: number
  colStart: number
  colSpan: number
  rowSpan: number
  clipPath?: string
}

/** Every block reachable from `start` by following `edges` (not including `start`). */
function reachable(start: string, edges: Map<string, string[]>): Set<string> {
  const seen = new Set<string>()
  const stack = [...(edges.get(start) ?? [])]
  while (stack.length) {
    const id = stack.pop()!
    if (seen.has(id) || id === start) continue
    seen.add(id)
    stack.push(...(edges.get(id) ?? []))
  }
  return seen
}

/**
 * Layers stacked top to bottom with their blocks. On wide screens the layer names sit in a left column and
 * blocks keep their columns, spans and L-shapes; on narrower screens each layer becomes a band with its
 * blocks wrapped underneath. `depends_on` is shown as a "Uses" line on each block, and tapping a block traces
 * everything it needs (below) and everything it affects (above).
 */
export const PillarLayerSection: React.FC<PillarLayerSectionProps> = ({
  title,
  description,
  section,
  layers: propLayers,
  matrix_blocks: propBlocks,
  sectionIndex = 0,
}) => {
  const layers = useMemo(() => section?.layers || propLayers || [], [section, propLayers])
  const matrix_blocks = useMemo(() => section?.matrix_blocks || propBlocks || [], [section, propBlocks])
  const sectionTitle = title || section?.title
  const sectionDescription = description || section?.description

  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const placed = useMemo<PlacedBlock[]>(() => matrix_blocks.map((block, idx) => {
    const lIdx = layers.findIndex((l) => l.id === block.layer_id)
    let colStart = block.col_offset ?? 0
    let colSpan = block.col_span || 1
    let rowSpan = block.row_span || 1
    if (block.offsets && block.offsets.length > 0) {
      const rows = block.offsets.map(([dr]) => dr)
      const cols = block.offsets.map(([, dc]) => dc)
      if (block.col_offset === undefined) colStart = Math.min(...cols)
      rowSpan = Math.max(...rows) - Math.min(...rows) + 1
      colSpan = Math.max(...cols) - Math.min(...cols) + 1
    }
    const shape = block.shape || (block.offsets && block.offsets.length > 0 ? detectShapeFromOffsets(block.offsets) : undefined)
    return {
      key: block.id || `block-${idx}`,
      block,
      idx,
      layerIdx: lIdx >= 0 ? lIdx : 0,
      colStart,
      colSpan,
      rowSpan,
      clipPath: getBlockClipPath(shape, colSpan, rowSpan),
    }
  }), [matrix_blocks, layers])

  const maxCols = Math.max(1, ...placed.map((p) => p.colStart + p.colSpan))
  const titles = useMemo(() => new Map(placed.map((p) => [p.key, p.block.title])), [placed])

  // uses: block → what it depends on; usedBy: block → what depends on it
  const { uses, usedBy } = useMemo(() => {
    const usesMap = new Map<string, string[]>()
    const usedByMap = new Map<string, string[]>()
    for (const p of placed) {
      const deps = (p.block.depends_on ?? []).filter((d) => titles.has(d))
      usesMap.set(p.key, deps)
      for (const d of deps) usedByMap.set(d, [...(usedByMap.get(d) ?? []), p.key])
    }
    return { uses: usesMap, usedBy: usedByMap }
  }, [placed, titles])
  const hasLinks = placed.some((p) => (uses.get(p.key) ?? []).length > 0)

  const needs = selectedKey ? reachable(selectedKey, uses) : new Set<string>()
  const affects = selectedKey ? reachable(selectedKey, usedBy) : new Set<string>()
  const selectedLayerIdx = placed.find((p) => p.key === selectedKey)?.layerIdx

  const select = (key: string) => setSelectedKey((prev) => (prev === key ? null : key))

  const layerOf = useMemo(() => new Map(placed.map((p) => [p.key, p.layerIdx])), [placed])

  // Nearest layer first, so the list reads outward from the tapped block
  const nameList = (keys: Iterable<string>) => {
    const from = selectedLayerIdx ?? 0
    const list = [...keys].sort((a, b) => Math.abs((layerOf.get(a) ?? 0) - from) - Math.abs((layerOf.get(b) ?? 0) - from))
    if (list.length === 0) return <span className="pillar-trace-none">nothing</span>
    return list.map((k, i) => (
      <React.Fragment key={k}>
        {i > 0 && ', '}
        <button
          type="button"
          className="pillar-trace-link"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedKey(k)
          }}
        >
          {titles.get(k)}
        </button>
      </React.Fragment>
    ))
  }

  return (
    <div className="pillar-layer-section" data-testid="pillar-layer-section">
      <SectionTitleBar
        title={sectionTitle}
        sectionIndex={sectionIndex}
        HelpModal={PillarLayerHelpModal}
        titleTestId="pillar-layer-title"
      />

      {sectionDescription && (
        <p className="pillar-layer-description">{sectionDescription}</p>
      )}

      {hasLinks && (
        <p className="pillar-layer-hint" data-testid="pillar-layer-hint">
          Tap a block to trace what it needs and what it affects.
        </p>
      )}

      <div
        className="pillar-layer-matrix"
        data-testid="pillar-layer-grid"
        style={{ '--pillar-cols': maxCols, '--pillar-rows': layers.length } as CSSProperties}
      >
        {layers.map((layer, lIdx) => (
          <React.Fragment key={layer.id}>
            <div
              className={`pillar-layer-header${selectedLayerIdx === lIdx ? ' is-highlighted' : ''}`}
              data-testid={`layer-row-${layer.id}`}
              style={{ '--row': lIdx + 1 } as CSSProperties}
            >
              <span className="pillar-layer-header-title">{layer.title}</span>
              {layer.description && <span className="pillar-layer-header-desc">{layer.description}</span>}
            </div>

            {placed.filter((p) => p.layerIdx === lIdx).map((p) => {
              const { block } = p
              const isSelected = p.key === selectedKey
              const role = isSelected ? 'is-selected' : needs.has(p.key) ? 'is-needed' : affects.has(p.key) ? 'is-affected' : selectedKey ? 'is-dimmed' : ''
              const blockUses = uses.get(p.key) ?? []
              const tappable = hasLinks
              return (
                <div
                  key={p.key}
                  className={[
                    'pillar-block',
                    block.color ? `color-${block.color}` : '',
                    p.colSpan > 1 ? 'is-wide' : '',
                    p.clipPath ? 'is-shaped' : '',
                    tappable ? 'is-tappable' : '',
                    role,
                  ].filter(Boolean).join(' ')}
                  data-testid={`pillar-layer-block-${p.idx}`}
                  style={{
                    '--row': p.layerIdx + 1,
                    '--row-span': p.rowSpan,
                    '--col': p.colStart + 2,
                    '--col-span': p.colSpan,
                    ...(p.clipPath ? { '--clip': p.clipPath } : {}),
                  } as CSSProperties}
                  {...(tappable && {
                    role: 'button',
                    tabIndex: 0,
                    'aria-pressed': isSelected,
                    onClick: () => select(p.key),
                    onKeyDown: (e: KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        select(p.key)
                      }
                    },
                  })}
                >
                  <span className="pillar-block-title">{block.title}</span>
                  {block.description && <span className="pillar-block-desc">{block.description}</span>}
                  {blockUses.length > 0 && !isSelected && (
                    <span className="pillar-block-uses" data-testid={`pillar-block-uses-${p.idx}`}>
                      Uses: {blockUses.map((k) => titles.get(k)).join(', ')}
                    </span>
                  )}
                  {role === 'is-needed' && <span className="pillar-block-tag">Needed</span>}
                  {role === 'is-affected' && <span className="pillar-block-tag">Affected</span>}
                  {isSelected && (
                    <div className="pillar-trace" data-testid="pillar-trace">
                      <p><span className="pillar-trace-label">Needs</span>{nameList(needs)}</p>
                      <p><span className="pillar-trace-label">If it changes, it affects</span>{nameList(affects)}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export default PillarLayerSection
