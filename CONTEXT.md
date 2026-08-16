# Ubiquitous Language & Glossary

## Gamification Subdomain

- **Gamification Campaign**: Supporting subdomain runtime that orchestrates character attributes (Armor, Evasion, Intelligence), hex map states, HP decay, and item inventory across OKF topics.
- **Global Character State**: Persistent cross-topic profile containing overall learner level, cumulative EXP, earned badges, total attribute points allocated, and unlocked global perks.
- **Topic Campaign State**: Ephemeral per-topic state tracking current health (HP), temporary stat buffs (from trade-off workshops), collected key items, hex clearance statuses, turn counts, and local threat decay levels.
- **Hex Map Section (`hex-map`)**: Core OKF section type that enables topic authors to define explicit axial hex coordinates `(q, r)`, city sanctuaries, monster encounters, item rewards, and boss battle unlock criteria in topic YAML manifests.
- **HexGridCoordinate**: Axial coordinate pair `(q, r)` defining a hex cell's position on a 2D isometric/tabletop map grid.
- **HexNodeType**: Structural classification of a hex node (`capital`, `reading_sanctuary`, `quiz_encounter`, `reflection_decryption`, `tradeoff_workshop`, `boss_lair`).
- **Character Attributes**: Quantitative stats (Armor, Evasion, Intelligence) allocated by learners that passively or actively influence challenge outcomes during quiz and reflection events.
- **Hex Node**: A discrete map location representing an OKF section (Reading City, Mission Encounter, Trade-off Workshop, or Boss Lair).
- **Tier 3 Gamification Validation**: Semantic reference integrity verification enforcing coordinate uniqueness, valid `index.yaml` section file resolution, boss item reachability (solvability), and hex graph adjacency connectivity back to the capital hex.
