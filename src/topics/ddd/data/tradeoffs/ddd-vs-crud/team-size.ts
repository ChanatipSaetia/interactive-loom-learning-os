import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const teamSizeStep: TradeoffStep = {
  id: 'team-size',
  title: 'Team Structure',
  description: 'How many teams will work on this system, and do they share terminology?',
  recommended: 'multi-team',
  choices: [
    {
      id: 'multi-team',
      label: 'Multiple Teams',
      description: '3+ teams working on the same system. "Package" or "Order" means different things to different teams.',
      metrics: { maintainability: 10, 'team-independence': 20, 'time-to-mvp': -5, complexity: 10 },
      pros: [
        { title: 'Bounded contexts = team boundaries', description: 'Each team owns their context, deploys independently, no merge conflicts.' },
        { title: 'Natural microservices split', description: 'Context map shows where service boundaries should be.' },
      ],
      cons: [
        { title: 'Coordination overhead', description: 'Context mapping and joint modeling requires communication.' },
      ],
      whyThisFits: 'When multiple teams share terminology but mean different things, bounded contexts resolve both technical and social ambiguity.',
    },
    {
      id: 'single-team',
      label: 'Single Team',
      description: 'One team, one codebase, shared understanding. No terminology conflicts.',
      metrics: { maintainability: -5, 'team-independence': -10, 'time-to-mvp': 10, complexity: -10 },
      pros: [
        { title: 'Less coordination', description: 'One team, one shared model. Tactical DDD only — no context map needed yet.' },
        { title: 'Faster iteration', description: 'No cross-team negotiation on context boundaries.' },
      ],
      cons: [
        { title: 'Future retrofit needed', description: 'If the org grows, strategic DDD must be retrofitted.' },
      ],
      whenToUse: 'Tactical DDD only is valid for single-team projects with genuine domain complexity. Strategic DDD defers until boundaries become necessary.',
    },
  ]
}
