---
id: US-22
title: "Inspector Sidebar Layout & Aggregate Dropdown Selector"
type: AFK
dependencies: ["US-20"]
e2eInfra: ["Playwright"]
---

# US-22: Inspector Sidebar Layout & Aggregate Dropdown Selector

## What to build

Implement the Inspector Sidebar layout on the right side of the flowchart in fullscreen mode. When on screen widths `< 768px`, the sidebar should render as an overlay bottom sheet drawer. In the "States" lifecycle tab, replace the automatic selection of the first aggregate with a select dropdown listing all aggregates/entities that define a `stateMachine`, allowing the user to select which aggregate's state transitions are visualized.

## Acceptance criteria

- [ ] `InspectorSidebar` renders on the right side of the screen when `isFullscreen` and `isSidebarOpen` are true
- [ ] On mobile/tablet screens (`< 768px`), the sidebar displays as a responsive slide-up bottom sheet or full-width overlay drawer
- [ ] The "States" tab displays a dropdown selector listing all aggregates/entities containing a `stateMachine` definition
- [ ] Selecting an aggregate from the dropdown displays its respective state machine widget and syncs the active state indicator
- [ ] Selecting/clicking a node that has a state machine in the flowchart automatically updates the dropdown selection to match
- [ ] All unit and E2E tests pass
