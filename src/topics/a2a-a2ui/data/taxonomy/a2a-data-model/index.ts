import type { TaxonomyCategory } from '../../../../../sections/taxonomy-browser'
import { agentCardCategory } from './agent-card'
import { taskCategory } from './task'
import { messageCategory } from './message'
import { partCategory } from './part'
import { artifactCategory } from './artifact'

export const a2aDataModelCategories: TaxonomyCategory[] = [
  agentCardCategory,
  taskCategory,
  messageCategory,
  partCategory,
  artifactCategory,
]
