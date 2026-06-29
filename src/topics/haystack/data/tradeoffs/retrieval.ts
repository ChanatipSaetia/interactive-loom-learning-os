import type { TradeoffStep } from '../../../../sections/tradeoff-sandbox'

export const retrievalStep: TradeoffStep = {
  id: 'retrieval',
  title: 'Retrieval Strategy',
  description: 'Choose how your system finds relevant documents.',
  recommended: 'hybrid',
  choices: [
    {
      id: 'bm25-only',
      label: 'BM25 (Keyword)',
      description: 'Pure keyword matching based on term frequency and inverse document frequency.',
      metrics: { accuracy: -15, latency: 20, complexity: -15, cost: 20 },
      pros: [
        { title: 'Fast execution', description: 'No embedding computation needed, direct keyword lookup' },
        { title: 'Exact matching', description: 'Perfect for proper nouns, IDs, and specific terms' },
        { title: 'No model cost', description: 'No embedding API calls or model hosting required' },
      ],
      cons: [
        { title: 'No semantic understanding', description: 'Cannot match synonyms or paraphrased queries' },
        { title: 'Language dependent', description: 'Requires stemming and stopword handling per language' },
      ],
      whenToUse: 'Best when users search for exact terms, product codes, or known identifiers.',
    },
    {
      id: 'dense-only',
      label: 'Dense Vector',
      description: 'Semantic similarity search using embedding vectors.',
      metrics: { accuracy: 5, latency: -10, complexity: 5, cost: -10 },
      pros: [
        { title: 'Semantic matching', description: 'Finds conceptually similar documents even with different wording' },
        { title: 'Language agnostic', description: 'Multilingual embeddings work across languages' },
        { title: 'Robust to typos', description: 'Vector similarity tolerates minor spelling errors' },
      ],
      cons: [
        { title: 'Embedding cost', description: 'Every query and document needs vector computation' },
        { title: 'Misses exact terms', description: 'May overlook documents with specific keywords' },
      ],
      whenToUse: 'Best for conceptual search, research, and natural-language questions.',
    },
    {
      id: 'hybrid',
      label: 'Hybrid (BM25 + Dense)',
      description: 'Combines keyword and semantic search with Reciprocal Rank Fusion.',
      metrics: { accuracy: 25, latency: -5, complexity: 10, cost: -5 },
      pros: [
        { title: 'Best of both worlds', description: 'Catches exact terms AND semantic matches' },
        { title: 'RRF fusion', description: 'Reciprocal Rank Fusion combines scores without tuning' },
        { title: 'Production standard', description: 'Industry best practice for enterprise search' },
      ],
      cons: [
        { title: 'Moderate overhead', description: 'Runs two retrieval passes per query' },
        { title: 'Dual indexing', description: 'Documents need both keyword and vector indexes' },
      ],
      whyThisFits: 'Hybrid retrieval is the recommended production default. It provides the accuracy of semantic search while preserving the exact-match capability of BM25, with minimal latency overhead from RRF fusion.',
    },
  ],
}
