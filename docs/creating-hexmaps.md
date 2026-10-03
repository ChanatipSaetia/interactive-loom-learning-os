# Guideline: How to Create a Hex Campaign Map

This document is the authoritative authoring and technical specification guide for creating Hex Campaign Maps (`public/hexmaps/<topicId>.yaml`) in the **Interactive Loom Learning OS**.

---

## 1. Overview & Mental Model

A **Hex Campaign Map** converts any learning topic (OpenUI Lang content in `public/content/<topic-id>/`) into an interactive RPG tabletop campaign. 

### The Core Gameplay & Narrative Loop:
1. **Free Exploration Across Thematic Paths:** Learners start at the central **Capital Hub (0,0)** and are free to venture down parallel thematic or chronological tracks (e.g., Law & Governance, Technology & Industry, Geopolitics & Strategy).
2. **Key Items as Mandatory Knowledge Milestones:** Key items are relics of essential understanding. They **can be stored in any type of hex node except the Capital Hub** (in reading sanctuaries, taxonomy archives, simulation nexuses, combat quiz chambers, or timed reflection vaults). Dropping a key item signals to the learner that this milestone is **mandatory to master** for the topic.
3. **Defeating the Climax Boss:** Once all mandatory key items are gathered from the various exploration paths, the magical seal on the **Boss Lair** dissolves, allowing the player to confront the realm's Boss (the embodiment of that domain's core failure mode) and liberate the realm.
4. **Dynamic Procedural Map Layout:** On every new campaign start or defeat restart, the layout engine procedurally re-rolls the hex coordinates with organic radial scattering, providing rich roguelike replayability while maintaining topological integrity.

```
                                  [ 🐲 Boss Lair: Domain Titan / Dragon ]
                                       (Requires all Mandatory Relics)
                                                     │
                                         [ 🏰 Capital (Intro Hub) ]
                        ┌────────────────────────────┼────────────────────────────┐
                        ▼ (Free Exploration)         ▼ (Free Exploration)         ▼ (Free Exploration)
                 【 Track A 】                 【 Track B 】                 【 Track C 】
             Thematic Domain 1             Thematic Domain 2             Thematic Domain 3
                        │                            │                            │
             [ 🏛️ Reading Sanctuary ]      [ 🌳 Concept Monolith ]       [ 📚 Flashcard Lexicon ]
                        │                            │                            │
                        ▼                            ▼                            ▼
             [ 🦁 Quiz Encounter ]         [ 📜 Taxonomy Spire ]         [ ⚖️ Formula Sandbox ]
             (Drops ⏳ Key Relic 1)        (Drops 🧭 Key Relic 2)        (Drops ✨ Key Relic 3)
                        │                            │                            │
                        ▼                            ▼                            ▼
             [ 🏛️ Governance Stack ]       [ ⚙️ Simulation Nexus ]       [ 🎭 Crisis Scenario ]
             (pillar-layer)               (flowchart)                   (scenario)
                        │                            │                            │
                        └────────────────────────────┼────────────────────────────┘
                                                     ▼
                                      [ 🔮 Climax Synthesis Vault ]
                                          (reflection-template)
                                                     │
                                                     ▼
                                      [ ⚔️ Breaches Boss Lair Gate ]
```

---

## 2. File Location & Naming

Every campaign map file is stored declaratively under `public/hexmaps/`:

```
public/
├── hexmaps/
│   ├── demo.yaml
│   ├── gamification.yaml
│   ├── system-design.yaml
│   ├── pixijs.yaml
│   ├── pixijs-filters.yaml
│   ├── world-history.yaml
│   ├── kamado-beef.yaml
│   └── <topic-id>.yaml       # Must match the topic directory in public/content/<topic-id>/
└── content/
    └── <topic-id>/
        ├── topic.oui
        └── sections/<section>.oui
```

---

## 3. Hex Map YAML Manifest Schema

A campaign manifest defines the overall campaign header and an array of `nodes`:

