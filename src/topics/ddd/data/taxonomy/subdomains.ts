import { Target, CheckCheck, Package } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

export const coreDomainCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Target as unknown as ComponentType<any>,
  title: 'Core Domain',
  subtitle: 'Subdomain Type',
  description: 'What makes the business competitive. Where differentiation lives. Full DDD treatment: rich model, best people, most iteration.',
  details: 'The core domain is the heart of your business — the capabilities that create competitive advantage and customer value. This is where you invest heavily: rich domain models, your best engineers, the most iterative refinement, and Event Storming workshops to uncover domain knowledge. Every line of code in the core domain should contribute directly to business differentiation.',
  analogy: 'The secret sauce that makes your business unique.',
  primaryFocus: 'Maximum investment in the capabilities that differentiate your business.',
  inScope: [
    'Rich domain model',
    'Best engineers',
    'Most iteration',
    'Event Storming workshops',
  ],
  outOfScope: [
    'Off-the-shelf solutions',
    'Quick CRUD',
  ],
  color: 'red',
}

export const supportingSubdomainCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: CheckCheck as unknown as ComponentType<any>,
  title: 'Supporting Subdomain',
  subtitle: 'Subdomain Type',
  description: 'Necessary but not differentiating. Enables the core domain to function. Moderate DDD: tactical patterns, clean model.',
  details: 'Supporting subdomains are essential to the business but do not create competitive advantage. They enable the core domain to function — things like user management, reporting, or billing in an e-commerce platform. Apply tactical DDD patterns and keep the model clean, but avoid deep strategic investment or overengineering.',
  analogy: 'The kitchen equipment that lets your chef cook — necessary but not the recipe.',
  primaryFocus: 'Clean implementation that enables the core without overengineering.',
  inScope: [
    'Tactical patterns',
    'Clean model',
    'Moderate effort',
  ],
  outOfScope: [
    'Deep strategic investment',
    'Overengineering',
  ],
  color: 'green',
}

export const genericSubdomainCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Package as unknown as ComponentType<any>,
  title: 'Generic Subdomain',
  subtitle: 'Subdomain Type',
  description: 'Common functionality available off the shelf. Buy, don\'t build.',
  details: 'Generic subdomains provide common functionality that many organizations need: authentication, payment processing, email delivery, logging. The strategy is simple: use third-party services or standard libraries. Do not implement these yourself. Redirect all engineering energy toward core and supporting domains.',
  analogy: 'Buying electricity instead of building a power plant.',
  primaryFocus: 'Leverage existing solutions rather than building custom implementations.',
  inScope: [
    'Third-party services',
    'Standard libraries',
    'OAuth, payments, email',
  ],
  outOfScope: [
    'Custom implementation',
    'Domain modeling',
  ],
  color: 'blue',
}
