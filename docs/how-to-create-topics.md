# How to Create a New Topic

This guide covers how to add a new topic to the Interactive Loom Learning OS, using all seven section types: **Text**, **Bullets**, **Architecture Flow**, **Data Flow**, **Flowchart**, **Step-by-Step**, and **Situation Choice**.

---

## Overview

A topic is composed of three files inside `src/topics/<your-topic>/`:

```
src/topics/
  <your-topic>/
    data.ts        — raw content (nodes, edges, paragraphs, etc.)
    sections.ts    — assembles SectionConfig[] from data
    index.tsx      — React component + TopicRegistry registration
```

You also need to add an entry to `src/core/routes.ts` so the topic appears in the nav.

---

## Step 1 — Create `data.ts`

### Text section data

`text` renders each string as **Markdown**. Use standard Markdown syntax — bold, italic, inline code, links, headings, lists, and blockquotes are all supported.

```ts
// src/topics/<your-topic>/data.ts

export const myParagraphs: string[] = [
  'First paragraph. Supports **bold**, *italic*, and `inline code`.',
  'Second paragraph. Link example: [Learn more](https://example.com).',
  '> A blockquote for callouts or notes.',
]
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `paragraphs` | `string[]` | yes | Each string is parsed as Markdown and rendered as a block. |

---

### Bullets section data

`bullets` renders a hierarchical list. Items can have nested `children` for sub-bullets. Items can be `checkable` with interactive checkboxes.

```ts
// src/topics/<your-topic>/data.ts
import type { BulletItem } from '../../sections/bullets'

export const myBullets: BulletItem[] = [
  {
    text: 'Top-level item with children',
    children: [
      { text: 'Child item A' },
      { text: 'Child item B' },
    ],
  },
  { text: 'Simple flat item' },
  { text: 'Checkable item', checkable: true, checked: false },
]
```

**`BulletItem` fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `text` | `string` | yes | Label for the bullet row |
| `children` | `BulletItem[]` | no | Nested sub-bullets, rendered indented |
| `checkable` | `boolean` | no | Makes the item an interactive checkbox |
| `checked` | `boolean` | no | Initial checked state |

**In `sections.ts`:**

```ts
{
  type: 'bullets',
  props: {
    title: 'My List',    // section heading (optional)
    ordered: false,      // true for <ol>, false for <ul>
    items: myBullets,
  },
},
```

---

### Architecture Flow section data

`architecture-flow` renders an animated node-edge diagram with SVG paths. Nodes are placed manually by `x`/`y` coordinates.

```ts
// src/topics/<your-topic>/data.ts
import type { ArchNode, ArchEdge } from '../../sections/architecture-flow'

export const myNodes: ArchNode[] = [
  { id: 'client',  label: 'Client',     x: 80,  y: 120 },
  { id: 'server',  label: 'API Server', x: 300, y: 120 },
  { id: 'db',      label: 'Database',   x: 520, y: 120 },
]

export const myEdges: ArchEdge[] = [
  { from: 'client', to: 'server', label: 'Request' },
  { from: 'server', to: 'db',     label: 'Query'   },
]
```

**`ArchNode` fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | yes | Unique identifier, referenced by edges |
| `label` | `string` | yes | Display name inside the node |
| `x` | `number` | yes | SVG x coordinate (pixels) |
| `y` | `number` | yes | SVG y coordinate (pixels) |
| `color` | `string` | no | Override node fill color (hex / CSS) |

**`ArchEdge` fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `from` | `string` | yes | Source node `id` |
| `to` | `string` | yes | Target node `id` |
| `label` | `string` | no | Text shown along the edge |

**Positioning tips:**
- Nodes are placed manually by `x`/`y`; there is no auto-layout for this section type.
- Use consistent `y` values for nodes on the same horizontal layer.
- Leave ~180 px of horizontal space between nodes so edge labels have room.

**In `sections.ts`:**

```ts
{
  type: 'architecture-flow',
  props: {
    title: 'System Architecture',
    nodes: myNodes,
    edges: myEdges,
  },
},
```

---

### Data Flow section data

`data-flow` renders SVG paths with stroke-dashoffset animation and particle markers. Paths are supplied as raw SVG `d` strings.

```ts
// src/topics/<your-topic>/data.ts
import type { DataFlowPath } from '../../sections/data-flow'

