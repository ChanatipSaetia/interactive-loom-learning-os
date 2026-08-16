# 1. Gamification Subdomain & Hex-Map Architecture

- **Date**: 2026-08-15
- **Status**: Accepted

## Context

To improve learner engagement, motivation, and spaced review retention across technical topics in the Interactive Loom Learning OS, we are introducing a gamified tabletop campaign system. Learners navigate a hexagonal map, protect cities from monster invasions, complete section challenges, tune trade-off attributes, and defeat topic bosses.

## Decision

We decide to implement Gamification using the following architectural boundaries:

1. **Hybrid Subdomain Model**:
   - **Supporting Subdomain (`gamification-campaign`)**: Manages campaign orchestration, global character stats, per-topic campaign state, turn decay, and inventory.
   - **Core Section Sub-Context (`hex-map`)**: Defines the `hex-map` OKF section Zod schema, editor form specs, and tabletop React renderer.

2. **Decoupled Dual-Tier State Management**:
   - **`GlobalCharacterState`**: Persistent cross-topic profile tracking learner Level, cumulative EXP, earned Badges, base Attribute Points (Armor, Evasion, Intelligence), and unlocked perks.
   - **`TopicCampaignState`**: Ephemeral per-topic state tracking current HP, temporary stat buffs, collected key items, hex clearance statuses, turn counts, and local threat decay.

3. **Explicit Hex Grid Coordinate Schema (`hex-map`)**:
   - Uses axial coordinates `(q, r)` on a 2D tabletop grid.
   - Classifies hex nodes into structural types: `capital`, `reading_sanctuary`, `quiz_encounter`, `reflection_decryption`, `tradeoff_workshop`, and `boss_lair`.

4. **Tier 3 Solvability & Reachability Validation**:
   - `validateGamificationTier3()` enforces axial coordinate uniqueness, section file reference resolution against `index.yaml`, boss item reachability (map solvability), and hex graph adjacency connectivity back to the capital hex.

## Consequences

### Positive
- Strict isolation between cross-topic learner progression and ephemeral topic campaigns.
- Deterministic, author-controlled tabletop map layout with Zod schema validation.
- Early detection of unwinnable maps or broken section links via Tier 3 Validation.

### Negative / Trade-offs
- Core section components query passive character traits via the `useGamification()` context hook.
- Content authors must explicitly specify axial grid coordinates for hex map nodes.
