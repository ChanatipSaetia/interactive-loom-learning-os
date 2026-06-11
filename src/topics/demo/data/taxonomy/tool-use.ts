import { Zap } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

export const toolUseCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Zap as unknown as ComponentType<any>,
  title: 'Tool Use & Execution',
  subtitle: 'Action Layer',
  description: 'The agent selects and invokes external tools — web search, code execution, API calls — to extend its capabilities beyond text generation.',
  details: 'Tool routing matches task requirements to available capabilities, then dispatches execution through a sandboxed runtime.',
  analogy: 'Like a developer choosing the right CLI tool or API for each sub-task in a deployment pipeline.',
  primaryFocus: 'Tool selection, argument generation, and result processing',
  inScope: ['Web search', 'Code sandbox', 'API calls', 'Browser automation'],
  outOfScope: ['Hardware control', 'Physical world interaction'],
  color: 'peach',
}
