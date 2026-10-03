# Section Reference & Mental Models

This document defines the educational framework, progressive ordering guides, and conceptual mental models behind the interactive sections in the Loom Learning OS.

---

## The Objective & Purpose of a Topic Page

The core purpose of any interactive topic page is to build a progressive, deep understanding of a technical concept. A well-designed page guides a learner from **zero initial context** to a state of **clear, active recall**, making them ready to communicate about the topic or build systems using it.

Rather than dumping monolithic documentation on the reader, a topic page structures learning as a series of modular, interactive steps. Each section type is designed to target a specific cognitive mode:
1. **Structuring a Mental Map**: Establishing spatial relationships (`concept-map`) and taxonomies (`taxonomy-browser`).
2. **Foundational Vocabulary**: Pre-teaching terminology (`flashcards`) before complex systems are discussed.
3. **Behavioral Processes**: Flow recognition (`flowchart`) transitioning into active sequencing exercises (`reflection-sequence`).
4. **Causality & Trade-offs**: Numerical parameters simulations (`formula-sandbox`), structural selection (`tradeoff-sandbox`), and branching consequence narratives (`scenario`).
5. **Validation**: Checkpoints (`quiz`) and active reasoning synthesis (`reflection-template`).

---

## Recommended Section Order

For optimal cognitive progression, structure your topic's sections in the following sequence. Each step prepares the learner for the subsequent one:

1. **Topic Hero Briefing (`intro`)** — Set the context: What the concept/topic is (definition & meaning), what it covers, why it matters, and an interactive roadmap of upcoming modules.
2. **Concept map (`concept-map`)** — Visual bird's-eye view of how concepts interrelate. Placed early so the learner has a spatial map before individual concepts are explored in depth.
3. **Glossary / vocabulary (`flashcards`)** — Teach key terms and their pronunciation before they appear in diagrams, text, or trade-offs. If the learner doesn't know the words, everything else is noise.
4. **Concept categories (`taxonomy-browser`)** — Show the landscape of concepts and how they relate. Gives the learner a map of what's coming so individual sections feel connected, not isolated.
5. **Core explanation (`text` / `bullets`)** — Explain main concepts, learning goals, or capabilities in prose. Builds on the vocabulary and taxonomy the learner just saw.
6. **How it works (`flowchart`)** — Show the process flow. Now the learner can read node labels and understand what each entity does because the terms were taught earlier.
7. **Sequence check (`reflection-sequence`)** — Drag-and-drop chronological flowchart step ordering challenge. Placed immediately after the flowchart to transition passive flowchart recognition into active process recall.
8. **Apply (`bullets`)** — Practical checklists, maintenance steps, or reference material. The learner can now act on this because they understand the underlying mechanics.
9. **Knowledge check (`quiz`)** — Multiple-choice questions to verify understanding. Score tracking gives immediate feedback. Placed after core content is taught so questions test learned material.
10. **Explore trade-offs (`tradeoff-sandbox` / `formula-sandbox`)** — Let the learner experiment with structural options and quantitative parameters. The formula sandbox allows real-time numerical causality exploration (e.g., chunk size vs cost) with sliding metric HUD details.
11. **Self-Explanation (`reflection-template`)** — Blank-filling synthesis template placed right after the formula sandbox to force the learner to conceptualize and explain the tradeoffs they observed.
12. **Scenario (`scenario`)** — Branching narrative where the learner makes decisions and faces consequences. Graded outcomes make the learning stick. Requires full context from prior sections.
13. **Decision guide (`decision-tree`)** — Diagnostic Q&A that leads to a tailored recommendation. Learner applies knowledge to their own situation. Best placed after all concepts are understood.
14. **Reinforce (`flashcards`)** — Optionally close with recall drills if there's a separate second flashcard deck. The first flashcards are glossary (section 3); these are practice.

> [!IMPORTANT]
> **The Golden Ordering Rule**
> Never reference a term, concept, or mechanism in section $N$ that has not been explicitly introduced in section $N-1$ or earlier.

> [!NOTE]
> **Multiple Sections of Any Type Allowed**
> Topics are not limited to a single instance per section type. A single topic can include **multiple sections of ANY type** (e.g., multiple `text` sections, multiple `flowchart` sections, multiple `tradeoff-sandbox` sections, or multiple `scenario` and `decision-tree` sections). Arrange them in whatever sequence best serves the learning progression.

---

## Every Section Type at a Glance

