import type { UnifiedFlowchartSchema } from '../../../../sections/flowchart'

export const views: UnifiedFlowchartSchema['views'] = {
  // ── Event Storming ─────────────────────────────────────────────────────────
  EVENT_STORMING: {
    name: 'Event Storming',
    icon: 'Component',
    nodes: [
      // STACK 1 — Cognition & Planning
      { id: 'user',          x: 60,   y: 250 },
      { id: 'evt_goal',      x: 190,  y: 250 },
      { id: 'pol_plan',      x: 330,  y: 250 },
      { id: 'planner',       x: 470,  y: 250 },
      { id: 'evt_plan_ready',x: 610,  y: 250 },
      // STACK 2 — Action Space Execution
      { id: 'tools',         x: 850,  y: 250 },
      { id: 'evt_tool_call', x: 990,  y: 250 },
      { id: 'executor',      x: 1130, y: 250 },
      { id: 'evt_executed',  x: 1270, y: 250 },
      // STACK 3 — Evaluation & Outcome
      { id: 'pol_eval',      x: 1510, y: 250 },
      { id: 'evaluator',     x: 1650, y: 250 },
      { id: 'evt_done',      x: 1790, y: 250 },
      { id: 'output',        x: 1930, y: 250 },
      // FAILURE BRANCH 1 — Auto Re-Plan
      { id: 'evt_fail',      x: 1790, y: 450 },
      { id: 'pol_retry',     x: 1930, y: 450 },
      // FAILURE BRANCH 2 — Human Escalation
      { id: 'pol_escalate',  x: 1930, y: 650 },
      { id: 'cmd_review',    x: 2070, y: 650 },
      { id: 'evt_reviewed',  x: 2210, y: 650 },
      // HANDLERS (above commands)
      { id: 'orch_plan',     x: 470,  y: 150 },
      { id: 'llm',           x: 1130, y: 167.5 },
      { id: 'orch_eval',     x: 1650, y: 150 },
      { id: 'human_reviewer',x: 2070, y: 567.5 },
      // DATABASE
      { id: 'memory',        x: 470,  y: 50 },
    ],
    groups: [
      { id: 'es_g1', title: 'Cognition & Planning',   desc: 'Goal triggers policy, Create Plan command handled by Orchestrator, plan generated.', nodeIds: ['evt_goal','pol_plan','planner','orch_plan','memory','evt_plan_ready'], color: 'rgba(140,170,238,0.12)', borderColor: '#8caaee', textColor: '#c6d0f5' },
      { id: 'es_g2', title: 'Action Space Execution', desc: 'Execute Next Step policy routes to LLM, Run Tool handled by LLM, result captured.',  nodeIds: ['tools','llm','evt_tool_call','executor','evt_executed'],            color: 'rgba(244,184,228,0.12)', borderColor: '#f4b8e4', textColor: '#c6d0f5' },
      { id: 'es_g3', title: 'Evaluation & Happy Path',desc: 'Evaluate on Result policy, Evaluate Result handled by Orchestrator, Goal Satisfied.', nodeIds: ['pol_eval','evaluator','orch_eval','evt_done','output'],            color: 'rgba(229,200,144,0.12)', borderColor: '#e5c890', textColor: '#c6d0f5' },
      { id: 'es_g4', title: 'Failure Recovery',       desc: 'Goal Not Satisfied branches to auto re-planning or human review.',                    nodeIds: ['evt_fail','pol_retry','pol_escalate','cmd_review','human_reviewer','evt_reviewed'], color: 'rgba(231,130,132,0.12)', borderColor: '#e78284', textColor: '#c6d0f5' },
    ]
  },

  // ── System Architecture ────────────────────────────────────────────────────────────
  // Nodes are split by system boundary:
  //   OUTSIDE: user (client), human_reviewer (SME), llm (3rd-party API)
  //   INSIDE:  everything we build — orchestrator, planner, memory,
  //            tools, executor, evaluator, pol_escalate
  // The "Agent System" group draws the boundary box around inside nodes.
  //
  // Layout (x/y):
  //   Col 1  Col 2          Col 3      Col 4    Col 5
  //   user → orchestrator → planner  → tools  → executor → evaluator
  //                         memory                          pol_escalate
  //   llm (above, external)     human_reviewer (below, external)
  SYS_ARCH: {
    name: 'System Architecture',
    icon: 'Server',
    nodes: [
      // ── OUTSIDE (external actors & third-party) ──
      { id: 'user',          x: 80,   y: 300 },
      { id: 'llm',           x: 960,  y: 100 },   // external API, above the system box
      { id: 'human_reviewer',x: 80,   y: 520 },   // external SME, below-left

      // ── INSIDE Agent System ──
      { id: 'orchestrator',  x: 310,  y: 300 },
      { id: 'planner',       x: 560,  y: 220 },
      { id: 'memory',        x: 560,  y: 420 },
      { id: 'tools',         x: 810,  y: 300 },
      { id: 'executor',      x: 1060, y: 300 },
      { id: 'evaluator',     x: 1310, y: 300 },
      { id: 'pol_escalate',  x: 1310, y: 480 },
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

  // ── Data Flow (DFD) ───────────────────────────────────────────────────────
  DATA_FLOW: {
    name: 'Data Flow (DFD)',
    icon: 'Share2',
    nodes: [
      { id: 'user',          x: 100,  y: 200 },
      { id: 'planner',       x: 320,  y: 200 },
      { id: 'memory',        x: 320,  y: 100 },
      { id: 'tools',         x: 540,  y: 200 },
      { id: 'llm',           x: 760,  y: 200 },
      { id: 'executor',      x: 980,  y: 200 },
      { id: 'evaluator',     x: 1200, y: 200 },
      { id: 'output',        x: 1420, y: 200 },
      { id: 'pol_escalate',  x: 1200, y: 380 },
      { id: 'human_reviewer',x: 1420, y: 380 },
    ],
    groups: []
  },

  // ── Activity Swimlanes ────────────────────────────────────────────────────
  // Lanes split by actor/system boundary:
  //   1. User          — initiates goals, receives final responses
  //   2. Orchestrator  — planning and evaluation logic (agent core)
  //   3. Execution     — tool routing, LLM calls, and sandbox execution
  //   4. Human         — escalation and human-in-the-loop review
  SWIMLANES: {
    name: 'Activity Swimlanes',
    icon: 'Layers',
    nodes: [
      // Lane 1 — User (y ≈ 75)
      { id: 'user',          x: 160,  y: 75 },
      { id: 'output',        x: 1340, y: 75 },

      // Lane 2 — Orchestrator / Agent Core (y ≈ 270)
      { id: 'orchestrator',  x: 390,  y: 270 },
      { id: 'memory',        x: 600,  y: 270 },
      { id: 'evaluator',     x: 990,  y: 270 },

      // Lane 3 — Execution Layer (y ≈ 460)
      { id: 'tools',         x: 600,  y: 460 },
      { id: 'llm',           x: 810,  y: 460 },
      { id: 'executor',      x: 1010, y: 460 },

      // Lane 4 — Human Reviewer (y ≈ 650)
      { id: 'pol_escalate',  x: 810,  y: 650 },
      { id: 'human_reviewer',x: 1010, y: 650 },
    ],
    groups: [
      { id: 'sl_l1', isLane: true, title: 'User',                     desc: 'Human actor: submits goals and receives final responses.',                      y: 30,  h: 110, color: 'rgba(239,159,118,0.10)' },
      { id: 'sl_l2', isLane: true, title: 'Orchestrator (Agent Core)', desc: 'Owns planning, memory retrieval, and evaluation decisions.',                y: 200, h: 160, color: 'rgba(153,209,219,0.10)' },
      { id: 'sl_l3', isLane: true, title: 'Execution Layer',           desc: 'Tool routing, LLM reasoning, and sandboxed tool execution.',                   y: 390, h: 160, color: 'rgba(186,187,241,0.10)' },
      { id: 'sl_l4', isLane: true, title: 'Human Reviewer',            desc: 'Human-in-the-loop: receives escalated tasks, provides corrective feedback.', y: 590, h: 110, color: 'rgba(231,130,132,0.10)' },
    ]
  }
}
