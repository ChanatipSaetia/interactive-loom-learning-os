import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'
import { workingMemoryCategory } from './working-memory'
import { episodicMemoryCategory } from './episodic-memory'
import { semanticMemoryCategory } from './semantic-memory'
import { proceduralMemoryCategory } from './procedural-memory'

export const memoryTypeCategories: TaxonomyCategory[] = [
  workingMemoryCategory,
  episodicMemoryCategory,
  semanticMemoryCategory,
  proceduralMemoryCategory,
]
