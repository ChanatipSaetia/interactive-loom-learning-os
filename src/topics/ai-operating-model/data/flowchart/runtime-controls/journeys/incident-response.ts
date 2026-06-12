import type { FlowchartJourney } from '../../../../../../sections/flowchart'

// Works for EVENT_STORMING view — happy path
export const workflowExecutionJourney: FlowchartJourney = {
  id: 'workflow-execution',
  label: 'Workflow Execution (Happy Path)',
  description: 'Follow the workflow from trigger through defense layers to successful completion.',
  steps: [
    {
      nodeIds: ['human', 'evt_workflow_triggered', 'pol_route_agent'],
      description: 'Trigger — Human fires the workflow. Policy routes the work to the agent based on the workflow map.',
    },
    {
      nodeIds: ['cmd_tool_call', 'orchestrator', 'workflow_memory'],
      description: 'Agent Execution — Orchestrator coordinates the tool call. Working memory holds intermediate reasoning and tool outputs.',
    },
    {
      nodeIds: ['evt_api_validated', 'evt_permission_checked'],
      description: 'Defense Layers — Tool call passes API contract validation and permission scoping check.',
    },
    {
      nodeIds: ['cmd_sandbox_dryrun', 'evt_action_executed', 'evt_result_stored'],
      description: 'Sandbox & Execute — Proposed action is dry-run against policy, then executed and persisted.',
    },
    {
      nodeIds: ['dec_outcome'],
      description: 'Outcome Check — Anomaly monitor evaluates whether the result is within expected bounds.',
    },
  ],
}

// Works for EVENT_STORMING view — incident response
export const incidentResponseJourney: FlowchartJourney = {
  id: 'incident-response',
  label: 'Incident Response (Failure Path)',
  description: 'Follow what happens when an anomaly is detected: kill switch fires, agent halts, and human reviews.',
  steps: [
    {
      nodeIds: ['dec_outcome', 'evt_anomaly_detected'],
      description: 'Anomaly Detected — Output drift or failure exceeds the anomaly threshold.',
    },
    {
      nodeIds: ['pol_halt_agent', 'cmd_kill_switch', 'evt_agent_stopped'],
      description: 'Kill Switch — Policy triggers the kill switch. Agent operations are halted, state preserved for investigation.',
    },
    {
      nodeIds: ['pol_escalate', 'incident_reviewer'],
      description: 'Escalation — Incident escalated to Technical Owner or Business Owner for root cause analysis.',
    },
    {
      nodeIds: ['evt_incident_resolved'],
      description: 'Resolution — Root cause fixed, agent cleared for restart.',
    },
  ],
}
