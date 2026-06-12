import { BookOpen } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

export const semanticMemoryCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: BookOpen as unknown as ComponentType<any>,
  title: 'Semantic Memory',
  subtitle: 'Facts and Rules',
  description: 'Contains business rules, definitions, and organizational facts that ground the agent\'s decisions in shared knowledge.',
  details: 'Graph-based memory enables multi-hop entity reasoning in regulated domains — for example, tracing customer → contract → invoice → payment → renewal.',
  analogy: 'Like the company wiki or knowledge base — reference material that doesn\'t change per session.',
  primaryFocus: 'Business rules, definitions, organizational facts, entity relationships',
  inScope: ['Shared knowledge base', 'Business rule definitions', 'Graph-based entity relationships'],
  outOfScope: ['Session-specific context', 'Temporal interaction history'],
  color: 'green',
}