export const myPaths: DataFlowPath[] = [
  {
    id: 'request',
    label: 'Request',
    d: 'M 40 100 C 150 100, 200 60, 300 60 C 400 60, 450 100, 560 100',
    color: '#8caaee',
  },
  {
    id: 'response',
    label: 'Response',
    d: 'M 560 140 C 450 140, 400 180, 300 180 C 200 180, 150 140, 40 140',
    color: '#a6d189',
  },
]
```

**`DataFlowPath` fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | yes | Unique identifier |
| `label` | `string` | yes | Text shown above the path start |
| `d` | `string` | yes | Raw SVG path data string |
| `color` | `string` | no | Override path stroke color |

**Path tips:**
- The SVG viewBox is fixed at `600 x 200`.
- Use cubic bezier curves (`C`) for smooth S-curved paths.
- Each path gets a particle (circle) at its start point (`M` position).
- Paths animate sequentially left-to-right.

**In `sections.ts`:**

```ts
{
  type: 'data-flow',
  props: {
    title: 'Request-Response Flow',
    paths: myPaths,
    particleColor: '#ff7759',  // optional, default is coral
  },
},
```

---

### Flowchart section data

`flowchart` renders an auto-laid flowchart with Sugiyama-style barycenter layout, pan/zoom, node drag, and animated journey playback. This is the most feature-rich section type.

```ts
// src/topics/<your-topic>/data.ts
import type { FlowchartNode, FlowchartEdge, Journey } from '../../sections/flowchart'

export const myNodes: FlowchartNode[] = [
  {
    id: 'user',
    label: 'User',
    stereotype: 'actor',
    icon: 'User',           // lucide-react icon name
    layer: 0,
    description: 'End user interacting with the system',
  },
  {
    id: 'api',
    label: 'API Gateway',
    stereotype: 'service',
    icon: 'Server',
    layer: 1,
    description: 'Routes and authenticates requests',
  },
  {
    id: 'llm',
    label: 'LLM',
    stereotype: 'model',
    icon: 'Brain',
    layer: 2,
    description: 'Large language model for reasoning',
  },
]

export const myEdges: FlowchartEdge[] = [
  { from: 'user', to: 'api', description: 'HTTP request' },
  { from: 'api', to: 'llm', description: 'Prompt call' },
]

export const myJourneys: Journey[] = [
  {
    id: 'query',
    label: 'User Query Flow',
    description: 'How a user request travels through the system',
    steps: [
      { nodeId: 'user', description: 'User submits a query' },
      { nodeId: 'api', description: 'API gateway routes the request' },
      { nodeId: 'llm', description: 'LLM processes the query and returns a response' },
    ],
  },
]
```

**`FlowchartNode` fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | yes | Unique identifier |
| `label` | `string` | yes | Display name inside the node |
| `stereotype` | `string` | yes | Shown as `<<stereotype>>` above the label |
| `icon` | `string` | yes | lucide-react icon component name |
| `layer` | `number` | no | Auto-layout layer (default: 0). Lower = left, higher = right. |
| `description` | `string` | no | Hover tooltip text |

**`FlowchartEdge` fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `from` | `string` | yes | Source node `id` |
| `to` | `string` | yes | Target node `id` |
| `description` | `string` | no | Hover tooltip on the edge |

**`Journey` fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | yes | Unique identifier |
| `label` | `string` | yes | Shown in the journey selector dropdown |
| `description` | `string` | no | Journey description |
| `steps` | `Step[]` | yes | Ordered sequence of node visits |

**`Step` fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `nodeId` | `string` | yes | Node `id` to highlight at this step |
| `description` | `string` | yes | Shown in the step description panel |

**In `sections.ts`:**

```ts
{
  type: 'flowchart',
  props: {
    title: 'System Architecture',
    nodes: myNodes,
    edges: myEdges,
    journeys: myJourneys,
  },
},
```

---

### Step-by-Step section data

`step-by-step` renders a pager showing one step at a time with prev/next navigation and fade transitions.

```ts
// src/topics/<your-topic>/data.ts
import type { StepContent } from '../../sections/step-by-step'

