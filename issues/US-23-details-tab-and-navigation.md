---
id: US-23
title: "Details Tab with Related View Navigation & Camera Focus"
type: AFK
dependencies: ["US-21", "US-22"]
e2eInfra: ["Playwright"]
---

# US-23: Details Tab with Related View Navigation & Camera Focus

## What to build

Add a "Details" tab inside the `InspectorSidebar` to display the selected node's title, description, and related views. Clicking a related view link will switch layout views and automatically trigger the camera zoom/pan engine to center and focus on the selected node in the new layout projection. In fullscreen mode, clicking a node will select it, automatically open the sidebar (if collapsed), and switch the sidebar active tab to "Details".

## Acceptance criteria

- [ ] "Details" tab is added to the `InspectorSidebar` and renders the selected node's title and description
- [ ] List of Related Views is rendered under the Details tab simply (showing only the view name)
- [ ] Clicking a Related View link switches the active flowchart view and automatically focuses the camera on the target node in the newly opened view
- [ ] Clicking a node in fullscreen mode does not open a floating popup. Instead, it selects the node, automatically expands the sidebar (if it was closed), and switches the active sidebar tab to "Details"
- [ ] Journey playback step changes do not automatically re-open the sidebar if it was manually closed by the user
- [ ] All unit and E2E tests pass
