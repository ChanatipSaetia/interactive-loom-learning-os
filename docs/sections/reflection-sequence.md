# Section Type: `reflection-sequence`

**Mental model**: Chronological step ordering and active recall. Learners drag-and-drop cards into the correct sequence, converting passive flowchart reading into active process recall.

---

## File Structure

```
sections/reflection-sequence/
├── section.md        # section descriptor
└── sequence.yaml     # array of sequencing challenges
```

## `section.md` Frontmatter

```yaml
---
type: reflection-sequence
title: "Skill Combination Sequence Challenge"
resource: sequence.yaml    # relative path to the YAML data file
---
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"reflection-sequence"` | Yes | Fixed value |
| `title` | `string` | No | Section header |
| `resource` | `string` | Yes | Relative path to the `.yaml` challenges file |

---

## `sequence.yaml` — data file

A single object with a `challenges` array. Each challenge is an independent ordering puzzle.

```yaml
challenges:
  - prompt: "Order the combat skills in the correct sequence to maximize lightning conversion and trigger Falling Thunder Nova:"
    items:
      - id: cast_tempest
        text: "Cast Tempest (Create Lightning Zone)"
        icon: zap           # optional — Lucide icon name
      - id: stack_charges
        text: "Generate Power Charges"
        icon: cpu
      - id: execute_flicker
        text: "Execute Flicker Strike"
        icon: move
      - id: trigger_thunder
        text: "Trigger Falling Thunder Nova"
        icon: cloud-lightning
    solution:
      - cast_tempest
      - stack_charges
      - execute_flicker
      - trigger_thunder

  - prompt: "Order the preparation stages to activate defensive auras before entering combat:"
    items:
      - id: reserve_spirit
        text: "Reserve Mana & Spirit"
      - id: grace_aura
        text: "Enable Grace (Evasion Boost)"
      - id: wrath_aura
        text: "Activate Wrath (Lightning Damage)"
    solution:
      - reserve_spirit
      - grace_aura
      - wrath_aura
```

### `ReflectionSequenceChallenge` schema

| Field | Type | Required | Description |
|---|---|---|---|
| `prompt` | `string` | Yes | Instruction shown above the cards |
| `items` | `SequenceItem[]` | Yes | Cards to be ordered (presented in randomized order) |
| `solution` | `string[]` | Yes | Correct order of item `id`s |

### `SequenceItem` schema

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique item identifier (referenced in `solution[]`) |
| `text` | `string` | Yes | Display text on the card |
| `icon` | `string` | No | Lucide icon name (kebab-case, e.g. `cloud-lightning`, `move`, `cpu`) |

> [!NOTE]
> Items are displayed to the learner in a **randomized order** — the `solution` array defines the correct sequence independent of the order items appear in `items[]`.

---

## Real Example

From `public/okf/poe2-flicker-monk/sections/reflection-sequence/sequence.yaml` *(abbreviated)*:

```yaml
challenges:
  - prompt: "Order the combat skills in the correct sequence to maximize lightning conversion and trigger Falling Thunder Nova (Part 1):"
    items:
      - id: cast_tempest
        text: "Cast Tempest (Create Lightning Zone)"
      - id: stack_charges
        text: "Generate Power Charges"
      - id: execute_flicker
        text: "Execute Flicker Strike"
      - id: trigger_thunder
        text: "Trigger Falling Thunder Nova"
    solution:
      - cast_tempest
      - stack_charges
      - execute_flicker
      - trigger_thunder
```

---

## CDN / inline equivalent

```json
{
  "type": "reflection-sequence",
  "props": {
    "challenges": [
      {
        "prompt": "Order these steps in the request lifecycle:",
        "items": [
          { "id": "1", "text": "Request received", "icon": "inbox" },
          { "id": "2", "text": "Validation", "icon": "check" },
          { "id": "3", "text": "Processing", "icon": "cpu" },
          { "id": "4", "text": "Response sent", "icon": "send" }
        ],
        "solution": ["1", "2", "3", "4"]
      }
    ]
  }
}
```

---

## Pedagogical Role

Place `reflection-sequence` **immediately after the flowchart** (step 7) while the process is still fresh. It bridges passive flowchart recognition and active process recall — the learner must reproduce the sequence they just read.

See [sections-reference.md](../sections-reference.md) for the recommended section ordering.
