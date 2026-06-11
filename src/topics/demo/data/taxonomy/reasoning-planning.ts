import { Brain } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

export const reasoningPlanningCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Brain as unknown as ComponentType<any>,
  title: 'Reasoning & Planning',
  subtitle: 'Core Intelligence',
  description: 'The agent decomposes goals into actionable plans, reasons through chain-of-thought, and adapts strategies when encountering obstacles.',
  details: 'Planning encompasses ReAct loops, tree-of-thought search, and self-refinement patterns.',
  analogy: 'Like a project manager breaking down an epic into sprint tasks and adjusting when blockers appear.',
  primaryFocus: 'Goal decomposition and step-by-step execution',
  inScope: ['Chain-of-thought', 'ReAct loops', 'Self-correction'],
  outOfScope: ['Raw text generation without planning'],
  color: 'mauve',
}
