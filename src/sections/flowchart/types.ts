import * as Icons from 'lucide-react';

const Component = Icons.Component;
const Server = Icons.Server;
const Share2 = Icons.Share2;
const Layers = Icons.Layers;
const List = Icons.List;

export const TYPES = {
  EVENT: 'Event', COMMAND: 'Command', AGGREGATE: 'Aggregate', POLICY: 'Policy', 
  READ_MODEL: 'Read Model', USER: 'Actor', EXTERNAL: 'External API', HOTSPOT: 'Risk',
  SERVICE: 'Service', DATABASE: 'Database', PROCESS: 'Process', 
  DATA_OBJECT: 'Data Object', DECISION: 'Decision', CORE_SYSTEM: 'Core System'
} as const;

/**
 * Per-type accent token (CSS custom property) for each node type.
 * Colors resolve from the active theme's --ctp-* palette, so the
 * flowchart re-themes automatically. Node fills are a light tint of
 * the accent over the theme surface (via color-mix); borders use the
 * accent directly.
 */
const ACCENT_VARS = {
  [TYPES.EVENT]:       'var(--ctp-peach)',
  [TYPES.COMMAND]:     'var(--ctp-blue)',
  [TYPES.AGGREGATE]:   'var(--ctp-surface2)',
  [TYPES.POLICY]:      'var(--ctp-mauve)',
  [TYPES.READ_MODEL]:  'var(--ctp-lavender)',
  [TYPES.USER]:        'var(--ctp-yellow)',
  [TYPES.EXTERNAL]:    'var(--ctp-green)',
  [TYPES.HOTSPOT]:     'var(--ctp-red)',
  [TYPES.SERVICE]:     'var(--ctp-sapphire)',
  [TYPES.DATABASE]:    'var(--ctp-teal)',
  [TYPES.PROCESS]:     'var(--ctp-sky)',
  [TYPES.DATA_OBJECT]: 'var(--ctp-pink)',
  [TYPES.DECISION]:    'var(--ctp-maroon)',
  [TYPES.CORE_SYSTEM]: 'var(--ctp-rosewater)',
  default:             'var(--ctp-surface2)'
} as const;

const tint = (accent: string) =>
  `color-mix(in srgb, ${accent} 16%, var(--ctp-surface0))`;

export const COLORS = Object.fromEntries(
  Object.entries(ACCENT_VARS).map(([type, accent]) => [type, tint(accent)])
) as Record<keyof typeof ACCENT_VARS, string>;

export const BORDER_COLORS = ACCENT_VARS;

export const ICONS = {
  [TYPES.EVENT]: 'Zap', [TYPES.COMMAND]: 'Terminal', [TYPES.AGGREGATE]: 'Database', 
  [TYPES.POLICY]: 'ShieldAlert', [TYPES.READ_MODEL]: 'Eye', [TYPES.USER]: 'User', 
  [TYPES.EXTERNAL]: 'Cloud', [TYPES.HOTSPOT]: 'AlertTriangle', [TYPES.SERVICE]: 'Server',
  [TYPES.DATABASE]: 'Database', [TYPES.PROCESS]: 'Activity', [TYPES.DATA_OBJECT]: 'FileText',
  [TYPES.DECISION]: 'GitBranch', [TYPES.CORE_SYSTEM]: 'Cpu'
} as const;

export const ICON_ANIMATIONS = {
  [TYPES.EVENT]: '', [TYPES.COMMAND]: '', [TYPES.AGGREGATE]: '',
  [TYPES.POLICY]: '', [TYPES.READ_MODEL]: '', [TYPES.USER]: '',
  [TYPES.EXTERNAL]: '', [TYPES.HOTSPOT]: '', [TYPES.SERVICE]: '',
  [TYPES.DATABASE]: '', [TYPES.PROCESS]: '', [TYPES.DATA_OBJECT]: '',
  [TYPES.DECISION]: '', [TYPES.CORE_SYSTEM]: ''
} as const;

export const DYNAMIC_ICONS = { Component, Server, Share2, Layers, List };

export const MASTER_MAPPING_MATRIX: Record<string, Record<string, string | null>> = {
  [TYPES.EVENT]: {
    EVENT_STORMING: TYPES.EVENT,
    SYS_ARCH: null,
    SWIMLANES: null,
    SEQUENCE: null,
    DATA_FLOW: TYPES.DATA_OBJECT,
    STATE_MACHINE: TYPES.DATA_OBJECT
  },
  [TYPES.COMMAND]: {
    EVENT_STORMING: TYPES.COMMAND,
    SYS_ARCH: null,
    SWIMLANES: TYPES.PROCESS,
    SEQUENCE: null,
    DATA_FLOW: null,
    STATE_MACHINE: null
  },
  [TYPES.POLICY]: {
    EVENT_STORMING: TYPES.POLICY,
    SYS_ARCH: null,
    SWIMLANES: TYPES.DECISION,
    SEQUENCE: null,
    DATA_FLOW: TYPES.DECISION,
    STATE_MACHINE: null
  },
  [TYPES.AGGREGATE]: {
    EVENT_STORMING: TYPES.AGGREGATE,
    SYS_ARCH: TYPES.SERVICE,
    SWIMLANES: null,
    SEQUENCE: TYPES.SERVICE,
    DATA_FLOW: null,
    STATE_MACHINE: TYPES.AGGREGATE
  },
  [TYPES.DATABASE]: {
    EVENT_STORMING: TYPES.DATABASE,
    SYS_ARCH: TYPES.DATABASE,
    SWIMLANES: TYPES.DATABASE,
    SEQUENCE: TYPES.DATABASE,
    DATA_FLOW: null,
    STATE_MACHINE: null
  },
  [TYPES.USER]: {
    EVENT_STORMING: TYPES.USER,
    SYS_ARCH: TYPES.USER,
    SWIMLANES: TYPES.USER,
    SEQUENCE: TYPES.USER,
    DATA_FLOW: TYPES.USER,
    STATE_MACHINE: null
  },
  [TYPES.EXTERNAL]: {
    EVENT_STORMING: TYPES.EXTERNAL,
    SYS_ARCH: TYPES.EXTERNAL,
    SWIMLANES: null,
    SEQUENCE: TYPES.EXTERNAL,
    DATA_FLOW: null,
    STATE_MACHINE: null
  },
  [TYPES.HOTSPOT]: {
    EVENT_STORMING: TYPES.HOTSPOT,
    SYS_ARCH: null,
    SWIMLANES: null,
    SEQUENCE: null,
    DATA_FLOW: TYPES.HOTSPOT,
    STATE_MACHINE: null
  },
  [TYPES.READ_MODEL]: {
    EVENT_STORMING: TYPES.READ_MODEL,
    SYS_ARCH: null,
    SWIMLANES: null,
    SEQUENCE: null,
    DATA_FLOW: TYPES.DATA_OBJECT,
    STATE_MACHINE: null
  }
};

