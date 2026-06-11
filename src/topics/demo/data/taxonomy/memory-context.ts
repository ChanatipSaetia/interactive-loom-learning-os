import { Shield } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

export const memoryContextCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Shield as unknown as ComponentType<any>,
  title: 'Memory & Context',
  subtitle: 'State Management',
  description: 'The agent maintains short-term context within a session and retrieves relevant long-term knowledge from a vector store.',
  details: 'Memory includes conversation history, tool output caching, and semantic retrieval of stored facts.',
  analogy: 'Like a researcher with sticky notes for current work and a reference library for background knowledge.',
  primaryFocus: 'Context window management and semantic retrieval',
  inScope: ['Conversation history', 'Vector DB retrieval', 'Embedding storage'],
  outOfScope: ['Real-time streaming state sync'],
  color: 'blue',
}
