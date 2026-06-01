# How to Create a New Topic

This guide covers how to add a new topic to the Interactive Loom Learning OS, using the **Text**, **Bullets**, and **Architecture Flow** section types.

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

`bullets` renders a hierarchical list. Items can have nested `children` for sub-bullets. No checkboxes.

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
  { text: 'Another flat item' },
]
```

**`BulletItem` fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `text` | `string` | yes | Label for the bullet row |
| `children` | `BulletItem[]` | no | Nested sub-bullets, rendered indented |

**In `sections.ts`:**

```ts
{
  type: 'bullets',
  props: {
    title: 'My List',   // section heading (optional)
    ordered: false,     // true for <ol>, false for <ul>
    items: myBullets,
  },
},
```

---

### Architecture Flow section data

`architecture-flow` renders an animated node-edge diagram with SVG paths.

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

---

## Step 2 — Create `sections.ts`

```ts
// src/topics/<your-topic>/sections.ts
import type { SectionConfig } from '../../core/registry'
import { myParagraphs, myNodes, myEdges } from './data'

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
    type: 'architecture-flow',
    props: {
      title: 'System Architecture',
      nodes: myNodes,
      edges: myEdges,
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
  { type: 'architecture-flow', props: { title: 'Request–Response', nodes: httpNodes, edges: httpEdges } },
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
