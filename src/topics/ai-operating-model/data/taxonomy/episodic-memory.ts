import { History } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

export const episodicMemoryCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: History as unknown as ComponentType<any>,
  title: 'Episodic Memory',
  subtitle: 'Past Interactions',
  description: 'Stores decisions made, outcomes observed, and how prior runs played out. Provides continuity across sessions.',
  details: 'Enables the agent to learn from history. If a particular approach worked well last time, episodic memory lets the agent reference that outcome.',
  analogy: 'Like a post-mortem log — "last time we tried X, it caused Y, so let\'s avoid that."',
  primaryFocus: 'Past decisions, observed outcomes, session history',
  inScope: ['Interaction history', 'Decision outcomes', 'Prior run results'],
  outOfScope: ['Real-time context', 'Static facts and rules'],
  color: 'peach',
}
