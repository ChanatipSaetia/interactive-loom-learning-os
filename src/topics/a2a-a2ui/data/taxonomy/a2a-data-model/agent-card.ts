import { CreditCard } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../../sections/taxonomy-browser'

export const agentCardCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: CreditCard as unknown as ComponentType<any>,
  title: 'Agent Card',
  subtitle: 'A2A Data Model',
  description: 'JSON metadata document published at /.well-known/agent-card for agent discovery.',
  details: 'Contains identity, capabilities, endpoint URL, skills, and auth requirements. It is the first thing a calling agent fetches to understand what a target agent can do and how to interact with it.',
  analogy: 'Like a business card — it tells other agents who you are, what you can do, and how to reach you.',
  primaryFocus: 'Identity, capabilities listing, endpoint, skills, authentication, supported protocols',
  inScope: [
    'Agent identity and name',
    'Capabilities listing',
    'Endpoint URL',
    'Skills inventory',
    'Authentication requirements',
    'Supported protocols',
  ],
  outOfScope: ['Task execution', 'Message content', 'Runtime state'],
  color: 'sky',
}
