import { ShieldCheck } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

export const scopeAuthorityCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: ShieldCheck as unknown as ComponentType<any>,
  title: '3. Scope and Authority',
  subtitle: 'Where is it allowed to write, and how independently?',
  description: 'Scope defines the unit of work tied to a specific responsibility. Authority defines independence through four autonomy tiers: Shadow, Supervised, Guided, and Autonomous.',
  details: 'Departmental framings like "a finance agent" fail in production. Production-grade scoping ties an agent to a specific responsibility with its own inputs, outputs, and failure modes. The autonomy tier determines how much human oversight is required.',
  analogy: 'Like defining a job role (scope) and the approval authority level (authority) for an employee — a junior analyst drafts, a manager approves.',
  primaryFocus: 'Unit of work definition, autonomy tier selection, escalation paths',
  inScope: ['Shadow (suggests only)', 'Supervised (drafts, human approves)', 'Guided (acts, human monitors)', 'Autonomous (self-corrects within bounds)'],
  outOfScope: ['Unscoped general-purpose agents', 'Agents without defined escalation paths'],
  color: 'peach',
}
