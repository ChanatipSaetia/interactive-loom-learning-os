# Issue 7: Docked Encounter Drawer Viewport Framework (`<EncounterDrawer>`)

## What to build
Replace the fullscreen PageModal with an expandable, sliding glassmorphic `<EncounterDrawer>`. The hex map canvas remains in the background (dimmed with depth blur), while the drawer slides up from the bottom to render the real OKF Core Sub-Context section component with maximize, minimize, and close actions.

## Acceptance criteria
- [ ] `<EncounterDrawer>` slides up smoothly from bottom over the dimmed background map.
- [ ] Supports maximize to full height, minimize to compact peek bar, and close back to map.
- [ ] Renders real Core Sub-Context section components (`<QuizSection>`, `<TextSection>`, `<ReflectionSequenceSection>`, `<TradeoffSandboxSection>`, `<IntroSection>`).
- [ ] Unit tests verify open/close/minimize state transitions and component mounting.

## Blocked by
- Issue 6 (Interactive Node Inspector Tray & Smooth Canvas Camera Navigation)
