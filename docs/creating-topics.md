# Guideline: How to Create a New Topic

This document is a technical reference guide for directory structures, content schemas, and registration requirements for creating interactive topics inside the Loom Learning OS. To build something right now, follow the Quick start below; read the reference sections afterwards only where you need the details.

## Quick start: your first topic in 10 minutes

A topic is an OKF bundle under `public/okf/` plus a registration link and a hex campaign map. Follow these five steps verbatim and you end up with a topic that passes `npm run okf:validate` and appears in `npm run dev`. The example below is a trimmed version of the real `http-caching` walkthrough topic (`intro` → `taxonomy-browser` → `quiz` + hex map) that lives in `public/okf/http-caching/`.

### The 5-step path

| # | Step | Where |
|---|---|---|
| 1 | **Bundle** — topic landing page + app metadata | `public/okf/<topic-id>/index.md` + `index.yaml` |
| 2 | **Sections** — one folder per section (`section.md` + data files) | `public/okf/<topic-id>/sections/<name>/` — schemas in [docs/sections/](sections/README.md) |
| 3 | **Validate** — the same Validation Gateway the app runs | `npm run okf:validate -- --topic=<topic-id>` |
| 4 | **Register** — one markdown link so the app can discover the topic | `public/okf/index.md` |
| 5 | **Hex map** — campaign map binding every section to a node | `public/hexmaps/<topic-id>.yaml` — see [creating-hexmaps.md](creating-hexmaps.md) |

### Fastest route: scaffold all five steps in one command

The `okf:new` scaffold writes a complete, validation-clean starter topic — bundle, section stubs, root registration, and a starter hex map — and runs the Validation Gateway before anything touches disk:

```bash
npm run okf:new -- <topic-slug> --category <Category> --sections <type1,type2,...> [--title "..."] [--description "..."] [--tags a,b]
```

Example:

```bash
npm run okf:new -- http-caching --category Architecture --sections taxonomy-browser,flowchart,quiz --tags http,performance
```

The scaffold writes the bundle (`index.md` + `index.yaml`), one stub folder per requested type (named after the type), the root registration link under `## <Category>`, and a starter hex map (capital hub + one node per section + boss lair, mapped per [creating-hexmaps.md §4](creating-hexmaps.md)).

Guarantees: `intro` is always added automatically (the capital hub must bind to it); the command **refuses to overwrite** an existing topic and writes **nothing** unless everything validates clean; pass each section type once — to get two sections of the same type, copy the generated folder and rename it. Every generated file is a placeholder: replace the stub content, rewrite the hex map story, then re-verify with `npm run okf:validate -- --topic=<topic-slug>`.

### Hand-writing the minimal topic

To understand what the scaffold produces (or to skip it), here is every file of a complete topic, `first-topic`, written by hand.

**1. Bundle** — `public/okf/first-topic/index.md` (no frontmatter; section links in display order):

```markdown
# Caching Basics

Make web apps fast and cheap by letting browsers and CDNs reuse responses safely.

## Foundations
* [Why Cache?](sections/intro/section.md) — what HTTP caching is and why it matters
* [The max-age Directive](sections/directives/section.md) — the freshness directive you use every day

## Check
* [Knowledge Check](sections/quiz/section.md) — test your directive intuition
```

and `public/okf/first-topic/index.yaml`:

```yaml
# App metadata for first-topic topic bundle
category: Architecture
tags:
  - http
  - caching
```

**2. Sections** — three folders under `public/okf/first-topic/sections/`:

`intro/section.md` ([full schema](sections/intro.md)):

```yaml
---
type: intro
title: "Caching Basics"
resource: content.yaml
---
```

`intro/content.yaml`:

```yaml
title: "Caching Basics"
subtitle: "Reuse responses safely so pages load fast and servers stay calm."
estimatedTime: "5 min read"
moduleCount: 2
what:
  summary: "HTTP caching lets a browser or CDN keep a copy of a response and reuse it instead of asking the origin server again."
  bullets:
    - "The Cache-Control header tells caches what they may store and for how long"
  tags:
    - "Cache-Control"
why:
  summary: "Every request that hits the origin costs latency and compute."
  impact: "A correct caching policy can remove most repeat traffic from your servers."
roadmap:
  - sectionId: "directives"
    title: "The max-age Directive"
    type: "taxonomy-browser"
    description: "How freshness lifetimes work."
  - sectionId: "quiz"
    title: "Knowledge Check"
    type: "quiz"
    description: "Apply the freshness rule."
```

