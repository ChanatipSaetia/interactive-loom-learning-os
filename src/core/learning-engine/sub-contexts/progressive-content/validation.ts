import type { ValidationDiagnostic, ValidationContext } from '../../validation/types'
import { getBlockOccupiedCells } from './schema'
import { isLucideIconName, LUCIDE_ICON_NAMES } from './lucide-icon-names'

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
    prev = curr
  }
  return prev[b.length]
}

/** Closest lucide icon names to `name` (case-insensitive), best match first. */
export function suggestLucideIconNames(name: string, max = 3): string[] {
  const lower = name.toLowerCase()
  return [...LUCIDE_ICON_NAMES]
    .sort((x, y) => levenshtein(lower, x.toLowerCase()) - levenshtein(lower, y.toLowerCase()))
    .slice(0, max)
}

export function validateProgressiveContentTier3(
  payload: Record<string, unknown>,
  sectionType: string,
  ctx?: ValidationContext
): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = []

  if (sectionType === 'taxonomy-browser') {
    const categories = Array.isArray(payload.categories)
      ? (payload.categories as Array<Record<string, unknown>>)
      : []
    categories.forEach((cat, idx) => {
      const icon = typeof cat.icon === 'string' ? cat.icon.trim() : ''
      if (!icon || isLucideIconName(icon)) return
      const suggestion = suggestLucideIconNames(icon)
      diagnostics.push({
        tier: 3,
        field: `categories[${idx}].icon`,
        message: `Unknown lucide icon "${icon}" — the renderer will fall back to a generic icon.`,
        fixHint: `Use a lucide icon name in PascalCase (e.g. BookOpen, Zap, Shield). Did you mean: ${suggestion.map((s) => `"${s}"`).join(', ')}?`,
        ...ctx,
      })
    })
    return diagnostics
  }

  if (sectionType !== 'pillar-layer') {
    return diagnostics
  }

  const layers = Array.isArray(payload.layers) ? (payload.layers as Array<Record<string, unknown>>) : []
  const matrixBlocks = Array.isArray(payload.matrix_blocks)
    ? (payload.matrix_blocks as Array<Record<string, unknown>>)
    : Array.isArray(payload.blocks)
    ? (payload.blocks as Array<Record<string, unknown>>)
    : []

  const layerMap = new Map<string, number>()
  layers.forEach((l, idx) => {
    if (typeof l.id === 'string') {
      layerMap.set(l.id, idx)
    }
  })

  const gridWidth = Math.max(
    1,
    ...matrixBlocks.map((b) => {
      const cStart = typeof b.col_offset === 'number' ? b.col_offset : 0
      if (Array.isArray(b.offsets) && b.offsets.length > 0) {
        const maxDc = Math.max(...(b.offsets as Array<[number, number]>).map(([, dc]) => dc))
        return cStart + maxDc + 1
      }
      return cStart + (typeof b.col_span === 'number' && b.col_span >= 1 ? b.col_span : 1)
    })
  )

  const grid: (string | null)[][] = Array.from({ length: layers.length }, () =>
    Array(gridWidth).fill(null)
  )

  matrixBlocks.forEach((block, idx) => {
    const blockTitle = typeof block.title === 'string' ? block.title : `Block #${idx + 1}`
    const layerId = typeof block.layer_id === 'string' ? block.layer_id : ''

    const rIndex = layerMap.get(layerId)
    const cIndex = typeof block.col_offset === 'number' ? block.col_offset : 0

    // 1. Layer Reference Check
    if (rIndex === undefined) {
      diagnostics.push({
        tier: 3,
        field: `matrix_blocks[${idx}].layer_id`,
        message: `INVALID_LAYER_REF: Block '${blockTitle}' references unknown layer_id '${layerId}'.`,
        fixHint: `Ensure layer_id matches one of the defined layers: [${Array.from(layerMap.keys()).join(', ')}].`,
        ...ctx,
      })
      return
    }

    const colSpan = typeof block.col_span === 'number' && block.col_span >= 1 ? block.col_span : 1
    const rowSpan = typeof block.row_span === 'number' && block.row_span >= 1 ? block.row_span : 1

    // 2. Grid Boundary Checks
    if (rIndex + rowSpan > layers.length) {
      diagnostics.push({
        tier: 3,
        field: `matrix_blocks[${idx}].row_span`,
        message: `BOX_OUT_OF_BOUNDS_Y: Block '${blockTitle}' with row_span ${rowSpan} extends beyond grid height (${layers.length} layers).`,
        fixHint: `Reduce row_span to ${layers.length - rIndex} or move block to an earlier layer.`,
        ...ctx,
      })
    }

    // 3. 2D Occupancy Matrix Collision Check
    const occupiedCells = getBlockOccupiedCells(
      {
        layer_id: layerId,
        col_offset: cIndex,
        col_span: colSpan,
        row_span: rowSpan,
        shape: typeof block.shape === 'string' ? block.shape : undefined,
        cells: Array.isArray(block.cells)
          ? (block.cells as Array<{ layer_id: string }>)
          : undefined,
        offsets: Array.isArray(block.offsets)
          ? (block.offsets as Array<[number, number]>)
          : undefined,
      },
      layerMap,
      gridWidth,
      layers.length
    )

    occupiedCells.forEach(({ r, c }) => {
      const existingBlock = grid[r][c]
      if (existingBlock) {
        const layerName = layers[r]?.title || layers[r]?.id || `Layer #${r + 1}`
        diagnostics.push({
          tier: 3,
          field: `matrix_blocks[${idx}]`,
          message: `BLOCK_OVERLAP_CONFLICT: Block '${blockTitle}' overlaps with Block '${existingBlock}' at cell (Layer: '${layerName}', Col: '${c + 1}').`,
          fixHint: `Adjust col_offset, col_span, row_span, or layer_id so blocks do not collide.`,
          ...ctx,
        })
      } else {
        grid[r][c] = blockTitle
      }
    })
  })

  // 4. Unallocated Cell Gap Check
  layers.forEach((layer, rIdx) => {
    for (let cIdx = 0; cIdx < gridWidth; cIdx++) {
      if (!grid[rIdx][cIdx]) {
        const layerName = (layer.title as string) || (layer.id as string) || `Layer #${rIdx + 1}`
        diagnostics.push({
          tier: 3,
          field: `layers[${rIdx}]`,
          message: `GRID_GAP_UNALLOCATED: Grid cell (Layer: '${layerName}', Col: '${cIdx + 1}') is empty. Layer grid must have no unallocated cell gaps.`,
          fixHint: `Add a block at layer '${layer.id}' or increase col_span/row_span of an adjacent block.`,
          ...ctx,
        })
      }
    }
  })

  return diagnostics
}
