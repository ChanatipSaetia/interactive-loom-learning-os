import type { PillarLayerBlock, PillarLayerLayer } from './schema'

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

export interface PlacedBlock {
  key: string
  block: PillarLayerBlock
  idx: number
  layerIdx: number
  colStart: number
  colSpan: number
  rowSpan: number
  clipPath?: string
}

/** Where each block sits in the layer grid (shared by the Read and Present views). */
export function placePillarBlocks(layers: PillarLayerLayer[], matrix_blocks: PillarLayerBlock[]): PlacedBlock[] {
  return matrix_blocks.map((block, idx) => {
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
  })
}

