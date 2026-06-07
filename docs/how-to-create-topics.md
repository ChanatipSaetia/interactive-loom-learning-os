# How to Create a New Topic

This guide covers how to add a new topic to the Interactive Loom Learning OS using the five active section types: **Text**, **Bullets**, **Flowchart**, **Tradeoff Sandbox**, and **Taxonomy Browser**.

---

## Overview

A topic is composed of three files inside `src/topics/<your-topic>/`:

```
src/topics/
  <your-topic>/
    data.ts        — raw content (paragraphs, schemas, scenarios, etc.)
    sections.ts    — assembles SectionConfig[] from data
    index.tsx      — React component + TopicRegistry registration
```

You also need to:
1. Add an entry to `src/core/routes.ts` so the topic appears in the nav
2. Import the topic in `src/main.tsx` so the registration side-effect runs

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

### Flowchart section data

`flowchart` renders an auto-laid flowchart with Sugiyama-style barycenter layout, pan/zoom, node drag, and animated journey playback. This is the most feature-rich section type.

Use the `UnifiedFlowchartSchema` type for a unified schema that supports multiple views (System Architecture, Event Storming, Data Flow, Swimlanes):

```ts
// src/topics/<your-topic>/data.ts
import { TYPES } from '../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../sections/flowchart'

export const mySchema: UnifiedFlowchartSchema = {
  entities: {
    user: {
      title: 'User',
      desc: 'End user interacting with the system',
      viewTypes: {
        SYS_ARCH: TYPES.USER,
      },
    },
    service: {
      title: 'Service',
      desc: 'Main processing service',
      viewTypes: {
        SYS_ARCH: TYPES.SERVICE,
      },
    },
    db: {
      title: 'Database',
      desc: 'Persistent storage',
      viewTypes: {
        SYS_ARCH: TYPES.DATABASE,
      },
    },
  },
  relations: [
    { id: 'r1', from: 'user', to: 'service', views: ['SYS_ARCH'] },
    { id: 'r2', from: 'service', to: 'db', views: ['SYS_ARCH'] },
  ],
  views: {
    SYS_ARCH: {
      name: 'System Architecture',
      icon: 'Server',
      nodes: [
        { id: 'user', x: 100, y: 250 },
        { id: 'service', x: 300, y: 250 },
        { id: 'db', x: 500, y: 250 },
      ],
      groups: [],
    },
  },
  journeys: [
    {
      id: 'query-flow',
      label: 'Query Flow',
      description: 'How a request flows through the system',
      steps: [
        { nodeId: 'user', description: 'User sends a request' },
        { nodeId: 'service', description: 'Service processes the request' },
        { nodeId: 'db', description: 'Data retrieved from database' },
      ],
    },
  ],
}
```

**Available entity types (`TYPES`):**
- `TYPES.USER` — External user/actor
- `TYPES.SERVICE` — Service component
- `TYPES.DATABASE` — Database/storage
- `TYPES.EXTERNAL` — External system
- `TYPES.COMMAND` — Command/action
- `TYPES.DECISION` — Decision point
- `TYPES.PROCESS` — Process/transform
- `TYPES.DATA_OBJECT` — Data object/artifact
- `TYPES.EVENT` — Event (for Event Storming)
- `TYPES.AGGREGATE` — Aggregate (for Event Storming)
- `TYPES.POLICY` — Policy rule (for Event Storming)

**Available view templates:**
- `SYS_ARCH` — System Architecture
- `EVENT_STORMING` — Event Storming
- `DATA_FLOW` — Data Flow Diagram
- `SWIMLANES` — Activity Swimlanes

**`UnifiedFlowchartSchema` fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `entities` | `Record<string, Entity>` | yes | Node definitions with multi-view type mapping |
| `relations` | `Relation[]` | yes | Edges between entities, scoped per view |
| `views` | `Record<string, View>` | yes | View configs with node positions and groups |
| `journeys` | `Journey[]` | no | Animated step sequences for playback |

**In `sections.ts`:**

