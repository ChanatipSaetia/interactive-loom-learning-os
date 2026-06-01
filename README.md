# Interactive Loom Learning OS

An interactive learning platform with animated SVG diagrams, auto-laid flowcharts with journey playback, interactive choice comparisons, and progressive step-by-step content. Built with React, Vite, and anime.js. Uses Catppuccin Frappé dark theme with Cohere structural design principles.

## Features

- **Architecture Flow Diagrams** — Animated SVG node-edge diagrams with play/pause/step controls
- **Data Flow Visualizations** — Path tracing with stroke-dashoffset animation and particle markers
- **Interactive Flowcharts** — Sugiyama-style auto-layout, pan/zoom, node drag, and animated journey playback
- **Step-by-Step Content** — Progressive content reveal with next/prev navigation and progress indicators
- **Situation Choice** — Compare design options with pros/cons, recommended badges, and side-by-side comparison
- **Markdown Text** — Full Markdown support (bold, italic, code, links, headings, lists, blockquotes)
- **Hierarchical Lists** — Nested bullet and numbered lists with checkable items and stagger animation

## Tech Stack

- **TypeScript** 5.x
- **React** 18 + React Router
- **Vite** 5.x
- **anime.js** v4 for animations
- **lucide-react** for icons
- **marked** for Markdown parsing
- **Radix UI** for dialog and accordion primitives
- **Playwright** for E2E tests
- **Vitest** for unit tests

## Section Types

Pluggable section types registered via `SectionRegistry`:

| Type | Description |
|---|---|
| `text` | Markdown-rendered paragraphs with optional fade-in |
| `bullets` | Hierarchical bullet/numbered lists with checkable items |
| `architecture-flow` | SVG node-edge diagrams, manual positioning, sequential animation |
| `data-flow` | SVG path tracing with stroke-dashoffset animation |
| `flowchart` | Auto-laid flowchart with pan/zoom and journey playback |
| `step-by-step` | Progressive content with next/prev and fade transitions |
| `situation-choice` | Interactive pros/cons comparison per situation |

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

## Adding a Topic

Each topic is a folder under `src/topics/<your-topic>/` with three files:

```
src/topics/
  <your-topic>/
    data.ts        — raw content (nodes, edges, paragraphs, etc.)
    sections.ts    — assembles SectionConfig[] from data
    index.tsx      — React component + TopicRegistry registration
```

Then register the route in `src/core/routes.ts` and import the topic in `src/main.tsx` so the registration side-effect runs.

Full guide with examples for every section type: [docs/how-to-create-topics.md](docs/how-to-create-topics.md)

### Quick Start

1. **Copy an existing topic** as a starting point (e.g., `src/topics/ai-agent/`)
2. **Define your data** in `data.ts` using the types exported by each section
3. **Compose sections** in `sections.ts` as `SectionConfig[]`
4. **Create `index.tsx`** with `SectionRenderer` and `TopicRegistry.register`
5. **Add a route** in `src/core/routes.ts`
6. **Import in `main.tsx`** to trigger registration

## Project Structure

```
src/
  core/
    registry/          # SectionRegistry (port + adapters)
    hooks/             # useAnimation and shared hooks
    routes.ts          # Topic route configuration
  sections/
    architecture-flow/ # Animated SVG node-edge diagrams
    data-flow/         # Animated path tracing with particles
    flowchart/         # Auto-laid flowchart with journey playback
    step-by-step/      # Progressive step content
    situation-choice/  # Pros/cons comparison per situation
    text/              # Markdown prose text
    bullets/           # Hierarchical bullet and numbered lists
  topics/
    demo/              # Demo topic
    ai-agent/          # AI Agent architecture topic
  components/
    layout/            # Sidebar, TopicShell, etc.
    overview/          # Overview page with topic table
  styles/
    variables.css      # Catppuccin Frappé CSS variables
    global.css         # Global resets and dark theme
tests/
  unit/                # Unit tests (Vitest)
  e2e/                 # E2E tests (Playwright)
```

## Design System

The UI uses the Catppuccin Frappé palette for a dark theme, with Cohere structural design principles: flat surfaces, thin borders, pill CTAs, restrained typography, and generous whitespace. See [DESIGN.md](DESIGN.md) for the full design specification.

## License

Private
