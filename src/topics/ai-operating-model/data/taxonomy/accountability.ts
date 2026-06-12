import { Users } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

export const accountabilityCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Users as unknown as ComponentType<any>,
  title: '6. Accountability',
  subtitle: 'Who owns the result when the workflow finishes?',
  description: 'Prevents accountability diffusion through four named roles: Business Owner, Technical Owner, Data Owner, and Model Oversight. The Business Owner and Technical Owner operate as dual-key — neither can act alone.',
  details: 'Business Owner owns the workflow\'s purpose and risk appetite. Technical Owner owns architecture, integrations, and uptime. Data Owner governs source-of-truth quality. Model Oversight tracks drift, bias, and behavioral change over time.',
  analogy: 'Like a nuclear launch requiring two keys — no single person has the power to commit or change the system unilaterally.',
  primaryFocus: 'Named ownership, dual-key control, accountability chains',
  inScope: ['Business Owner', 'Technical Owner', 'Data Owner', 'Model Oversight', 'Dual-key authorization'],
  outOfScope: ['Unattributed decisions', 'Shared-but-unspecified ownership'],
  color: 'lavender',
}
