import { TYPES } from '../../../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../../../sections/flowchart'

export const runtimeControlsSchema: UnifiedFlowchartSchema = {
  entities: {
    agent: {
      title: 'AI Agent',
      desc: 'The autonomous agent executing tool calls.',
      viewTypes: { SYS_ARCH: TYPES.SERVICE },
    },
    api_contract: {
      title: 'API Contracts',
      desc: 'Defines which API calls the agent can invoke at every tool call.',
      viewTypes: { SYS_ARCH: TYPES.DECISION },
    },
    permission: {
      title: 'Permission Scoping',
      desc: 'Separates read from write access, scoped per workflow.',
      viewTypes: { SYS_ARCH: TYPES.DECISION },
    },
    sandbox: {
      title: 'Reasoning Sandbox',
      desc: 'Dry-runs proposed tool calls against policy before execution.',
      viewTypes: { SYS_ARCH: TYPES.PROCESS },
    },
    kill_switch: {
      title: 'Kill Switch',
      desc: 'Stops the agent when drift or failure is detected.',
      viewTypes: { SYS_ARCH: TYPES.POLICY },
    },
    business_system: {
      title: 'Business Systems',
      desc: 'CRM, ERP, databases the agent writes to.',
      viewTypes: { SYS_ARCH: TYPES.DATABASE },
    },
    monitor: {
      title: 'Anomaly Monitor',
      desc: 'Detects output drift and triggers kill switch.',
      viewTypes: { SYS_ARCH: TYPES.EXTERNAL },
    },
    human: {
      title: 'Human Operator',
      desc: 'Triggers the workflow and monitors outcomes.',
      viewTypes: { EVENT_STORMING: TYPES.USER },
    },
    evt_workflow_triggered: {
      title: 'Workflow Triggered',
      desc: 'Trigger event fires; agent begins execution.',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    pol_route_agent: {
      title: 'Route to Agent',
      desc: 'Policy: dispatch work to the appropriate agent based on workflow map.',
      viewTypes: { EVENT_STORMING: TYPES.POLICY },
    },
    cmd_tool_call: {
      title: 'Run Tool Call',
      desc: 'Agent initiates a tool call against a business system.',
      viewTypes: { EVENT_STORMING: TYPES.COMMAND },
    },
    orchestrator: {
      title: 'Agent Orchestrator',
      desc: 'Coordinates the agent\'s reasoning and tool execution loop.',
      viewTypes: { EVENT_STORMING: TYPES.AGGREGATE },
    },
    workflow_memory: {
      title: 'Working Memory',
      desc: 'Stores intermediate reasoning, tool outputs, and session state.',
      viewTypes: { EVENT_STORMING: TYPES.DATABASE },
    },
    evt_api_validated: {
      title: 'API Contract Validated',
      desc: 'Tool call passes the API contract check.',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    evt_permission_checked: {
      title: 'Permission Verified',
      desc: 'Read/write access confirmed for this workflow scope.',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    cmd_sandbox_dryrun: {
      title: 'Sandbox Dry-Run',
      desc: 'Proposed action validated against policy before execution.',
      viewTypes: { EVENT_STORMING: TYPES.COMMAND },
    },
    evt_action_executed: {
      title: 'Action Executed',
      desc: 'Tool call reaches the business system and completes.',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    evt_result_stored: {
      title: 'Result Stored',
      desc: 'Outcome persisted to working memory and business system.',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    dec_outcome: {
      title: 'Outcome Check',
      desc: 'Anomaly monitor evaluates whether the result is within bounds.',
      viewTypes: { EVENT_STORMING: TYPES.DECISION },
    },
    evt_anomaly_detected: {
      title: 'Anomaly Detected',
      desc: 'Output drift or failure exceeds anomaly threshold.',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    pol_halt_agent: {
      title: 'Halt Agent',
      desc: 'Policy: trigger kill switch when anomaly is detected.',
      viewTypes: { EVENT_STORMING: TYPES.POLICY },
    },
    cmd_kill_switch: {
      title: 'Activate Kill Switch',
      desc: 'Emergency stop halts all agent operations.',
      viewTypes: { EVENT_STORMING: TYPES.COMMAND },
    },
    evt_agent_stopped: {
      title: 'Agent Stopped',
      desc: 'Agent operations suspended; state preserved for investigation.',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    pol_escalate: {
      title: 'Escalate to Human',
      desc: 'Policy: notify Business Owner and Technical Owner for review.',
      viewTypes: { EVENT_STORMING: TYPES.POLICY },
    },
    evt_incident_resolved: {
      title: 'Incident Resolved',
      desc: 'Human operator investigates, fixes root cause, and clears agent for restart.',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    incident_reviewer: {
      title: 'Incident Reviewer',
      desc: 'Technical Owner or Business Owner investigating the incident.',
      viewTypes: { EVENT_STORMING: TYPES.USER },
    },
  },
  relations: [
    { id: 'r_sa_1', from: 'agent', to: 'api_contract', views: ['SYS_ARCH'] },
    { id: 'r_sa_2', from: 'api_contract', to: 'permission', views: ['SYS_ARCH'] },
    { id: 'r_sa_3', from: 'permission', to: 'sandbox', views: ['SYS_ARCH'] },
    { id: 'r_sa_4', from: 'sandbox', to: 'business_system', views: ['SYS_ARCH'] },
    { id: 'r_sa_5', from: 'business_system', to: 'monitor', views: ['SYS_ARCH'] },
    { id: 'r_sa_6', from: 'monitor', to: 'kill_switch', views: ['SYS_ARCH'], dashed: true },
    { id: 'r_sa_7', from: 'kill_switch', to: 'agent', views: ['SYS_ARCH'], dashed: true },

    { id: 'r_es_1', from: 'human', to: 'evt_workflow_triggered', views: ['EVENT_STORMING'] },
    { id: 'r_es_2', from: 'evt_workflow_triggered', to: 'pol_route_agent', views: ['EVENT_STORMING'] },
    { id: 'r_es_3', from: 'pol_route_agent', to: 'cmd_tool_call', views: ['EVENT_STORMING'] },
    { id: 'r_es_4', from: 'cmd_tool_call', to: 'orchestrator', views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_5', from: 'orchestrator', to: 'workflow_memory', views: ['EVENT_STORMING'] },
    { id: 'r_es_6', from: 'cmd_tool_call', to: 'evt_api_validated', views: ['EVENT_STORMING'] },
    { id: 'r_es_7', from: 'evt_api_validated', to: 'evt_permission_checked', views: ['EVENT_STORMING'] },
    { id: 'r_es_8', from: 'evt_permission_checked', to: 'cmd_sandbox_dryrun', views: ['EVENT_STORMING'] },
    { id: 'r_es_9', from: 'cmd_sandbox_dryrun', to: 'evt_action_executed', views: ['EVENT_STORMING'] },
    { id: 'r_es_10', from: 'evt_action_executed', to: 'evt_result_stored', views: ['EVENT_STORMING'] },
    { id: 'r_es_11', from: 'evt_result_stored', to: 'dec_outcome', views: ['EVENT_STORMING'] },

    { id: 'r_es_12', from: 'dec_outcome', to: 'evt_anomaly_detected', views: ['EVENT_STORMING'], dashed: true },
    { id: 'r_es_13', from: 'evt_anomaly_detected', to: 'pol_halt_agent', views: ['EVENT_STORMING'] },
    { id: 'r_es_14', from: 'pol_halt_agent', to: 'cmd_kill_switch', views: ['EVENT_STORMING'] },
    { id: 'r_es_15', from: 'cmd_kill_switch', to: 'evt_agent_stopped', views: ['EVENT_STORMING'] },
    { id: 'r_es_16', from: 'evt_agent_stopped', to: 'pol_escalate', views: ['EVENT_STORMING'] },
    { id: 'r_es_17', from: 'pol_escalate', to: 'incident_reviewer', views: ['EVENT_STORMING'] },
    { id: 'r_es_18', from: 'incident_reviewer', to: 'evt_incident_resolved', views: ['EVENT_STORMING'] },
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
        { id: 'evt_api_validated', grid: [5, 2] },
        { id: 'evt_permission_checked', grid: [6, 2] },
        { id: 'cmd_sandbox_dryrun', grid: [7, 2] },
        { id: 'evt_action_executed', grid: [8, 2] },
        { id: 'evt_result_stored', grid: [9, 2] },
        { id: 'dec_outcome', grid: [10, 2] },
        { id: 'evt_anomaly_detected', grid: [10, 3] },
        { id: 'pol_halt_agent', grid: [11, 3] },
        { id: 'cmd_kill_switch', grid: [12, 3] },
        { id: 'evt_agent_stopped', grid: [13, 3] },
        { id: 'pol_escalate', grid: [14, 3] },
        { id: 'incident_reviewer', grid: [14, 2] },
        { id: 'evt_incident_resolved', grid: [16, 3] },
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
      ]
    },
    SYS_ARCH: {
      name: 'Defense Layers',
      icon: 'Server',
      nodes: [
        { id: 'agent', grid: [0, 2] },
        { id: 'api_contract', grid: [1, 2] },
        { id: 'permission', grid: [3, 2] },
        { id: 'sandbox', grid: [4, 2] },
        { id: 'business_system', grid: [6, 2] },
        { id: 'monitor', grid: [6, 0] },
        { id: 'kill_switch', grid: [3, 0] },
      ],
      groups: [
        {
          id: 'g1',
          title: 'Prevention Layer',
          desc: 'API contracts and permission scoping prevent unauthorized actions before they reach the sandbox.',
          nodeIds: ['api_contract', 'permission', 'sandbox'],
          color: 'rgba(166, 209, 137, 0.12)',
          borderColor: '#a6d189',
          textColor: '#c6d0f5',
        },
        {
          id: 'g2',
          title: 'Detection & Response',
          desc: 'Anomaly monitor detects drift and triggers the kill switch to halt the agent.',
          nodeIds: ['monitor', 'kill_switch'],
          color: 'rgba(231, 130, 132, 0.12)',
          borderColor: '#e78284',
          textColor: '#c6d0f5',
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
          nodeIds: ['agent', 'api_contract'],
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
          nodeIds: ['dec_outcome'],
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
  ]
}
