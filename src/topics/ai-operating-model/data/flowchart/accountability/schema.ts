import { TYPES } from '../../../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../../../sections/flowchart'

export const accountabilitySchema: UnifiedFlowchartSchema = {
  entities: {
    business_owner: {
      title: 'Business Owner',
      desc: 'Owns the workflow\'s business purpose and risk appetite.',
      type: TYPES.USER,
    },
    technical_owner: {
      title: 'Technical Owner',
      desc: 'Owns architecture, integrations, deployment, and uptime.',
      type: TYPES.USER,
    },
    dual_key: {
      title: 'Dual-Key Gate',
      desc: 'Neither owner can act alone. Both must authorize changes.',
      type: TYPES.AGGREGATE,
    },
    data_owner: {
      title: 'Data Owner',
      desc: 'Source-of-truth governance for data sources.',
      type: TYPES.AGGREGATE,
    },
    model_oversight: {
      title: 'Model Oversight',
      desc: 'Tracks drift, bias, and behavioral change over time.',
      type: TYPES.AGGREGATE,
    },
    agent_system: {
      title: 'Agent System',
      desc: 'The deployed agent under accountability governance.',
      type: TYPES.AGGREGATE,
    },
    cmd_propose: {
      title: 'Propose Agent Change',
      desc: 'Initiate a change request to the agent scope or model.',
      type: TYPES.COMMAND,
      root: true,
    },
    evt_change_proposed: {
      title: 'Change Proposed',
      desc: 'Change request submitted and awaiting dual-key validation.',
      type: TYPES.EVENT,
    },
    pol_dual_key: {
      title: 'Check Dual-Key',
      desc: 'Ensure both Business and Technical owners review and approve the proposal.',
      type: TYPES.POLICY,
    },
    cmd_authorize: {
      title: 'Authorize Change',
      desc: 'Grant approval from both keys to execute the change.',
      type: TYPES.COMMAND,
    },
    evt_authorized: {
      title: 'Change Authorized',
      desc: 'Dual-key authorization successful, proceeding to deployment.',
      type: TYPES.EVENT,
    },
    pol_deploy: {
      title: 'Deploy Policy',
      desc: 'Deploy the authorized change to the production agent system.',
      type: TYPES.POLICY,
    },
    cmd_deploy: {
      title: 'Update Agent Scope',
      desc: 'Apply changes and deploy updated agent system.',
      type: TYPES.COMMAND,
    },
    evt_deployed: {
      title: 'Agent Deployed',
      desc: 'Agent is active under updated governance.',
      type: TYPES.EVENT,
    },
  },
  relations: [
    { id: 'r1', from: 'business_owner', to: 'cmd_propose', views: ['EVENT_STORMING'] },
    { id: 'r2', from: 'technical_owner', to: 'cmd_propose', views: ['EVENT_STORMING'] },
    { id: 'r3', from: 'cmd_propose', to: 'dual_key', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r4', from: 'dual_key', to: 'evt_change_proposed', views: ['EVENT_STORMING'] },
    { id: 'r5', from: 'evt_change_proposed', to: 'pol_dual_key', views: ['EVENT_STORMING'] },
    { id: 'r6', from: 'pol_dual_key', to: 'cmd_authorize', views: ['EVENT_STORMING'] },
    { id: 'r7', from: 'cmd_authorize', to: 'dual_key', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r8', from: 'data_owner', to: 'cmd_authorize', handledBy: true, views: ['EVENT_STORMING'], dashed: true },
    { id: 'r9', from: 'model_oversight', to: 'cmd_authorize', handledBy: true, views: ['EVENT_STORMING'], dashed: true },
    { id: 'r10', from: 'dual_key', to: 'evt_authorized', views: ['EVENT_STORMING'] },
    { id: 'r11', from: 'evt_authorized', to: 'pol_deploy', views: ['EVENT_STORMING'] },
    { id: 'r12', from: 'pol_deploy', to: 'cmd_deploy', views: ['EVENT_STORMING'] },
    { id: 'r13', from: 'cmd_deploy', to: 'agent_system', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r14', from: 'data_owner', to: 'cmd_deploy', handledBy: true, views: ['EVENT_STORMING'], dashed: true },
    { id: 'r15', from: 'model_oversight', to: 'cmd_deploy', handledBy: true, views: ['EVENT_STORMING'], dashed: true },
    { id: 'r16', from: 'agent_system', to: 'evt_deployed', views: ['EVENT_STORMING'] },
  ],
  views: {
    EVENT_STORMING: {
      name: 'Accountability Chain',
      icon: 'Component',
      nodes: [
        { id: 'business_owner', grid: [0, 0] },
        { id: 'technical_owner', grid: [0, 2] },
        { id: 'cmd_propose', grid: [1, 2] },
        { id: 'dual_key', grid: [2, 1] },
        { id: 'evt_change_proposed', grid: [2, 2] },
        { id: 'pol_dual_key', grid: [3, 2] },
        { id: 'data_owner', grid: [4, 0] },
        { id: 'model_oversight', grid: [4, 3] },
        { id: 'cmd_authorize', grid: [4, 2] },
        { id: 'evt_authorized', grid: [5, 2] },
        { id: 'pol_deploy', grid: [6, 2] },
        { id: 'cmd_deploy', grid: [7, 2] },
        { id: 'agent_system', grid: [7, 1] },
        { id: 'evt_deployed', grid: [8, 2] },
      ],
      groups: [
        {
          id: 'g1',
          title: 'Dual-Key Owners',
          desc: 'Business Owner and Technical Owner must both authorize. Neither can act alone.',
          nodeIds: ['business_owner', 'technical_owner', 'cmd_propose', 'dual_key', 'evt_change_proposed', 'pol_dual_key', 'cmd_authorize', 'evt_authorized'],
          color: 'rgba(140, 170, 238, 0.12)',
          borderColor: 'var(--ctp-blue)',
          textColor: 'var(--ctp-text)',
        },
        {
          id: 'g2',
          title: 'Specialist Functions & Deploy',
          desc: 'Data Owner and Model Oversight report to the dual-key owners and audit the active agent system.',
          nodeIds: ['data_owner', 'model_oversight', 'pol_deploy', 'cmd_deploy', 'agent_system', 'evt_deployed'],
          color: 'rgba(202, 158, 230, 0.12)',
          borderColor: 'var(--ctp-mauve)',
          textColor: 'var(--ctp-text)',
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
          nodeIds: ['business_owner', 'technical_owner', 'cmd_propose'],
          description: 'Dual-Key Owners — The Business Owner defines purpose and risk appetite. The Technical Owner owns architecture and uptime.',
        },
        {
          nodeIds: ['dual_key', 'evt_change_proposed', 'pol_dual_key'],
          description: 'Dual-Key Gate — Neither owner can act alone. Both must authorize changes to the agent\'s scope, authority, or deployment.',
        },
        {
          nodeIds: ['data_owner', 'model_oversight', 'cmd_authorize'],
          description: 'Specialist Functions — Data Owner governs source-of-truth quality. Model Oversight tracks drift and behavioral change. Both report to the dual-key owners.',
        },
        {
          nodeIds: ['agent_system', 'evt_deployed'],
          description: 'Agent System — Operates under the governance of all four accountability roles.',
        },
      ]
    }
  ]
}
