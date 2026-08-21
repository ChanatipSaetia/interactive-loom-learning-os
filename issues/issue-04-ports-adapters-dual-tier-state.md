# Issue 4: Hexagonal Ports, Adapters & Dual-Tier State Persistence

**Type:** `AFK`
**Status:** Ready for Implementation
**Source:** grill-log-gamification.md (Q1, Q3, Implied Story 4)

## What to build

Implement the hexagonal ports and adapters for Gamification:
1. **`HexCampaignSourcePort`**: Outbound driven port implemented by `ValidationGatewayCampaignAdapter`, loading verified campaigns from the Validation Gateway.
2. **`CharacterStatePort`**: Outbound driven port implemented by `LocalStorageCharacterAdapter` and `MemoryCharacterAdapter`, managing dual-tier persistence:
   - Global Profile: `loom_gamification_global_profile` (level, EXP, permanent attribute points, badges).
   - Topic Campaign State: `loom_gamification_campaign_<topicId>` (current HP, inventory, cleared hexes, active buffs, chaos level).
3. **`GamificationRuntimePort`**: Inbound driving port / React hook (`useGamification`) orchestrating actions and state updates.

## Acceptance criteria

- [ ] Define port interfaces `HexCampaignSourcePort`, `CharacterStatePort`, and `GamificationRuntimePort`.
- [ ] Implement `ValidationGatewayCampaignAdapter` connecting to `ValidationGatewayContext`.
- [ ] Implement `LocalStorageCharacterAdapter` managing dual-tier persistence with campaign reset capability.
- [ ] Implement `useGamification(topicId)` hook exposing state, action triggers, and campaign reload.
- [ ] Unit tests for persistence adapters, campaign resets, and state transitions.
- [ ] `npm run typecheck` and `npm run test` pass.

## Blocked by

- Issue 2: Hex Map Campaign Schema, Ingestion & 3-Tier Validation Gateway Integration
- Issue 3: Gamification Domain Engine (Rules, Buff/Vulnerability Synthesis & Time-Decay Healing)
