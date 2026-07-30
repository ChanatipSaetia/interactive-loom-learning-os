export {
  TextSectionSchema,
  IntroSectionSchema,
  BulletsSectionSchema,
  TaxonomyBrowserSectionSchema,
  ImageGallerySectionSchema,
} from './schema'
export type {
  TextSectionData,
  IntroSectionData,
  IntroRoadmapStep,
  BulletsSectionData,
  BulletItem,
  TaxonomyBrowserSectionData,
  TaxonomyCategory,
  ImageGallerySectionData,
  GalleryItem,
} from './schema'

export { TextSection } from './components/TextSection'
export type { TextSectionProps } from './components/TextSection'

export { IntroSection } from './components/IntroSection'
export type { IntroSectionProps } from './components/IntroSection'

export { BulletsSection } from './components/BulletsSection'
export type { BulletsSectionProps, BulletItemType } from './components/BulletsSection'

export { TaxonomyBrowserSection } from './components/TaxonomyBrowserSection'
export type { TaxonomyBrowserSectionProps, TaxonomyCategoryType } from './components/TaxonomyBrowserSection'

export { ImageGallerySection } from './components/ImageGallerySection'
export type { ImageGalleryProps, GalleryItemType } from './components/ImageGallerySection'

export type {
  ProgressiveContentEvents,
  CategorySelected,
  GalleryItemViewed,
} from './events'
