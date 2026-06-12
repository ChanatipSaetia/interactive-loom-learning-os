import type { FlowchartJourney } from '../../../../../sections/flowchart'

export const dddDiscoveryJourney: FlowchartJourney = {
  id: 'ddd-discovery',
  label: 'DDD Discovery Process',
  description: 'Follow the journey from domain discovery through Event Storming to tactical implementation.',
  steps: [
    {
      nodeIds: ['domain_expert', 'evt_discover_domain'],
      description: 'Domain Discovered — Domain experts collaborate to identify business complexity.',
    },
    {
      nodeIds: ['cmd_event_storm', 'evt_language_emerges'],
      description: 'Event Storming — Sticky notes reveal events, commands, and the ubiquitous language.',
    },
    {
      nodeIds: ['cmd_define_contexts', 'dec_split_context'],
      description: 'Bounded Contexts — Where the same word means different things, a new context is drawn.',
    },
    {
      nodeIds: ['cmd_map_relationships', 'evt_contexts_defined'],
      description: 'Context Map — Relationships defined: Partnership, ACL, Customer/Supplier, Conformist.',
    },
    {
      nodeIds: ['cmd_build_model', 'pol_enforce_invariants', 'evt_model_implemented'],
      description: 'Tactical Implementation — Entities, Aggregates, Events enforce invariants. Code mirrors business reality.',
    },
  ]
}
