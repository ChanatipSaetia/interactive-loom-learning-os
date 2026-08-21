# Issue 3: Gamification Domain Engine (Rules, Buff/Vulnerability Synthesis & Time-Decay Healing)

**Type:** `AFK`
**Status:** Ready for Implementation
**Source:** grill-log-gamification.md (Q4, Q5, Q6, Q7, Implied Story 3)

## What to build

Refactor and extend pure domain functions in `src/core/supporting/gamification/game-rules.ts` to implement:
1. **Autonomous Trade-off Buff & Vulnerability Synthesis**: Derives positive tactical buffs from peak metrics and in-game vulnerabilities from sacrificed metrics ($< 45$) using `tradeoffMapping` with mathematical fallback.
2. **Time-Based Sanctuary Healing**: Computes 10s tick-based HP recovery with diminishing return decay per repeat visit.
3. **Timed Reflection Rune Decryption**: Evaluates countdown time limits and transforms ancient runes into plaintext on success.
4. **Combat Turn & Boss Actions**: Turn-based damage/evasion resolution, threat decay math, and consumable key item actions (Adapter Shield, Port Blade).

## Acceptance criteria

- [ ] Implement `synthesizeTradeoffArtifact(scenario, metrics, tradeoffMapping)` in `game-rules.ts`.
- [ ] Implement `calculateSanctuaryTickHealing(activeSeconds, visitCount, chaosLevel)`.
- [ ] Implement `resolveTimedReflectionDecryption(completed, timeRemainingSec, totalTimeSec)`.
- [ ] Implement `resolveBossCombatTurn(playerState, bossMonster, itemAction)`.
- [ ] Comprehensive unit tests covering all rules, edge cases (all metrics balanced, time expiration, death state).
- [ ] Zero React or UI dependencies in `game-rules.ts`.
- [ ] `npm run typecheck` and `npm run test` pass.

## Blocked by

- Issue 1: Core Section Result Contract & Evaluation Interfaces
- Issue 2: Hex Map Campaign Schema, Ingestion & 3-Tier Validation Gateway Integration
