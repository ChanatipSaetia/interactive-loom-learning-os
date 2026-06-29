import { TYPES } from '../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../sections/flowchart'

/**
 * HAYSTACK INDEXING PIPELINE SCHEMA
 *
 * Shows how raw files are converted, chunked, embedded, and written to a Document Store.
 */
export const indexingSchema: UnifiedFlowchartSchema = {
  entities: {
    // Actors
    'dev_user': {
      title: 'Developer',
      desc: 'Initiates the indexing process with raw data files.',
      type: TYPES.USER,
    },

    // Aggregates
    'file_converter': {
      title: 'File Converter',
      desc: 'Converts PDF, HTML, Markdown, or other formats into Document objects.',
      type: TYPES.AGGREGATE,
    },
    'text_splitter': {
      title: 'Text Splitter',
      desc: 'Breaks large documents into smaller, semantically coherent chunks.',
      type: TYPES.AGGREGATE,
    },
    'doc_embedder': {
      title: 'Document Embedder',
      desc: 'Computes dense vector embeddings for each text chunk.',
      type: TYPES.AGGREGATE,
    },
    'doc_writer': {
      title: 'Document Writer',
      desc: 'Writes or overwrites documents into the Document Store.',
      type: TYPES.AGGREGATE,
    },

    // Externals
    'embedding_model': {
      title: 'Embedding Model',
      desc: 'External model (SentenceTransformers, OpenAI, etc.) that generates vector embeddings.',
      type: TYPES.EXTERNAL,
    },
    'doc_store': {
      title: 'Document Store',
      desc: 'Persistent database (OpenSearch, Elasticsearch, Chroma, etc.) storing indexed documents.',
      type: TYPES.EXTERNAL,
    },

    // Commands
    'cmd_start_indexing': {
      title: 'Start Indexing',
      desc: 'Trigger the indexing pipeline with a batch of raw files.',
      type: TYPES.COMMAND,
      root: true,
    },
    'cmd_convert_files': {
      title: 'Convert Files',
      desc: 'Parse raw files into structured Document objects.',
      type: TYPES.COMMAND,
    },
    'cmd_split_texts': {
      title: 'Split Texts',
      desc: 'Chunk documents into smaller pieces for better retrieval granularity.',
      type: TYPES.COMMAND,
    },
    'cmd_compute_embeddings': {
      title: 'Compute Embeddings',
      desc: 'Generate dense vectors for each text chunk.',
      type: TYPES.COMMAND,
    },
    'cmd_write_docs': {
      title: 'Write Documents',
      desc: 'Persist documents with embeddings to the Document Store.',
      type: TYPES.COMMAND,
    },

    // Events
    'evt_files_loaded': {
      title: 'Files Loaded',
      desc: 'Raw data files are available for processing.',
      type: TYPES.EVENT,
    },
    'evt_docs_converted': {
      title: 'Documents Converted',
      desc: 'Raw files transformed into structured Document objects.',
      type: TYPES.EVENT,
    },
    'evt_texts_chunked': {
      title: 'Texts Chunked',
      desc: 'Documents split into smaller, searchable chunks.',
      type: TYPES.EVENT,
    },
    'evt_embeddings_ready': {
      title: 'Embeddings Computed',
      desc: 'Dense vectors attached to each document chunk.',
      type: TYPES.EVENT,
    },
    'evt_docs_indexed': {
      title: 'Documents Indexed',
      desc: 'All documents stored and searchable in the Document Store.',
      type: TYPES.EVENT,
    },

    // Policies
    'pol_convert': {
      title: 'Trigger Conversion',
      desc: 'When files are loaded, parse them into Documents.',
      type: TYPES.POLICY,
    },
    'pol_split': {
      title: 'Trigger Splitting',
      desc: 'When documents are converted, chunk them for retrieval.',
      type: TYPES.POLICY,
    },
    'pol_embed': {
      title: 'Trigger Embedding',
      desc: 'When chunks are ready, compute dense vectors.',
      type: TYPES.POLICY,
    },
    'pol_write': {
      title: 'Trigger Write',
      desc: 'When embeddings are ready, persist to Document Store.',
      type: TYPES.POLICY,
    },
  },
  relations: [
    // Start
    { id: 'r1', from: 'dev_user', to: 'cmd_start_indexing', views: ['EVENT_STORMING'] },
    { id: 'r2', from: 'cmd_start_indexing', to: 'file_converter', handledBy: true, views: ['EVENT_STORMING'] },

    // Conversion
    { id: 'r3', from: 'file_converter', to: 'evt_files_loaded', views: ['EVENT_STORMING'] },
    { id: 'r4', from: 'evt_files_loaded', to: 'pol_convert', views: ['EVENT_STORMING'] },
    { id: 'r5', from: 'pol_convert', to: 'cmd_convert_files', views: ['EVENT_STORMING'] },
    { id: 'r6', from: 'cmd_convert_files', to: 'file_converter', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r7', from: 'file_converter', to: 'evt_docs_converted', views: ['EVENT_STORMING'] },

    // Splitting
    { id: 'r8', from: 'evt_docs_converted', to: 'pol_split', views: ['EVENT_STORMING'] },
    { id: 'r9', from: 'pol_split', to: 'cmd_split_texts', views: ['EVENT_STORMING'] },
    { id: 'r10', from: 'cmd_split_texts', to: 'text_splitter', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r11', from: 'text_splitter', to: 'evt_texts_chunked', views: ['EVENT_STORMING'] },

    // Embedding
    { id: 'r12', from: 'evt_texts_chunked', to: 'pol_embed', views: ['EVENT_STORMING'] },
    { id: 'r13', from: 'pol_embed', to: 'cmd_compute_embeddings', views: ['EVENT_STORMING'] },
    { id: 'r14', from: 'cmd_compute_embeddings', to: 'doc_embedder', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r15', from: 'doc_embedder', to: 'embedding_model', views: ['EVENT_STORMING'] },
    { id: 'r16', from: 'embedding_model', to: 'evt_embeddings_ready', views: ['EVENT_STORMING'] },

    // Writing
    { id: 'r17', from: 'evt_embeddings_ready', to: 'pol_write', views: ['EVENT_STORMING'] },
    { id: 'r18', from: 'pol_write', to: 'cmd_write_docs', views: ['EVENT_STORMING'] },
    { id: 'r19', from: 'cmd_write_docs', to: 'doc_writer', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r20', from: 'doc_writer', to: 'doc_store', views: ['EVENT_STORMING'] },
    { id: 'r21', from: 'doc_store', to: 'evt_docs_indexed', views: ['EVENT_STORMING'] },
  ],
  journeys: [
    {
      id: 'indexing-flow',
      label: 'Indexing Pipeline',
      description: 'Raw files are converted, chunked, embedded, and stored.',
      steps: [
        { nodeIds: ['dev_user', 'cmd_start_indexing', 'file_converter', 'evt_files_loaded'], description: 'Developer triggers indexing with raw files.' },
        { nodeIds: ['pol_convert', 'cmd_convert_files', 'evt_docs_converted'], description: 'Files parsed into structured Documents.', processGroup: 'execution' },
        { nodeIds: ['pol_split', 'cmd_split_texts', 'text_splitter', 'evt_texts_chunked'], description: 'Documents chunked into smaller pieces.', processGroup: 'execution' },
        { nodeIds: ['pol_embed', 'cmd_compute_embeddings', 'doc_embedder', 'embedding_model', 'evt_embeddings_ready'], description: 'Dense vectors computed for each chunk.', processGroup: 'execution' },
        { nodeIds: ['pol_write', 'cmd_write_docs', 'doc_writer', 'doc_store', 'evt_docs_indexed'], description: 'Documents persisted to Document Store.', processGroup: 'execution' },
      ],
    },
  ],
}

/**
 * HAYSTACK QUERY PIPELINE SCHEMA
 *
 * Shows how a user query is embedded, retrieved, ranked, and answered.
 */
export const querySchema: UnifiedFlowchartSchema = {
  entities: {
    // Actors
    'end_user': {
      title: 'End User',
      desc: 'Submits a natural-language query to the search system.',
      type: TYPES.USER,
    },

    // Aggregates
    'text_embedder': {
      title: 'Text Embedder',
      desc: 'Converts the user query into a dense vector for semantic search.',
      type: TYPES.AGGREGATE,
    },
    'retriever': {
      title: 'Retriever',
      desc: 'Searches the Document Store for relevant documents.',
      type: TYPES.AGGREGATE,
    },
    'ranker': {
      title: 'Ranker',
      desc: 'Re-ranks retrieved documents by relevance to the query.',
      type: TYPES.AGGREGATE,
    },
    'prompt_builder': {
      title: 'Prompt Builder',
      desc: 'Assembles retrieved documents into an LLM prompt template.',
      type: TYPES.AGGREGATE,
    },
    'llm_generator': {
      title: 'LLM Generator',
      desc: 'Generates the final answer from the prompt using an LLM.',
      type: TYPES.AGGREGATE,
    },

    // Externals
    'query_embedding_model': {
      title: 'Embedding Model',
      desc: 'External model that generates query embeddings.',
      type: TYPES.EXTERNAL,
    },
    'doc_store_q': {
      title: 'Document Store',
      desc: 'Stores indexed documents for retrieval.',
      type: TYPES.EXTERNAL,
    },
    'llm_api': {
      title: 'LLM API',
      desc: 'External LLM service (OpenAI, Anthropic, etc.).',
      type: TYPES.EXTERNAL,
    },

    // Commands
    'cmd_submit_query': {
      title: 'Submit Query',
      desc: 'User submits a natural-language question.',
      type: TYPES.COMMAND,
      root: true,
    },
    'cmd_embed_query': {
      title: 'Embed Query',
      desc: 'Convert user query into a dense vector.',
      type: TYPES.COMMAND,
    },
    'cmd_retrieve': {
      title: 'Retrieve Documents',
      desc: 'Search Document Store for relevant documents.',
      type: TYPES.COMMAND,
    },
    'cmd_rank': {
      title: 'Rank Documents',
      desc: 'Re-rank documents by relevance to the query.',
      type: TYPES.COMMAND,
    },
    'cmd_build_prompt': {
      title: 'Build Prompt',
      desc: 'Assemble retrieved documents into prompt context.',
      type: TYPES.COMMAND,
    },
    'cmd_generate_answer': {
      title: 'Generate Answer',
      desc: 'Invoke LLM to produce the final answer.',
      type: TYPES.COMMAND,
    },

    // Events
    'evt_query_received': {
      title: 'Query Received',
      desc: 'Natural-language question enters the system.',
      type: TYPES.EVENT,
    },
    'evt_query_embedded': {
      title: 'Query Embedded',
      desc: 'Query converted to dense vector representation.',
      type: TYPES.EVENT,
    },
    'evt_docs_retrieved': {
      title: 'Documents Retrieved',
      desc: 'Candidate documents fetched from Document Store.',
      type: TYPES.EVENT,
    },
    'evt_docs_ranked': {
      title: 'Documents Ranked',
      desc: 'Documents sorted by relevance score.',
      type: TYPES.EVENT,
    },
    'evt_prompt_ready': {
      title: 'Prompt Assembled',
      desc: 'Context and query combined into LLM prompt.',
      type: TYPES.EVENT,
    },
    'evt_answer_generated': {
      title: 'Answer Generated',
      desc: 'LLM produces final response.',
      type: TYPES.EVENT,
    },

    // Policies
    'pol_embed_query': {
      title: 'Embed Query',
      desc: 'When query is received, compute its vector embedding.',
      type: TYPES.POLICY,
    },
    'pol_retrieve': {
      title: 'Retrieve',
      desc: 'When query is embedded, search the Document Store.',
      type: TYPES.POLICY,
    },
    'pol_rank': {
      title: 'Rank',
      desc: 'When documents are retrieved, re-rank by relevance.',
      type: TYPES.POLICY,
    },
    'pol_rag': {
      title: 'RAG Assembly',
      desc: 'When documents are ranked, build the prompt context.',
      type: TYPES.POLICY,
    },
    'pol_generate': {
      title: 'Generate',
      desc: 'When prompt is ready, invoke LLM for answer.',
      type: TYPES.POLICY,
    },
  },
  relations: [
    // Start
    { id: 'q1', from: 'end_user', to: 'cmd_submit_query', views: ['EVENT_STORMING'] },
    { id: 'q2', from: 'cmd_submit_query', to: 'text_embedder', handledBy: true, views: ['EVENT_STORMING'] },

    // Embedding
    { id: 'q3', from: 'text_embedder', to: 'evt_query_received', views: ['EVENT_STORMING'] },
    { id: 'q4', from: 'evt_query_received', to: 'pol_embed_query', views: ['EVENT_STORMING'] },
    { id: 'q5', from: 'pol_embed_query', to: 'cmd_embed_query', views: ['EVENT_STORMING'] },
    { id: 'q6', from: 'cmd_embed_query', to: 'text_embedder', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'q7', from: 'text_embedder', to: 'query_embedding_model', views: ['EVENT_STORMING'] },
    { id: 'q8', from: 'query_embedding_model', to: 'evt_query_embedded', views: ['EVENT_STORMING'] },

    // Retrieval
    { id: 'q9', from: 'evt_query_embedded', to: 'pol_retrieve', views: ['EVENT_STORMING'] },
    { id: 'q10', from: 'pol_retrieve', to: 'cmd_retrieve', views: ['EVENT_STORMING'] },
    { id: 'q11', from: 'cmd_retrieve', to: 'retriever', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'q12', from: 'retriever', to: 'doc_store_q', views: ['EVENT_STORMING'] },
    { id: 'q13', from: 'doc_store_q', to: 'evt_docs_retrieved', views: ['EVENT_STORMING'] },

    // Ranking
    { id: 'q14', from: 'evt_docs_retrieved', to: 'pol_rank', views: ['EVENT_STORMING'] },
    { id: 'q15', from: 'pol_rank', to: 'cmd_rank', views: ['EVENT_STORMING'] },
    { id: 'q16', from: 'cmd_rank', to: 'ranker', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'q17', from: 'ranker', to: 'evt_docs_ranked', views: ['EVENT_STORMING'] },

    // Prompt Building
    { id: 'q18', from: 'evt_docs_ranked', to: 'pol_rag', views: ['EVENT_STORMING'] },
    { id: 'q19', from: 'pol_rag', to: 'cmd_build_prompt', views: ['EVENT_STORMING'] },
    { id: 'q20', from: 'cmd_build_prompt', to: 'prompt_builder', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'q21', from: 'prompt_builder', to: 'evt_prompt_ready', views: ['EVENT_STORMING'] },

    // LLM Generation
    { id: 'q22', from: 'evt_prompt_ready', to: 'pol_generate', views: ['EVENT_STORMING'] },
    { id: 'q23', from: 'pol_generate', to: 'cmd_generate_answer', views: ['EVENT_STORMING'] },
    { id: 'q24', from: 'cmd_generate_answer', to: 'llm_generator', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'q25', from: 'llm_generator', to: 'llm_api', views: ['EVENT_STORMING'] },
    { id: 'q26', from: 'llm_api', to: 'evt_answer_generated', views: ['EVENT_STORMING'] },
  ],
  journeys: [
    {
      id: 'rag-query',
      label: 'RAG Query Pipeline',
      description: 'Query is embedded, documents retrieved, ranked, and LLM generates answer.',
      steps: [
        { nodeIds: ['end_user', 'cmd_submit_query', 'text_embedder', 'evt_query_received'], description: 'User submits a natural-language query.' },
        { nodeIds: ['pol_embed_query', 'cmd_embed_query', 'query_embedding_model', 'evt_query_embedded'], description: 'Query converted to dense vector.', processGroup: 'planning' },
        { nodeIds: ['pol_retrieve', 'cmd_retrieve', 'retriever', 'doc_store_q', 'evt_docs_retrieved'], description: 'Relevant documents fetched from Document Store.', processGroup: 'execution' },
        { nodeIds: ['pol_rank', 'cmd_rank', 'ranker', 'evt_docs_ranked'], description: 'Documents re-ranked by relevance.', processGroup: 'evaluation' },
        { nodeIds: ['pol_rag', 'cmd_build_prompt', 'prompt_builder', 'evt_prompt_ready'], description: 'Retrieved documents assembled into prompt context.', processGroup: 'planning' },
        { nodeIds: ['pol_generate', 'cmd_generate_answer', 'llm_generator', 'llm_api', 'evt_answer_generated'], description: 'LLM generates final answer from context.', processGroup: 'execution' },
      ],
    },
    {
      id: 'simple-retrieval',
      label: 'Simple Retrieval (No LLM)',
      description: 'Query is embedded and documents retrieved directly without RAG.',
      steps: [
        { nodeIds: ['pol_embed_query', 'cmd_embed_query', 'query_embedding_model', 'evt_query_embedded'], description: 'Query converted to dense vector.', processGroup: 'planning' },
        { nodeIds: ['pol_retrieve', 'cmd_retrieve', 'retriever', 'doc_store_q', 'evt_docs_retrieved'], description: 'Documents returned directly from Document Store.', processGroup: 'execution' },
      ],
    },
  ],
}
