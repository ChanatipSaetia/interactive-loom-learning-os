import type { AbstractFlow } from '../../../sections/flowchart/abstract-flow/types';
import { ref } from '../../../sections/flowchart/abstract-flow/types';

/**
 * HAYSTACK INDEXING PIPELINE
 * Raw files → convert → chunk → embed → store
 */
export const indexingFlow: AbstractFlow = {
  actors: {
    dev_user: {
      title: 'Developer',
      desc: 'Initiates the indexing process with raw data files.',
    },
  },
  systems: {
    file_converter: {
      title: 'File Converter',
      desc: 'Converts PDF, HTML, Markdown, or other formats into Document objects.',
      type: 'aggregate',
    },
    text_splitter: {
      title: 'Text Splitter',
      desc: 'Breaks large documents into smaller, semantically coherent chunks.',
      type: 'aggregate',
    },
    doc_embedder: {
      title: 'Document Embedder',
      desc: 'Computes dense vector embeddings for each text chunk.',
      type: 'aggregate',
    },
    embedding_model: {
      title: 'Embedding Model',
      desc: 'External model (SentenceTransformers, OpenAI, etc.) that generates vector embeddings.',
      type: 'external',
    },
    doc_writer: {
      title: 'Document Writer',
      desc: 'Writes or overwrites documents into the Document Store.',
      type: 'aggregate',
    },
    doc_store: {
      title: 'Document Store',
      desc: 'Persistent database (OpenSearch, Elasticsearch, Chroma, etc.) storing indexed documents.',
      type: 'external',
    },
  },
  steps: [
    {
      type: 'linear',
      id: 'start_indexing',
      initiatedBy: ref('dev_user'),
      command: 'Start Indexing',
      policy: 'Trigger Conversion',
      handledBy: ref('file_converter'),
      resultEvents: [
        { id: 'files_loaded', title: 'Files Loaded', desc: 'Raw data files are available for processing.' },
      ],
      continuesAs: 'convert_files',
    },
    {
      type: 'linear',
      id: 'convert_files',
      policy: 'Trigger Conversion',
      command: 'Convert Files',
      handledBy: ref('file_converter'),
      resultEvents: [
        { id: 'docs_converted', title: 'Documents Converted', desc: 'Raw files transformed into structured Document objects.' },
      ],
      continuesAs: 'split_texts',
    },
    {
      type: 'linear',
      id: 'split_texts',
      policy: 'Trigger Splitting',
      command: 'Split Texts',
      handledBy: ref('text_splitter'),
      resultEvents: [
        { id: 'texts_chunked', title: 'Texts Chunked', desc: 'Documents split into smaller, searchable chunks.' },
      ],
      continuesAs: 'compute_embeddings',
    },
    {
      type: 'linear',
      id: 'compute_embeddings',
      policy: 'Trigger Embedding',
      command: 'Compute Embeddings',
      handledBy: ref('doc_embedder'),
      delegatesTo: ref('embedding_model'),
      resultEvents: [
        { id: 'embeddings_ready', title: 'Embeddings Computed', desc: 'Dense vectors attached to each document chunk.' },
      ],
      continuesAs: 'write_docs',
    },
    {
      type: 'linear',
      id: 'write_docs',
      policy: 'Trigger Write',
      command: 'Write Documents',
      handledBy: ref('doc_writer'),
      delegatesTo: ref('doc_store'),
      resultEvents: [
        { id: 'docs_indexed', title: 'Documents Indexed', desc: 'All documents stored and searchable in the Document Store.' },
      ],
    },
  ],
  journeys: [
    {
      id: 'indexing-flow',
      label: 'Indexing Pipeline',
      description: 'Raw files are converted, chunked, embedded, and stored.',
      steps: [
        { nodeId: 'start_indexing', description: 'Developer triggers indexing with raw files.' },
        { nodeId: 'files_loaded', description: 'Files loaded and ready for conversion.' },
        { nodeId: 'convert_files', description: 'Files parsed into structured Documents.', processGroup: 'execution' },
        { nodeId: 'docs_converted', description: 'Documents ready for chunking.' },
        { nodeId: 'split_texts', description: 'Documents chunked into smaller pieces.', processGroup: 'execution' },
        { nodeId: 'texts_chunked', description: 'Chunks ready for embedding.' },
        { nodeId: 'compute_embeddings', description: 'Dense vectors computed for each chunk.', processGroup: 'execution' },
        { nodeId: 'embeddings_ready', description: 'Embeddings ready for storage.' },
        { nodeId: 'write_docs', description: 'Documents persisted to Document Store.', processGroup: 'execution' },
        { nodeId: 'docs_indexed', description: 'All documents indexed and searchable.' },
      ],
    },
  ],
};

/**
 * HAYSTACK QUERY PIPELINE
 * Query → embed → retrieve → rank → RAG → answer
 */
