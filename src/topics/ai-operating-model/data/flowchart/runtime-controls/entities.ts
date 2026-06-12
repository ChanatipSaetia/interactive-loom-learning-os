import { TYPES } from '../../../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../../../sections/flowchart'

export const entities: UnifiedFlowchartSchema['entities'] = {
  // SYS_ARCH entities
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

  // EVENT_STORMING entities
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
  // Incident response branch
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
}
