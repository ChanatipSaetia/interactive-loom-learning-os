# Guideline: How to Create a New Topic

This document is a technical reference guide for directory structures, content schemas, and registration requirements for creating interactive topics inside the Loom Learning OS. To build a topic, follow the Quick start below (the same flow for humans and AI agents). The reference sections after it explain each file `okf:new` writes; read them only where you need the details.

## Quick start: the topic authoring flow

A topic is an OKF bundle under `public/okf/`, a registration link and a hex campaign map. **Humans and AI agents create topics the same way**: design the topic in a **brief**, review it, then let `okf:new` build the files from it. Every step below applies to both. The only difference is who does the review in step 3.

### The 6-step flow

| # | Step | Command / file |
|---|---|---|
| 1 | **Brief**: design the topic (tracks, sections, key items, boss, teach points) | `public/okf/<topic-id>/brief.yaml`, written by hand, or `npm run okf:new -- <topic-id> --category <Category> --sections <type1,type2,...>` for a starter brief |
| 2 | **Check the brief** | `npm run okf:validate -- --topic=<topic-id> --brief` |
| 3 | **Review the brief** before any content exists | A human reviews it themselves. **An AI agent stops here and asks the user to approve the brief.** |
| 4 | **Scaffold** section stubs, `index.md`, `index.yaml`, root registration and hex map | `npm run okf:new -- --from public/okf/<topic-id>/brief.yaml` |
| 5 | **Fill**: replace stub content, add `groundedIn` to every quiz question and reflection-sequence challenge, rewrite the hex map story | `public/okf/<topic-id>/sections/*`, `public/hexmaps/<topic-id>.yaml` (see [creating-hexmaps.md](creating-hexmaps.md)) |
| 6 | **Gate**: the topic is done when validation passes **and** every `groundedIn` is confirmed against the section text | `npm run okf:validate -- --topic=<topic-id>` |

To **change a topic later** (add a section or a track), edit the brief and repeat from step 2. `okf:new --from` is additive. It creates only what is missing: new section folders, new links in the topic `index.md`, new hex nodes at the tip of their track and new key items on the boss. It never overwrites section content or existing hex nodes. The only file it rewrites is `index.yaml`, which is generated from the brief.

### The topic brief

The brief is the topic's permanent design record: it holds *what* the topic contains, and `okf:new` builds the files from it. It is committed next to the topic. Section loaders ignore it. VS Code autocompletes it from `schemas/okf/topic-brief.schema.json`.

```yaml
# public/okf/http-caching/brief.yaml
id: http-caching                       # = folder name, lowercase kebab-case
title: "HTTP Caching"
description: "Make web apps fast and cheap by letting browsers and CDNs reuse responses safely"
category: Architecture                 # the ## heading in public/okf/index.md
tags: [http, caching, performance]

boss:                                  # the central failure mode of the domain
  title: "The Stale Cache Wraith"
  failureMode: "Serving outdated or private data because cache rules were wrong"

tracks:                                # 2–4 exploration tracks from the capital
  - id: directives
    title: "Cache Directives"
    sections:                          # in learning order
      - name: directives               # folder: sections/directives/
        type: taxonomy-browser
        title: "Cache Directives"
        keyItem: true                  # drops a key item the boss requires
        teaches:                       # what this section teaches, one id per point
          - id: max-age
            point: "max-age sets how many seconds a response stays fresh"
          - id: private
            point: "private lets only the user's browser cache store it, not CDNs"
      - name: directives-quiz
        type: quiz
        title: "Directive Check"

  - id: revalidation
    title: "Revalidation"
    sections:
      - name: etags
        type: text
        title: "ETags and 304s"
        keyItem: true
        teaches:
          - id: etag
            point: "An ETag identifies a response version so caches can revalidate with a 304"
      - name: revalidation-order
        type: reflection-sequence
        title: "Revalidation Order"
```