```ts
{
  type: 'flowchart',
  props: {
    title: 'System Architecture',
    schema: mySchema,
  },
},
```

---

### Tradeoff Sandbox section data

`tradeoff-sandbox` renders an interactive trade-off evaluation with metric dashboards, choice selection, and side-by-side comparison. Users pick design choices per step, see real-time metric impact, and view pros/cons.

```ts
// src/topics/<your-topic>/data.ts
import type { TradeoffScenario } from '../../sections/tradeoff-sandbox'

export const myScenarios: TradeoffScenario[] = [
  {
    id: 'my-scenario',
    title: 'My Design Decision',
    description: 'Evaluate trade-offs across architecture choices.',
    metrics: [
      { id: 'performance', label: 'Performance', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'complexity', label: 'Complexity', baseValue: 30, min: 0, max: 100, direction: 'lower' },
      { id: 'cost', label: 'Cost Efficiency', baseValue: 50, min: 0, max: 100, direction: 'higher' },
    ],
    steps: [
      {
        id: 'frontend',
        title: 'Frontend Framework',
        description: 'Choose the client-side rendering approach.',
        recommended: 'react',
        choices: [
          {
            id: 'vanilla',
            label: 'Vanilla JS',
            description: 'Plain JavaScript with no framework.',
            metrics: { performance: 10, complexity: -10, cost: 10 },
            pros: [
              { title: 'Zero dependencies', description: 'No build tooling required' },
            ],
            cons: [
              { title: 'Manual DOM', description: 'More boilerplate for state management' },
            ],
            whenToUse: 'Best for simple pages where framework overhead is unnecessary.',
          },
          {
            id: 'react',
            label: 'React',
            description: 'Component-based UI library with virtual DOM.',
            metrics: { performance: 5, complexity: 10, cost: -5 },
            pros: [
              { title: 'Rich ecosystem', description: 'Vast library support and community' },
              { title: 'Component model', description: 'Reusable, composable UI components' },
            ],
            cons: [
              { title: 'Build required', description: 'Needs bundler and transpilation' },
            ],
            whyThisFits: 'React provides the component model and ecosystem needed for maintainable UI at scale.',
          },
        ],
      },
    ],
  },
]
```

**`MetricDef` fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | yes | Unique metric identifier |
| `label` | `string` | yes | Display name in dashboard |
| `baseValue` | `number` | yes | Starting value before any choices |
| `min` | `number` | no | Min value (default: 0) |
| `max` | `number` | no | Max value (default: 100) |
| `direction` | `'higher' | 'lower'` | no | Whether higher is better (default: `'higher'`) |

**`TradeoffChoice` fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | yes | Unique choice identifier |
| `label` | `string` | yes | Display name |
| `description` | `string` | yes | Shown in details modal |
| `metrics` | `Record<string, number>` | yes | Delta values per metric `id` |
| `pros` | `TradeoffProCon[]` | yes | Advantages with title + description |
| `cons` | `TradeoffProCon[]` | yes | Disadvantages with title + description |
| `whyThisFits` | `string` | no | Shown for the recommended choice |
| `whenToUse` | `string` | no | Shown for non-recommended choices |

**`TradeoffStep` fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | yes | Unique step identifier |
| `title` | `string` | yes | Step heading |
| `description` | `string` | yes | Context for the decision |
| `choices` | `TradeoffChoice[]` | yes | Available options |
| `recommended` | `string` | no | `id` of the recommended choice |

**In `sections.ts`:**

```ts
{
  type: 'tradeoff-sandbox',
  props: {
    title: 'Architecture Decisions',
    scenarios: myScenarios,
  },
},
```

---

### Taxonomy Browser section data

`taxonomy-browser` renders an interactive card grid that opens detail modals. Each card shows an icon, subtitle, title, and description. Clicking opens a modal with overview, deep dive, and scope boundaries.

