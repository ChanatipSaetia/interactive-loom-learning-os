import type { UnifiedFlowchartSchema } from '../../../../sections/flowchart'

export const relations: UnifiedFlowchartSchema['relations'] = [
  // ── EVENT STORMING ─────────────────────────────────────────────────────────
  { id: 'r_es_1',  from: 'user',           to: 'evt_goal',        views: ['EVENT_STORMING'] },
  { id: 'r_es_2',  from: 'evt_goal',       to: 'pol_plan',        views: ['EVENT_STORMING'] },
  { id: 'r_es_3',  from: 'pol_plan',       to: 'planner',         views: ['EVENT_STORMING'] },
  { id: 'r_es_4',  from: 'planner',        to: 'orch_plan',       views: ['EVENT_STORMING'], handledBy: true },
  { id: 'r_es_5',  from: 'orch_plan',      to: 'evt_plan_ready',  views: ['EVENT_STORMING'] },
  { id: 'r_es_6',  from: 'orch_plan',      to: 'memory',          views: ['EVENT_STORMING'] },
  { id: 'r_es_7',  from: 'evt_plan_ready', to: 'tools',           views: ['EVENT_STORMING'] },
  { id: 'r_es_8',  from: 'tools',          to: 'evt_tool_call',   views: ['EVENT_STORMING'] },
  { id: 'r_es_9',  from: 'evt_tool_call',  to: 'executor',        views: ['EVENT_STORMING'] },
  { id: 'r_es_10', from: 'executor',       to: 'llm',             views: ['EVENT_STORMING'], handledBy: true },
  { id: 'r_es_11', from: 'llm',            to: 'evt_executed',    views: ['EVENT_STORMING'] },
  { id: 'r_es_12', from: 'evt_executed',   to: 'pol_eval',        views: ['EVENT_STORMING'] },
  { id: 'r_es_13', from: 'pol_eval',       to: 'evaluator',       views: ['EVENT_STORMING'] },
  { id: 'r_es_14', from: 'evaluator',      to: 'orch_eval',       views: ['EVENT_STORMING'], handledBy: true },
  { id: 'r_es_15', from: 'orch_eval',      to: 'evt_done',        views: ['EVENT_STORMING'] },
  { id: 'r_es_16', from: 'orch_eval',      to: 'evt_fail',        views: ['EVENT_STORMING'] },
  { id: 'r_es_17', from: 'evt_done',       to: 'output',          views: ['EVENT_STORMING'] },
  { id: 'r_es_18', from: 'evt_fail',       to: 'pol_retry',       views: ['EVENT_STORMING'] },
  { id: 'r_es_19', from: 'pol_retry',      to: 'planner',         views: ['EVENT_STORMING'], dashed: true },
  { id: 'r_es_20', from: 'evt_fail',       to: 'pol_escalate',    views: ['EVENT_STORMING'] },
  { id: 'r_es_21', from: 'pol_escalate',   to: 'cmd_review',      views: ['EVENT_STORMING'] },
  { id: 'r_es_22', from: 'cmd_review',     to: 'human_reviewer',  views: ['EVENT_STORMING'], handledBy: true },
  { id: 'r_es_23', from: 'human_reviewer', to: 'evt_reviewed',    views: ['EVENT_STORMING'] },
  { id: 'r_es_24', from: 'evt_reviewed',   to: 'planner',         views: ['EVENT_STORMING'], dashed: true },

  // ── SYSTEM ARCHITECTURE ─────────────────────────────────────────────────────
  // Edges that CROSS the system boundary (external ↔ internal) are the key ones.
  // Internal flow: orchestrator → planner/memory → tools → executor → evaluator
  // External calls: tools ↔ llm (crosses boundary)
  // Actor edges: user → orchestrator, evaluator → user (both cross boundary)
  // Failure: evaluator → pol_escalate → human_reviewer (crosses out), human_reviewer → orchestrator (crosses back in, dashed)
  { id: 'r_sa_1',  from: 'user',          to: 'orchestrator',   views: ['SYS_ARCH'] },           // actor → system
  { id: 'r_sa_2',  from: 'orchestrator',  to: 'planner',        views: ['SYS_ARCH'] },           // internal
  { id: 'r_sa_3',  from: 'orchestrator',  to: 'memory',         views: ['SYS_ARCH'] },           // internal
  { id: 'r_sa_4',  from: 'planner',       to: 'tools',          views: ['SYS_ARCH'] },           // internal
  { id: 'r_sa_5',  from: 'tools',         to: 'llm',            views: ['SYS_ARCH'] },           // system → external API
  { id: 'r_sa_6',  from: 'llm',           to: 'executor',       views: ['SYS_ARCH'] },           // external API → system
  { id: 'r_sa_7',  from: 'tools',         to: 'executor',       views: ['SYS_ARCH'] },           // internal (direct non-LLM path)
  { id: 'r_sa_8',  from: 'executor',      to: 'evaluator',      views: ['SYS_ARCH'] },           // internal
  { id: 'r_sa_9',  from: 'evaluator',     to: 'user',           views: ['SYS_ARCH'] },           // system → actor (happy path)
  { id: 'r_sa_10', from: 'evaluator',     to: 'pol_escalate',   views: ['SYS_ARCH'] },           // internal (failure branch)
  { id: 'r_sa_11', from: 'pol_escalate',  to: 'human_reviewer', views: ['SYS_ARCH'] },           // system → external SME
  { id: 'r_sa_12', from: 'human_reviewer',to: 'orchestrator',   views: ['SYS_ARCH'], dashed: true }, // external SME → system (feedback)

  // ── DATA FLOW (DFD) ────────────────────────────────────────────────────────
  { id: 'r_df_1',  from: 'user',           to: 'planner',         views: ['DATA_FLOW'] },
  { id: 'r_df_2',  from: 'memory',         to: 'planner',         views: ['DATA_FLOW'] },
  { id: 'r_df_3',  from: 'planner',        to: 'tools',           views: ['DATA_FLOW'] },
  { id: 'r_df_4',  from: 'tools',          to: 'llm',             views: ['DATA_FLOW'] },
  { id: 'r_df_5',  from: 'llm',            to: 'executor',        views: ['DATA_FLOW'] },
  { id: 'r_df_6',  from: 'executor',       to: 'evaluator',       views: ['DATA_FLOW'] },
  { id: 'r_df_7',  from: 'evaluator',      to: 'output',          views: ['DATA_FLOW'] },
  { id: 'r_df_8',  from: 'output',         to: 'user',            views: ['DATA_FLOW'] },
  { id: 'r_df_9',  from: 'evaluator',      to: 'pol_escalate',    views: ['DATA_FLOW'] },
  { id: 'r_df_10', from: 'pol_escalate',   to: 'human_reviewer',  views: ['DATA_FLOW'] },
  { id: 'r_df_11', from: 'human_reviewer', to: 'planner',         views: ['DATA_FLOW'], dashed: true },

  // ── ACTIVITY SWIMLANES ────────────────────────────────────────────────────
  // Cross-lane arrows show handoffs between actors/system boundaries.
  { id: 'r_sl_1',  from: 'user',           to: 'orchestrator',    views: ['SWIMLANES'] },          // User → Orchestrator lane
  { id: 'r_sl_2',  from: 'orchestrator',   to: 'memory',          views: ['SWIMLANES'] },          // within Orchestrator lane
  { id: 'r_sl_3',  from: 'orchestrator',   to: 'tools',           views: ['SWIMLANES'] },          // Orchestrator → Execution lane
  { id: 'r_sl_4',  from: 'tools',          to: 'llm',             views: ['SWIMLANES'] },          // within Execution lane
  { id: 'r_sl_5',  from: 'llm',            to: 'executor',        views: ['SWIMLANES'] },          // within Execution lane
  { id: 'r_sl_6',  from: 'executor',       to: 'evaluator',       views: ['SWIMLANES'] },          // Execution → Orchestrator lane
  { id: 'r_sl_7',  from: 'evaluator',      to: 'output',          views: ['SWIMLANES'] },          // Orchestrator → User lane
  { id: 'r_sl_8',  from: 'output',         to: 'user',            views: ['SWIMLANES'] },          // within User lane
  { id: 'r_sl_9',  from: 'evaluator',      to: 'pol_escalate',    views: ['SWIMLANES'] },          // Orchestrator → Human lane
  { id: 'r_sl_10', from: 'pol_escalate',   to: 'human_reviewer',  views: ['SWIMLANES'] },         // within Human lane
  { id: 'r_sl_11', from: 'human_reviewer', to: 'orchestrator',    views: ['SWIMLANES'], dashed: true }, // Human → Orchestrator lane
]
