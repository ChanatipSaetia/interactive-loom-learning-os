import { Database } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

export const dataContextCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Database as unknown as ComponentType<any>,
  title: '2. Data and Context',
  subtitle: 'Which systems can it read from?',
  description: 'Agents operate on what they can read at runtime. This decision defines which data sources are authoritative, which are off-limits, and how the agent\'s memory is structured.',
  details: 'Four types of agent memory: Working (current task context), Episodic (past interactions and outcomes), Semantic (facts and business rules), and Procedural (learned action sequences). Graph-based memory enables multi-hop entity reasoning.',
  analogy: 'Like giving an employee access to specific databases and documents while restricting others based on role and need-to-know.',
  primaryFocus: 'Authoritative data sources, memory types, context boundaries',
  inScope: ['Working memory', 'Episodic memory', 'Semantic memory', 'Procedural memory', 'Graph-based relationships'],
  outOfScope: ['Unverified external data', 'Off-limits systems', 'Stale fields without freshness guarantees'],
  color: 'green',
}
