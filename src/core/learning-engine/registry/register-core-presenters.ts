import { PresentRegistry } from './present-registry'
import { bulletsPresenter, introPresenter, openuiPresenter, textPresenter } from '../sub-contexts/progressive-content/present'

/**
 * Register the Present mode renderer of every section type that has one (Loom Viewer).
 * Types without one play their Read component as a single beat.
 */
export function registerCorePresenters(): void {
  PresentRegistry.register('intro', introPresenter)
  PresentRegistry.register('text', textPresenter)
  PresentRegistry.register('bullets', bulletsPresenter)
  PresentRegistry.register('openui', openuiPresenter)
}