| Field | Rule |
|---|---|
| `id`, `title`, `description`, `category`, `tags` | The **only** place topic metadata is written. `okf:new` generates `index.yaml` and the root `public/okf/index.md` link from it, and `okf:validate` fails if they drift. |
| `boss` | `title` names the boss monster; `failureMode` becomes the boss lair description. |
| `tracks` | 2–4 tracks. Each becomes one unlock chain from the capital on the hex map, in section order. |
| `sections[].name` | The folder name, unique across the topic. `intro` is reserved: `okf:new` always adds the intro (the capital hub) and generates its roadmap from the tracks. The same `type` may appear several times under different names. |
| `sections[].keyItem` | `true` makes the section's hex node drop a key item that the boss requires. At least one section must be a key item; 2–4 is typical. |
| `sections[].teaches` | Optional `{ id, point }` list. Ids are unique across the topic. |

### Grounding: `groundedIn`

Every `quiz` question and `reflection-sequence` challenge names the teach point it assesses:

```yaml
# sections/directives-quiz/questions.yaml
- id: q1
  groundedIn: private        # a teaches id from an EARLIER section in the SAME track
  question: "A logged-in dashboard is different for every user. Which directive stops a CDN from storing it?"
  choices: ...
```

`okf:validate` checks that the id belongs to a section that comes earlier in the same track. Grounding is opt-in per section: `groundedIn` becomes required once an earlier section in that track lists `teaches`. The validator can only check the id. The author, human or AI, must still confirm the section text actually teaches the point.

### What `okf:validate` checks for a topic with a brief

- **Brief**: YAML syntax, schema, 2–4 tracks, unique track, section and teach ids, at least one key item.
- **Brief vs. disk**: every section folder is in the brief and every brief section has a folder, and each `section.md` type matches the brief.
- **Metadata**: `index.yaml` category and tags match the brief, and the topic is registered in `public/okf/index.md` under `## <category>`.
- **Intro**: every roadmap `sectionId` is a section in the brief.
- **Grounding**: `groundedIn` rules as above.
- **Hex map**: it exists, and (as for every topic) every section is mapped, the boss can be solved and the boss drops no items.

Topics created before the brief existed have no `brief.yaml`, and none of the brief checks run for them.

## Reference Guides & Documentation

- **[Section Types Reference](sections/README.md)** — Detailed directory layout, frontmatter descriptors, YAML/Markdown schemas, and examples for each section type.
- **[Creating Hex Campaign Maps](creating-hexmaps.md)** — Authoring tabletop RPG hex maps, monster encounters, key items, and boss chambers.
- **[Event Storming Conventions](event-storming-conventions.md)** — Authoritative rules for flowchart process cycles, branching logic, per-step actor/system duplication, node types, and journeys.
- **[Section Reference & Mental Models Guide](sections-reference.md)** — Educational objectives, progressive section ordering logic, and cognitive mental models for all section types.

## Objective
The procedural goal of creating a new topic is to construct a content directory containing YAML/Markdown files under the Open Knowledge Format (OKF) specification, which the reader parses and renders dynamically at runtime.

The key architectural principle is strict separation of content (data) from structure (UI).

## OKF Bundle Structure

All topic content lives in `public/okf/` as [OKF v0.1](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) compliant knowledge bundles. The reader pipeline loads sections dynamically — no TypeScript compilation needed.

```
public/
├── index.yaml                    # Fallback topic registry (auto-generated)
└── okf/
    ├── index.md                  # Root OKF index with okf_version
    ├── demo/                     # Each topic is a bundle
    │   ├── index.md              # Directory listing (progressive disclosure)
    │   ├── index.yaml            # App metadata (category, tags)
    │   └── sections/
    │       └── intro/
    │           ├── section.md    # Section manifest (frontmatter)
    │           └── content.yaml  # What, Why, and Roadmap data
    └── my-topic/
        ├── index.md
        ├── index.yaml
        └── sections/
```

**Key files:**
- `public/okf/index.md` — Root index that lists all topics. The app parses this for topic discovery.
- `public/okf/[topic]/index.md` — Directory listing with section links. The app parses this to discover sections.
- `public/okf/[topic]/index.yaml` — App metadata: `category` and `tags`. Section files are discovered from the section folders themselves.
- `public/okf/[topic]/sections/[name]/section.md` — Section manifest with YAML frontmatter.
- `public/index.yaml` — Fallback topic registry (regenerated by `scripts/update-okf-manifest.js`).

