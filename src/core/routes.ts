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
      {
        type: 'data-flow',
        props: {
          title: 'Data Flow Patterns',
          paths: [
            { id: 'cdn', label: 'Content Delivery', d: 'M 50 60 C 150 60, 200 40, 350 40 L 500 40', color: '#003c33' },
            { id: 'rest', label: 'REST API', d: 'M 50 100 C 150 100, 250 120, 400 120 L 520 120', color: '#1863dc' },
            { id: 'ws', label: 'WebSocket', d: 'M 50 140 C 150 140, 300 160, 450 160 L 550 160', color: '#ff7759' },
          ],
             particleColor: '#ff7759',
            },
          },
          {
            type: 'step-by-step',
            props: {
              title: 'REST Lifecycle',
              steps: [
                { title: 'Step 1: Client Sends Request', body: 'The client initiates an HTTP request to the server with method, headers, and optional body.' },
                { title: 'Step 2: Server Processes Request', body: 'The server receives the request, routes it to the appropriate handler, and processes the business logic.' },
                { title: 'Step 3: Server Returns Response', body: 'The server sends back an HTTP response with status code, headers, and the requested data.' },
                { title: 'Step 4: Client Receives Response', body: 'The client processes the response, renders the data, and awaits the next user action.' },
              ],
            },
          },
          {
            type: 'drag-drop',
            props: {
              title: 'Categorize Communication Patterns',
              items: [
                { id: 'rest-call', label: 'REST API Call', correctZone: 'rest' },
                { id: 'ws-msg', label: 'WebSocket Message', correctZone: 'ws' },
                { id: 'http-req', label: 'HTTP Request', correctZone: 'rest' },
              ],
              zones: [
                { id: 'rest', label: 'REST' },
                { id: 'ws', label: 'WebSocket' },
              ],
            },
          },
        ],
      },
    ]
