import type { FlowchartViewConfig } from '../../../../../sections/flowchart'

export const sysArchView: FlowchartViewConfig = {
  name: 'DDD Layers',
  icon: 'Layers',
  nodes: [
    { id: 'domain_expert', x: 60, y: 250 },
    { id: 'ubiquitous-language', x: 260, y: 250 },
    { id: 'subdomains', x: 500, y: 80 },
    { id: 'bounded-contexts', x: 500, y: 250 },
    { id: 'context-map', x: 740, y: 80 },
    { id: 'aggregate', x: 500, y: 420 },
    { id: 'repository', x: 320, y: 420 },
    { id: 'domain-event', x: 680, y: 420 },
    { id: 'domain-service', x: 740, y: 250 },
  ],
  groups: [
    {
      id: 'sa_strategic',
      title: 'Strategic Design',
      desc: 'Subdomains, Bounded Contexts, Context Maps — where 80% of DDD value lives.',
      nodeIds: ['subdomains', 'bounded-contexts', 'context-map'],
      color: 'rgba(245, 194, 230, 0.12)',
      borderColor: '#f2cde7',
      textColor: '#f2cde7',
    },
    {
      id: 'sa_tactical',
      title: 'Tactical Design',
      desc: 'Building blocks inside a bounded context: Aggregates, Repositories, Events, Services.',
      nodeIds: ['aggregate', 'repository', 'domain-event', 'domain-service'],
      color: 'rgba(132, 185, 240, 0.12)',
      borderColor: '#85a6f4',
      textColor: '#85a6f4',
    },
  ]
}
