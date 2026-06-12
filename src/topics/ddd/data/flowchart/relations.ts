import type { UnifiedFlowchartSchema } from '../../../../sections/flowchart'

export const relations: UnifiedFlowchartSchema['relations'] = [
  // SYS_ARCH structural relations
  { id: 'r_sa_1', from: 'ubiquitous-language', to: 'bounded-contexts', views: ['SYS_ARCH'] },
  { id: 'r_sa_2', from: 'bounded-contexts', to: 'context-map', views: ['SYS_ARCH'] },
  { id: 'r_sa_3', from: 'subdomains', to: 'bounded-contexts', views: ['SYS_ARCH'] },
  { id: 'r_sa_4', from: 'bounded-contexts', to: 'aggregate', views: ['SYS_ARCH'] },
  { id: 'r_sa_5', from: 'aggregate', to: 'repository', views: ['SYS_ARCH'] },
  { id: 'r_sa_6', from: 'aggregate', to: 'domain-event', views: ['SYS_ARCH'] },
  { id: 'r_sa_7', from: 'domain-service', to: 'aggregate', views: ['SYS_ARCH'] },
  { id: 'r_sa_8', from: 'domain_expert', to: 'ubiquitous-language', views: ['SYS_ARCH'] },

  // EVENT_STORMING flow relations
  { id: 'r_es_1', from: 'domain_expert', to: 'evt_discover_domain', views: ['EVENT_STORMING'] },
  { id: 'r_es_2', from: 'evt_discover_domain', to: 'cmd_event_storm', views: ['EVENT_STORMING'] },
  { id: 'r_es_3', from: 'cmd_event_storm', to: 'evt_language_emerges', views: ['EVENT_STORMING'] },
  { id: 'r_es_4', from: 'evt_language_emerges', to: 'cmd_define_contexts', views: ['EVENT_STORMING'] },
  { id: 'r_es_5', from: 'cmd_define_contexts', to: 'dec_split_context', views: ['EVENT_STORMING'] },
  { id: 'r_es_6', from: 'dec_split_context', to: 'cmd_map_relationships', views: ['EVENT_STORMING'] },
  { id: 'r_es_7', from: 'cmd_map_relationships', to: 'evt_contexts_defined', views: ['EVENT_STORMING'] },
  { id: 'r_es_8', from: 'evt_contexts_defined', to: 'cmd_build_model', views: ['EVENT_STORMING'] },
  { id: 'r_es_9', from: 'cmd_build_model', to: 'pol_enforce_invariants', views: ['EVENT_STORMING'] },
  { id: 'r_es_10', from: 'pol_enforce_invariants', to: 'evt_model_implemented', views: ['EVENT_STORMING'] },
]