export const mySteps: StepContent[] = [
  {
    title: 'Step 1: Initialize',
    body: 'Set up the project workspace and configure dependencies.',
  },
  {
    title: 'Step 2: Connect',
    body: 'Establish a connection to the external service using credentials.',
  },
  {
    title: 'Step 3: Process',
    body: 'Transform the incoming data and store the result.',
  },
]
```

**`StepContent` fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | `string` | yes | Step heading |
| `body` | `string` | yes | Step body text (plain text) |

**In `sections.ts`:**

```ts
{
  type: 'step-by-step',
  props: {
    title: 'Getting Started',   // section heading (optional)
    steps: mySteps,
  },
},
```

---

### Situation Choice section data

`situation-choice` renders an interactive comparison of options for different scenarios, with an accordion for each choice showing pros and cons.

```ts
// src/topics/<your-topic>/data.ts
import type { SituationChoice } from '../../sections/situation-choice'

export const mySituations: SituationChoice[] = [
  {
    title: 'Real-time Communication',
    situation: 'You need to build a chat application where messages must appear instantly for all connected users.',
    recommended: 'websocket',
    recommendationDetail: {
      why: 'WebSocket provides full-duplex, persistent connections ideal for low-latency bidirectional messaging.',
    },
    choices: [
      {
        id: 'rest',
        label: 'REST API',
        description: 'Use HTTP request-response pattern for each message.',
        pros: [
          { title: 'Simple to implement', description: 'No special server setup needed; standard HTTP tools apply.' },
          { title: 'Built-in caching', description: 'HTTP caching headers reduce redundant requests.' },
        ],
        cons: [
          { title: 'Higher latency', description: 'Each message requires a new HTTP round-trip.' },
          { title: 'Requires polling', description: 'Client must repeatedly ask for new messages.' },
        ],
        whenToUse: 'Useful when message frequency is low and real-time delivery is not critical.',
      },
      {
        id: 'websocket',
        label: 'WebSocket',
        description: 'Use persistent full-duplex connection for instant message delivery.',
        pros: [
          { title: 'Real-time delivery', description: 'Messages arrive instantly without polling.' },
          { title: 'Low latency', description: 'Single persistent connection eliminates HTTP overhead.' },
        ],
        cons: [
          { title: 'Complex server setup', description: 'Requires WebSocket-capable server and connection management.' },
          { title: 'Connection overhead', description: 'Must handle reconnection, heartbeats, and state.' },
        ],
      },
    ],
  },
]
```

**`ChoiceProCon` fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | `string` | yes | Short label (2-5 words) shown in accordion and compare view |
| `description` | `string` | yes | Full explanation shown only in the accordion |

**`ChoiceOption` fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | yes | Unique identifier within this situation |
| `label` | `string` | yes | Display name shown in the accordion trigger |
| `description` | `string` | yes | Shown inside the expanded accordion |
| `pros` | `ChoiceProCon[]` | yes | Advantages with title + description |
| `cons` | `ChoiceProCon[]` | yes | Disadvantages with title + description |
| `whenToUse` | `string` | no | Guidance shown at the bottom of the accordion |

**`SituationChoice` fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | `string` | yes | Shown in the situation selector dropdown |
| `situation` | `string` | yes | The scenario description displayed in a banner |
| `recommended` | `string` | yes | `id` of the recommended choice |
| `recommendationDetail` | `{ heading?: string, why: string }` | yes | Explains why this choice is recommended |

**In `sections.ts`:**

```ts
{
  type: 'situation-choice',
  props: {
    title: 'When to Use REST vs WebSocket',
    situations: mySituations,
  },
},
```

---

## Step 2 — Create `sections.ts`

```ts
// src/topics/<your-topic>/sections.ts
import type { SectionConfig } from '../../core/registry'
import { myParagraphs, myNodes, myEdges, mySteps, mySituations } from './data'

