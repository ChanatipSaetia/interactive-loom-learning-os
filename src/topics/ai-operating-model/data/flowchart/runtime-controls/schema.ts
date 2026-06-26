import { TYPES } from '../../../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../../../sections/flowchart'

export const runtimeControlsSchema: UnifiedFlowchartSchema = {
  entities: {
    agent: {
      title: 'AI Agent',
      desc: 'The autonomous agent executing tool calls.',
      type: TYPES.AGGREGATE,
    },
    api_contract: {
      title: 'API Contracts',
      desc: 'Defines which API calls the agent can invoke at every tool call.',
      type: TYPES.AGGREGATE,
    },
    permission: {
      title: 'Permission Scoping',
      desc: 'Separates read from write access, scoped per workflow.',
      type: TYPES.AGGREGATE,
    },
    sandbox: {
      title: 'Reasoning Sandbox',
      desc: 'Dry-runs proposed tool calls against policy before execution.',
      type: TYPES.AGGREGATE,
    },
    kill_switch: {
      title: 'Kill Switch',
      desc: 'Stops the agent when drift or failure is detected.',
      type: TYPES.AGGREGATE,
    },
    business_system: {
      title: 'Business Systems',
      desc: 'CRM, ERP, databases the agent writes to.',
      type: TYPES.EXTERNAL,
    },
    monitor: {
      title: 'Anomaly Monitor',
      desc: 'Detects output drift and triggers kill switch.',
      type: TYPES.EXTERNAL,
    },
    human: {
      title: 'Human Operator',
      desc: 'Triggers the workflow and monitors outcomes.',
      type: TYPES.USER,
    },
    evt_workflow_triggered: {
      title: 'Workflow Triggered',
      desc: 'Trigger event fires; agent begins execution.',
      type: TYPES.EVENT,
    },
    pol_route_agent: {
      title: 'Route to Agent',
      desc: 'Policy: dispatch work to the appropriate agent based on workflow map.',
      type: TYPES.POLICY,
    },
    cmd_tool_call: {
      title: 'Run Tool Call',
      desc: 'Agent initiates a tool call against a business system.',
      type: TYPES.COMMAND,
    },
    orchestrator: {
      title: 'AI Agent',
      desc: 'Coordinates the agent\'s reasoning and tool execution loop.',
      type: TYPES.AGGREGATE,
      collapsedTo: 'agent',
    },
    workflow_memory: {
      title: 'Working Memory',
      desc: 'Stores intermediate reasoning, tool outputs, and session state.',
      type: TYPES.AGGREGATE,
    },
    cmd_validate_api: {
      title: 'Validate API Contract',
      desc: 'Verify tool call meets target API schema and endpoint constraints.',
      type: TYPES.COMMAND,
    },
    evt_api_validated: {
      title: 'API Contract Validated',
      desc: 'Tool call passes the API contract check.',
      type: TYPES.EVENT,
    },
    pol_check_perm: {
      title: 'Evaluate Permissions',
      desc: 'Policy: verify permission scopes before sandbox dry-run.',
      type: TYPES.POLICY,
    },
    cmd_check_perm: {
      title: 'Check Permission Scope',
      desc: 'Request role-based or session-based verification for tool invocation.',
      type: TYPES.COMMAND,
    },
    evt_permission_checked: {
      title: 'Permission Verified',
      desc: 'Read/write access confirmed for this workflow scope.',
      type: TYPES.EVENT,
    },
    pol_dryrun: {
      title: 'Evaluate Sandbox Policy',
      desc: 'Policy: initiate sandbox dry-run for permission-cleared actions.',
      type: TYPES.POLICY,
    },
    cmd_sandbox_dryrun: {
      title: 'Sandbox Dry-Run',
      desc: 'Proposed action validated against policy before execution.',
      type: TYPES.COMMAND,
    },
    evt_action_executed: {
      title: 'Action Executed',
      desc: 'Tool call reaches the business system and completes.',
      type: TYPES.EVENT,
    },
    evt_result_stored: {
      title: 'Result Stored',
      desc: 'Outcome persisted to working memory and business system.',
      type: TYPES.EVENT,
    },
    pol_evaluate_outcome: {
      title: 'Evaluate Anomaly Policy',
      desc: 'Anomaly monitor evaluates whether the result is within bounds.',
      type: TYPES.POLICY,
    },
    cmd_evaluate_drift: {
      title: 'Evaluate Drift',
      desc: 'Run drift assessment checks.',
      type: TYPES.COMMAND,
    },
    evt_anomaly_detected: {
      title: 'Anomaly Detected',
      desc: 'Output drift or failure exceeds anomaly threshold.',
      type: TYPES.EVENT,
    },
    pol_halt_agent: {
      title: 'Halt Agent',
      desc: 'Policy: trigger kill switch when anomaly is detected.',
      type: TYPES.POLICY,
    },
    cmd_kill_switch: {
      title: 'Activate Kill Switch',
      desc: 'Emergency stop halts all agent operations.',
      type: TYPES.COMMAND,
    },
    evt_agent_stopped: {
      title: 'Agent Stopped',
      desc: 'Agent operations suspended; state preserved for investigation.',
      type: TYPES.EVENT,
    },
    pol_escalate: {
      title: 'Escalate to Human',
      desc: 'Policy: notify Business Owner and Technical Owner for review.',
      type: TYPES.POLICY,
    },
    incident_reviewer: {
      title: 'Incident Reviewer',
      desc: 'Technical Owner or Business Owner investigating the incident.',
      type: TYPES.USER,
    },
    cmd_resolve_incident: {
      title: 'Resolve Incident',
      desc: 'Submit incident report and clear agent for restart.',
      type: TYPES.COMMAND,
    },
    evt_incident_resolved: {
      title: 'Incident Resolved',
      desc: 'Human operator investigates, fixes root cause, and clears agent for restart.',
      type: TYPES.EVENT,
    },
  },
  relations: [
    { id: 'r_es_1', from: 'human', to: 'evt_workflow_triggered', views: ['EVENT_STORMING'] },
    { id: 'r_es_2', from: 'evt_workflow_triggered', to: 'pol_route_agent', views: ['EVENT_STORMING'] },
    { id: 'r_es_3', from: 'pol_route_agent', to: 'cmd_tool_call', views: ['EVENT_STORMING'] },
    { id: 'r_es_4', from: 'cmd_tool_call', to: 'orchestrator', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r_es_5', from: 'orchestrator', to: 'workflow_memory', views: ['EVENT_STORMING'] },
    { id: 'r_es_6', from: 'orchestrator', to: 'cmd_validate_api', views: ['EVENT_STORMING'] },
    { id: 'r_es_7', from: 'cmd_validate_api', to: 'api_contract', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r_es_8', from: 'api_contract', to: 'evt_api_validated', views: ['EVENT_STORMING'] },
    { id: 'r_es_9', from: 'evt_api_validated', to: 'pol_check_perm', views: ['EVENT_STORMING'] },
    { id: 'r_es_10', from: 'pol_check_perm', to: 'cmd_check_perm', views: ['EVENT_STORMING'] },
    { id: 'r_es_11', from: 'cmd_check_perm', to: 'permission', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r_es_12', from: 'permission', to: 'evt_permission_checked', views: ['EVENT_STORMING'] },
    { id: 'r_es_13', from: 'evt_permission_checked', to: 'pol_dryrun', views: ['EVENT_STORMING'] },
    { id: 'r_es_14', from: 'pol_dryrun', to: 'cmd_sandbox_dryrun', views: ['EVENT_STORMING'] },
    { id: 'r_es_15', from: 'cmd_sandbox_dryrun', to: 'sandbox', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r_es_16', from: 'sandbox', to: 'evt_action_executed', views: ['EVENT_STORMING'] },
    { id: 'r_es_17', from: 'evt_action_executed', to: 'evt_result_stored', views: ['EVENT_STORMING'] },
    { id: 'r_es_18', from: 'evt_result_stored', to: 'business_system', views: ['EVENT_STORMING'] },
    { id: 'r_es_19', from: 'evt_result_stored', to: 'pol_evaluate_outcome', views: ['EVENT_STORMING'] },
    { id: 'r_es_19a', from: 'pol_evaluate_outcome', to: 'cmd_evaluate_drift', views: ['EVENT_STORMING'] },
    { id: 'r_es_20', from: 'cmd_evaluate_drift', to: 'monitor', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r_es_21', from: 'monitor', to: 'evt_anomaly_detected', views: ['EVENT_STORMING'], dashed: true },
    { id: 'r_es_22', from: 'evt_anomaly_detected', to: 'pol_halt_agent', views: ['EVENT_STORMING'] },
    { id: 'r_es_23', from: 'pol_halt_agent', to: 'cmd_kill_switch', views: ['EVENT_STORMING'] },
    { id: 'r_es_24', from: 'cmd_kill_switch', to: 'kill_switch', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r_es_25', from: 'kill_switch', to: 'evt_agent_stopped', views: ['EVENT_STORMING'] },
    { id: 'r_es_26', from: 'evt_agent_stopped', to: 'pol_escalate', views: ['EVENT_STORMING'] },
    { id: 'r_es_27', from: 'pol_escalate', to: 'incident_reviewer', views: ['EVENT_STORMING'] },
    { id: 'r_es_27a', from: 'incident_reviewer', to: 'cmd_resolve_incident', views: ['EVENT_STORMING'] },
    { id: 'r_es_28', from: 'cmd_resolve_incident', to: 'evt_incident_resolved', views: ['EVENT_STORMING'] },
  ],
  views: {
    EVENT_STORMING: {
      name: 'Event Storming',
      icon: 'Component',
      nodes: [
        { id: 'human', grid: [0, 2] },
        { id: 'evt_workflow_triggered', grid: [1, 2] },
        { id: 'pol_route_agent', grid: [2, 2] },
        { id: 'cmd_tool_call', grid: [3, 2] },
        { id: 'orchestrator', grid: [3, 1] },
        { id: 'workflow_memory', grid: [3, 0] },
        { id: 'cmd_validate_api', grid: [4, 2] },
        { id: 'api_contract', grid: [4, 1] },
        { id: 'evt_api_validated', grid: [5, 2] },
        { id: 'pol_check_perm', grid: [6, 2] },
        { id: 'cmd_check_perm', grid: [7, 2] },
        { id: 'permission', grid: [7, 1] },
        { id: 'evt_permission_checked', grid: [8, 2] },
        { id: 'pol_dryrun', grid: [9, 2] },
        { id: 'cmd_sandbox_dryrun', grid: [10, 2] },
        { id: 'sandbox', grid: [10, 1] },
        { id: 'evt_action_executed', grid: [11, 2] },
        { id: 'evt_result_stored', grid: [12, 2] },
        { id: 'business_system', grid: [12, 0] },
        { id: 'pol_evaluate_outcome', grid: [13, 2] },
        { id: 'cmd_evaluate_drift', grid: [14, 2] },
        { id: 'monitor', grid: [14, 1] },
        { id: 'evt_anomaly_detected', grid: [15, 3] },
        { id: 'pol_halt_agent', grid: [16, 3] },
        { id: 'cmd_kill_switch', grid: [17, 3] },
        { id: 'kill_switch', grid: [17, 1] },
        { id: 'evt_agent_stopped', grid: [18, 3] },
        { id: 'pol_escalate', grid: [19, 3] },
        { id: 'incident_reviewer', grid: [19, 2] },
        { id: 'cmd_resolve_incident', grid: [20, 2] },
        { id: 'evt_incident_resolved', grid: [21, 3] },
      ],
      groups: [
        {
          id: 'es_g1',
          title: 'Workflow Trigger',
          desc: 'Human triggers the workflow, policy routes work to the agent, and the orchestrator coordinates execution.',
          nodeIds: ['human', 'evt_workflow_triggered', 'pol_route_agent', 'cmd_tool_call', 'orchestrator', 'workflow_memory'],
          color: 'rgba(140, 170, 238, 0.12)',
          borderColor: 'var(--ctp-blue)',
          textColor: 'var(--ctp-text)',
        },
        {
          id: 'es_g2',
          title: 'Defense Layer Validation',
          desc: 'Tool call passes through API contract, permission check, and sandbox dry-run before execution.',
          nodeIds: ['cmd_validate_api', 'api_contract', 'evt_api_validated', 'pol_check_perm', 'cmd_check_perm', 'permission', 'evt_permission_checked', 'pol_dryrun', 'cmd_sandbox_dryrun', 'sandbox', 'evt_action_executed', 'evt_result_stored', 'business_system', 'pol_evaluate_outcome', 'cmd_evaluate_drift', 'monitor'],
          color: 'rgba(166, 209, 137, 0.12)',
          borderColor: 'var(--ctp-green)',
          textColor: 'var(--ctp-text)',
        },
        {
          id: 'es_g3',
          title: 'Incident Response',
          desc: 'When anomaly is detected, the kill switch halts the agent and escalates to human review.',
          nodeIds: ['evt_anomaly_detected', 'pol_halt_agent', 'cmd_kill_switch', 'kill_switch', 'evt_agent_stopped', 'pol_escalate', 'incident_reviewer', 'cmd_resolve_incident', 'evt_incident_resolved'],
          color: 'rgba(231, 130, 132, 0.12)',
          borderColor: 'var(--ctp-red)',
          textColor: 'var(--ctp-text)',
        },
      ]
    }
  },
  journeys: [
    {
      id: 'defense-in-depth',
      label: 'Defense-in-Depth (Layers)',
      description: 'Follow how a tool call passes through each runtime control layer before reaching business systems.',
      steps: [
        {
          nodeIds: ['orchestrator', 'api_contract'],
          description: 'Tool Call → API Contract — The agent attempts a tool call. API contracts validate which APIs are permissible.',
        },
        {
          nodeIds: ['permission'],
          description: 'Permission Scoping — Read vs write access is checked per workflow scope.',
        },
        {
          nodeIds: ['sandbox'],
          description: 'Reasoning Sandbox — Proposed action is dry-run against policy before execution.',
        },
        {
          nodeIds: ['business_system'],
          description: 'Business Systems — If all layers pass, the action reaches the CRM, ERP, or database.',
        },
        {
          nodeIds: ['monitor', 'kill_switch'],
          description: 'Detection & Response — Anomaly monitor watches for drift. Kill switch halts the agent on threshold breach.',
        },
      ],
    },
    {
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
          nodeIds: ['pol_evaluate_outcome'],
          description: 'Outcome Check — Anomaly monitor evaluates whether the result is within expected bounds.',
        },
      ],
    },
    {
      id: 'incident-response',
      label: 'Incident Response (Failure Path)',
      description: 'Follow what happens when an anomaly is detected: kill switch fires, agent halts, and human reviews.',
      steps: [
        {
          nodeIds: ['pol_evaluate_outcome', 'evt_anomaly_detected'],
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
          nodeIds: ['incident_reviewer', 'cmd_resolve_incident', 'evt_incident_resolved'],
          description: 'Resolution — Root cause fixed, agent cleared for restart.',
        },
      ],
    }
  ]
}