`directives/section.md` ([full schema](sections/taxonomy-browser.md)) — `resource: "."` means every `.yaml` file in the folder is one category card:

```yaml
---
type: taxonomy-browser
title: "Cache Directives"
resource: "."
---
```

`directives/01-max-age.yaml`:

```yaml
type: taxonomy-category
icon: Timer
title: "max-age"
subtitle: "Fresh for N seconds"
color: green
description: "The response may be reused without contacting the server until it is N seconds old."
details: "Use long max-age values for fingerprinted static assets such as app.3f9a.js."
analogy: "Like milk with a best-before date."
primaryFocus: "Freshness lifetime"
inScope:
  - "Static assets with hashed filenames"
outOfScope:
  - "Per-user responses"
```

`quiz/section.md` ([full schema](sections/quiz.md)):

```yaml
---
type: quiz
title: "Knowledge Check"
resource: questions.yaml
---
```

`quiz/questions.yaml` — every fact tested is already taught above (grounding rule):

```yaml
- id: q1
  question: "Your stylesheet is named app.3f9a.css and its contents never change unless the filename changes. What does the max-age guidance suggest?"
  hint: "Think about best-before dates and hashed filenames."
  choices:
    - id: a
      text: "A long max-age freshness lifetime"
      correct: true
      explanation: "Correct. Fingerprinted static assets can stay fresh in caches for a long time."
    - id: b
      text: "Nothing — caching does not apply to stylesheets"
      correct: false
      explanation: "max-age applies to any cacheable response, including stylesheets."
```

**4. Register** — add one link to `public/okf/index.md` under a `## <Category>` heading (create the heading if missing):

```markdown
## Architecture
* [Caching Basics](first-topic/index.md) — Make web apps fast and cheap by letting browsers and CDNs reuse responses safely
```

**5. Hex map** — `public/hexmaps/first-topic.yaml` (one node per section, boss gated by every key item; full rules in [creating-hexmaps.md](creating-hexmaps.md)):

```yaml
topicId: "first-topic"
topicTitle: "Realm of the Swift Response"
capitalId: "capital"

nodes:
  - id: "capital"
    title: "Origin Citadel"
    type: "capital"
    status: "unlocked"
    sectionRef: "intro"
    description: "Every request once came here. Learn why the realm needs caches."

  - id: "directive-spire"
    title: "Spire of Directives"
    type: "archive_spire"
    status: "unlocked"
    unlockedBy:
      - "capital"
    sectionRef: "directives"
    description: "Study the max-age freshness rule."
    rewards:
      - id: "header-sigil"
        name: "Sigil of Cache-Control"
        icon: "📜"
        description: "Proof you know what each directive allows."

  - id: "stale-outpost"
    title: "Stale Goblin Outpost"
    type: "quiz_encounter"
    status: "locked"
    unlockedBy:
      - "directive-spire"
    sectionRef: "quiz"
    description: "Pick the right directive to defeat the goblin serving stale pages."
    monster:
      id: "stale-goblin"
      name: "Stale Goblin"
      type: "goblin"
      maxHp: 100
      damage: 15
      icon: "👾"

  - id: "boss-lair"
    title: "Lair of the Thundering Herd"
    type: "boss_lair"
    status: "locked"
    unlockedBy:
      - "stale-outpost"
    description: "A cache miss storm floods the origin. Only correct caching policy can stop it."
    requiredItems:
      - "header-sigil"
    monster:
      id: "thundering-herd"
      name: "The Thundering Herd"
      type: "boss"
      maxHp: 200
      damage: 35
      icon: "🐲"
```

(Real topics radiate 2–4 thematic tracks from the capital — this single chain is just the minimum.)

**3. Verify** — path step 3, run last so the validator sees everything:

