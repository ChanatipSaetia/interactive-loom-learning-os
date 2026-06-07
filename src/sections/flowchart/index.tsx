import React, { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { animate } from 'animejs';
import { SectionRegistry } from '../../core/registry';
import * as Icons from 'lucide-react';

const ZoomIn = Icons.ZoomIn;
const ZoomOut = Icons.ZoomOut;
const Locate = Icons.Locate;
const Share2 = Icons.Share2;
const Play = Icons.Play;
const Component = Icons.Component;
const Server = Icons.Server;
const Layers = Icons.Layers;
const Workflow = Icons.Workflow;
const Pause = Icons.Pause;
const SkipForward = Icons.SkipForward;
const SkipBack = Icons.SkipBack;
const RotateCcw = Icons.RotateCcw;
const Plus = Icons.Plus;
const Trash2 = Icons.Trash2;
const CheckSquare = Icons.CheckSquare;
const Square = Icons.Square;
const X = Icons.X;
const Settings = Icons.Settings;
const FileDown = Icons.FileDown;
const GitBranch = Icons.GitBranch;

import './flowchart.css';

// --- 1. CONFIG & TYPES ---
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
export const SMALL_W = 120; 
export const SMALL_H = 65;

// --- 2. THE UNIFIED DATA SCHEMA TYPES ---
export interface FlowchartEntity {
  title: string;
  desc: string;
  viewTypes: Record<string, string>;
}

export interface FlowchartRelation {
  id: string;
  from: string;
  to: string;
  views: string[];
  dashed?: boolean;
  handledBy?: boolean;
}

export interface FlowchartViewNode {
  id: string;
  x: number;
  y: number;
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
  y?: number;
  h?: number;
}

export interface FlowchartStep {
  nodeId?: string;
  nodeIds?: string[];
  description: string;
}

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
  steps?: any[];
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

interface TransformState {
  scale: number;
  translateX: number;
  translateY: number;
}

interface PinchState {
  active: boolean;
  initialDist: number;
  initialScale: number;
}

function wrapTooltipText(text: string, maxChars = 28): string[] {
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

// --- 4. DEFAULT INITIAL SCHEMA ---
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
    'pol_emb': { title: 'Trigger Embedding', desc: 'Generate vectors.', viewTypes: { EVENT_STORMING: TYPES.POLICY } },
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

function getPlaybackIcon(iconName: string) {
  switch (iconName) {
    case 'Play': return <Play size={18} className="flowchart-btn-icon" />;
    case 'Pause': return <Pause size={18} className="flowchart-btn-icon" />;
    case 'SkipForward': return <SkipForward size={18} className="flowchart-btn-icon" />;
    case 'SkipBack': return <SkipBack size={18} className="flowchart-btn-icon" />;
    case 'RotateCcw': return <RotateCcw size={18} className="flowchart-btn-icon" />;
    default: return null;
  }
}

export function Flowchart({ title, schema = INITIAL_SCHEMA }: FlowchartProps) {
  // Local editable schema state
  const [localSchema, setLocalSchema] = useState<UnifiedFlowchartSchema>(schema);

  useEffect(() => {
    setLocalSchema(schema);
  }, [schema]);

  const viewKeys = useMemo(() => Object.keys(localSchema.views), [localSchema]);
  const [activeViewKey, setActiveViewKey] = useState<string>(viewKeys[0] || 'EVENT_STORMING');
  
  useEffect(() => {
    if (viewKeys.length > 0 && !viewKeys.includes(activeViewKey)) {
      setActiveViewKey(viewKeys[0]);
    }
  }, [viewKeys, activeViewKey]);

  const activeView = localSchema.views[activeViewKey] || { name: 'Empty', icon: 'Workflow', nodes: [], groups: [] };

  // Journeys & Stepper Controls
  const [currentJourneyId, setCurrentJourneyId] = useState<string>('');
  useEffect(() => {
    if (localSchema.journeys.length > 0) {
      setCurrentJourneyId(localSchema.journeys[0].id);
    } else {
      setCurrentJourneyId('');
    }
    setCurrentStep(0);
    setIsPlaying(false);
  }, [localSchema]);

  const currentJourney = localSchema.journeys.find(j => j.id === currentJourneyId);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Viewport / Camera Engine
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState<TransformState>({ scale: 0.9, translateX: 50, translateY: 100 });
  const transformRef = useRef(transform);
  useEffect(() => { transformRef.current = transform; }, [transform]);

  const panAnimRef = useRef<ReturnType<typeof animate> | null>(null);
  const cameraAnimating = useRef(false);

  // Interaction / Editor State
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, baseTranslateX: 0, baseTranslateY: 0 });
  const pinchRef = useRef<PinchState>({ active: false, initialDist: 0, initialScale: 1 });

  // Sidebar Editor state
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('entities'); 
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<any | null>(null);

  const dragRef = useRef<{ 
    active: boolean; 
    nodeId: string | null; 
    offsetX: number;
    offsetY: number;
    svgEl: SVGSVGElement | null;
  }>({
    active: false,
    nodeId: null,
    offsetX: 0,
    offsetY: 0,
    svgEl: null
  });

  // Playback timers & particles
  const playTimerRef = useRef<number | null>(null);
  const particleRef = useRef<SVGCircleElement | null>(null);
  const animeInstanceRef = useRef<ReturnType<typeof animate> | null>(null);
  const descPanelRef = useRef<SVGGElement | null>(null);
  const descPanelAnimRef = useRef<ReturnType<typeof animate> | null>(null);

  // Hover Tooltip state
  const [tooltip, setTooltip] = useState<{ description: string; x: number; y: number } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Journey step focus — currentStep=0 means "overview / nothing selected"
  // actual steps are 1-indexed: steps[currentStep - 1]
  const currentStepData = currentStep > 0 ? currentJourney?.steps[currentStep - 1] : undefined;
  const highlightedNodeId = currentStepData?.nodeId || currentStepData?.nodeIds?.[0];
  const prevStepData = currentStep > 1 ? currentJourney?.steps[currentStep - 2] : undefined;
  const prevHighlightedNodeId = useMemo(() => {
    return prevStepData?.nodeId || prevStepData?.nodeIds?.[0] || null;
  }, [currentStep, currentJourney]);
  const currentDescription = currentStepData?.description ?? '';

  // Get view steps or generate from currentJourney
  const activeSteps = useMemo(() => {
    if (activeView.steps && activeView.steps.length > 0) {
      return activeView.steps;
    }
   if (currentJourney && currentJourney.steps.length > 0) {
       return currentJourney.steps.map((step, idx) => {
         const ids = step.nodeIds || (step.nodeId ? [step.nodeId] : []);
         const primaryNode = ids[0] || step.nodeId || '';
         return {
           id: `journey-step-${idx}`,
           type: 'linear',
           nodeIds: ids,
           title: localSchema.entities[primaryNode]?.title || `Step ${idx + 1}`,
           reason: step.description
         };
       });
    }
    return [];
  }, [activeView.steps, currentJourney, localSchema.entities]);

  // Sync selected step with currentStep.
  // currentStep=0 → no selection (overview). currentStep N → activeSteps[N-1].
  useEffect(() => {
    if (currentStep === 0) {
      setActiveStep(null);
    } else if (activeView.steps && activeView.steps.length > 0) {
      setActiveStep(activeSteps[currentStep - 1] ?? null);
    } else if (currentJourney) {
      setActiveStep(activeSteps[currentStep - 1] ?? null);
    } else {
      setActiveStep(null);
    }
  }, [currentStep, currentJourney, activeSteps, activeView.steps]);

  // Node IDs to highlight — derived directly from the selected step.
  const activeNodeIds = useMemo(() => {
    return activeStep?.nodeIds ?? null;
  }, [activeStep]);

  // Node mappings
  const positioned = useMemo(() => {
    return activeView.nodes;
  }, [activeView.nodes]);

  // Keep a ref to the current view's nodes so the fit effect can read them
  // without listing them as reactive deps (prevents drag from resetting the viewport)
  const activeViewNodesRef = useRef(activeView.nodes);
  useEffect(() => { activeViewNodesRef.current = activeView.nodes; }, [activeView.nodes]);

  const nodeMap = useMemo(() => {
    const m = Object.create(null);
    for (const n of positioned) {
      m[n.id] = n;
    }
    return m;
  }, [positioned]);

  // Compute view boundaries
  const minX = positioned.length > 0 ? Math.min(...positioned.map(n => n.x)) : 0;
  const maxX = positioned.length > 0 ? Math.max(...positioned.map(n => n.x)) : 0;
  const minY = positioned.length > 0 ? Math.min(...positioned.map(n => n.y)) : 0;
  const maxY = positioned.length > 0 ? Math.max(...positioned.map(n => n.y)) : 0;

  // View reset on switch — fires ONLY on view key change (not on node drag).
  // Node positions are read from a ref at rAF time so they don't become deps.
  useEffect(() => {
    setIsPlaying(false);
    setCurrentStep(0);
    setActiveStep(null);

    const raf = requestAnimationFrame(() => {
      if (!svgRef.current) return;
      const nodes = activeViewNodesRef.current;
      if (nodes.length === 0) return;
      const xs = nodes.map(n => n.x);
      const ys = nodes.map(n => n.y);
      const nx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const ny = (Math.min(...ys) + Math.max(...ys)) / 2;
      const W = svgRef.current.clientWidth || 800;
      const H = svgRef.current.clientHeight || 500;
      setTransform({
        scale: 0.45,
        translateX: W / 2 - nx * 0.45,
        translateY: H / 2 - ny * 0.45,
      });
    });

    return () => cancelAnimationFrame(raf);
  }, [activeViewKey]); // ← only fires on view switch, never on node drag

  // Playback timer loops
  useEffect(() => {
    if (isPlaying && currentJourney && currentStep < currentJourney.steps.length) {
      playTimerRef.current = window.setTimeout(() => {
        setCurrentStep(s => s + 1);
      }, 2500);
    } else {
      setIsPlaying(false);
    }
    return () => {
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [isPlaying, currentStep, currentJourney]);

  // CAMERA ENGINE
  const animateTo = useCallback((targetX: number, targetY: number, targetScale: number) => {
    if (panAnimRef.current) panAnimRef.current.pause();
    cameraAnimating.current = true;
    const start = transformRef.current;
    const proxy = { tx: start.translateX, ty: start.translateY, sc: start.scale };
    
    panAnimRef.current = animate(proxy, {
      tx: targetX,
      ty: targetY,
      sc: targetScale,
      duration: 600,
      easing: 'easeInOutQuad',
      onUpdate: () => {
        setTransform({ scale: proxy.sc, translateX: proxy.tx, translateY: proxy.ty });
      },
      onComplete: () => {
        cameraAnimating.current = false;
      }
    });
  }, []);

  const focusOnNode = useCallback((nodeId: string) => {
    const node = nodeMap[nodeId];
    if (!node || !svgRef.current) return;
    const W = svgRef.current.clientWidth;
    const H = svgRef.current.clientHeight;
    const nx = node.x;
    const ny = node.y;
    const targetTx = W / 2 - nx * transform.scale;
    const targetTy = H / 2 - ny * transform.scale;
    animateTo(targetTx, targetTy, transform.scale);
  }, [nodeMap, transform.scale, animateTo]);

  const focusOnNodes = useCallback((nodeIds: string[]) => {
    if (!containerRef.current || !nodeIds || nodeIds.length === 0 || !svgRef.current) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodeIds.forEach(id => {
      const node = activeView.nodes.find(n => n.id === id);
      if (!node) return;
      const type = localSchema.entities[id]?.viewTypes[activeViewKey] || 'default';
      const isSmall = [TYPES.USER, TYPES.EXTERNAL, TYPES.HOTSPOT, TYPES.DECISION].includes(type as any);
      minX = Math.min(minX, node.x - (isSmall ? SMALL_W : NODE_W) / 2);
      minY = Math.min(minY, node.y - (isSmall ? SMALL_H : NODE_H) / 2);
      maxX = Math.max(maxX, node.x + (isSmall ? SMALL_W : NODE_W) / 2);
      maxY = Math.max(maxY, node.y + (isSmall ? SMALL_H : NODE_H) / 2);
    });
    if (minX === Infinity) return;
    
    const viewportW = svgRef.current.clientWidth; 
    const viewportH = svgRef.current.clientHeight; 
    const padding = Math.min(viewportW * 0.1, 80); 
    
    const bboxW = Math.max(maxX - minX, 1);
    const bboxH = Math.max(maxY - minY, 1);
    const targetScale = Math.min(
      (viewportW - padding * 2) / bboxW,
      (viewportH - padding * 2) / bboxH,
      1.4
    );
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const targetX = viewportW / 2 - centerX * targetScale;
    const targetY = viewportH / 2 - centerY * targetScale;
    animateTo(targetX, targetY, targetScale);
  }, [animateTo, activeView, activeViewKey, localSchema.entities]);

  // Timed camera adjustments
  useEffect(() => {
    if (highlightedNodeId && !isPanning && !dragRef.current.active) {
      focusOnNode(highlightedNodeId);
    }
  }, [currentStep, highlightedNodeId]);

  // In-flight flow particles
  useEffect(() => {
    if (currentStep === 0 || !prevHighlightedNodeId || !highlightedNodeId) return;
    const fromNode = nodeMap[prevHighlightedNodeId];
    const toNode = nodeMap[highlightedNodeId];
    if (!fromNode || !toNode) return;
    
    const hasRelation = localSchema.relations.some(
      r => r.views.includes(activeViewKey) &&
      ((r.from === prevHighlightedNodeId && r.to === highlightedNodeId) || 
       (r.to === prevHighlightedNodeId && r.from === highlightedNodeId))
    );
    if (!hasRelation) return;

    if (animeInstanceRef.current) animeInstanceRef.current.pause();

    const startX = fromNode.x;
    const startY = fromNode.y;
    const endX = toNode.x;
    const endY = toNode.y;

    if (particleRef.current) {
      particleRef.current.setAttribute('cx', String(startX));
      particleRef.current.setAttribute('cy', String(startY));
      particleRef.current.setAttribute('opacity', '1');
      animeInstanceRef.current = animate(particleRef.current, {
        cx: [startX, endX],
        cy: [startY, endY],
        duration: 800,
        easing: 'easeInOutQuad',
        onComplete: () => {
          if (particleRef.current) particleRef.current.setAttribute('opacity', '0');
        }
      });
    }
  }, [currentStep, prevHighlightedNodeId, highlightedNodeId, activeViewKey, nodeMap, localSchema.relations]);

  // Smart Step descriptions panel animation
  useEffect(() => {
    if (descPanelAnimRef.current) descPanelAnimRef.current.cancel();
    if (descPanelRef.current) {
      descPanelRef.current.setAttribute('opacity', '0');
      descPanelAnimRef.current = animate(descPanelRef.current, {
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutQuad'
      });
    }
  }, [currentStep, highlightedNodeId]);

  // Dropdown close events
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  // Interaction handlers
  const getSvgPoint = useCallback((clientX: number, clientY: number, svgEl: SVGSVGElement) => {
    const pt = svgEl.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return { x: clientX, y: clientY };
    const svgP = pt.matrixTransform(ctm.inverse());
    return { x: svgP.x, y: svgP.y };
  }, []);

  const onNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const svgEl = e.currentTarget.closest('svg') as SVGSVGElement;
    if (!svgEl) return;
    
    // Select node in edit mode
    if (isEditMode) {
      setSelectedId(nodeId);
      setActiveTab('entities');
    }
    
    const node = nodeMap[nodeId];
    if (!node) return;
    
    const pt = getSvgPoint(e.clientX, e.clientY, svgEl);
    dragRef.current = { 
      active: true, 
      nodeId, 
      offsetX: pt.x - node.x,
      offsetY: pt.y - node.y,
      svgEl 
    };
    setTooltip(null);
  }, [getSvgPoint, isEditMode, nodeMap]);

  const onNodeTouchStart = useCallback((e: React.TouchEvent, nodeId: string) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    const svgEl = (e.currentTarget as Element).closest('svg') as SVGSVGElement;
    if (!svgEl) return;
    
    if (isEditMode) {
      setSelectedId(nodeId);
      setActiveTab('entities');
    }
    
    const node = nodeMap[nodeId];
    if (!node) return;
    
    const touch = e.touches[0];
    const pt = getSvgPoint(touch.clientX, touch.clientY, svgEl);
    dragRef.current = { 
      active: true, 
      nodeId, 
      offsetX: pt.x - node.x,
      offsetY: pt.y - node.y,
      svgEl 
    };
    setTooltip(null);
  }, [getSvgPoint, isEditMode, nodeMap]);

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (dragRef.current.active && dragRef.current.nodeId) {
      const svgEl = dragRef.current.svgEl;
      if (!svgEl) return;
      const pt = getSvgPoint(clientX, clientY, svgEl);
      const nodeId = dragRef.current.nodeId;
      
      const newX = pt.x - dragRef.current.offsetX;
      const newY = pt.y - dragRef.current.offsetY;

      // Snap to grid (10px) in edit mode
      const finalX = isEditMode ? Math.round(newX / 10) * 10 : newX;
      const finalY = isEditMode ? Math.round(newY / 10) * 10 : newY;

      setLocalSchema(prev => {
        const next = JSON.parse(JSON.stringify(prev)) as UnifiedFlowchartSchema;
        const node = next.views[activeViewKey]?.nodes.find(n => n.id === nodeId);
        if (node) {
          node.x = finalX;
          node.y = finalY;
        }
        return next;
      });
      return;
    }
    if (isPanning) {
      const dx = clientX - panStartRef.current.x;
      const dy = clientY - panStartRef.current.y;
      setTransform(() => ({
        scale: transformRef.current.scale,
        translateX: panStartRef.current.baseTranslateX + dx,
        translateY: panStartRef.current.baseTranslateY + dy
      }));
    }
  }, [getSvgPoint, isPanning, activeViewKey, isEditMode]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = { active: false, nodeId: null, offsetX: 0, offsetY: 0, svgEl: null };
    setIsPanning(false);
    pinchRef.current = { active: false, initialDist: 0, initialScale: 1 };
  }, []);

  const onWheelNative = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    const currentScale = transformRef.current.scale;
    const newScale = Math.min(3, Math.max(0.15, currentScale * (1 + delta)));
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;
    const svgMouseX = mouseX / currentScale;
    const svgMouseY = mouseY / currentScale;
    const scaleFactor = newScale / currentScale;
    setTransform(prev => ({
      scale: newScale,
      translateX: prev.translateX + svgMouseX * (1 - scaleFactor),
      translateY: prev.translateY + svgMouseY * (1 - scaleFactor)
    }));
  }, []);

  const onSvgTouchStartNative = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      pinchRef.current = { active: true, initialDist: dist, initialScale: transformRef.current.scale };
      setIsPanning(false);
      return;
    }
    if (e.touches.length === 1) {
      const target = e.target as Element;
      if (!target.closest('.flowchart-node-group') && !target.closest('foreignObject')) {
        e.preventDefault();
        setIsPanning(true);
        const touch = e.touches[0];
        panStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          baseTranslateX: transformRef.current.translateX,
          baseTranslateY: transformRef.current.translateY
        };
      }
    }
  }, []);

  const onTouchMoveNative = useCallback((e: TouchEvent) => {
    if (pinchRef.current.active && e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scaleRatio = dist / pinchRef.current.initialDist;
      const currentScale = transformRef.current.scale;
      const newScale = Math.min(3, Math.max(0.15, pinchRef.current.initialScale * scaleRatio));
      const svgEl = svgRef.current;
      if (!svgEl) return;
      const rect = svgEl.getBoundingClientRect();
      const centerX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const centerY = (t1.clientY + t2.clientY) / 2 - rect.top;
      const svgCenterX = (centerX - rect.width / 2) / currentScale;
      const svgCenterY = (centerY - rect.height / 2) / currentScale;
      const scaleFactor = newScale / currentScale;
      setTransform(prev => ({
        scale: newScale,
        translateX: prev.translateX + svgCenterX * (1 - scaleFactor),
        translateY: prev.translateY + svgCenterY * (1 - scaleFactor)
      }));
      return;
    }
    if (e.touches.length === 1 && (isPanning || dragRef.current.active)) {
      e.preventDefault();
      const touch = e.touches[0];
      handlePointerMove(touch.clientX, touch.clientY);
    }
  }, [handlePointerMove, isPanning]);

  // Attach wheel + touch as non-passive listeners so preventDefault() works
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener('wheel', onWheelNative, { passive: false });
    svg.addEventListener('touchstart', onSvgTouchStartNative, { passive: false });
    svg.addEventListener('touchmove', onTouchMoveNative, { passive: false });
    return () => {
      svg.removeEventListener('wheel', onWheelNative);
      svg.removeEventListener('touchstart', onSvgTouchStartNative);
      svg.removeEventListener('touchmove', onTouchMoveNative);
    };
  }, [onWheelNative, onSvgTouchStartNative, onTouchMoveNative]);

  const onSvgMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest('.flowchart-node-group') || (e.target as Element).closest('foreignObject')) return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      baseTranslateX: transform.translateX,
      baseTranslateY: transform.translateY
    };
  }, [transform]);

  // Stepper Handlers — currentStep=0 is the overview (no highlight)
  const handlePlay = useCallback(() => {
    if (currentJourney && currentStep < currentJourney.steps.length) {
      setIsPlaying(true);
    }
  }, [currentJourney, currentStep]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleNext = useCallback(() => {
    if (currentJourney && currentStep < currentJourney.steps.length) {
      setCurrentStep(s => s + 1);
    }
  }, [currentJourney, currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  }, [currentStep]);

  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(false);
    setActiveStep(null);
  }, []);

  // Step carousel handler — activeStep is the single source for selection, dim, and camera.
  const handleStepClick = (step: any) => {
    if (activeStep?.id === step.id) {
      // Deselect → back to overview (step 0)
      setActiveStep(null);
      setCurrentStep(0);
      setIsPlaying(false);
    } else {
      setActiveStep(step);
      focusOnNodes(step.nodeIds || []);

      // Sync currentStep (1-indexed) when using journey steps
      if (!activeView.steps && currentJourney) {
        const stepIdx = activeSteps.findIndex(s => s.id === step.id);
        if (stepIdx !== -1) setCurrentStep(stepIdx + 1);
      }

      // Scroll carousel to keep the active card visible
      setTimeout(() => {
        const el = document.getElementById(`step-card-${step.id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }, 50);
    }
  };

  // Zoom Toolbar controls
  const handleZoomIn = useCallback(() => {
    setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.1) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setTransform(prev => ({ ...prev, scale: Math.max(0.15, prev.scale - 0.1) }));
  }, []);

  const handleFitToScreen = useCallback(() => {
    if (positioned.length === 0 || !svgRef.current) return;
    const W = svgRef.current.clientWidth || 800;
    const H = svgRef.current.clientHeight || 500;
    const nx = minX + (maxX - minX) / 2;
    const ny = minY + (maxY - minY) / 2;
    animateTo(W / 2 - nx * 0.45, H / 2 - ny * 0.45, 0.45);
  }, [positioned, minX, maxX, minY, maxY, animateTo]);

  // Mutation helper functions for the Editor
  const updateEntity = (id: string, field: string, value: string) => {
    setLocalSchema(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as UnifiedFlowchartSchema;
      if (!next.entities[id]) return prev;
      if (field.startsWith('viewTypes.')) {
        const vKey = field.split('.')[1];
        next.entities[id].viewTypes[vKey] = value;
        
        // Add or remove node in view configuration
        const viewNodes = next.views[vKey]?.nodes;
        if (viewNodes) {
          const exists = viewNodes.some(n => n.id === id);
          if (value && !exists) {
            viewNodes.push({ id, x: 150, y: 150 });
          } else if (!value && exists) {
            next.views[vKey].nodes = viewNodes.filter(n => n.id !== id);
          }
        }
      } else {
        (next.entities[id] as any)[field] = value;
      }
      return next;
    });
  };

  const addEntity = () => {
    const id = `ent_${Date.now()}`;
    setLocalSchema(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as UnifiedFlowchartSchema;
      next.entities[id] = { title: 'New Entity', desc: '', viewTypes: { [activeViewKey]: TYPES.EVENT } };
      next.views[activeViewKey]?.nodes.push({ id, x: 200, y: 200 });
      return next;
    });
    setSelectedId(id);
    setActiveTab('entities');
  };

  const deleteEntity = (id: string) => {
    setLocalSchema(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as UnifiedFlowchartSchema;
      delete next.entities[id];
      Object.keys(next.views).forEach(vKey => {
        next.views[vKey].nodes = next.views[vKey].nodes.filter(n => n.id !== id);
        next.views[vKey].groups.forEach(g => g.nodeIds = g.nodeIds ? g.nodeIds.filter(nid => nid !== id) : []);
      });
      next.relations = next.relations.filter(r => r.from !== id && r.to !== id);
      next.journeys.forEach(j => {
        j.steps = j.steps.filter(s => s.nodeId !== id);
      });
      return next;
    });
    setSelectedId(null);
  };

  const exportSchema = () => {
    const jsonStr = JSON.stringify(localSchema, null, 2);
    navigator.clipboard.writeText(jsonStr);
    alert('Schema JSON copied to clipboard!');
    console.log(jsonStr);
  };

  const renderSidebar = () => {
    if (!isEditMode) return null;
    return (
      <div className={`flowchart-sidebar ${selectedId ? 'active' : ''}`} style={{ display: selectedId ? 'flex' : 'none' }}>
        <div className="flowchart-sidebar-tabs">
          {[
            { id: 'entities', label: 'Entities' },
            { id: 'relations', label: 'Relations' },
            { id: 'groups', label: 'Groups' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); }}
              className={`flowchart-sidebar-tab-btn ${activeTab === t.id ? 'active' : ''}`}
            >
              {t.label}
            </button>
          ))}
          <button onClick={() => setSelectedId(null)} className="flowchart-sidebar-close" aria-label="Close sidebar"><X size={16} /></button>
        </div>

        <div className="flowchart-sidebar-content">
          {/* ENTITIES TAB */}
          {activeTab === 'entities' && selectedId && localSchema.entities[selectedId] && (
            <div className="flowchart-sidebar-form">
              <div className="flowchart-sidebar-section-header">
                <h2>Edit Entity</h2>
                <button onClick={addEntity} className="flowchart-sidebar-add-btn" title="Add Entity"><Plus size={14} /></button>
              </div>
              <div className="flowchart-form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={localSchema.entities[selectedId]?.title || ''}
                  onChange={e => updateEntity(selectedId, 'title', e.target.value)}
                />
              </div>
              <div className="flowchart-form-group">
                <label>Description (Tooltip)</label>
                <textarea
                  value={localSchema.entities[selectedId]?.desc || ''}
                  onChange={e => updateEntity(selectedId, 'desc', e.target.value)}
                />
              </div>
              <div className="flowchart-projections-box">
                <h3>View Stereotypes</h3>
                {viewKeys.map(vKey => (
                  <div key={vKey} className="flowchart-projection-row">
                    <label>{localSchema.views[vKey]?.name}</label>
                    <select
                      value={localSchema.entities[selectedId]?.viewTypes[vKey] || ''}
                      onChange={e => updateEntity(selectedId, `viewTypes.${vKey}`, e.target.value)}
                    >
                      <option value="">-- Exclude --</option>
                      {Object.values(TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <button onClick={() => deleteEntity(selectedId)} className="flowchart-sidebar-danger-btn"><Trash2 size={14} /> Delete Entity</button>
            </div>
          )}

          {/* RELATIONS TAB */}
          {activeTab === 'relations' && (
            <div className="flowchart-sidebar-form">
              <h2>Connections</h2>
              <div className="flowchart-relation-builder">
                <h3>Create Connection</h3>
                <div className="flowchart-relation-inputs">
                  <select id="relFrom" className="flowchart-relation-select">
                    <option value="">Source...</option>
                    {activeView.nodes.map(n => <option key={n.id} value={n.id}>{localSchema.entities[n.id]?.title}</option>)}
                  </select>
                  <span className="arrow-divider">&rarr;</span>
                  <select id="relTo" className="flowchart-relation-select">
                    <option value="">Target...</option>
                    {activeView.nodes.map(n => <option key={n.id} value={n.id}>{localSchema.entities[n.id]?.title}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => {
                    const fromEl = document.getElementById('relFrom') as HTMLSelectElement | null;
                    const toEl = document.getElementById('relTo') as HTMLSelectElement | null;
                    const f = fromEl?.value;
                    const t = toEl?.value;
                    if (f && t && f !== t) {
                      setLocalSchema(p => {
                        const n = JSON.parse(JSON.stringify(p)) as UnifiedFlowchartSchema;
                        n.relations.push({ id: `rel_${Date.now()}`, from: f, to: t, views: [activeViewKey] });
                        return n;
                      });
                    }
                  }}
                  className="flowchart-sidebar-primary-btn"
                >
                  Add Connection
                </button>
              </div>

              <div className="flowchart-sidebar-list">
                {localSchema.relations.filter(r => r.views.includes(activeViewKey)).map(rel => (
                  <div key={rel.id} className="flowchart-relation-item">
                    <div className="flowchart-relation-label">
                      <span>{localSchema.entities[rel.from]?.title || 'Unknown'}</span>
                      <span className="arrow-symbol">&rarr;</span>
                      <span>{localSchema.entities[rel.to]?.title || 'Unknown'}</span>
                    </div>
                    <button
                      onClick={() => setLocalSchema(p => {
                        const n = JSON.parse(JSON.stringify(p)) as UnifiedFlowchartSchema;
                        n.relations = n.relations.filter(r => r.id !== rel.id);
                        return n;
                      })}
                      className="flowchart-delete-link-btn"
                      aria-label="Delete connection"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GROUPS TAB */}
          {activeTab === 'groups' && (
            <div className="flowchart-sidebar-form">
              <div className="flowchart-sidebar-section-header">
                <h2>Groups & Swimlanes</h2>
                <button
                  onClick={() => {
                    const id = `g_${Date.now()}`;
                    setLocalSchema(p => {
                      const n = JSON.parse(JSON.stringify(p)) as UnifiedFlowchartSchema;
                      n.views[activeViewKey]?.groups.push({
                        id,
                        title: 'New Group',
                        desc: '',
                        nodeIds: [],
                        color: 'rgba(96, 165, 250, 0.08)',
                        borderColor: '#93c5fd',
                        textColor: '#1e40af',
                        isLane: false,
                        y: 100,
                        h: 200
                      });
                      return n;
                    });
                    setSelectedId(id);
                  }}
                  className="flowchart-sidebar-add-btn"
                  title="Add Group"
                >
                  <Plus size={14} />
                </button>
              </div>

              {selectedId && activeView.groups.find(g => g.id === selectedId) ? (() => {
                const group = activeView.groups.find(g => g.id === selectedId)!;
                return (
                  <div className="flowchart-sidebar-form">
                    <button onClick={() => setSelectedId(null)} className="flowchart-sidebar-back">&larr; Back to list</button>
                    <div className="flowchart-form-group">
                      <label>Group Title</label>
                      <input
                        type="text"
                        value={group.title || ''}
                        onChange={e => {
                          setLocalSchema(p => {
                            const n = JSON.parse(JSON.stringify(p)) as UnifiedFlowchartSchema;
                            const target = n.views[activeViewKey]?.groups.find(g => g.id === selectedId);
                            if (target) target.title = e.target.value;
                            return n;
                          });
                        }}
                      />
                    </div>
                    <div className="flowchart-form-group">
                      <label>Description (Tooltip)</label>
                      <textarea
                        value={group.desc || ''}
                        onChange={e => {
                          setLocalSchema(p => {
                            const n = JSON.parse(JSON.stringify(p)) as UnifiedFlowchartSchema;
                            const target = n.views[activeViewKey]?.groups.find(g => g.id === selectedId);
                            if (target) target.desc = e.target.value;
                            return n;
                          });
                        }}
                      />
                    </div>
                    <label className="flowchart-checkbox-row">
                      <input
                        type="checkbox"
                        checked={group.isLane || false}
                        onChange={e => {
                          setLocalSchema(p => {
                            const n = JSON.parse(JSON.stringify(p)) as UnifiedFlowchartSchema;
                            const target = n.views[activeViewKey]?.groups.find(g => g.id === selectedId);
                            if (target) target.isLane = e.target.checked;
                            return n;
                          });
                        }}
                      />
                      <span>Render as Swimlane</span>
                    </label>

                    {!group.isLane && (
                      <div className="flowchart-node-assign-list">
                        <label>Assigned Nodes</label>
                        <div className="flowchart-checkbox-container">
                          {activeView.nodes.map(n => {
                            const isChecked = group.nodeIds?.includes(n.id) || false;
                            return (
                              <label key={n.id} className="flowchart-checkbox-item">
                                <span className={`checkbox-icon ${isChecked ? 'checked' : ''}`}>
                                  {isChecked ? <CheckSquare size={14} /> : <Square size={14} />}
                                </span>
                                <span className="label-text">{localSchema.entities[n.id]?.title}</span>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={e => {
                                    setLocalSchema(p => {
                                      const nxt = JSON.parse(JSON.stringify(p)) as UnifiedFlowchartSchema;
                                      const g = nxt.views[activeViewKey]?.groups.find(gx => gx.id === selectedId);
                                      if (g) {
                                        if (!g.nodeIds) g.nodeIds = [];
                                        if (e.target.checked) g.nodeIds.push(n.id);
                                        else g.nodeIds = g.nodeIds.filter(id => id !== n.id);
                                      }
                                      return nxt;
                                    });
                                  }}
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setLocalSchema(p => {
                          const n = JSON.parse(JSON.stringify(p)) as UnifiedFlowchartSchema;
                          n.views[activeViewKey].groups = n.views[activeViewKey].groups.filter(g => g.id !== selectedId);
                          return n;
                        });
                        setSelectedId(null);
                      }}
                      className="flowchart-sidebar-danger-btn"
                    >
                      <Trash2 size={14} /> Delete Group
                    </button>
                  </div>
                );
              })() : (
                <div className="flowchart-sidebar-list">
                  {activeView.groups.map(g => (
                    <div key={g.id} onClick={() => setSelectedId(g.id)} className="flowchart-sidebar-item hoverable">
                      <div className="flowchart-group-meta">
                        <span className="flowchart-sidebar-item-title">{g.title}</span>
                        <span className="flowchart-sidebar-item-subtitle">{g.isLane ? 'Swimlane' : `${g.nodeIds?.length || 0} nodes`}</span>
                      </div>
                      <div className="flowchart-color-indicator" style={{ backgroundColor: g.borderColor || g.color }}></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const transformStr = `translate(${transform.translateX}, ${transform.translateY}) scale(${transform.scale})`;

  return (
    <div ref={containerRef} className="flowchart-section" data-testid="flowchart-section">
      <div className="flowchart-header-container">
        {title && <h3 className="flowchart-title" data-testid="flowchart-title">{title}</h3>}
        
        {/* Switch Projections / Views */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {viewKeys.length > 1 && (
            <div className="flowchart-view-tabs" data-testid="flowchart-view-tabs">
              {viewKeys.map(vk => {
                const view = localSchema.views[vk];
                const Icon = (DYNAMIC_ICONS as any)[view.icon] || Workflow;
                return (
                  <button
                    key={vk}
                    onClick={() => setActiveViewKey(vk)}
                    className={`flowchart-view-tab-btn ${activeViewKey === vk ? 'active' : ''}`}
                  >
                    <Icon size={14} />
                    <span>{view.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Toggle Edit Mode button */}
          <button
            onClick={() => {
              setIsEditMode(!isEditMode);
              setSelectedId(null);
              setActiveStep(null);
            }}
            className={`flowchart-view-tab-btn ${isEditMode ? 'active' : ''}`}
            title="Toggle Edit Mode"
            style={{ padding: '6px 10px', height: '31px' }}
          >
            <Settings size={14} />
            <span>{isEditMode ? 'Exit Edit' : 'Edit Diagram'}</span>
          </button>
        </div>
      </div>

      {/* Journeys selector bar */}
      {localSchema.journeys.length > 0 && (
        <div className="flowchart-journey-bar" data-testid="flowchart-journey-bar">
          <div className="flowchart-journey-selector">
            <span className="flowchart-journey-label">Story / Journey:</span>
            <select
              id="flowchart-journey-select"
              className="flowchart-journey-select"
              value={currentJourneyId}
              onChange={(e) => {
                setCurrentJourneyId(e.target.value);
                setCurrentStep(0);
                setIsPlaying(false);
                setActiveStep(null);
              }}
              data-testid="flowchart-journey-select"
            >
              {localSchema.journeys.map(j => (
                <option key={j.id} value={j.id}>
                  {j.label}
                </option>
              ))}
            </select>
          </div>
          {currentJourney?.description && (
            <div className="flowchart-journey-description" data-testid="flowchart-journey-description">
              {currentJourney.description}
            </div>
          )}
        </div>
      )}

      {/* Guided checklist playback controls */}
      {currentJourney && (
        <div className="flowchart-playback animate-fade-in" data-testid="flowchart-playback">
          <button
            className="flowchart-btn"
            disabled={isPlaying || currentStep >= currentJourney.steps.length - 1}
            onClick={handlePlay}
            data-testid="flowchart-btn-play"
            aria-label="Play"
          >
            {getPlaybackIcon('Play')}
          </button>
          <button
            className="flowchart-btn"
            disabled={!isPlaying}
            onClick={handlePause}
            data-testid="flowchart-btn-pause"
            aria-label="Pause"
          >
            {getPlaybackIcon('Pause')}
          </button>
          <button
            className="flowchart-btn"
            disabled={currentStep >= currentJourney.steps.length - 1}
            onClick={handleNext}
            data-testid="flowchart-btn-next"
            aria-label="Next"
          >
            {getPlaybackIcon('SkipForward')}
          </button>
          <button
            className="flowchart-btn"
            disabled={currentStep === 0}
            onClick={handlePrev}
            data-testid="flowchart-btn-prev"
            aria-label="Previous"
          >
            {getPlaybackIcon('SkipBack')}
          </button>
          <button
            className="flowchart-btn"
            disabled={currentStep === 0}
            onClick={handleReset}
            data-testid="flowchart-btn-reset"
            aria-label="Reset"
          >
            {getPlaybackIcon('RotateCcw')}
          </button>
          <span className="flowchart-progress" data-testid="flowchart-progress">
            {currentStep + 1} / {currentJourney.steps.length}
          </span>
        </div>
      )}

      <div className="flowchart-canvas-wrapper" style={{ position: 'relative' }}>
        <div className="flowchart-body">
          {/* Zoom toolbar overlay */}
          <div className="flowchart-zoom-toolbar">
            <button onClick={handleZoomIn} title="Zoom In"><ZoomIn size={16}/></button>
            <button onClick={handleZoomOut} title="Zoom Out"><ZoomOut size={16}/></button>
            <button onClick={handleFitToScreen} title="Fit to Screen"><Locate size={16}/></button>
            {isEditMode && (
              <button onClick={exportSchema} title="Export Schema to Clipboard"><FileDown size={16}/></button>
            )}
          </div>

          <svg
            ref={svgRef}
            className="flowchart-svg"
            data-testid="flowchart-svg"
            width="100%"
            height="100%"
            onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onMouseDown={onSvgMouseDown}
            onTouchEnd={handlePointerUp}
          >
            <defs>
              <filter id="flowchart-desc-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#ca9ee6" floodOpacity="0.25" />
              </filter>
              <filter id="flowchart-tooltip-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.4" />
              </filter>
              <filter id="flowchart-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#8caaee" floodOpacity="0.6" />
              </filter>
              <marker id="flowchart-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M 0 0 L 7 3 L 0 6 Z" fill="#626880" />
              </marker>
              <marker id="flowchart-arrow-highlight" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M 0 0 L 7 3 L 0 6 Z" fill="#8caaee" />
              </marker>
              <pattern
                id="dotGrid"
                width={20 * transform.scale}
                height={20 * transform.scale}
                patternUnits="userSpaceOnUse"
                patternTransform={`translate(${transform.translateX % (20 * transform.scale)}, ${transform.translateY % (20 * transform.scale)})`}
              >
                <circle cx="2" cy="2" r={1 * transform.scale} fill="#51576d" opacity="0.6" />
              </pattern>
            </defs>

            <rect width="100%" height="100%" fill="url(#dotGrid)" style={{ pointerEvents: 'none' }} />

            <g transform={transformStr} data-testid="flowchart-canvas">
              
              {/* Draw groups / domains / swimlanes */}
              {activeView.groups && activeView.groups.map(group => {
                const isFaded = activeNodeIds !== null;
                if (group.isLane) {
                  return (
                    <g key={group.id} className="flowchart-swimlane-group" opacity={isFaded ? 0.15 : 0.85} style={{ transition: 'opacity 0.3s' }}>
                      <rect
                        x={minX - 100}
                        y={group.y ?? 100}
                        width={maxX - minX + 500}
                        height={group.h ?? 180}
                        fill={group.color || 'rgba(186, 187, 241, 0.10)'}
                        stroke={group.borderColor || '#626880'}
                        strokeWidth="1.5"
                      />
                      <text
                        x={minX - 80}
                        y={(group.y ?? 100) + 25}
                        fontSize="13"
                        fontWeight="bold"
                        fill={group.textColor || '#b5bfe2'}
                      >
                        {group.title}
                      </text>
                    </g>
                  );
                }
                
                // Standard visual domain group
                const gNodes = positioned.filter(n => group.nodeIds?.includes(n.id));
                if (gNodes.length === 0) return null;
                
                const gMinX = Math.min(...gNodes.map(n => n.x - NODE_W / 2)) - 35;
                const gMaxX = Math.max(...gNodes.map(n => n.x + NODE_W / 2)) + 35;
                const gMinY = Math.min(...gNodes.map(n => n.y - NODE_H / 2)) - 30;
                const gMaxY = Math.max(...gNodes.map(n => n.y + NODE_H / 2)) + 30;
                
                return (
                  <g key={group.id} className="flowchart-domain-group" opacity={isFaded ? 0.15 : 1} style={{ transition: 'opacity 0.3s' }}>
                    <rect
                       x={gMinX}
                       y={gMinY}
                       width={gMaxX - gMinX}
                       height={gMaxY - gMinY}
                       rx="12"
                       fill={group.color || 'rgba(140, 170, 238, 0.10)'}
                       stroke={group.borderColor || '#8caaee'}
                       strokeWidth="1.5"
                       strokeDasharray="4 4"
                     />
                     <text
                       x={gMinX + 15}
                       y={gMinY + 22}
                       fontSize="11"
                       fontWeight="bold"
                       fill={group.textColor || '#c6d0f5'}
                    >
                      {group.title}
                    </text>
                  </g>
                );
              })}

              {/* Draw relations / connections / edges as Bezier curves */}
              {localSchema.relations
                .filter(r => r.views.includes(activeViewKey))
                .map((rel, idx) => {
                  const fromNode = nodeMap[rel.from];
                  const toNode = nodeMap[rel.to];
                  if (!fromNode || !toNode) return null;

                  const entityFrom = localSchema.entities[rel.from];
                  const entityTo = localSchema.entities[rel.to];
                  if (!entityFrom || !entityTo) return null;

                  const fromType = entityFrom.viewTypes[activeViewKey] || 'default';
                  const toType = entityTo.viewTypes[activeViewKey] || 'default';

                  const fromIsSmall = ([TYPES.USER, TYPES.EXTERNAL, TYPES.HOTSPOT, TYPES.DECISION] as string[]).includes(fromType);
                  const toIsSmall = ([TYPES.USER, TYPES.EXTERNAL, TYPES.HOTSPOT, TYPES.DECISION] as string[]).includes(toType);

                  const fromW = fromIsSmall ? SMALL_W : NODE_W;
                  const fromH = fromIsSmall ? SMALL_H : NODE_H;
                  const toW = toIsSmall ? SMALL_W : NODE_W;
                  const toH = toIsSmall ? SMALL_H : NODE_H;

                  const x1 = fromNode.x;
                  const y1 = fromNode.y;
                  const x2 = toNode.x;
                  const y2 = toNode.y;

                  const dx = x2 - x1;
                  const dy = y2 - y1;

                  let startX = x1;
                  let startY = y1;
                  let endX = x2;
                  let endY = y2;

                  if (Math.abs(dx) > Math.abs(dy)) {
                    startX = x1 + (dx > 0 ? fromW / 2 : -fromW / 2);
                    endX = x2 + (dx > 0 ? -toW / 2 : toW / 2);
                  } else {
                    startY = y1 + (dy > 0 ? fromH / 2 : -fromH / 2);
                    endY = y2 + (dy > 0 ? -toH / 2 : toH / 2);
                  }

                 const dist = Math.hypot(endX - startX, endY - startY);
                   const cp1x = startX + (dx > 0 ? Math.min(100, dist * 0.4) : -Math.min(100, dist * 0.4));
                   const cp1y = startY;
                   const cp2x = endX + (dx > 0 ? -Math.min(100, dist * 0.4) : Math.min(100, dist * 0.4));
                   const cp2y = endY;

                   const isHighlighted = activeNodeIds && activeNodeIds.includes(rel.from) && activeNodeIds.includes(rel.to);
                   const isFaded = activeNodeIds !== null && !isHighlighted;
                   const isHandledBy = rel.handledBy;
                   const midX = (startX + endX) / 2;
                   const midY = (startY + endY) / 2;
                   const isVertical = fromNode.x === toNode.x;

                   const pathD = isHandledBy && isVertical
                     ? `M ${startX} ${startY} L ${endX} ${endY}`
                     : `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

                   return (
                     <g key={rel.id} data-testid={`flowchart-edge-${idx}`} style={{ transition: 'opacity 0.3s', opacity: isFaded ? 0.1 : 0.8 }}>
                       <path
                         d={pathD}
                         stroke="#626880"
                         strokeWidth="1.5"
                         fill="none"
                         strokeOpacity="0.3"
                         markerEnd={isHandledBy ? '' : 'url(#flowchart-arrow)'}
                       />
                       <path
                         d={pathD}
                         stroke={isHighlighted ? '#8caaee' : (isHandledBy ? '#a6d189' : (rel.dashed ? '#e5c890' : '#8caaee'))}
                         strokeWidth={isHighlighted ? '2.5' : (isHandledBy ? '2' : '1.5')}
                         fill="none"
                         strokeOpacity={isHighlighted ? '0.95' : (isHandledBy ? '0.8' : '0.55')}
                         strokeDasharray={isHandledBy ? 'none' : (rel.dashed ? '4 4' : '6 7')}
                         markerEnd={isHandledBy ? 'url(#flowchart-arrow)' : (isHighlighted ? 'url(#flowchart-arrow-highlight)' : 'url(#flowchart-arrow)')}
                         className={rel.dashed ? '' : 'flowchart-edge-animated'}
                       />
                       {isHandledBy && (
                         <text
                           x={midX + (isVertical ? 12 : 0)}
                           y={midY - 6}
                           textAnchor={isVertical ? 'start' : 'middle'}
                           fill="#a6d189"
                           fontSize="9"
                           fontWeight="600"
                           opacity={isHighlighted ? '0.95' : '0.75'}
                           style={{ pointerEvents: 'none', userSelect: 'none' }}
                         >
                           handled by
                         </text>
                       )}
                     </g>
                   );
                })}

              {/* In-flight flow particles */}
              {currentJourney && particleRef && (
                <circle
                  ref={particleRef}
                  r="6"
                  fill="#8caaee"
                  opacity="0"
                  className="flowchart-particle"
                  data-testid="flowchart-particle"
                />
              )}

              {/* Smart Step Description Overlay */}
              {currentJourney && highlightedNodeId && currentDescription && (
                <g key={`panel-${currentStep}`} data-testid="flowchart-desc-panel" style={{ display: 'none' }}>
                  <text>{currentDescription}</text>
                </g>
              )}

              {/* Render Nodes as foreignObjects for auto-wrapping and premium cards */}
              {positioned.map(node => {
                const entity = localSchema.entities[node.id];
                if (!entity) return null;
                
                const viewType = entity.viewTypes[activeViewKey] || 'default';
                const isSmall = ( [TYPES.USER, TYPES.EXTERNAL, TYPES.HOTSPOT, TYPES.DECISION] as string[] ).includes(viewType);
                const nW = isSmall ? SMALL_W : NODE_W;
                const nH = isSmall ? SMALL_H : NODE_H;

                const x = node.x - nW / 2;
                const y = node.y - nH / 2;

                const isStepHighlighted = activeNodeIds && activeNodeIds.includes(node.id);
                const isDimmed = activeNodeIds !== null && !isStepHighlighted;
                const isSelected = selectedId === node.id && activeTab === 'entities';

                const isHighlighted = isStepHighlighted || (highlightedNodeId === node.id);
                
                const nodeFill = COLORS[viewType as keyof typeof COLORS] || COLORS.default;
                const strokeColor = BORDER_COLORS[viewType as keyof typeof BORDER_COLORS] || BORDER_COLORS.default;
                
                const iconName = ICONS[viewType as keyof typeof ICONS];
                const animClass = ICON_ANIMATIONS[viewType as keyof typeof ICON_ANIMATIONS] || '';
                const IconComponent = iconName ? (Icons as any)[iconName] : null;

                return (
                  <g
                    key={node.id}
                    data-testid={`flowchart-node-${node.id}`}
                    className="flowchart-node-group"
                    onMouseDown={(e) => onNodeMouseDown(e, node.id)}
                    onTouchStart={(e) => onNodeTouchStart(e, node.id)}
                    onMouseEnter={() => {
                      if (!dragRef.current.active && entity.desc) {
                        setTooltip({ description: entity.desc, x: node.x, y: node.y - nH/2 });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      opacity: isDimmed ? 0.25 : 1,
                      transition: 'opacity 0.3s, filter 0.3s'
                    }}
                  >
                    <rect
                      x={x} y={y}
                      width={nW} height={nH}
                      rx="8"
                      fill={nodeFill}
                      stroke={strokeColor}
                      strokeWidth="1.5"
                      filter={isHighlighted || isSelected ? 'url(#flowchart-glow)' : undefined}
                      className={`flowchart-node-rect ${isHighlighted ? 'flowchart-node-highlighted' : ''}`}
                    />
                    
                    <foreignObject x={x} y={y} width={nW} height={nH} style={{ pointerEvents: 'none' }}>
                      <div
                        className="flowchart-node-card"
                        style={{
                          width: '100%',
                          height: '100%',
                          padding: '10px',
                          boxSizing: 'border-box',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                          userSelect: 'none'
                        }}
                      >
                        <div
                          className="flowchart-node-meta"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                            paddingBottom: '4px',
                            marginBottom: '4px'
                          }}
                        >
                          {IconComponent && (
                            <span className={animClass} style={{ display: 'flex', alignItems: 'center' }}>
                              <IconComponent size={14} color={strokeColor} />
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '8px',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              opacity: 0.85,
                              color: strokeColor
                            }}
                          >
                            {viewType}
                          </span>
                        </div>
                        <div
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              textAlign: 'center',
                              fontWeight: 'bold',
                              lineHeight: 1.25,
                              fontSize: isSmall ? '10px' : '11px',
                              color: 'var(--ctp-text)',
                              display: '-webkit-box',
                              WebkitLineClamp: isSmall ? 2 : 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {entity.title}
                          </p>
                        </div>
                      </div>
                    </foreignObject>
                    
                    {/* Hide fallback render, keep SVG elements for screen readers / tests query */}
                    <text x={x} y={y} display="none">{entity.title}</text>
                    <text x={x} y={y} display="none">&lt;&lt;{viewType}&gt;&gt;</text>
                  </g>
                );
              })}

              {/* Static hover/touch Tooltip */}
              {tooltip && (() => {
                const lines = wrapTooltipText(tooltip.description);
                const ttW = 190;
                const ttPadX = 10;
                const ttPadY = 8;
                const ttLineH = 15;
                const ttH = ttPadY * 2 + lines.length * ttLineH;
                const ttX = tooltip.x - ttW / 2;
                const ttY = tooltip.y - ttH - 10;
                return (
                  <g style={{ pointerEvents: 'none' }}>
                    <rect
                      x={ttX} y={ttY}
                      width={ttW} height={ttH}
                      rx="6"
                      fill="#232634"
                      stroke="#51576d"
                      strokeWidth="1"
                      filter="url(#flowchart-tooltip-shadow)"
                    />
                    {lines.map((line, li) => (
                      <text
                        key={li}
                        x={ttX + ttPadX}
                        y={ttY + ttPadY + ttLineH * li + 11}
                        fontSize="10"
                        fill="#c6d0f5"
                      >
                        {line}
                      </text>
                    ))}
                  </g>
                );
              })()}

            </g>
          </svg>

          {/* Stepper carousel at bottom of canvas (renders if view or journey steps exist) */}
          {activeSteps && activeSteps.length > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: 0,
                right: 0,
                zIndex: 30,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pointerEvents: 'none'
              }}
            >
              {activeStep && (
                <button
                  onClick={() => {
                    setActiveStep(null);
                    animateTo(50, 100, 0.45);
                  }}
                  className="flowchart-btn"
                  style={{
                    marginBottom: '12px',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: 'var(--ctp-crust)',
                    color: 'var(--ctp-text)',
                    pointerEvents: 'auto',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  Clear Focus &times;
                </button>
              )}

              <div
                className="hide-scrollbar"
                style={{
                  width: '100%',
                  display: 'flex',
                  gap: '16px',
                  overflowX: 'auto',
                  paddingBottom: '16px',
                  paddingTop: '8px',
                  alignItems: 'center',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  pointerEvents: 'auto',
                  scrollBehavior: 'smooth'
                }}
              >
                {activeSteps.map((step: any, idx: number) => {
                  if (step.type === 'linear') {
                    const isActive = activeStep?.id === step.id;
                    return (
                      <div
                        id={`step-card-${step.id}`}
                        key={step.id}
                        onClick={() => handleStepClick(step)}
                        style={{
                          flexShrink: 0,
                          width: '256px',
                          padding: '12px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: isActive ? 'var(--ctp-blue)' : 'var(--border-light)',
                          backgroundColor: isActive ? 'var(--ctp-surface0)' : 'var(--ctp-base)',
                          transition: 'all 0.3s ease',
                          opacity: activeStep && !isActive ? 0.6 : 1
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '8px'
                          }}
                        >
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '1px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: isActive ? 'var(--ctp-blue)' : 'var(--ctp-surface1)',
                              color: isActive ? 'var(--ctp-crust)' : 'var(--ctp-text)'
                            }}
                          >
                            Phase {idx + 1}
                          </span>
                        </div>
                        <h3
                          style={{
                            margin: '0 0 4px 0',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: isActive ? 'var(--ctp-blue)' : 'var(--ctp-text)'
                          }}
                        >
                          {step.title}
                        </h3>
                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--ctp-subtext0)' }}>
                          {step.reason}
                        </p>
                      </div>
                    );
                  }

                  if (step.type === 'branch') {
                    return (
                      <div
                        key={step.id}
                        style={{
                          flexShrink: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          paddingLeft: '20px',
                          marginLeft: '8px',
                          borderLeft: '2px dashed var(--ctp-overlay1)',
                          position: 'relative'
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: '-11px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: 'var(--ctp-base)',
                            border: '2px solid var(--ctp-overlay1)',
                            borderRadius: '50%',
                            padding: '2px',
                            color: 'var(--ctp-text)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <GitBranch size={12} />
                        </div>
                        {step.branches.map((branch: any) => {
                          const isActive = activeStep?.id === branch.id;
                          return (
                            <div
                              id={`step-card-${branch.id}`}
                              key={branch.id}
                              onClick={() => handleStepClick(branch)}
                              style={{
                                width: '224px',
                                padding: '10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                border: '1px solid',
                                borderColor: isActive ? 'var(--ctp-blue)' : 'var(--border-light)',
                                backgroundColor: isActive ? 'var(--ctp-surface0)' : 'var(--ctp-base)',
                                transition: 'all 0.3s ease',
                                opacity: activeStep && !isActive ? 0.6 : 1
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: '4px'
                                }}
                              >
                                <h3
                                  style={{
                                    margin: 0,
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    color: isActive ? 'var(--ctp-blue)' : 'var(--ctp-text)'
                                  }}
                                >
                                  {branch.title}
                                </h3>
                              </div>
                              <p style={{ margin: 0, fontSize: '10px', color: 'var(--ctp-subtext0)' }}>
                                {branch.reason}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </div>

        {renderSidebar()}
      </div>


    </div>
  );
}

SectionRegistry.register('flowchart', Flowchart as ComponentType<unknown>);

export default Flowchart;
