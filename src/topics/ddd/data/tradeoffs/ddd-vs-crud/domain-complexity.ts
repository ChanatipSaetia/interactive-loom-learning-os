import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const domainComplexityStep: TradeoffStep = {
  id: 'domain-complexity',
  title: 'Domain Complexity',
  description: 'How complex are the business rules in your system?',
  recommended: 'rich-rules',
  choices: [
    {
      id: 'rich-rules',
      label: 'Rich Business Rules',
      description: 'Multi-step workflows, state machines, promotion gates, quality checks. Rules change frequently and interact with each other.',
      metrics: { maintainability: 15, 'team-independence': 5, 'time-to-mvp': -10, complexity: 10 },
      pros: [
        { title: 'DDD is designed for this', description: 'Aggregates enforce invariants. Events capture state transitions. The model evolves with the business.' },
        { title: 'Long-term payoff', description: 'Initial investment pays off as rules grow more complex.' },
      ],
      cons: [
        { title: 'Slower start', description: 'Event Storming and modeling takes time before code.' },
      ],
      whyThisFits: 'This is DDD territory. When business rules are genuinely complex, the model pays for itself by preventing bugs and making new features easier to add.',
    },
    {
      id: 'simple-crud',
      label: 'Simple CRUD',
      description: 'Create, read, update, delete records. Maybe search and filter. Business rules: "this field can\'t be null."',
      metrics: { maintainability: -5, 'team-independence': 0, 'time-to-mvp': 20, complexity: -15 },
      pros: [
        { title: 'Fast to build', description: 'Ship in days, not weeks. ORM + service layer is enough.' },
        { title: 'Easy to understand', description: 'Junior developers can contribute immediately.' },
      ],
      cons: [
        { title: 'Breaks at scale', description: 'When rules get complex, CRUD becomes a switch-statement mess.' },
      ],
      whenToUse: 'When the litmus test fails — if you can\'t explain the business rules in more than 3 sentences, you need CRUD, not DDD.',
    },
  ]
}
