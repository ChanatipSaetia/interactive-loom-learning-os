import type { TaxonomyCategory } from '../../../../../sections/taxonomy-browser'
import { mcpCategory } from './mcp'
import { a2aCategory } from './a2a'
import { a2uiCategory } from './a2ui'

export const agenticStackCategories: TaxonomyCategory[] = [
  mcpCategory,
  a2aCategory,
  a2uiCategory,
]