| Section Type | Mental Model Focus | Data Input Format | Local UI State | Animations & Micro-interactions | Core Subdomain Path (`src/core/subdomains/`) |
|---|---|---|---|---|---|
| `intro` | Topic hero overview, rationale & learning roadmap | `content.yaml` | None | Entrance keyframes, touch-swipe horizontal roadmap track | `progressive-content` |
| `text` | Anchored conceptual narrative | Markdown strings | None | Scroll-triggered fade-in | `progressive-content` |
| `openui` | Free-form composed layout (cards, tabs, tables, charts) | Standard OpenUI Lang program after an `// @openui "Title"` directive | Component-local (tabs, accordions, form fields) | OpenUI component transitions | `progressive-content` |
| `bullets` | Hierarchical taxonomy / breakdown | Nested recursive nodes | Expanded/Collapsed states | Staggered fade/slide-in, chevron rotation | `progressive-content` |
| `flowchart` | Dynamic process flows & swimlanes | `actors.yaml`, `systems.yaml`, `steps.yaml`, `journeys.yaml` | Active step, fullscreen toggle, view mode tabs | anime.js path drawing, camera centering, highlights | `process-simulation` |
| `tradeoff-sandbox` | Architectural tradeoffs & strategy matrix | Scenarios with choices, pros/cons list | Selected choice per step, metrics scores state | Bar gauge expansion transitions, pros/cons fade-in | `tradeoff-sandbox` |
| `taxonomy-browser` | Concept categorized grids & properties | Category yaml files | Selected category card, expanded card state | Cards zoom, pulse rings, grid shifts | `progressive-content` |
| `quiz` | Knowledge check & validation | Multiple-choice questions (`questions.yaml`) | Selected answer, verified state, index | Score counters, card transitions, correct/incorrect badges | `practice-assessment` |
| `concept-map` | Semantic relationships & groupings | Node lists + Directed edges | Zoom, Pan, Active Hover node | D3-force simulation layout, link highlights | `practice-assessment` |
| `scenario` | Consequence-driven branching narratives | Choice DAG with rated outcome leaf nodes | History breadcrumbs, current node ID | Staggered choice cards, verdict slides | `process-simulation` |
| `decision-tree` | Diagnostic logic & situation recommendations | Directed Q&A nodes | Answer path history, active leaf recommendation | Path counter indicators, stagger fade-in cards | `tradeoff-sandbox` |
| `flashcards` | Vocabulary recall & dialogue scenario | Vocabulary card deck + Pronunciation | Card flipped state, active card index | Flip rotation animation, slider transitions | `practice-assessment` |
| `image-gallery` | Visual showcase & screenshots | Image list (`gallery.yaml`) | Fullscreen lightbox index, active image | Keyboard controls transitions, zoom-on-hover | `progressive-content` |
| `pillar-layer` | 2D Grid Architecture Matrix & multi-dimensional structural map | `matrix.yaml` / `section.yaml` | Active block drawer, search query, selected tag pill, hovered pillar/layer | Header highlight scale, block card pop-in, search dimming | `progressive-content` |
| `formula-sandbox` | Quantitative parameter & system dynamics | Sliders (`variables`) + Math expressions | Variable values record, computed metrics | Real-time slider adjustments, HUD drawer side-slide | `tradeoff-sandbox` |
| `reflection-sequence` | Chronological process ordering active recall | Unordered cards list + Solution array | Placed items record, selected item ID | Card drag feedback, mobile tap highlight glows | `reflection-synthesis` |
| `reflection-template` | Reasoning synthesis & tradeoff explanation | Inline text template + Chips pool | Filled zones record, active chip selection | Inline chip placements, blank borders glow | `reflection-synthesis` |

---

## Detailed Section Mental Models

### `text`
- **Mental Model Focus**: Anchored conceptual narrative.
- **Interactivity**: Scroll-reveal animations.
- **Pedagogical Rationale**: Establishes basic context and reading continuity. Useful for section summaries or introductory overviews.

### `openui`
- **Mental Model Focus**: Free-form composed layout built from the standard OpenUI component library (`@openuidev/react-ui`).
- **Interactivity**: Whatever the components provide (tabs, accordions, carousels, charts), with no learning feedback or progress events.
- **Pedagogical Rationale**: Covers content `text` and `bullets` can't shape, such as side-by-side comparisons, small data tables or charts, and FAQs. Prefer a purpose-built section when one fits. See [sections/openui.md](sections/openui.md).

### `bullets`
- **Mental Model Focus**: Hierarchical taxonomy and properties list.
- **Interactivity**: Interactive collapsible checklist nodes.
- **Pedagogical Rationale**: Deconstructs a high-level capability or concept into a detailed tree of sub-properties. Learners can mark nodes as checked/understood.