```ts
// src/topics/<your-topic>/data.ts
import type { TaxonomyCategory } from '../../sections/taxonomy-browser'
import { Brain, Zap, Shield } from 'lucide-react'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import type { ComponentType } from 'react'

export const myCategories: TaxonomyCategory[] = [
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: Brain as unknown as ComponentType<any>,
    title: 'Reasoning & Planning',
    subtitle: 'Core Intelligence',
    description: 'The system decomposes goals into actionable plans and adapts strategies.',
    details: 'Planning encompasses ReAct loops, tree-of-thought search, and self-refinement patterns.',
    analogy: 'Like a project manager breaking down an epic into sprint tasks.',
    primaryFocus: 'Goal decomposition and step-by-step execution',
    inScope: ['Chain-of-thought', 'ReAct loops', 'Self-correction'],
    outOfScope: ['Raw text generation without planning'],
    color: 'mauve',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: Zap as unknown as ComponentType<any>,
    title: 'Tool Use & Execution',
    subtitle: 'Action Layer',
    description: 'The system selects and invokes external tools to extend its capabilities.',
    details: 'Tool routing matches task requirements to available capabilities.',
    analogy: 'Like a developer choosing the right CLI tool for each sub-task.',
    primaryFocus: 'Tool selection, argument generation, and result processing',
    inScope: ['Web search', 'Code sandbox', 'API calls'],
    outOfScope: ['Hardware control', 'Physical world interaction'],
    color: 'peach',
  },
]
```

**`TaxonomyCategory` fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `icon` | `ComponentType` | yes | lucide-react icon component |
| `title` | `string` | yes | Card title and modal heading |
| `subtitle` | `string` | yes | Shown above the title |
| `description` | `string` | yes | Shown on the card |
| `details` | `string` | yes | Deep dive content in modal |
| `analogy` | `string` | yes | Analogy shown in scope section |
| `primaryFocus` | `string` | yes | Primary focus label |
| `inScope` | `string[]` | yes | In-scope items list |
| `outOfScope` | `string[]` | yes | Out-of-scope items list |
| `color` | `string` | yes | Accent color key: `blue`, `peach`, `pink`, `mauve`, `green`, `teal`, `sky`, `lavender`, `yellow`, `red` |

**In `sections.ts`:**

```ts
{
  type: 'taxonomy-browser',
  props: {
    title: 'Capability Taxonomy',
    categories: myCategories,
  },
},
```

---

## Step 2 — Create `sections.ts`

```ts
// src/topics/<your-topic>/sections.ts
import type { SectionConfig } from '../../core/registry'
import {
  myParagraphs,
  myBullets,
  mySchema,
  myScenarios,
  myCategories,
} from './data'

export const myTopicSections: SectionConfig[] = [
  {
    type: 'text',
    props: {
      title: 'Introduction',
      heading: 'What is this about?',
      paragraphs: myParagraphs,
    },
  },
  {
    type: 'flowchart',
    props: {
      title: 'System Architecture',
      schema: mySchema,
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'Key Points',
      ordered: false,
      items: myBullets,
    },
  },
  {
    type: 'tradeoff-sandbox',
    props: {
      title: 'Design Decisions',
      scenarios: myScenarios,
    },
  },
  {
    type: 'taxonomy-browser',
    props: {
      title: 'Capability Taxonomy',
      categories: myCategories,
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
export const introParagraphs = [
  'HTTP is the foundation of data communication on the web.',
  'It follows a **request–response** model between client and server.',
]

import type { BulletItem } from '../../sections/bullets'

export const httpBullets: BulletItem[] = [
  { text: 'Stateless protocol' },
  { text: 'Client-server model' },
  { text: 'Text-based messaging', children: [
    { text: 'Request methods: GET, POST, PUT, DELETE' },
    { text: 'Status codes: 200 OK, 404 Not Found, 500 Server Error' },
  ]},
]
```

**`sections.ts`**
```ts
import type { SectionConfig } from '../../core/registry'
import { introParagraphs, httpBullets } from './data'

export const httpBasicsSections: SectionConfig[] = [
  { type: 'text',    props: { title: 'What is HTTP?', paragraphs: introParagraphs } },
  { type: 'bullets', props: { title: 'Key Characteristics', ordered: false, items: httpBullets } },
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
