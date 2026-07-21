# Section Type: `scenario`

**Mental model**: Consequence-driven branching narratives. Learners make decisions and face immediate graded consequences, simulating real-world system ownership.

---

## File Structure

```
sections/scenario/
├── section.md          # section descriptor
└── scenarios.yaml      # single scenario with branching node DAG
```

## `section.md` Frontmatter

```yaml
---
type: scenario
title: "Build Progression Scenario"
resource: scenarios.yaml    # relative path to the YAML file
---
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"scenario"` | Yes | Fixed value |
| `title` | `string` | No | Section header |
| `resource` | `string` | Yes | Relative path to the `.yaml` scenario file |

---

## `scenarios.yaml` — data file

A single scenario object (not a list) containing a directed acyclic graph (DAG) of nodes.

```yaml
id: build-journey
title: "Your League Journey"
intro: "You've decided to play the Flicker Strike Monk. How you gear up determines your endgame ceiling."
nodes:
  start:
    prompt: "League day 1. You've picked Martial Artist Monk. What's your first priority?"
    choices:
      - id: get-staff
        text: "Find a Quarterstaff (not Dreaming) with Lightning Damage"
        next: staff-found
      - id: grab-dreaming
        text: "Grab the shiny Dreaming Quarterstaff you found"
        next: dreaming-disaster

  staff-found:
    prompt: "You have a decent Quarterstaff. What's next?"
    choices:
      - id: build-es
        text: "Gear toward 4000 ES for Chaos Inoculation"
        next: ci-ready

  dreaming-disaster:
    outcome:
      verdict: "Your Cast on Critical never triggers. Charge generation is dead."
      lesson: "Dreaming Quarterstaff has 0% base Crit Chance, which breaks every crit-dependent mechanic."
      rating: c

  ci-ready:
    outcome:
      verdict: "With Shavronne's Satchel and Instant Life Flask, CI is now safe."
      lesson: "Shavronne's Satchel is mandatory for CI builds."
      rating: a
```

### Top-level fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique scenario identifier |
| `title` | `string` | Yes | Display title |
| `intro` | `string` | Yes | Introductory narrative shown at the start |
| `nodes` | `Record<string, ScenarioNode>` | Yes | Nodes keyed by node ID. The entry node must be named `start` |

### `ScenarioNode`

Each node is either a **choice node** (has `prompt` + `choices`) or an **outcome node** (has `outcome`). These are mutually exclusive.

**Choice node:**

| Field | Type | Required | Description |
|---|---|---|---|
| `prompt` | `string` | Yes | Narrative prompt shown to the learner |
| `choices` | `ScenarioChoice[]` | Yes | Options the learner can select |

**Outcome node:**

| Field | Type | Required | Description |
|---|---|---|---|
| `outcome` | `ScenarioOutcome` | Yes | Terminal outcome with rating and lesson |

### `ScenarioChoice`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique choice identifier within the node |
| `text` | `string` | Yes | Choice display text |
| `next` | `string` | Yes | Node ID to navigate to when this choice is selected |

### `ScenarioOutcome`

| Field | Type | Required | Description |
|---|---|---|---|
| `verdict` | `string` | Yes | Consequence narrative — what happened as a result |
| `lesson` | `string` | Yes | The explicit lesson to take away |
| `rating` | `"a" \| "b-plus" \| "b-minus" \| "c"` | Yes | Grade for this outcome (A = best, C = worst) |

> [!NOTE]
> The **starting node** must always be keyed `start` in the `nodes` mapping. The loader assumes this as the entry point.

---

## Real Example

From `public/okf/poe2-flicker-monk/sections/scenario/scenarios.yaml` *(abbreviated)*:

```yaml
id: build-journey
title: "Your League Journey"
intro: "You've decided to play the Flicker Strike Monk..."
nodes:
  start:
    prompt: "League day 1. You've picked Martial Artist Monk. What's your first priority?"
    choices:
      - id: get-staff
        text: "Find a Quarterstaff (not Dreaming) with Lightning Damage"
        next: staff-found
      - id: grab-dreaming
        text: "Grab the shiny Dreaming Quarterstaff you found"
        next: dreaming-disaster

  smooth-endgame:
    outcome:
      verdict: "Ailith's Chimes transforms boss fights. Build 20 Combo, click, get charges, one-shot bosses."
      lesson: "Ailith's Chimes is the best mid-to-late league investment."
      rating: a

  budget-endgame:
    outcome:
      verdict: "Hollow Focus + Killing Palm works but feels manual."
      lesson: "Budget charge generation is viable but clunky."
      rating: b-plus
```

---

## CDN / inline equivalent

```json
{
  "type": "scenario",
  "props": {
    "id": "build-journey",
    "title": "Your League Journey",
    "intro": "You've decided to play the Flicker Strike Monk...",
    "startNode": "start",
    "nodes": {
      "start": {
        "id": "start",
        "prompt": "League day 1. What's your first priority?",
        "choices": [
          { "id": "get-staff", "text": "Find a Quarterstaff", "next": "staff-found" }
        ]
      },
      "staff-found": {
        "id": "staff-found",
        "outcome": {
          "verdict": "Good start.",
          "lesson": "Weapon first.",
          "rating": "a"
        }
      }
    }
  }
}
```

> [!NOTE]
> In the CDN JSON format, `startNode` is an explicit field. In the OKF YAML format, the loader assumes the `start` key as the entry point.

---

## Pedagogical Role

Place `scenario` near the **end** of the topic (step 12) — it requires full context from all prior sections. Graded outcomes make consequences feel real and memorable. Never place it before the learner has been taught the vocabulary and concepts they'll be tested on.

See [sections-reference.md](../sections-reference.md) for the recommended section ordering.
