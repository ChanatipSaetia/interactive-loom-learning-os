import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const stateStep: TradeoffStep = {
  id: 'state',
  title: 'State Management',
  description: 'How to handle shared real-time state across connected clients.',
  recommended: 'redis-pubsub',
  choices: [
    {
      id: 'redis-pubsub',
      label: 'Redis Pub/Sub',
      description: 'Fast in-memory pub/sub for message broadcast and session state.',
      metrics: { latency: 15, consistency: 5, devex: 10, 'ops-cost': 5 },
      pros: [
        { title: 'Sub-millisecond reads', description: 'In-memory data store' },
        { title: 'Pub/Sub native', description: 'Built-in message broker' },
        { title: 'Simple operations', description: 'Easy to deploy and monitor' },
      ],
      cons: [
        { title: 'Memory-bound', description: 'Dataset must fit in RAM' },
        { title: 'Eventual consistency', description: 'Cross-region replication lag' },
      ],
      whyThisFits: 'Redis provides the simplicity and speed needed for real-time collaboration. Its pub/sub model maps directly to the broadcast pattern required for multi-user editing.',
    },
    {
      id: 'crdt-sync',
      label: 'CRDT Sync',
      description: 'Conflict-free replicated data types for eventual consistency.',
      metrics: { latency: 10, consistency: 20, devex: -5, 'ops-cost': -5 },
      pros: [
        { title: 'Conflict-free merges', description: 'Guaranteed convergence without coordination' },
        { title: 'Offline support', description: 'Changes merge when reconnected' },
        { title: 'No single point of failure', description: 'Any replica can serve' },
      ],
      cons: [
        { title: 'Complex implementation', description: 'CRDT algorithms are non-trivial' },
        { title: 'Storage overhead', description: 'Vector clocks and tombstones add size' },
        { title: 'Limited query support', description: 'Optimized for sync, not analytics' },
      ],
      whenToUse: 'Ideal for offline-first collaborative editing where conflict resolution must be automatic and guaranteed.',
    },
  ],
}
