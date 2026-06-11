import type { UnifiedFlowchartSchema } from '../../../../sections/flowchart'

export const views: UnifiedFlowchartSchema['views'] = {
  EVENT_STORMING: {
    name: 'Event Storming',
    icon: 'Component',
    nodes: [
      // STACK 1 — Cognition & Planning
      { id: 'user', x: 60, y: 250 },
      { id: 'evt_goal', x: 190, y: 250 },
      { id: 'pol_plan', x: 330, y: 250 },
      { id: 'planner', x: 470, y: 250 },
      { id: 'evt_plan_ready', x: 610, y: 250 },
      // STACK 2 — Action Space Execution
      { id: 'tools', x: 850, y: 250 },
      { id: 'evt_tool_call', x: 990, y: 250 },
      { id: 'executor', x: 1130, y: 250 },
      { id: 'evt_executed', x: 1270, y: 250 },
      // STACK 3 — Evaluation & Outcome
      { id: 'pol_eval', x: 1510, y: 250 },
      { id: 'evaluator', x: 1650, y: 250 },
      { id: 'evt_done', x: 1790, y: 250 },
      { id: 'output', x: 1930, y: 250 },
      // FAILURE BRANCH 1 — Auto Re-Plan (below)
      { id: 'evt_fail', x: 1790, y: 450 },
      { id: 'pol_retry', x: 1930, y: 450 },
      // FAILURE BRANCH 2 — Human Escalation (further below)
      { id: 'pol_escalate', x: 1930, y: 650 },
      { id: 'cmd_review', x: 2070, y: 650 },
      { id: 'evt_reviewed', x: 2210, y: 650 },
      // HANDLERS (above commands)
      { id: 'orch_plan', x: 470, y: 150 },
      { id: 'llm', x: 1130, y: 167.5 },
      { id: 'orch_eval', x: 1650, y: 150 },
      { id: 'human_reviewer', x: 2070, y: 567.5 },
      // DATABASE (above orchestrator)
      { id: 'memory', x: 470, y: 50 },
    ],
    groups: [
      { id: 'es_g1', title: 'Cognition & Planning', desc: 'Goal triggers policy, Create Plan command handled by Orchestrator, plan generated.', nodeIds: ['evt_goal', 'pol_plan', 'planner', 'orch_plan', 'memory', 'evt_plan_ready'], color: 'rgba(140, 170, 238, 0.12)', borderColor: '#8caaee', textColor: '#c6d0f5' },
      { id: 'es_g2', title: 'Action Space Execution', desc: 'Execute Next Step policy routes to LLM, Run Tool command handled by LLM, result captured.', nodeIds: ['tools', 'llm', 'evt_tool_call', 'executor', 'evt_executed'], color: 'rgba(244, 184, 228, 0.12)', borderColor: '#f4b8e4', textColor: '#c6d0f5' },
      { id: 'es_g3', title: 'Evaluation & Happy Path', desc: 'Evaluate on Result policy, Evaluate Result command handled by Orchestrator, Goal Satisfied delivered.', nodeIds: ['pol_eval', 'evaluator', 'orch_eval', 'evt_done', 'output'], color: 'rgba(229, 200, 144, 0.12)', borderColor: '#e5c890', textColor: '#c6d0f5' },
      { id: 'es_g4', title: 'Failure Recovery', desc: 'Goal Not Satisfied branches to auto re-planning or human review, both loop back.', nodeIds: ['evt_fail', 'pol_retry', 'pol_escalate', 'cmd_review', 'human_reviewer', 'evt_reviewed'], color: 'rgba(231, 130, 132, 0.12)', borderColor: '#e78284', textColor: '#c6d0f5' }
    ]
  },
  SYS_ARCH: {
    name: 'System Architecture',
    icon: 'Server',
    nodes: [
      { id: 'user', x: 150, y: 250 },
      { id: 'orchestrator', x: 420, y: 250 },
      { id: 'memory', x: 420, y: 100 },
      { id: 'planner', x: 670, y: 100 },
      { id: 'tools', x: 670, y: 250 },
      { id: 'llm', x: 920, y: 180 },
      { id: 'executor', x: 920, y: 320 },
      { id: 'evaluator', x: 1170, y: 250 },
      { id: 'output', x: 1390, y: 250 }
    ],
    groups: [
      { id: 'sa_g1', title: 'Core Agent Scaffolding', desc: 'Runs within the secure orchestration hosting container.', nodeIds: ['orchestrator', 'memory', 'planner', 'tools', 'evaluator'], color: 'rgba(129, 200, 190, 0.12)', borderColor: '#81c8be', textColor: '#c6d0f5' }
    ]
  },
  DATA_FLOW: {
    name: 'Data Flow (DFD)',
    icon: 'Share2',
    nodes: [
      { id: 'user', x: 100, y: 250 },
      { id: 'orchestrator', x: 280, y: 250 },
      { id: 'memory', x: 460, y: 250 },
      { id: 'planner', x: 640, y: 250 },
      { id: 'llm', x: 820, y: 250 },
      { id: 'tools', x: 1000, y: 250 },
      { id: 'executor', x: 1180, y: 250 },
      { id: 'evaluator', x: 1360, y: 250 },
      { id: 'output', x: 1540, y: 250 }
    ],
    groups: []
  },
  SWIMLANES: {
    name: 'Activity Swimlanes',
    icon: 'Layers',
    nodes: [
      { id: 'user', x: 150, y: 100 },
      { id: 'orchestrator', x: 380, y: 250 },
      { id: 'memory', x: 580, y: 250 },
      { id: 'llm', x: 780, y: 250 },
      { id: 'tools', x: 980, y: 250 },
      { id: 'executor', x: 980, y: 400 },
      { id: 'evaluator', x: 1180, y: 250 },
      { id: 'output', x: 1180, y: 100 }
    ],
    groups: [
      { id: 'sl_l1', isLane: true, title: 'Human Interface', desc: 'User boundaries.', y: 50, h: 100, color: 'rgba(239, 159, 118, 0.12)' },
      { id: 'sl_l2', isLane: true, title: 'Cognitive Loop', desc: 'State tracking, planning, routing and validation.', y: 150, h: 200, color: 'rgba(153, 209, 219, 0.12)' },
      { id: 'sl_l3', isLane: true, title: 'Sandbox Actions', desc: 'Side-effects execution layer.', y: 350, h: 100, color: 'rgba(186, 187, 241, 0.12)' }
    ]
  }
}
