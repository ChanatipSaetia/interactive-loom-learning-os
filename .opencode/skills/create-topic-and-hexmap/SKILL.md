---
name: create-topic-and-hexmap
description: Create a complete Open Knowledge Format (OKF) learning topic and tabletop RPG Hex Campaign Map with multi-modal interactive sections, free branching exploration paths, mandatory key item relics, and solvable boss encounters. Use when user wants to create a new learning topic, build a hex map, author curriculum sections, or design interactive educational campaigns.
---

# Creating Topics & Hex Campaign Maps

Guideline and workflow for authoring complete **Open Knowledge Format (OKF)** learning topics and **Tabletop RPG Hex Campaign Maps** in the **Interactive Loom Learning OS**.

---

## 1. Core Principles & Mental Model

### A. Multi-Modal Interactive Sections (No Text-Only Monotony)
A topic should never be composed of plain text walls. Knowledge must be mapped to appropriate interactive section types:
- **`intro`**: Hero briefing, rationale (What/Why), and curriculum roadmap.
- **`taxonomy-browser`**: Structured category comparison cards (analogies, focus, in-scope/out-of-scope).
- **`pillar-layer`**: Layered architectural Lego stack showing evolutionary tiers or subsystem hierarchies.
- **`bullets`**: Structured knowledge codex, chronological milestones, or checklists.
- **`flowchart`**: Event Storming process cycles with multi-journey step playback.
- **`tradeoff-sandbox`**: Discrete slider choices evaluating opposing system metrics.
- **`formula-sandbox`**: Continuous dynamic equations tuning real-time metrics.
- **`scenario`**: Branching narrative with consequence-based letter grade ratings.
- **`decision-tree`**: Guided diagnostic advisor recommending tailored methodologies.
- **`flashcards`**: Terminology recall with audio/dialogue.
- **`concept-map`**: Interactive force-directed semantic graph.
- **`quiz` & `reflection-sequence`**: Quizzes and timeline ordering challenges **grounded strictly in their preceding prerequisite section**.
  > [!IMPORTANT]
  > **Strict Prerequisite Grounding (Zero Ungrounded Content):** Every quiz question and reflection sequence must be strictly aware of its prerequisite content. **NEVER add questions, choices, or reflection items that test facts, dates, names, or mechanisms not explicitly taught in the prerequisite section.** If an assessment needs to test a concept, that concept MUST be written into the prerequisite reading/interactive section first.

- **`reflection-template`**: Fill-in-the-blank drop-zone synthesis across modules.

### B. Tabletop RPG Hex Map Campaign Loop
1. **Free Exploration Across Thematic Paths:** The learner begins at the central **Capital Hub (0,0)** and can freely explore multiple branching thematic or chronological tracks.
2. **Key Items as Mandatory Knowledge Milestones:** Key items represent essential learning milestones. They **can be placed in any node type except Capital** (reading sanctuaries, archives, simulation nexuses, combat quiz chambers, or timed reflection vaults). Storing a key item in a node explicitly signals to the learner that this milestone is **mandatory to master**.
3. **Boss Lair Confrontation:** The realm's Boss represents the central failure mode of that domain. The Boss Lair dissolves its seal only when all mandatory key items are gathered. In combat, collected items become tactical actions (shields for complete block, blades/astrolabes for 40 true damage).
4. **Dynamic Procedural Layout:** Layout coordinates procedurally re-roll on every new campaign start or defeat restart, providing fresh roguelike replayability while maintaining topological rules.

---

## 2. Step-by-Step Creation Workflow

### Step 1: Design Curriculum & Thematic Tracks
1. Choose the topic ID (`<topic-id>`, lowercase kebab-case).
2. Decompose the domain into **2 to 4 parallel exploration tracks** (e.g. Track 1: Foundations & Law, Track 2: Technology & Flow, Track 3: Dynamics & Strategy).
3. Assign each module to its best interactive section type.
4. Select 2 to 4 core milestones across the tracks to serve as **Mandatory Key Items**.

### Step 2: Create OKF Section Directories
Create section folders inside `public/okf/<topic-id>/sections/<section-name>/`:

