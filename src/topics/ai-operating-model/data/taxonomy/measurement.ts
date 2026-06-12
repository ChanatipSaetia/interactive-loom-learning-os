import { BarChart3 } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

export const measurementCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: BarChart3 as unknown as ComponentType<any>,
  title: '5. Measurement',
  subtitle: 'How do we know the workflow improved?',
  description: 'The measurement model defines the metrics that indicate whether the agentized workflow is performing better than the baseline — cycle time, containment rate, handoff patterns, override rate, and drift detection.',
  details: 'Key metrics: Cycle time (trigger to completion), Containment rate (cases resolved without human handoff), Handoff rate by reason (where the agent escalates and why), Override rate (agent decisions reversed by humans), and Drift detection lag (time between output drift and detection). What not to measure: how much AI was used.',
  analogy: 'Like KPIs for a business process — you measure outcomes, not how much of the new tool was touched.',
  primaryFocus: 'Cycle time, containment rate, handoff rate, override rate, drift detection lag',
  inScope: ['Cycle time trends', 'Containment rate', 'Handoff reasons', 'Override rate', 'Drift detection lag'],
  outOfScope: ['AI adoption metrics', 'Model accuracy in isolation', 'Token usage counts'],
  color: 'teal',
}
