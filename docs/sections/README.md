# Section Types Reference

Each section type has its own dedicated reference document. Each doc covers:
- **File structure** — directory layout and filenames
- **`section.md` frontmatter** — the descriptor fields
- **Data file schema** — the `.yaml` (or `.md`) data format with field tables
- **Real examples** — from `public/okf/poe2-flicker-monk/` or other topics
- **CDN / inline equivalent** — the JSON props format for the CDN library
- **Pedagogical role** — where it fits in the recommended section order

---

## Section Types

| Type | Doc | Mental Model | Core Subdomain Path (`src/core/subdomains/`) |
|---|---|---|---|
| `intro` | [intro.md](intro.md) | Topic hero overview, rationale & learning roadmap | `progressive-content` |
| `openui` | [openui.md](openui.md) | Free-form layout from standard OpenUI components | `progressive-content` |
| `bullets` | [bullets.md](bullets.md) | Hierarchical taxonomy / breakdown | `progressive-content` |
| `concept-map` | [concept-map.md](concept-map.md) | Semantic relationships & groupings | `practice-assessment` |
| `flashcards` | [flashcards.md](flashcards.md) | Vocabulary recall & dialogue | `practice-assessment` |
| `taxonomy-browser` | [taxonomy-browser.md](taxonomy-browser.md) | Concept categorized grids & properties | `progressive-content` |
| `flowchart` | [flowchart.md](flowchart.md) | Dynamic process flows & swimlanes | `process-simulation` |
| `reflection-sequence` | [reflection-sequence.md](reflection-sequence.md) | Chronological step ordering | `reflection-synthesis` |
| `quiz` | [quiz.md](quiz.md) | Knowledge check & validation | `practice-assessment` |
| `tradeoff-sandbox` | [tradeoff-sandbox.md](tradeoff-sandbox.md) | Architectural trade-offs & strategy | `tradeoff-sandbox` |
| `formula-sandbox` | [formula-sandbox.md](formula-sandbox.md) | Quantitative parameter dynamics | `tradeoff-sandbox` |
| `reflection-template` | [reflection-template.md](reflection-template.md) | Reasoning synthesis & explanation | `reflection-synthesis` |
| `scenario` | [scenario.md](scenario.md) | Consequence-driven branching narrative | `process-simulation` |
| `decision-tree` | [decision-tree.md](decision-tree.md) | Diagnostic logic & recommendations | `tradeoff-sandbox` |
| `image-gallery` | [image-gallery.md](image-gallery.md) | Visual showcase & screenshots | `progressive-content` |

---

## Recommended Section Order

For optimal cognitive progression, order sections as follows:

1. `intro` / `openui` — intro / anchor
2. `concept-map` — spatial overview
3. `flashcards` — vocabulary
4. `taxonomy-browser` — concept categories
5. `openui` / `bullets` — core explanation
6. `flowchart` — how it works
7. `reflection-sequence` — sequence recall
8. `bullets` — practical reference
9. `quiz` — knowledge check
10. `tradeoff-sandbox` / `formula-sandbox` — explore trade-offs
11. `reflection-template` — synthesis
12. `scenario` — consequence narrative
13. `decision-tree` — diagnostic advisor
14. `flashcards` (optional) — recall drill

> [!IMPORTANT]
> Never reference a term or concept in section N that has not been introduced in section N-1 or earlier.

> [!NOTE]
> **Multiple Sections of Any Type Allowed**
> A single topic can contain **multiple sections of ANY type** (e.g. multiple `openui` sections, multiple `flowchart` sections, multiple `tradeoff-sandbox` sections, multiple `scenario` sections, or multiple `decision-tree` sections). Each section instance gets its own directory under `sections/`.

See [../sections-reference.md](../sections-reference.md) for the full rationale behind this ordering.

---

## `section.md` — The Section Descriptor

Every section folder contains a `section.md` file with YAML frontmatter that identifies the section type, its title, and points to its data file:

```yaml
---
type: flashcards           # section type identifier
title: "Key Vocabulary"    # display title (optional for most types)
resource: glossary.yaml    # path to data file, relative to section.md
intro:                     # optional section briefing (What, Why, What's Next)
  what: "Interactive flashcard drill covering essential agentic systems vocabulary."
  why: "Solidifies precise terminology needed to understand complex architectural trade-offs."
  next: "Next: Categorize system patterns in the Taxonomy Browser."
---
```

The `resource` field accepts:
- A **filename** (e.g. `glossary.yaml`, `tree.yaml`, `content.md`) — loads that single file
- `"."` — loads **all `.yaml` files** in the directory (used by `flowchart`, `taxonomy-browser`, `tradeoff-sandbox`)

---

## OKF Topic Structure

```
public/okf/<topic-slug>/
├── index.yaml              # topic metadata and ordered section list
├── index.md                # optional human-readable topic description
└── sections/
    ├── intro/
    │   ├── section.md      # type: intro
    │   └── content.md
    ├── flashcards/
    │   ├── section.md      # type: flashcards
    │   └── glossary.yaml
    ├── flowchart-engine/
    │   ├── section.md      # type: flowchart, resource: "."
    │   ├── actors.yaml
    │   ├── systems.yaml
    │   ├── steps.yaml
    │   └── journeys.yaml
    ├── flowchart-brake/
    │   ├── section.md      # type: flowchart, resource: "."
    │   ├── actors.yaml
    │   ├── systems.yaml
    │   ├── steps.yaml
    │   └── journeys.yaml
    └── ...
```

---

## Multiple Section Instances & Flowchart Guidelines

When building a topic:
- **Multiple Section Instances**: You can instantiate any section type as many times as needed (e.g., `sections/scenario-1/`, `sections/scenario-2/`, `sections/decision-tree-a/`, `sections/decision-tree-b/`).
- **Multiple Flowchart Sections**: For large/complex processes, break monolithic diagrams into separate, connected domain folders (e.g., `sections/flowchart-engine/`, `sections/flowchart-fuel-injection/`, `sections/flowchart-brake/`). Each folder contains its own `section.md`, `actors.yaml`, `systems.yaml`, `steps.yaml`, and `journeys.yaml`.
- **Multiple Journeys per Section**: Each flowchart section's `journeys.yaml` can define multiple journeys (e.g., mapping vs boss fight, intake/compression vs combustion/exhaust).
- **Connecting Sections**: Final result events or continuation steps of one section connect conceptually to initiating commands in the next section. Shared systems connect across sections via matching title and type.

See [flowchart.md](flowchart.md#splitting-into-multiple-connected-flowchart-sections--multiple-journeys) for full details.
