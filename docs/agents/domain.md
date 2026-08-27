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
│  [ Core Subdomains — 5 Learning Modalities ]                                            │
│  ├─ ⚡ Process & Event Workflow Simulation                                              │
│  ├─ ⚖️ Dynamic Trade-off & Parameter Exploration                                        │
│  ├─ 💭 Metacognitive Reflection & Synthesis                                             │
│  ├─ 📖 Progressive Loom Content Presentation                                            │
│  └─ 🎯 Knowledge Verification & Practice                                                │
│                                                                                         │
│  [ Supporting Subdomains — Management, Delivery & OKF Storage ]                         │
│  ├─ 📁 In-Repo OKF File Storage & Repository                                            │
│  ├─ 🔌 Single HTML Embedded Widget Delivery                                             │
│  ├─ 🌐 OKF Folder Web App Rendering Runtime                                             │
│  ├─ ✏️ Content Authoring & Live Editor                                                  │
│  ├─ 📚 Catalog & Topic Discovery                                                        │
│  ├─ 📊 Learning Progress Tracking                                                       │
│  └─ 🎮 Gamification Campaign Runtime (Character State · Combat · Progression)           │
│                                                                                         │
│  [ Generic Subdomains — Infrastructure & UX ]                                           │
│  ├─ 🎨 Design System & Sensory Experience (Theme, Sound, Motion)                        │
│  └─ 🗺️ Hex Map Topology & Campaign Definition                                           │
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
12. **🎮 Gamification Campaign Runtime**  
    *Focus:* Character attributes (Armor, Evasion, Intelligence), HP & System Chaos, quiz combat resolution, node unlocks, XP/leveling, temporary buffs, item inventory, and badge awards across gamified topics. Consumes `HexCampaign` from the Hex Map context via `HexCampaignSourcePort`.

---

### 🌐 Generic Subdomains (Infrastructure & Utilities)

13. **🎨 Design System & Sensory Experience**  
    *Focus:* Theme token management (Catppuccin Frappé), interactive sound cue engine, and motion/animation primitives.
14. **🗺️ Hex Map Topology & Campaign Definition**  
    *Focus:* Authorable campaign map data independent of OKF: hex nodes, axial `(q, r)` coordinates, hex type classification, monsters, item rewards, boss unlock criteria, and Hex Map Validation (coordinate uniqueness, capital connectivity, boss solvability, section-reference resolution). Data lives in `public/hexmaps/<topicId>.yaml`.

---

## 2. Bounded Context Architecture

Bounded Contexts define the solution space boundaries. Each Bounded Context maintains an unambiguous **Ubiquitous Language** and isolated domain model.

### 🗺️ Full Context Map — Ports & Adapters

Canonical context map. **Ports** are published by a context (its contract); **adapters** are
host-specific implementations that live on the delivery boundary and *implement* those ports.
Arrow labels state the relationship; `implements` marks adapter → port edges.

