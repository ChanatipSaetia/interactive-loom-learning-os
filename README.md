# Interactive Loom Learning OS

An interactive learning platform with animated flowcharts, trade-off sandboxes, taxonomy browsers, and progressive content. Built with React, Vite, and anime.js. Uses Catppuccin Frappé dark theme with Cohere structural design principles.

## Features

- **Auto-Laid Flowcharts** — Sugiyama-style layout, pan/zoom, node drag, and animated journey playback
- **Tradeoff Sandbox** — Interactive metric dashboards with choice selection and side-by-side comparison
- **Taxonomy Browser** — Card grid with detail modals, scope boundaries, and analogies
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
| `flowchart` | Auto-laid flowchart with pan/zoom and journey playback |
| `tradeoff-sandbox` | Interactive pros/cons comparison with metric dashboard |
| `taxonomy-browser` | Card grid with detail modals and scope boundaries |

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
    data.ts        — raw content (paragraphs, schemas, scenarios, etc.)
    sections.ts    — assembles SectionConfig[] from data
    index.tsx      — React component + TopicRegistry registration
```

### Quick Start

1. **Copy an existing topic** as a starting point (e.g., `src/topics/ai-agent/`)
2. **Define your data** in `data.ts` using the types exported by each section
3. **Compose sections** in `sections.ts` as `SectionConfig[]`
4. **Create `index.tsx`** with `SectionRenderer` and `TopicRegistry.register`
5. **Add a route** in `src/core/routes.ts`
6. **Import in `main.tsx`** to trigger registration

Full guide with examples for every section type: [docs/how-to-create-topics.md](docs/how-to-create-topics.md)

## Project Structure

```
src/
  core/
    registry/          # SectionRegistry (port + adapters)
    hooks/             # useAnimation and shared hooks
    routes.ts          # Topic route configuration
  sections/
    text/              # Markdown prose text
    bullets/           # Hierarchical bullet and numbered lists
    flowchart/         # Auto-laid flowchart with journey playback
    tradeoff-sandbox/  # Interactive trade-off evaluation
    taxonomy-browser/  # Card grid with detail modals
  topics/
    demo/              # Demo topic
    ai-agent/          # AI Agent architecture topic
    ai-operating-model/# AI Operating Model topic
    agentops/          # AgentOps Framework topic
    ai-governance/     # AI Governance topic
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

MIT
