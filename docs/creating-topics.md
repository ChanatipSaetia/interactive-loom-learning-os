# Guideline: How to Create a New Topic

## Objective
The objective of creating a new topic is to create comprehensive content for that topic, so the user can learn and fully understand the concept, and ultimately be ready to use AI or communicate effectively about that topic.

Creating a new interactive topic in the Interactive Loom Learning OS is done by assembling a sequence of modular "sections". The key architectural principle is strict separation of content (data) from structure (UI).

Below is the step-by-step process based on the `demo` topic implementation.

## 1. Create the Directory Structure
Create a new directory for your topic under `src/topics/[topic-name]/`.

A standard topic directory includes:
- `data/`: A directory storing all raw data payloads separated by type.
- `sections.ts`: Defines the sequence of sections, mapping the raw data to section props.
- `index.tsx`: The main React component that renders the sections.

## 2. Isolate Content in the `data/` Directory
To keep the structure clean, all content should live in `src/topics/[topic-name]/data/`. You should export these variables through `data/index.ts`.

Example `data/text.ts` (for Text and Bullet sections):
```typescript
import type { BulletItem } from '../../../sections/bullets'

export const myTopicParagraphs: string[] = [
  'Paragraph 1...',
  'Paragraph 2...',
]

export const myTopicBullets: BulletItem[] = [
  { text: 'Capability 1', children: [{ text: 'Sub-capability 1' }] },
  { text: 'Capability 2' },
]
```

Example `data/index.ts` (aggregating exports):
```typescript
export * from './text'
export * from './schema'     // UnifiedFlowchartSchema
export * from './taxonomy'   // TaxonomyCategory[]
export * from './tradeoffs'  // TradeoffScenario[]
export * from './flashcards' // WordTerm[]
```

## 3. Assemble the Topic in `sections.ts`
Your `sections.ts` will export an array of `SectionConfig` objects. Each section has a specific `type` and requires specific `props` fed from your `data/` folder. The order of the sections in this array determines the display order in the UI. You can arrange the sections in any sequence depending on how you want to organize the learning content.

Here are the 6 available section types, their objectives, and how you assign content to them:

### 1. `flowchart`
**Objective:** Show how the action (command), event, and policy relate to actor aggregates and other external systems. It shows the flow of the process and provides multiple views (e.g. Event Storming, Sequence, Swimlanes) to make complex architectures easy to understand.

**Event Storming Node and Relation Conventions:**
When defining a `UnifiedFlowchartSchema` for a flowchart, strictly follow these conventions (as seen in the `demo` topic):
- **Root Node:** Set `root: true` on exactly ONE entity, which should be the starting `COMMAND` of the Event Storming flow. This determines the entry point and chronological anchor for the layout.
- **Standard Flow:** The core sequence of a process always flows as: `COMMAND` → `EVENT(S)` → `POLICY`.
- **Direction & Branching:** The flow progresses left-to-right from the root. When 1 `EVENT` triggers 2 or more `POLICIES`, this indicates branching. The layout engine spreads these branches vertically and symmetrically.
- **Node Collapsing:** Use `collapsedTo` on duplicate aggregate or external references to map them back to a single canonical node (e.g. `dev_user_feedback` collapsing to `dev_user`).
- **Command Handlers:** Relations from a `COMMAND` to its handler (an `AGGREGATE` or `EXTERNAL`) must use `handledBy: true`.
- **View Targeting:** Relations should specify `views: ['EVENT_STORMING']` to ensure they render correctly in the Event Storming view.
- **Node Types:** Standardize on `TYPES.USER`, `TYPES.AGGREGATE`, `TYPES.EXTERNAL`, `TYPES.COMMAND`, `TYPES.EVENT`, and `TYPES.POLICY`.

```typescript
  {
    type: 'flowchart',
    props: {
      title: 'System Architecture',
      schema: myTopicSchema,
    },
  },
```

### 2. `tradeoff-sandbox`
**Objective:** Used when the topic has multiple choices that can be selected depending on different situations. It allows the user to understand the impact of selecting each choice and see the resulting metrics change immediately.
```typescript
  {
    type: 'tradeoff-sandbox',
    props: {
      title: 'Architecture Trade-offs',
      scenarios: myTopicTradeoffs,
    },
  },
```

### 3. `taxonomy-browser`
**Objective:** Used for clearing up ambiguous taxonomy or concepts that people normally don't understand and misunderstand frequently.
```typescript
  {
    type: 'taxonomy-browser',
    props: {
      title: 'Capability Taxonomy',
      categories: myTopicTaxonomies,
    },
  },
```

### 4. `flashcards`
**Objective:** Used to make the user familiar with the vocabulary of the topic and how to use those terms along with the AI.
```typescript
  {
    type: 'flashcards',
    props: {
      terms: myTopicFlashcards,
    },
  },
```

### 5. `text` and `bullets`
**Objective:** Normal and arbitrary sections used if the other specialized sections cannot provide a proper understanding of the important points of the topic.
```typescript
  {
    type: 'text',
    props: {
      title: 'Introduction',
      heading: 'Sub-heading',
      paragraphs: myTopicParagraphs,
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'Key Capabilities',
      ordered: false,
      items: myTopicBullets,
    },
  },
```

## 4. Render the Topic in `index.tsx`
Use the `SectionRenderer` to dynamically render the configuration defined in `sections.ts`.

```tsx
// src/topics/my-topic/index.tsx
import { SectionRenderer } from '../../components/layout/TopicShell'
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
```

## 5. Register the Route
Once your topic is defined, register it in `src/core/routes.ts` by appending it to the `routes` array.

```typescript
import { myTopicSections } from '../topics/my-topic/sections'

export const routes: TopicRoute[] = [
  // ... existing routes
  {
    id: 'my-topic',
    label: 'My Awesome Topic',
    path: '/topics/my-topic',
    category: 'Architecture',
    description: 'A brief description of the topic that appears in the overview.',
    sections: myTopicSections,
  },
]
```
