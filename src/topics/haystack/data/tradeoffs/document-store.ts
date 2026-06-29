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
    {
      id: 'azure-search',
      label: 'Azure AI Search',
      description: 'Managed cloud search service with semantic ranker and Azure AI integration.',
      metrics: { accuracy: 22, latency: 0, complexity: 5, cost: -10 },
      pros: [
        { title: 'Fully managed', description: 'No infrastructure to maintain, auto-scaling included' },
        { title: 'Semantic ranker', description: 'Azure-built semantic reranking out of the box' },
        { title: 'Azure AI integration', description: 'Native integration with Azure OpenAI for embeddings and generation' },
        { title: 'Hybrid + vector search', description: 'BM25, vector, and hybrid search with semantic ranking' },
        { title: 'Enterprise features', description: 'Role-based access, private endpoints, managed identity' },
      ],
      cons: [
        { title: 'Azure lock-in', description: 'Tied to Azure ecosystem and billing' },
        { title: 'Per-query cost', description: 'Semantic ranker adds per-request charges' },
        { title: 'Haystack integration via connector', description: 'Requires haystack-azure-search-connector package' },
      ],
      whenToUse: 'Best when already in Azure ecosystem or needing managed semantic search without infrastructure overhead.',
    },
    {
      id: 'google-search',
      label: 'Google Vertex AI Search',
      description: 'Google Cloud search with generative AI grounding and enterprise knowledge base.',
      metrics: { accuracy: 20, latency: -5, complexity: 5, cost: -15 },
      pros: [
        { title: 'Generative AI grounding', description: 'Built-in RAG with Gemini models for grounded answers' },
        { title: 'Enterprise knowledge base', description: 'Pre-built connectors for G Suite, Sharepoint, and data warehouses' },
        { title: 'Multi-modal search', description: 'Search across text, images, and video with unified index' },
        { title: 'Google scale', description: 'Leverages Google search quality at cloud scale' },
      ],
      cons: [
        { title: 'GCP lock-in', description: 'Tied to Google Cloud Platform' },
        { title: 'Higher cost', description: 'Premium pricing for generative AI features' },
        { title: 'Less pipeline control', description: 'Managed service abstracts away retrieval internals' },
        { title: 'Haystack integration via custom component', description: 'Requires building a custom Haystack connector' },
      ],
      whenToUse: 'Best for GCP enterprises needing generative AI search with minimal pipeline customization.',
    },
  ],
}
