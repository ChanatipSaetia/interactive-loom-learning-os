# Ubiquitous Language & Glossary

## Hex Map Context

- **Hex Map Context**: Independent generic bounded context owning campaign map topology — hex nodes, axial coordinates, monsters, item rewards, and boss unlock criteria — as authorable data that is NOT an OKF section type and has no structural dependency on the OKF Content context.
- **HexCampaign**: The Hex Map context's published language for one topic's complete map definition: its hex nodes, axial coordinates, monsters, item rewards, and section references.
- **Hex Node**: A discrete map location on a HexCampaign (Capital, Reading Sanctuary, Quiz Encounter, Reflection Decryption, Trade-off Workshop, or Boss Lair).
- **HexNodeType**: Structural classification of a hex node (`capital`, `reading_sanctuary`, `quiz_encounter`, `reflection_decryption`, `tradeoff_workshop`, `boss_lair`).
- **HexGridCoordinate**: Axial coordinate pair `(q, r)` defining a hex cell's position on a 2D isometric/tabletop map grid.
- **Section Reference**: Cross-context pointer from a hex node to an OKF section (topic + section) whose learning content is played when the node is visited.
- **Hex Map Validation**: Semantic integrity checks owned by the Hex Map context: coordinate uniqueness, hex graph adjacency connectivity back to the capital, boss item reachability (solvability), and section reference resolution against existing OKF sections.

## Gamification Campaign Context

- **Gamification Campaign**: Supporting subdomain runtime that orchestrates character attributes (Armor, Evasion, Intelligence), HP, experience/leveling, temporary buffs, and item inventory while a learner plays a HexCampaign. Consumes HexCampaign as published language from the Hex Map context.
- **Global Character State**: Persistent cross-topic profile containing overall learner level, cumulative EXP, earned badges, total attribute points allocated, and unlocked global perks.
- **Topic Campaign State**: Ephemeral per-topic state tracking current health (HP), temporary stat buffs (from trade-off workshops), collected key items, hex clearance statuses, turn counts, and local threat decay levels.
- **Character Attributes**: Quantitative stats (Armor, Evasion, Intelligence) allocated by learners that passively or actively influence challenge outcomes during quiz and reflection events.
