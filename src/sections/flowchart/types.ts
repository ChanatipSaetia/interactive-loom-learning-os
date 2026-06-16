import * as Icons from 'lucide-react';

const Component = Icons.Component;
const Server = Icons.Server;
const Share2 = Icons.Share2;
const Layers = Icons.Layers;

export const TYPES = {
  EVENT: 'Event', COMMAND: 'Command', AGGREGATE: 'Aggregate', POLICY: 'Policy', 
  READ_MODEL: 'Read Model', USER: 'Actor', EXTERNAL: 'External API', HOTSPOT: 'Risk',
  SERVICE: 'Service', DATABASE: 'Database', PROCESS: 'Process', 
  DATA_OBJECT: 'Data Object', DECISION: 'Decision'
} as const;

export const COLORS = {
  [TYPES.EVENT]:       '#64575f', // surface0 + peach
  [TYPES.COMMAND]:     '#505977', // surface0 + blue
  [TYPES.AGGREGATE]:   '#51576d', // surface1 (neutral)
  [TYPES.POLICY]:      '#5c5775', // surface0 + mauve
  [TYPES.READ_MODEL]:  '#595c77', // surface0 + lavender
  [TYPES.USER]:        '#625f64', // surface0 + yellow
  [TYPES.EXTERNAL]:    '#556163', // surface0 + green
  [TYPES.HOTSPOT]:     '#625162', // surface0 + red
  [TYPES.SERVICE]:     '#4f5e73', // surface0 + sapphire
  [TYPES.DATABASE]:    '#4e5f6d', // surface0 + teal
  [TYPES.PROCESS]:     '#536173', // surface0 + sky
  [TYPES.DATA_OBJECT]: '#655c75', // surface0 + pink
  [TYPES.DECISION]:    '#635666', // surface0 + maroon
  default:             '#414559'  // surface0
} as const;

export const BORDER_COLORS = {
  [TYPES.EVENT]:       '#ef9f76', // peach
  [TYPES.COMMAND]:     '#8caaee', // blue
  [TYPES.AGGREGATE]:   '#626880', // surface2
  [TYPES.POLICY]:      '#ca9ee6', // mauve
  [TYPES.READ_MODEL]:  '#babbf1', // lavender
  [TYPES.USER]:        '#e5c890', // yellow
  [TYPES.EXTERNAL]:    '#a6d189', // green
  [TYPES.HOTSPOT]:     '#e78284', // red
  [TYPES.SERVICE]:     '#85c1dc', // sapphire
  [TYPES.DATABASE]:    '#81c8be', // teal
  [TYPES.PROCESS]:     '#99d1db', // sky
  [TYPES.DATA_OBJECT]: '#f4b8e4', // pink
  [TYPES.DECISION]:    '#ea999c', // maroon
  default:             '#626880'  // surface2
} as const;

export const ICONS = {
  [TYPES.EVENT]: 'Zap', [TYPES.COMMAND]: 'Terminal', [TYPES.AGGREGATE]: 'Database', 
  [TYPES.POLICY]: 'ShieldAlert', [TYPES.READ_MODEL]: 'Eye', [TYPES.USER]: 'User', 
  [TYPES.EXTERNAL]: 'Cloud', [TYPES.HOTSPOT]: 'AlertTriangle', [TYPES.SERVICE]: 'Server',
  [TYPES.DATABASE]: 'Database', [TYPES.PROCESS]: 'Activity', [TYPES.DATA_OBJECT]: 'FileText',
  [TYPES.DECISION]: 'GitBranch'
} as const;

export const ICON_ANIMATIONS = {
  [TYPES.EVENT]: 'anim-icon-zap', [TYPES.COMMAND]: 'anim-icon-blink', [TYPES.AGGREGATE]: 'anim-icon-float-heavy',
  [TYPES.POLICY]: 'anim-icon-pulse', [TYPES.READ_MODEL]: 'anim-icon-scan', [TYPES.USER]: 'anim-icon-wobble',
  [TYPES.EXTERNAL]: 'anim-icon-drift', [TYPES.HOTSPOT]: 'anim-icon-ring', [TYPES.SERVICE]: 'anim-icon-float-heavy',
  [TYPES.DATABASE]: 'anim-icon-pulse', [TYPES.PROCESS]: 'anim-icon-spin-slow', [TYPES.DATA_OBJECT]: 'anim-icon-float',
  [TYPES.DECISION]: 'anim-icon-wobble'
} as const;

