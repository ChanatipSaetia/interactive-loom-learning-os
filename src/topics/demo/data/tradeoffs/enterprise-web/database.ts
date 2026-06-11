import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const databaseStep: TradeoffStep = {
  id: 'database',
  title: 'Data Storage',
  description: 'Choose the primary persistence layer.',
  recommended: 'postgresql',
  choices: [
    {
      id: 'postgresql',
      label: 'PostgreSQL',
      description: 'Relational database with ACID compliance and JSON support.',
      metrics: { performance: 5, scalability: 5, complexity: -5, cost: 5 },
      pros: [
        { title: 'ACID compliance', description: 'Guaranteed data integrity' },
        { title: 'JSON support', description: 'Semi-structured data without NoSQL' },
        { title: 'Mature ecosystem', description: 'Well-understood tooling and patterns' },
      ],
      cons: [
        { title: 'Schema migrations', description: 'Schema changes require planning' },
        { title: 'Vertical scaling limits', description: 'Read replicas needed for scale' },
      ],
      whyThisFits: 'Enterprise applications require strong data integrity, complex querying, and reliable transactions. PostgreSQL provides all of this with the flexibility of JSON columns for semi-structured data.',
    },
    {
      id: 'mongo',
      label: 'MongoDB',
      description: 'Document database with flexible schema and horizontal scaling.',
      metrics: { performance: 10, scalability: 15, complexity: 5, cost: -5 },
      pros: [
        { title: 'Flexible schema', description: 'No migrations for evolving models' },
        { title: 'Horizontal scaling', description: 'Sharding built into the platform' },
        { title: 'Fast writes', description: 'Document model suits high-throughput inserts' },
      ],
      cons: [
        { title: 'No ACID joins', description: 'Multi-document transactions are limited' },
        { title: 'Schema drift risk', description: 'Without enforcement, data quality varies' },
      ],
      whenToUse: 'Best for content management systems, catalog data, or high-throughput event logging where strict consistency is less critical.',
    },
  ],
}
