/**
 * Present mode beats for the progressive-content section types (Beat Derivation in
 * grill-log-presenting-mode.md). Each function reads the compiled section props only; every beat
 * plays by itself (decision 101). Beat IDs name the beats for narration files (decision 108).
 */
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

/** Title and tagline, What, Why, then the roadmap when there is one: `title`, `what`, `why`, `roadmap`. */
export function introBeats(data: IntroPresentData): Beat[] {
  return [
    show('title', 'The title and tagline'),
    show('what', 'What it is'),
    show('why', 'Why it matters'),
    ...(data.roadmap?.length ? [show('roadmap', 'The roadmap')] : []),
  ]
}

/** One beat per paragraph: `p1`, `p2`, … */
export function textBeats(data: TextPresentData): Beat[] {
  return (data.paragraphs ?? []).map((p, i) => show(`p${i + 1}`, `Paragraph ${i + 1}: ${brief(p)}`))
}

/** One beat per top-level bullet, its children unfolding with it: `item1`, `item2`, … */
export function bulletsBeats(data: BulletsPresentData): Beat[] {
  return (data.items ?? []).map((b, i) => show(`item${i + 1}`, `Bullet ${i + 1}: ${brief(b.text)}`))
}

/** One beat, `all`: each top-level child fades in (decision 78). */
export function openuiBeats(): Beat[] {
  return [show('all', 'The whole section')]
}

/** One beat per layer, settling onto the stack from the bottom; blocks arrive with their layer: `layer1`, … */
export function pillarLayerBeats(data: PillarLayerPresentData): Beat[] {
  return (data.section?.layers ?? []).map((l, i) => show(`layer${i + 1}`, `Layer ${i + 1}: ${brief(l.title)}`))
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
