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
    SYS_ARCH: TYPES.SERVICE,
    SWIMLANES: TYPES.DECISION,
    SEQUENCE: null,
    DATA_FLOW: TYPES.DECISION,
    STATE_MACHINE: null
  },
  [TYPES.AGGREGATE]: {
    EVENT_STORMING: TYPES.AGGREGATE,
    SYS_ARCH: TYPES.SERVICE,
    SWIMLANES: TYPES.PROCESS,
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
    SWIMLANES: TYPES.EXTERNAL,
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
  /** Reference IDs that refer to this canonical entity. */
  refs?: string[];
  /** Maps this fine-grained entity to a collapsed/high-level entity ID in other views. */
  collapsedTo?: string;
  /** State machine definition for this aggregate (shown in inspector). */
  stateMachine?: FlowchartStateMachine;
  /** JSON payload for a specific DFD node (shown in inspector during playback). */
  jsonPayload?: Record<string, unknown>;
  color?: string;
  strokeColor?: string;
}

export interface FlowchartRelation {
  id: string;
  from: string;
  to: string;
  views?: string[];
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


