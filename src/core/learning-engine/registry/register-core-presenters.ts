import { PresentRegistry } from './present-registry'
import {
  bulletsPresenter,
  galleryPresenter,
  introPresenter,
  openuiPresenter,
  pillarLayerPresenter,
  taxonomyPresenter,
  textPresenter,
} from '../sub-contexts/progressive-content/present'
import { flashcardsPresenter, quizPresenter } from '../sub-contexts/practice-assessment/present'
import { sequencePresenter, templatePresenter } from '../sub-contexts/reflection-synthesis/present'

/**
 * Register the Present mode renderer of every section type that has one (Loom Viewer).
 * Types without one play their Read component as a single beat.
 */
export function registerCorePresenters(): void {
  PresentRegistry.register('intro', introPresenter)
  PresentRegistry.register('text', textPresenter)
  PresentRegistry.register('bullets', bulletsPresenter)
  PresentRegistry.register('openui', openuiPresenter)
  PresentRegistry.register('pillar-layer', pillarLayerPresenter)
  PresentRegistry.register('image-gallery', galleryPresenter)
  PresentRegistry.register('taxonomy-browser', taxonomyPresenter)
  PresentRegistry.register('quiz', quizPresenter)
  PresentRegistry.register('flashcards', flashcardsPresenter)
  PresentRegistry.register('reflection-sequence', sequencePresenter)
  PresentRegistry.register('reflection-template', templatePresenter)
}
