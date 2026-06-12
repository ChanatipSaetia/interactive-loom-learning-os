import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const lifecycleStep: TradeoffStep = {
  id: 'lifecycle',
  title: 'System Lifecycle',
  description: 'Will this system outlive its initial implementation?',
  recommended: 'long-lived',
  choices: [
    {
      id: 'long-lived',
      label: 'Long-Lived System',
      description: 'Multi-year system where model quality compounds value. Business rules will evolve.',
      metrics: { maintainability: 15, 'team-independence': 5, 'time-to-mvp': -10, complexity: 10 },
      pros: [
        { title: 'DDD value compounds', description: 'A model that\'s revisited quarterly becomes the team\'s most valuable asset.' },
        { title: 'New features land cleanly', description: 'When rules change, the model adapts rather than accumulating switch statements.' },
      ],
      cons: [
        { title: 'Requires discipline', description: 'Recurring modeling sessions, domain expert access, treating bugs as model gaps.' },
      ],
      whyThisFits: 'DDD\'s value compounds over time. A long-lived system with evolving rules is exactly where DDD shines.',
    },
    {
      id: 'short-lived',
      label: 'Prototype / Short-Lived',
      description: 'Hackathon, PoC, or uncertain runway. System may be thrown away or pivoted.',
      metrics: { maintainability: -10, 'team-independence': 0, 'time-to-mvp': 15, complexity: -15 },
      pros: [
        { title: 'Speed over rigor', description: 'Script it. Throw it away. Learn from users.' },
        { title: 'No modeling overhead', description: 'Skip the workshops, code directly.' },
      ],
      cons: [
        { title: 'Technical debt', description: 'If the system becomes long-lived, rewriting is expensive.' },
      ],
      whenToUse: 'For prototypes, PoCs, or projects with uncertain runway. DDD payoff period hasn\'t arrived.',
    },
  ]
}
