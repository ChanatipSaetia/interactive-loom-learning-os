import type { FlowchartViewConfig } from '../../../../../../sections/flowchart'

export const sysArchView: FlowchartViewConfig = {
  name: 'Accountability Chain',
  icon: 'Server',
  nodes: [
    { id: 'business_owner', x: 80, y: 100 },
    { id: 'technical_owner', x: 80, y: 340 },
    { id: 'dual_key', x: 320, y: 220 },
    { id: 'agent_system', x: 560, y: 220 },
    { id: 'data_owner', x: 320, y: 60 },
    { id: 'model_oversight', x: 320, y: 400 },
  ],
  groups: [
    {
      id: 'g1',
      title: 'Dual-Key Owners',
      desc: 'Business Owner and Technical Owner must both authorize. Neither can act alone.',
      nodeIds: ['business_owner', 'technical_owner', 'dual_key'],
      color: 'rgba(140, 170, 238, 0.12)',
      borderColor: '#8caaee',
      textColor: '#c6d0f5',
    },
    {
      id: 'g2',
      title: 'Specialist Functions',
      desc: 'Data Owner and Model Oversight report to the dual-key owners.',
      nodeIds: ['data_owner', 'model_oversight'],
      color: 'rgba(202, 158, 230, 0.12)',
      borderColor: '#ca9ee6',
      textColor: '#c6d0f5',
    },
  ],
}
