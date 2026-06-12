import type { UnifiedFlowchartSchema } from '../../../../../sections/flowchart'

export const relations: UnifiedFlowchartSchema['relations'] = [
  // SYS_ARCH relations (structural)
  { id: 'r_sa_1', from: 'agent', to: 'api_contract', views: ['SYS_ARCH'] },
  { id: 'r_sa_2', from: 'api_contract', to: 'permission', views: ['SYS_ARCH'] },
  { id: 'r_sa_3', from: 'permission', to: 'sandbox', views: ['SYS_ARCH'] },
  { id: 'r_sa_4', from: 'sandbox', to: 'business_system', views: ['SYS_ARCH'] },
  { id: 'r_sa_5', from: 'business_system', to: 'monitor', views: ['SYS_ARCH'] },
  { id: 'r_sa_6', from: 'monitor', to: 'kill_switch', views: ['SYS_ARCH'], dashed: true },
  { id: 'r_sa_7', from: 'kill_switch', to: 'agent', views: ['SYS_ARCH'], dashed: true },

  // EVENT_STORMING relations - Happy path
  { id: 'r_es_1', from: 'human', to: 'evt_workflow_triggered', views: ['EVENT_STORMING'] },
  { id: 'r_es_2', from: 'evt_workflow_triggered', to: 'pol_route_agent', views: ['EVENT_STORMING'] },
  { id: 'r_es_3', from: 'pol_route_agent', to: 'cmd_tool_call', views: ['EVENT_STORMING'] },
  { id: 'r_es_4', from: 'cmd_tool_call', to: 'orchestrator', views: ['EVENT_STORMING'], handledBy: true },
  { id: 'r_es_5', from: 'orchestrator', to: 'workflow_memory', views: ['EVENT_STORMING'] },
  { id: 'r_es_6', from: 'cmd_tool_call', to: 'evt_api_validated', views: ['EVENT_STORMING'] },
  { id: 'r_es_7', from: 'evt_api_validated', to: 'evt_permission_checked', views: ['EVENT_STORMING'] },
  { id: 'r_es_8', from: 'evt_permission_checked', to: 'cmd_sandbox_dryrun', views: ['EVENT_STORMING'] },
  { id: 'r_es_9', from: 'cmd_sandbox_dryrun', to: 'evt_action_executed', views: ['EVENT_STORMING'] },
  { id: 'r_es_10', from: 'evt_action_executed', to: 'evt_result_stored', views: ['EVENT_STORMING'] },
  { id: 'r_es_11', from: 'evt_result_stored', to: 'dec_outcome', views: ['EVENT_STORMING'] },

  // EVENT_STORMING relations - Incident response branch (downward divergence)
  { id: 'r_es_12', from: 'dec_outcome', to: 'evt_anomaly_detected', views: ['EVENT_STORMING'], dashed: true },
  { id: 'r_es_13', from: 'evt_anomaly_detected', to: 'pol_halt_agent', views: ['EVENT_STORMING'] },
  { id: 'r_es_14', from: 'pol_halt_agent', to: 'cmd_kill_switch', views: ['EVENT_STORMING'] },
  { id: 'r_es_15', from: 'cmd_kill_switch', to: 'evt_agent_stopped', views: ['EVENT_STORMING'] },
  { id: 'r_es_16', from: 'evt_agent_stopped', to: 'pol_escalate', views: ['EVENT_STORMING'] },
  { id: 'r_es_17', from: 'pol_escalate', to: 'incident_reviewer', views: ['EVENT_STORMING'] },
  { id: 'r_es_18', from: 'incident_reviewer', to: 'evt_incident_resolved', views: ['EVENT_STORMING'] },
]
