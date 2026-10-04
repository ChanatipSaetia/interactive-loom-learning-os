/**
 * OpenUI Lang vocabulary for the Progressive Content subdomain.
 *
 *   root = Text("Overview", ["First paragraph.", "Second paragraph."])
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
  sectionFields, sectionTail,
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
  TextSectionData,
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
  fields: {
    summary: 'One-paragraph answer to "what is it?".',
    definition: 'Optional formal one-line definition.',
    bullets: 'Optional key points.',
    tags: 'Optional short keyword tags.',
  },
})

export const IntroWhy = defineOUIComponent({
  name: 'IntroWhy',
  description: 'The "why it matters" panel of a topic intro.',
  props: z.object({
    summary: z.string(),
    impact: z.string().optional(),
  }),
  fields: {
    summary: 'One-paragraph answer to "why does it matter?".',
    impact: 'Optional concrete impact or payoff.',
  },
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
  fields: {
    title: 'Name of the upcoming section.',
    type: 'Section type it previews, e.g. "quiz" or "flowchart".',
    description: 'What the learner will do there.',
    sectionId: 'Optional section file name (without .oui) to link to.',
  },
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
  fields: {
    ...sectionFields,
    what: 'IntroWhat(...) panel: what the topic is.',
    why: 'IntroWhy(...) panel: why it matters.',
    roadmap: 'Optional preview of the sections ahead, as RoadmapStep references.',
    subtitle: 'Optional tagline under the title.',
    estimatedTime: 'Optional time to complete, e.g. "25 min".',
    moduleCount: 'Optional number of modules shown in the header.',
    displayTitle: 'Optional title shown inside the card instead of `title`.',
  },
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

// --- Text & Bullets ---

export const Text: LoomOUIComponent = defineOUISection({
  name: 'Text',
  sectionType: 'text',
  description: 'Prose section: one string per paragraph.',
  props: z.object({
    title: z.string(),
    paragraphs: z.array(z.string()),
    ...sectionTailProps,
  }),
  fields: {
    ...sectionFields,
    paragraphs: 'The paragraphs, one string each, in order.',
  },
  toData: (p) => ({ type: 'text', paragraphs: p.paragraphs }),
  fromData: (data: TextSectionData, meta) => call(Text, { title: meta.title ?? '', paragraphs: [...data.paragraphs], ...sectionTail(meta) }),
})

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
  fields: {
    text: 'Bullet text.',
    children: 'Optional nested bullets, as Bullet calls.',
  },
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
  fields: {
    ...sectionFields,
    items: 'The bullets, as Bullet references.',
    ordered: 'Optional: true numbers the list.',
  },
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
  fields: {
    title: 'Category name shown on the card.',
    subtitle: 'Short tagline under the name.',
    icon: 'lucide-react icon name, e.g. "Brain" (falls back to a circle).',
    color: 'Accent colour: blue, peach, pink, mauve, green, teal, sky, lavender, yellow or red.',
    description: 'Summary shown on the card.',
    details: 'Longer explanation shown in the category details.',
    analogy: 'Everyday analogy for the category.',
    primaryFocus: 'The main concern of this category, in one line.',
    inScope: 'What belongs in this category.',
    outOfScope: 'What does not belong here (and often where it goes instead).',
  },
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
  fields: {
    ...sectionFields,
    categories: 'The categories, as TaxonomyCategory references.',
  },
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
  fields: {
    id: 'Image ID, unique within the gallery.',
    url: 'Image URL or path.',
    caption: 'Caption shown under the image.',
    credit: 'Optional attribution.',
  },
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
  fields: {
    ...sectionFields,
    images: 'The images, as GalleryImage references, in order.',
  },
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
  fields: {
    title: 'Item name.',
    description: 'Optional detail.',
  },
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
  fields: {
    id: 'Layer ID, unique within the map; blocks refer to it with `layer`.',
    title: 'Layer name shown at the start of the row.',
    description: 'Optional layer summary.',
    items: 'Optional items listed for this layer, as LayerItem references.',
  },
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
  fields: {
    id: 'Block ID, unique within the map; `dependsOn` refers to it.',
    title: 'Text shown on the block.',
    layer: 'Anchor row: Layer reference or ID.',
    colOffset: 'Optional anchor column, from 0 (default 0).',
    colSpan: 'Optional number of columns covered (default 1).',
    rowSpan: 'Optional number of rows covered, downward (default 1).',
    description: 'Optional detail shown when the block is selected.',
    color: 'Optional accent: rosewater, flamingo, pink, mauve, red, maroon, peach, yellow, green, teal, sky, sapphire, blue or lavender.',
    dependsOn: 'Optional IDs of blocks this block depends on.',
    shape: 'Optional "rect" (default) or an L-shape inside the span: "l-bottom-left", "l-bottom-right", "l-top-left", "l-top-right".',
    offsets: 'Optional custom shape: [rowOffset, colOffset] cells relative to the anchor. Overrides spans and shape.',
  },
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
  description: 'Layer-stack map: layers as rows (foundation last), blocks placed on a gap-free grid. Give blocks `dependsOn` so readers can tap a block to trace what it needs and what it affects. `displayTitle` overrides the title shown inside the map.',
  props: z.object({
    title: z.string(),
    layers: z.array(Layer.ref),
    blocks: z.array(MatrixBlock.ref),
    description: z.string().optional(),
    displayTitle: z.string().optional(),
    ...sectionTailProps,
  }),
  fields: {
    ...sectionFields,
    layers: 'The rows, top to bottom, as Layer references.',
    blocks: 'Blocks placed on the grid, as MatrixBlock references. Together they must fill the grid without gaps.',
    description: 'Optional summary shown above the map; say what the reader should take away from the stack.',
    displayTitle: 'Optional title shown inside the map instead of `title`.',
  },
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
  Text,
  Bullets, Bullet,
  TaxonomyBrowser, TaxonomyCategory,
  ImageGallery, GalleryImage,
  PillarLayer, Layer, LayerItem, MatrixBlock,
]
