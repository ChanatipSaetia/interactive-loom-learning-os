# Section: Bullets

Hierarchical list with nesting, ordered/unordered modes, and checkable items.

## When to Use

- Key takeaways or summary points
- Feature lists, capability enumerations
- Checklists with interactive checkboxes
- Any content with parent-child hierarchy

## Data Shape

```ts
import type { BulletItem } from '../../sections/bullets'

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
