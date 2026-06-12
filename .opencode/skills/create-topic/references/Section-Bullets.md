# Section: Bullets

Hierarchical list with nesting, ordered/unordered modes, and checkable items.

## When to Use

- **Checklists** with interactive checkboxes (e.g., readiness filters, action items)
- **Simple enumeration** of <5 items with no meaningful scope/boundary distinction
- **Ranked lists** where ordering matters but no visual diagram adds value

## When NOT to Use (Use Visual Sections Instead)

| Instead of Bullets for... | Use This Section | Why |
|---|---|---|
| 3+ related concepts with "what/when/scope" | **`taxonomy-browser`** | Cards show scope, boundaries, analogies at a glance |
| System components and how they connect | **`flowchart` (SYS_ARCH)** | Structural diagram > bullet list of components |
| Temporal flow: "what happens first, second" | **`flowchart` (EVENT_STORMING)** | Events/commands/policies show sequence visually |
| Roles that report to each other | **`flowchart` (SYS_ARCH)** | Shows hierarchy and accountability chains |
| Types that each have "what it holds" + "what it enables" | **`taxonomy-browser`** | Each type gets a card with `details` and `primaryFocus` |
| Defense layers, pipeline, or chained steps | **`flowchart`** | Both structural and temporal views add value |

## Data Shape (Modular Layout)

Bullet lists are defined in `src/topics/<topic-id>/data/text.ts` alongside paragraphs.

```ts
// E.g., data/text.ts
import type { BulletItem } from '../../../sections/bullets'

export const myBullets: BulletItem[] = [
  {
    text: 'Tool use — call external APIs, run code, browse the web',
    children: [
      { text: 'Web search (Tavily, Brave, Google)' },
      { text: 'Code execution (sandboxed interpreter)' },
      { text: 'Browser automation (Playwright)' },
    ],
  },
  { text: 'Long-horizon planning via chain-of-thought or ReAct' },
  { text: 'Persistent memory across sessions (vector store)' },
  { text: 'Self-evaluation and re-planning on failure', checkable: true },
]
```


### BulletItem Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `text` | `string` | yes | Display label |
| `children` | `BulletItem[]` | no | Nested sub-bullets |
| `checkable` | `boolean` | no | Interactive checkbox |
| `checked` | `boolean` | no | Initial checked state |

## Section Config

```ts
{
  type: 'bullets',
  props: {
    title: 'Key Capabilities',
    ordered: false,       // true = <ol>, false = <ul>
    items: myBullets,
  },
}
```

## Tips

- Use `ordered: true` for sequential steps or ranked lists
- Nest no more than 2 levels deep for readability
- Use `checkable` sparingly — reserve for actual checklists
- **If you can describe each item's "what it is" and "what it does", use taxonomy cards instead**
