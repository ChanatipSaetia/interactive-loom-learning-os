import type { FlowchartViewConfig } from '../../../../../sections/flowchart'

export const eventStormingView: FlowchartViewConfig = {
  name: 'DDD Discovery Process',
  icon: 'GitBranch',
  nodes: [
    { id: 'domain_expert', x: 30, y: 250 },
    { id: 'evt_discover_domain', x: 180, y: 120 },
    { id: 'cmd_event_storm', x: 360, y: 250 },
    { id: 'evt_language_emerges', x: 520, y: 120 },
    { id: 'cmd_define_contexts', x: 680, y: 250 },
    { id: 'dec_split_context', x: 840, y: 250 },
    { id: 'cmd_map_relationships', x: 1000, y: 250 },
    { id: 'evt_contexts_defined', x: 1160, y: 120 },
    { id: 'cmd_build_model', x: 1160, y: 380 },
    { id: 'pol_enforce_invariants', x: 1320, y: 380 },
    { id: 'evt_model_implemented', x: 1480, y: 250 },
  ],
  groups: [
    {
      id: 'es_discovery',
      title: 'Discovery Phase',
      desc: 'Event Storming reveals the ubiquitous language and domain events.',
      nodeIds: ['evt_discover_domain', 'cmd_event_storm', 'evt_language_emerges'],
      color: 'rgba(245, 194, 230, 0.12)',
      borderColor: '#f2cde7',
      textColor: '#f2cde7',
    },
    {
      id: 'es_context',
      title: 'Context Definition',
      desc: 'Bounded contexts drawn where model diverges. Relationships mapped.',
      nodeIds: ['cmd_define_contexts', 'dec_split_context', 'cmd_map_relationships', 'evt_contexts_defined'],
      color: 'rgba(148, 226, 213, 0.12)',
      borderColor: '#94e2d5',
      textColor: '#94e2d5',
    },
    {
      id: 'es_implementation',
      title: 'Tactical Implementation',
      desc: 'Entities, Aggregates, Events implemented within bounded context.',
      nodeIds: ['cmd_build_model', 'pol_enforce_invariants', 'evt_model_implemented'],
      color: 'rgba(132, 185, 240, 0.12)',
      borderColor: '#85a6f4',
      textColor: '#85a6f4',
    },
  ]
}
