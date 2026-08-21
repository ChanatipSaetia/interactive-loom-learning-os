# Guideline: How to Create a Hex Campaign Map

This document is the authoritative authoring and technical specification guide for creating Hex Campaign Maps (`public/hexmaps/<topicId>.yaml`) in the **Interactive Loom Learning OS**.

---

## 1. Overview & Mental Model

A **Hex Campaign Map** converts any Open Knowledge Format (OKF) learning topic into an interactive RPG tabletop campaign. Learners navigate a hex grid, complete educational challenges, harvest key items and tactical buffs, rest at sanctuaries, and defeat the topic Boss Lair.

```
                  [ 🏰 Capital ] (Starting Hub)
                        │
       ┌────────────────┴────────────────┐
       ▼                                 ▼
[ 🏛️ Reading Sanctuary ]        [ 👹 Quiz Encounter ]
(Active pulse healing)          (Monster combat -> Key Item 1)
       │                                 │
       ▼                                 ▼
[ ⚒️ Trade-off Workshop ]      [ 🔮 Reflection Decryption ]
(Tactical buff synthesis)       (Runic countdown -> Key Item 2)
       │                                 │
       └────────────────┬────────────────┘
                        ▼
               [ 🐲 Boss Lair ]
       (Requires Key Item 1 + Key Item 2)
```

---

## 2. File Location & Naming

Every campaign map file is stored declaratively under `public/hexmaps/`:

```
public/
├── hexmaps/
│   ├── demo.yaml
│   ├── gamification.yaml
│   ├── pixijs.yaml
│   └── <topic-id>.yaml       # Must match the topic directory in public/okf/<topic-id>/
└── okf/
    └── <topic-id>/
```

---

## 3. Hex Map YAML Manifest Schema

A campaign manifest defines the overall campaign header and an array of `nodes`:

```yaml
topicId: "my-topic"                  # Matches public/okf/<topic-id>/
topicTitle: "Realm of My Topic"      # Display title of the campaign realm
capitalId: "capital"                 # Starting node ID (default: "capital")

nodes:
  - id: "capital"
    title: "Citadel of Knowledge"
    type: "capital"
    status: "unlocked"
    sectionRef: "intro"
    description: "The starting citadel and safe haven of the realm."

  - id: "quiz-outpost"
    title: "Gremlin Outpost"
    type: "quiz_encounter"
    status: "locked"
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
      - id: "key-item-1"
        name: "Aegis of Insight"
        icon: "🛡️"
        description: "A defensive relic required to breach the boss chamber."

  - id: "boss-lair"
    title: "Colossus Lair"
    type: "boss_lair"
    status: "locked"
    sectionRef: "flowchart"
    description: "The final trial of the realm."
    requiredItems:
      - "key-item-1"
    monster:
      id: "boss-colossus"
      name: "Grand Architect Titan"
      type: "boss"
      maxHp: 200
      damage: 35
      icon: "🐲"
```

---

## 4. Hex Node Types & Gameplay Mechanics

Each node in `nodes[]` is classified into one of 6 structural types:

