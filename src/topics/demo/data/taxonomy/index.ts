import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'
import { reasoningPlanningCategory } from './reasoning-planning'
import { toolUseCategory } from './tool-use'
import { memoryContextCategory } from './memory-context'
import { selfEvaluationCategory } from './self-evaluation'

export const taxonomyCategories: TaxonomyCategory[] = [
  reasoningPlanningCategory,
  toolUseCategory,
  memoryContextCategory,
  selfEvaluationCategory,
]
