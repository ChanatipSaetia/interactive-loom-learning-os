import { Workflow } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

export const proceduralMemoryCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Workflow as unknown as ComponentType<any>,
  title: 'Procedural Memory',
  subtitle: 'Learned Sequences',
  description: 'Captures action sequences that have proven effective, enabling improvement on repeated tasks without re-derivation.',
  details: 'The agent learns which sequences of tool calls and decisions produce reliable outcomes, then reuses those patterns for similar future tasks.',
  analogy: 'Like muscle memory — once you learn to touch-type, you don\'t think about which finger presses which key.',
  primaryFocus: 'Learned action sequences, proven workflows, pattern reuse',
  inScope: ['Effective tool call sequences', 'Optimized decision paths', 'Repeated task patterns'],
  outOfScope: ['One-off novel reasoning', 'Static factual knowledge'],
  color: 'teal',
}
