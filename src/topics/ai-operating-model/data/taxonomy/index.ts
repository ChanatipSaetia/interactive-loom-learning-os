import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'
import { workflowMapCategory } from './workflow-map'
import { dataContextCategory } from './data-context'
import { scopeAuthorityCategory } from './scope-authority'
import { runtimeControlsCategory } from './runtime-controls'
import { measurementCategory } from './measurement'
import { accountabilityCategory } from './accountability'
import { memoryTypeCategories } from './memory-types'

export const designDecisionCategories: TaxonomyCategory[] = [
  workflowMapCategory,
  dataContextCategory,
  scopeAuthorityCategory,
  runtimeControlsCategory,
  measurementCategory,
  accountabilityCategory,
]

export { memoryTypeCategories }