export const NODE_W = 140; 
export const NODE_H = 100;

export const PROCESS_GROUP_STATE_MAP: Record<ProcessGroup, string> = {
  planning: 'PLANNING',
  execution: 'EXECUTING',
  evaluation: 'EVALUATING',
  escalation: 'ESCALATED',
};

/** Maps a journey step's event node id to the corresponding state-machine state id. */
export const STEP_EVENT_TO_STATE_MAP: Record<string, string> = {
  evt_order_placed: 'PENDING',
  evt_inventory_locked: 'INVENTORY_LOCKED',
  evt_payment_authorized: 'PAYMENT_AUTHORIZED',
  evt_fraud_evaluated: 'FRAUD_CLEARED',
  evt_fraud_flagged: 'FRAUD_REVIEW',
  evt_review_decision: 'FRAUD_REVIEW',
  evt_order_confirmed: 'CONFIRMED',
  evt_order_approved: 'CONFIRMED',
  evt_order_cancelled: 'CANCELLED',

  evt_uploaded: 'QUEUED',
  evt_extracted: 'EXTRACTING',
  evt_validated: 'VALIDATING',
  evt_approved: 'HIGH_CONFIDENCE',
  evt_flagged: 'LOW_CONFIDENCE',
  evt_audited: 'AUDITED',
  evt_completed: 'COMPLETED',

  evt_goal: 'IDLE',
  evt_plan: 'PLANNING',
  evt_exec: 'EXECUTING',
  evt_eval: 'EVALUATING',
  evt_escalate: 'ESCALATED',

  evt_started: 'IDLE',
  evt_reasoned: 'THINKING',
  evt_tool_executed: 'EXECUTING_TOOL',
  evt_done: 'COMPLETED'
};

export interface FlowchartStateMachineState {
  id: string;
  label: string;
  color: string;
}

export interface FlowchartStateMachine {
  states: FlowchartStateMachineState[];
  initialState: string;
}

export interface FlowchartEntity {
  title: string;
  /** Per-view title override — falls back to `title` when absent. */
  viewTitles?: Record<string, string>;
  desc: string;
  /** Single entity type representing the Event Storming source of truth node type. */
  type?: string;
  /** Deprecated: use `type` instead. Retained for backward compatibility. */
  viewTypes?: Record<string, string>;
  /** JSON payload for a specific DFD node (shown in inspector during playback). */
  jsonPayload?: Record<string, unknown>;
  color?: string;
  strokeColor?: string;
  stateMachine?: FlowchartStateMachine;
  /** Store branching condition label when multiple policies are merged */
  branchLabel?: string;
  /** Canonical entity ID this node collapses to in derived views (SYS_ARCH, SWIMLANES, etc.). */
  collapsedTo?: string;
}

export interface FlowchartRelation {
  id: string;
  from: string;
  to: string;
  views?: string[];
  dashed?: boolean;
  handledBy?: boolean;
  label?: string;
  chronologicalIndex?: number;
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

export type ProcessGroup = 'planning' | 'execution' | 'evaluation' | 'escalation';

export interface FlowchartStep {
  nodeId?: string;
  nodeIds?: string[];
  description: string;
  processGroup?: ProcessGroup;
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

/** Layout metadata computed by the dynamic layout engine. */
export interface LayoutInfo {
  /** Total number of rows in the grid. */
  rowCount: number;
  /** Total number of columns in the grid. */
  colCount: number;
  /** Total number of nodes in the view. */
  nodeCount: number;
}

export interface FlowchartViewConfig {
  name: string;
  icon: string;
  nodes: FlowchartViewNode[];
  groups: FlowchartViewGroup[];
  steps?: FlowchartStepData[];
  /** Computed layout metadata for dynamic spacing. */
  layoutInfo?: LayoutInfo;
}

export interface UnifiedFlowchartSchema {
  entities: Record<string, FlowchartEntity>;
  relations: FlowchartRelation[];
  /** Optional: when absent, views are auto-derived from entities & relations. */
  views?: Record<string, FlowchartViewConfig>;
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


