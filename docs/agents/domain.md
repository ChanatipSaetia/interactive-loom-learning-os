# Domain Docs

## Layout

**Single-context.** One `CONTEXT.md` and `docs/adr/` at the repo root.

## Files

- `CONTEXT.md` — Project domain language, architecture overview, and key concepts. Read this before making architectural changes or diagnosing issues.
- `docs/adr/` — Architecture Decision Records. Each ADR is a markdown file named `NNN-short-title.md` (e.g., `001-use-section-registry.md`).

## Consumer rules

- Always read `CONTEXT.md` before proposing architectural changes.
- When making a significant architectural decision, create a new ADR in `docs/adr/`.
- Existing ADRs are informational — they record past decisions and their rationale.
- If `CONTEXT.md` does not exist yet, the project domain context can be inferred from `AGENTS.md`, `DESIGN.md`, and `PRD.md` in the repo root.

## For skills

- `improve-codebase-architecture`: Read `CONTEXT.md` first, then `docs/adr/*.md`.
- `diagnose`: Read `CONTEXT.md` to understand domain language before diagnosing.
- `tdd`: Reference `CONTEXT.md` for domain terminology in test descriptions.
