# Domain-Driven Design (DDD) Architecture Specification

This document defines the Strategic Domain-Driven Design (DDD) architecture for the **Interactive Loom Learning OS**, outlining its Subdomains, Bounded Contexts, Context Map, and Contract Specifications.

---

## 1. Subdomain Architecture

Subdomains represent the business capabilities and problem space of the Interactive Loom Learning OS, categorized by strategic importance into **Core**, **Supporting**, and **Generic**.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                     SUBDOMAINS                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  [ Core Subdomains — 5 Learning Modalities ]                                           │
│  ├─ ⚡ Process & Event Workflow Simulation                                              │
│  ├─ ⚖️ Dynamic Trade-off & Parameter Exploration                                        │
│  ├─ 💭 Metacognitive Reflection & Synthesis                                            │
│  ├─ 📖 Progressive Loom Content Presentation                                            │
│  └─ 🎯 Knowledge Verification & Practice                                                │
│                                                                                         │
│  [ Supporting Subdomains — Management, Delivery & OKF Storage ]                         │
│  ├─ 📁 In-Repo OKF File Storage & Repository                                            │
│  ├─ 🔌 Single HTML Embedded Widget Delivery                                             │
│  ├─ 🌐 OKF Folder Web App Rendering Runtime                                             │
│  ├─ ✏️ Content Authoring & Live Editor                                                   │
│  ├─ 📚 Catalog & Topic Discovery                                                        │
│  └─ 📊 Learning Progress Tracking                                                       │
│                                                                                         │
│  [ Generic Subdomains — Infrastructure & UX ]                                           │
│  └─ 🎨 Design System & Sensory Experience (Theme, Sound, Motion)                         │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 🎯 Core Subdomains (The 5 Interactive Learning Modalities)

1. **⚡ Process & Event Workflow Simulation**  
   *Focus:* Step-by-step state machine execution for Event Storming cycles (`EVENT → POLICY → COMMAND → AGGREGATE`) and guided scenario walkthroughs.
2. **⚖️ Dynamic Trade-off & Parameter Exploration**  
   *Focus:* Real-time parameter sliders, constraint satisfaction, formula manipulators, and decision trees showing system trade-offs.
3. **💭 Metacognitive Reflection & Synthesis**  
   *Focus:* Guided reflection sequences, reflection templates, and prompt-driven self-assessment loops that cement understanding after sandbox interactions.
4. **📖 Progressive Loom Content Presentation**  
   *Focus:* Interleaving rich narrative prose, step-by-step bullet breakdowns, taxonomy browsers, and visual galleries directly into the interactive loom flow.
5. **🎯 Knowledge Verification & Practice**  
   *Focus:* Interactive Quizzes, Flashcard Flip decks, and Concept Map node/relation matching.

---

### 🛠️ Supporting Subdomains (Management, Authoring & OKF Delivery)

6. **📁 In-Repo OKF File Storage & Repository**  
   *Focus:* Static file storage conventions for OKF content inside the repository (`public/okf/[topic-id]/sections/...`), topic manifests (`index.md`, `index.yaml`), and dev-server file I/O operations.
7. **🔌 Single HTML Embedded Widget Delivery**  
   *Focus:* Packaging, bundling, and serving individual standalone interactive OKF sections for embedding inside single HTML pages or external websites without app routing overhead (`libs/loom-sections.tsx`).
8. **🌐 OKF Folder Web App Rendering Runtime**  
   *Focus:* Dynamic fetching, parsing, routing, and rendering of full OKF topic folders as complete multi-section web applications in the main learning OS.
9. **✏️ Content Authoring & Live Editor**  
   *Focus:* Split-screen visual editing: Bi-directional Visual Form ↔ Raw YAML text synchronization, real-time schema validation warnings, and disk persistence.
10. **📚 Catalog & Topic Discovery**  
    *Focus:* Topic index discovery, category grouping, difficulty/tag filtering, and search path resolution.
11. **📊 Learning Progress Tracking**  
    *Focus:* Section completion tracking, quiz score history, sandbox interaction state retention, and local persistence.

