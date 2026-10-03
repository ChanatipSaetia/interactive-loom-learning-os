# Issue 2: Hex Map Campaign Schema, Ingestion & 3-Tier Validation Gateway Integration

**Type:** `AFK`
**Status:** Ready for Implementation

## What to build

Define the Zod `HexCampaignSchema` for declarative tabletop hex maps with optional `tradeoffMapping` per workshop node. Register Hex Map validation in `ValidationGatewayContext` across Tier 1 (YAML syntax), Tier 2 (Zod structure), and Tier 3 (semantic reference integrity: axial coordinate uniqueness, capital connectivity, boss solvability, and section-ref existence checks). Update storage delivery ports to read `public/hexmaps/<topicId>.yaml`.

## Acceptance criteria

- [ ] Define `HexCampaignSchema` in `src/core/generic/hex-map/schema.ts` supporting axial `(q, r)` coordinates, monster data, item rewards, required boss items, and optional `tradeoffMapping`.
- [ ] Integrate Tier 2 structural checking and Tier 3 semantic reference checks for Hex Maps inside `src/core/learning-engine/validation/`.
- [ ] Update `OKFStoragePort` and `InRepoStorageAdapter` to support `readHexMap(topicId)`.
- [ ] Ensure non-blocking validation results with `lastValidData` fallbacks on YAML warnings.
- [ ] Unit tests for valid maps, unresolvable section references, duplicate coordinates, and unachievable boss item dependencies.
- [ ] `npm run typecheck` and `npm run test` pass.

## Blocked by

- None - can start immediately.