| Type (`type`) | Map Role | Gameplay & Section Binding | Rewards / Config |
|---|---|---|---|
| `capital` | Starting Safe Haven | Starting tile (`status: "unlocked"`). Renders the introductory OKF section (e.g. `intro`). | Generates 0 System Chaos on first visit. |
| `reading_sanctuary` | Healing & Theory Haven | Renders dense reading sections (`taxonomy`, `text`, `flashcards`). Features the **Sanctuary 10s Pulse Monitor**: restores HP every 10s of active reading. Pauses automatically at 100% HP. Diminishing returns apply per repeat visit ($1.0\times \rightarrow 0.5\times \rightarrow 0.2\times$). | `healingAmount: 40` (default) |
| `quiz_encounter` | Combat Battle | Renders `quiz` section inside `<CombatStageHeader>`. Correct answers deal player damage to the monster; incorrect answers trigger counterattacks (mitigated by character Armor/Evasion). | `monster: {...}`, `rewards: [{ id, name, icon }]` |
| `reflection_decryption` | Timed Cipher Vault | Renders `reflection-sequence` or `reflection-template` under `<RunicCountdownRing>`. Reassembling the sequence decrypts runic glyphs into plaintext. Expiring the timer inflicts Chaos-amplified damage. | `rewards: [{ id, name, icon }]` |
| `tradeoff_workshop` | Buff Synthesis Forge | Renders `tradeoff-sandbox`. Sliders dynamically synthesize RPG attribute buffs (`+15% Armor`, `+10% Evasion`) via `<TradeoffStatPreviewBar>` with a one-click *"Forge & Equip Artifact"* action. | `tradeoffMapping: { <metricKey>: "<armor|evasion|intelligence|chaos_shield>" }` |
| `boss_lair` | Campaign Climax | The ultimate encounter. Renders dedicated `<BossBattleArena>` requiring key items. Players execute tactical strikes (*Port Blade*, *Adapter Shield*) to defeat the boss and earn Topic Badges. | `requiredItems: ["item-1", "item-2"]`, `monster: {...}`. **Must not drop item rewards.** |

---

## 5. Hex Node Schema Field Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | **Yes** | Globally unique identifier for the node within the campaign. |
| `title` | `string` | **Yes** | Display name shown on the map tray, drawer, and HUD. |
| `type` | `HexNodeType` | **Yes** | One of `capital`, `reading_sanctuary`, `quiz_encounter`, `reflection_decryption`, `tradeoff_workshop`, `boss_lair`. |
| `status` | `enum` | No | Initial state: `'unlocked'` (capital/initial nodes) or `'locked'` (default). |
| `sectionRef` | `string` | No | Matching folder name in `public/okf/<topicId>/sections/<sectionRef>/`. |
| `description` | `string` | No | Lore and tactical guidance displayed in `<NodeInspectorTray>`. |
| `monster` | `MonsterData` | Required for `quiz_encounter` & `boss_lair` | `{ id, name, type, maxHp, damage, icon }`. |
| `rewards` | `ItemReward[]` | Optional | Key items dropped upon node completion (`[{ id, name, icon, description }]`). **Forbidden on `boss_lair`.** |
| `requiredItems` | `string[]` | Required for `boss_lair` | Array of item IDs required to unlock and confront the boss. |
| `healingAmount` | `number` | Optional (default: 40) | Base HP restoration for safe havens. |
| `tradeoffMapping` | `Record<string, string>` | Optional | Custom metric-to-stat mapping for `tradeoff_workshop`. |

---

## 6. Tier 3 Validation & Solvability Rules

The **Validation Gateway** (`src/core/generic/hex-map/validation.ts`) automatically validates campaign manifests during `npx tsx scripts/validate-okf.ts`:

1. **Capital Presence:** Every campaign manifest must declare at least one starting node with `type: "capital"`.
2. **Node ID Uniqueness:** Every node ID must be globally unique within the campaign.
3. **Boss Solvability & Key Item Reachability:**
   - Every item ID declared in `boss_lair.requiredItems` **must be dropped by a prerequisite node** in the campaign.
   - A `boss_lair` node **must not declare item rewards** (`rewards: []`), as it represents the campaign terminus.
4. **Section Reference Integrity:**
   - Every `sectionRef` declared on a node must resolve to a valid existing section directory in `public/okf/<topicId>/sections/<sectionRef>/`.

---

## 7. Verifying Campaign Maps

To validate all OKF topics and Hex Map campaigns in the repository, run:

```bash
npx tsx scripts/validate-okf.ts
```

For JSON diagnostics:

```bash
npx tsx scripts/validate-okf.ts --json
```

For AI prompt fix hints:

```bash
npx tsx scripts/validate-okf.ts --format=prompt
```
