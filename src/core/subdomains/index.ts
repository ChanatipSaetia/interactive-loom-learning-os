/**
 * Centralized Domain Barrel Export
 *
 * Canonical entry point for all 5 Core Learning Subdomains.
 * Re-exports bounded context contracts and renderers so callers
 * can import from `src/core/subdomains` instead of nested paths.
 */

// ─── Process & Event Workflow Simulation ───────────────────────────────
export {
  FlowchartSectionSchema,
  ScenarioSectionSchema,
} from './process-simulation'

export type {
  FlowchartSectionData,
  ScenarioSectionData,
} from './process-simulation'

export { Flowchart } from './process-simulation'
export type {
  FlowchartProps,
  UnifiedFlowchartSchema,
} from './process-simulation'

export { ScenarioSection } from './process-simulation'
export type { ScenarioSectionProps } from './process-simulation'

export type {
  ProcessSimulationEvents,
  StepChanged,
  SimulationReset,
} from './process-simulation'

// ─── Dynamic Trade-off & Parameter Exploration ─────────────────────────
export {
  TradeoffSandboxSectionSchema,
  FormulaSandboxSectionSchema,
  DecisionTreeSectionSchema,
} from './tradeoff-sandbox'

export type {
  TradeoffSandboxSectionData,
  TradeoffMetricDef,
  TradeoffProCon,
  TradeoffChoice,
  TradeoffStep,
  TradeoffScenario,
  FormulaSandboxSectionData,
  FormulaVariable,
  FormulaMetric,
  DecisionTreeSectionData,
  DecisionTreeNode,
  DecisionTreeChoice,
  DecisionTreeLeaf,
} from './tradeoff-sandbox'

export { TradeoffSandboxSection } from './tradeoff-sandbox'
export type { TradeoffSandboxSectionProps } from './tradeoff-sandbox'

export { FormulaSandboxSection, FormulaSandbox } from './tradeoff-sandbox'
export type { FormulaSandboxProps } from './tradeoff-sandbox'

export { DecisionTreeSection } from './tradeoff-sandbox'
export type { DecisionTreeSectionProps } from './tradeoff-sandbox'

export type {
  TradeoffSandboxEvents,
  SliderValueChanged,
  MetricRecalculated,
  DecisionNodeSelected,
} from './tradeoff-sandbox'

// ─── Metacognitive Reflection & Synthesis ──────────────────────────────
export {
  ReflectionSequenceSectionSchema,
  ReflectionTemplateSectionSchema,
} from './reflection-synthesis'

export type {
  ReflectionSequenceSectionData,
  SequenceItem,
  ReflectionSequenceChallenge,
  ReflectionTemplateSectionData,
  ChipItem,
  ReflectionTemplateChallenge,
} from './reflection-synthesis'

export { ReflectionSequenceSection } from './reflection-synthesis'
export type { ReflectionSequenceProps } from './reflection-synthesis'

export { ReflectionTemplateSection } from './reflection-synthesis'
export type { ReflectionTemplateProps } from './reflection-synthesis'

export type {
  ReflectionSynthesisEvents,
  ReflectionAnswered,
  ReflectionCompleted,
} from './reflection-synthesis'

// ─── Progressive Loom Content Presentation ─────────────────────────────
export {
  TextSectionSchema,
  IntroSectionSchema,
  BulletsSectionSchema,
  TaxonomyBrowserSectionSchema,
  ImageGallerySectionSchema,
} from './progressive-content'

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
} from './progressive-content'

export { TextSection } from './progressive-content'
export type { TextSectionProps } from './progressive-content'

export { IntroSection } from './progressive-content'
export type { IntroSectionProps } from './progressive-content'

export { BulletsSection } from './progressive-content'
export type { BulletsSectionProps, BulletItemType } from './progressive-content'

export { TaxonomyBrowserSection } from './progressive-content'
export type {
  TaxonomyBrowserSectionProps,
  TaxonomyCategoryType,
} from './progressive-content'

export { ImageGallerySection } from './progressive-content'
export type { ImageGalleryProps, GalleryItemType } from './progressive-content'

export type {
  ProgressiveContentEvents,
  CategorySelected,
  GalleryItemViewed,
} from './progressive-content'

// ─── Knowledge Verification & Practice ─────────────────────────────────
export {
  QuizSectionSchema,
  FlashcardsSectionSchema,
  ConceptMapSectionSchema,
} from './practice-assessment'

export type {
  QuizSectionData,
  QuizQuestion,
  QuizChoice,
  FlashcardsSectionData,
  WordTermType,
  Dialogue,
  ConceptMapSectionData,
  ConceptNodeType,
  ConceptEdgeType,
} from './practice-assessment'

export { QuizSection } from './practice-assessment'
export type { QuizSectionProps } from './practice-assessment'

export { FlashcardsSection } from './practice-assessment'
export type { FlashcardDeckProps } from './practice-assessment'

export { ConceptMapSection } from './practice-assessment'
export type {
  ConceptMapSectionProps,
  ConceptNode,
  ConceptEdge,
} from './practice-assessment'

export type {
  PracticeAssessmentEvents,
  QuizOptionSelected,
  QuizCompleted,
  FlashcardFlipped,
  ConceptMapMatched,
} from './practice-assessment'
