import { Database, GitBranch, Layers, Zap } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

const indexingPipelineCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Layers as unknown as ComponentType<any>,
  title: 'Indexing Pipeline',
  subtitle: 'Offline ETL Processing',
  description: 'An Indexing Pipeline processes raw data (PDFs, HTML, Markdown) into structured, searchable Documents. It runs offline or as a batch job, converting files, splitting text, computing embeddings, and writing to the Document Store.',
  details: 'The indexing pipeline is strictly decoupled from the query pipeline. It runs independently and its output is the Document Store. Common components: FileConverter → TextSplitter → DocumentEmbedder → DocumentWriter.',
  analogy: 'Like a library cataloging system — books are received, classified, tagged, and shelved before anyone can search for them.',
  primaryFocus: 'File conversion, text chunking, embedding computation, and document persistence.',
  inScope: ['PDF/HTML/Markdown conversion', 'Text splitting and chunking', 'Embedding computation', 'Metadata extraction', 'Duplicate detection'],
  outOfScope: ['Real-time query processing', 'LLM answer generation', 'User-facing search'],
  color: 'blue',
}

const queryPipelineCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Zap as unknown as ComponentType<any>,
  title: 'Query Pipeline',
  subtitle: 'Real-Time Retrieval',
  description: 'A Query Pipeline executes in real-time to answer user queries. It embeds the query, retrieves relevant documents, optionally ranks them, and may invoke an LLM for RAG-based answering.',
  details: 'Query pipelines are latency-sensitive. They typically chain: TextEmbedder → Retriever → Ranker → PromptBuilder → LLM. The pipeline can be simplified to just Retriever for pure search without LLM generation.',
  analogy: 'Like a librarian who receives your question, finds relevant books from the catalog, and presents the most relevant pages.',
  primaryFocus: 'Query embedding, document retrieval, ranking, and LLM-powered answer generation.',
  inScope: ['Query embedding', 'Semantic search', 'Hybrid retrieval (BM25 + vectors)', 'Document ranking', 'RAG prompt assembly'],
  outOfScope: ['File conversion', 'Batch indexing', 'Document persistence'],
  color: 'green',
}

const documentStoreCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Database as unknown as ComponentType<any>,
  title: 'Document Store',
  subtitle: 'Persistent Storage',
  description: 'The Document Store is the central persistence layer where indexed Documents live. It is not a pipeline component but a database accessed by pipeline components. Haystack supports multiple backends with different capabilities.',
  details: 'Choose InMemoryDocumentStore for prototyping. For production, OpenSearchDocumentStore and ElasticsearchDocumentStore offer hybrid search (BM25 + vectors + metadata filtering). Vector-only stores like Chroma and Weaviate are suitable for pure embedding search.',
  analogy: 'Like the physical shelves of a library — where all the cataloged books are stored and retrieved from.',
  primaryFocus: 'Document persistence, vector indexing, keyword indexing, and metadata filtering.',
  inScope: ['Vector similarity search', 'BM25 keyword search', 'Metadata filtering', 'Duplicate policies (OVERWRITE, SKIP, FAIL)', 'Custom document schemas'],
  outOfScope: ['Text conversion', 'Embedding computation', 'Prompt templating'],
  color: 'mauve',
}

const customComponentCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: GitBranch as unknown as ComponentType<any>,
  title: 'Custom Components',
  subtitle: 'Extensibility Layer',
  description: 'Custom Components let you inject any Python logic into a Haystack pipeline. You define inputs, outputs, and the processing logic, then the framework handles serialization, type validation, and pipeline wiring.',
  details: 'A custom component requires the @component decorator, a run() method with typed inputs, and output type declarations. Use dataclasses.replace() for document mutations and copy.deepcopy() for nested structures. Components can be packaged and shared as integrations.',
  analogy: 'Like building a custom shelf unit for your library — you design it to fit your specific storage needs, then plug it into the existing cataloging system.',
  primaryFocus: 'Custom preprocessing, proprietary algorithms, external API integrations, and specialized ranking logic.',
  inScope: ['@component decorator pattern', 'Typed input/output sockets', 'Pipeline serialization compatibility', 'Component testing', 'Integration packaging'],
  outOfScope: ['Built-in component replacement', 'Document Store implementation', 'Pipeline orchestration'],
  color: 'peach',
}

export const HAYSTACK_TAXONOMY: TaxonomyCategory[] = [
  indexingPipelineCategory,
  queryPipelineCategory,
  documentStoreCategory,
  customComponentCategory,
]
