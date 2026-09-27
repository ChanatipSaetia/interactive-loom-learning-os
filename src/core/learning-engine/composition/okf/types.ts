import type { SectionIntro, SectionMeta, ValidationDiagnostic, ValidationResult } from '../../validation/types'
import type {
  FlowchartSectionData,
  ScenarioSectionData,
  ScenarioNode,
  ScenarioChoice,
  ScenarioOutcome,
} from '../../sub-contexts/process-simulation'
import type {
  TradeoffSandboxSectionData,
  FormulaSandboxSectionData,
  DecisionTreeSectionData,
  FormulaVariable,
  FormulaMetric,
  DecisionTreeNode,
  DecisionTreeChoice,
  DecisionTreeLeaf,
} from '../../sub-contexts/tradeoff-sandbox'
import type {
  ReflectionSequenceSectionData,
  ReflectionTemplateSectionData,
  ReflectionSequenceChallenge,
  ReflectionTemplateChallenge,
} from '../../sub-contexts/reflection-synthesis'
import type {
  TextSectionData,
  IntroSectionData,
  BulletsSectionData,
  TaxonomyBrowserSectionData,
  ImageGallerySectionData,
  PillarLayerSectionData,
  IntroRoadmapStep,
  GalleryItem,
} from '../../sub-contexts/progressive-content'
import type {
  QuizSectionData,
  FlashcardsSectionData,
  ConceptMapSectionData,
  QuizQuestion,
  QuizChoice,
  ConceptNode,
  ConceptEdge,
} from '../../sub-contexts/practice-assessment'

// --- Per-section bundle ---

export type OKFBundled = OKFBundledSection[]

export interface OKFBundledSection {
  meta: OKFSectionMeta
  data: OKFSectionData
  sectionBody?: string
  sectionFolder?: string
  /** Validation Gateway outcome for this section (absent for in-memory bundles built by hand). */
  validation?: OKFSectionValidation
}

export interface OKFSectionValidation {
  status: ValidationResult['status']
  diagnostics: ValidationDiagnostic[]
}

export type OKFSectionIntro = SectionIntro
export type OKFSectionMeta = SectionMeta

/**
 * Composite OKF Section Data Union compiled directly from subdomain schemas
 */
export type OKFSectionData =
  | IntroSectionData
  | TextSectionData
  | BulletsSectionData
  | FlowchartSectionData
  | TradeoffSandboxSectionData
  | TaxonomyBrowserSectionData
  | FlashcardsSectionData
  | QuizSectionData
  | ConceptMapSectionData
  | ScenarioSectionData
  | DecisionTreeSectionData
  | ImageGallerySectionData
  | FormulaSandboxSectionData
  | ReflectionSequenceSectionData
  | ReflectionTemplateSectionData
  | PillarLayerSectionData

export type OKFIntroSectionData = IntroSectionData
export type OKFTextSectionData = TextSectionData
export type OKFBulletSectionData = BulletsSectionData
export type OKFFlowSectionData = FlowchartSectionData
export type OKFTradeoffSectionData = TradeoffSandboxSectionData
export type OKFTaxonomySectionData = TaxonomyBrowserSectionData
export type OKFFlashcardSectionData = FlashcardsSectionData
export type OKFQuizSectionData = QuizSectionData
export type OKFConceptMapSectionData = ConceptMapSectionData
export type OKFScenarioSectionData = ScenarioSectionData
export type OKFDecisionTreeSectionData = DecisionTreeSectionData
export type OKFImageGallerySectionData = ImageGallerySectionData
export type OKFFormulaSandboxSectionData = FormulaSandboxSectionData
export type OKFReflectionSequenceSectionData = ReflectionSequenceSectionData
export type OKFReflectionTemplateSectionData = ReflectionTemplateSectionData
export type OKFPillarLayerSectionData = PillarLayerSectionData


export type OKFFormulaVariable = FormulaVariable
export type OKFFormulaMetric = FormulaMetric
export type OKFDecisionTreeNode = DecisionTreeNode
export type OKFDecisionTreeChoice = DecisionTreeChoice
export type OKFDecisionTreeLeaf = DecisionTreeLeaf
export type OKFIntroRoadmapStep = IntroRoadmapStep
export type OKFReflectionSequenceChallenge = ReflectionSequenceChallenge
export type OKFReflectionTemplateChallenge = ReflectionTemplateChallenge
export type OKFQuizQuestion = QuizQuestion
export type OKFQuizChoice = QuizChoice
export type OKFConceptNode = ConceptNode
export type OKFConceptEdge = ConceptEdge
export type OKFScenarioNode = ScenarioNode
export type OKFScenarioChoice = ScenarioChoice
export type OKFScenarioOutcome = ScenarioOutcome
export type OKFGalleryItem = GalleryItem

export type ScenarioRating = 'a' | 'b-plus' | 'b-minus' | 'c'



