import { Workflow } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

export const workflowMapCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Workflow as unknown as ComponentType<any>,
  title: '1. Workflow Map',
  subtitle: 'What work can the agent perform?',
  description: 'A documented description of the work an AI agent will perform, including trigger event, input data, decision points, output systems, and human approval gates.',
  details: 'The workflow map is the operational artifact — what a development team can implement, what a CTO can review, and what a compliance officer can audit. It serves as the agent\'s scope contract.',
  analogy: 'Like a standard operating procedure (SOP) for a human worker, but formalized enough for a machine to execute.',
  primaryFocus: 'Trigger events, input data, decision points, output systems, approval gates',
  inScope: ['Trigger event definition', 'Input data dependencies', 'Decision point mapping', 'Output system identification', 'Human approval gates'],
  outOfScope: ['Model selection', 'Prompt engineering', 'Infrastructure choices'],
  color: 'blue',
}
