# Interactive Loom Learning OS

An interactive learning platform that dynamically renders structured topic courses from dynamic Open Knowledge Format (OKF) bundles. Features rich animations, auto-laid event-storming flowcharts, tradeoff sandboxes, and active recall checks. Built with React, Vite, TailwindCSS, anime.js, and Motion. Employs a premium Catppuccin Frappé dark theme with Cohere structural design principles.

---

## Features

- **Auto-Laid Flowcharts** — Sugiyama-style layered rendering (Event Storming, System Architecture, State Machine, Sequence, Swimlanes) with pan, zoom, node drag, and animated journey walkthroughs.
- **Tradeoff Sandbox** — Side-by-side comparison tables and interactive metric sliders that recompute architecture ratings in real-time.
- **Taxonomy Browser** — Card grids with category metrics, analogies, in-scope/out-of-scope boundaries, and detail modals.
- **Active Recall Widgets** — Includes drag-and-drop chronological sequencing challenges (`reflection-sequence`) and fill-in-the-blank text templates with draggable chip pools (`reflection-template`).
- **Interactive Glossary & Quizzes** — Flip flashcards with IPA pronunciations and AI dialogues, and multiple-choice checkpoints with hints/explanations.
- **Formula Sandbox** — Parametric system dynamic simulation dashboards calculating math formulas dynamically via sliders.
- **Zero-Compile Content (OKF Pipeline)** — Load topics dynamically at runtime using simple Markdown and YAML catalog bundles. No React rebuild required!
- **Standalone CDN Library** — Package any curriculum layout into a single HTML/JSON file running via UMD CDN script tags.

---

## Tech Stack

- **Framework**: React 18.x + React Router DOM v6
- **Build System**: Vite 5.x + TypeScript 5.x
- **Styling**: TailwindCSS 3.x + Catppuccin Frappé Theme
- **Animations**: anime.js v4 + Motion + Lenis (for smooth scrolling)
- **Math & Utilities**: D3 (for force-directed Concept Map graphs), marked (for markdown parsing), Radix UI (for modal primitives)
- **Testing**: Vitest (for unit tests) + Playwright (for E2E tests)

---

## Section Types

Loom supports 14 interactive section types registered dynamically in the `SectionRegistry`. For a detailed guide on the design intent, mental models, and recommended progressive page order for these types, see [docs/sections-reference.md](docs/sections-reference.md).

| Section Type | Category | Description |
|---|---|---|
| `text` | Prose | Markdown-rendered paragraphs with optional scroll-reveal animations. |
| `bullets` | Taxonomy | Hierarchical lists with checkable items and staggered animations. |
| `flowchart` | Architecture | SUGY-laid flowcharts with multi-view layout, pan/zoom, and journey playback. |
| `tradeoff-sandbox` | Decision | Strategy dashboard comparing choices with interactive metric changes. |
| `taxonomy-browser` | Taxonomy | Accent-colored grids for grouping concepts with scope details & analogies. |
| `concept-map` | Semantic | Directed node-link semantic graphs auto-laid via D3 force simulation. |
| `decision-tree` | Diagnostic | Q&A wizard recommending specific solutions based on diagnostic paths. |
| `flashcards` | Recall | Flippable cards deck displaying terms, IPA pronunciation, and AI thoughts. |
| `image-gallery` | Visual | Lightbox grid of images with lazy-loading and attribution credit support. |
| `formula-sandbox` | Simulation | Slider-driven calculator evaluating custom JavaScript math formulas. |
| `reflection-sequence` | Recall | Drag-and-drop chronological step-ordering challenges. |
| `reflection-template` | Recall | Fill-in-the-blank paragraphs with draggable vocabulary chips. |
| `scenario` | Decision | Consequence-driven branching narratives grading choice outcomes (A, B, C). |
| `quiz` | Validation | Multiple-choice questions with score tracking, hints, and explanations. |

---

## Dynamic OKF Topic Creation

All topic content lives in the `public/okf/` folder. Topics are structured as [OKF v0.1](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) bundles. The reader pipeline loads them dynamically at runtime — **no TypeScript changes or recompilations are needed**.

### Topic Bundle Folder Layout
```
public/okf/[topic-id]/
  ├── index.md                 # OKF directory listing (progressive disclosure links)
  ├── index.yaml               # App metadata (category, tags, related files list)
  └── sections/                # Subfolders containing YAML/Markdown data
      ├── intro/
      │     ├── section.md     # Section manifest (type, title, resource)
      │     └── content.md     # Markdown paragraphs
      └── flowchart/
            ├── section.md     
            ├── actors.yaml    # Actor definitions
            ├── systems.yaml   # Systems metadata
            ├── steps.yaml     # Step configurations (linear/branch)
            └── journeys.yaml  # Journey playlists
```

