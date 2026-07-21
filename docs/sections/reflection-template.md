# Section Type: `reflection-template`

**Mental model**: Reasoning synthesis and explanation writing. Learners fill blanks in a template by dragging word chips, forcing active conceptualization and vocabulary-in-context use.

---

## File Structure

```
sections/reflection-template/
├── section.md        # section descriptor
└── template.yaml     # array of fill-in-the-blank challenges
```

## `section.md` Frontmatter

```yaml
---
type: reflection-template
title: "Combat Stats & Defenses Evaluation"
resource: template.yaml    # relative path to the YAML data file
---
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"reflection-template"` | Yes | Fixed value |
| `title` | `string` | No | Section header |
| `resource` | `string` | Yes | Relative path to the `.yaml` challenges file |

---

## `template.yaml` — data file

A single object with a `challenges` array. Each challenge is an independent fill-in-the-blank puzzle.

```yaml
challenges:
  - prompt: "Complete the statement explaining Attack Speed vs Base Damage stats (Part 1):"
    template: "Increasing Attack Speed multiplies the total hits landed per second, which directly {zone-1} total build DPS. However, swinging faster also {zone-2} the Spirit mana reservation needed to sustain aggressive stance buffs."
    chips:
      - id: "chip-increases"
        text: "increases"
      - id: "chip-decreases"
        text: "decreases"
      - id: "chip-raises"
        text: "raises"
      - id: "chip-lowers"
        text: "lowers"
    solution:
      zone-1: "chip-increases"
      zone-2: "chip-raises"
    explanation: "<strong>Correct!</strong> Attack speed directly multiplies DPS but also drains dynamic Spirit costs, requiring higher aura reservation metrics."

  - prompt: "Complete the statement about Critical Strike properties (Part 2):"
    template: "Tuning Critical Strike Chance to 100% guarantees critical hits, which leads to a {zone-1} estimated build DPS. It also {zone-2} the chance to inflict Shock ailment on enemies."
    chips:
      - id: "chip-higher"
        text: "higher"
      - id: "chip-lower"
        text: "lower"
      - id: "chip-increases"
        text: "increases"
      - id: "chip-decreases"
        text: "decreases"
    solution:
      zone-1: "chip-higher"
      zone-2: "chip-increases"
    explanation: "<strong>Correct!</strong> Perfect crits lead to higher peak hits and guarantee shock infliction."
```

### `ReflectionTemplateChallenge` schema

| Field | Type | Required | Description |
|---|---|---|---|
| `prompt` | `string` | Yes | Instruction shown above the template |
| `template` | `string` | Yes | Sentence with `{zoneName}` placeholders marking blank slots |
| `chips` | `Chip[]` | Yes | Draggable word chips available to fill the blanks |
| `solution` | `Record<string, string>` | Yes | Mapping of `zoneName → chip id` for the correct answer |
| `explanation` | `string` | No | HTML/text explanation shown after the learner completes the challenge |

### `Chip` schema

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique chip identifier (referenced in `solution` values) |
| `text` | `string` | Yes | Display text on the chip |

### Template syntax

Use `{zoneName}` inside the `template` string to mark blank slots:
- `zoneName` must match a key in the `solution` mapping
- A single template can have multiple zones: `{zone-1}`, `{zone-2}`, etc.
- Zone names can be anything valid as an object key: `{verb}`, `{metric}`, `{direction}`, etc.

> [!NOTE]
> The `explanation` field supports basic HTML tags (`<strong>`, `<em>`) for formatting the feedback message.

---

## Real Example

From `public/okf/poe2-flicker-monk/sections/reflection-template/template.yaml`:

```yaml
challenges:
  - prompt: "Complete the statement explaining Attack Speed vs Base Damage stats (Part 1):"
    template: "Increasing Attack Speed multiplies the total hits landed per second, which directly {zone-1} total build DPS. However, swinging faster also {zone-2} the Spirit mana reservation needed to sustain aggressive stance buffs."
    chips:
      - id: "chip-increases"
        text: "increases"
      - id: "chip-decreases"
        text: "decreases"
      - id: "chip-raises"
        text: "raises"
      - id: "chip-lowers"
        text: "lowers"
    solution:
      zone-1: "chip-increases"
      zone-2: "chip-raises"
    explanation: "<strong>Correct!</strong> Attack speed directly multiplies dps but also drains dynamic Spirit costs."
```

---

## CDN / inline equivalent

```json
{
  "type": "reflection-template",
  "props": {
    "challenges": [
      {
        "prompt": "Complete the CQRS pattern description:",
        "template": "In CQRS, the {command} side writes data and the {query} side reads data.",
        "chips": [
          { "id": "command", "text": "Command" },
          { "id": "query", "text": "Query" }
        ],
        "solution": { "command": "command", "query": "query" },
        "explanation": "CQRS separates write operations (Commands) from read operations (Queries)."
      }
    ]
  }
}
```

---

## Pedagogical Role

Place `reflection-template` **immediately after** the `formula-sandbox` or `tradeoff-sandbox` (step 11). The learner has just observed quantitative or structural trade-offs — this section forces them to articulate those observations using precise vocabulary. It is a synthesis checkpoint, not a simple recall test.

See [sections-reference.md](../sections-reference.md) for the recommended section ordering.
