# Project: Interactive Loom Learning OS

## Overview

Interactive learning platform with animated SVG diagrams, auto-laid flowcharts with journey playback, interactive situation-based choice comparisons, and progressive step-by-step content. Built with React, Vite, and anime.js. UI uses Catppuccin Frappé dark theme with Cohere structural design principles.

## User Stories

- **US-1**: As a developer, I can initialize the Vite + React project with Catppuccin Frappé dark theme and shell layout
- **US-2**: As a developer, I can use a section registry pattern and `useAnimation` hook for pluggable animated sections
- **US-3**: As a learner, I can browse all topics in a searchable, filterable table on the overview page
- **US-4**: As a learner, I can view animated SVG architecture diagrams with play/pause/step controls
- **US-5**: As a learner, I can watch animated data flow visualizations showing how data moves through systems
- **US-6**: As a learner, I can explore interactive flowcharts with auto-layout, pan/zoom, and animated journey playback
- **US-7**: As a learner, I can step through progressive content with next/prev controls
- **US-8**: As a learner, I can compare design choices with pros/cons and see recommended options for different situations
- **US-9**: As a learner, I can read text explanations with Markdown support and proper typography
- **US-10**: As a learner, I can view hierarchical bullet and numbered lists with checkable items

## Technical Constraints

- TypeScript + Node.js
- React 18 + React Router
- Vite build tool
- anime.js v4 for animations
- Catppuccin Frappé color palette (dark theme)
- Shadcn UI for tables
- Playwright for E2E tests
- Cohere structural design principles (DESIGN.md)

## Section Types

| Type | Description |
|---|---|
| `text` | Markdown-rendered paragraphs with optional fade-in animation |
| `bullets` | Hierarchical bullet/numbered lists with checkable items and stagger animation |
| `architecture-flow` | SVG node-edge diagrams with manual positioning and sequential animation |
| `data-flow` | SVG path tracing with stroke-dashoffset animation and particle markers |
| `flowchart` | Auto-laid flowchart with Sugiyama layout, pan/zoom, node drag, and journey playback |
| `step-by-step` | Progressive content pager with prev/next and fade transitions |
| `situation-choice` | Interactive comparison of options per situation with accordion pros/cons |

## Topics

| Topic | Path | Description |
|---|---|---|
| AI Agent Architecture (Demo) | `/demo/ai-agent` | Demo topic covering AI Agent system architecture |
| AI Agent Architecture | `/topics/ai-agent` | Full AI Agent architecture with flowchart journeys |

## Acceptance Criteria Summary

- [x] US-1: Vite project builds, React Router works, sidebar renders, Catppuccin CSS variables defined
- [x] US-2: SectionRegistry, useAnimation hook, routes.ts all functional with tests
- [x] US-3: Overview page with searchable, filterable, paginated, sortable topic table
- [x] US-4: SVG architecture diagrams animate with play/pause/step controls
- [x] US-5: Data flow particles animate along SVG paths with step mode
- [x] US-6: Flowchart auto-layouts nodes, supports pan/zoom, journey playback with particle animation
- [x] US-7: Step-by-step content reveals with next/prev and progress indicator
- [x] US-8: Situation-choice renders accordion with pros/cons, recommended badge, and compare dialog
- [x] US-9: Text section renders Markdown with Cohere typography
- [x] US-10: Bullet/numbered lists render with checkable items and stagger animation
