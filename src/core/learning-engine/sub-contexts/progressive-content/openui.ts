/**
 * OpenUI Lang vocabulary for the Progressive Content subdomain.
 *
 *   root = Bullets("Capabilities", [Bullet("Tool use", [Bullet("Search")])], false)
 */
import { tagSchemaId } from '@openuidev/lang-core'
import { z } from 'zod'
import {
  call,
  defineOUIComponent,
  defineOUISection,
  idOf,
  refOrId,
  refTo,
  sectionTail,
  sectionTailProps,
  type LoomOUIComponent,
  type OUIValue,
} from '../openui-kernel'
import type {
  BulletItem,
  BulletsSectionData,
  GalleryItem,
  ImageGallerySectionData,
  IntroSectionData,
  PillarLayerSectionData,
  TaxonomyBrowserSectionData,
  IntroRoadmapStep,
  PillarLayerBlock,
  PillarLayerLayer,
  TaxonomyCategory as TaxonomyCategoryData,
} from './schema'

// --- Intro ---

export const IntroWhat = defineOUIComponent({
  name: 'IntroWhat',
  description: 'The "what is it" panel of a topic intro.',
  props: z.object({
    summary: z.string(),
    definition: z.string().optional(),
    bullets: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }),
})

export const IntroWhy = defineOUIComponent({
  name: 'IntroWhy',
  description: 'The "why it matters" panel of a topic intro.',
  props: z.object({
    summary: z.string(),
    impact: z.string().optional(),
  }),
})

export const RoadmapStep = defineOUIComponent({
  name: 'RoadmapStep',
  description: 'A roadmap entry previewing a later section. `type` is the section type (e.g. "quiz"); `sectionId` its file name.',
  props: z.object({
    title: z.string(),
    type: z.string(),
    description: z.string(),
    sectionId: z.string().optional(),
  }),
})

export const Intro: LoomOUIComponent = defineOUISection({
  name: 'Intro',
  sectionType: 'intro',
  description: 'Topic opener: what it is, why it matters, and a roadmap of the sections ahead. `displayTitle` overrides the title shown inside the card.',
  props: z.object({
    title: z.string(),
    what: IntroWhat.ref,
    why: IntroWhy.ref,
    roadmap: z.array(RoadmapStep.ref).optional(),
    subtitle: z.string().optional(),
    estimatedTime: z.string().optional(),
    moduleCount: z.number().optional(),
    displayTitle: z.string().optional(),
    ...sectionTailProps,
  }),
  toData: (p) => ({
    type: 'intro',
    title: p.displayTitle,
    subtitle: p.subtitle,
    estimatedTime: p.estimatedTime,
    moduleCount: p.moduleCount,
    what: p.what as unknown as { summary: string },
    why: p.why as unknown as { summary: string },
    roadmap: (p.roadmap ?? []) as unknown as IntroRoadmapStep[],
  }),
  fromData: (data: IntroSectionData, meta) => call(Intro, {
    title: meta.title || data.title || '',
    displayTitle: data.title !== undefined && data.title !== (meta.title || data.title) ? data.title : undefined,
    what: call(IntroWhat, { summary: data.what.summary, definition: data.what.definition, bullets: data.what.bullets, tags: data.what.tags }, 'what'),
    why: call(IntroWhy, { summary: data.why.summary, impact: data.why.impact }, 'why'),
    roadmap: data.roadmap?.length
      ? data.roadmap.map((r) => call(RoadmapStep, { title: r.title, type: r.type, description: r.description, sectionId: r.sectionId }))
      : undefined,
    subtitle: data.subtitle,
    estimatedTime: data.estimatedTime,
    moduleCount: data.moduleCount,
    ...sectionTail(meta),
  }),
})

// --- Bullets ---

const NestedBullet = z.lazy(() => BulletProps)
tagSchemaId(NestedBullet, 'Bullet')

const BulletProps: z.ZodObject = z.object({
  text: z.string(),
  children: z.array(NestedBullet).optional(),
})

export const Bullet = defineOUIComponent({
  name: 'Bullet',
  description: 'A bullet point, optionally with nested child bullets.',
  props: BulletProps,
})

export const Bullets: LoomOUIComponent = defineOUISection({
  name: 'Bullets',
  sectionType: 'bullets',
  description: 'Bulleted (or numbered, when `ordered` is true) checklist.',
  props: z.object({
    title: z.string(),
    items: z.array(Bullet.ref),
    ordered: z.boolean().optional(),
    ...sectionTailProps,
  }),
  toData: (p) => ({ type: 'bullets', items: p.items as unknown as BulletItem[] }),
  fromData: (data: BulletsSectionData, meta) => call(Bullets, {
    title: meta.title ?? '',
    items: data.items.map(bulletCall),
    ordered: meta.ordered,
    ...sectionTail(meta),
  }),
})

function bulletCall(item: BulletItem): OUIValue {
  return call(Bullet, { text: item.text, children: item.children?.length ? item.children.map(bulletCall) : undefined })
}

// --- Taxonomy Browser ---

export const TaxonomyCategory = defineOUIComponent({
  name: 'TaxonomyCategory',
  description: 'A category card in a taxonomy browser. `color` is a theme color name (e.g. "blue", "mauve").',
  props: z.object({
    title: z.string(),
    subtitle: z.string(),
    icon: z.string(),
    color: z.string(),
    description: z.string(),
    details: z.string(),
    analogy: z.string(),
    primaryFocus: z.string(),
    inScope: z.array(z.string()),
    outOfScope: z.array(z.string()),
  }),
})

