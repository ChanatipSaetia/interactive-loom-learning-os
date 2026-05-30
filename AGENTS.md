# Agent Instructions — Interactive Loom Learning OS

## Tech Stack
- TypeScript 5.x
- React 18 + React Router
- Vite 5.x
- anime.js v4 (animations)
- Shadcn UI (tables, components)
- Playwright (E2E tests)
- Vitest (unit tests)

## Design System
- Follow COHERE design from `DESIGN.md`
- CSS variables in `:root` for colors, spacing, radius, typography
- Flat UI, no heavy shadows, thin borders
- White canvas default, dark green/navy for feature bands

## Project Structure
```
src/
  core/
    registry/          # SectionRegistry (port + adapters)
    hooks/             # useAnimation, other shared hooks
    routes.ts          # Topic route configuration
  sections/
    architecture-flow/ # ArchitectureFlow section component
    data-flow/         # DataFlow section component
    step-by-step/      # StepByStep section component
    drag-drop/         # DragDrop section component
    choice/            # Choice section component
    text/              # Text section component
    bullets/           # Bullets section component
  topics/
    demo/              # Demo topic (REST vs WebSocket)
  components/
    layout/            # Sidebar, TopicShell, etc.
    overview/          # Overview page with Shadcn table
  styles/
    variables.css      # Cohere CSS variables
    global.css
tests/
  unit/                # Unit tests (Vitest)
  e2e/                 # E2E tests (Playwright)
```

## Commands
- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run test` — run unit tests (Vitest)
- `npm run test:e2e` — run E2E tests (Playwright)
- `npm run lint` — ESLint check
- `npm run typecheck` — TypeScript type check

## E2E Infrastructure
- Browser: Playwright (Chromium)
- No database or external services needed
- Start: `npx playwright install chromium` (one-time)
- Run: `npm run test:e2e`

## E2E Test Scope
- Tests live in: `tests/e2e/`
- Each story must have at least one E2E test covering the happy path
- E2E tests use real browser, no mocks

## Conventions
- File naming: kebab-case (e.g., `section-registry.ts`)
- Function naming: camelCase (e.g., `createSection()`)
- Type/Component naming: PascalCase (e.g., `ArchitectureFlow`)
- Test file mirrors source (e.g., `src/core/registry/index.ts` → `tests/unit/registry/index.test.ts`)
- Sections register via `SectionRegistry.register(type, component)`
- Topics compose sections via config arrays
- All animations use `useAnimation()` hook

## Gotchas
- anime.js v4 API differs from v3 (use `anime.timeline()` for sequences)
- SVG animations use `stroke-dasharray` trick for edge drawing
- Section registry must be initialized before any section renders
- Lazy-loaded topics need Suspense boundary in TopicShell
- Playwright tests need `npm run dev` running or use `playwright test --headed`

## Obsidian Vault
- Agent has access to Obsidian vault via MCP tools
- Use `obsidian_vault_read`, `obsidian_vault_search`, etc. to reference documentation
- anime.js v4 docs are available only in the Obsidian vault under `animejs-docs/`. Access them via the vault tools (obsidian_vault_read, obsidian_vault_search, etc.); do not fetch them from external web sources.
- Consult the vault for technical references, design notes, or prior learnings

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues for this repo (`ChanatipSaetia/interactive-loom-learning-os`). The `gh` CLI is used to create, list, and update issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Standard label vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