export const DYNAMIC_ICONS = { Component, Server, Share2, Layers };

export const NODE_W = 140; 
export const NODE_H = 100;

export interface FlowchartEntity {
  title: string;
  /** Per-view title override — falls back to `title` when absent. */
  viewTitles?: Record<string, string>;
  desc: string;
  viewTypes: Record<string, string>;
  /** Maps this fine-grained entity to a collapsed/high-level entity ID in other views. */
  collapsedTo?: string;
}

export interface FlowchartRelation {
  id: string;
  from: string;
  to: string;
  views: string[];
  dashed?: boolean;
  handledBy?: boolean;
  label?: string;
}

export interface FlowchartViewNode {
  id: string;
  x?: number;
  y?: number;
  grid?: [number, number];
}

export interface FlowchartViewGroup {
  id: string;
  title: string;
  desc?: string;
  nodeIds?: string[];
  color?: string;
  borderColor?: string;
  textColor?: string;
  isLane?: boolean;
  row?: number;
  y?: number;
  h?: number;
}

export interface FlowchartStep {
  nodeId?: string;
  nodeIds?: string[];
  description: string;
}

export interface FlowchartStepLinear {
  id: string;
  type: 'linear';
  nodeIds?: string[];
  title: string;
  reason: string;
}

export interface FlowchartStepBranchOption {
  id: string;
  type: string;
  nodeIds?: string[];
  title: string;
  reason: string;
}

export interface FlowchartStepBranch {
  id: string;
  type: 'branch';
  branches: FlowchartStepBranchOption[];
}

export type FlowchartStepData = FlowchartStepLinear | FlowchartStepBranch;

export interface FlowchartJourney {
  id: string;
  label: string;
  description?: string;
  steps: FlowchartStep[];
}

export interface FlowchartViewConfig {
  name: string;
  icon: string;
  nodes: FlowchartViewNode[];
  groups: FlowchartViewGroup[];
  steps?: FlowchartStepData[];
}

export interface UnifiedFlowchartSchema {
  entities: Record<string, FlowchartEntity>;
  relations: FlowchartRelation[];
  views: Record<string, FlowchartViewConfig>;
  journeys: FlowchartJourney[];
}

export interface FlowchartProps {
  title?: string;
  schema?: UnifiedFlowchartSchema;
}

