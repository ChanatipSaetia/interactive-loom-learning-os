# Section: Taxonomy Browser

Card grid with stagger animation. Each card opens a detail modal with overview, deep dive, and scope boundaries.

## When to Use

- Categorizing domain concepts or capabilities
- Showing the scope and boundaries of a concept
- Presenting analogous explanations for abstract topics
- Bounded context visualization (DDD)

## Data Shape

```ts
import type { TaxonomyCategory } from '../../sections/taxonomy-browser'
import { Brain, Zap, Shield, Workflow } from 'lucide-react'
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
    description: 'The system invokes external tools to extend its capabilities beyond text.',
    details: 'Tool routing matches task requirements to available capabilities.',
    analogy: 'Like a developer choosing the right CLI tool for each sub-task.',
    primaryFocus: 'Tool selection and result processing',
    inScope: ['Web search', 'Code sandbox', 'API calls'],
    outOfScope: ['Hardware control', 'Physical interaction'],
    color: 'peach',
  },
]
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
