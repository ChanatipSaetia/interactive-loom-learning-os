import type { UnifiedFlowchartSchema } from '../../../../../sections/flowchart'

export const relations: UnifiedFlowchartSchema['relations'] = [
  // SYS_ARCH relations (structural)
  { id: 'r_sa_1', from: 'client_agent', to: 'agent_card_ep', views: ['SYS_ARCH'] },
  { id: 'r_sa_2', from: 'client_agent', to: 'a2a_server', views: ['SYS_ARCH'] },
  { id: 'r_sa_3', from: 'a2a_server', to: 'auth_server', views: ['SYS_ARCH'], dashed: true },
  { id: 'r_sa_4', from: 'a2a_server', to: 'llm_backend', views: ['SYS_ARCH'] },
  { id: 'r_sa_5', from: 'a2a_server', to: 'agent_skills', views: ['SYS_ARCH'] },
  { id: 'r_sa_6', from: 'a2a_server', to: 'task_store', views: ['SYS_ARCH'] },

  // EVENT_STORMING relations
  { id: 'r_es_1', from: 'client_es', to: 'cmd_discover', views: ['EVENT_STORMING'] },
  { id: 'r_es_2', from: 'cmd_discover', to: 'evt_discovered', views: ['EVENT_STORMING'] },
  { id: 'r_es_3', from: 'evt_discovered', to: 'pol_auth', views: ['EVENT_STORMING'] },
  { id: 'r_es_4', from: 'pol_auth', to: 'cmd_auth', views: ['EVENT_STORMING'], dashed: true },
  { id: 'r_es_5', from: 'cmd_auth', to: 'evt_authenticated', views: ['EVENT_STORMING'] },
  { id: 'r_es_6', from: 'evt_authenticated', to: 'cmd_send', views: ['EVENT_STORMING'] },
  { id: 'r_es_7', from: 'pol_auth', to: 'cmd_send', views: ['EVENT_STORMING'] },
  { id: 'r_es_8', from: 'cmd_send', to: 'orch_task', views: ['EVENT_STORMING'], handledBy: true },
  { id: 'r_es_9', from: 'orch_task', to: 'evt_submitted', views: ['EVENT_STORMING'] },
  { id: 'r_es_10', from: 'evt_submitted', to: 'evt_working', views: ['EVENT_STORMING'] },
  { id: 'r_es_11', from: 'evt_working', to: 'cmd_execute', views: ['EVENT_STORMING'] },
  { id: 'r_es_12', from: 'cmd_execute', to: 'evt_artifact', views: ['EVENT_STORMING'] },
  { id: 'r_es_13', from: 'evt_artifact', to: 'evt_status', views: ['EVENT_STORMING'] },
  { id: 'r_es_14', from: 'evt_status', to: 'dec_outcome', views: ['EVENT_STORMING'] },
  { id: 'r_es_15', from: 'sse_stream', to: 'evt_artifact', views: ['EVENT_STORMING'], dashed: true },
  { id: 'r_es_16', from: 'dec_outcome', to: 'evt_completed', views: ['EVENT_STORMING'] },
  { id: 'r_es_17', from: 'dec_outcome', to: 'evt_failed', views: ['EVENT_STORMING'] },
  { id: 'r_es_18', from: 'dec_outcome', to: 'evt_canceled', views: ['EVENT_STORMING'] },
  { id: 'r_es_19', from: 'dec_outcome', to: 'evt_rejected', views: ['EVENT_STORMING'] },
]
