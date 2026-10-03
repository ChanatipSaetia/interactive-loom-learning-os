import { SectionRegistry } from './index'

/**
 * Register the lazily loaded renderer of every core section type.
 * Shared by the learning app (src/main.tsx) and Loom Studio (src/studio/main.tsx).
 */
export function registerCoreSections(): void {
  SectionRegistry.register('intro', () => import('../sub-contexts/progressive-content/components/intro'))
  SectionRegistry.register('text', () => import('../sub-contexts/progressive-content/components/text'))
  SectionRegistry.register('openui', () => import('../sub-contexts/progressive-content/components/openui'))
  SectionRegistry.register('bullets', () => import('../sub-contexts/progressive-content/components/bullets'))
  SectionRegistry.register('flowchart', () => import('../sub-contexts/process-simulation/components/flowchart'))
  SectionRegistry.register('tradeoff-sandbox', () => import('../sub-contexts/tradeoff-sandbox/components/tradeoff-sandbox'))
  SectionRegistry.register('taxonomy-browser', () => import('../sub-contexts/progressive-content/components/taxonomy-browser'))
  SectionRegistry.register('flashcards', () => import('../sub-contexts/practice-assessment/components/flashcards'))
  SectionRegistry.register('quiz', () => import('../sub-contexts/practice-assessment/components/quiz'))
  SectionRegistry.register('concept-map', () => import('../sub-contexts/practice-assessment/components/concept-map'))
  SectionRegistry.register('scenario', () => import('../sub-contexts/process-simulation/components/scenario'))
  SectionRegistry.register('decision-tree', () => import('../sub-contexts/tradeoff-sandbox/components/decision-tree'))
  SectionRegistry.register('image-gallery', () => import('../sub-contexts/progressive-content/components/image-gallery'))
  SectionRegistry.register('pillar-layer', () => import('../sub-contexts/progressive-content/components/pillar-layer'))
  SectionRegistry.register('formula-sandbox', () => import('../sub-contexts/tradeoff-sandbox/components/formula-sandbox'))
  SectionRegistry.register('reflection-sequence', () => import('../sub-contexts/reflection-synthesis/components/reflection-sequence'))
  SectionRegistry.register('reflection-template', () => import('../sub-contexts/reflection-synthesis/components/reflection-template'))
}