export const TaxonomyBrowser: LoomOUIComponent = defineOUISection({
  name: 'TaxonomyBrowser',
  sectionType: 'taxonomy-browser',
  description: 'Browsable taxonomy of categories with scope, analogy and details.',
  props: z.object({
    title: z.string(),
    categories: z.array(TaxonomyCategory.ref),
    ...sectionTailProps,
  }),
  toData: (p) => ({ type: 'taxonomy-browser', categories: p.categories as unknown as TaxonomyCategoryData[] }),
  fromData: (data: TaxonomyBrowserSectionData, meta) => call(TaxonomyBrowser, {
    title: meta.title ?? '',
    categories: data.categories.map((c) => call(TaxonomyCategory, {
      title: c.title,
      subtitle: c.subtitle,
      icon: c.icon,
      color: c.color,
      description: c.description,
      details: c.details,
      analogy: c.analogy,
      primaryFocus: c.primaryFocus,
      inScope: c.inScope,
      outOfScope: c.outOfScope,
    }, c.title)),
    ...sectionTail(meta),
  }),
})

// --- Image Gallery ---

export const GalleryImage = defineOUIComponent({
  name: 'GalleryImage',
  description: 'An image in a gallery.',
  props: z.object({
    id: z.string(),
    url: z.string(),
    caption: z.string(),
    credit: z.string().optional(),
  }),
})

export const ImageGallery: LoomOUIComponent = defineOUISection({
  name: 'ImageGallery',
  sectionType: 'image-gallery',
  description: 'Gallery of captioned images.',
  props: z.object({
    title: z.string(),
    images: z.array(GalleryImage.ref),
    ...sectionTailProps,
  }),
  toData: (p) => ({ type: 'image-gallery', items: p.images as unknown as GalleryItem[] }),
  fromData: (data: ImageGallerySectionData, meta) => call(ImageGallery, {
    title: meta.title ?? '',
    images: data.items.map((i) => call(GalleryImage, { id: i.id, url: i.url, caption: i.caption, credit: i.credit })),
    ...sectionTail(meta),
  }),
})

// --- Pillar & Layer ---

export const LayerItem = defineOUIComponent({
  name: 'LayerItem',
  description: 'A labelled item listed inside a layer.',
  props: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
})

export const Layer = defineOUIComponent({
  name: 'Layer',
  description: 'A horizontal layer (row) of a pillar/layer matrix.',
  props: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    items: z.array(LayerItem.ref).optional(),
  }),
  toData: (p) => ({ id: p.id, title: p.title, description: p.description, blocks: p.items }),
})

export const MatrixBlock = defineOUIComponent({
  name: 'MatrixBlock',
  description: 'A block placed on the matrix, anchored at `layer` (reference or ID) and `colOffset`. Spans default to 1; `shape` is "rect" or an L-shape. `dependsOn` lists block IDs.',
  props: z.object({
    id: z.string(),
    title: z.string(),
    layer: refOrId(Layer),
    colOffset: z.number().int().min(0).optional(),
    colSpan: z.number().int().min(1).optional(),
    rowSpan: z.number().int().min(1).optional(),
    description: z.string().optional(),
    color: z.string().optional(),
    dependsOn: z.array(z.string()).optional(),
    shape: z.enum(['rect', 'l-bottom-left', 'l-bottom-right', 'l-top-left', 'l-top-right']).optional(),
    offsets: z.array(z.array(z.number().int())).optional(),
  }),
  toData: (p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    layer_id: idOf(p.layer),
    col_offset: p.colOffset,
    col_span: p.colSpan,
    row_span: p.rowSpan,
    shape: p.shape,
    offsets: p.offsets,
    color: p.color,
    depends_on: p.dependsOn,
  }),
})

export const PillarLayer: LoomOUIComponent = defineOUISection({
  name: 'PillarLayer',
  sectionType: 'pillar-layer',
  description: 'Layer-stack map: layers as rows, blocks placed on a gap-free grid. `displayTitle` overrides the title shown inside the map.',
  props: z.object({
    title: z.string(),
    layers: z.array(Layer.ref),
    blocks: z.array(MatrixBlock.ref),
    description: z.string().optional(),
    displayTitle: z.string().optional(),
    ...sectionTailProps,
  }),
  toData: (p) => ({
    type: 'pillar-layer',
    title: p.displayTitle ?? p.title,
    description: p.description,
    layers: p.layers as unknown as PillarLayerLayer[],
    matrix_blocks: p.blocks as unknown as PillarLayerBlock[],
  }),
  fromData: (data: PillarLayerSectionData, meta) => call(PillarLayer, {
    title: meta.title || data.title || '',
    displayTitle: data.title && data.title !== (meta.title || data.title) ? data.title : undefined,
    layers: data.layers.map((l) => call(Layer, {
      id: l.id,
      title: l.title,
      description: l.description,
      items: l.blocks?.map((b) => call(LayerItem, { title: b.title, description: b.description })),
    }, l.id)),
    blocks: (data.matrix_blocks ?? []).map((b, i) => call(MatrixBlock, {
      id: b.id ?? `block-${i + 1}`,
      title: b.title,
      layer: refTo(Layer, b.layer_id),
      colOffset: b.col_offset,
      colSpan: b.col_span,
      rowSpan: b.row_span,
      description: b.description,
      color: b.color,
      dependsOn: b.depends_on,
      shape: b.shape,
      offsets: b.offsets as OUIValue,
    }, b.id ?? `block-${i + 1}`)),
    description: data.description,
    ...sectionTail(meta),
  }),
})

export const progressiveContentOUIComponents = [
  Intro, IntroWhat, IntroWhy, RoadmapStep,
  Bullets, Bullet,
  TaxonomyBrowser, TaxonomyCategory,
  ImageGallery, GalleryImage,
  PillarLayer, Layer, LayerItem, MatrixBlock,
]
