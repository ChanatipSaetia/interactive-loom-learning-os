/**
 * Present mode beats for the progressive-content section types (Beat Derivation in
 * grill-log-presenting-mode.md). Each function reads the compiled section props only.
 */
import { explore, show, type Beat, type SectionPresenter } from '../present-kernel'
import type { BulletItem, GalleryItem, IntroSectionData, OpenUISectionData, PillarLayerSectionData, TaxonomyCategory, TextSectionData } from './schema'

type Props<T> = Omit<T, 'type'> & { title?: string; heading?: string }

export type IntroPresentData = Props<IntroSectionData>
export type TextPresentData = Props<TextSectionData>
export type BulletsPresentData = Props<{ items: BulletItem[]; ordered?: boolean }>
export type OpenUIPresentData = Props<OpenUISectionData>
export type PillarLayerPresentData = { title?: string; description?: string; section?: PillarLayerSectionData }
export type GalleryPresentData = Props<{ items: GalleryItem[] }>
export type TaxonomyPresentData = Props<{ categories: TaxonomyCategory[] }>

/** Title and tagline, What, Why, then the roadmap when there is one. */
export function introBeats(data: IntroPresentData): Beat[] {
  return [show(), show(), show(), ...(data.roadmap?.length ? [show()] : [])]
}

/** One beat per paragraph. */
export function textBeats(data: TextPresentData): Beat[] {
  return (data.paragraphs ?? []).map(() => show())
}

/** One beat per top-level bullet; its children unfold with it. */
export function bulletsBeats(data: BulletsPresentData): Beat[] {
  return (data.items ?? []).map(() => show())
}

/** One beat: each top-level child fades in (decision 78). */
export function openuiBeats(): Beat[] {
  return [show()]
}

/** One beat per layer, settling onto the stack from the bottom; blocks arrive with their layer. */
export function pillarLayerBeats(data: PillarLayerPresentData): Beat[] {
  return (data.section?.layers ?? []).map(() => show())
}

/** One beat per image. */
export function galleryBeats(data: GalleryPresentData): Beat[] {
  return (data.items ?? []).map(() => show())
}

/** All the cards cascading in, then free browsing. */
export function taxonomyBeats(data: TaxonomyPresentData): Beat[] {
  return data.categories?.length ? [show(), explore()] : [show()]
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
