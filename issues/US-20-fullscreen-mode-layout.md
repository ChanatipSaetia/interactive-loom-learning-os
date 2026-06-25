---
id: US-20
title: "Fullscreen Mode Layout and Toggle Control"
type: AFK
dependencies: ["US-19"]
e2eInfra: ["Playwright"]
---

# US-20: Fullscreen Mode Layout and Toggle Control

## What to build

Implement a CSS-based fullscreen overlay mode for the flowchart section. When active, the flowchart occupies the entire browser viewport with proper dark crust backgrounds, precise containment styling, and fullscreen toggle controls (both enter/exit buttons and Escape key support).

## Acceptance criteria

- [ ] CSS class `.fullscreen` added to the flowchart section to overlay fixed at `100vw` and `100vh` with high z-index
- [ ] Toggle buttons for entering and exiting fullscreen mode are visible and functional in the toolbar/header area
- [ ] Pressing the `Escape` key exits the fullscreen view when active
- [ ] The fullscreen state (`isFullscreen`) is propagated from the parent component down to `FlowchartView`
- [ ] Scrollbars and layout alignment follow Cohere dark design guidelines in both regular and fullscreen views
- [ ] All unit and E2E tests pass
