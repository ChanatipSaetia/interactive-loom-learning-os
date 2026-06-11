import { Workflow } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

export const selfEvaluationCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Workflow as unknown as ComponentType<any>,
  title: 'Self-Evaluation',
  subtitle: 'Quality Assurance',
  description: 'The agent evaluates its own output against success criteria, identifies failures, and triggers re-planning when goals are not met.',
  details: 'Self-evaluation uses structured critique prompts, rubric-based scoring, and automated success checks.',
  analogy: 'Like a code review process where the author checks their own pull request before submitting.',
  primaryFocus: 'Output validation and failure recovery',
  inScope: ['Success criteria checking', 'Rubric scoring', 'Re-planning triggers'],
  outOfScope: ['Human-in-the-loop approval'],
  color: 'green',
}
