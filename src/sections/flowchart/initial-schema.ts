import type { UnifiedFlowchartSchema } from './types';
import { TYPES } from './types';

export const INITIAL_SCHEMA: UnifiedFlowchartSchema = {
  entities: {
    'user_editor': { title: 'Content Editor', desc: 'Provides input.', type: TYPES.USER },
    'user_reviewer': { title: 'Reviewer', desc: 'Human-in-the-loop QA.', type: TYPES.USER },
    'db_os': { title: 'OpenSearch DB', desc: 'Search cluster.', type: TYPES.DATABASE },
    'api_emb': { title: 'Embedding API', desc: 'External LLM service.', type: TYPES.EXTERNAL },
    'sys_worker': { title: 'Conversion Worker', desc: 'Async parser.', type: TYPES.AGGREGATE },
    'sys_gw': { title: 'API Gateway', desc: 'Secure entry point.', type: TYPES.AGGREGATE },
    'db_s3': { title: 'S3 Raw Storage', desc: 'Immutable blob storage.', type: TYPES.DATABASE },
    'sys_portal': { title: 'Review Portal UI', desc: 'Frontend for QA.', type: TYPES.READ_MODEL },
    'cmd_up': { title: 'Upload Document', desc: 'Ingest new file.', type: TYPES.COMMAND },
    'cmd_md': { title: 'Convert to Markdown', desc: 'Parse binary to text.', type: TYPES.COMMAND },
    'cmd_fix': { title: 'Fix Formatting', desc: 'Manual override.', type: TYPES.COMMAND },
    'cmd_reject': { title: 'Reject Document', desc: 'Abandon document.', type: TYPES.COMMAND },
    'dec_qa': { title: 'Quality Routing', desc: 'Confidence check.', type: TYPES.POLICY },
    'data_pdf': { title: 'Raw PDF', desc: 'Binary payload.', type: TYPES.READ_MODEL },
    'data_raw_md': { title: 'Unstructured MD', desc: 'Messy OCR output.', type: TYPES.READ_MODEL },
    'data_clean_md': { title: 'Clean Markdown', desc: 'Validated chunks.', type: TYPES.READ_MODEL },
    'data_vec': { title: 'Float32 Arrays', desc: 'Embeddings.', type: TYPES.READ_MODEL },
    'agg_pipe': { title: 'Doc Pipeline', desc: 'State machine.', type: TYPES.AGGREGATE },
    'evt_up': { title: 'Document Uploaded', desc: 'File secured.', type: TYPES.EVENT },
    'pol_conv': { title: 'Trigger Conversion', desc: 'Queue conversion.', type: TYPES.POLICY },
    'evt_md': { title: 'Markdown Converted', desc: 'Text string returned.', type: TYPES.EVENT },
    'pol_pass': { title: 'Score > 90%', desc: 'Auto-approve high quality.', type: TYPES.POLICY },
    'pol_fail': { title: 'Score < 90%', desc: 'Flag for human intervention.', type: TYPES.POLICY },
    'evt_app': { title: 'Markdown Approved', desc: 'Text is ready.', type: TYPES.EVENT },
    'evt_rejected': { title: 'Document Rejected', desc: 'Document discarded.', type: TYPES.EVENT },
    'pol_notify': { title: 'Notify Uploader', desc: 'Send failure email.', type: TYPES.POLICY },
    'pol_emb': { title: 'Trigger Embedding', desc: 'Trigger embedding.', type: TYPES.POLICY },
    'cmd_req_emb': { title: 'Request Embeddings', desc: 'Call external LLM.', type: TYPES.COMMAND },
    'evt_vec': { title: 'Embeddings Generated', desc: 'Arrays received.', type: TYPES.EVENT },
    'pol_db': { title: 'Trigger DB Save', desc: 'Save to database.', type: TYPES.POLICY },
    'cmd_os': { title: 'Index Document', desc: 'Write to OpenSearch.', type: TYPES.COMMAND },
    'evt_idx': { title: 'Document Indexed', desc: 'Data is searchable.', type: TYPES.EVENT },
    'risk_tbl': { title: 'Lost Tables?', desc: 'Grids parse as garbage.', type: TYPES.HOTSPOT }
  },
  relations: [
    { id: 'r1', from: 'user_editor', to: 'cmd_up' },
    { id: 'r6', from: 'cmd_up', to: 'agg_pipe' },
    { id: 'r7', from: 'agg_pipe', to: 'evt_up' },
    { id: 'r8', from: 'evt_up', to: 'pol_conv' },
    { id: 'r9', from: 'pol_conv', to: 'cmd_md' },
    { id: 'r11', from: 'cmd_md', to: 'evt_md' },
    { id: 'r12', from: 'evt_md', to: 'pol_pass' },
    { id: 'r13', from: 'evt_md', to: 'pol_fail' },
    { id: 'r14', from: 'pol_pass', to: 'evt_app' },
    { id: 'r15', from: 'pol_fail', to: 'risk_tbl', dashed: true },
    { id: 'r16', from: 'pol_fail', to: 'cmd_fix' },
    { id: 'r17', from: 'pol_fail', to: 'cmd_reject' },
    { id: 'r18', from: 'user_reviewer', to: 'cmd_fix' },
    { id: 'r19', from: 'cmd_fix', to: 'evt_app' },
    { id: 'r20', from: 'cmd_reject', to: 'evt_rejected' },
    { id: 'r21', from: 'evt_rejected', to: 'pol_notify' },
    { id: 'r22', from: 'evt_app', to: 'pol_emb' },
    { id: 'r23', from: 'pol_emb', to: 'cmd_req_emb' },
    { id: 'r24', from: 'cmd_req_emb', to: 'api_emb' },
    { id: 'r25', from: 'api_emb', to: 'evt_vec' },
    { id: 'r26', from: 'evt_vec', to: 'pol_db' },
    { id: 'r27', from: 'pol_db', to: 'cmd_os' },
    { id: 'r28', from: 'cmd_os', to: 'db_os' },
    { id: 'r29', from: 'db_os', to: 'evt_idx' },
    { id: 'r30', from: 'evt_idx', to: 'sys_portal' }
  ],
  views: {
    EVENT_STORMING: {
      name: 'Event Storming',
      icon: 'Component',
      nodes: [
        { id: 'user_editor', grid: [0, 2] },
        { id: 'cmd_up', grid: [1, 2] },
        { id: 'agg_pipe', grid: [2, 2] },
        { id: 'evt_up', grid: [3, 2] },
        { id: 'pol_conv', grid: [4, 2] },
        { id: 'cmd_md', grid: [5, 2] },
        { id: 'evt_md', grid: [6, 2] },
        { id: 'pol_pass', grid: [7, 1] },
        { id: 'pol_fail', grid: [7, 3] },
        { id: 'risk_tbl', grid: [8, 4] },
        { id: 'cmd_fix', grid: [8, 2] },
        { id: 'cmd_reject', grid: [8, 3] },
        { id: 'user_reviewer', grid: [9, 1] },
        { id: 'evt_app', grid: [9, 2] },
        { id: 'evt_rejected', grid: [9, 3] },
        { id: 'pol_notify', grid: [10, 3] },
        { id: 'pol_emb', grid: [10, 2] },
        { id: 'cmd_req_emb', grid: [11, 2] },
        { id: 'api_emb', grid: [12, 2] },
        { id: 'evt_vec', grid: [13, 2] },
        { id: 'pol_db', grid: [14, 2] },
        { id: 'cmd_os', grid: [15, 2] },
        { id: 'db_os', grid: [16, 2] },
        { id: 'evt_idx', grid: [17, 2] },
        { id: 'sys_portal', grid: [18, 2] }
      ],
      groups: [
        { id: 'g1', title: 'Ingestion Subdomain', desc: 'Handles secure file uploads and initial storage state before processing.', nodeIds: ['user_editor', 'cmd_up', 'agg_pipe', 'evt_up'], color: 'rgba(140, 170, 238, 0.12)', borderColor: 'var(--ctp-blue)', textColor: 'var(--ctp-text)' },
        { id: 'g2', title: 'Quality Assurance & Routing', desc: 'Evaluates structural integrity of the parsed markdown and loops in humans for anomaly correction.', nodeIds: ['pol_pass', 'pol_fail', 'user_reviewer', 'cmd_fix', 'cmd_reject', 'risk_tbl', 'evt_rejected', 'pol_notify'], color: 'rgba(229, 200, 144, 0.12)', borderColor: 'var(--ctp-yellow)', textColor: 'var(--ctp-text)' },
        { id: 'g3', title: 'Vectorization Infrastructure', desc: 'Manages API interactions for AI embeddings and final persistence to OpenSearch clusters.', nodeIds: ['pol_emb', 'cmd_req_emb', 'api_emb', 'evt_vec', 'pol_db', 'cmd_os', 'db_os', 'evt_idx', 'sys_portal'], color: 'rgba(244, 184, 228, 0.12)', borderColor: 'var(--ctp-pink)', textColor: 'var(--ctp-text)' }
      ]
    }
  },
  journeys: [
    {
      id: 'happy-path',
      label: 'Document Ingest Happy Path',
      description: 'Follow a document as it is uploaded, converted, validated, and indexed with a high confidence score.',
      steps: [
        { nodeIds: ['user_editor', 'cmd_up', 'agg_pipe', 'evt_up'], description: 'Ingestion Stack — Content Editor uploads PDF → Upload Command triggered → Pipeline initiated → Document Uploaded event published.', processGroup: 'planning' },
        { nodeIds: ['pol_conv', 'cmd_md', 'evt_md'], description: 'Conversion Stack — Policy fires → Async Worker converts → Markdown produced → Markdown Converted event published.', processGroup: 'execution' },
        { nodeIds: ['pol_pass', 'evt_app'], description: 'Quality Check (Pass) — Score >90%, auto-approve → Markdown Approved event published.', processGroup: 'execution' },
        { nodeIds: ['pol_emb', 'cmd_req_emb', 'api_emb', 'evt_vec'], description: 'Vectorization Stack — Policy fires → Embedding API called → LLM generates vectors → Embeddings Generated.', processGroup: 'execution' },
        { nodeIds: ['pol_db', 'cmd_os', 'db_os', 'evt_idx', 'sys_portal'], description: 'Indexing Stack — Policy routes to DB → Index command formats data → Written to OpenSearch → Document available on Portal.', processGroup: 'evaluation' },
      ]
    },
    {
      id: 'recovery-path',
      label: 'Manual Review & Recovery Path',
      description: 'What happens when parsing quality drops below confidence thresholds and requires a human review.',
      steps: [
        { nodeIds: ['user_editor', 'cmd_up', 'evt_md'], description: 'Ingestion → Conversion — Scanned document uploaded, Worker processes messy structure, produces low-quality markdown.', processGroup: 'planning' },
        { nodeIds: ['pol_fail', 'risk_tbl'], description: 'Quality Check (Fail) — Score <90%, auto-approval halted. Hotspot: PDF table columns parsed as garbage.', processGroup: 'execution' },
        { nodeIds: ['user_reviewer', 'cmd_fix'], description: 'Human Review — Reviewer notified, manually fixes layout formats.', processGroup: 'execution' },
        { nodeIds: ['evt_app', 'api_emb', 'db_os'], description: 'Recovery Complete — Markdown Approved → Vectors generated → Saved to OpenSearch.', processGroup: 'evaluation' },
      ]
    }
  ]
};