### Quick Start
1. **Create folder**: Initialize `public/okf/my-new-topic/`
2. **Define topic registry**: Add links to the topic in the catalog indexes:
   - Root index file: [public/okf/index.md](file:///Users/chanatipsaetia/Work/interactive-loom-learning-os/public/okf/index.md)
   - Fallback registry: Run `npm run dev` or regenerate with `node scripts/update-okf-manifest.js` to compile the `public/index.yaml` list.
3. **Assemble sections**: Create subfolders under `sections/` and define your data files (YAML or Markdown).
4. **Link sections**: Add links to each section manifest inside your topic's `index.md` file and register the data files under the `related` property in `index.yaml`.

For detailed technical instructions and schema definitions, see [docs/creating-topics.md](docs/creating-topics.md). To understand the flowchart Event Storming rules, see [docs/event-storming-conventions.md](docs/event-storming-conventions.md). For the progressive section ordering guide and mental models, see [docs/sections-reference.md](docs/sections-reference.md).

---

## Project Structure

```
interactive-loom-learning-os/
├── public/
│   ├── okf/                   # Dynamic OKF topic bundles (Markdown/YAML)
│   ├── index.yaml             # Auto-generated topics manifest
│   ├── langgraph.html         # Standalone CDN showcase file
│   └── langgraph.json         # Standalone showcase curriculum data
├── src/
│   ├── core/                  # OKF parser, dynamic routing, HUD/progress states
│   ├── sections/              # Components & logic for the 14 section types
│   ├── components/            # Sidebar, top nav, scroll and layout utilities
│   ├── styles/                # Catppuccin theme stylesheets and resets
│   ├── App.tsx                # Base router setup
│   └── main.tsx               # App entrypoint registering section renderers
├── scripts/
│   ├── update-okf-manifest.js # Script compiling the dynamic public topic indexes
│   └── publish-lib.js         # Script packaging the standalone CDN library bundle
├── docs/
│   ├── creating-topics.md     # Technical schemas & OKF configuration guide
│   ├── sections-reference.md  # Section mental models & ordering pedagogy
│   ├── event-storming-conventions.md # Flowchart conventions & node semantics
│   └── cdn-library.md         # CDN standalone UMD usage specification
└── tests/
    ├── unit/                  # Unit tests (Vitest)
    └── e2e/                   # End-to-end tests (Playwright)
```

---

## Standalone CDN Usage (No Repository Required)

You do not need to clone this repository to render interactive learning sections. The component library is packaged as a standalone bundle that can be loaded on any static website via CDN.

### Load CDN Assets
Include the CSS and UMD Javascript files directly in your HTML:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/loom-learning-sections@1.3.0/loom-sections.css">
<script src="https://cdn.jsdelivr.net/npm/loom-learning-sections@1.3.0/loom-sections.umd.js"></script>
```

For setup directions (including Local JSON loading, CORS handling, and code templates), check [docs/cdn-library.md](docs/cdn-library.md).

### Prompting AIs to Generate Standalone Pages or Repository Topics

You can copy and send the following user prompt directly to coding models (such as Gemini, Claude, or ChatGPT) to automatically generate a fully complete, interactive topic page on any subject.

Copy-paste this block into your AI chat session:

```text
Create page for [TOPIC]: Do not generate any files yet. First, ask me to specify:

1. The topic I want to create a curriculum page for.
2. My preferred output format:
   * Option A (Embedded CDN Page): A single static HTML file with the curriculum sections array embedded directly inside a script tag (completely standalone).
   * Option B (Static CDN Page with local OKF catalog): An HTML file loading sections from a local OKF bundle folder (e.g. './okf-data') using the UMD method 'LoomSections.loadAndRenderOKF(container, okfBaseUrl, topicId)'.
   * Option C (Repository OKF Catalog Bundle): A multi-file directory structure to be placed under 'public/okf/[topic-id]/' inside this repository (index.md, index.yaml, and subfolders containing yaml/markdown files).

Once I provide the topic and layout choice, you MUST fetch and read the specifications from the following documentation files (hosted on GitHub master branch, accessible to all AI tools):

1. CDN Integration Specification (for Option A & B UMD setup): https://raw.githubusercontent.com/ChanatipSaetia/interactive-loom-learning-os/master/docs/cdn-library.md
2. OKF Topic Creation Manual (for Option B & C schemas): https://raw.githubusercontent.com/ChanatipSaetia/interactive-loom-learning-os/master/docs/creating-topics.md
3. Progressive section ordering rules & mental models (All Options): https://raw.githubusercontent.com/ChanatipSaetia/interactive-loom-learning-os/master/docs/sections-reference.md
4. Flowchart Event Storming conventions & nodes structure (All Options): https://raw.githubusercontent.com/ChanatipSaetia/interactive-loom-learning-os/master/docs/event-storming-conventions.md

For a MORE COMPREHENSIVE build, also pull the per-section-type reference docs and the worked example bundle from this directory (fetch the repo tarball via codeload.github.com if GitHub's tree UI blocks direct access — it does):
https://github.com/ChanatipSaetia/interactive-loom-learning-os/tree/master/docs/sections
— this includes docs/sections/README.md plus one .md per section type (text, bullets, concept-map, flashcards, taxonomy-browser, flowchart, reflection-sequence, quiz, tradeoff-sandbox, formula-sandbox, reflection-template, scenario, decision-tree, image-gallery), and a full worked example at public/okf/poe2-flicker-monk/ showing real field usage, image-gallery sourcing, and multi-file taxonomy/tradeoff sections.

CDN version: pin to loom-learning-sections@1.3.0 for the stylesheet and UMD script (both <link> and <script src>) unless I specify a different version.

Then generate the complete curriculum structure matching the specs.
```

---

## License

MIT
