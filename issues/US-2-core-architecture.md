---
id: US-2
title: "Core Architecture + Section Registry"
type: AFK
dependencies: ["US-1"]
e2eInfra: []
---

# US-2: Core Architecture + Section Registry

## What to build

Build the hexagonal core: section registry pattern, `useAnimation` hook, and `routes.ts` configuration for lazy-loaded topic pages.

## Architecture

- **Port:** `SectionInterface` - defines render, animate, interact methods
- **Registry:** `SectionRegistry` class that sections register themselves with
- **Hook:** `useAnimation()` returns `{play, pause, stepNext, stepPrev, goTo, timeline}` for anime.js control
- **Routes:** `routes.ts` array of `{path, component, title, description}` for topic pages
- **Lazy loading:** `React.lazy` + `Suspense` wrapper per topic

## Acceptance criteria

- [ ] SectionRegistry supports register/get/list operations
- [ ] `useAnimation` hook creates anime.js timeline and returns control functions
- [ ] `routes.ts` exports typed route configuration array
- [ ] TopicShell component renders topic from route config with lazy loading
- [ ] Section wrapper component reads section config and renders registered section type
- [ ] Unit tests pass for registry, hook, and route config

## E2E infrastructure required

None. Unit tests sufficient.

## Blocked by

US-1.
