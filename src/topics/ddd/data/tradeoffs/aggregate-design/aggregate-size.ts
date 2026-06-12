import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const aggregateSizeStep: TradeoffStep = {
  id: 'aggregate-size',
  title: 'Aggregate Size',
  description: 'Should your aggregate contain everything related, or be narrowly focused?',
  recommended: 'thin',
  choices: [
    {
      id: 'thin',
      label: 'Thin Aggregate',
      description: 'One entity + essential children. References other aggregates by ID. One transaction = one aggregate. Loading should be under 10ms.',
      metrics: { performance: 15, consistency: -5, maintainability: 10, complexity: 5 },
      pros: [
        { title: 'Fast loading', description: 'Small graph means fast queries and low memory footprint.' },
        { title: 'No concurrency conflicts', description: 'Two users modifying different aggregates never block each other.' },
        { title: 'Easy to test', description: 'Constructing a thin aggregate for tests is trivial.' },
      ],
      cons: [
        { title: 'Eventual consistency', description: 'Cross-aggregate consistency is eventual, not immediate.' },
      ],
      whyThisFits: 'The rule: make the aggregate as small as possible while still enforcing all invariants. If two things never change together, they should not be in the same aggregate.',
    },
    {
      id: 'god',
      label: 'God Aggregate',
      description: 'Everything in one: Order + Customer + Payment + Invoice + Fulfillment + Refunds + Coupons. One transaction for all.',
      metrics: { performance: -20, consistency: 15, maintainability: -15, complexity: 20 },
      pros: [
        { title: 'Strong consistency', description: 'All invariants enforced in one transaction.' },
      ],
      cons: [
        { title: 'Performance kills', description: 'Loading the entire graph for "change shipping address" is wasteful.' },
        { title: 'Concurrency bottleneck', description: 'Two users modifying payment and shipping block each other.' },
        { title: 'Test nightmare', description: 'Testing one invariant requires constructing the entire graph.' },
      ],
      whenToUse: 'Almost never. If loading your aggregate takes more than 10ms or your equals() compares more than 5 fields, it\'s too big.',
    },
  ]
}
