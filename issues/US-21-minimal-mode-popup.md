---
id: US-21
title: "Minimal Mode Node Popup"
type: AFK
dependencies: ["US-20"]
e2eInfra: ["Playwright"]
---

# US-21: Minimal Mode Node Popup

## What to build

Simplify the flowchart node click behavior when not in fullscreen mode (minimal mode). Clicking a node should only show a basic call-to-action message prompting the user to open Fullscreen Mode to view details and lifecycle state, along with a button to toggle Fullscreen Mode.

## Acceptance criteria

- [ ] In minimal mode (`isFullscreen === false`), clicking a node opens a simplified popup on the canvas
- [ ] Minimal popup contains ONLY a call-to-action message: *"Open fullscreen to view details and interactive lifecycle"* and a button that launches Fullscreen Mode
- [ ] No detailed node information (description, related view links, state machines) is rendered on the canvas popup in minimal mode
- [ ] Clicking the toggle fullscreen button in the popup correctly enters Fullscreen Mode
- [ ] All unit and E2E tests pass
