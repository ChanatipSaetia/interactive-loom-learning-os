import type { FlowchartViewConfig } from '../../../../../../sections/flowchart'

export const sysArchView: FlowchartViewConfig = {
  name: 'Defense Layers',
  icon: 'Server',
  nodes: [
    { id: 'agent', x: 60, y: 250 },
    { id: 'api_contract', x: 260, y: 250 },
    { id: 'permission', x: 460, y: 250 },
    { id: 'sandbox', x: 660, y: 250 },
    { id: 'business_system', x: 860, y: 250 },
    { id: 'monitor', x: 860, y: 80 },
    { id: 'kill_switch', x: 460, y: 80 },
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
  ],
}
