---
id: US-1
title: "Scaffolding + Shell"
type: AFK
dependencies: []
e2eInfra: ["Playwright"]
---

# US-1: Scaffolding + Shell

## What to build

Initialize the Vite + React + TypeScript project with React Router, Cohere-inspired design system, and a shell layout with sidebar navigation.

## Design System

Follow COHERE design spec from `DESIGN.md`:
- Colors: primary `#17171c`, canvas `#ffffff`, soft-stone `#eeece7`, action-blue `#1863dc`, coral `#ff7759`
- Typography: Inter as fallback font, massive display headlines, restrained body text
- Spacing: 8px base system
- Radius: 8px cards, 32px pill buttons
- Flat UI, no heavy shadows, thin borders

## Acceptance criteria

- [ ] Vite project initializes and builds successfully
- [ ] TypeScript configured with strict mode
- [ ] React Router set up with hash or browser routing
- [ ] Home page loads at `/` with white canvas background
- [ ] Sidebar navigation renders with topic links
- [ ] Cohere CSS variables defined for colors, spacing, radius, typography
- [ ] E2E: Playwright navigates to `/` and finds sidebar with topic links

## E2E infrastructure required

Playwright for UI navigation and rendering tests.

## Blocked by

None.