## 0.5. Editor Setup: VS Code YAML Schema Autocomplete

While editing OKF YAML in VS Code (not only in the in-app editor), the
[Red Hat YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml)
offers autocomplete and inline errors from JSON Schemas generated from the
co-located Zod `SectionSchema`s (input shapes, per [domain.md](agents/domain.md)).

1. Install the recommended extension (`.vscode/extensions.json` suggests `redhat.vscode-yaml`).
2. Keep the schemas in sync with Zod after touching any `sub-contexts/*/schema.ts`:

   ```bash
   npm run okf:schemas   # regenerates schemas/ — a unit test fails on drift
   ```

3. `.vscode/settings.json` (`yaml.schemas`) maps each generated schema to its
   file shape by filename convention — e.g. `sections/*/questions.yaml` gets
   the quiz questions schema, `sections/*/tree.yaml` the decision tree, and
   `public/hexmaps/*.yaml` the hex campaign map.

**Ambiguous filenames — use the modeline.** Collection folders (taxonomy
categories, tradeoff scenarios) hold one item per numbered file with arbitrary
names, and a `resource:` override can rename any data file. Where the filename
pattern does not match, pin a schema with a first-line modeline (relative to
the YAML file, so five levels up from `public/okf/<topic>/sections/<name>/`):

```yaml
# yaml-language-server: $schema=../../../../../schemas/okf/taxonomy-browser/category-item.schema.json
```

Available item/single-file schemas: `schemas/okf/<section-type>/*.schema.json`
(see `scripts/okf-schemas-manifest.ts` for the full list) and
`schemas/okf/section-frontmatter.schema.json` for `section.md` frontmatter.

## 1. Create the Directory Structure

Each topic is an [OKF v0.1](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) compliant knowledge bundle under `public/okf/`:

```
public/okf/[topic-id]/
  index.md                        # OKF directory listing — progressive disclosure
  index.yaml                      # App metadata: category, tags
  sections/
    intro/
      section.md                  # frontmatter: type: intro, title, resource: content.yaml
      content.yaml                # What, Why, and Roadmap data
    text/
      section.md                  # frontmatter: type: text, title, resource: content.md
      content.md                  # paragraph text
    flowchart/
      section.md
      actors.yaml
      systems.yaml
      steps.yaml
      journeys.yaml
    lifecycle/
      section.md
      content.md
    capabilities/
      section.md
      items.yaml
    tradeoffs/
      section.md
      scenario-1.yaml
      scenario-2.yaml
    taxonomy/
      section.md
      category-1.yaml
      category-2.yaml
    flashcards/
      section.md
      glossary.yaml
    quiz/
      section.md
      questions.yaml
    concept-map/
      section.md
      concepts.yaml
    scenario/
      section.md
      scenarios.yaml
    decision-tree/
      section.md
      tree.yaml
```

**Adding a new section is simple:** create a folder with `section.md` + data files, then add a link to `index.md`.

## 2. Create the Topic Index (`index.md` + `index.yaml`)

Each topic has two files at its root:

### `index.md` — OKF directory listing (spec §6)

No frontmatter. Lists sections as markdown links grouped under headings:

```markdown
# Topic Display Title

Description of the topic for the overview page.

## Foundations
* [Section Title 1](sections/intro/section.md) - short description
* [Section Title 2](sections/flashcards/section.md) - short description

## Architecture
* [Section Title 3](sections/flowchart/section.md) - short description
```

The app parses this file to discover sections and their display order.

### `index.yaml` — App metadata

YAML file with app-specific configuration (not part of OKF spec):

```yaml
# App metadata for [topic-id] topic bundle
category: Architecture
tags:
  - tag1
  - tag2
```

> [!NOTE]
> **The section folders are the source of truth for which files a section uses** — there is no file list to maintain. The Vite dev server and build generate `okf/<topic-id>/manifest.json` from disk (never commit it). Files whose names start with `_` (e.g. `_draft-scenario.yaml`) are disabled: they stay on disk but are not loaded.

## 3. Section Types