---

### 🌐 Generic Subdomains (Infrastructure & Utilities)

12. **🎨 Design System & Sensory Experience**  
    *Focus:* Theme token management (Catppuccin Frappé), interactive sound cue engine, and motion/animation primitives.

---

## 2. Bounded Context Architecture

Bounded Contexts define the solution space boundaries. Each Bounded Context maintains an unambiguous **Ubiquitous Language** and isolated domain model.

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                          UI & DESIGN SYSTEM CONTEXT                                       │
│                                  (Controls Theme, UI Primitives, Sound & Motion)                          │
└───────────────────────────────────────────────────┬───────────────────────────────────────────────────────┘
                                                    │
                                                    │ Provides UI System Contract
                                                    │ (ThemeTokens, UIPrimitives, SensoryFeedback)
                                                    ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   MASTER CORE AGGREGATOR & RUNTIME CONTEXT                              │
 │                                         (CoreLearningEngineContext)                                     │
 ├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │                                                                                                         │
 │  [ Validation Gateway ] ──► Executes 3-Tier Validation & Tells Back Results to Supporting Contexts       │
 │                                                                                                         │
 │  [ Core Section Sub-Context Registry & Aggregator ]                                                     │
 │  ├─ ⚡ ProcessSimulationSubContext      (Flowcharts & Guided Scenarios)                                │
 │  ├─ ⚖️ TradeoffSandboxSubContext         (Tradeoff Sandboxes, Formulas & Decision Trees)                 │
 │  ├─ 💭 ReflectionSynthesisSubContext     (Reflection Sequences & Synthesis Templates)                    │
 │  ├─ 📖 ProgressiveContentSubContext     (Narrative Text, Bullets, Taxonomy & Image Galleries)           │
 │  └─ 🎯 PracticeAssessmentSubContext      (Quizzes, Flashcards & Concept Maps)                            │
 │                                                                                                         │
 │  [ Page & Section Composition Engine ] ──► Applies UISystemContext Contracts & Renders Sections/Pages  │
 │                                                                                                         │
 └──────────────────────────────────────────────────▲──────────────────────────────────────────────────────┘
                                                    │
                                                    │ Implements Unified Section Contract & Validation Facade
                                                    │
 ┌──────────────────────────────────────────────────┴──────────────────────────────────────────────────────┐
 │                                 SUPPORTING & DELIVERY CONTEXTS                                          │
 ├──────────────────────────────┬──────────────────────────────┬─────────────────────────────┬─────────────┤
 │ 📁 OKF In-Repo               │ 🔌 Single HTML               │ 🌐 OKF Folder               │ ✏️ Authoring │
 │    Storage Context           │    Embed Context             │    Web App Context          │    Editor   │
 └──────────────────────────────┴──────────────────────────────┴─────────────────────────────┴─────────────┘
