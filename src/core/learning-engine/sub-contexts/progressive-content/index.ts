export {
  TextSectionSchema,
  IntroSectionSchema,
  BulletsSectionSchema,
  TaxonomyBrowserSectionSchema,
  ImageGallerySectionSchema,
  PillarLayerSectionSchema,
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
  PillarLayerSectionData,
  PillarLayerLayer,
  PillarLayerBlock,
} from './schema'

export { TextSection, TextHelpModal } from './components/TextSection'
export type { TextSectionProps } from './components/TextSection'

export { IntroSection, IntroHelpModal } from './components/IntroSection'
export type { IntroSectionProps } from './components/IntroSection'

export { BulletsSection, BulletsHelpModal } from './components/BulletsSection'
export type { BulletsSectionProps, BulletItemType } from './components/BulletsSection'

export { TaxonomyBrowserSection, TaxonomyHelpModal } from './components/TaxonomyBrowserSection'
export type { TaxonomyBrowserSectionProps, TaxonomyCategoryType } from './components/TaxonomyBrowserSection'

export { ImageGallerySection } from './components/ImageGallerySection'
export type { ImageGalleryProps, GalleryItemType } from './components/ImageGallerySection'

export { PillarLayerSection } from './components/PillarLayerSection'
export type { PillarLayerSectionProps } from './components/PillarLayerSection'
export { PillarLayerHelpModal } from './components/pillar-layer/PillarLayerHelpModal'

export { TextFormEditor } from './components/text/TextFormEditor'
export { IntroFormEditor } from './components/intro/IntroFormEditor'
export { BulletsFormEditor } from './components/bullets/BulletsFormEditor'
export { TaxonomyBrowserFormEditor } from './components/taxonomy-browser/TaxonomyBrowserFormEditor'
export { PillarLayerFormEditor } from './components/pillar-layer/PillarLayerFormEditor'


export type {
  ProgressiveContentEvents,
  CategorySelected,
  GalleryItemViewed,
} from './events'
export { validateProgressiveContentTier3 } from './validation'
