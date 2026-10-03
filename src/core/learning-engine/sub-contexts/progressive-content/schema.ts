import { z } from 'zod'

// --- Text Section Schema ---

export const TextSectionSchema = z.object({
  type: z.literal('text'),
  paragraphs: z.array(z.string()),
})

export type TextSectionData = z.infer<typeof TextSectionSchema>

// --- Standard OpenUI Section Schema ---

export const OpenUISectionSchema = z.object({
  type: z.literal('openui'),
  /** OpenUI Lang program written against the standard `@openuidev/react-ui` library. */
  source: z.string().min(1, 'The OpenUI program is empty; add a `root = …` statement.'),
})

export type OpenUISectionData = z.infer<typeof OpenUISectionSchema>

// --- Intro Section Schema ---

export const IntroRoadmapStepSchema = z.object({
  sectionId: z.string().optional(),
  title: z.string(),
  type: z.string(),
  description: z.string(),
})

export const IntroSectionSchema = z.object({
  type: z.literal('intro'),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  estimatedTime: z.string().optional(),
  moduleCount: z.number().optional(),
  what: z.object({
    definition: z.string().optional(),
    summary: z.string(),
    bullets: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }),
  why: z.object({
    summary: z.string(),
    impact: z.string().optional(),
  }),
  roadmap: z.array(IntroRoadmapStepSchema).optional(),
})

export type IntroRoadmapStep = z.infer<typeof IntroRoadmapStepSchema>
export type IntroSectionData = z.infer<typeof IntroSectionSchema>

// --- Bullets Section Schema ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BulletItemRef: z.ZodType<any> = z.object({
  text: z.string(),
  children: z.array(z.lazy(() => BulletItemRef)).optional(),
})

export const BulletItemSchema = BulletItemRef

export const BulletsSectionSchema = z.object({
  type: z.literal('bullets'),
  items: z.array(BulletItemSchema),
})

export type BulletItem = z.infer<typeof BulletItemSchema>
export type BulletsSectionData = z.infer<typeof BulletsSectionSchema>

// --- Taxonomy Browser Section Schema ---

export const TaxonomyCategorySchema = z.object({
  icon: z.string(),
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  details: z.string(),
  analogy: z.string(),
  primaryFocus: z.string(),
  inScope: z.array(z.string()),
  outOfScope: z.array(z.string()),
  color: z.string(),
})

export const TaxonomyBrowserSectionSchema = z.object({
  type: z.literal('taxonomy-browser'),
  categories: z.array(TaxonomyCategorySchema),
})

export type TaxonomyCategory = z.infer<typeof TaxonomyCategorySchema>
export type TaxonomyBrowserSectionData = z.infer<typeof TaxonomyBrowserSectionSchema>

// --- Image Gallery Section Schema ---

export const GalleryItemSchema = z.object({
  id: z.string(),
  url: z.string(),
  caption: z.string(),
  credit: z.string().optional(),
})

export const ImageGallerySectionSchema = z.object({
  type: z.literal('image-gallery'),
  items: z.array(GalleryItemSchema),
})

export type GalleryItem = z.infer<typeof GalleryItemSchema>
export type ImageGallerySectionData = z.infer<typeof ImageGallerySectionSchema>

// --- Pillar & Layer Section Schema ---

export const PillarLayerLayerSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  blocks: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
  })).optional(),
})

export const PillarLayerBlockCellSchema = z.union([
  z.object({
    pillar_id: z.string().optional(),
    layer_id: z.string(),
  }),
  z.tuple([z.string(), z.string()]), // [pillar_id, layer_id]
])

export const PillarLayerBlockShapeSchema = z.enum([
  'rect',
  'l-bottom-left',
  'l-bottom-right',
  'l-top-left',
  'l-top-right',
])

export const PillarLayerBlockSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  layer_id: z.string().optional(),
  col_offset: z.number().int().min(0).optional(),
  col_span: z.number().int().min(1).optional(),
  row_span: z.number().int().min(1).optional(),
  shape: PillarLayerBlockShapeSchema.optional(),
  cells: z.array(PillarLayerBlockCellSchema).optional(),
  offsets: z.array(z.tuple([z.number().int(), z.number().int()])).optional(), // [row_offset, col_offset]
  color: z.string().optional(),
  depends_on: z.array(z.string()).optional(),
})

