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