```yaml
topicId: "my-topic"                  # Matches public/content/<topic-id>/
topicTitle: "Realm of My Topic"      # Display title of the campaign realm
capitalId: "capital"                 # Starting node ID (default: "capital")

nodes:
  - id: "capital"
    title: "Citadel of Knowledge"
    type: "capital"
    status: "unlocked"
    sectionRef: "intro"
    description: "The starting citadel and safe haven of the realm. Explore freely along branching paths!"

  - id: "sanctuary-foundations"
    title: "Sanctuary of First Principles"
    type: "reading_sanctuary"
    status: "unlocked"
    unlockedBy:
      - "capital"
    sectionRef: "text"
    healingAmount: 40
    description: "Study core fundamentals. Earn the first key relic of understanding!"
    rewards:
      - id: "foundation-relic"
        name: "Relic of First Principles"
        icon: "📜"
        description: "A mandatory foundational milestone required to unlock the Boss Lair."

  - id: "quiz-outpost"
    title: "Gremlin Outpost"
    type: "quiz_encounter"
    status: "locked"
    unlockedBy:
      - "sanctuary-foundations"
    sectionRef: "quiz"
    description: "Defeat the monster by answering knowledge questions accurately."
    monster:
      id: "gremlin-1"
      name: "Knowledge Gremlin"
      type: "goblin"
      maxHp: 100
      damage: 15
      icon: "👾"
    rewards:
      - id: "tactical-relic"
        name: "Aegis of Insight"
        icon: "🛡️"
        description: "A defensive relic required to breach the boss chamber."

  - id: "boss-lair"
    title: "Colossus Lair"
    type: "boss_lair"
    status: "locked"
    unlockedBy:
      - "quiz-outpost"
    description: "The final trial of the realm. Requires all mandatory knowledge relics."
    requiredItems:
      - "foundation-relic"
      - "tactical-relic"
    monster:
      id: "boss-colossus"
      name: "Grand Architect Titan"
      type: "boss"
      maxHp: 200
      damage: 35
      icon: "🐲"
```

---

## 4. Hex Node Types & Gameplay Roles

Each node in `nodes[]` is classified into one of the specialized structural types:

| Type (`type`) | Map Role | Section Type Binding | Key Items & Mechanics |
|---|---|---|---|
| `capital` | Starting Safe Haven | `intro` | Starting tile (`status: "unlocked"`). Renders hero introduction. **Cannot store key items.** |
| `reading_sanctuary` | Sacred Haven & Reading | `text`, `intro`, `reflection-template` | Features active reading healing pulses (HP tick every 10s). **Can store key items.** |
| `archive_spire` | Library & Structured Codex | `taxonomy-browser`, `bullets`, `pillar-layer`, `decision-tree` | Categorized cards, layered Lego stacks, or branching diagnostic trees. **Can store key items.** |
| `simulation_nexus` | Dynamic Process Simulation | `flowchart`, `scenario` | Event Storming process flows or branching consequence scenarios. **Can store key items.** |
| `concept_monolith` | Memory Monolith & Vocabulary | `concept-map`, `flashcards` | Interactive semantic knowledge graphs and lexicon cards. **Can store key items.** |
| `observatory_gallery` | Visual Observatory | `image-gallery` | Image showcases and architectural diagrams. **Can store key items.** |
| `quiz_encounter` | Monster Combat Trial | `quiz` | Correct answers deal strike damage to the monster; wrong answers trigger counterattacks. **Can store key items.** |
| `reflection_decryption` | Timed Cipher Vault | `reflection-sequence` | Timed reordering puzzle under `<RunicCountdownRing>`. **Can store key items.** |
| `tradeoff_workshop` | Workshop & Artifact Forge | `tradeoff-sandbox`, `formula-sandbox` | Sliders dynamically forge RPG attribute buffs (`+15% Armor`, `+10% Evasion`). **Can store key items.** |
| `boss_lair` | Campaign Climax Arena | Dedicated Boss Arena | The final trial. Unlocked only when holding all `requiredItems`. Players deploy collected items for true damage and shielding. **Must not drop items.** |

