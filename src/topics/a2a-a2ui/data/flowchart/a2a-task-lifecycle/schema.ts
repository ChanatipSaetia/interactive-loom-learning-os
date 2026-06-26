import { TYPES } from '../../../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../../../sections/flowchart'

export const a2aTaskLifecycleSchema: UnifiedFlowchartSchema = {
  entities: {
    client_agent: {
      title: 'Client Agent',
      desc: 'The agent initiating requests to other agents.',
      type: TYPES.USER,
    },
    agent_card_ep: {
      title: 'Agent Card Endpoint',
      desc: 'Serves Agent Card at /.well-known/agent-card for discovery.',
      type: TYPES.EXTERNAL,
    },
    a2a_server: {
      title: 'A2A Server',
      desc: 'Target agent\'s A2A-compliant server handling requests.',
      type: TYPES.AGGREGATE,
    },
    auth_server: {
      title: 'Auth Server',
      desc: 'Optional OAuth 2.0 / JWT authentication server.',
      type: TYPES.AGGREGATE,
    },
    llm_backend: {
      title: 'LLM Backend',
      desc: 'Large language model providing reasoning for the agent.',
      type: TYPES.EXTERNAL,
    },
    agent_skills: {
      title: 'Agent Skills/Tools',
      desc: 'The agent\'s available capabilities and tool implementations.',
      type: TYPES.AGGREGATE,
    },
    task_store: {
      title: 'Task Store',
      desc: 'Persistent storage for task state and lifecycle data.',
      type: TYPES.AGGREGATE,
    },
    cmd_discover: {
      title: 'Fetch Agent Card',
      desc: 'Client requests Agent Card from /.well-known/agent-card.',
      type: TYPES.COMMAND,
    },
    evt_discovered: {
      title: 'Agent Card Retrieved',
      desc: 'Agent Card discovered successfully with capabilities and endpoints.',
      type: TYPES.EVENT,
    },
    pol_auth: {
      title: 'Check Auth Required',
      desc: 'If Agent Card requires authentication, obtain credentials first.',
      type: TYPES.POLICY,
    },
    cmd_auth: {
      title: 'Request Auth Token',
      desc: 'Request authentication token from OAuth 2.0 / JWT provider.',
      type: TYPES.COMMAND,
    },
    evt_authenticated: {
      title: 'Authentication Successful',
      desc: 'Token obtained; client authorized to interact with the agent.',
      type: TYPES.EVENT,
    },
    pol_send: {
      title: 'Trigger Task Submission',
      desc: 'When authenticated or no auth required, send task payload to A2A server.',
      type: TYPES.POLICY,
    },
    pol_process: {
      title: 'Trigger Task Execution',
      desc: 'When task is submitted, initiate agent execution.',
      type: TYPES.POLICY,
    },
    cmd_send: {
      title: 'Send Message',
      desc: 'POST /sendMessage or /sendMessageStream with task payload.',
      type: TYPES.COMMAND,
    },
    orch_task: {
      title: 'A2A Server',
      desc: 'Manages task state transitions through the A2A protocol.',
      type: TYPES.AGGREGATE,
      collapsedTo: 'a2a_server',
    },
    evt_submitted: {
      title: 'Task Submitted',
      desc: 'Task created with SUBMITTED state.',
      type: TYPES.EVENT,
    },
    evt_working: {
      title: 'Task Working',
      desc: 'Agent begins processing, task moves to WORKING state.',
      type: TYPES.EVENT,
    },
    cmd_execute: {
      title: 'Execute Skills',
      desc: 'Agent executes its skills and tools to fulfill the task.',
      type: TYPES.COMMAND,
    },
    evt_artifact: {
      title: 'Artifact Streamed',
      desc: 'Task artifact streamed incrementally to the client.',
      type: TYPES.EVENT,
    },
    evt_status: {
      title: 'Status Updated',
      desc: 'Task status update pushed via SSE to the client.',
      type: TYPES.EVENT,
    },
    dec_outcome: {
      title: 'Resolve Task Outcome',
      desc: 'Determines final task state: COMPLETED, FAILED, CANCELED, or REJECTED.',
      type: TYPES.POLICY,
    },
    evt_completed: {
      title: 'Task Completed',
      desc: 'Task finished successfully with final artifact.',
      type: TYPES.EVENT,
    },
    evt_failed: {
      title: 'Task Failed',
      desc: 'Task processing failed with error details.',
      type: TYPES.EVENT,
    },
    evt_canceled: {
      title: 'Task Canceled',
      desc: 'Task canceled by client during processing.',
      type: TYPES.EVENT,
    },
    evt_rejected: {
      title: 'Task Rejected',
      desc: 'Task rejected by the agent before processing began.',
      type: TYPES.EVENT,
    },
    sse_stream: {
      title: 'SSE Stream',
      desc: 'Server-Sent Events stream delivering artifacts and status.',
      type: TYPES.EXTERNAL,
    },
  },
  relations: [
    { id: 'r_es_1', from: 'client_agent', to: 'cmd_discover', views: ['EVENT_STORMING'] },
    { id: 'r_es_2', from: 'cmd_discover', to: 'evt_discovered', views: ['EVENT_STORMING'] },
    { id: 'r_es_2_hb', from: 'cmd_discover', to: 'agent_card_ep', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r_es_3', from: 'evt_discovered', to: 'pol_auth', views: ['EVENT_STORMING'] },
    { id: 'r_es_4', from: 'pol_auth', to: 'cmd_auth', views: ['EVENT_STORMING'], dashed: true },
    { id: 'r_es_5', from: 'cmd_auth', to: 'evt_authenticated', views: ['EVENT_STORMING'] },
    { id: 'r_es_5_hb', from: 'cmd_auth', to: 'auth_server', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r_es_6', from: 'evt_authenticated', to: 'pol_send', views: ['EVENT_STORMING'] },
    { id: 'r_es_7', from: 'pol_auth', to: 'pol_send', views: ['EVENT_STORMING'] },
    { id: 'r_es_7a', from: 'pol_send', to: 'cmd_send', views: ['EVENT_STORMING'] },
    { id: 'r_es_8', from: 'cmd_send', to: 'orch_task', views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_8_hb', from: 'cmd_send', to: 'a2a_server', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r_es_9', from: 'orch_task', to: 'evt_submitted', views: ['EVENT_STORMING'] },
    { id: 'r_es_db_1', from: 'orch_task', to: 'task_store', views: ['EVENT_STORMING'] },
    { id: 'r_es_10', from: 'evt_submitted', to: 'pol_process', views: ['EVENT_STORMING'] },
    { id: 'r_es_10a', from: 'pol_process', to: 'cmd_execute', views: ['EVENT_STORMING'] },
    { id: 'r_es_11_hb', from: 'cmd_execute', to: 'a2a_server', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r_es_11', from: 'cmd_execute', to: 'evt_working', views: ['EVENT_STORMING'] },
    { id: 'r_es_db_2', from: 'orch_task', to: 'agent_skills', views: ['EVENT_STORMING'] },
    { id: 'r_es_llm', from: 'orch_task', to: 'llm_backend', views: ['EVENT_STORMING'] },
    { id: 'r_es_12', from: 'cmd_execute', to: 'evt_artifact', views: ['EVENT_STORMING'] },
    { id: 'r_es_13', from: 'evt_artifact', to: 'evt_status', views: ['EVENT_STORMING'] },
    { id: 'r_es_14', from: 'evt_status', to: 'dec_outcome', views: ['EVENT_STORMING'] },
    { id: 'r_es_15', from: 'sse_stream', to: 'evt_artifact', views: ['EVENT_STORMING'], dashed: true },
    { id: 'r_es_16', from: 'dec_outcome', to: 'evt_completed', views: ['EVENT_STORMING'] },
    { id: 'r_es_17', from: 'dec_outcome', to: 'evt_failed', views: ['EVENT_STORMING'] },
    { id: 'r_es_18', from: 'dec_outcome', to: 'evt_canceled', views: ['EVENT_STORMING'] },
    { id: 'r_es_19', from: 'dec_outcome', to: 'evt_rejected', views: ['EVENT_STORMING'] },
  ],
  views: {
    EVENT_STORMING: {
      name: 'A2A Request Lifecycle',
      icon: 'Component',
      nodes: [
        { id: 'client_agent', grid: [0, 2] },
        { id: 'cmd_discover', grid: [1, 2] },
        { id: 'agent_card_ep', grid: [2, 1] },
        { id: 'evt_discovered', grid: [2, 2] },
        { id: 'pol_auth', grid: [3, 2] },
        { id: 'cmd_auth', grid: [4, 2] },
        { id: 'auth_server', grid: [4, 1] },
        { id: 'evt_authenticated', grid: [5, 2] },
        { id: 'pol_send', grid: [6, 2] },
        { id: 'cmd_send', grid: [7, 2] },
        { id: 'a2a_server', grid: [7, 1] },
        { id: 'task_store', grid: [7, 0] },
        { id: 'orch_task', grid: [8, 1] },
        { id: 'evt_submitted', grid: [8, 2] },
        { id: 'pol_process', grid: [9, 2] },
        { id: 'cmd_execute', grid: [10, 2] },
        { id: 'evt_working', grid: [11, 2] },
        { id: 'agent_skills', grid: [11, 0] },
        { id: 'llm_backend', grid: [11, 1] },
        { id: 'evt_artifact', grid: [12, 2] },
        { id: 'sse_stream', grid: [12, 1] },
        { id: 'evt_status', grid: [13, 2] },
        { id: 'dec_outcome', grid: [14, 2] },
        { id: 'evt_completed', grid: [15, 2] },
        { id: 'evt_failed', grid: [15, 3] },
        { id: 'evt_canceled', grid: [15, 4] },
        { id: 'evt_rejected', grid: [14, 3] },
      ],
      groups: [
        {
          id: 'g_discovery',
          title: 'Discovery',
          desc: 'Client agent fetches the Agent Card to discover target agent capabilities and endpoints.',
          nodeIds: ['client_agent', 'cmd_discover', 'agent_card_ep', 'evt_discovered'],
          color: 'rgba(140, 170, 238, 0.12)',
          borderColor: 'var(--ctp-blue)',
          textColor: 'var(--ctp-text)',
        },
        {
          id: 'g_auth',
          title: 'Authentication',
          desc: 'Optional authentication flow when the Agent Card requires credentials.',
          nodeIds: ['pol_auth', 'cmd_auth', 'auth_server', 'evt_authenticated'],
          color: 'rgba(166, 209, 137, 0.12)',
          borderColor: 'var(--ctp-green)',
          textColor: 'var(--ctp-text)',
        },
        {
          id: 'g_execution',
          title: 'Task Execution',
          desc: 'Task submission, processing, and streaming of artifacts and status updates via SSE.',
          nodeIds: ['pol_send', 'cmd_send', 'a2a_server', 'task_store', 'orch_task', 'evt_submitted', 'pol_process', 'evt_working', 'cmd_execute', 'agent_skills', 'llm_backend', 'evt_artifact', 'sse_stream', 'evt_status'],
          color: 'rgba(239, 159, 118, 0.12)',
          borderColor: 'var(--ctp-peach)',
          textColor: 'var(--ctp-text)',
        },
        {
          id: 'g_outcomes',
          title: 'Task Outcomes',
          desc: 'Final task state resolution: completed, failed, canceled, or rejected.',
          nodeIds: ['dec_outcome', 'evt_completed', 'evt_failed', 'evt_canceled', 'evt_rejected'],
          color: 'rgba(202, 158, 230, 0.12)',
          borderColor: 'var(--ctp-mauve)',
          textColor: 'var(--ctp-text)',
        },
      ]
    }
  },
  journeys: [
    {
      id: 'stream-flow',
      label: 'Stream Flow (Streaming Focus)',
      description: 'Follow the SSE streaming path from stream initiation through incremental updates to stream closure.',
      steps: [
        {
          nodeIds: ['cmd_send', 'a2a_server', 'evt_submitted'],
          description: 'Stream Initiation — Client POSTs to /sendMessageStream. Task created, SSE connection established.',
        },
        {
          nodeIds: ['pol_process', 'cmd_execute', 'evt_working'],
          description: 'Incremental Updates — Task moves to WORKING. Agent begins executing skills, generating interim results.',
        },
        {
          nodeIds: ['evt_artifact', 'sse_stream'],
          description: 'Artifact Delivery — Artifacts streamed incrementally through the SSE connection as the agent produces them.',
        },
        {
          nodeIds: ['evt_status', 'dec_outcome', 'evt_completed'],
          description: 'Stream Closure — Final status update pushed. Task completes, SSE stream closes with COMPLETED state.',
        },
      ],
    },
    {
      id: 'task-flow',
      label: 'Task Flow (Happy Path)',
      description: 'Follow a task from Agent Card discovery through authentication, submission, execution, and completion.',
      steps: [
        {
          nodeIds: ['client_agent', 'cmd_discover', 'evt_discovered'],
          description: 'Discovery — Client agent fetches Agent Card from /.well-known/agent-card to discover target agent capabilities and endpoints.',
        },
        {
          nodeIds: ['pol_auth', 'cmd_auth', 'evt_authenticated'],
          description: 'Authentication — If the Agent Card requires auth, client obtains OAuth/JWT credentials. Otherwise, proceeds directly to sending.',
        },
        {
          nodeIds: ['pol_send', 'cmd_send', 'a2a_server', 'evt_submitted'],
          description: 'Task Submission — Client POSTs to /sendMessage or /sendMessageStream. Task created with SUBMITTED state.',
        },
        {
          nodeIds: ['pol_process', 'cmd_execute', 'evt_working'],
          description: 'Execution — Agent processes the task, state moves to WORKING. Agent executes its skills and tools.',
        },
        {
          nodeIds: ['evt_artifact', 'evt_status', 'sse_stream'],
          description: 'Artifacts — Agent streams artifacts and status updates to the client via SSE.',
        },
        {
          nodeIds: ['dec_outcome', 'evt_completed'],
          description: 'Completion — Task reaches COMPLETED state with final artifact delivered.',
        },
      ],
    }
  ]
}
