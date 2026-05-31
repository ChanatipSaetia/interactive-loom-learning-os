export interface ArchNode {
  id: string
  label: string
  x: number
  y: number
}

export interface ArchEdge {
  from: string
  to: string
  label: string
}

export interface FlowPath {
  id: string
  label: string
  d: string
  color: string
}

export interface StepContent {
  title: string
  body: string
}

export interface DragItem {
  id: string
  label: string
  correctZone: string
}

export interface DragZone {
  id: string
  label: string
}

export interface BulletItem {
  text: string
  checkable?: boolean
  checked?: boolean
  children?: BulletItem[]
}

export interface ChoiceOption {
  id: string
  label: string
  description: string
  pros: string[]
  cons: string[]
}

export const restNodes: ArchNode[] = [
  { id: 'client', label: 'Client', x: 80, y: 120 },
  { id: 'lb', label: 'Load Balancer', x: 220, y: 60 },
  { id: 'server', label: 'API Server', x: 380, y: 120 },
  { id: 'db', label: 'Database', x: 520, y: 180 },
]

export const restEdges: ArchEdge[] = [
  { from: 'client', to: 'lb', label: 'HTTPS Request' },
  { from: 'lb', to: 'server', label: 'Forward' },
  { from: 'server', to: 'db', label: 'Query' },
]

export const wsNodes: ArchNode[] = [
  { id: 'client', label: 'Client', x: 80, y: 120 },
  { id: 'gateway', label: 'WS Gateway', x: 240, y: 60 },
  { id: 'broker', label: 'Message Broker', x: 420, y: 120 },
  { id: 'service', label: 'Service', x: 540, y: 190 },
]

export const wsEdges: ArchEdge[] = [
  { from: 'client', to: 'gateway', label: 'Upgrade' },
  { from: 'gateway', to: 'broker', label: 'Publish' },
  { from: 'broker', to: 'service', label: 'Subscribe' },
]

export const flowPaths: FlowPath[] = [
  { id: 'cdn', label: 'Content Delivery', d: 'M 50 60 C 150 60, 200 40, 350 40 L 500 40', color: '#003c33' },
  { id: 'rest', label: 'REST API', d: 'M 50 100 C 150 100, 250 120, 400 120 L 520 120', color: '#1863dc' },
  { id: 'ws', label: 'WebSocket', d: 'M 50 140 C 150 140, 300 160, 450 160 L 550 160', color: '#ff7759' },
]

export const textParagraphs: string[] = [
  'REST is an architectural style for designing networked applications. It relies on a stateless, client-server, cacheable communications protocol -- the HTTP.',
  'REST uses HTTP methods like <code>GET</code>, <code>POST</code>, <code>PUT</code>, and <code>DELETE</code> to perform CRUD operations on resources identified by URIs.',
  'For more details, see <a href="https://restfulapi.net">RESTful API Guide</a>.',
]

export const bulletItems: BulletItem[] = [
  { text: 'GET — Retrieve a resource', checkable: true },
  { text: 'POST — Create a new resource', checkable: true },
  { text: 'PUT — Update an existing resource', checkable: true },
  { text: 'DELETE — Remove a resource', checkable: true },
]

export const restLifecycleSteps: StepContent[] = [
  { title: 'Step 1: Client Sends Request', body: 'The client initiates an HTTP request to the server with method, headers, and optional body.' },
  { title: 'Step 2: Server Processes Request', body: 'The server receives the request, routes it to the appropriate handler, and processes the business logic.' },
  { title: 'Step 3: Server Returns Response', body: 'The server sends back an HTTP response with status code, headers, and the requested data.' },
  { title: 'Step 4: Client Receives Response', body: 'The client processes the response, renders the data, and awaits the next user action.' },
]

export const dragItems: DragItem[] = [
  { id: 'rest-call', label: 'REST API Call', correctZone: 'rest' },
  { id: 'ws-msg', label: 'WebSocket Message', correctZone: 'ws' },
  { id: 'http-req', label: 'HTTP Request', correctZone: 'rest' },
]

export const dragZones: DragZone[] = [
  { id: 'rest', label: 'REST' },
  { id: 'ws', label: 'WebSocket' },
]

export const choiceOptions: ChoiceOption[] = [
  {
    id: 'rest',
    label: 'REST API',
    description: 'Request-response pattern using HTTP methods for resource-oriented communication.',
    pros: [
      'Simple and well-understood',
      'Cacheable responses',
      'Stateless, easy to scale horizontally',
    ],
    cons: [
      'Not ideal for real-time data',
      'Higher latency for frequent updates',
      'Client must poll for changes',
    ],
  },
  {
    id: 'websocket',
    label: 'WebSocket',
    description: 'Full-duplex persistent connection enabling real-time bidirectional communication.',
    pros: [
      'Real-time bidirectional messaging',
      'Low latency for live updates',
      'Single persistent connection',
    ],
    cons: [
      'More complex to implement',
      'Stateful connections harder to scale',
      'Requires fallback handling',
    ],
  },
]