```

---

### 📐 Detailed Bounded Context Specifications

#### A. Master Core Aggregator Context (`CoreLearningEngineContext`)
* **Role:** The master Core Domain orchestrator that aggregates all 5 Core Section Sub-Contexts.
* **Responsibilities:**
  1. **Validation Gateway:** Accepts raw OKF section payloads from supporting contexts, executes 3-tier validation against the appropriate Core Sub-Context schema, and returns tell-back validation results.
  2. **Sub-Context Aggregator:** Holds the registry of the 5 Core Section Sub-Contexts (`ProcessSimulation`, `TradeoffSandbox`, `ReflectionSynthesis`, `ProgressiveContent`, `PracticeAssessment`).
  3. **Section & Page Composition Engine:** Consumes theme tokens, UI primitives, sound cues, and motion presets from `UISystemContext` to compose and render complete, interactive section pages for all supporting contexts.

#### B. Core Section Sub-Contexts (The 5 Learning Modalities)
* **`ProcessSimulationSubContext`** ([src/core/subdomains/process-simulation/](file:///home/chanatip/interactive_loom_learning_os/src/core/subdomains/process-simulation)): Flowcharts & Guided Scenarios.
* **`TradeoffSandboxSubContext`** ([src/core/subdomains/tradeoff-sandbox/](file:///home/chanatip/interactive_loom_learning_os/src/core/subdomains/tradeoff-sandbox)): Trade-off Sandboxes, Formula Sandboxes, Decision Trees.
* **`ReflectionSynthesisSubContext`** ([src/core/subdomains/reflection-synthesis/](file:///home/chanatip/interactive_loom_learning_os/src/core/subdomains/reflection-synthesis)): Reflection Sequences & Reflection Templates.
* **`ProgressiveContentSubContext`** ([src/core/subdomains/progressive-content/](file:///home/chanatip/interactive_loom_learning_os/src/core/subdomains/progressive-content)): Rich Text, Bullets, Taxonomy Browsers, Image Galleries.
* **`PracticeAssessmentSubContext`** ([src/core/subdomains/practice-assessment/](file:///home/chanatip/interactive_loom_learning_os/src/core/subdomains/practice-assessment)): Quizzes, Flashcards, Concept Maps.

*Rule:* Core Section Sub-Contexts contain **zero hardcoded styling or ad-hoc UI buttons**. They focus purely on interactive domain logic and leave visual page composition to `CoreLearningEngineContext` using `UISystemContract`.

---

#### C. The 3 OKF Delivery & Storage Contexts

##### 1. `InRepoOKFStorageContext` ([src/core/delivery/adapters/in-repo-storage.ts](file:///home/chanatip/interactive_loom_learning_os/src/core/delivery/adapters/in-repo-storage.ts))
* **Ubiquitous Language:** `OKFDiskFile`, `TopicDirectory`, `SectionPath`, `ManifestFile`, `DevServerFileBridge`.
* **Responsibility:** Manages static physical file layout on disk/public directory (`public/okf/[topic-id]/sections/[section-name]`), handles reading raw YAML/Markdown files, and handles disk writes via Vite dev-server API middleware (`POST /api/okf/save-section`).

##### 2. `SingleHTMLEmbedContext` ([src/core/delivery/adapters/single-html-embed.tsx](file:///home/chanatip/interactive_loom_learning_os/src/core/delivery/adapters/single-html-embed.tsx))
* **Ubiquitous Language:** `EmbeddedSectionWidget`, `StandaloneBundle`, `CDNExportHost`, `InlineConfig`.
* **Responsibility:** Exposes lightweight standalone React component wrappers for rendering single OKF section widgets directly in static HTML pages or third-party sites (`libs/loom-sections.tsx`) without requiring routing or full application shell overhead.

##### 3. `OKFFolderWebAppRuntimeContext` ([src/core/delivery/adapters/web-app-runtime.tsx](file:///home/chanatip/interactive_loom_learning_os/src/core/delivery/adapters/web-app-runtime.tsx))
* **Ubiquitous Language:** `TopicAppShell`, `SectionLoaderPipeline`, `OKFFolderManifest`, `TopicNavigationStream`.
* **Responsibility:** Orchestrates the full web application experience. Loads an entire OKF topic folder, resolves multi-section rendering sequences, maps URL routes (`/topics/:topicId/*`), and streams section data into the `CoreLearningEngineContext`.

---

#### D. Other Supporting & Generic Contexts

* **`AuthoringEditorContext`** ([src/core/subdomains/supporting/authoring-editor/](file:///home/chanatip/interactive_loom_learning_os/src/core/subdomains/supporting/authoring-editor)): Manages visual split-screen forms, bi-directional sync (Visual Form ↔ Raw YAML source), inline error validation warnings, and draft previews.
* **`CatalogDiscoveryContext`** ([src/core/subdomains/supporting/catalog-discovery/](file:///home/chanatip/interactive_loom_learning_os/src/core/subdomains/supporting/catalog-discovery)): Discovers topic manifests (`index.md`/`index.yaml`), resolves topic routes, and drives search/filtering.
* **`LearnerProgressContext`** ([src/core/subdomains/supporting/learner-progress/](file:///home/chanatip/interactive_loom_learning_os/src/core/subdomains/supporting/learner-progress)): Subscribes to section events (`SectionCompleted`, `QuizAnswered`) and persists progress history in local storage.
* **`UISystemContext`** ([src/core/ui-system/](file:///home/chanatip/interactive_loom_learning_os/src/core/ui-system)): Controls Catppuccin theme tokens, UI component primitives (`<Button>`, `<Card>`, `<Slider>`), audio sound cues, and motion primitives. Provides `UISystemContract` to Core Sections and the Master Aggregator.

---

#### E. Hex Map Context (Generic — independent of section content)
* **Role:** Independent bounded context owning campaign map topology as authorable data and coordinate layout geometry. It is **NOT** a section type and has no structural dependency on the content format — a topic without a map remains a valid topic.
* **Ubiquitous Language:** `HexCampaign`, `HexNode`, `HexNodeType` (`capital`, `reading_sanctuary`, `quiz_encounter`, `reflection_decryption`, `tradeoff_workshop`, `boss_lair`), `HexGridCoordinate` (axial `(q, r)`), `Section Reference`.
* **Validation Delegation:** Registers its `HexCampaignSchema` (Tier 2 structural) and semantic validators (coordinate uniqueness, capital connectivity, boss solvability, section-ref resolution) with the `ValidationGatewayContext` (`validateHexCampaign`).
* **Data location:** `public/hexmaps/<topicId>.yaml` — map topology, monsters, item rewards, boss `requiredItems`, and section references only. A node's `sectionRef` names an OpenUI section file of the same topic (`public/content/<topicId>/sections/<sectionRef>.oui`).

---

#### F. Gamification Campaign Context (Supporting)
* **Role:** Supporting subdomain runtime orchestrating a learner's gameplay of a `HexCampaign`: character attributes, HP, combat resolution, node unlocks, System Chaos, XP/leveling, temporary buffs, item inventory, and badge awards. Consumes validated payloads from the `ValidationGatewayContext` (similar to `CompositionEngineContext`).
* **Ubiquitous Language:** `GlobalCharacterState`, `TopicCampaignState`, `CharacterAttributes` (Armor, Evasion, Intelligence), `MonsterData`, `ItemReward`, `CombatTurnResult`, `LevelProgressResult`.
* **Ports & Adapters Architecture:**
  * **Driving (Inbound) Ports:** `GamificationRuntimePort` (or `useGamification()` hook) allowing host views (`/campaign`, `/campaign/:topicId`, `/gamification-demo`) to trigger gameplay actions (`takeTurn`, `unlockNode`, `restAtSanctuary`).
  * **Driven (Outbound) Ports:**
    * `HexCampaignSourcePort` (input): Loads validated campaign data (`loadCampaign(topicId): HexCampaign | null`). Implemented by `ValidationGatewayCampaignAdapter`, which reads the YAML through `HttpHexMapStorageAdapter` (`src/core/delivery/adapters/hexmap-storage.ts`) and validates it with the Validation Gateway. Section content for each node comes from the OpenUI topic bundle (`useTopicBundle`).
    * `CharacterStatePort` (persistence): Saves and loads player state (`loadState()`, `saveState()`). Implemented by `LocalStorageCharacterAdapter` and `MemoryCharacterAdapter`.
    * `AssessmentEventSubscriberPort` (learning sync): Subscribes to learning events (`SectionCompleted`, `QuizAnswered`) to award XP/items.
* **Degradation & Fallback:** Maintains `lastValidData` for the active campaign so map edits or transient validation errors in authoring mode never crash active gameplay.
* **Current code:** [src/core/supporting/gamification/](file:///home/chanatip/interactive_loom_learning_os/src/core/supporting/gamification) — `game-rules.ts` (pure domain functions), `types.ts`, `layout.ts`, `components/`.

---

## 3. Contract Specifications

### 📜 1. The Section Contract Specification (Open Host Service)
All Core Section Sub-Contexts implement a unified contract interface:
1. **`SectionSchema`**: Zod/TypeScript validation schema for raw OKF YAML data.
2. **`SectionRenderer`**: Interactive React component for rendering the section logic.
3. **`SectionEvents`**: Domain events (`ProgressUpdated`, `AssessmentCompleted`, `StepChanged`).
4. **`SectionEditorFormSpec`**: Visual form schema, default fields, and validation rules for the Authoring Editor.

---

### 🔍 2. Section Contract Validation & Tell-Back Protocol
When any of the 3 OKF Delivery Contexts (`InRepoOKFStorageContext`, `SingleHTMLEmbedContext`, or `OKFFolderWebAppRuntimeContext`) or the `AuthoringEditorContext` reads or receives OKF section data, it executes a strict **Validation and Tell-Back Protocol** via the Master Aggregator Context (`CoreLearningEngineContext`):

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           OKF DELIVERY & STORAGE CONTEXTS                               │
│  (InRepoOKFStorageContext | SingleHTMLEmbedContext | OKFFolderWebAppRuntimeContext | Authoring)│
└──────────────────────────────────────────┬──────────────────────────────────────────────┘
                                           │
                                           │ 1. Pass raw OKF data (YAML/Markdown)
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                       MASTER CORE AGGREGATOR CONTEXT (Validation Gateway)               │
│                                                                                         │
│  ┌──────────────────────┐    ┌──────────────────────────┐    ┌───────────────────────┐  │
│  │ Tier 1: YAML Syntax  │ ──►│ Tier 2: Structural Schema│ ──►│ Tier 3: Semantic      │  │
│  │ & Frontmatter        │    │ (SectionType Zod Schema) │    │ Reference Integrity   │  │
│  └──────────────────────┘    └──────────────────────────┘    └───────────────────────┘  │
└──────────────────────────────────────────┬──────────────────────────────────────────────┘
                                           │
                                           │ 2. Return Tell-Back Result (ValidationResult)
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                TELL-BACK RESPONSE & ACTION                              │
│                                                                                         │
│  • Status: 'valid' | 'warning' | 'error'                                                │
│  • Payload: validatedData | lastValidData (non-blocking fallback state)                 │
│  • Diagnostic Issues: [{ tier, field, line, column, message, fixHint }]                 │
│                                                                                         │
│  Context Behavior:                                                                      │
│  ├── Editor / Live Preview ──► Renders non-blocking warning bar + last valid state preview │
│  ├── Single HTML Embed    ──► Renders inline warning callout or graceful boundary      │
│  └── Headless / CLI / AI   ──► Emits machine-readable JSON & LLM prompt fix blocks      │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

* **Validation Execution**: Dual-Layer (Parse Pipeline + Render Catching), runnable in browser, CDN bundle, and Headless CLI/Node.js script (`npm run okf:validate`).
* **3-Tier Rigor**:
  * **Tier 1 (Syntax)**: YAML syntax and frontmatter checks.
  * **Tier 2 (Structural Schema)**: Validates against section type structural Zod/TypeScript schema.
  * **Tier 3 (Semantic Reference Integrity)**: Validates cross-references, node IDs, quiz option index bounds, flowchart step links, and ensures all flowchart Actor and System nodes connect to at least one Event node in the relation graph.
* **Tell-Back Result Handling**:
  * On errors in YAML syntax or schema validation, the engine presents **non-blocking inline warning bars** in the Editor/Runtime while maintaining the `lastValidData` state in the Live Preview pane.
  * Emits structured diagnostic payloads featuring contextual `fixHint` messages for automated AI remediation loops.

---

### 🎨 3. The UI System Contract Specification
Provided by `UISystemContext` to `CoreLearningEngineContext` and all Core Section Sub-Contexts:
1. **`ThemeContract`**: Catppuccin Frappé color tokens, typography scales, spacing variables.
2. **`UIComponentRegistryContract`**: Standardized UI primitives (`<Card>`, `<Button>`, `<RangeSlider>`, `<Modal>`, `<Badge>`).
3. **`SensoryFeedbackContract`**: Audio triggers (`sound.playClick()`, `sound.playSuccess()`) and motion animation variants.
