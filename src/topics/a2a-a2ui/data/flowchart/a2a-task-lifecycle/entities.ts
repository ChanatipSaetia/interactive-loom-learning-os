import { TYPES } from '../../../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../../../sections/flowchart'

export const entities: UnifiedFlowchartSchema['entities'] = {
  // SYS_ARCH entities
  client_agent: {
    title: 'Client Agent',
    desc: 'The agent initiating requests to other agents.',
    viewTypes: { SYS_ARCH: TYPES.USER },
  },
  agent_card_ep: {
    title: 'Agent Card Endpoint',
    desc: 'Serves Agent Card at /.well-known/agent-card for discovery.',
    viewTypes: { SYS_ARCH: TYPES.EXTERNAL },
  },
  a2a_server: {
    title: 'A2A Server',
    desc: 'Target agent\'s A2A-compliant server handling requests.',
    viewTypes: { SYS_ARCH: TYPES.SERVICE },
  },
  auth_server: {
    title: 'Auth Server',
    desc: 'Optional OAuth 2.0 / JWT authentication server.',
    viewTypes: { SYS_ARCH: TYPES.SERVICE },
  },
  llm_backend: {
    title: 'LLM Backend',
    desc: 'Large language model providing reasoning for the agent.',
    viewTypes: { SYS_ARCH: TYPES.EXTERNAL },
  },
  agent_skills: {
    title: 'Agent Skills/Tools',
    desc: 'The agent\'s available capabilities and tool implementations.',
    viewTypes: { SYS_ARCH: TYPES.DATABASE },
  },
  task_store: {
    title: 'Task Store',
    desc: 'Persistent storage for task state and lifecycle data.',
    viewTypes: { SYS_ARCH: TYPES.DATABASE },
  },

  // EVENT_STORMING entities
  client_es: {
    title: 'Client Agent',
    desc: 'Client agent initiating the interaction.',
    viewTypes: { EVENT_STORMING: TYPES.USER },
  },
  cmd_discover: {
    title: 'Fetch Agent Card',
    desc: 'Client requests Agent Card from /.well-known/agent-card.',
    viewTypes: { EVENT_STORMING: TYPES.COMMAND },
  },
  evt_discovered: {
    title: 'Agent Card Retrieved',
    desc: 'Agent Card discovered successfully with capabilities and endpoints.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT },
  },
  pol_auth: {
    title: 'Check Auth Required',
    desc: 'If Agent Card requires authentication, obtain credentials first.',
    viewTypes: { EVENT_STORMING: TYPES.POLICY },
  },
  cmd_auth: {
    title: 'Request Auth Token',
    desc: 'Request authentication token from OAuth 2.0 / JWT provider.',
    viewTypes: { EVENT_STORMING: TYPES.COMMAND },
  },
  evt_authenticated: {
    title: 'Authentication Successful',
    desc: 'Token obtained; client authorized to interact with the agent.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT },
  },
  cmd_send: {
    title: 'Send Message',
    desc: 'POST /sendMessage or /sendMessageStream with task payload.',
    viewTypes: { EVENT_STORMING: TYPES.COMMAND },
  },
  orch_task: {
    title: 'Task Lifecycle',
    desc: 'Manages task state transitions through the A2A protocol.',
    viewTypes: { EVENT_STORMING: TYPES.AGGREGATE },
  },
  evt_submitted: {
    title: 'Task Submitted',
    desc: 'Task created with SUBMITTED state.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT },
  },
  evt_working: {
    title: 'Task Working',
    desc: 'Agent begins processing, task moves to WORKING state.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT },
  },
  cmd_execute: {
    title: 'Execute Skills',
    desc: 'Agent executes its skills and tools to fulfill the task.',
    viewTypes: { EVENT_STORMING: TYPES.COMMAND },
  },
  evt_artifact: {
    title: 'Artifact Streamed',
    desc: 'Task artifact streamed incrementally to the client.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT },
  },
  evt_status: {
    title: 'Status Updated',
    desc: 'Task status update pushed via SSE to the client.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT },
  },
  dec_outcome: {
    title: 'Task Outcome',
    desc: 'Determines final task state: COMPLETED, FAILED, CANCELED, or REJECTED.',
    viewTypes: { EVENT_STORMING: TYPES.DECISION },
  },
  evt_completed: {
    title: 'Task Completed',
    desc: 'Task finished successfully with final artifact.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT },
  },
  evt_failed: {
    title: 'Task Failed',
    desc: 'Task processing failed with error details.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT },
  },
  evt_canceled: {
    title: 'Task Canceled',
    desc: 'Task canceled by client during processing.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT },
  },
  evt_rejected: {
    title: 'Task Rejected',
    desc: 'Task rejected by the agent before processing began.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT },
  },
  sse_stream: {
    title: 'SSE Stream',
    desc: 'Server-Sent Events stream delivering artifacts and status.',
    viewTypes: { EVENT_STORMING: TYPES.EXTERNAL },
  },
}
