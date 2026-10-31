/**
 * Present mode beats for the progressive-content section types (Beat Derivation in
 * grill-log-presenting-mode.md). Each function reads the compiled section props only; every beat
 * plays by itself (decision 101). Beat IDs name the beats for narration files (decision 108).
 */
import { textScenes } from './text-scenes'
import { pillarLayerPlan } from './pillar-layer-scenes'
import { brief, show, type Beat, type SectionPresenter } from '../present-kernel'
import type { BulletItem, GalleryItem, IntroSectionData, OpenUISectionData, PillarLayerSectionData, TaxonomyCategory, TextSectionData } from './schema'

type Props<T> = Omit<T, 'type'> & { title?: string; heading?: string }

export type IntroPresentData = Props<IntroSectionData>
export type TextPresentData = Props<TextSectionData>
export type BulletsPresentData = Props<{ items: BulletItem[]; ordered?: boolean }>
export type OpenUIPresentData = Props<OpenUISectionData>
export type PillarLayerPresentData = { title?: string; description?: string; section?: PillarLayerSectionData }
export type GalleryPresentData = Props<{ items: GalleryItem[] }>
export type TaxonomyPresentData = Props<{ categories: TaxonomyCategory[] }>

/**
 * Title and tagline (when it has either), What, Why, then the roadmap when there is one: `title`,
 * `what`, `why`, `roadmap`.
 */
export function introBeats(data: IntroPresentData): Beat[] {
  return [
    ...(data.title || data.subtitle ? [show('title', 'The title and tagline')] : []),
    show('what', 'What it is'),
    show('why', 'Why it matters'),
    ...(data.roadmap?.length ? [show('roadmap', 'The roadmap')] : []),
  ]
}

/** Short prose scenes; pN remains the first beat of each paragraph. */
export function textBeats(data: TextPresentData): Beat[] {
  return textScenes(data).map((scene) => show(scene.id, `Paragraph ${scene.paragraph + 1}: ${brief(scene.source)}`))
}

/** A logical point and its ancestry; the renderer packs these into content-sized pages. */
export interface BulletScene {
  id: string
  item: BulletItem
  parents: BulletItem[]
  topIndex: number
}

/** Depth-first scenes preserve existing itemN narration IDs and add stable child paths. */
export function bulletScenes(data: BulletsPresentData): BulletScene[] {
  const scenes: BulletScene[] = []
  const visit = (item: BulletItem, id: string, parents: BulletItem[], topIndex: number) => {
    scenes.push({ id, item, parents, topIndex })
    item.children?.forEach((child: BulletItem, i: number) => visit(child, `${id}.child${i + 1}`, [...parents, item], topIndex))
  }
  const items = data.items ?? []
  items.forEach((item, i) => visit(item, `item${i + 1}`, [], i))
  return scenes
}

/** One narration beat per point; related points accumulate on measured pages in the renderer. */
export function bulletsBeats(data: BulletsPresentData): Beat[] {
  return bulletScenes(data).map(({ id, item, parents, topIndex }) => show(id,
    `${parents.length ? 'Subpoint' : 'Bullet'} ${topIndex + 1}: ${brief(item.text)}`))
}

/** A top-level child of an OpenUI section's root: its statement name when it is a reference, else its component. */
export interface OpenUIPart {
  name?: string
  component?: string
}

/** Root components whose first argument lists children drawn one after another, in order. */
const PART_CONTAINERS = new Set(['Card', 'Stack'])

/**
 * The top-level children of an OpenUI program's root (decision 116): the items of the children list
 * of a `Card([...])` or `Stack([...])` root, in order. Null for any other root, or when the root's
 * first argument is not a list.
 */
export function openuiParts(source: string): OpenUIPart[] | null {
  const head = /^[ \t]*root[ \t]*=[ \t]*([A-Z][\w.]*)[ \t]*\(/m.exec(source)
  if (!head || !PART_CONTAINERS.has(head[1])) return null
  let i = head.index + head[0].length
  while (/\s/.test(source[i] ?? '')) i++
  if (source[i] !== '[') return null
  const items: string[] = []
  let depth = 0
  let from = i + 1
  for (i = i + 1; i < source.length; i++) {
    const ch = source[i]
    if (ch === '"' || ch === "'") {
      for (i++; i < source.length && source[i] !== ch; i++) if (source[i] === '\\') i++
      continue
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++
    else if (ch === ')' || ch === '}' || (ch === ']' && depth > 0)) depth--
    else if (ch === ']' || (ch === ',' && depth === 0)) {
      items.push(source.slice(from, i).trim())
      from = i + 1
      if (ch === ']') break
    }
  }
  return items.filter(Boolean).map((item) =>
    /^[A-Za-z_$][\w$]*$/.test(item) ? { name: item } : { component: /^([A-Z][\w.]*)\s*\(/.exec(item)?.[1] })
}

/**
 * One beat per top-level child of a `Card` or `Stack` root with more than one (`part1`, `part2`, …,
 * decision 116), so narration can walk through a table, then its takeaway; else one beat, `all`,
 * each top-level child fading in (decision 78).
 */
export function openuiBeats(data: OpenUIPresentData = { source: '' }): Beat[] {
  const parts = openuiParts(data.source ?? '')
  if (!parts || parts.length < 2) return [show('all', 'The whole section')]
  return parts.map((p, i) => show(`part${i + 1}`, `Part ${i + 1}: ${p.name ?? p.component ?? 'element'}`))
}

/** Foundation upward, peer-group focus within each layer, then the whole stack. */
export function pillarLayerBeats(data: PillarLayerPresentData): Beat[] {
  return pillarLayerPlan(data.section).scenes.map(({ id, about }) => show(id, about))
}

/** One beat per image: `image1`, `image2`, … */
export function galleryBeats(data: GalleryPresentData): Beat[] {
  return (data.items ?? []).map((g, i) => show(`image${i + 1}`, `Image ${i + 1}: ${brief(g.caption)}`))
}

/** All the cards cascading in (`cards`), then each card opened in turn (`card1`, `card2`, …). */
export function taxonomyBeats(data: TaxonomyPresentData): Beat[] {
  const categories = data.categories ?? []
  if (!categories.length) return [show('cards', 'The cards')]
  return [show('cards', `All ${categories.length} cards`), ...categories.map((c, i) => show(`card${i + 1}`, `Card ${i + 1} opened: ${brief(c.title)}`))]
}

export const introPresenter: SectionPresenter<IntroPresentData> = {
  toBeats: introBeats,
  load: () => import('./components/intro/PresentIntro'),
}
export const textPresenter: SectionPresenter<TextPresentData> = {
  toBeats: textBeats,
  load: () => import('./components/text/PresentText'),
}
export const bulletsPresenter: SectionPresenter<BulletsPresentData> = {
  toBeats: bulletsBeats,
  load: () => import('./components/bullets/PresentBullets'),
}
export const openuiPresenter: SectionPresenter<OpenUIPresentData> = {
  toBeats: openuiBeats,
  load: () => import('./components/openui/PresentOpenUI'),
}
export const pillarLayerPresenter: SectionPresenter<PillarLayerPresentData> = {
  toBeats: pillarLayerBeats,
  load: () => import('./components/pillar-layer/PresentPillarLayer'),
}
export const galleryPresenter: SectionPresenter<GalleryPresentData> = {
  toBeats: galleryBeats,
  load: () => import('./components/image-gallery/PresentGallery'),
}
export const taxonomyPresenter: SectionPresenter<TaxonomyPresentData> = {
  toBeats: taxonomyBeats,
  load: () => import('./components/taxonomy-browser/PresentTaxonomy'),
}