```bash
npm run okf:validate -- --topic=first-topic   # must print "All OKF section bundles passed validation clean!"
npm run dev                                    # topic card appears under Architecture; open it and click through the sections
```

### Common mistakes

| Mistake | Symptom | Caught by validator? |
|---|---|---|
| **Forgetting root registration** — topic exists but has no link in `public/okf/index.md` | Validates clean, but the app never shows the topic (the SPA discovers topics from that file, the CLI scans the filesystem) | ❌ — check the link yourself |
| **Missing hex map** — no `public/hexmaps/<topic-id>.yaml` | Topic renders but the campaign map has no nodes | ❌ |
| **Ungrounded quiz questions** — a question, answer option, or reflection item references a fact not taught in any prerequisite section | Learners are tested on the unseen | ❌ — human review |
| **Unmapped sections** — a section folder has no hex map node (each node binds a unique `sectionRef`) | Sections are unreachable from the campaign map | ✅ tier 3, but only once a hex map exists |

Also remember: the boss lair unlocks only when **all** key items are gathered, and it must **not** drop items itself ([creating-hexmaps.md](creating-hexmaps.md)).

Everything the scaffold produces and the example above hand-writes is explained file by file in the reference sections below.

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

Topics are auto-discovered — no TypeScript changes needed. Two files must be updated:

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

1. Create the folder under `public/okf/[topic-id]/sections/[section-name]/`
2. Create `section.md` with frontmatter (`type`, `title`, `resource`)
3. Add data files in the folder
4. Add a link to the section in `index.md` under the appropriate heading
5. Run `npm run okf:validate` — it runs the same Validation Gateway as the app and fails on broken files or on `index.md` links without a `section.md`

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

Step-by-step guide to create a new topic by hand (prefer the [Quick start](#quick-start-your-first-topic-in-10-minutes) for the fast path). Remember to also create the hex map in `public/hexmaps/[topic-id].yaml` — see [creating-hexmaps.md](creating-hexmaps.md).

### Step 1: Create the directory

```bash
mkdir -p public/okf/my-topic/sections
```

### Step 2: Create `index.md` (OKF directory listing)

```markdown
# My Topic Title

A brief description of what this topic covers.

## Foundations
* [Introduction](sections/intro/section.md) — Overview of the topic
* [Key Vocabulary](sections/flashcards/section.md) — Essential terms

## Concepts
* [Concept Map](sections/concept-map/section.md) — How concepts relate
* [Taxonomy](sections/taxonomy/section.md) — Category breakdown

## Interactive
* [Knowledge Check](sections/quiz/section.md) — Test your understanding
* [Trade-off Sandbox](sections/tradeoffs/section.md) — Experiment with decisions
```

### Step 3: Create `index.yaml` (app metadata)

```yaml
# App metadata for my-topic topic bundle
category: Architecture
tags:
  - my-topic
  - related-tag
```

### Step 4: Register in root `index.md`

Add a link in `public/okf/index.md`:

```markdown
## Architecture
* [Existing Topic](existing/index.md) — existing description
* [My Topic Title](my-topic/index.md) — A brief description of what this topic covers
```

### Step 5: Create sections

Create each section following the [Section Types](#3-section-types) documentation above. At minimum, create an `intro` section:

```bash
mkdir -p public/okf/my-topic/sections/intro
```

Create `public/okf/my-topic/sections/intro/section.md`:
```yaml
---
type: text
title: "Introduction"
heading: "Getting Started"
resource: content.md
---
```

Create `public/okf/my-topic/sections/intro/content.md`:
```markdown
An introductory paragraph about your topic.

A second paragraph with more detail.
```

### Step 6: Verify

Start the dev server and navigate to `http://localhost:5173/` to see the topic card, then click to verify sections load.

```bash
npm run dev
```


## Related Reference Documents

- **[Section Types Reference](sections/README.md)** — Individual schemas, frontmatter fields, and example configurations for every section type.
- **[Event Storming Conventions Guide](event-storming-conventions.md)** — Authoritative rules for structuring flowchart steps, branching paths, per-step actor/system duplication, and journey walkthroughs.
- **[Section Reference & Mental Models Guide](sections-reference.md)** — Pedagogical ordering rules, mental models, and educational objectives for topic design.