Each section is a folder with a `section.md` manifest (YAML frontmatter) and data files. **Every section type has its own dedicated schema reference** — file structure, frontmatter, field tables, and real examples. You never need to read schemas from this guide; open the doc for the type you are authoring:

| Type | Purpose | Schema reference |
|---|---|---|
| `intro` | Animated hero overview: What / Why / roadmap | [sections/intro.md](sections/intro.md) |
| `text` | Paragraph-based conceptual narrative | [sections/text.md](sections/text.md) |
| `bullets` | Hierarchical lists, codexes, checklists | [sections/bullets.md](sections/bullets.md) |
| `taxonomy-browser` | Category card grid with expandable detail views | [sections/taxonomy-browser.md](sections/taxonomy-browser.md) |
| `pillar-layer` | Layered hierarchical / evolutionary stacks | [sections/pillar-layer.md](sections/pillar-layer.md) |
| `image-gallery` | Image grid with full-screen lightbox | [sections/image-gallery.md](sections/image-gallery.md) |
| `flowchart` | Event Storming process flows & swimlanes | [sections/flowchart.md](sections/flowchart.md) |
| `scenario` | Branching consequence narrative with graded outcomes | [sections/scenario.md](sections/scenario.md) |
| `tradeoff-sandbox` | Discrete-choice decisions with metric dashboard | [sections/tradeoff-sandbox.md](sections/tradeoff-sandbox.md) |
| `formula-sandbox` | Continuous sliders over quantitative formulas | [sections/formula-sandbox.md](sections/formula-sandbox.md) |
| `decision-tree` | Diagnostic Q&A ending in a recommendation | [sections/decision-tree.md](sections/decision-tree.md) |
| `reflection-sequence` | Chronological step-ordering recall challenge | [sections/reflection-sequence.md](sections/reflection-sequence.md) |
| `reflection-template` | Fill-in-the-blank synthesis with word chips | [sections/reflection-template.md](sections/reflection-template.md) |
| `quiz` | Multiple-choice knowledge check with explanations | [sections/quiz.md](sections/quiz.md) |
| `flashcards` | Vocabulary flip cards with definitions & dialogue | [sections/flashcards.md](sections/flashcards.md) |
| `concept-map` | Force-directed semantic concept graph | [sections/concept-map.md](sections/concept-map.md) |

See the [Section Types Reference](sections/README.md) for the index and recommended section ordering.

> [!NOTE]
> **Multiple Sections of Any Type Allowed**
> A topic is not restricted to a single instance of each section type. A topic can contain **multiple sections of the exact same type** (e.g. multiple `flowchart` sections, multiple `tradeoff-sandbox` sections, multiple `scenario` sections, or multiple `decision-tree` sections). Each section instance lives in its own directory under `sections/` with its own `section.md` manifest and data files.

> [!IMPORTANT]
> **Multi-Modal Section Design & Assessment Grounding**
> A topic should NEVER be composed entirely of plain `text` sections. Distribute curriculum knowledge across the rich palette of interactive domain components:
> - **Category Comparisons**: Use `taxonomy-browser` instead of text lists to present structured cards with analogies, focus, and scope bounds.
> - **Hierarchical & Evolutionary Stacks**: Use `pillar-layer` (Lego block layer stack) to display evolutionary tiers (e.g. Hammurabi to UDHR, or UI to Database adapters).
> - **Structured Codexes**: Use `bullets` for categorized catalogs, exploration timelines, or checklists.
> - **Process Simulation**: Use `flowchart` (Event Storming) to walk through multi-step systems with live playback.
> - **Trade-offs & Dynamics**: Use `tradeoff-sandbox` (discrete choices) and `formula-sandbox` (continuous sliders) to let learners experiment with opposing forces.
> - **Consequence Scenarios & Advisors**: Use `scenario` (branching story) and `decision-tree` (diagnostic advisor).
> - **Lexicon & Semantic Network**: Use `flashcards` and `concept-map`.
> - **Strict Assessment Grounding (Zero Ungrounded Content)**: Every `quiz` and `reflection-sequence` must be strictly aware of its prerequisite content. **Never add questions, answer options, or timeline items that test concepts, dates, names, or mechanisms not explicitly covered in the prerequisite reading/interactive section.** If an assessment requires testing a fact, that fact MUST be taught in the prerequisite content first.

