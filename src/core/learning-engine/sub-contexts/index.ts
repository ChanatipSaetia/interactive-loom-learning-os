/**
 * Centralized Domain Barrel Export
 *
 * Canonical entry point for all 5 Core Learning Sub-Contexts.
 * Re-exports bounded context contracts and renderers so callers
 * can import from `src/core/learning-engine/sub-contexts` instead
 * of nested paths. Supporting subdomains live in `src/core/supporting`
 * and must NOT be re-exported from this core learning barrel.
 */

// ─── Unified Section Result Contract ──────────────────────────────────
export type {
  SectionResultContract,
  SectionCompletionStatus,
  SectionResultProps,
} from './types'

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

export { FlowchartFormEditor, ScenarioFormEditor } from './process-simulation'

export type {
  ProcessSimulationEvents,
  StepChanged,
  SimulationReset,
} from './process-simulation'
export { validateProcessSimulationTier3 } from './process-simulation'

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

export { TradeoffHelpModal } from './tradeoff-sandbox'
export { FormulaHelpModal } from './tradeoff-sandbox'
export { DecisionTreeHelpModal } from './tradeoff-sandbox'

export {
  TradeoffSandboxFormEditor,
  FormulaSandboxFormEditor,
  DecisionTreeFormEditor,
} from './tradeoff-sandbox'

export type {
  TradeoffSandboxEvents,
  SliderValueChanged,
  MetricRecalculated,
  DecisionNodeSelected,
} from './tradeoff-sandbox'
export { validateTradeoffSandboxTier3 } from './tradeoff-sandbox'

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

export { ReflectionSequenceHelpModal } from './reflection-synthesis'
export { ReflectionTemplateHelpModal } from './reflection-synthesis'

export {
  ReflectionSequenceFormEditor,
  ReflectionTemplateFormEditor,
} from './reflection-synthesis'

export type {
  ReflectionSynthesisEvents,
  ReflectionAnswered,
  ReflectionCompleted,
} from './reflection-synthesis'
export { validateReflectionSynthesisTier3 } from './reflection-synthesis'

// ─── Progressive Loom Content Presentation ─────────────────────────────
export {
  TextSectionSchema,
  OpenUISectionSchema,
  IntroSectionSchema,
  BulletsSectionSchema,
  TaxonomyBrowserSectionSchema,
  ImageGallerySectionSchema,
  PillarLayerSectionSchema,
} from './progressive-content'

export type {
  TextSectionData,
  OpenUISectionData,
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
} from './progressive-content'

export { TextSection, TextHelpModal } from './progressive-content'
export type { TextSectionProps } from './progressive-content'

export { OpenUISection, OpenUIHelpModal } from './progressive-content'
export type { OpenUISectionProps, OpenUIDirective, StandardOpenUISpec } from './progressive-content'
export {
  OPENUI_SECTION_TYPE,
  standardOpenUISchema,
  standardOpenUISpec,
  readOpenUIDirective,
  isOpenUISource,
  openUIProgramOf,
  printOpenUISection,
} from './progressive-content'

export { IntroSection, IntroHelpModal } from './progressive-content'
export type { IntroSectionProps } from './progressive-content'

export { BulletsSection, BulletsHelpModal } from './progressive-content'
export type { BulletsSectionProps, BulletItemType } from './progressive-content'

export { TaxonomyBrowserSection, TaxonomyHelpModal } from './progressive-content'
export type {
  TaxonomyBrowserSectionProps,
  TaxonomyCategoryType,
} from './progressive-content'

export { ImageGallerySection } from './progressive-content'
export type { ImageGalleryProps, GalleryItemType } from './progressive-content'

export { PillarLayerSection, PillarLayerHelpModal } from './progressive-content'
export type { PillarLayerSectionProps } from './progressive-content'

export {
  TextFormEditor,
  OpenUIFormEditor,
  IntroFormEditor,
  BulletsFormEditor,
  TaxonomyBrowserFormEditor,
  PillarLayerFormEditor,
} from './progressive-content'

export type {
  ProgressiveContentEvents,
  CategorySelected,
  GalleryItemViewed,
} from './progressive-content'
export { validateProgressiveContentTier3 } from './progressive-content'

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

export { QuizHelpModal } from './practice-assessment'
export { FlashcardsHelpModal } from './practice-assessment'
export { ConceptMapHelpModal } from './practice-assessment'

export {
  QuizFormEditor,
  FlashcardsFormEditor,
  ConceptMapFormEditor,
} from './practice-assessment'

export type {
  PracticeAssessmentEvents,
  QuizOptionSelected,
  QuizCompleted,
  FlashcardFlipped,
  ConceptMapMatched,
} from './practice-assessment'
export { validatePracticeAssessmentTier3 } from './practice-assessment'

