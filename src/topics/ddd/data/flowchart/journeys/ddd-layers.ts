import type { FlowchartJourney } from '../../../../../sections/flowchart'

export const dddLayersJourney: FlowchartJourney = {
  id: 'ddd-layers',
  label: 'DDD Structural Layers',
  description: 'Explore how Strategic and Tactical layers connect through the ubiquitous language.',
  steps: [
    {
      nodeIds: ['domain_expert', 'ubiquitous-language'],
      description: 'Ubiquitous Language — Domain experts and developers share one language, everywhere.',
    },
    {
      nodeIds: ['subdomains', 'bounded-contexts', 'context-map'],
      description: 'Strategic Design — Subdomains classified, bounded contexts drawn, relationships mapped.',
    },
    {
      nodeIds: ['aggregate', 'repository', 'domain-event', 'domain-service'],
      description: 'Tactical Design — Inside each bounded context: aggregates enforce invariants, repositories persist, events drive reactions.',
    },
  ]
}
