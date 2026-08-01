import type { ValidationDiagnostic, ValidationContext } from '../../validation/types'
import { contextToDiagnostic } from '../../validation/types'

/**
 * Tier 3: Semantic Reference Integrity & 2D Spatial Validation for Progressive Content.
 */
export function validateProgressiveContentTier3(
  data: Record<string, unknown>,
  sectionType: string,
  context?: ValidationContext
): ValidationDiagnostic[] {
  if (sectionType !== 'pillar-layer') {
    return []
  }

  const diagnostics: ValidationDiagnostic[] = []
  const ctx = contextToDiagnostic(context)

  const pillars = Array.isArray(data.pillars) ? (data.pillars as Record<string, unknown>[]) : []
  const layers = Array.isArray(data.layers) ? (data.layers as Record<string, unknown>[]) : []
  const matrixBlocks = Array.isArray(data.matrix_blocks)
    ? (data.matrix_blocks as Record<string, unknown>[])
    : Array.isArray(data.blocks)
    ? (data.blocks as Record<string, unknown>[])
    : []

  const pillarMap = new Map<string, number>()
  pillars.forEach((p, idx) => {
    if (typeof p.id === 'string') {
      pillarMap.set(p.id, idx)
    }
  })

  const layerMap = new Map<string, number>()
  layers.forEach((l, idx) => {
    if (typeof l.id === 'string') {
      layerMap.set(l.id, idx)
    }
  })

  // 2D Occupancy Grid: layers.length rows x pillars.length cols
  const grid: (string | null)[][] = Array.from({ length: layers.length }, () =>
    Array(pillars.length).fill(null)
  )

  matrixBlocks.forEach((block, idx) => {
    const blockTitle = typeof block.title === 'string' ? block.title : `Block #${idx + 1}`
    const layerId = typeof block.layer_id === 'string' ? block.layer_id : ''
    const pillarId = typeof block.pillar_id === 'string' ? block.pillar_id : ''

    const rIndex = layerMap.get(layerId)
    const cIndex = pillarMap.get(pillarId)

    // 1. Layer Reference Check
    if (rIndex === undefined) {
      diagnostics.push({
        tier: 3,
        field: `matrix_blocks[${idx}].layer_id`,
        message: `INVALID_LAYER_REF: Block '${blockTitle}' references unknown layer_id '${layerId}'.`,
        fixHint: `Ensure layer_id matches one of the defined layers: [${Array.from(layerMap.keys()).join(', ')}].`,
        ...ctx,
      })
    }

    // 2. Pillar Reference Check
    if (cIndex === undefined) {
      diagnostics.push({
        tier: 3,
        field: `matrix_blocks[${idx}].pillar_id`,
        message: `INVALID_PILLAR_REF: Block '${blockTitle}' references unknown pillar_id '${pillarId}'.`,
        fixHint: `Ensure pillar_id matches one of the defined pillars: [${Array.from(pillarMap.keys()).join(', ')}].`,
        ...ctx,
      })
    }

    if (rIndex === undefined || cIndex === undefined) {
      return
    }

    const colSpan = typeof block.col_span === 'number' && block.col_span >= 1 ? block.col_span : 1
    const rowSpan = typeof block.row_span === 'number' && block.row_span >= 1 ? block.row_span : 1

    // 3. Grid Boundary Checks
    if (cIndex + colSpan > pillars.length) {
      diagnostics.push({
        tier: 3,
        field: `matrix_blocks[${idx}].col_span`,
        message: `BOX_OUT_OF_BOUNDS_X: Block '${blockTitle}' with col_span ${colSpan} extends beyond grid width (${pillars.length} pillars).`,
        fixHint: `Reduce col_span to ${pillars.length - cIndex} or move block to an earlier pillar.`,
        ...ctx,
      })
    }

    if (rIndex + rowSpan > layers.length) {
      diagnostics.push({
        tier: 3,
        field: `matrix_blocks[${idx}].row_span`,
        message: `BOX_OUT_OF_BOUNDS_Y: Block '${blockTitle}' with row_span ${rowSpan} extends beyond grid height (${layers.length} layers).`,
        fixHint: `Reduce row_span to ${layers.length - rIndex} or move block to an earlier layer.`,
        ...ctx,
      })
    }

    // 4. 2D Occupancy Matrix Collision Check
    const maxR = Math.min(rIndex + rowSpan, layers.length)
    const maxC = Math.min(cIndex + colSpan, pillars.length)

    for (let r = rIndex; r < maxR; r++) {
      for (let c = cIndex; c < maxC; c++) {
        const existingBlock = grid[r][c]
        if (existingBlock) {
          const layerName = layers[r]?.title || layers[r]?.id || `Layer #${r + 1}`
          const pillarName = pillars[c]?.title || pillars[c]?.id || `Pillar #${c + 1}`
          diagnostics.push({
            tier: 3,
            field: `matrix_blocks[${idx}]`,
            message: `RECTANGLE_OVERLAP_CONFLICT: Block '${blockTitle}' overlaps with Block '${existingBlock}' at cell (Layer: '${layerName}', Pillar: '${pillarName}').`,
            fixHint: `Adjust col_span / row_span or pillar_id / layer_id so rectangular blocks do not collide.`,
            ...ctx,
          })
        } else {
          grid[r][c] = blockTitle
        }
      }
    }
  })

  // 5. Unallocated Cell Gap Check
  layers.forEach((layer, rIdx) => {
    if (layer.span === 'full') return

    pillars.forEach((pillar, cIdx) => {
      if (!grid[rIdx][cIdx]) {
        const layerName = (layer.title as string) || (layer.id as string) || `Layer #${rIdx + 1}`
        const pillarName = (pillar.title as string) || (pillar.id as string) || `Pillar #${cIdx + 1}`
        diagnostics.push({
          tier: 3,
          field: `layers[${rIdx}]`,
          message: `GRID_GAP_UNALLOCATED: Grid cell (Layer: '${layerName}', Pillar: '${pillarName}') is empty. Matrix grid must have no unallocated cell gaps.`,
          fixHint: `Add a block at layer '${layer.id}' and pillar '${pillar.id}', or increase col_span/row_span of an adjacent block.`,
          ...ctx,
        })
      }
    })
  })

  return diagnostics
}
