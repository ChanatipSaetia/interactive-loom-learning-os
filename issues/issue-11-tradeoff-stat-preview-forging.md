# Issue 11: Trade-off Live Stat Preview Bar & 1-Click Artifact Forging (`<TradeoffStatPreviewBar>`)

## What to build
Build a reactive HUD bar docked above `TradeoffSandboxSection` in `<EncounterDrawer>`. Live-translates scenario metric adjustments into RPG stat badges (`+12% Armor`, `-8% Evasion Vulnerability`) using `synthesizeTradeoffArtifact`, and provides a 1-click '⚒️ Forge Artifact' action button to equip the synthesized buff for the active topic campaign.

## Acceptance criteria
- [ ] Slider changes in `TradeoffSandboxSection` immediately update the live RPG buff/vulnerability badges.
- [ ] 'Forge Artifact' button calls `portApplyCraftedBuff` and marks the workshop hex as cleared.
- [ ] Visual tooltip displays mathematical metric-to-RPG formula breakdown.
- [ ] Unit tests verify real-time reactivity and buff equipment.

## Blocked by
- Issue 7 (Docked Encounter Drawer Viewport Framework)
