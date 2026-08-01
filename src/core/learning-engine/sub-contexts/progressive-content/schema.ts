import { z } from 'zod'

// --- Text Section Schema ---

export const TextSectionSchema = z.object({
  type: z.literal('text'),
  paragraphs: z.array(z.string()),
})

export type TextSectionData = z.infer<typeof TextSectionSchema>

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

export const PillarLayerPillarSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
})

export const PillarLayerLayerSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  span: z.enum(['full', 'matrix']).optional().default('matrix'),
  blocks: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
  })).optional(),
})

export const PillarLayerBlockSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  layer_id: z.string(),
  pillar_id: z.string(),
  col_span: z.number().int().min(1).optional().default(1),
  row_span: z.number().int().min(1).optional().default(1),
  color: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const PillarLayerSectionSchema = z.object({
  type: z.literal('pillar-layer'),
  title: z.string().optional(),
  description: z.string().optional(),
  pillars: z.array(PillarLayerPillarSchema),
  layers: z.array(PillarLayerLayerSchema),
  matrix_blocks: z.array(PillarLayerBlockSchema).optional().default([]),
}).superRefine((data, ctx) => {
  const pillarIds = new Set(data.pillars.map((p) => p.id))
  const layerIds = new Set(data.layers.map((l) => l.id))
  const pillarIndexMap = new Map(data.pillars.map((p, idx) => [p.id, idx]))
  const layerIndexMap = new Map(data.layers.map((l, idx) => [l.id, idx]))

  const grid: (string | null)[][] = Array.from({ length: data.layers.length }, () =>
    Array(data.pillars.length).fill(null)
  )

  data.matrix_blocks.forEach((block, idx) => {
    if (!layerIds.has(block.layer_id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['matrix_blocks', idx, 'layer_id'],
        message: `INVALID_LAYER_REF: Block '${block.title}' references unknown layer_id '${block.layer_id}'.`,
      })
    }

    if (!pillarIds.has(block.pillar_id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['matrix_blocks', idx, 'pillar_id'],
        message: `INVALID_PILLAR_REF: Block '${block.title}' references unknown pillar_id '${block.pillar_id}'.`,
      })
    }

    const rIndex = layerIndexMap.get(block.layer_id)
    const cIndex = pillarIndexMap.get(block.pillar_id)

    if (rIndex === undefined || cIndex === undefined) return

    const colSpan = block.col_span || 1
    const rowSpan = block.row_span || 1

    if (cIndex + colSpan > data.pillars.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['matrix_blocks', idx, 'col_span'],
        message: `BOX_OUT_OF_BOUNDS_X: Block '${block.title}' with col_span ${colSpan} extends beyond grid width (${data.pillars.length} pillars).`,
      })
    }

    if (rIndex + rowSpan > data.layers.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['matrix_blocks', idx, 'row_span'],
        message: `BOX_OUT_OF_BOUNDS_Y: Block '${block.title}' with row_span ${rowSpan} extends beyond grid height (${data.layers.length} layers).`,
      })
    }

    const maxR = Math.min(rIndex + rowSpan, data.layers.length)
    const maxC = Math.min(cIndex + colSpan, data.pillars.length)

    for (let r = rIndex; r < maxR; r++) {
      for (let c = cIndex; c < maxC; c++) {
        const existingBlock = grid[r][c]
        if (existingBlock) {
          const layerName = data.layers[r]?.title || data.layers[r]?.id
          const pillarName = data.pillars[c]?.title || data.pillars[c]?.id
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['matrix_blocks', idx],
            message: `RECTANGLE_OVERLAP_CONFLICT: Block '${block.title}' overlaps with Block '${existingBlock}' at cell (Layer: '${layerName}', Pillar: '${pillarName}').`,
          })
        } else {
          grid[r][c] = block.title
        }
      }
    }
  })

  // Check for unallocated gaps in matrix layers
  data.layers.forEach((layer, rIdx) => {
    if (layer.span === 'full') return // full width layers span across all columns automatically

    data.pillars.forEach((pillar, cIdx) => {
      if (!grid[rIdx][cIdx]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['layers', rIdx],
          message: `GRID_GAP_UNALLOCATED: Grid cell (Layer: '${layer.title || layer.id}', Pillar: '${pillar.title || pillar.id}') is empty. Matrix grid must have no unallocated cell gaps.`,
        })
      }
    })
  })
})

export type PillarLayerPillar = z.infer<typeof PillarLayerPillarSchema>
export type PillarLayerLayer = z.infer<typeof PillarLayerLayerSchema>
export type PillarLayerBlock = z.infer<typeof PillarLayerBlockSchema>
export type PillarLayerSectionData = z.infer<typeof PillarLayerSectionSchema>
