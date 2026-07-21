# Section Type: `decision-tree`

**Mental model**: Diagnostic selection advisor. A Q&A wizard that leads to a tailored contextual recommendation, helping learners apply theoretical knowledge to their own situation.

---

## File Structure

```
sections/decision-tree/
├── section.md       # section descriptor
└── tree.yaml        # single decision tree with node DAG
```

## `section.md` Frontmatter

```yaml
---
type: decision-tree
title: "Build Setup Advisor"
resource: tree.yaml    # relative path to the YAML data file
---
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"decision-tree"` | Yes | Fixed value |
| `title` | `string` | No | Section header |
| `resource` | `string` | Yes | Relative path to the `.yaml` tree file |

---

## `tree.yaml` — data file

A single tree object with a `root` node ID and a `nodes` mapping. Two node types exist: **choice nodes** and **leaf nodes**.

```yaml
id: flicker-advisor
title: "Flicker Monk Setup Advisor"
root: stage            # ID of the entry node
nodes:
  stage:
    prompt: "What stage of the league are you at?"
    choices:
      - id: league-start
        text: "League start (Acts 1-4)"
        next: weapon-check
        rationale: "Early league priorities differ from endgame."
        recommended: true    # marks this as the recommended path
      - id: mid-league
        text: "Mid-league (mapping, some endgame gear)"
        next: charge-choice
      - id: endgame
        text: "Late league (Uber endgame target)"
        next: uber-check

  weapon-check:
    prompt: "What weapon do you currently have?"
    choices:
      - id: has-staff
        text: "A Quarterstaff with Lightning Damage"
        next: rec-league-start-good
        recommended: true
      - id: has-dreaming
        text: "Dreaming Quarterstaff"
        next: rec-switch-staff

  rec-league-start-good:
    leaf:
      recommendation: "Focus on reaching 4000 ES for Chaos Inoculation."
      explanation: "You have the right weapon. Priority now is gearing toward CI: ES/Evasion hybrid armor, Spirit nodes for auras, and Shavronne's Satchel."
      tradeoffs:
        - "Don't rush CI without Shavronne's Satchel — instant recovery is mandatory"
        - "Early league charge generation: use Hollow Focus + Killing Palm bells"

  rec-switch-staff:
    leaf:
      recommendation: "Switch to any non-Dreaming Quarterstaff immediately."
      explanation: "Dreaming Quarterstaff has 0% base Crit Chance, which breaks Cast on Critical..."
      tradeoffs:
        - "Even a basic staff with Lightning Damage outperforms the Dreaming variant"
```

### Top-level fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique tree identifier |
| `title` | `string` | Yes | Display title |
| `root` | `string` | Yes | Node ID of the entry (root) node |
| `nodes` | `Record<string, DecisionTreeNode>` | Yes | Nodes keyed by node ID |

### `DecisionTreeNode`

Each node is either a **choice node** (has `prompt` + `choices`) or a **leaf node** (has `leaf`). These are mutually exclusive.

**Choice node:**

| Field | Type | Required | Description |
|---|---|---|---|
| `prompt` | `string` | Yes | Decision question shown to the learner |
| `choices` | `DecisionChoice[]` | Yes | Options to choose from |

**Leaf node:**

| Field | Type | Required | Description |
|---|---|---|---|
| `leaf` | `DecisionLeaf` | Yes | Terminal recommendation |

### `DecisionChoice`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique choice identifier within the node |
| `text` | `string` | Yes | Choice display text |
| `next` | `string` | Yes | Node ID to navigate to |
| `rationale` | `string` | No | Short explanation of why this path matters |
| `recommended` | `boolean` | No | Highlights this choice as the recommended path |

### `DecisionLeaf`

| Field | Type | Required | Description |
|---|---|---|---|
| `recommendation` | `string` | Yes | Main recommendation headline |
| `explanation` | `string` | Yes | Detailed reasoning behind the recommendation |
| `tradeoffs` | `string[]` | No | Key tradeoffs or considerations to keep in mind |

---

## Real Example

From `public/okf/poe2-flicker-monk/sections/decision-tree/tree.yaml` — see the actual file for a complete working example (118 lines, 8 nodes).

---

## CDN / inline equivalent

```json
{
  "type": "decision-tree",
  "props": {
    "id": "flicker-advisor",
    "title": "Flicker Monk Setup Advisor",
    "root": "stage",
    "nodes": {
      "stage": {
        "id": "stage",
        "prompt": "What stage of the league are you at?",
        "choices": [
          { "id": "league-start", "text": "League start", "next": "weapon-check", "recommended": true }
        ]
      },
      "weapon-check": {
        "id": "weapon-check",
        "prompt": "What weapon do you have?",
        "choices": [
          { "id": "has-staff", "text": "A Quarterstaff", "next": "rec-good", "recommended": true }
        ]
      },
      "rec-good": {
        "id": "rec-good",
        "leaf": {
          "recommendation": "Focus on reaching 4000 ES.",
          "explanation": "You have the right weapon. Now gear toward CI.",
          "tradeoffs": ["Don't rush CI without Shavronne's Satchel"]
        }
      }
    }
  }
}
```

---

## Pedagogical Role

Place `decision-tree` **last** (step 13) — it's the most personalized section. By the time the learner reaches it, they understand the domain well enough to answer the diagnostic questions meaningfully and benefit from the tailored recommendation.

See [sections-reference.md](../sections-reference.md) for the recommended section ordering.
