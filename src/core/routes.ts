import type { SectionConfig } from './registry'

export interface TopicRoute {
  id: string
  label: string
  path: string
  category: string
  description: string
  sections: SectionConfig[]
}

export const routes: TopicRoute[] = [
  {
    id: 'demo',
    label: 'REST API vs WebSocket',
    path: '/demo/rest-vs-websocket',
    category: 'Architecture',
    description: 'Compare REST API and WebSocket communication patterns',
    sections: [
      {
        type: 'architecture-flow',
        props: {
          title: 'REST API Architecture',
          nodes: [
            { id: 'client', label: 'Client', x: 80, y: 120 },
            { id: 'lb', label: 'Load Balancer', x: 220, y: 60 },
            { id: 'server', label: 'API Server', x: 380, y: 120 },
            { id: 'db', label: 'Database', x: 520, y: 180 },
          ],
          edges: [
            { from: 'client', to: 'lb', label: 'HTTPS Request' },
            { from: 'lb', to: 'server', label: 'Forward' },
            { from: 'server', to: 'db', label: 'Query' },
          ],
        },
      },
      {
        type: 'architecture-flow',
        props: {
          title: 'WebSocket Architecture',
          nodes: [
            { id: 'client', label: 'Client', x: 80, y: 120 },
            { id: 'gateway', label: 'WS Gateway', x: 240, y: 60 },
            { id: 'broker', label: 'Message Broker', x: 420, y: 120 },
            { id: 'service', label: 'Service', x: 540, y: 190 },
          ],
          edges: [
            { from: 'client', to: 'gateway', label: 'Upgrade' },
            { from: 'gateway', to: 'broker', label: 'Publish' },
            { from: 'broker', to: 'service', label: 'Subscribe' },
          ],
        },
      },
    ],
  },
]
