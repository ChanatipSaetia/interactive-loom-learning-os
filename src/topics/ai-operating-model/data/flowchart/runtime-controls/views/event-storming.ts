import type { FlowchartViewConfig } from '../../../../../../sections/flowchart'

export const eventStormingView: FlowchartViewConfig = {
  name: 'Event Storming',
  icon: 'Component',
  nodes: [
    // Happy path - central chronology at y=250
    { id: 'human', x: 60, y: 250 },
    { id: 'evt_workflow_triggered', x: 190, y: 250 },
    { id: 'pol_route_agent', x: 330, y: 250 },
    { id: 'cmd_tool_call', x: 470, y: 250 },

    // Vertical stack above cmd_tool_call: orchestrator at y=150, memory at y=50
    { id: 'orchestrator', x: 470, y: 150 },
    { id: 'workflow_memory', x: 470, y: 50 },

    // After 100px gap: defense layer validation sequence (starts at x=680+100=780)
    { id: 'evt_api_validated', x: 780, y: 250 },
    { id: 'evt_permission_checked', x: 920, y: 250 },
    { id: 'cmd_sandbox_dryrun', x: 1060, y: 250 },
    { id: 'evt_action_executed', x: 1200, y: 250 },
    { id: 'evt_result_stored', x: 1340, y: 250 },
    { id: 'dec_outcome', x: 1470, y: 250 },

    // Incident response branch - diverges downward at y=450
    { id: 'evt_anomaly_detected', x: 1470, y: 450 },
    { id: 'pol_halt_agent', x: 1610, y: 450 },
    { id: 'cmd_kill_switch', x: 1750, y: 450 },
    { id: 'evt_agent_stopped', x: 1890, y: 450 },
    { id: 'pol_escalate', x: 2030, y: 450 },
    { id: 'incident_reviewer', x: 2030, y: 350 },
    { id: 'evt_incident_resolved', x: 2260, y: 450 },
  ],
  groups: [
    {
      id: 'es_g1',
      title: 'Workflow Trigger',
      desc: 'Human triggers the workflow, policy routes work to the agent, and the orchestrator coordinates execution.',
      nodeIds: ['human', 'evt_workflow_triggered', 'pol_route_agent', 'cmd_tool_call', 'orchestrator', 'workflow_memory'],
      color: 'rgba(140, 170, 238, 0.12)',
      borderColor: '#8caaee',
      textColor: '#c6d0f5',
    },
    {
      id: 'es_g2',
      title: 'Defense Layer Validation',
      desc: 'Tool call passes through API contract, permission check, and sandbox dry-run before execution.',
      nodeIds: ['evt_api_validated', 'evt_permission_checked', 'cmd_sandbox_dryrun', 'evt_action_executed', 'evt_result_stored', 'dec_outcome'],
      color: 'rgba(166, 209, 137, 0.12)',
      borderColor: '#a6d189',
      textColor: '#c6d0f5',
    },
    {
      id: 'es_g3',
      title: 'Incident Response',
      desc: 'When anomaly is detected, the kill switch halts the agent and escalates to human review.',
      nodeIds: ['evt_anomaly_detected', 'pol_halt_agent', 'cmd_kill_switch', 'evt_agent_stopped', 'pol_escalate', 'incident_reviewer', 'evt_incident_resolved'],
      color: 'rgba(231, 130, 132, 0.12)',
      borderColor: '#e78284',
      textColor: '#c6d0f5',
    },
  ],
}