```
public/okf/<topic-id>/
├── index.md                 # Directory listing grouped under markdown headers
├── index.yaml               # App metadata (category, tags, related YAML files)
└── sections/
    ├── intro/               # section.md + content.yaml
    ├── taxonomy/            # section.md (resource: ".") + category-1.yaml, category-2.yaml
    ├── pillar-layer/        # section.md + matrix.yaml
    ├── bullets/             # section.md + items.yaml
    ├── flowchart/           # section.md (resource: ".") + actors.yaml, systems.yaml, steps.yaml, journeys.yaml
    ├── tradeoffs/           # section.md (resource: ".") + scenario-1.yaml
    ├── formula-sandbox/     # section.md + sandbox.yaml
    ├── scenario/            # section.md + scenarios.yaml
    ├── decision-tree/       # section.md + tree.yaml
    ├── concept-map/         # section.md + concepts.yaml
    ├── flashcards/          # section.md + glossary.yaml
    ├── quiz/                # section.md + questions.yaml (strictly on prerequisite)
    ├── reflection-sequence/ # section.md + sequence.yaml (strictly on prerequisite)
    └── reflection-template/ # section.md + template.yaml (synthesis)
```

Each section directory MUST contain:
- `section.md` with frontmatter:
  ```yaml
  ---
  type: <section-type>
  title: "Section Display Title"
  resource: <filename.yaml | content.md | ".">
  ---
  ```
- Corresponding YAML/Markdown data files adhering strictly to the section schema.

### Step 3: Register Topic Manifests
1. **`public/okf/<topic-id>/index.md`**: Markdown file listing all sections under thematic headings with relative links `(sections/<section-name>/section.md)`.
2. **`public/okf/<topic-id>/index.yaml`**: Manifest declaring `category`, `tags`, and all `.yaml` data files in `related:`.
3. **`public/okf/index.md`**: Add link to the new topic under the appropriate category heading.

### Step 4: Create the Hex Campaign Map
Create `public/hexmaps/<topic-id>.yaml`:

```yaml
topicId: "<topic-id>"
topicTitle: "Realm Display Title"
capitalId: "capital"

nodes:
  # Capital (Center Hub)
  - id: "capital"
    title: "Capital Hub"
    type: "capital"
    status: "unlocked"
    sectionRef: "intro"
    description: "The starting hub. Explore freely along parallel paths!"

  # Track 1 Node with Key Item
  - id: "sanctuary-alpha"
    title: "Sanctuary of Fundamentals"
    type: "reading_sanctuary"
    status: "unlocked"
    unlockedBy:
      - "capital"
    sectionRef: "taxonomy"
    healingAmount: 40
    rewards:
      - id: "key-item-1"
        name: "Relic of Fundamentals"
        icon: "📜"
        description: "A mandatory knowledge relic required to breach the Boss Lair."

  # Track 1 Encounter Gate
  - id: "quiz-alpha"
    title: "Trial of Wisdom"
    type: "quiz_encounter"
    status: "locked"
    unlockedBy:
      - "sanctuary-alpha"
    sectionRef: "quiz"
    monster:
      id: "monster-alpha"
      name: "Knowledge Sphinx"
      type: "goblin"
      maxHp: 110
      damage: 16
      icon: "🦁"

  # Climax Boss Lair (Adjacent to Capital)
  - id: "boss-lair"
    title: "Lair of the Failure-Mode Titan"
    type: "boss_lair"
    status: "locked"
    unlockedBy:
      - "quiz-alpha"
    description: "The realm's final trial. Requires all mandatory knowledge relics."
    requiredItems:
      - "key-item-1"
    monster:
      id: "boss-titan"
      name: "Domain Titan"
      type: "boss"
      maxHp: 250
      damage: 40
      icon: "🐲"
```

### Invariants for Hex Maps:
- `capital` must exist and be `status: "unlocked"`. Cannot drop item rewards.
- `boss_lair` must have `monster` and `requiredItems`. Must NOT drop item rewards.
- Every item in `boss_lair.requiredItems` must be dropped by a prerequisite node.
- Every item dropped by any node must be listed in `boss_lair.requiredItems`.
- Every section folder in `public/okf/<topic-id>/sections/` must be mapped to a unique node in `nodes[]`.

### Step 5: Validate & Test
Run the full verification suite:

```bash
npm run okf:validate   # 3-tier validation (Syntax, Schema, Reference & Graph Solvability)
npm run typecheck      # TypeScript compilation check
npm run test           # Unit & integration tests
```
