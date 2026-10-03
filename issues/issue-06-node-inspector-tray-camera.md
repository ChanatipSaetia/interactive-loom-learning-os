# Issue 6: Interactive Node Inspector Tray & Smooth Canvas Camera Navigation

## What to build
Provide smooth camera pan/zoom on `HexGridCanvas` when clicking tiles, and implement a sleek, glassmorphic `<NodeInspectorTray>` component at the bottom of the gamification viewport. It displays the selected node's title, type badge, monster info, prerequisite unlock conditions (with runic encryption for locked nodes), and an animated 'Enter Encounter' launch action.

## Acceptance criteria
- [ ] Clicking a hex tile smoothly centers the canvas view on that tile coordinates.
- [ ] `<NodeInspectorTray>` renders at the bottom/side with node title, type badge, description, and monster preview.
- [ ] Locked nodes display prerequisite checklist and rune-encrypted names.
- [ ] Unlocked nodes render active 'Enter Encounter' action button with clear visual feedback.
- [ ] Unit tests verify camera coordinate calculations and tray state transitions.

## Blocked by
- None (Builds directly on `useGamification` and `HexGridCanvas`).
