# Section Type: `tradeoff-sandbox`

**Mental model**: Architectural trade-offs and strategy matrix. Teaches that there are no "perfect" architectures — only trade-offs measured across multiple metrics.

---

## File Structure

```
sections/tradeoffs/
├── section.md               # section descriptor (resource: ".")
├── gear-budget.yaml         # one TradeoffScenario per file
└── gear-invested.yaml
```

The `resource: "."` value tells the loader to read **all `.yaml` files** in the directory as separate scenarios. Each YAML file is one scenario object.

## `section.md` Frontmatter

```yaml
---
type: tradeoff-sandbox
title: "Gear Investment Levels"
resource: "."        # loads all .yaml files as separate scenarios
---
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"tradeoff-sandbox"` | Yes | Fixed value |
| `title` | `string` | No | Section header |
| `resource` | `"."` | Yes | Directory load — each `.yaml` file is one scenario |

---

## Individual scenario YAML file

Each `.yaml` file represents **one complete `TradeoffScenario`**. The filename becomes the scenario's file reference but does not appear in the UI — `id` and `title` fields drive display.

```yaml
id: budget-league-starter
title: "Budget League Starter"
description: "Minimum investment to clear all content. Everything obtainable through drops and cheap trade."
metrics:
  - id: damage
    label: Damage Output
    baseValue: 35
    min: 0
    max: 100
    direction: higher    # "higher" = more is better; "lower" = less is better
  - id: survivability
    label: Survivability
    baseValue: 50
    min: 0
    max: 100
    direction: higher
steps:
  - id: weapon
    title: "Weapon Choice"
    description: "Quarterstaff is mandatory. Avoid Dreaming Quarterstaff (0% Crit base)."
    recommended: any-staff    # choice ID of the recommended option
    choices:
      - id: any-staff
        label: "Any Quarterstaff (non-Dreaming)"
        description: "Any Quarterstaff with Lightning Damage and Crit stats."
        metrics:
          damage: 10            # delta added to the scenario baseValue
          survivability: 0
        pros:
          - title: "Cheap and available"
            description: "Found in early acts and cheap on trade"
        cons:
          - title: "No leech line"
            description: "May lack Leech Phys Damage as Mana for Oisin's Oath"
        whyThisFits: "League starter doesn't need perfect rolls. Any non-Dreaming staff works."
      - id: dreaming-staff
        label: "Dreaming Quarterstaff"
        description: "Unique with high damage but 0% Crit base."
        metrics:
          damage: -5
          survivability: 0
        pros:
          - title: "Good raw numbers"
            description: "High Lightning Damage on the unique"
        cons:
          - title: "0% Crit base"
            description: "Cripples Cast on Critical and all crit-dependent mechanics"
        whenToUse: "Avoid entirely. The 0% Crit base makes this build unviable."
```

### `TradeoffScenario` top-level fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique scenario identifier |
| `title` | `string` | Yes | Scenario display title (shown in the scenario selector) |
| `description` | `string` | Yes | Brief description of this scenario's context |
| `metrics` | `MetricDef[]` | Yes | Metrics tracked across all choices |
| `steps` | `TradeoffStep[]` | Yes | Decision steps within the scenario |

### `MetricDef`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Metric identifier (referenced in `choices[].metrics`) |
| `label` | `string` | Yes | Display label for the metric bar |
| `baseValue` | `number` | Yes | Starting value before any choices |
| `min` | `number` | No | Minimum value (default: `0`) |
| `max` | `number` | No | Maximum value (default: `100`) |
| `direction` | `"higher" \| "lower"` | No | `"higher"` = more is better, `"lower"` = less is better |

### `TradeoffStep`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique step identifier |
| `title` | `string` | Yes | Step display name |
| `description` | `string` | Yes | Context for the decision being made |
| `recommended` | `string` | No | `id` of the recommended choice |
| `choices` | `TradeoffChoice[]` | Yes | Available options |

### `TradeoffChoice`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique choice identifier |
| `label` | `string` | Yes | Choice display label |
| `description` | `string` | Yes | Short description of this option |
| `metrics` | `Record<string, number>` | Yes | Delta values applied to each metric ID when this choice is selected |
| `pros` | `{ title: string, description: string }[]` | Yes | List of advantages |
| `cons` | `{ title: string, description: string }[]` | Yes | List of disadvantages |
| `whyThisFits` | `string` | No | Explanation of why this is the recommended choice |
| `whenToUse` | `string` | No | Guidance on when to consider this option (often used for non-recommended choices) |

> [!NOTE]
> `metrics` values in choices are **deltas** — they are added to (or subtracted from) the scenario's `baseValue` for each metric. The final bar gauge = `baseValue + sum of selected choice deltas`, clamped to `[min, max]`.

---

## Real Example

From `public/okf/poe2-flicker-monk/sections/tradeoffs/gear-budget.yaml` — see the actual file for a complete working example.

---

## CDN / inline equivalent

```json
{
  "type": "tradeoff-sandbox",
  "props": {
    "title": "Gear Investment Levels",
    "scenarios": [
      {
        "id": "budget-league-starter",
        "title": "Budget League Starter",
        "description": "Minimum investment to clear all content.",
        "metrics": [
          { "id": "damage", "label": "Damage Output", "baseValue": 35, "min": 0, "max": 100, "direction": "higher" }
        ],
        "steps": [
          {
            "id": "weapon",
            "title": "Weapon Choice",
            "description": "Quarterstaff is mandatory.",
            "recommended": "any-staff",
            "choices": [
              {
                "id": "any-staff",
                "label": "Any Quarterstaff (non-Dreaming)",
                "description": "Any Quarterstaff with Lightning Damage.",
                "metrics": { "damage": 10 },
                "pros": [{ "title": "Cheap", "description": "Found in early acts" }],
                "cons": [{ "title": "No leech line", "description": "May lack mana leech" }],
                "whyThisFits": "Works for league starter."
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## Pedagogical Role

Place `tradeoff-sandbox` in the **"explore trade-offs"** phase (step 10) — after core content and flowcharts are understood. It teaches that every design decision has consequences measured across competing metrics. Follow it with `reflection-template` so learners must articulate what they observed.

See [sections-reference.md](../sections-reference.md) for the recommended section ordering.
