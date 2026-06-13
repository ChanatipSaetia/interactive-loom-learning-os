import type { FlowchartViewConfig } from '../../../../../../sections/flowchart'

export const sysArchView: FlowchartViewConfig = {
  name: 'A2A System Architecture',
  icon: 'Server',
  nodes: [
    { id: 'client_agent', x: 80, y: 250 },
    { id: 'agent_card_ep', x: 300, y: 120 },
    { id: 'a2a_server', x: 500, y: 250 },
    { id: 'auth_server', x: 300, y: 380 },
    { id: 'llm_backend', x: 750, y: 120 },
    { id: 'agent_skills', x: 750, y: 300 },
    { id: 'task_store', x: 750, y: 420 },
  ],
  groups: [
    {
      id: 'g_host',
      title: 'A2A Agent Host',
      desc: 'The target agent server with its authentication, skills, tools, and task persistence.',
      nodeIds: ['a2a_server', 'auth_server', 'agent_skills', 'task_store'],
      color: 'rgba(133, 193, 220, 0.12)',
      borderColor: '#85c1dc',
      textColor: '#c6d0f5',
    },
  ],
}