### `flowchart`
- **Mental Model Focus**: Event Storming process flows, system boundaries, and actor swimlanes.
- **Interactivity**: Dynamic view switching (Swimlanes, System Architecture, State Machine, Sequence views), drag-to-pan, scroll-to-zoom, and journey walkthroughs.
- **Pedagogical Rationale**: Demystifies multi-step distributed system states. Connects human actions, business commands, system components, and result events into a unified process.
- **Multi-Flowchart & Journey Guidelines**: For complex processes, split monolithic diagrams into multiple connected flowchart sections (e.g., `sections/flowchart-engine/`, `sections/flowchart-fuel-injection/`). Each flowchart section folder defines its own `section.md`, `actors.yaml`, `systems.yaml`, `steps.yaml`, and `journeys.yaml` (with multiple journeys per section). Shared systems connect across sections via matching title and type.

### `tradeoff-sandbox`
- **Mental Model Focus**: Structural design decisions and metrics balancing.
- **Interactivity**: Choice selectors per step modifying active metrics bar gauges.
- **Pedagogical Rationale**: Teaches that there are no "perfect" architectures — only trade-offs. Changes in one choice immediately reflect in the metrics (e.g., Monolith vs. Microservice).
- **Multiple Scenarios, Steps & Choices**: A single `tradeoff-sandbox` section can load multiple scenarios (e.g., budget vs invested gear, or process overhead vs communication strategy). Each scenario can contain multiple sequential steps (e.g., weapon, armor, charge generation), and each decision step can define multiple choices/options (2, 3, 4 or more options per decision point).

### `taxonomy-browser`
- **Mental Model Focus**: Categorized lists of patterns, configurations, or subsystems.
- **Interactivity**: Grid cards that expand to reveal detailed specs, analogies, and scoping.
- **Pedagogical Rationale**: Classifies related but distinct concepts (e.g. LLM routing patterns). Employs analogies to bridge theoretical definitions with everyday understanding.

### `pillar-layer`
- **Mental Model Focus**: Layer Stacked & 2D Grid Architecture Matrix.
- **Interactivity**: 2D CSS grid with multi-width spanning, L-shaped polygon clip paths, search, tag filter pills, and detail drawer modals.
- **Pedagogical Rationale**: Demonstrates system assembly using Lego building blocks stacked bottom-to-top across architectural layers, providing active recall through search and polygon slotting.

### `concept-map`
- **Mental Model Focus**: Semantic groupings and entity relationships.
- **Interactivity**: Pan/zoomable directed graph with active hover highlighting.
- **Pedagogical Rationale**: Builds a spatial mental map of how concepts connect (e.g. "Orchestrator delegates to Worker").

### `decision-tree`
- **Mental Model Focus**: Diagnostic selection advisor.
- **Interactivity**: Q&A wizard logging a breadcrumb path to a leaf recommendation.
- **Pedagogical Rationale**: Helps learners apply theoretical knowledge to solve real-world problems. Answers questions sequentially to arrive at a contextual recommendation.

### `flashcards`
- **Mental Model Focus**: Terminology recall and situational dialogue.
- **Interactivity**: Flippable cards, IPA audio triggers, and chat dialogue prompts.
- **Pedagogical Rationale**: Resolves vocabulary ambiguity. The back of the card shows the detailed definition, and the front models a conversation prompt.

### `image-gallery`
- **Mental Model Focus**: Visual confirmation (e.g., UI mockups, terminal logs).
- **Interactivity**: Grid gallery with responsive hover-zoom and full-screen lightboxes.
- **Pedagogical Rationale**: Reinforces abstract concepts with concrete visual evidence.

### `formula-sandbox`
- **Mental Model Focus**: System dynamic causalities (e.g., math calculations).
- **Interactivity**: Continuous slider inputs feeding mathematical formulas. Computed metrics open a HUD drawer.
- **Pedagogical Rationale**: Explores quantitative thresholds (e.g., chunk size overlap vs. vector store indexing costs).

### `reflection-sequence`
- **Mental Model Focus**: Chronological step ordering and recall.
- **Interactivity**: Drag-and-drop ordering or mobile tap selection, with instant validation feedback.
- **Pedagogical Rationale**: Transitions passive diagram reading into active recall of process flows.

### `reflection-template`
- **Mental Model Focus**: Reasoning synthesis and explanation writing.
- **Interactivity**: Blanks inside a paragraph that accept word chips dragged or tapped from a pool.
- **Pedagogical Rationale**: Tests if the learner can synthesize and explain a concept in their own mind using correct vocabulary relationships.

### `scenario`
- **Mental Model Focus**: Consequence-driven branching narrative exercises.
- **Interactivity**: Decision tree paths leading to graded leaf outcomes (A, B, C) with lessons.
- **Pedagogical Rationale**: Teaches by showing the immediate consequences of decisions, simulating real-world system ownership.

### `quiz`
- **Mental Model Focus**: Conceptual validation.
- **Interactivity**: Multiple-choice list with instant checks, hints, and details.
- **Pedagogical Rationale**: Validates learning progress and clarifies common misconceptions.
