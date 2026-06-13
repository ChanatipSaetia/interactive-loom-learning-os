import type { FlowchartJourney } from '../../../../../../sections/flowchart'

export const taskFlowJourney: FlowchartJourney = {
  id: 'task-flow',
  label: 'Task Flow (Happy Path)',
  description: 'Follow a task from Agent Card discovery through authentication, submission, execution, and completion.',
  steps: [
    {
      nodeIds: ['client_es', 'cmd_discover', 'evt_discovered'],
      description: 'Discovery — Client agent fetches Agent Card from /.well-known/agent-card to discover target agent capabilities and endpoints.',
    },
    {
      nodeIds: ['pol_auth', 'cmd_auth', 'evt_authenticated'],
      description: 'Authentication — If the Agent Card requires auth, client obtains OAuth/JWT credentials. Otherwise, proceeds directly to sending.',
    },
    {
      nodeIds: ['cmd_send', 'orch_task', 'evt_submitted'],
      description: 'Task Submission — Client POSTs to /sendMessage or /sendMessageStream. Task created with SUBMITTED state.',
    },
    {
      nodeIds: ['evt_working', 'cmd_execute'],
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
