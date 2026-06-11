import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const backendStep: TradeoffStep = {
  id: 'backend',
  title: 'Backend Architecture',
  description: 'Decide how to structure the server-side logic.',
  recommended: 'modular-monolith',
  choices: [
    {
      id: 'microservices',
      label: 'Microservices',
      description: 'Independent services communicating via REST/gRPC.',
      metrics: { performance: -5, scalability: 20, complexity: 20, cost: -10 },
      pros: [
        { title: 'Independent scaling', description: 'Scale hot services without scaling all' },
        { title: 'Tech diversity', description: 'Each service can use best-fit language' },
        { title: 'Fault isolation', description: 'One service failure does not crash all' },
      ],
      cons: [
        { title: 'Network overhead', description: 'Inter-service calls add latency' },
        { title: 'Operational cost', description: 'More services to monitor and deploy' },
        { title: 'Distributed tracing', description: 'Debugging spans multiple services' },
      ],
      whenToUse: 'Consider when your team has significant DevOps experience and specific services have vastly different scaling requirements.',
    },
    {
      id: 'modular-monolith',
      label: 'Modular Monolith',
      description: 'Single deployable with strict module boundaries.',
      metrics: { performance: 10, scalability: -5, complexity: -10, cost: 15 },
      pros: [
        { title: 'Simpler deployment', description: 'One artifact to deploy' },
        { title: 'Fast local calls', description: 'In-process communication, no network' },
        { title: 'Easier debugging', description: 'Single stack trace, one log file' },
      ],
      cons: [
        { title: 'Monolithic scaling', description: 'Must scale entire app, not parts' },
        { title: 'Tight coupling risk', description: 'Module boundaries can degrade over time' },
      ],
      whyThisFits: 'Starting with a modular monolith reduces operational overhead while maintaining clean boundaries. It can be split into microservices later if specific modules need independent scaling.',
    },
  ],
}
