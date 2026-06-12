import { Brain } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

export const workingMemoryCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Brain as unknown as ComponentType<any>,
  title: 'Working Memory',
  subtitle: 'Current Task Context',
  description: 'Holds the intermediate reasoning, tool outputs, and session state for the task the agent is executing right now.',
  details: 'Enables multi-step reasoning within a single session. Without working memory, the agent would lose track of what it was doing between tool calls.',
  analogy: 'Like a developer\'s mental scratchpad while debugging — active context that disappears when the task ends.',
  primaryFocus: 'Intermediate reasoning, tool outputs, session state',
  inScope: ['Current prompt context', 'Tool call results', 'Chain-of-thought steps'],
  outOfScope: ['Cross-session recall', 'Long-term knowledge'],
  color: 'blue',
}
