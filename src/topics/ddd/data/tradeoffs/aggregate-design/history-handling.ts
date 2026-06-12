import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const historyStep: TradeoffStep = {
  id: 'history-handling',
  title: 'History Handling',
  description: 'Should history (past events, attempts, revisions) live inside the aggregate or outside?',
  recommended: 'events',
  choices: [
    {
      id: 'events',
      label: 'Domain Events (Outside)',
      description: 'Aggregate stays thin. History stored as domain events: TaskSubmitted, TaskScheduled, TaskAttemptFailed, TaskSucceeded. Replay events to reconstruct.',
      metrics: { performance: 10, consistency: 0, maintainability: 10, complexity: 10 },
      pros: [
        { title: 'Fixed-size aggregate', description: 'Aggregate never grows, no matter how many attempts or revisions.' },
        { title: 'Perfect debugging', description: 'Replay any entity\'s entire lifecycle to find why it failed.' },
        { title: 'Built-in audit trail', description: 'Events serve as compliance audit without extra work.' },
      ],
      cons: [
        { title: 'Event sourcing infrastructure', description: 'Need event store and replay mechanism.' },
      ],
      whyThisFits: 'Under high-throughput, keep aggregates thin. Externalize history to domain events. Event sourcing transforms debugging from hours to seconds.',
    },
    {
      id: 'inside',
      label: 'Inside Aggregate',
      description: 'History stored as child entities: ExecutionHistory[0..50], Result[]. Everything loads together.',
      metrics: { performance: -15, consistency: 10, maintainability: -5, complexity: -5 },
      pros: [
        { title: 'Simple queries', description: 'History is always available with the aggregate — no separate event store.' },
        { title: 'No event infrastructure', description: 'Traditional database works fine.' },
      ],
      cons: [
        { title: 'Growing memory footprint', description: 'After 50 retries, the aggregate is huge. Loading becomes a bottleneck.' },
        { title: 'No replay capability', description: 'History is tied to the aggregate snapshot, not a sequence of events.' },
      ],
      whenToUse: 'When the entity has few historical changes (< 5) and you don\'t need replay or audit capabilities.',
    },
  ]
}
