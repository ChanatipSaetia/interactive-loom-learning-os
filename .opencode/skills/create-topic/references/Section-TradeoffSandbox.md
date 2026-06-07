# Section: Tradeoff Sandbox

Interactive metric dashboard with choice selection, pros/cons detail modals, and side-by-side comparison.

## When to Use

- Architecture decision records (ADRs) with trade-off analysis
- Comparing design options (frameworks, patterns, approaches)
- Teaching design reasoning: why one choice fits better than another
- Multi-step decision processes where each choice affects overall metrics

## Data Shape

```ts
import type { TradeoffScenario } from '../../sections/tradeoff-sandbox'

export const myScenarios: TradeoffScenario[] = [
  {
    id: 'scenario-id',
    title: 'Scenario Title',
    description: 'Context for the set of decisions.',
    metrics: [
      { id: 'perf', label: 'Performance', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'cost', label: 'Cost', baseValue: 50, min: 0, max: 100, direction: 'lower' },
    ],
    steps: [
      {
        id: 'step-1',
        title: 'Decision Point',
        description: 'What decision needs to be made?',
        recommended: 'option-a',
        choices: [
          {
            id: 'option-a',
            label: 'Option A',
            description: 'Description of this option.',
            metrics: { perf: 10, cost: -5 },
            pros: [
              { title: 'Fast', description: 'Quick to implement' },
            ],
            cons: [
              { title: 'Costly', description: 'Higher ongoing cost' },
            ],
            whyThisFits: 'Why this is the recommended choice.',
          },
          {
            id: 'option-b',
            label: 'Option B',
            description: 'Alternative option.',
            metrics: { perf: -5, cost: 10 },
            pros: [
              { title: 'Cheap', description: 'Low ongoing cost' },
            ],
            cons: [
              { title: 'Slow', description: 'Takes longer to build' },
            ],
            whenToUse: 'When to consider this alternative.',
          },
        ],
      },
    ],
  },
]
```

### Type Reference

**MetricDef:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | Key referenced in choice `metrics` |
| `label` | `string` | yes | Dashboard display name |
| `baseValue` | `number` | yes | Starting score before choices |
| `min` | `number` | no | Clamp minimum (default: 0) |
| `max` | `number` | no | Clamp maximum (default: 100) |
| `direction` | `'higher' \| 'lower'` | no | Default: `'higher'`. Use `'lower'` for metrics like cost/complexity |

**TradeoffChoice:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | Unique within step |
| `label` | `string` | yes | Display name |
| `description` | `string` | yes | Shown in detail modal |
| `metrics` | `Record<string, number>` | yes | Delta per metric `id`. Positive = improvement |
| `pros` | `{title, description}[]` | yes | Advantages |
| `cons` | `{title, description}[]` | yes | Disadvantages |
| `whyThisFits` | `string` | no | Only shown for the recommended choice |
| `whenToUse` | `string` | no | Only shown for non-recommended choices |

**TradeoffStep:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | Unique within scenario |
| `title` | `string` | yes | Decision heading |
| `description` | `string` | yes | Context for this decision |
| `choices` | `TradeoffChoice[]` | yes | Available options |
| `recommended` | `string` | no | `id` of the recommended choice |

## Section Config

```ts
{
  type: 'tradeoff-sandbox',
  props: {
    title: 'Architecture Decisions',
    scenarios: myScenarios,
  },
}
```

## Tips

- Provide 2-4 steps per scenario for meaningful trade-off exploration
- Use 3-4 metrics covering different dimensions (performance, cost, complexity, etc.)
- Metric deltas should be realistic: ±5 to ±15 per choice
- Set `direction: 'lower'` for metrics where lower is better (complexity, cost, risk)
- The `recommended` choice should have `whyThisFits`; alternatives should have `whenToUse`
- Multiple scenarios let users compare different contexts
