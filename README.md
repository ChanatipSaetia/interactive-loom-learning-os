# Interactive Loom Learning OS

An interactive learning platform with animated SVG diagrams, drag-and-drop exercises, and progressive step-by-step content. Built with React, Vite, and anime.js. UI follows the Cohere design system.

## Features

- **Animated SVG Diagrams** — Architecture flow diagrams and data flow visualizations with play/pause/step controls
- **Step-by-Step Content** — Progressive content reveal with next/prev navigation and progress indicators
- **Drag-and-Drop Exercises** — Interactive categorization exercises with validation and visual feedback
- **Choice Cards** — Compare design choices with pros and cons
- **Typographed Content** — Text explanations and bullet lists styled with the Cohere design system
- **Topic Browser** — Searchable, filterable overview page to discover learning topics

## Tech Stack

- **TypeScript** 5.x
- **React** 18 + React Router
- **Vite** 5.x
- **anime.js** v4 for animations
- **Shadcn UI** for tables and components
- **Playwright** for E2E tests
- **Vitest** for unit tests

## Sections

Pluggable section types registered via `SectionRegistry`:

| Section | Description |
|---|---|
| `architecture-flow` | Animated SVG architecture diagrams |
| `data-flow` | Particle-based data flow along SVG paths |
| `step-by-step` | Progressive content with next/prev controls |
| `drag-drop` | Drag-and-drop categorization exercises |
| `choice` | Design choice comparison cards |
| `text` | Prose with Cohere typography |
| `bullets` | Bullet and numbered lists |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Development

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Lint
npm run lint

# Type check
npm run typecheck
```

## Project Structure

```
src/
  core/
    registry/          # SectionRegistry (port + adapters)
    hooks/             # useAnimation and shared hooks
    routes.ts          # Topic route configuration
  sections/
    architecture-flow/ # Animated architecture diagrams
    data-flow/         # Animated data flow visualizations
    step-by-step/      # Progressive step content
    drag-drop/         # Drag-and-drop exercises
    choice/            # Choice comparison cards
    text/              # Prose text section
    bullets/           # Bullet and numbered lists
  topics/
    demo/              # Demo topic (REST vs WebSocket)
  components/
    layout/            # Sidebar, TopicShell, etc.
    overview/          # Overview page with topic table
  styles/
    variables.css      # Cohere CSS variables
    global.css
tests/
  unit/                # Unit tests (Vitest)
  e2e/                 # E2E tests (Playwright)
```

## Design System

The UI follows the Cohere design system — flat surfaces, white canvas, deep green/navy feature bands, pill CTAs, and restrained typography. See [DESIGN.md](DESIGN.md) for the full design specification.

## License

Private
