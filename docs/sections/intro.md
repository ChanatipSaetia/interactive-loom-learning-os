# `intro` Section Reference

The `intro` section type provides a high-impact, animated onboarding hero card for topics or chapters. Inspired by modern learning UI best practices (Brilliant.org, Stripe Docs, Duolingo), it visually introduces:
1. **WHAT**: Core concept summary, key learning pillars, and tag chips.
2. **WHY**: Strategic rationale, real-world context, and key takeaway metrics.
3. **WHAT'S NEXT**: An interactive learning path / roadmap preview listing all subsequent topic modules with smooth scroll navigation.

---

## File Structure

```
sections/01-intro/
├── section.md      # type: intro
└── content.yaml    # What, Why, and Roadmap data
```

---

## `section.md` Frontmatter

```yaml
---
type: intro
title: "Autonomous AI Agent Architecture"
subtitle: "Mastering goal-directed loops, event storming, and system trade-offs."
resource: content.yaml
---
```

---

## Data File Schema (`content.yaml`)

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Main section / hero heading |
| `subtitle` | `string` | Concise introductory pitch / tagline |
| `estimatedTime` | `string` | Estimated reading/interactive time (e.g. `"8 min read"`) |
| `moduleCount` | `number` | Total interactive modules in this topic |
| `what.summary` | `string` | Overview text of what this topic covers |
| `what.bullets` | `string[]` | Bullet points of key concept pillars |
| `what.tags` | `string[]` | Tag chips for key techniques & tools |
| `why.summary` | `string` | Problem statement and rationale for learning |
| `why.impact` | `string` | Key takeaway box summarizing real-world impact |
| `roadmap` | `array` | List of upcoming topic sections in learning order |

### `roadmap` Step Schema

| Field | Type | Description |
|---|---|---|
| `sectionId` | `string` | Section type or unique element ID to scroll to when clicked |
| `title` | `string` | Step title (e.g. `"Knowledge Graph"`) |
| `type` | `string` | Section type identifier (e.g. `"concept-map"`, `"flowchart"`) |
| `description` | `string` | Short 1-sentence description of what learners do in this step |

---

## Real Example (`content.yaml`)

```yaml
title: "Autonomous AI Agent Architecture"
subtitle: "Mastering goal-directed loops, event storming state transitions, and quantitative system trade-offs."
estimatedTime: "8 min read"
moduleCount: 6

what:
  summary: "Comprehensive conceptual and interactive guide to building stateful, resilient AI agent systems."
  bullets:
    - "Event-driven policy, command, and result event loops"
    - "Spatial knowledge graph of components, memory, and tools"
    - "Quantitative trade-off analysis balancing latency, cost, and reliability"
  tags:
    - "Event Storming"
    - "Knowledge Graph"
    - "Trade-off Sandbox"

why:
  summary: "Single-prompt LLM wrappers break when tasked with complex multi-step enterprise workflows requiring memory and tool selection."
  impact: "Agentic architectures introduce dynamic policy execution, self-evaluation, and deterministic failure recovery."

roadmap:
  - sectionId: "concept-map"
    title: "Knowledge Graph"
    type: "concept-map"
    description: "Map spatial relationships between agent components."
  - sectionId: "flowchart"
    title: "Event Storming Flow"
    type: "flowchart"
    description: "Trace dynamic execution loops and async commands."
  - sectionId: "tradeoffs"
    title: "Trade-off Sandbox"
    type: "tradeoff-sandbox"
    description: "Evaluate latency, throughput, and cost parameters."
```