### Section frontmatter fields

| Field | Required | Description |
|---|---|---|
| `type` | yes | Section renderer — any type from the table above (e.g. `intro`, `text`, `flowchart`, `quiz`) |
| `title` | yes | Display title shown above the section content |
| `resource` | yes | `"."` for directory (multiple data files), or `"filename.yaml"` for a single file |
| `heading` | no | Sub-heading displayed below the title |
| `ordered` | no | `true` for numbered lists, `false` for bullets (only for `bullets` type) |

## 4. Register the Topic

Topics are auto-discovered — no TypeScript changes needed. `okf:new --from` writes the registration link from the brief (`title`, `description`, `category`), and `okf:validate` fails if a topic with a brief is missing from the root index or listed under the wrong category.

### Add to root `index.md`

Add a link to your topic's `index.md` in `public/okf/index.md` under the appropriate category heading:

```markdown
## Architecture
* [Existing Topic](existing-topic/index.md) — existing topic description
* [My New Topic](my-topic/index.md) — Description for the topic card
```

The link URL determines the topic ID (`my-topic`), the link text is the display label, and the text after `—` becomes the description on the topic card. Categories are determined by the heading (`## Architecture`) above the link.

### Add to `public/index.yaml` (fallback)

The app tries `public/okf/index.md` first for topic discovery. As a fallback, you can also add an entry to `public/index.yaml`:

```yaml
- id: my-topic
  label: My New Topic
  path: /topics/my-topic
  category: Architecture
  description: Description for the topic card
```

This is optional if `index.md` is properly configured, but serves as a backup for topic discovery. You can regenerate this file with `node scripts/update-okf-manifest.js`.

## 5. Adding a New Section

To add a section to an existing topic:

1. Add it to a track in `public/okf/[topic-id]/brief.yaml` (with `teaches` if later assessments will test it)
2. `npm run okf:validate -- --topic=[topic-id] --brief`, then review the brief change
3. `npm run okf:new -- --from public/okf/[topic-id]/brief.yaml`. This creates the folder with `section.md` and stub data files, appends the link to `index.md` and appends a hex node at the tip of the track
4. Replace the stub content
5. Run `npm run okf:validate`. It runs the same Validation Gateway as the app and fails on broken files, on `index.md` links without a `section.md`, and on section folders the brief does not declare

No TypeScript changes needed — the loader discovers the section's files from the folder at runtime.

### Multiple sections of the same type

You can have multiple sections of any interactive type (such as flowcharts, tradeoff sandboxes, taxonomy browsers, scenario sessions, or decision trees) in one topic. Each gets its own folder:

```
sections/
  flowchart/           # primary flowchart
  flowchart-lifecycle/  # second flowchart (different schema)
  tradeoffs/           # primary tradeoff sandbox
  tradeoffs-deploy/    # second tradeoff sandbox
  taxonomy/            # primary taxonomy
  taxonomy-patterns/   # second taxonomy
  scenario/            # primary scenario session
  scenario-meeting/    # second scenario session
  decision-tree/       # primary decision tree
  decision-tree-est/   # second decision tree
```

Each `section.md` declares its own `type` and `title`.

## 6. Creating a New Topic from Scratch

Use the [Quick start](#quick-start-the-topic-authoring-flow) flow: brief → `okf:validate --brief` → review → `okf:new --from` → fill → `okf:validate`. Topics are no longer hand-assembled file by file. Sections 1–5 above describe each file the scaffold writes, so you can edit them after scaffolding.

## Related Reference Documents

- **[Section Types Reference](sections/README.md)** — Individual schemas, frontmatter fields, and example configurations for every section type.
- **[Event Storming Conventions Guide](event-storming-conventions.md)** — Authoritative rules for structuring flowchart steps, branching paths, per-step actor/system duplication, and journey walkthroughs.
- **[Section Reference & Mental Models Guide](sections-reference.md)** — Pedagogical ordering rules, mental models, and educational objectives for topic design.
