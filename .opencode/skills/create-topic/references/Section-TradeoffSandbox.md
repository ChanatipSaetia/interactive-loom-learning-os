# Section: Tradeoff Sandbox

Interactive metric dashboard with choice selection, pros/cons detail modals, and side-by-side comparison.

## When to Use

- Architecture decision records (ADRs) with trade-off analysis
- Comparing design options (frameworks, patterns, approaches)
- Teaching design reasoning: why one choice fits better than another
- Multi-step decision processes where each choice affects overall metrics

## Data Shape (Modular Tradeoffs Layout)

Rather than keeping all tradeoffs and steps in a single file, they are organized under `src/topics/<topic-id>/data/tradeoffs/`. Each scenario gets its own sub-folder containing an `index.ts` and step files for each decision point.

### 1. `data/tradeoffs/index.ts`
**Description:** Combines and exports the list of all tradeoffs scenarios for the topic.
```ts
import type { TradeoffScenario } from '../../../../sections/tradeoff-sandbox'
import { apiPatternScenario } from './api-pattern'
import { realtimeChatScenario } from './realtime-chat'

export const tradeoffSandboxScenarios: TradeoffScenario[] = [
  apiPatternScenario,
  realtimeChatScenario
]
```

### 2. `data/tradeoffs/<scenario-name>/index.ts`
**Description:** Defines scenario metadata, metrics, and gathers the steps (decisions) for this specific scenario.
```ts
// E.g., data/tradeoffs/realtime-chat/index.ts
import type { TradeoffScenario } from '../../../../../sections/tradeoff-sandbox'
import { computeStep } from './compute'
import { stateStep } from './state'

export const realtimeChatScenario: TradeoffScenario = {
  id: 'realtime-chat',
  title: 'Real-Time Chat & Collab System',
  description: 'Design a real-time collaborative system. Balance latency, consistency, and cost.',
  metrics: [
    { id: 'latency', label: 'Low Latency', baseValue: 40, min: 0, max: 100, direction: 'higher' },
    { id: 'consistency', label: 'Consistency', baseValue: 50, min: 0, max: 100, direction: 'higher' },
    { id: 'ops-cost', label: 'Ops Cost', baseValue: 50, min: 0, max: 100, direction: 'lower' },
  ],
  steps: [
    computeStep,
    stateStep
  ]
}
```

### 3. `data/tradeoffs/<scenario-name>/<step-id>.ts`
**Description:** Defines a single design decision step with choices, pros, cons, and metric deltas.
```ts
// E.g., data/tradeoffs/realtime-chat/compute.ts
import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const computeStep: TradeoffStep = {
  id: 'compute',
  title: 'Compute Layer',
  description: 'Where does the real-time computation happen?',
  recommended: 'node-central',
  choices: [
    {
      id: 'wasm-edge',
      label: 'WebAssembly at Edge',
      description: 'Run compute-intensive logic close to users via WASM edge workers.',
      metrics: { latency: 20, consistency: -10, 'ops-cost': 10 },
      pros: [
        { title: 'Ultra-low latency', description: 'Runs at network edge.' }
      ],
      cons: [
        { title: 'State management', description: 'Edge workers are typically stateless.' }
      ],
      whenToUse: 'Suitable when ultra-low latency is the primary concern and the compute logic is stateless.',
    },
    {
      id: 'node-central',
      label: 'Node.js Centralized',
      description: 'Centralized Node.js cluster handling connections.',
      metrics: { latency: 5, consistency: 15, 'ops-cost': -15 },
      pros: [
        { title: 'Simple debugging', description: 'Familiar stack traces and tools.' }
      ],
      cons: [
        { title: 'Single region latency', description: 'All traffic routes to one datacenter.' }
      ],
      whyThisFits: 'For collaborative systems, keeping state centralized simplifies consistency guarantees.',
    }
  ]
}
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