```
  ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │                                      OKF DELIVERY & STORAGE CONTEXTS — Supporting                                      │
  │                                                                                                                        │
  │  ┌─ PORTS ──────────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
  │  │ OKFStoragePort:  readSection · saveSection · readHexMap · listTopics                                             │  │
  │  │ OKFRuntimePort:  loadTopicBundle · renderSection · validatePayload                                               │  │
  │  └──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
  │  ┌─ ADAPTERS (implement ports above) ───────────────────────────────────────────────────────────────────────────────┐  │
  │  │ InRepoStorageAdapter (Vite dev API · public/okf/** · public/hexmaps/**)                                          │  │
  │  │ WebAppRuntimeAdapter (SPA router · dynamic loader)                                                               │  │
  │  │ SingleHTMLEmbedAdapter (libs/loom-sections.tsx standalone loader)                                                │  │
  │  └──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
  └───────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────────┘
                                                              │ raw YAML manifests, section files & campaign hex maps
                                                              ▼
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃                               VALIDATION GATEWAY CONTEXT — pure domain · headless (browser / CLI / AI)                 ┃
  ┃                                                                                                                        ┃
  ┃   3-Tier Validation Pipeline: Tier 1 (YAML Syntax) ► Tier 2 (Structural Zod) ► Tier 3 (Semantic Reference Integrity)   ┃
  ┃                                                                                                                        ┃
  ┃   ┌─ CORE SECTION SCHEMAS & SEMANTIC CHECKS ──────────────────────────────────┐  ┌─ HEX MAP TOPOLOGY CHECKS ────────┐  ┃
  ┃   │ ⚡ ProcessSimulation  ⚖️ TradeoffSandbox  💭 ReflectionSynthesis           │  │ Coordinate uniqueness            │  ┃
  ┃   │ 📖 ProgressiveContent 🎯 PracticeAssessment                               │  │ Capital connectivity & solvability│  ┃
  ┃   └───────────────────────────────────────────────────────────────────────────┘  └───────────────────────────────────┘  ┃
  ┃                                                                                                                        ┃
  ┃   ◄────────────────── raw YAML payloads (delivery adapters · AuthoringEditorContext)                                    ┃
  ┃   tell-back ValidationResult ──────────────────────────────► (AuthoringEditorContext diagnostics & inline warning bars) ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                           │                                                    │
               validated section payloads  │                                                    │ validated campaign payloads
               ValidationResult<Section>   │                                                    │ ValidationResult<HexCampaign>
                                           ▼                                                    ▼
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃ COMPOSITION ENGINE CONTEXT                                     ┃   ┃ GAMIFICATION CAMPAIGN CONTEXT                     ┃
  ┃ (CoreLearningEngineContext)                                    ┃   ┃ (Supporting Domain)                               ┃
  ┃                                                                ┃   ┃                                                   ┃
  ┃ • SectionRegistry resolution (lazy SectionRenderer components) ┃   ┃ • Character Attributes & Leveling Engine (XP/HP)  ┃
  ┃ • Topic Route Discovery (/topics/:topicId/*)                   ┃   ┃ • Turn-based Combat Resolution & System Chaos     ┃
  ┃ • Stream HUD & Lesson Assembly                                 ┃   ┃ • Hex Node Unlocks & Inventory Items State        ┃
  ┃ • lastValidData Section Live Preview Fallback                  ┃   ┃ • lastValidData Campaign Map Fallback             ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   ┗━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━┛
                         │                                                                       │
                         │                                                                       │
      ┌──────────────────┴───────────────────┐               ┌───────────────────────────────────┼─────────────────────────┐
      │                                      │               │                                   │                         │
      │ consumes tokens & primitives         │ subscribes    │ consumes tokens & sounds          │ publishes/subscribes    │ persists
      ▼                                      ▼ SectionEvents ▼                                   ▼ DomainEvents            ▼ state
┌───────────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────────┐   ┌──────────────────────────┐
│ UISYSTEM CONTEXT          │   │ LEARNER PROGRESS CONTEXT  │   │ AUTHORING EDITOR CONTEXT  │   │ CATALOG DISCOVERY CONTEXT│
│ (Generic)                 │   │ (Supporting)              │   │ (Supporting)              │   │ (Supporting)             │
│ • ThemeTokens (Catppuccin)│   │ • SectionCompleted        │   │ • Visual Split Editor     │   │ • Topic Manifest Index   │
│ • UI Primitives (Card/Btn)│   │ • QuizAnswered History    │   │ • Live Form ↔ YAML Sync   │   │ • Search & Category Filter│
│ • Sensory Sound & Motion  │   │ • LocalStorage persistence│   │ • Validation Diagnostics  │   │ • Topic Route Discovery  │
└───────────────────────────┘   └───────────────────────────┘   └───────────────────────────┘   └──────────────────────────┘
                         │                                                                       │
                         │ stream assembly & components                                          │ campaign state & gameplay actions
                         ▼                                                                       ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │                                       HOST ROUTES & VIEWS — conformist consumers                                       │
  │                                                                                                                        │
  │     /topics/:topicId (SPA Lesson Stream)               /gamification/:topicId (Campaign Map View & Turn Combat)        │
  └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Relationship vocabulary used in this map:**

| Relationship | Where | Meaning |
|---|---|---|
| **Open Host Service** | Hex Map / OKF → Host (`OKFStoragePort`/`OKFRuntimePort`/`GamificationRuntimePort`) | The upstream context publishes a port contract; any adapter may implement it. |
| **Customer / Supplier + ACL** | Hex Map → OKF (section-ref check) | OKF is the core supplier; the Hex Map context is a read-only customer. The port acts as anti-corruption layer — OKF types never leak into Hex Map models. |
| **Conformist** | Host routes/views → Gamification & OKF | Views adopt published language (`GlobalCharacterState`, `TopicCampaignState`, section bundles) unchanged. |
| **Shared kernel (published language)** | `HexCampaign` VO family | Owned by the Hex Map context, consumed type-only by Gamification, Validation Gateway, and Host. |
| **Internal Customer / Supplier** | CompositionEngine & GamificationCampaign → ValidationGateway (`ValidationResult` tell-back) | ValidationGateway is the pure supplier of verified payloads; CompositionEngine and GamificationCampaign are customers that never re-parse YAML or re-implement schema validation. |

---

### 📐 Detailed Bounded Context Specifications

#### A. Master Core Aggregator Context (`CoreLearningEngineContext`)
* **Role:** The master Core Domain orchestrator that aggregates all 5 Core Section Sub-Contexts. It is decomposed into **two independently-usable bounded sub-contexts** with a strict internal boundary:
  * **A1. `ValidationGatewayContext`** — pure ingestion & validation; no React, no DOM.
  * **A2. `CompositionEngineContext`** — page & section composition; React-bound.
* **Internal relationship:** `CompositionEngineContext` is the *customer* of `ValidationGatewayContext` — it consumes the tell-back `ValidationResult` contract (including the `lastValidData` non-blocking fallback) and never re-implements YAML parsing or schema checks itself.

##### A1. Validation Gateway Context (`ValidationGatewayContext`)
* **Role:** Pure ingestion, syntax checking, Zod structural schema validation, and semantic reference integrity. Decoupled from React DOM / UI so it can run in the browser, a CDN bundle, CLI/CI (`npm run okf:validate`), or background AI fix loops.
* **Ubiquitous Language:** `ValidationResult`, `ValidationDiagnostic` (with `fixHint`), `ValidationContext`, `lastValidData`, `3-Tier Validation` (Tier 1 Syntax · Tier 2 Structural Schema · Tier 3 Semantic Reference Integrity).
* **Code:** [src/core/learning-engine/validation/](file:///home/chanatip/interactive_loom_learning_os/src/core/learning-engine/validation) — `gateway.ts` (pipeline + schema registry), `types.ts` (tell-back contract). Independent entry point: `src/core/learning-engine/validation`.
* **Responsibilities:** Accepts raw OKF section and Hex Map campaign payloads from delivery contexts and the `AuthoringEditorContext`, delegates Tier 2 to sub-context schemas (`SectionSchema`, `HexCampaignSchema`), delegates Tier 3 to reference-integrity functions, and returns standardized tell-back `ValidationResult` payloads.
* **Rule:** **Zero React/DOM imports.** Any `react` import inside `validation/` is a boundary violation.

##### A2. Composition Engine Context (`CompositionEngineContext`)
* **Role:** Page assembly, section registry resolution (lazy `SectionRenderer` lookup), HUD/stream orchestration, and UI system integration for all supporting contexts.
* **Ubiquitous Language:** `TopicRoute`, `OKFBundled`, `SectionConfig`, `SectionRegistry`, `HUDContext`, `EditorContext`, `lastValidData` preview state.
* **Code:** [src/core/learning-engine/composition/](file:///home/chanatip/interactive_loom_learning_os/src/core/learning-engine/composition) (`routes.tsx`, `okf/reader.ts`, `okf/sections.ts`, `okf/types.ts`, `context/`, `hooks/`) plus [src/core/learning-engine/registry/](file:///home/chanatip/interactive_loom_learning_os/src/core/learning-engine/registry) (lazy `SectionRegistry`). Independent entry point: `src/core/learning-engine/composition`.
* **Responsibilities:**
  1. **Topic Route Discovery:** Maps topic manifests to `/topics/:topicId/*` routes (`discoverTopics`, `TopicsProvider`, `useTopics`).
  2. **Bundle Ingestion & Fallback:** Loads section bundles via `OKFRuntimePort`, runs them through `ValidationGatewayContext`, and keeps `lastValidData` live-preview state on non-blocking warnings.
  3. **Section & Page Composition:** Consumes theme tokens, UI primitives, sound cues, and motion presets from `UISystemContext` to compose and render complete, interactive section pages.
* **Rule:** Must **not** parse raw YAML or re-implement section schemas — delegate to `ValidationGatewayContext` and consume its `ValidationResult` payloads.

#### B. Core Section Sub-Contexts (The 5 Learning Modalities)
* **`ProcessSimulationSubContext`** ([src/core/learning-engine/sub-contexts/process-simulation/](file:///home/chanatip/interactive_loom_learning_os/src/core/learning-engine/sub-contexts/process-simulation)): Flowcharts & Guided Scenarios.
* **`TradeoffSandboxSubContext`** ([src/core/learning-engine/sub-contexts/tradeoff-sandbox/](file:///home/chanatip/interactive_loom_learning_os/src/core/learning-engine/sub-contexts/tradeoff-sandbox)): Trade-off Sandboxes, Formula Sandboxes, Decision Trees.
* **`ReflectionSynthesisSubContext`** ([src/core/learning-engine/sub-contexts/reflection-synthesis/](file:///home/chanatip/interactive_loom_learning_os/src/core/learning-engine/sub-contexts/reflection-synthesis)): Reflection Sequences & Reflection Templates.
* **`ProgressiveContentSubContext`** ([src/core/learning-engine/sub-contexts/progressive-content/](file:///home/chanatip/interactive_loom_learning_os/src/core/learning-engine/sub-contexts/progressive-content)): Rich Text, Bullets, Taxonomy Browsers, Image Galleries.
* **`PracticeAssessmentSubContext`** ([src/core/learning-engine/sub-contexts/practice-assessment/](file:///home/chanatip/interactive_loom_learning_os/src/core/learning-engine/sub-contexts/practice-assessment)): Quizzes, Flashcards, Concept Maps.

*Rule:* Core Section Sub-Contexts contain **zero hardcoded styling or ad-hoc UI buttons**. They focus purely on interactive domain logic and leave visual page composition to `CompositionEngineContext` using `UISystemContract`. Each sub-context exposes its `SectionSchema` + Tier 3 validators to `ValidationGatewayContext` and its `SectionRenderer` to `CompositionEngineContext` via the co-located `schema.ts` / `validation.ts` / `components/` files.

---

#### C. The 3 OKF Delivery & Storage Contexts

##### 1. `InRepoOKFStorageContext` ([src/core/delivery/adapters/in-repo-storage.ts](file:///home/chanatip/interactive_loom_learning_os/src/core/delivery/adapters/in-repo-storage.ts))
* **Ubiquitous Language:** `OKFDiskFile`, `TopicDirectory`, `SectionPath`, `ManifestFile`, `DevServerFileBridge`.
* **Responsibility:** Manages static physical file layout on disk/public directory (`public/okf/[topic-id]/sections/[section-name]`, `public/hexmaps/[topic-id].yaml`), handles reading raw YAML/Markdown files, and handles disk writes via Vite dev-server API middleware (`POST /api/okf/save-section`).

##### 2. `SingleHTMLEmbedContext` ([src/core/delivery/adapters/single-html-embed.tsx](file:///home/chanatip/interactive_loom_learning_os/src/core/delivery/adapters/single-html-embed.tsx))
* **Ubiquitous Language:** `EmbeddedSectionWidget`, `StandaloneBundle`, `CDNExportHost`, `InlineConfig`.
* **Responsibility:** Exposes lightweight standalone React component wrappers for rendering single OKF section widgets directly in static HTML pages or third-party sites (`libs/loom-sections.tsx`) without requiring routing or full application shell overhead.

##### 3. `OKFFolderWebAppRuntimeContext` ([src/core/delivery/adapters/web-app-runtime.tsx](file:///home/chanatip/interactive_loom_learning_os/src/core/delivery/adapters/web-app-runtime.tsx))
* **Ubiquitous Language:** `TopicAppShell`, `SectionLoaderPipeline`, `OKFFolderManifest`, `TopicNavigationStream`.
* **Responsibility:** Orchestrates the full web application experience. Loads an entire OKF topic folder, resolves multi-section rendering sequences, maps URL routes (`/topics/:topicId/*`), and streams section data into the `CoreLearningEngineContext`.

---

#### D. Other Supporting & Generic Contexts

* **`AuthoringEditorContext`** ([src/core/supporting/authoring-editor/](file:///home/chanatip/interactive_loom_learning_os/src/core/supporting/authoring-editor)): Manages visual split-screen forms, bi-directional sync (Visual Form ↔ Raw YAML source), inline error validation warnings, and draft previews. Sends raw YAML payloads to `ValidationGatewayContext` and renders its tell-back diagnostics.
* **`CatalogDiscoveryContext`** ([src/core/supporting/catalog-discovery/](file:///home/chanatip/interactive_loom_learning_os/src/core/supporting/catalog-discovery)): Discovers topic manifests (`index.md`/`index.yaml`), resolves topic routes, and drives search/filtering.
* **`LearnerProgressContext`** ([src/core/supporting/learner-progress/](file:///home/chanatip/interactive_loom_learning_os/src/core/supporting/learner-progress)): Subscribes to section events (`SectionCompleted`, `QuizAnswered`) and persists progress history in local storage.
* **`UISystemContext`** ([src/core/ui-system/](file:///home/chanatip/interactive_loom_learning_os/src/core/ui-system)): Controls Catppuccin theme tokens, UI component primitives (`<Button>`, `<Card>`, `<Slider>`), audio sound cues, and motion primitives. Provides `UISystemContract` to Core Sections and the `CompositionEngineContext`.

---

#### E. Hex Map Context (Generic — independent of OKF)
* **Role:** Independent bounded context owning campaign map topology as authorable data and coordinate layout geometry. It is **NOT** an OKF section type and has no structural dependency on the OKF Content context — a topic without a map remains a valid OKF topic.
* **Ubiquitous Language:** `HexCampaign`, `HexNode`, `HexNodeType` (`capital`, `reading_sanctuary`, `quiz_encounter`, `reflection_decryption`, `tradeoff_workshop`, `boss_lair`), `HexGridCoordinate` (axial `(q, r)`), `Section Reference`.
* **Validation Delegation:** Registers its `HexCampaignSchema` (Tier 2 structural) and semantic validators (coordinate uniqueness, capital connectivity, boss solvability, section-ref resolution) with the `ValidationGatewayContext`.
* **Data location:** `public/hexmaps/<topicId>.yaml` — map topology, monsters, item rewards, boss `requiredItems`, and section references only.

---

#### F. Gamification Campaign Context (Supporting)
* **Role:** Supporting subdomain runtime orchestrating a learner's gameplay of a `HexCampaign`: character attributes, HP, combat resolution, node unlocks, System Chaos, XP/leveling, temporary buffs, item inventory, and badge awards. Consumes validated payloads from the `ValidationGatewayContext` (similar to `CompositionEngineContext`).
* **Ubiquitous Language:** `GlobalCharacterState`, `TopicCampaignState`, `CharacterAttributes` (Armor, Evasion, Intelligence), `MonsterData`, `ItemReward`, `CombatTurnResult`, `LevelProgressResult`.
* **Ports & Adapters Architecture:**
  * **Driving (Inbound) Ports:** `GamificationRuntimePort` (or `useGamification()` hook) allowing host views (`/gamification/:topicId`, `/gamification-demo`) to trigger gameplay actions (`takeTurn`, `unlockNode`, `restAtSanctuary`).
  * **Driven (Outbound) Ports:**
    * `HexCampaignSourcePort` (input): Loads validated campaign data (`loadCampaign(topicId): HexCampaign | null`). Implemented by `ValidationGatewayCampaignAdapter` which queries the Validation Gateway.
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
When any of the 3 OKF Delivery Contexts (`InRepoOKFStorageContext`, `SingleHTMLEmbedContext`, or `OKFFolderWebAppRuntimeContext`) or the `AuthoringEditorContext` reads or receives OKF section data, it executes a strict **Validation and Tell-Back Protocol** via the Validation Gateway Context (`ValidationGatewayContext`):

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           OKF DELIVERY & STORAGE CONTEXTS                               │
│  (InRepoOKFStorageContext | SingleHTMLEmbedContext | OKFFolderWebAppRuntimeContext | Authoring)│
└──────────────────────────────────────────┬──────────────────────────────────────────────┘
                                           │
                                           │ 1. Pass raw OKF data (YAML/Markdown)
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                    VALIDATION GATEWAY CONTEXT (pure domain · no React)                  │
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
Provided by `UISystemContext` to `CompositionEngineContext` and all Core Section Sub-Contexts (never to `ValidationGatewayContext`, which stays UI-free):
1. **`ThemeContract`**: Catppuccin Frappé color tokens, typography scales, spacing variables.
2. **`UIComponentRegistryContract`**: Standardized UI primitives (`<Card>`, `<Button>`, `<RangeSlider>`, `<Modal>`, `<Badge>`).
3. **`SensoryFeedbackContract`**: Audio triggers (`sound.playClick()`, `sound.playSuccess()`) and motion animation variants.
