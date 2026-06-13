import type { FlowchartViewConfig } from '../../../../../../sections/flowchart'

export const eventStormingView: FlowchartViewConfig = {
  name: 'A2A Request Lifecycle',
  icon: 'Component',
  nodes: [
    // Main line at y=250
    { id: 'client_es', x: 60, y: 250 },
    { id: 'cmd_discover', x: 200, y: 250 },
    { id: 'evt_discovered', x: 340, y: 250 },
    { id: 'pol_auth', x: 480, y: 250 },
    { id: 'cmd_send', x: 760, y: 250 },
    { id: 'evt_submitted', x: 900, y: 250 },
    { id: 'evt_working', x: 1040, y: 250 },
    { id: 'cmd_execute', x: 1180, y: 250 },
    { id: 'evt_artifact', x: 1320, y: 250 },
    { id: 'evt_status', x: 1460, y: 250 },
    { id: 'dec_outcome', x: 1600, y: 250 },

    // Auth branch above main line
    { id: 'cmd_auth', x: 620, y: 100 },
    { id: 'evt_authenticated', x: 760, y: 100 },

    // SSE stream above
    { id: 'sse_stream', x: 1320, y: 100 },

    // Outcomes below decision
    { id: 'evt_completed', x: 1600, y: 400 },
    { id: 'evt_failed', x: 1780, y: 400 },
    { id: 'evt_canceled', x: 1960, y: 400 },
    { id: 'evt_rejected', x: 2140, y: 400 },
  ],
  groups: [
    {
      id: 'g_discovery',
      title: 'Discovery',
      desc: 'Client agent fetches the Agent Card to discover target agent capabilities and endpoints.',
      nodeIds: ['client_es', 'cmd_discover', 'evt_discovered'],
      color: 'rgba(140, 170, 238, 0.12)',
      borderColor: '#8caaee',
      textColor: '#c6d0f5',
    },
    {
      id: 'g_auth',
      title: 'Authentication',
      desc: 'Optional authentication flow when the Agent Card requires credentials.',
      nodeIds: ['pol_auth', 'cmd_auth', 'evt_authenticated'],
      color: 'rgba(166, 209, 137, 0.12)',
      borderColor: '#a6d189',
      textColor: '#c6d0f5',
    },
    {
      id: 'g_execution',
      title: 'Task Execution',
      desc: 'Task submission, processing, and streaming of artifacts and status updates via SSE.',
      nodeIds: ['cmd_send', 'orch_task', 'evt_submitted', 'evt_working', 'cmd_execute', 'evt_artifact', 'evt_status', 'sse_stream'],
      color: 'rgba(239, 159, 118, 0.12)',
      borderColor: '#ef9f76',
      textColor: '#c6d0f5',
    },
    {
      id: 'g_outcomes',
      title: 'Task Outcomes',
      desc: 'Final task state resolution: completed, failed, canceled, or rejected.',
      nodeIds: ['dec_outcome', 'evt_completed', 'evt_failed', 'evt_canceled', 'evt_rejected'],
      color: 'rgba(202, 158, 230, 0.12)',
      borderColor: '#ca9ee6',
      textColor: '#c6d0f5',
    },
  ],
}
