# Project: Interactive Loom Learning OS

## Overview

Interactive learning platform with animated SVG diagrams, drag-and-drop exercises, and progressive step-by-step content. Built with React, Vite, and anime.js. UI follows Cohere design system.

## User Stories

- **US-1**: As a developer, I can initialize the Vite + React project with Cohere-inspired design system and shell layout
- **US-2**: As a developer, I can use a section registry pattern and `useAnimation` hook for pluggable animated sections
- **US-3**: As a learner, I can browse all topics in a searchable, filterable table on the overview page
- **US-4**: As a learner, I can view animated SVG architecture diagrams with play/pause/step controls
- **US-5**: As a learner, I can watch animated data flow visualizations showing how data moves through systems
- **US-6**: As a learner, I can step through progressive content with next/prev controls
- **US-7**: As a learner, I can interact with drag-and-drop exercises for categorization
- **US-8**: As a learner, I can select and compare design choices with pros and cons
- **US-9**: As a learner, I can read text explanations with proper typography
- **US-10**: As a learner, I can view bullet and numbered lists with optional checkable items
- **US-11**: As a learner, I can explore a complete demo topic comparing REST API vs WebSocket

## Technical Constraints

- TypeScript + Node.js
- React 18 + React Router
- Vite build tool
- anime.js v4 for animations
- Shadcn UI for tables
- Recharts for graphs (future)
- Playwright for E2E tests
- Cohere design system (DESIGN.md)

## Acceptance Criteria Summary

- [ ] US-1: Vite project builds, React Router works, sidebar renders, Cohere CSS variables defined
- [ ] US-2: SectionRegistry, useAnimation hook, routes.ts all functional with tests
- [ ] US-3: Overview page with searchable, filterable, paginated, sortable topic table
- [ ] US-4: SVG architecture diagrams animate with play/pause/step controls
- [ ] US-5: Data flow particles animate along SVG paths with step mode
- [ ] US-6: Step-by-step content reveals with next/prev and progress indicator
- [ ] US-7: Drag-and-drop exercises validate with visual feedback
- [ ] US-8: Choice cards show pros/cons with selection state
- [ ] US-9: Text section renders prose with Cohere typography
- [ ] US-10: Bullet/numbered lists render with optional stagger animation
- [ ] US-11: Demo topic composes all sections, covers REST vs WebSocket comparison
