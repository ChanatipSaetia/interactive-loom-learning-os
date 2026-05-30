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
    sections: [],
  },
]