export interface TransformState {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface PinchState {
  active: boolean;
  initialDist: number;
  initialScale: number;
}

export function wrapTooltipText(text: string, maxChars = 28): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export const INITIAL_SCHEMA: UnifiedFlowchartSchema = {
  entities: {
    'user_editor': { title: 'Content Editor', desc: 'Provides input.', viewTypes: { EVENT_STORMING: TYPES.USER, SYS_ARCH: TYPES.USER, SWIMLANES: TYPES.USER } },
    'user_reviewer': { title: 'Reviewer', desc: 'Human-in-the-loop QA.', viewTypes: { EVENT_STORMING: TYPES.USER, SWIMLANES: TYPES.USER } },
    'db_os': { title: 'OpenSearch DB', desc: 'Search cluster.', viewTypes: { EVENT_STORMING: TYPES.EXTERNAL, SYS_ARCH: TYPES.DATABASE, DATA_FLOW: TYPES.DATABASE, SWIMLANES: TYPES.DATABASE } },
    'api_emb': { title: 'Embedding API', desc: 'External LLM service.', viewTypes: { EVENT_STORMING: TYPES.EXTERNAL, SYS_ARCH: TYPES.EXTERNAL, DATA_FLOW: TYPES.PROCESS, SWIMLANES: TYPES.PROCESS } },
    'sys_worker': { title: 'Conversion Worker', desc: 'Async parser.', viewTypes: { EVENT_STORMING: TYPES.EXTERNAL, SYS_ARCH: TYPES.SERVICE, DATA_FLOW: TYPES.PROCESS, SWIMLANES: TYPES.PROCESS } },
    'sys_gw': { title: 'API Gateway', desc: 'Secure entry point.', viewTypes: { SYS_ARCH: TYPES.SERVICE } },
    'db_s3': { title: 'S3 Raw Storage', desc: 'Immutable blob storage.', viewTypes: { SYS_ARCH: TYPES.DATABASE } },
    'sys_portal': { title: 'Review Portal UI', desc: 'Frontend for QA.', viewTypes: { SYS_ARCH: TYPES.SERVICE, EVENT_STORMING: TYPES.READ_MODEL } },
    'cmd_up': { title: 'Upload Document', desc: 'Ingest new file.', viewTypes: { EVENT_STORMING: TYPES.COMMAND, SWIMLANES: TYPES.PROCESS } },
    'cmd_md': { title: 'Convert to Markdown', desc: 'Parse binary to text.', viewTypes: { EVENT_STORMING: TYPES.COMMAND } },
    'cmd_fix': { title: 'Fix Formatting', desc: 'Manual override.', viewTypes: { EVENT_STORMING: TYPES.COMMAND, SWIMLANES: TYPES.PROCESS } },
    'cmd_reject': { title: 'Reject Document', desc: 'Abandon document.', viewTypes: { EVENT_STORMING: TYPES.COMMAND } },
    'dec_qa': { title: 'Quality Routing', desc: 'Confidence check.', viewTypes: { DATA_FLOW: TYPES.DECISION, SWIMLANES: TYPES.DECISION } },
    'data_pdf': { title: 'Raw PDF', desc: 'Binary payload.', viewTypes: { DATA_FLOW: TYPES.DATA_OBJECT } },
    'data_raw_md': { title: 'Unstructured MD', desc: 'Messy OCR output.', viewTypes: { DATA_FLOW: TYPES.DATA_OBJECT } },
    'data_clean_md': { title: 'Clean Markdown', desc: 'Validated chunks.', viewTypes: { DATA_FLOW: TYPES.DATA_OBJECT } },
    'data_vec': { title: 'Float32 Arrays', desc: 'Embeddings.', viewTypes: { DATA_FLOW: TYPES.DATA_OBJECT } },
    'agg_pipe': { title: 'Doc Pipeline', desc: 'State machine.', viewTypes: { EVENT_STORMING: TYPES.AGGREGATE } },
    'evt_up': { title: 'Document Uploaded', desc: 'File secured.', viewTypes: { EVENT_STORMING: TYPES.EVENT } },
    'pol_conv': { title: 'Trigger Conversion', desc: 'Queue conversion.', viewTypes: { EVENT_STORMING: TYPES.POLICY } },
    'evt_md': { title: 'Markdown Converted', desc: 'Text string returned.', viewTypes: { EVENT_STORMING: TYPES.EVENT } },
    'pol_pass': { title: 'Score > 90%', desc: 'Auto-approve high quality.', viewTypes: { EVENT_STORMING: TYPES.POLICY } },
    'pol_fail': { title: 'Score < 90%', desc: 'Flag for human intervention.', viewTypes: { EVENT_STORMING: TYPES.POLICY } },
    'evt_app': { title: 'Markdown Approved', desc: 'Text is ready.', viewTypes: { EVENT_STORMING: TYPES.EVENT } },
    'evt_rejected': { title: 'Document Rejected', desc: 'Document discarded.', viewTypes: { EVENT_STORMING: TYPES.EVENT } },
    'pol_notify': { title: 'Notify Uploader', desc: 'Send failure email.', viewTypes: { EVENT_STORMING: TYPES.POLICY } },
    'pol_emb': { title: 'Trigger Embedding', desc: 'Trigger embedding.', viewTypes: { EVENT_STORMING: TYPES.POLICY } },
    'cmd_req_emb': { title: 'Request Embeddings', desc: 'Call external LLM.', viewTypes: { EVENT_STORMING: TYPES.COMMAND } },
    'evt_vec': { title: 'Embeddings Generated', desc: 'Arrays received.', viewTypes: { EVENT_STORMING: TYPES.EVENT } },
    'pol_db': { title: 'Trigger DB Save', desc: 'Save to database.', viewTypes: { EVENT_STORMING: TYPES.POLICY } },
    'cmd_os': { title: 'Index Document', desc: 'Write to OpenSearch.', viewTypes: { EVENT_STORMING: TYPES.COMMAND } },
    'evt_idx': { title: 'Document Indexed', desc: 'Data is searchable.', viewTypes: { EVENT_STORMING: TYPES.EVENT } },
    'risk_tbl': { title: 'Lost Tables?', desc: 'Grids parse as garbage.', viewTypes: { EVENT_STORMING: TYPES.HOTSPOT } }
  },
  relations: [
    { id:'r1', from: 'user_editor', to: 'cmd_up', views: ['EVENT_STORMING', 'SWIMLANES'] }, { id:'r2', from: 'user_editor', to: 'sys_gw', views: ['SYS_ARCH'] },
    { id:'r3', from: 'sys_gw', to: 'db_s3', views: ['SYS_ARCH'] }, { id:'r4', from: 'sys_gw', to: 'sys_worker', views: ['SYS_ARCH'] }, { id:'r5', from: 'sys_gw', to: 'sys_portal', views: ['SYS_ARCH'] },
    { id:'r6', from: 'cmd_up', to: 'agg_pipe', views: ['EVENT_STORMING'] }, { id:'r7', from: 'agg_pipe', to: 'evt_up', views: ['EVENT_STORMING'] },
    { id:'r8', from: 'evt_up', to: 'pol_conv', views: ['EVENT_STORMING'] }, { id:'r9', from: 'pol_conv', to: 'cmd_md', views: ['EVENT_STORMING'] },
    { id:'r10', from: 'sys_worker', to: 'cmd_md', views: ['EVENT_STORMING'] }, { id:'r11', from: 'cmd_md', to: 'evt_md', views: ['EVENT_STORMING'] },
    { id:'r12', from: 'evt_md', to: 'pol_pass', views: ['EVENT_STORMING'] }, { id:'r13', from: 'evt_md', to: 'pol_fail', views: ['EVENT_STORMING'] },
    { id:'r14', from: 'pol_pass', to: 'evt_app', views: ['EVENT_STORMING'] }, { id:'r15', from: 'pol_fail', to: 'risk_tbl', views: ['EVENT_STORMING'], dashed: true },
    { id:'r16', from: 'pol_fail', to: 'cmd_fix', views: ['EVENT_STORMING'] }, { id:'r17', from: 'pol_fail', to: 'cmd_reject', views: ['EVENT_STORMING'] },
    { id:'r18', from: 'user_reviewer', to: 'cmd_fix', views: ['EVENT_STORMING'] }, { id:'r19', from: 'cmd_fix', to: 'evt_app', views: ['EVENT_STORMING'] },
    { id:'r20', from: 'cmd_reject', to: 'evt_rejected', views: ['EVENT_STORMING'] }, { id:'r21', from: 'evt_rejected', to: 'pol_notify', views: ['EVENT_STORMING'] },
    { id:'r22', from: 'evt_app', to: 'pol_emb', views: ['EVENT_STORMING'] }, { id:'r23', from: 'pol_emb', to: 'cmd_req_emb', views: ['EVENT_STORMING'] },
    { id:'r24', from: 'cmd_req_emb', to: 'api_emb', views: ['EVENT_STORMING'] }, { id:'r25', from: 'api_emb', to: 'evt_vec', views: ['EVENT_STORMING'] },
    { id:'r26', from: 'evt_vec', to: 'pol_db', views: ['EVENT_STORMING'] }, { id:'r27', from: 'pol_db', to: 'cmd_os', views: ['EVENT_STORMING'] },
    { id:'r28', from: 'cmd_os', to: 'db_os', views: ['EVENT_STORMING'] }, { id:'r29', from: 'db_os', to: 'evt_idx', views: ['EVENT_STORMING'] }, { id:'r30', from: 'evt_idx', to: 'sys_portal', views: ['EVENT_STORMING'] }, 
    { id:'r31', from: 'sys_worker', to: 'api_emb', views: ['SYS_ARCH'] }, { id:'r32', from: 'sys_worker', to: 'db_os', views: ['SYS_ARCH'] }, { id:'r33', from: 'sys_portal', to: 'db_os', views: ['SYS_ARCH'] },
    { id:'r34', from: 'data_pdf', to: 'sys_worker', views: ['DATA_FLOW'] }, { id:'r35', from: 'sys_worker', to: 'data_raw_md', views: ['DATA_FLOW'] },
    { id:'r36', from: 'data_raw_md', to: 'dec_qa', views: ['DATA_FLOW'] }, { id:'r37', from: 'dec_qa', to: 'data_clean_md', views: ['DATA_FLOW'] },
    { id:'r38', from: 'data_clean_md', to: 'api_emb', views: ['DATA_FLOW'] }, { id:'r39', from: 'api_emb', to: 'data_vec', views: ['DATA_FLOW'] }, { id:'r40', from: 'data_vec', to: 'db_os', views: ['DATA_FLOW'] },
    { id:'r41', from: 'cmd_up', to: 'sys_worker', views: ['SWIMLANES'] }, { id:'r42', from: 'sys_worker', to: 'dec_qa', views: ['SWIMLANES'] },
    { id:'r43', from: 'dec_qa', to: 'api_emb', views: ['SWIMLANES'] }, { id:'r44', from: 'dec_qa', to: 'cmd_fix', views: ['SWIMLANES'], dashed: true },
    { id:'r45', from: 'cmd_fix', to: 'api_emb', views: ['SWIMLANES'] }, { id:'r46', from: 'api_emb', to: 'db_os', views: ['SWIMLANES'] }
  ],
  views: {
    EVENT_STORMING: {
      name: 'Event Storming', icon: 'Component',
      nodes: [
        { id: 'user_editor', x: 130, y: 185 }, { id: 'cmd_up', x: 120, y: 250 }, { id: 'agg_pipe', x: 260, y: 250 }, { id: 'evt_up', x: 400, y: 250 },
        { id: 'pol_conv', x: 620, y: 250 }, { id: 'sys_worker', x: 770, y: 185 }, { id: 'cmd_md', x: 760, y: 250 }, { id: 'evt_md', x: 900, y: 250 },
        { id: 'pol_pass', x: 1120, y: 110 }, { id: 'pol_fail', x: 1120, y: 390 }, { id: 'risk_tbl', x: 1130, y: 490 }, { id: 'user_reviewer', x: 1350, y: 265 },
        { id: 'cmd_fix', x: 1340, y: 330 }, { id: 'cmd_reject', x: 1340, y: 450 }, { id: 'evt_app', x: 1480, y: 250 }, { id: 'evt_rejected', x: 1480, y: 450 }, { id: 'pol_notify', x: 1700, y: 450 },
        { id: 'pol_emb', x: 1700, y: 250 }, { id: 'api_emb', x: 1850, y: 185 }, { id: 'cmd_req_emb', x: 1840, y: 250 }, { id: 'evt_vec', x: 1980, y: 250 }, 
        { id: 'pol_db', x: 2200, y: 250 }, { id: 'db_os', x: 2350, y: 185 }, { id: 'cmd_os', x: 2340, y: 250 }, { id: 'evt_idx', x: 2480, y: 250 }, { id: 'sys_portal', x: 2620, y: 250 }
      ],
      groups: [
        { id: 'g1', title: 'Ingestion Subdomain', desc: 'Handles secure file uploads and initial storage state before processing.', nodeIds: ['user_editor', 'cmd_up', 'agg_pipe', 'evt_up'], color: 'rgba(140, 170, 238, 0.12)', borderColor: '#8caaee', textColor: '#c6d0f5' },
        { id: 'g2', title: 'Quality Assurance & Routing', desc: 'Evaluates structural integrity of the parsed markdown and loops in humans for anomaly correction.', nodeIds: ['pol_pass', 'pol_fail', 'user_reviewer', 'cmd_fix', 'cmd_reject', 'risk_tbl', 'evt_rejected', 'pol_notify'], color: 'rgba(229, 200, 144, 0.12)', borderColor: '#e5c890', textColor: '#c6d0f5' },
        { id: 'g3', title: 'Vectorization Infrastructure', desc: 'Manages API interactions for AI embeddings and final persistence to OpenSearch clusters.', nodeIds: ['pol_emb', 'cmd_req_emb', 'api_emb', 'evt_vec', 'pol_db', 'cmd_os', 'db_os', 'evt_idx', 'sys_portal'], color: 'rgba(244, 184, 228, 0.12)', borderColor: '#f4b8e4', textColor: '#c6d0f5' }
      ]
    },
    SYS_ARCH: {
      name: 'System Architecture', icon: 'Server',
      nodes: [
        { id: 'user_editor', x: 200, y: 300 }, { id: 'sys_gw', x: 450, y: 300 }, { id: 'sys_worker', x: 750, y: 150 },
        { id: 'sys_portal', x: 750, y: 450 }, { id: 'api_emb', x: 1050, y: 150 }, { id: 'db_os', x: 1050, y: 450 }, { id: 'db_s3', x: 750, y: 300 }
      ],
      groups: [ { id: 'g_vpc', title: 'Internal Virtual Private Cloud', desc: 'Secure network boundary shielding internal services from the public internet.', nodeIds: ['sys_gw','sys_worker','sys_portal','db_os','db_s3'], color: 'rgba(129, 200, 190, 0.12)', borderColor: '#81c8be', textColor: '#c6d0f5' } ]
    },
    DATA_FLOW: {
      name: 'Data Flow (DFD)', icon: 'Share2',
      nodes: [
        { id: 'data_pdf', x: 150, y: 250 }, { id: 'sys_worker', x: 400, y: 250 }, { id: 'data_raw_md', x: 650, y: 250 },
        { id: 'dec_qa', x: 900, y: 250 }, { id: 'data_clean_md', x: 1150, y: 250 }, { id: 'api_emb', x: 1400, y: 250 },
        { id: 'data_vec', x: 1650, y: 250 }, { id: 'db_os', x: 1900, y: 250 }
      ],
      groups: []
    },
    SWIMLANES: {
      name: 'Activity Swimlanes', icon: 'Layers',
      nodes: [
        { id: 'cmd_up', x: 150, y: 120 }, { id: 'sys_worker', x: 400, y: 320 }, { id: 'dec_qa', x: 650, y: 320 },
        { id: 'cmd_fix', x: 900, y: 520 }, { id: 'api_emb', x: 1150, y: 320 }, { id: 'db_os', x: 1400, y: 320 }
      ],
      groups: [
        { id: 'l1', isLane: true, title: 'Content Editor', desc: 'External users submitting raw data.', y: 50, h: 200, color: 'rgba(239, 159, 118, 0.12)' },
        { id: 'l2', isLane: true, title: 'Automated Pipeline', desc: 'Backend asynchronous processors running without human input.', y: 250, h: 200, color: 'rgba(153, 209, 219, 0.12)' },
        { id: 'l3', isLane: true, title: 'Review Team', desc: 'Internal staff overseeing quality and edge cases.', y: 450, h: 200, color: 'rgba(186, 187, 241, 0.12)' }
      ]
    }
  },
  journeys: [
    {
      id: 'happy-path',
      label: 'Document Ingest Happy Path',
      description: 'Follow a document as it is uploaded, converted, validated, and indexed with a high confidence score.',
      steps: [
        { nodeIds: ['user_editor', 'cmd_up', 'agg_pipe', 'evt_up'], description: 'Ingestion Stack — Content Editor uploads PDF → Upload Command triggered → Pipeline initiated → Document Uploaded event published.' },
        { nodeIds: ['pol_conv', 'sys_worker', 'cmd_md', 'evt_md'], description: 'Conversion Stack — Policy fires → Async Worker converts → Markdown produced → Markdown Converted event published.' },
        { nodeIds: ['pol_pass', 'evt_app'], description: 'Quality Check (Pass) — Score >90%, auto-approve → Markdown Approved event published.' },
        { nodeIds: ['pol_emb', 'cmd_req_emb', 'api_emb', 'evt_vec'], description: 'Vectorization Stack — Policy fires → Embedding API called → LLM generates vectors → Embeddings Generated.' },
        { nodeIds: ['pol_db', 'cmd_os', 'db_os', 'evt_idx', 'sys_portal'], description: 'Indexing Stack — Policy routes to DB → Index command formats data → Written to OpenSearch → Document available on Portal.' },
      ]
    },
    {
      id: 'recovery-path',
      label: 'Manual Review & Recovery Path',
      description: 'What happens when parsing quality drops below confidence thresholds and requires a human review.',
      steps: [
        { nodeIds: ['user_editor', 'cmd_up', 'sys_worker', 'evt_md'], description: 'Ingestion → Conversion — Scanned document uploaded, Worker processes messy structure, produces low-quality markdown.' },
        { nodeIds: ['pol_fail', 'risk_tbl'], description: 'Quality Check (Fail) — Score <90%, auto-approval halted. Hotspot: PDF table columns parsed as garbage.' },
        { nodeIds: ['user_reviewer', 'cmd_fix'], description: 'Human Review — Reviewer notified, manually fixes layout formats.' },
        { nodeIds: ['evt_app', 'api_emb', 'db_os'], description: 'Recovery Complete — Markdown Approved → Vectors generated → Saved to OpenSearch.' },
      ]
    }
  ]
};
