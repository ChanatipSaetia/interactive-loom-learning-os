# Section: Taxonomy Browser

Card grid with stagger animation. Each card opens a detail modal with overview, deep dive, and scope boundaries.

## When to Use

- **3+ related concepts** that each have a "what it is" and "what it does" → prefer over bullets
- **Memory types, capability categories, design decisions** → cards show scope and boundaries at a glance
- **Categorizing domain concepts** with in-scope/out-of-scope distinctions
- **Bounded context visualization** (DDD)
- Presenting analogous explanations for abstract topics

> [!TIP]
> If you would have written a bulleted list where each item has a title and 2+ sub-points describing what it is and what it enables, use taxonomy cards instead. Each card maps naturally: `title` = concept name, `description` = what it is, `details` = what it enables, `inScope`/`outOfScope` = boundaries.

## Data Shape (Modular Taxonomy Layout)

Rather than defining all categories in a single file, they are structured under `src/topics/<topic-id>/data/taxonomy/`. Each category is configured in its own file, and they are aggregated in the folder's `index.ts`.

### 1. `data/taxonomy/index.ts`
**Description:** Aggregates and exports the collection of categories for the topic.
```ts
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'
import { reasoningPlanningCategory } from './reasoning-planning'
import { toolUseCategory } from './tool-use'

export const taxonomyCategories: TaxonomyCategory[] = [
  reasoningPlanningCategory,
  toolUseCategory
]
```

### 2. `data/taxonomy/<category-name>.ts`
**Description:** Defines a single taxonomy category configuration, complete with custom icons, metadata, scope lists, and colors.
```ts
// E.g., data/taxonomy/tool-use.ts
import { Zap } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

export const toolUseCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Zap as unknown as ComponentType<any>,
  title: 'Tool Use & Execution',
  subtitle: 'Action Layer',
  description: 'The agent selects and invokes external tools — web search, code execution, API calls.',
  details: 'Tool routing matches task requirements to available capabilities, then dispatches execution.',
  analogy: 'Like a developer choosing the right CLI tool or API for each sub-task.',
  primaryFocus: 'Tool selection, argument generation, and result processing',
  inScope: ['Web search', 'Code sandbox', 'API calls'],
  outOfScope: ['Hardware control', 'Physical world interaction'],
  color: 'peach',
}
```


### Type Reference

| Field | Type | Required | Notes |
|---|---|---|---|
| `icon` | `ComponentType` | yes | lucide-react icon. Requires eslint-disable cast |
| `title` | `string` | yes | Card title and modal heading |
| `subtitle` | `string` | yes | Category label above the title |
| `description` | `string` | yes | Shown on the card |
| `details` | `string` | yes | Deep dive content in modal |
| `analogy` | `string` | yes | Real-world analogy (shown as blockquote) |
| `primaryFocus` | `string` | yes | What this category focuses on |
| `inScope` | `string[]` | yes | Items within the category |
| `outOfScope` | `string[]` | yes | Items explicitly outside the category |
| `color` | `string` | yes | See color keys below |

### Color Keys

`blue`, `peach`, `pink`, `mauve`, `green`, `teal`, `sky`, `lavender`, `yellow`, `red`

Each maps to the corresponding Catppuccin Frappé variable (e.g., `mauve` → `var(--ctp-mauve)`).

## Section Config

```ts
{
  type: 'taxonomy-browser',
  props: {
    title: 'Capability Taxonomy',
    categories: myCategories,
  },
}
```

## Tips

- 3-5 categories work best for visual balance
- Use distinct colors to differentiate categories
- Keep `description` to 1-2 sentences (shown on card)
- `details` can be longer (shown only in modal)
- `inScope`/`outOfScope` clarifies boundaries — useful for domain concepts
- Pick lucide-react icons that visually distinguish each category