export const myTopicSections: SectionConfig[] = [
  {
    type: 'text',
    props: {
      title: 'Introduction',          // nav/section heading (optional)
      heading: 'What is this about?', // large heading inside the section (optional)
      paragraphs: myParagraphs,
    },
  },
  {
    type: 'flowchart',
    props: {
      title: 'System Architecture',
      nodes: myNodes,
      edges: myEdges,
    },
  },
  {
    type: 'step-by-step',
    props: {
      title: 'How It Works',
      steps: mySteps,
    },
  },
  {
    type: 'situation-choice',
    props: {
      title: 'Design Choices',
      situations: mySituations,
    },
  },
]
```

---

## Step 3 — Create `index.tsx`

```tsx
// src/topics/<your-topic>/index.tsx
import { SectionRenderer } from '../../components/layout/TopicShell'
import { TopicRegistry } from '../../core/topic-registry'
import { myTopicSections } from './sections'

export default function MyTopic() {
  return (
    <div className="my-topic" data-testid="my-topic">
      {myTopicSections.map((section, idx) => (
        <SectionRenderer key={idx} config={section} />
      ))}
    </div>
  )
}

TopicRegistry.register('my-topic', MyTopic)
```

> The string passed to `TopicRegistry.register` must match the `id` used in `routes.ts`.

---

## Step 4 — Register the topic in `routes.ts`

```ts
// src/core/routes.ts
import { myTopicSections } from '../topics/<your-topic>/sections'

export const routes: TopicRoute[] = [
  // ... existing routes ...
  {
    id: 'my-topic',              // must match TopicRegistry.register id
    label: 'My Topic',           // shown in the top nav
    path: '/topics/my-topic',
    category: 'Architecture',    // used on the Overview page
    description: 'A short description shown in the topic table.',
    sections: myTopicSections,
  },
]
```

---

## Step 5 — Register the import in `main.tsx`

```ts
// src/main.tsx
import './topics/my-topic'   // triggers TopicRegistry.register side-effect
```

---

## Verify

```bash
npm run typecheck   # no TS errors
npm run lint        # 0 warnings
npm run dev         # visit http://localhost:5173/topics/my-topic
```

---

## Full example — minimal two-section topic

```
src/topics/http-basics/
  data.ts
  sections.ts
  index.tsx
```

**`data.ts`**
```ts
import type { ArchNode, ArchEdge } from '../../sections/architecture-flow'

export const introParagraphs = [
  'HTTP is the foundation of data communication on the web.',
  'It follows a **request–response** model between client and server.',
]

export const httpNodes: ArchNode[] = [
  { id: 'browser', label: 'Browser', x: 60,  y: 100 },
  { id: 'server',  label: 'Server',  x: 300, y: 100 },
]

export const httpEdges: ArchEdge[] = [
  { from: 'browser', to: 'server', label: 'GET /index.html' },
]
```

**`sections.ts`**
```ts
import type { SectionConfig } from '../../core/registry'
import { introParagraphs, httpNodes, httpEdges } from './data'

export const httpBasicsSections: SectionConfig[] = [
  { type: 'text',              props: { title: 'What is HTTP?', paragraphs: introParagraphs } },
  { type: 'architecture-flow', props: { title: 'Request-Response', nodes: httpNodes, edges: httpEdges } },
]
```

**`index.tsx`**
```tsx
import { SectionRenderer } from '../../components/layout/TopicShell'
import { TopicRegistry } from '../../core/topic-registry'
import { httpBasicsSections } from './sections'

export default function HttpBasicsTopic() {
  return (
    <div data-testid="http-basics-topic">
      {httpBasicsSections.map((s, i) => <SectionRenderer key={i} config={s} />)}
    </div>
  )
}

TopicRegistry.register('http-basics', HttpBasicsTopic)
```
