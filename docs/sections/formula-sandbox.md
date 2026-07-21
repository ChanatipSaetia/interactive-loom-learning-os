# Section Type: `formula-sandbox`

**Mental model**: Quantitative parameter exploration and system dynamics. Learners adjust sliders and watch computed metrics change in real-time, building intuition for cause-and-effect relationships.

---

## File Structure

```
sections/formula-sandbox/
├── section.md        # section descriptor
└── sandbox.yaml      # variables and metric formulas
```

## `section.md` Frontmatter

```yaml
---
type: formula-sandbox
title: "Flicker Monk DPS & Stats Calculator"
resource: sandbox.yaml    # relative path to the YAML data file
---
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"formula-sandbox"` | Yes | Fixed value |
| `title` | `string` | No | Section header |
| `resource` | `string` | Yes | Relative path to the `.yaml` data file |

---

## `sandbox.yaml` — data file

A single object with two top-level keys: `variables` (slider inputs) and `metrics` (computed outputs).

```yaml
variables:
  - id: attack_speed
    label: "Attack Speed (Attacks / sec)"
    min: 2
    max: 10
    step: 0.5
    defaultValue: 4.5
  - id: crit_chance
    label: "Critical Strike Chance (%)"
    min: 5
    max: 100
    step: 5
    defaultValue: 40
  - id: lightning_damage
    label: "Base Lightning Damage"
    min: 100
    max: 2000
    step: 50
    defaultValue: 400

metrics:
  - id: build_dps
    label: "Estimated Build DPS"
    formula: "Math.round(attack_speed * lightning_damage * (1 + (crit_chance / 100) * 1.5))"
    description: "Total damage output per second incorporating attack speed, flat damage, and critical multiplier."
    analogy: "Like striking multiple times with high accuracy — if you swing fast and hit critical pressure points, the total force multiplies exponentially."
    inScope:
      - "Critical strike multiplier factor"
      - "Flat lightning base hits"
    outOfScope:
      - "Monster elemental resistances"
  - id: shock_chance
    label: "Shock Infliction Chance (%)"
    formula: "Math.round(crit_chance * 0.9)"
    description: "Likelihood of applying the Shock ailment, increasing damage taken by up to 50%."
    analogy: "Static build-up — the more consistently you strike, the more sparks ignite."
```

### `FormulaVariable` schema

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Variable identifier (used as a JavaScript variable name in formulas) |
| `label` | `string` | Yes | Display label shown next to the slider |
| `min` | `number` | Yes | Minimum slider value |
| `max` | `number` | Yes | Maximum slider value |
| `step` | `number` | Yes | Slider increment step size |
| `defaultValue` | `number` | Yes | Initial value when the section loads |

### `FormulaMetric` schema

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Metric identifier |
| `label` | `string` | Yes | Display label shown on the metric card |
| `formula` | `string` | Yes | JavaScript expression using variable `id`s as variables |
| `description` | `string` | Yes | Explanation of what this metric represents |
| `analogy` | `string` | No | Real-world analogy to help intuition |
| `inScope` | `string[]` | No | Factors included in the calculation |
| `outOfScope` | `string[]` | No | Factors excluded from the calculation |

> [!IMPORTANT]
> **Formula expressions**: Use valid JavaScript. Variable IDs from `variables[]` are available directly as named variables. You can use:
> - `Math.ceil()`, `Math.floor()`, `Math.round()`, `Math.sqrt()`, `Math.log()`
> - Standard arithmetic operators: `+`, `-`, `*`, `/`, `**`, `%`
> - Ternary expressions: `condition ? valueA : valueB`
>
> Example: `"Math.ceil((users * requestsPerUser) / 1000)"`

---

## Real Example

From `public/okf/poe2-flicker-monk/sections/formula-sandbox/sandbox.yaml` *(abbreviated)*:

```yaml
variables:
  - id: attack_speed
    label: "Attack Speed (Attacks / sec)"
    min: 2
    max: 10
    step: 0.5
    defaultValue: 4.5

metrics:
  - id: recall
    label: "Estimated Build DPS"
    formula: "Math.round(attack_speed * lightning_damage * (1 + (crit_chance / 100) * 1.5))"
    description: "Total damage output per second of Flicker Strike."
    analogy: "Like striking multiple times with high accuracy."
    inScope:
      - "Critical strike multiplier factor"
    outOfScope:
      - "Monster elemental resistances"
```

---

## CDN / inline equivalent

```json
{
  "type": "formula-sandbox",
  "props": {
    "variables": [
      { "id": "users", "label": "Active Users", "min": 100, "max": 100000, "step": 100, "defaultValue": 10000 },
      { "id": "requestsPerUser", "label": "Requests per User", "min": 1, "max": 1000, "step": 10, "defaultValue": 50 }
    ],
    "metrics": [
      {
        "id": "total-requests",
        "label": "Total Requests/sec",
        "formula": "users * requestsPerUser",
        "description": "Estimated total requests per second",
        "analogy": "Think of it as water flowing through pipes"
      },
      {
        "id": "servers-needed",
        "label": "Servers Needed",
        "formula": "Math.ceil((users * requestsPerUser) / 1000)",
        "description": "Number of servers to handle the load",
        "inScope": ["Web servers", "API servers"],
        "outOfScope": ["Database servers", "CDN nodes"]
      }
    ]
  }
}
```

---

## Pedagogical Role

Place `formula-sandbox` in the **"explore trade-offs"** phase (step 10) alongside or immediately before `tradeoff-sandbox`. It teaches quantitative causality — learners see that changing one parameter shifts all dependent metrics. Follow it with `reflection-template` to force articulation of observed relationships.

See [sections-reference.md](../sections-reference.md) for the recommended section ordering.
