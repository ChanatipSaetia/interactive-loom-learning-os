# Gamification Improvement Roadmap

> Backlog of gameplay suggestions for the Hex Campaign Map (`src/core/supporting/gamification/`),
> produced from a code review of `game-rules.ts`, `game-config.ts`, `useGamification.ts`, and
> `BossBattleArena.tsx`. All items are scoped to the existing tech stack
> (React + Vite + PixiJS 8 + pixi-filters + anime.js 4, Catppuccin Frappé).
>
> Logged: 2026-08-27. Visual items 1–3 and 6 were implemented in the same session
> (see "Visual Backlog" for status); gameplay items are **proposals only — not yet implemented**.

---

## Gameplay Backlog

### G1. Boss fight is a no-decision clicker

**Status:** Proposal
**Where:** `game-rules.ts` → `resolveBossItemAction`, `BossBattleArena.tsx`

Items have unlimited uses and any item works at any time. Improve decision density:

- Make key items **consumable with per-fight charges** (e.g., Shield ×2, Blade ×3).
- Add a **boss telegraph**: show the boss's next attack ("HEAVY STRIKE — block or take 2×")
  so choosing Shield vs. Blade is a real tactical read.
- Gate the Phase-2 enrage behind a mechanic: player must Shield the enrage roar or eat
  a big burst of damage.

### G2. Wrong answers are pure punishment

**Status:** Proposal
**Where:** `game-rules.ts` → `resolveCombatTurn`, `useGamification.ts` → `resolveQuizAnswer`

The derived `intelligence` stat (game-rules.ts `deriveStatPercentage`) is computed but
**never used in combat**. Wire it up:

- Wrong answer + intelligence roll → **hint / wrong-option elimination** instead of a hit.
- Intelligence also grants bonus seconds on `reflection_decryption` timers.

### G3. Chaos system is opaque and one-way

**Status:** Proposal
**Where:** `useGamification.ts` → `selectNode`, `game-rules.ts` → sanctuary functions

Chaos only rises (repeat safe-haven visits) and passively decays healing. Give the player
an active lever:

- Spend a **Sanctuary pulse to cleanse Chaos**.
- Or a "purify" choice at the capital between Chaos tiers.
- Turns a hidden penalty into visible resource management.

### G4. Meaningful route choice on the hex DAG

**Status:** Proposal
**Where:** `layout.ts` → `getAutoFlowConnections`, `game-rules.ts` → `evaluateNodeUnlocks`

The DAG auto-unlocks everything linearly. Add **branching paths with trade-offs**:

- E.g., skip a quiz encounter to preserve HP but lose the key item required for the boss lair.
- Makes the map a planning puzzle instead of a straight line.

### G5. Monster variety / traits

**Status:** Proposal
**Where:** `types.ts` → `MonsterData`, `game-rules.ts` → `resolveCombatTurn`

`MonsterData` carries only HP/damage/icon. Add simple traits so quiz encounters and
Tradeoff Workshop gear choices matter situationally:

| Trait | Effect |
|---|---|
| `armored` | Blade/item damage +50%, direct quiz damage −25% |
| `swift` | Player evasion halved |
| `chaotic` | +Chaos on every hit taken |
| `leech` | Heals itself for damage dealt |

### G6. Streak / combo system

**Status:** Proposal
**Where:** `game-rules.ts` → `resolveCombatTurn` (state on `TopicCampaignState`)

Consecutive correct answers multiply XP (and optionally damage); reset on miss.
`turnCount` already exists on campaign state. Cheap to add, adds per-question tension.

### G7. Post-campaign replay loop

**Status:** Proposal
**Where:** `useGamification.ts`, lobby view, `LocalStorageCharacterAdapter`

Badges exist but nothing rewards replaying:

- **NG+**: carry character level into Hard/Nightmare replays; badge count gates entry.
- Lobby **trophy hall** view aggregating `unlockedBadges` across all topics.

---

## Visual Backlog (implemented 2026-08-27)

| # | Item | Status |
|---|---|---|
| V1 | pixi-filters usage: `GlowFilter` on selected/boss hexes, `NoiseFilter` on fog-of-war, red `ColorMap`/vignette chaos tint scaling with `chaosLevel` | Done |
| V2 | Ambient map atmosphere: drifting parallax dust/starfield layer, all dependency arcs shown dim (selected arcs bright) | Done |
| V3 | Persistent hero: idle warrior stands on last cleared node, walks along dependency arcs to the next node instead of sliding in from the left | Done |
| V4 | Combat juice in `BossBattleArena` (screen shake, floating damage numbers, ghost HP bar) — anime.js | Not started |
| V5 | HUD feedback: pulsing vignette at low HP, fog creep at high chaos | Not started |
| V6 | Victory set-piece: full-screen particle burst + badge reveal fanfare on capital/boss clear | Done |
