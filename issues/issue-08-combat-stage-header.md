# Issue 8: Floating Combat Stage Duel Header & Key Item Actions (`<CombatStageHeader>`)

## What to build
Build a floating combat header component docked above `<QuizSection>` and boss battles in `<EncounterDrawer>`. Displays animated Player vs Monster duel avatars, live HP bars, hit markers, evasion dodge floating text, and interactive Key Item triggers (*Adapter Shield* and *Port Blade*) that execute tactical combat actions.

## Acceptance criteria
- [ ] Displays live Player HP and Monster HP bars with animated health transitions.
- [ ] Correct quiz answers trigger enemy attack animations, floating hit numbers, and monster damage.
- [ ] Wrong answers trigger player damage reduction with Armor defense indicators and Evasion dodge notifications.
- [ ] Key items (*Adapter Shield*, *Port Blade*) are clickable and trigger special item abilities against the monster/boss.
- [ ] Unit tests verify combat turn updates and key item execution.

## Blocked by
- Issue 7 (Docked Encounter Drawer Viewport Framework)