---

## 5. Hex Node Schema Field Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | **Yes** | Globally unique identifier for the node within the campaign. |
| `title` | `string` | **Yes** | Display name shown on the map tray, drawer, and HUD. |
| `type` | `HexNodeType` | **Yes** | One of `capital`, `reading_sanctuary`, `archive_spire`, `simulation_nexus`, `concept_monolith`, `observatory_gallery`, `quiz_encounter`, `reflection_decryption`, `tradeoff_workshop`, `boss_lair`. |
| `unlockedBy` / `dependsOn` / `parentId` | `string[]` / `string` | No | Prerequisite node IDs required to unlock this node. Flow connections and adjacency are derived directly from these dependencies. |
| `status` | `enum` | No | Initial state: `'unlocked'` (capital/initial nodes) or `'locked'` (default). |
| `sectionRef` | `string` | No | Section name: the OpenUI file `public/content/<topicId>/sections/<sectionRef>.oui`. |
| `description` | `string` | No | Lore and tactical guidance displayed in `<NodeInspectorTray>`. |
| `monster` | `MonsterData` | Required for `quiz_encounter` & `boss_lair` | `{ id, name, type, maxHp, damage, icon }`. |
| `rewards` | `ItemReward[]` | Optional | Key items dropped upon completion (`[{ id, name, icon, description }]`). Permitted on **any node type except `capital` and `boss_lair`**. |
| `requiredItems` | `string[]` | Required for `boss_lair` | Array of item IDs required to unlock and confront the boss. |
| `healingAmount` | `number` | Optional (default: 40) | Base HP restoration for safe havens. |
| `tradeoffMapping` | `Record<string, string>` | Optional | Custom metric-to-stat mapping for `tradeoff_workshop`. |

---

## 6. Tier 3 Validation & Solvability Rules

The **Validation Gateway** (`validateHexCampaign` in `src/core/learning-engine/validation/gateway.ts`, run over every map by `scripts/validate-hexmaps.ts`) automatically enforces strict validation:

1. **Capital Presence:** Every campaign manifest must declare at least one starting node with `type: "capital"`.
2. **Node ID Uniqueness:** Every node ID must be globally unique within the campaign.
3. **Boss Solvability & Key Item Invariants:**
   - Every item ID declared in `boss_lair.requiredItems` **must be dropped by a prerequisite node** in the campaign.
   - Every key item reward dropped by any hex node **must be required by the climax `boss_lair` encounter** (no orphan/useless items).
   - Key items reflect mandatory core knowledge milestones for that topic.
   - A `boss_lair` node **must not declare item rewards** (`rewards: []`), as it represents the campaign victory terminus.
   - `capital` nodes **must not declare item rewards**.
4. **Section Reference Integrity:**
   - Every `sectionRef` declared on a node must resolve to an existing section file `public/content/<topicId>/sections/<sectionRef>.oui`.
5. **Section Reference Uniqueness:**
   - Every node in a campaign manifest must reference a **unique** `sectionRef` (no duplicate encounters or duplicated sanctuaries across distinct map nodes). Climax `boss_lair` encounters can omit `sectionRef` to avoid duplicating preceding quiz encounters.
6. **Full Topic Section Coverage:**
   - Every section file in `public/content/<topicId>/sections/` must be mapped to at least one campaign node on the hex map, ensuring complete curriculum coverage.
7. **Prerequisite Assessment Grounding (Zero Ungrounded Content):**
   - Every `quiz_encounter` and `reflection_decryption` node must test strictly the content taught in its prerequisite sanctuary/interactive node. Never add questions or timeline items testing facts not explicitly covered in the prerequisite content.

---

## 7. Verifying Campaign Maps

To validate every Hex Map campaign against its topic's OpenUI sections, run:

```bash
npm run hexmap:validate
npm run typecheck
npm run test
```
