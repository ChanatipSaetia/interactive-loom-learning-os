# Issue 9: Sanctuary 10s Pulse Reading Ring & Floating Healing Particles (`<SanctuaryTickMonitor>`)

## What to build
Build a visual reading feedback widget docked inside `<EncounterDrawer>` during `reading_sanctuary` visits. Features an animated 10s circular progress ring that fills during active reading, triggers floating green `+10 HP` / `Chaos Cleansed` particle animations, and displays visit-decay diminishing returns ($1.0\times \rightarrow 0.5\times \rightarrow 0.2\times$).

## Acceptance criteria
- [ ] Circular 10-second timer smoothly increments during active reading and resets every tick.
- [ ] Triggers floating `+HP` green particle visual effects and updates character health and Chaos level via `portApplySanctuaryTickHeal`.
- [ ] Displays visit count and diminished healing multipliers accurately.
- [ ] Unit tests verify tick interval triggers and decay multiplier calculations.

## Blocked by
- Issue 7 (Docked Encounter Drawer Viewport Framework)
