import { ClipboardList } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../../sections/taxonomy-browser'

export const taskCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: ClipboardList as unknown as ComponentType<any>,
  title: 'Task',
  subtitle: 'A2A Data Model',
  description: 'Stateful unit of work with a unique ID and lifecycle management.',
  details: 'Tracks long-running operations through a state machine: SUBMITTED → WORKING → COMPLETED | FAILED | CANCELED | REJECTED. Enables multi-turn collaboration and status tracking across the entire duration of an agent interaction.',
  analogy: 'Like a work order in a workshop — it tracks the job from submission to completion with status updates at each stage.',
  primaryFocus: 'State tracking, context preservation, multi-turn collaboration, cancellation, status updates',
  inScope: [
    'State tracking',
    'Context preservation',
    'Multi-turn collaboration',
    'Cancellation',
    'Status updates',
  ],
  outOfScope: ['Tool invocation', 'UI rendering', 'Authentication'],
  color: 'blue',
}
