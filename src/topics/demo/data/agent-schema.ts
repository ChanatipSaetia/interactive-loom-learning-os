import { TYPES } from '../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../sections/flowchart'

export const agentSchema: UnifiedFlowchartSchema = {
  entities: {
    'user': {
      title: 'User',
      desc: 'The human (or client system) initiating goals or receiving results.',
      viewTypes: {
        EVENT_STORMING: TYPES.USER,
        SYS_ARCH: TYPES.USER,
        DATA_FLOW: TYPES.USER,
        SWIMLANES: TYPES.USER,
        SEQUENCE: TYPES.USER,
      }
    },
    'human_reviewer': {
      title: 'Human Reviewer',
      desc: 'Subject-matter expert who reviews failed evaluation results.',
      viewTypes: {
        EVENT_STORMING: TYPES.USER,
        SYS_ARCH: TYPES.USER,
        SWIMLANES: TYPES.USER,
      }
    },
    'orchestrator': {
      title: 'Orchestrator',
      desc: 'Core agent runtime owning the planning and evaluation loops.',
      viewTypes: {
        SYS_ARCH: TYPES.AGGREGATE,
        SWIMLANES: TYPES.AGGREGATE,
        SEQUENCE: TYPES.AGGREGATE,
      }
    },
    'orch_plan': {
      title: 'Orchestrator',
      desc: 'Handles planning: creates execution plan, tracks progression, retrieves memory.',
      viewTypes: {
        EVENT_STORMING: TYPES.AGGREGATE,
      },
      collapsedTo: 'orchestrator'
    },
    'orch_eval': {
      title: 'Orchestrator',
      desc: 'Handles evaluation: assesses result quality, decides pass or fail.',
      viewTypes: {
        EVENT_STORMING: TYPES.AGGREGATE,
      },
      collapsedTo: 'orchestrator'
    },
    'llm': {
      title: 'LLM Engine',
      desc: 'Large language model performing prompt parsing and reasoning.',
      viewTypes: {
        EVENT_STORMING: TYPES.EXTERNAL,
        SYS_ARCH: TYPES.EXTERNAL,
        SWIMLANES: TYPES.EXTERNAL,
        SEQUENCE: TYPES.EXTERNAL,
      }
    },
    'evt_goal': {
      title: 'Goal Submitted',
      viewTitles: { DATA_FLOW: 'Goal Text' },
      desc: 'User submitted a natural-language goal.',
      viewTypes: {
        EVENT_STORMING: TYPES.EVENT,
        DATA_FLOW: TYPES.DATA_OBJECT,
      }
    },
    'evt_plan_ready': {
      title: 'Plan Generated',
      viewTitles: { DATA_FLOW: 'Execution Plan' },
      desc: 'Multi-step execution plan written to working memory.',
      viewTypes: {
        EVENT_STORMING: TYPES.EVENT,
        DATA_FLOW: TYPES.DATA_OBJECT,
      }
    },
    'evt_executed': {
      title: 'Tool Executed',
      viewTitles: { DATA_FLOW: 'Tool Output' },
      desc: 'Output retrieved from sandbox execution.',
      viewTypes: {
        EVENT_STORMING: TYPES.EVENT,
        DATA_FLOW: TYPES.DATA_OBJECT,
      }
    },
    'evt_done': {
      title: 'Goal Satisfied',
      desc: 'Evaluation passes, ready to reply.',
      viewTypes: { EVENT_STORMING: TYPES.EVENT }
    },
    'evt_fail': {
      title: 'Goal Not Satisfied',
      viewTitles: { DATA_FLOW: 'Failure Report' },
      desc: 'Evaluation fails, requiring re-planning.',
      viewTypes: {
        EVENT_STORMING: TYPES.EVENT,
        DATA_FLOW: TYPES.DATA_OBJECT,
      }
    },
    'evt_reviewed': {
      title: 'Result Reviewed',
      viewTitles: { DATA_FLOW: 'Corrected Feedback' },
      desc: 'Human feedback captured, ready for re-planning.',
      viewTypes: {
        EVENT_STORMING: TYPES.EVENT,
        DATA_FLOW: TYPES.DATA_OBJECT,
      }
    },
    'pol_plan': {
      title: 'Plan on New Goal',
      desc: 'When Goal Submitted, create an execution plan.',
      viewTypes: { EVENT_STORMING: TYPES.POLICY }
    },
    'tools': {
      title: 'Route Next Step',
      viewTitles: { SYS_ARCH: 'Tool Router', SWIMLANES: 'Tool Router' },
      desc: 'Selects appropriate external APIs or scripts for a given task.',
      viewTypes: {
        EVENT_STORMING: TYPES.POLICY,
        SYS_ARCH: TYPES.SERVICE,
        SWIMLANES: TYPES.PROCESS,
      }
    },
    'pol_eval': {
      title: 'Evaluate on Result',
      desc: 'When Tool Executed, evaluate the output.',
      viewTypes: { EVENT_STORMING: TYPES.POLICY }
    },
    'pol_retry': {
      title: 'Re-Plan on Failure',
      desc: 'When Goal Not Satisfied, re-plan and try again.',
      viewTypes: { EVENT_STORMING: TYPES.POLICY }
    },
    'pol_escalate': {
      title: 'Escalate to Human',
      desc: 'When Goal Not Satisfied, escalate to human reviewer.',
      viewTypes: {
        EVENT_STORMING: TYPES.POLICY,
        SYS_ARCH: TYPES.HOTSPOT,
        SWIMLANES: TYPES.DECISION,
      }
    },
    'planner': {
      title: 'Create Plan',
      viewTitles: { SYS_ARCH: 'Planner', SWIMLANES: 'Planner', SEQUENCE: 'Planner' },
      desc: 'Formulates multi-step actions (e.g. CoT, ReAct plan) dynamically.',
      viewTypes: {
        EVENT_STORMING: TYPES.COMMAND,
        SYS_ARCH: TYPES.SERVICE,
        SWIMLANES: TYPES.PROCESS,
        SEQUENCE: TYPES.SERVICE,
      }
    },
    'executor': {
      title: 'Run Tool',
      viewTitles: { SYS_ARCH: 'Tool Executor', SWIMLANES: 'Tool Executor', SEQUENCE: 'Executor' },
      desc: 'Executes actions (HTTP search, sandboxed script, API requests).',
      viewTypes: {
        EVENT_STORMING: TYPES.COMMAND,
        SYS_ARCH: TYPES.SERVICE,
        SWIMLANES: TYPES.PROCESS,
        SEQUENCE: TYPES.SERVICE,
      }
    },
    'evaluator': {
      title: 'Evaluate Result',
      viewTitles: { SYS_ARCH: 'Evaluator', SWIMLANES: 'Evaluator', SEQUENCE: 'Evaluator' },
      desc: 'Tests execution outputs against success conditions.',
      viewTypes: {
        EVENT_STORMING: TYPES.COMMAND,
        SYS_ARCH: TYPES.SERVICE,
        SWIMLANES: TYPES.DECISION,
        SEQUENCE: TYPES.SERVICE,
      }
    },
    'cmd_review': {
      title: 'Review Result',
      desc: 'Human reviews the failed output and provides feedback.',
      viewTypes: { EVENT_STORMING: TYPES.COMMAND },
      collapsedTo: 'human_reviewer'
    },
    'memory': {
      title: 'Memory Storage',
      desc: 'Retrieves conversational logs and semantic vectors (long-term database).',
      viewTypes: {
        EVENT_STORMING: TYPES.DATABASE,
        SYS_ARCH: TYPES.DATABASE,
        SWIMLANES: TYPES.DATABASE,
      }
    },
    'output': {
      title: 'Final Response',
      desc: 'The verified markdown output returned to the caller.',
      viewTypes: {
        EVENT_STORMING: TYPES.DATA_OBJECT,
        DATA_FLOW: TYPES.DATA_OBJECT,
        SWIMLANES: TYPES.DATA_OBJECT,
      }
    },
  },
  relations: [
    // ── EVENT STORMING ───────────────────────────────────────────────
    // Phase 1: Cognition & Planning
    { id: 'r_es_1',  from: 'user',           to: 'evt_goal',        views: ['EVENT_STORMING'] },
    { id: 'r_es_2',  from: 'evt_goal',       to: 'pol_plan',        views: ['EVENT_STORMING'] },
    { id: 'r_es_3',  from: 'pol_plan',       to: 'planner',         views: ['EVENT_STORMING'] },
    { id: 'r_es_4',  from: 'planner',        to: 'orch_plan',       views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_5',  from: 'orch_plan',      to: 'evt_plan_ready',  views: ['EVENT_STORMING'] },
    { id: 'r_es_6',  from: 'orch_plan',      to: 'memory',          views: ['EVENT_STORMING'] },
    // Phase 2: Action Execution
    { id: 'r_es_7',  from: 'evt_plan_ready', to: 'tools',           views: ['EVENT_STORMING'] },
    { id: 'r_es_8',  from: 'tools',          to: 'executor',        views: ['EVENT_STORMING'] },
    { id: 'r_es_10', from: 'executor',       to: 'llm',             views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_11', from: 'llm',            to: 'evt_executed',    views: ['EVENT_STORMING'] },
    // Phase 3: Evaluation & Output
    { id: 'r_es_12', from: 'evt_executed',   to: 'pol_eval',        views: ['EVENT_STORMING'] },
    { id: 'r_es_13', from: 'pol_eval',       to: 'evaluator',       views: ['EVENT_STORMING'] },
    { id: 'r_es_14', from: 'evaluator',      to: 'orch_eval',       views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_15', from: 'orch_eval',      to: 'evt_done',        views: ['EVENT_STORMING'] },
    { id: 'r_es_16', from: 'orch_eval',      to: 'evt_fail',        views: ['EVENT_STORMING'] },
    { id: 'r_es_17', from: 'evt_done',       to: 'output',          views: ['EVENT_STORMING'] },
    // Failure branching
    { id: 'r_es_18', from: 'evt_fail',       to: 'pol_retry',       views: ['EVENT_STORMING'] },
    { id: 'r_es_19', from: 'pol_retry',      to: 'planner',         views: ['EVENT_STORMING'], dashed: true },
    { id: 'r_es_20', from: 'evt_fail',       to: 'pol_escalate',    views: ['EVENT_STORMING'] },
    { id: 'r_es_21', from: 'pol_escalate',   to: 'cmd_review',      views: ['EVENT_STORMING'] },
    { id: 'r_es_22', from: 'cmd_review',     to: 'human_reviewer',  views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_23', from: 'human_reviewer', to: 'evt_reviewed',    views: ['EVENT_STORMING'] },
    { id: 'r_es_24', from: 'evt_reviewed',   to: 'planner',         views: ['EVENT_STORMING'], dashed: true },

    // ── SYSTEM ARCHITECTURE ──────────────────────────────────────────
    { id: 'r_sa_1',  from: 'user',          to: 'orchestrator',   views: ['SYS_ARCH'] },
    { id: 'r_sa_2',  from: 'orchestrator',  to: 'planner',        views: ['SYS_ARCH'] },
    { id: 'r_sa_3',  from: 'orchestrator',  to: 'memory',         views: ['SYS_ARCH'] },
    { id: 'r_sa_4',  from: 'planner',       to: 'tools',          views: ['SYS_ARCH'] },
    { id: 'r_sa_5',  from: 'tools',         to: 'llm',            views: ['SYS_ARCH'] },
    { id: 'r_sa_6',  from: 'llm',           to: 'executor',       views: ['SYS_ARCH'] },
    { id: 'r_sa_7',  from: 'tools',         to: 'executor',       views: ['SYS_ARCH'] },
    { id: 'r_sa_8',  from: 'executor',      to: 'evaluator',      views: ['SYS_ARCH'] },
    { id: 'r_sa_9',  from: 'evaluator',     to: 'user',           views: ['SYS_ARCH'] },
    { id: 'r_sa_10', from: 'evaluator',     to: 'pol_escalate',   views: ['SYS_ARCH'] },
    { id: 'r_sa_11', from: 'pol_escalate',  to: 'human_reviewer', views: ['SYS_ARCH'] },
    { id: 'r_sa_12', from: 'human_reviewer',to: 'orchestrator',   views: ['SYS_ARCH'], dashed: true },

    // ── DATA FLOW ────────────────────────────────────────────────────
    // Happy path: data transforms left → right
    { id: 'r_df_1',  from: 'user',           to: 'evt_goal',        views: ['DATA_FLOW'] },
    { id: 'r_df_2',  from: 'evt_goal',       to: 'evt_plan_ready',  views: ['DATA_FLOW'] },
    { id: 'r_df_3',  from: 'evt_plan_ready', to: 'evt_executed',    views: ['DATA_FLOW'] },
    { id: 'r_df_4',  from: 'evt_executed',   to: 'output',          views: ['DATA_FLOW'] },
    { id: 'r_df_5',  from: 'output',         to: 'user',            views: ['DATA_FLOW'] },
    // Failure branch: data diverts down then loops back
    { id: 'r_df_6',  from: 'evt_executed',   to: 'evt_fail',        views: ['DATA_FLOW'] },
    { id: 'r_df_7',  from: 'evt_fail',       to: 'evt_reviewed',    views: ['DATA_FLOW'] },
    { id: 'r_df_8',  from: 'evt_reviewed',   to: 'evt_plan_ready',  views: ['DATA_FLOW'], dashed: true },

    // ── SWIMLANES ────────────────────────────────────────────────────
    { id: 'r_sl_1',  from: 'user',           to: 'orchestrator',    views: ['SWIMLANES'] },
    { id: 'r_sl_2',  from: 'orchestrator',   to: 'memory',          views: ['SWIMLANES'] },
    { id: 'r_sl_3',  from: 'orchestrator',   to: 'planner',         views: ['SWIMLANES'] },
    { id: 'r_sl_4',  from: 'planner',        to: 'tools',           views: ['SWIMLANES'] },
    { id: 'r_sl_5',  from: 'tools',          to: 'llm',             views: ['SWIMLANES'] },
    { id: 'r_sl_6',  from: 'llm',            to: 'executor',        views: ['SWIMLANES'] },
    { id: 'r_sl_7',  from: 'executor',       to: 'evaluator',       views: ['SWIMLANES'] },
    { id: 'r_sl_8',  from: 'evaluator',      to: 'output',          views: ['SWIMLANES'] },
    { id: 'r_sl_9',  from: 'output',         to: 'user',            views: ['SWIMLANES'] },
    { id: 'r_sl_10', from: 'evaluator',      to: 'pol_escalate',    views: ['SWIMLANES'] },
    { id: 'r_sl_11', from: 'pol_escalate',   to: 'human_reviewer',  views: ['SWIMLANES'] },
    { id: 'r_sl_12', from: 'human_reviewer', to: 'orchestrator',    views: ['SWIMLANES'], dashed: true },

    // ── SEQUENCE ─────────────────────────────────────────────────────
    { id: 'r_sq_1', from: 'user',         to: 'orchestrator', views: ['SEQUENCE'], label: 'submit goal' },
    { id: 'r_sq_2', from: 'orchestrator', to: 'planner',      views: ['SEQUENCE'], label: 'create plan' },
    { id: 'r_sq_3', from: 'planner',      to: 'orchestrator', views: ['SEQUENCE'], label: 'plan ready' },
    { id: 'r_sq_4', from: 'orchestrator', to: 'executor',     views: ['SEQUENCE'], label: 'run tool' },
    { id: 'r_sq_5', from: 'executor',     to: 'llm',          views: ['SEQUENCE'], label: 'execute' },
    { id: 'r_sq_6', from: 'llm',          to: 'executor',     views: ['SEQUENCE'], label: 'result' },
    { id: 'r_sq_7', from: 'executor',     to: 'evaluator',    views: ['SEQUENCE'], label: 'check output' },
    { id: 'r_sq_8', from: 'evaluator',    to: 'orchestrator', views: ['SEQUENCE'], label: 'pass/fail' },
    { id: 'r_sq_9', from: 'orchestrator', to: 'user',         views: ['SEQUENCE'], label: 'final response' },
  ],
  views: {
    EVENT_STORMING: {
      name: 'Event Storming',
      icon: 'Component',
      nodes: [
        // Phase 1: Cognition & Planning  (cols 0–4)
        { id: 'user', grid: [0, 2] },
        { id: 'evt_goal', grid: [1, 2] },
        { id: 'pol_plan', grid: [2, 2] },
        { id: 'planner', grid: [3, 2] },
        { id: 'evt_plan_ready', grid: [4, 2] },
        // Stacked: handler above command, database above handler
        { id: 'orch_plan', grid: [3, 1] },
        { id: 'memory', grid: [3, 0] },
        // Phase 2: Action Execution  (cols 6–8, gap at col 5)
        { id: 'tools', grid: [6, 2] },
        { id: 'executor', grid: [7, 2] },
        { id: 'evt_executed', grid: [8, 2] },
        // Stacked: handler above command
        { id: 'llm', grid: [7, 1] },
        // Phase 3: Evaluation & Output  (cols 10–13, gap at col 9)
        { id: 'pol_eval', grid: [10, 2] },
        { id: 'evaluator', grid: [11, 2] },
        { id: 'evt_done', grid: [12, 2] },
        { id: 'output', grid: [13, 2] },
        // Stacked: handler above command
        { id: 'orch_eval', grid: [11, 1] },
        // Failure Branch 1: Re-Plan  (row 3, starts at col 12)
        { id: 'evt_fail', grid: [12, 3] },
        { id: 'pol_retry', grid: [13, 3] },
        // Failure Branch 2: Human Escalation  (row 4, starts at col 13)
        { id: 'pol_escalate', grid: [13, 4] },
        { id: 'cmd_review', grid: [14, 4] },
        { id: 'evt_reviewed', grid: [15, 4] },
        // Stacked: handler above command on branch row
        { id: 'human_reviewer', grid: [14, 3] },
      ],
      groups: [
        { id: 'es_g1', title: 'Cognition & Planning', desc: 'Goal triggers policy, Create Plan command handled by Orchestrator, plan generated.', nodeIds: ['evt_goal','pol_plan','planner','orch_plan','memory','evt_plan_ready'], color: 'rgba(140,170,238,0.12)', borderColor: '#8caaee', textColor: '#c6d0f5' },
        { id: 'es_g2', title: 'Action Space Execution', desc: 'Execute Next Step policy routes to LLM, Run Tool handled by LLM, result captured.', nodeIds: ['tools','llm','executor','evt_executed'], color: 'rgba(244,184,228,0.12)', borderColor: '#f4b8e4', textColor: '#c6d0f5' },
        { id: 'es_g3', title: 'Evaluation & Happy Path', desc: 'Evaluate on Result policy, Evaluate Result handled by Orchestrator, Goal Satisfied.', nodeIds: ['pol_eval','evaluator','orch_eval','evt_done','output'], color: 'rgba(229,200,144,0.12)', borderColor: '#e5c890', textColor: '#c6d0f5' },
        { id: 'es_g4', title: 'Failure Recovery', desc: 'Goal Not Satisfied branches to auto re-planning or human review.', nodeIds: ['evt_fail','pol_retry','pol_escalate','cmd_review','human_reviewer','evt_reviewed'], color: 'rgba(231,130,132,0.12)', borderColor: '#e78284', textColor: '#c6d0f5' },
      ]
    },
    SYS_ARCH: {
      name: 'System Architecture',
      icon: 'Server',
      nodes: [
        // Hub-and-spoke: orchestrator at center [3,2]
        { id: 'user', grid: [1, 2] },
        { id: 'orchestrator', grid: [3, 2] },
        { id: 'planner', grid: [2, 1] },
        { id: 'memory', grid: [2, 3] },
        { id: 'tools', grid: [5, 2] },
        { id: 'executor', grid: [5, 1] },
        { id: 'evaluator', grid: [5, 3] },
        { id: 'llm', grid: [6, 0] },
        { id: 'pol_escalate', grid: [4, 4] },
        { id: 'human_reviewer', grid: [3, 4] },
      ],
      groups: [
        {
          id: 'sa_boundary',
          title: 'Agent System',
          desc: 'Everything built and operated within our control — the cognitive loop, tool execution, evaluation, and escalation policy.',
          nodeIds: ['orchestrator', 'planner', 'memory', 'tools', 'executor', 'evaluator', 'pol_escalate'],
          color: 'rgba(129,200,190,0.06)',
          borderColor: '#81c8be',
          textColor: '#c6d0f5',
        }
      ]
    },
    DATA_FLOW: {
      name: 'Data Flow (DFD)',
      icon: 'Share2',
      nodes: [
        // Row 1 (main): left-to-right data transformation pipeline
        { id: 'user', grid: [0, 1] },
        { id: 'evt_goal', grid: [2, 1] },
        { id: 'evt_plan_ready', grid: [4, 1] },
        { id: 'evt_executed', grid: [6, 1] },
        { id: 'output', grid: [8, 1] },
        // Row 2 (failure branch): data diverts down then loops back left
        { id: 'evt_fail', grid: [6, 2] },
        { id: 'evt_reviewed', grid: [4, 2] },
      ],
      groups: []
    },
    SWIMLANES: {
      name: 'Activity Swimlanes',
      icon: 'Layers',
      nodes: [
        // Lane 0 — Actors (row 0)
        { id: 'user', grid: [0, 0] },
        { id: 'human_reviewer', grid: [8, 0] },
        { id: 'output', grid: [10, 0] },
        // Lane 1 — System: orchestration row (row 1)
        { id: 'orchestrator', grid: [2, 1] },
        { id: 'planner', grid: [3, 1] },
        { id: 'memory', grid: [4, 1] },
        { id: 'evaluator', grid: [7, 1] },
        // Lane 1 — System: execution row (row 2)
        { id: 'tools', grid: [4, 2] },
        { id: 'executor', grid: [6, 2] },
        { id: 'pol_escalate', grid: [8, 2] },
        // Lane 2 — External Systems (row 3)
        { id: 'llm', grid: [5, 3] },
      ],
      groups: [
        { id: 'sl_l1', isLane: true, title: 'Actors', desc: 'Human actors initiating requests or reviewing failures.', row: 0, color: 'rgba(239,159,118,0.10)' },
        { id: 'sl_l2', isLane: true, title: 'Agent System', desc: 'Internal components — orchestration (top) and execution (bottom).', y: 200, h: 330, color: 'rgba(153,209,219,0.10)' },
        { id: 'sl_l3', isLane: true, title: 'External Systems', desc: 'Third-party APIs and models utilized by the system.', row: 3, color: 'rgba(186,187,241,0.10)' },
      ]
    },
    SEQUENCE: {
      name: 'Sequence Diagram',
      icon: 'List',
      nodes: [
        { id: 'user', grid: [0, 0] },
        { id: 'orchestrator', grid: [1, 0] },
        { id: 'planner', grid: [2, 0] },
        { id: 'executor', grid: [3, 0] },
        { id: 'llm', grid: [4, 0] },
        { id: 'evaluator', grid: [5, 0] }
      ],
      groups: []
    }
  },
  journeys: [
    {
      id: 'happy-path',
      label: 'Agentic Problem Solving Loop',
      description: 'Follow the execution plan as it transitions from the orchestrator through the LLM, resolves tools, and returns the response.',
      steps: [
        { nodeIds: ['user', 'evt_goal'], description: 'Goal Submitted — User submits: "Research top 3 competitors and summarise."' },
        { nodeIds: ['pol_plan', 'planner', 'orch_plan', 'memory', 'evt_plan_ready'], description: 'Cognition & Planning — Policy "Plan on New Goal" fires. "Create Plan" command handled by Orchestrator (Aggregate). Memory fetches context. Plan Generated event published.' },
        { nodeIds: ['tools', 'executor', 'llm', 'evt_executed'], description: 'Action Execution — "Run Tool" command handled by LLM (External). Tool Executed event published.' },
        { nodeIds: ['pol_eval', 'evaluator', 'orch_eval', 'evt_done', 'output'], description: 'Evaluation (Happy Path) — Policy "Evaluate on Result" fires. "Evaluate Result" handled by Orchestrator. Goal Satisfied → Final Response delivered.' },
        { nodeIds: ['evt_fail', 'pol_retry', 'planner'], description: 'Failure Branch (Auto Re-Plan) — Goal Not Satisfied triggers "Re-Plan on Failure" policy, loops back to "Create Plan" command.' },
        { nodeIds: ['evt_fail', 'pol_escalate', 'cmd_review', 'human_reviewer', 'evt_reviewed'], description: 'Failure Branch (Human Review) — "Escalate to Human" policy fires. "Review Result" handled by Human Reviewer. Result Reviewed loops back to planning.' },
      ]
    },
    {
      id: 'human-escalation',
      label: 'Human-in-the-Loop Escalation',
      description: 'Trace the path when tool execution fails repeatedly and policy escalates to human intervention.',
      steps: [
        { nodeIds: ['user', 'evt_goal'], description: 'Goal Submitted — User submits a complex task requiring human verification.' },
        { nodeIds: ['pol_plan', 'planner', 'orch_plan'], description: 'Initial Planning — Planner creates execution steps; Orchestrator registers plan.' },
        { nodeIds: ['tools', 'executor', 'llm', 'evt_executed'], description: 'Tool Execution — Tool runs and LLM processes, producing an output.' },
        { nodeIds: ['pol_eval', 'evaluator', 'orch_eval', 'evt_fail'], description: 'Evaluation Failure — Evaluator assesses output and determines it fails the quality check.' },
        { nodeIds: ['pol_escalate', 'cmd_review', 'human_reviewer'], description: 'Human Escalation — System triggers escalation policy; review command dispatched to human reviewer.' },
        { nodeIds: ['human_reviewer', 'evt_reviewed', 'planner'], description: 'Human Recovery — Human reviewer corrects feedback; Result Reviewed event triggers re-planning.' },
      ]
    }
  ]
}
