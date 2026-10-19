import { PresentRegistry } from './present-registry'
import type { SectionConfig } from './index'
import { show, withTitleBeat, type Beat, type SectionPresenter } from '../sub-contexts/present-kernel'
import {
  bulletsPresenter,
  galleryPresenter,
  introPresenter,
  openuiPresenter,
  pillarLayerPresenter,
  taxonomyPresenter,
  textPresenter,
} from '../sub-contexts/progressive-content/present'
import { conceptMapPresenter, flashcardsPresenter, quizPresenter } from '../sub-contexts/practice-assessment/present'
import { flowchartPresenter, scenarioPresenter } from '../sub-contexts/process-simulation/present'
import { decisionTreePresenter, formulaPresenter, tradeoffPresenter } from '../sub-contexts/tradeoff-sandbox/present'
import { sequencePresenter, templatePresenter } from '../sub-contexts/reflection-synthesis/present'

type AnyPresenter = SectionPresenter<Record<string, unknown>>
const loose = <D>(presenter: SectionPresenter<D>) => presenter as unknown as AnyPresenter

/** The section types with a Present renderer, and their presenters. */
export const CORE_PRESENTERS: Record<string, AnyPresenter> = {
  intro: loose(introPresenter),
  text: loose(textPresenter),
  bullets: loose(bulletsPresenter),
  openui: loose(openuiPresenter),
  'pillar-layer': loose(pillarLayerPresenter),
  'image-gallery': loose(galleryPresenter),
  'taxonomy-browser': loose(taxonomyPresenter),
  quiz: loose(quizPresenter),
  flashcards: loose(flashcardsPresenter),
  'reflection-sequence': loose(sequencePresenter),
  'reflection-template': loose(templatePresenter),
  flowchart: loose(flowchartPresenter),
  scenario: loose(scenarioPresenter),
  'concept-map': loose(conceptMapPresenter),
  'decision-tree': loose(decisionTreePresenter),
  'tradeoff-sandbox': loose(tradeoffPresenter),
  'formula-sandbox': loose(formulaPresenter),
}

/**
 * The beats a section plays in Present mode, without the registry (validation and Studio use it to
 * check and template narration files, decision 108). A type without a presenter is one beat, `all`.
 */
export function coreBeatsOf(config: SectionConfig): Beat[] {
  const beats = CORE_PRESENTERS[config.type]?.toBeats(config.props)
  return withTitleBeat(config.type, beats && beats.length > 0 ? beats : [show('all', 'The whole section')])
}

/**
 * Register the Present mode renderer of every section type that has one (Loom Viewer).
 * Types without one play their Read component as a single beat.
 */
export function registerCorePresenters(): void {
  for (const [type, presenter] of Object.entries(CORE_PRESENTERS)) PresentRegistry.register(type, presenter)
}
