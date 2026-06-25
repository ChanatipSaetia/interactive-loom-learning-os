---
id: US-19
title: "Clean up ERD references and glossary"
type: AFK
dependencies: ["US-18"]
e2eInfra: ["Playwright"]
---

# US-19: Clean up ERD references and glossary

## What to build

Clean up and simplify the inspection widgets by removing the ERD (Entity-Relationship Diagram) database schema features completely from the codebase and glossary.

## Acceptance criteria

- [ ] `erd-schema-widget.tsx` file is deleted from the codebase
- [ ] Imports and references to `ERDSchemaWidget` are removed from `flowchart-view.tsx` and `inspector/index.tsx`
- [ ] The `erd` tab is removed from the `InspectorSidebar` rendering and tabs definition
- [ ] Glossary references to ERD / Database Schema details are removed from `CONTEXT.md`
- [ ] Unit tests for `ERDSchemaWidget` are removed or disabled from `tests/unit/sections/flowchart/inspector/index.test.tsx`
- [ ] All unit and E2E tests pass