export function getBlockOccupiedCells(
  block: {
    layer_id?: string
    col_offset?: number
    col_span?: number
    row_span?: number
    shape?: 'rect' | 'l-bottom-left' | 'l-bottom-right' | 'l-top-left' | 'l-top-right' | string
    cells?: Array<{ layer_id: string; pillar_id?: string } | [string, string]>
    offsets?: Array<[number, number]>
  },
  layerIndexMap: Map<string, number>,
  gridWidth: number,
  layersLength: number
): Array<{ r: number; c: number }> {
  const rIndex = block.layer_id ? layerIndexMap.get(block.layer_id) : undefined
  const cIndex = block.col_offset || 0

  if (rIndex === undefined) return []

  // Format: Anchor + Relative offsets [dr, dc]
  if (block.offsets && block.offsets.length > 0) {
    const coords: Array<{ r: number; c: number }> = []
    for (const [dr, dc] of block.offsets) {
      const r = rIndex + dr
      const c = cIndex + dc
      if (r >= 0 && r < layersLength && c >= 0 && c < gridWidth) {
        coords.push({ r, c })
      }
    }
    return coords
  }

  // Format: Anchor + col_span / row_span + shape
  const colSpan = block.col_span || 1
  const rowSpan = block.row_span || 1
  const shape = block.shape || 'rect'

  const coords: Array<{ r: number; c: number }> = []

  for (let dr = 0; dr < rowSpan; dr++) {
    for (let dc = 0; dc < colSpan; dc++) {
      const r = rIndex + dr
      const c = cIndex + dc
      if (r >= layersLength || c >= gridWidth) continue

      let isOccupied = true

      if (shape === 'l-bottom-left') {
        isOccupied = dr === rowSpan - 1 || dc === 0
      } else if (shape === 'l-bottom-right') {
        isOccupied = dr === rowSpan - 1 || dc === colSpan - 1
      } else if (shape === 'l-top-left') {
        isOccupied = dr === 0 || dc === 0
      } else if (shape === 'l-top-right') {
        isOccupied = dr === 0 || dc === colSpan - 1
      }

      if (isOccupied) {
        coords.push({ r, c })
      }
    }
  }

  return coords
}

export const PillarLayerSectionSchema = z.object({
  type: z.literal('pillar-layer'),
  title: z.string().optional(),
  description: z.string().optional(),
  layers: z.array(PillarLayerLayerSchema),
  matrix_blocks: z.array(PillarLayerBlockSchema).optional().default([]),
}).superRefine((data, ctx) => {
  const layerIds = new Set(data.layers.map((l) => l.id))
  const layerIndexMap = new Map(data.layers.map((l, idx) => [l.id, idx]))

  const gridWidth = Math.max(
    1,
    ...data.matrix_blocks.map((b) => {
      const cStart = b.col_offset || 0
      if (b.offsets && b.offsets.length > 0) {
        const maxDc = Math.max(...b.offsets.map(([, dc]) => dc))
        return cStart + maxDc + 1
      }
      return cStart + (b.col_span || 1)
    })
  )

  const grid: (string | null)[][] = Array.from({ length: data.layers.length }, () =>
    Array(gridWidth).fill(null)
  )

  data.matrix_blocks.forEach((block, idx) => {
    if (block.layer_id && !layerIds.has(block.layer_id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['matrix_blocks', idx, 'layer_id'],
        message: `INVALID_LAYER_REF: Block '${block.title}' references unknown layer_id '${block.layer_id}'.`,
      })
    }

    const rIndex = block.layer_id ? layerIndexMap.get(block.layer_id) : undefined

    if (rIndex !== undefined) {
      const rowSpan = block.row_span || 1
      if (rIndex + rowSpan > data.layers.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['matrix_blocks', idx, 'row_span'],
          message: `BOX_OUT_OF_BOUNDS_Y: Block '${block.title}' with row_span ${rowSpan} extends beyond grid height (${data.layers.length} layers).`,
        })
      }
    }

    const occupiedCells = getBlockOccupiedCells(
      block,
      layerIndexMap,
      gridWidth,
      data.layers.length
    )

    occupiedCells.forEach(({ r, c }) => {
      const existingBlock = grid[r][c]
      if (existingBlock) {
        const layerName = data.layers[r]?.title || data.layers[r]?.id
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['matrix_blocks', idx],
          message: `BLOCK_OVERLAP_CONFLICT: Block '${block.title}' overlaps with Block '${existingBlock}' at cell (Layer: '${layerName}', Col: '${c + 1}').`,
        })
      } else {
        grid[r][c] = block.title
      }
    })
  })

  // Check for unallocated gaps in matrix layers
  data.layers.forEach((layer, rIdx) => {
    for (let cIdx = 0; cIdx < gridWidth; cIdx++) {
      if (!grid[rIdx][cIdx]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['layers', rIdx],
          message: `GRID_GAP_UNALLOCATED: Grid cell (Layer: '${layer.title || layer.id}', Col: '${cIdx + 1}') is empty. Layer grid must have no unallocated cell gaps.`,
        })
      }
    }
  })
})

export type PillarLayerLayer = z.infer<typeof PillarLayerLayerSchema>
export type PillarLayerBlock = z.infer<typeof PillarLayerBlockSchema>
export type PillarLayerBlockShape = z.infer<typeof PillarLayerBlockShapeSchema>
export type PillarLayerBlockCell = z.infer<typeof PillarLayerBlockCellSchema>
export type PillarLayerSectionData = z.infer<typeof PillarLayerSectionSchema>
