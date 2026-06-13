import type { FlowchartJourney } from '../../../../../../sections/flowchart'

export const streamFlowJourney: FlowchartJourney = {
  id: 'stream-flow',
  label: 'Stream Flow (Streaming Focus)',
  description: 'Follow the SSE streaming path from stream initiation through incremental updates to stream closure.',
  steps: [
    {
      nodeIds: ['cmd_send', 'orch_task', 'evt_submitted'],
      description: 'Stream Initiation — Client POSTs to /sendMessageStream. Task created, SSE connection established.',
    },
    {
      nodeIds: ['evt_working', 'cmd_execute'],
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
}