export const queryFlow: AbstractFlow = {
  actors: {
    end_user: {
      title: 'End User',
      desc: 'Submits a natural-language query to the search system.',
    },
  },
  systems: {
    text_embedder: {
      title: 'Text Embedder',
      desc: 'Converts the user query into a dense vector for semantic search.',
      type: 'aggregate',
    },
    query_embedding_model: {
      title: 'Embedding Model',
      desc: 'External model that generates query embeddings.',
      type: 'external',
    },
    retriever: {
      title: 'Retriever',
      desc: 'Searches the Document Store for relevant documents.',
      type: 'aggregate',
    },
    doc_store: {
      title: 'Document Store',
      desc: 'Stores indexed documents for retrieval.',
      type: 'external',
    },
    ranker: {
      title: 'Ranker',
      desc: 'Re-ranks retrieved documents by relevance to the query.',
      type: 'aggregate',
    },
    prompt_builder: {
      title: 'Prompt Builder',
      desc: 'Assembles retrieved documents into an LLM prompt template.',
      type: 'aggregate',
    },
    llm_generator: {
      title: 'LLM Generator',
      desc: 'Generates the final answer from the prompt using an LLM.',
      type: 'aggregate',
    },
    llm_api: {
      title: 'LLM API',
      desc: 'External LLM service (OpenAI, Anthropic, etc.).',
      type: 'external',
    },
  },
  steps: [
    {
      type: 'linear',
      id: 'submit_query',
      initiatedBy: ref('end_user'),
      command: 'Submit Query',
      policy: 'Embed Query',
      handledBy: ref('text_embedder'),
      resultEvents: [
        { id: 'query_received', title: 'Query Received', desc: 'Natural-language question enters the system.' },
      ],
      continuesAs: 'embed_query',
    },
    {
      type: 'linear',
      id: 'embed_query',
      policy: 'Embed Query',
      command: 'Embed Query',
      handledBy: ref('text_embedder'),
      delegatesTo: ref('query_embedding_model'),
      resultEvents: [
        { id: 'query_embedded', title: 'Query Embedded', desc: 'Query converted to dense vector representation.' },
      ],
      continuesAs: 'retrieve',
    },
    {
      type: 'linear',
      id: 'retrieve',
      policy: 'Retrieve',
      command: 'Retrieve Documents',
      handledBy: ref('retriever'),
      delegatesTo: ref('doc_store'),
      resultEvents: [
        { id: 'docs_retrieved', title: 'Documents Retrieved', desc: 'Candidate documents fetched from Document Store.' },
      ],
      continuesAs: 'rank',
    },
    {
      type: 'linear',
      id: 'rank',
      policy: 'Rank',
      command: 'Rank Documents',
      handledBy: ref('ranker'),
      resultEvents: [
        { id: 'docs_ranked', title: 'Documents Ranked', desc: 'Documents sorted by relevance score.' },
      ],
      continuesAs: 'build_prompt',
    },
    {
      type: 'linear',
      id: 'build_prompt',
      policy: 'RAG Assembly',
      command: 'Build Prompt',
      handledBy: ref('prompt_builder'),
      resultEvents: [
        { id: 'prompt_ready', title: 'Prompt Assembled', desc: 'Context and query combined into LLM prompt.' },
      ],
      continuesAs: 'generate_answer',
    },
    {
      type: 'linear',
      id: 'generate_answer',
      policy: 'Generate',
      command: 'Generate Answer',
      handledBy: ref('llm_generator'),
      delegatesTo: ref('llm_api'),
      resultEvents: [
        { id: 'answer_generated', title: 'Answer Generated', desc: 'LLM produces final response.' },
      ],
    },
  ],
  journeys: [
    {
      id: 'rag-query',
      label: 'RAG Query Pipeline',
      description: 'Query is embedded, documents retrieved, ranked, and LLM generates answer.',
      steps: [
        { nodeId: 'submit_query', description: 'User submits a natural-language query.' },
        { nodeId: 'query_received', description: 'Query enters the system.' },
        { nodeId: 'embed_query', description: 'Query converted to dense vector.', processGroup: 'planning' },
        { nodeId: 'query_embedded', description: 'Vector embedding ready.' },
        { nodeId: 'retrieve', description: 'Relevant documents fetched from Document Store.', processGroup: 'execution' },
        { nodeId: 'docs_retrieved', description: 'Candidate documents retrieved.' },
        { nodeId: 'rank', description: 'Documents re-ranked by relevance.', processGroup: 'evaluation' },
        { nodeId: 'docs_ranked', description: 'Documents sorted by relevance score.' },
        { nodeId: 'build_prompt', description: 'Retrieved documents assembled into prompt context.', processGroup: 'planning' },
        { nodeId: 'prompt_ready', description: 'Prompt ready for LLM.' },
        { nodeId: 'generate_answer', description: 'LLM generates final answer from context.', processGroup: 'execution' },
        { nodeId: 'answer_generated', description: 'Final response returned to user.' },
      ],
    },
    {
      id: 'simple-retrieval',
      label: 'Simple Retrieval (No LLM)',
      description: 'Query is embedded and documents retrieved directly without RAG.',
      steps: [
        { nodeId: 'embed_query', description: 'Query converted to dense vector.', processGroup: 'planning' },
        { nodeId: 'query_embedded', description: 'Vector embedding ready.' },
        { nodeId: 'retrieve', description: 'Documents returned directly from Document Store.', processGroup: 'execution' },
        { nodeId: 'docs_retrieved', description: 'Documents returned to user.' },
      ],
    },
  ],
};
