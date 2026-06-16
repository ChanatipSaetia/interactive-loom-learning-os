import { TYPES } from '../../../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../../../sections/flowchart'

export const accountabilitySchema: UnifiedFlowchartSchema = {
  entities: {
    business_owner: {
      title: 'Business Owner',
      desc: 'Owns the workflow\'s business purpose and risk appetite.',
      viewTypes: { SYS_ARCH: TYPES.USER },
    },
    technical_owner: {
      title: 'Technical Owner',
      desc: 'Owns architecture, integrations, deployment, and uptime.',
      viewTypes: { SYS_ARCH: TYPES.USER },
    },
    dual_key: {
      title: 'Dual-Key Gate',
      desc: 'Neither owner can act alone. Both must authorize changes.',
      viewTypes: { SYS_ARCH: TYPES.DECISION },
    },
    data_owner: {
      title: 'Data Owner',
      desc: 'Source-of-truth governance for data sources.',
      viewTypes: { SYS_ARCH: TYPES.SERVICE },
    },
    model_oversight: {
      title: 'Model Oversight',
      desc: 'Tracks drift, bias, and behavioral change over time.',
      viewTypes: { SYS_ARCH: TYPES.SERVICE },
    },
    agent_system: {
      title: 'Agent System',
      desc: 'The deployed agent under accountability governance.',
      viewTypes: { SYS_ARCH: TYPES.SERVICE },
    },
  },
  relations: [
    { id: 'r1', from: 'business_owner', to: 'dual_key', views: ['SYS_ARCH'] },
    { id: 'r2', from: 'technical_owner', to: 'dual_key', views: ['SYS_ARCH'] },
    { id: 'r3', from: 'dual_key', to: 'agent_system', views: ['SYS_ARCH'] },
    { id: 'r4', from: 'data_owner', to: 'dual_key', views: ['SYS_ARCH'], dashed: true },
    { id: 'r5', from: 'model_oversight', to: 'dual_key', views: ['SYS_ARCH'], dashed: true },
    { id: 'r6', from: 'data_owner', to: 'agent_system', views: ['SYS_ARCH'], dashed: true },
    { id: 'r7', from: 'model_oversight', to: 'agent_system', views: ['SYS_ARCH'], dashed: true },
  ],
  views: {
    SYS_ARCH: {
      name: 'Accountability Chain',
      icon: 'Server',
      nodes: [
        { id: 'business_owner', grid: [0, 0] },
        { id: 'technical_owner', grid: [0, 2] },
        { id: 'dual_key', grid: [2, 1] },
        { id: 'agent_system', grid: [3, 1] },
        { id: 'data_owner', grid: [2, 0] },
        { id: 'model_oversight', grid: [2, 3] },
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
      ]
    }
  },
  journeys: [
    {
      id: 'accountability-chain',
      label: 'Accountability Flow',
      description: 'Follow how accountability is structured through dual-key ownership and specialist oversight.',
      steps: [
        {
          nodeIds: ['business_owner', 'technical_owner'],
          description: 'Dual-Key Owners — The Business Owner defines purpose and risk appetite. The Technical Owner owns architecture and uptime.',
        },
        {
          nodeIds: ['dual_key'],
          description: 'Dual-Key Gate — Neither owner can act alone. Both must authorize changes to the agent\'s scope, authority, or deployment.',
        },
        {
          nodeIds: ['data_owner', 'model_oversight'],
          description: 'Specialist Functions — Data Owner governs source-of-truth quality. Model Oversight tracks drift and behavioral change. Both report to the dual-key owners.',
        },
        {
          nodeIds: ['agent_system'],
          description: 'Agent System — Operates under the governance of all four accountability roles.',
        },
      ]
    }
  ]
}
