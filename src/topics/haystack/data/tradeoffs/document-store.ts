import type { TradeoffStep } from '../../../../sections/tradeoff-sandbox'

export const documentStoreStep: TradeoffStep = {
  id: 'document-store',
  title: 'Document Store Backend',
  description: 'Choose where to store and index your documents.',
  recommended: 'opensearch',
  choices: [
    {
      id: 'in-memory',
      label: 'InMemoryDocumentStore',
      description: 'In-process memory store with no external dependencies.',
      metrics: { accuracy: -10, latency: 25, complexity: -25, cost: 20 },
      pros: [
        { title: 'Zero setup', description: 'No external database to install or configure' },
        { title: 'Fastest for small data', description: 'No network latency for document access' },
        { title: 'Ideal for prototyping', description: 'Perfect for tutorials and quick experiments' },
      ],
      cons: [
        { title: 'No persistence', description: 'Data lost when process restarts' },
        { title: 'No scaling', description: 'Cannot handle large document collections' },
        { title: 'No distribution', description: 'Single-process, single-machine only' },
      ],
      whenToUse: 'Use during development, testing, and when dataset fits in memory.',
    },
    {
      id: 'chroma',
      label: 'Chroma',
      description: 'Lightweight vector database focused on embedding search.',
      metrics: { accuracy: 0, latency: 5, complexity: -5, cost: 10 },
      pros: [
        { title: 'Simple API', description: 'Minimal configuration, easy to self-host' },
        { title: 'Embedding-first', description: 'Optimized for dense vector operations' },
        { title: 'Good developer UX', description: 'Clean Python client and local mode' },
      ],
      cons: [
        { title: 'No BM25', description: 'Vector-only, no keyword search built-in' },
        { title: 'Limited filtering', description: 'Metadata filtering is basic compared to OpenSearch' },
      ],
      whenToUse: 'Good for embedding-only pipelines with moderate scale.',
    },
    {
      id: 'opensearch',
      label: 'OpenSearch',
      description: 'Full-featured search engine with hybrid search and rich filtering.',
      metrics: { accuracy: 20, latency: -5, complexity: 15, cost: 0 },
      pros: [
        { title: 'Hybrid search native', description: 'BM25 + vectors + RRF fusion in one query' },
        { title: 'Full OpenSearch DSL', description: 'Inject custom queries for maximum control' },
        { title: 'Rich metadata filtering', description: 'Complex boolean filters on document metadata' },
        { title: 'Enterprise scale', description: 'Horizontal scaling, replication, and high availability' },
      ],
      cons: [
        { title: 'Infrastructure cost', description: 'Requires running OpenSearch cluster' },
        { title: 'Configuration complexity', description: 'Mapping, shard settings, and cluster management' },
      ],
      whyThisFits: 'OpenSearch is the recommended production backend. Its native hybrid search, full DSL access, and robust metadata filtering make it the most flexible choice for enterprise Haystack deployments.',
    },
  ],
}
