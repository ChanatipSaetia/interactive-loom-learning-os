# Handoff: Remove `collapsedTo` — per-step actor/system instances in Event Storming

Date: 2026-08-16
From: session on "revisiting how flow graph renders on each view" (flowchart subdomain)
To: next agent implementing the redesign

---

## 1. The task (user's design decision)

The user wants to change how the unified flowchart (`process-simulation` subdomain)
duplicates actors/systems across steps:

1. **Remove the `collapsedTo` concept entirely** from the flowchart pipeline
   (types, Zod schema, reader, derive, view derivations, Tier-3 validation,
   highlight/click logic, inspector, YAML content, docs).
2. **EVENT_STORMING: per-step instances.** Whenever an **actor or system** is used
   in a step, its node must always render right next to that step's chain.
   If a system/actor is used in N steps → **N node instances** (one per step).
3. **Duplication must not change the visible name** — only the entity ID differs
   (e.g. `engine`, `engine2`, `engine3` all display "Engine"). Today `derive.ts`
   suffixes the title (`title: `${canonical.title} ${count}``) — remove that.

## 2. Validation already done (context for why)

Before the redesign decision, two invariants were validated across all **16
flowchart sections** in `public/okf/`. The one-off test is archived at
`working/tmp-flow-invariants.test.ts` (copy it into `tests/unit/` and run
`npx vitest run tests/unit/tmp-flow-invariants.test.ts` to re-run; it currently
FAILS by design — see results).

Sections scanned: bg3-four-element-monk/flowcast-flow, demo/flowchart,
demo/flowchart-feedback, fried-durian/flowchart, gamification/reward-loop,
haystack/flowchart-indexing, haystack/flowchart-query, hexagonal-architecture/flowchart,
motorcycle/flowchart-{brake,choke,engine,fuel-injection}, mtls/flowchart-handshake,
pm-and-meetings/flowchart, poe2-flicker-monk/flowchart,
poe2-witchhunter-poison-bleed/combat-flow.

**Invariant 1 — every actor & system attached to at least one step:**
16 raw failures, ALL of them the collapsedTo canonical pattern: the canonical
system is declared in `systems.yaml` but is only referenced via its declared
duplicates (entries carrying `collapsedTo`). Affected:
- bg3: `ki_pool`
- gamification: `lesson_engine`, `grading_service`, `reward_engine`, `progress_store`,
  `streak_tracker`, `league_service`, `push_service`
- mtls: `client`, `server`, `tls_stack`
- pm-and-meetings: `slack_channel`
- poe2-flicker-monk: `heralds`
- poe2-witchhunter: `gas_grenade`, `barrage`, `dot_system`

→ After the redesign (every instance is step-referenced directly) this invariant
becomes trivially satisfiable; the Tier-3 fallback in `validation.ts:247-256`
(canonical connected via duplicate) can be deleted.

**Invariant 2 — every command handled by an Aggregate/External system:**
ONE topic has real violations — `pm-and-meetings/flowchart` (4 commands
handledBy **actor** IDs instead of systems):
- step `daily_execution` → `dev`
- branch `branch_blocked` → `dev_blocked`
- step `resolve_blocker` → `pm_resolver`
- step `review_cycle` → `dev_retro`
(all four are declared in that topic's `actors.yaml`; the other 3 steps correctly
use `backlog`, `backlog_plan`, `slack_async`.)
→ Content fix needed, OR the user may accept human-handled commands as an
exception — **ask the user**.

## 3. Current mechanics (what exists today)

Raw content per section: `public/okf/<topic>/sections/<section>/{actors,systems,steps,journeys}.yaml`
+ `section.md` (frontmatter `type: flowchart`). `steps.yaml` may be an array or a
`{ steps: [...] }` wrapper (reader unwraps both — see `reader.ts` ~L403-408;
hexagonal-architecture uses the wrapper).

Pipeline: `reader.ts` (YAML → raw flow) → `deriveSchema()` in
`src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/derive.ts`
(raw flow → `UnifiedFlowchartSchema` {entities, relations, journeys}) →
`autoDeriveViews()` in `.../flowchart/derivations/index.ts` (laid-out
EVENT_STORMING + derived SYS_ARCH / SWIMLANES / SEQUENCE / DATA_FLOW /
STATE_MACHINE views) → rendering in `.../flowchart/views/` (`index.tsx` shared SVG
canvas + edge routing, `standard-view.tsx`, `sequence-view.tsx`) with the
orchestrator at `.../flowchart/index.tsx` (playback, highlights, node click,
inspector).

Duplication today (`derive.ts` `getSystemEntityId`, L135-161):
- **Systems only** (via `handledBy` / `delegatesTo`). First use returns the
  canonical ID; use n>1 creates `${sysId}${n-1}` with `collapsedTo: sysId` and
  title `${title} ${count}`.
- **Actors are NOT duplicated** — `initiatedBy` always resolves to the single
  canonical actor (Phase 1, L37-45). The new design must also duplicate actors
  per step (user said "actors and systems").
- Collapsed views (SYS_ARCH, SWIMLANES, SEQUENCE, DATA_FLOW) merge duplicates
  back into one node via `getCollapsedId = id => entities[id]?.collapsedTo || id`
  (call sites: `derivations/index.ts:92`, `derivations/utils.ts:70`
  (deriveRelations), `derivations/sys-arch.ts:201`, `derivations/swimlanes.ts:100`).
- Highlight resolution (`flowchart/index.tsx:119-132`) expands an active
  duplicate's `collapsedTo` target so the shared canonical lights up in collapsed
  views; node click (L321-380) merges duplicate+canonical entities for the
  popup/inspector; `inspector/index.tsx:143-144` resolves the canonical.
- STATE_MACHINE subject resolution (`index.tsx` ~L246-256) picks the non-`_state_`
  node in the STATE_MACHINE view; state machines live on canonical entities
  (`stateMachine` in systems.yaml). If the first use keeps the canonical ID, this
  keeps working.

## 4. Open questions — confirm with the user before/while implementing

1. **Dup counting semantics.** "has 3 steps using them → dup 3 times": does 3
   uses mean **3 instances total** (first use keeps canonical ID `engine`, then
   `engine2`, `engine3`) or canonical + 3 extra duplicates (4 nodes)? Current
   behavior is the former; recommend keeping it.
2. **Collapsed-view dedupe replacement.** Without `collapsedTo`, SYS_ARCH /
   SWIMLANES / SEQUENCE / DATA_FLOW need another way to merge per-step instances
   into one node. Options:
   (a) **ID suffix convention** — derive owns the suffix format, derivations
   reverse-map with `^(.+)\d+$` (`engine3 → engine`). Cheapest, but see risk ⚠️.
   (b) **Dedupe by title+type** — titles are now guaranteed identical by
   requirement 3, so group instances by (title, type).
   ⚠️ **Risk with (a):** declared duplicates in content don't all follow the
   `base + digits` pattern, e.g. gamification declares `lesson_hint`/
   `lesson_continue` → `lesson_engine`, pm-and-meetings `backlog_plan` →
   `backlog`, `slack_async` → `slack_channel`. Either normalize those content IDs
   to `baseN` form, or prefer (b). This is the main design risk of the whole
   change — decide deliberately.
3. **pm-and-meetings** (Invariant-2 violations): fix content so those 4 commands
   are handled by systems, or allow actor-handled commands as an exception?
4. Should the two invariants become **permanent** Tier-3 checks / unit tests
   (the archived one-off test is a good starting point)?

## 5. Blast radius (files to touch)

Code (all under `src/core/learning-engine/`):
- `sub-contexts/process-simulation/components/flowchart/abstract-flow/derive.ts`
  — core change. `getSystemEntityId` L135-161 (title suffix L153, collapsedTo
  L157); Phase 2 L55-56 (preserves user-declared collapsedTo); Phase 1 L37-45
  (actors — add per-step duplication for `initiatedBy`); add a
  `canonicalIdOf(id)` helper for the dedupe replacement.
- `abstract-flow/types.ts:84-85` — `FlowchartEntity.collapsedTo`.
- `components/flowchart/types.ts:213` — `FlowchartEntity.collapsedTo`.
- `sub-contexts/process-simulation/schema.ts:27` — Zod `collapsedTo` optional
  (raw content schema; removing it breaks the 7 YAML files until migrated).
- `composition/okf/reader.ts:254,385,397` — parses `collapsedTo` from
  actors.yaml / systems.yaml.
- `components/flowchart/derivations/index.ts:92`, `derivations/utils.ts:70`,
  `derivations/sys-arch.ts:201`, `derivations/swimlanes.ts:100` — replace
  `getCollapsedId`.
- `components/flowchart/index.tsx` — L119-132 (canonical highlight expansion),
  L321-380 (node-click entity merge for popup/inspector).
- `components/flowchart/inspector/index.tsx:143-144` — canonical resolution.
- `sub-contexts/process-simulation/validation.ts:247-256` — delete the
  collapsedTo fallback in the Tier-3 actor/system→Event connectivity check;
  optionally add the two invariants from §2 as permanent checks.

Content (7 files containing `collapsedTo:` — migrate by dropping the field;
declared dups keep their own IDs, which become the per-step instances):
- `public/okf/bg3-four-element-monk/sections/flowcast-flow/systems.yaml`
- `public/okf/gamification/sections/reward-loop/systems.yaml`
- `public/okf/mtls/sections/flowchart-handshake/systems.yaml`
- `public/okf/pm-and-meetings/sections/flowchart/systems.yaml`
- `public/okf/pm-and-meetings/sections/flowchart/actors.yaml` (actors also use it)
- `public/okf/poe2-flicker-monk/sections/flowchart/systems.yaml`
- `public/okf/poe2-witchhunter-poison-bleed/sections/combat-flow/systems.yaml`

Docs (authoritative — must be realigned, per AGENTS.md conventions):
- `AGENTS.md` — "Working on Topics & Flowcharts": the
  "duplicate AGGREGATE/EXTERNAL/USER ... map back with `collapsedTo`" rule and
  the reference examples (motorcycle `engine`/`engine2..4` are derive-generated,
  fine; the demo `orch_*_ref` / `llm_final` / `dev_user_feedback` example is
  **stale** — no such entities exist in demo content anymore).
- `docs/creating-topics.md` — Event Storming Node and Relation Conventions.
- Check grill logs (`grill-log-*.md`) for collapsedTo references.

## 6. Suggested work order

1. Resolve open questions §4 with the user (grill if needed).
2. Redesign `derive.ts` (per-step instances for systems **and** actors, no title
   suffix, no collapsedTo, `canonicalIdOf` helper).
3. Replace `getCollapsedId` at the 4 derivation call sites with the chosen
   dedupe strategy.
4. Update `index.tsx` highlight/click + `inspector/index.tsx`.
5. Remove the field: schema.ts, types (×2), reader.ts.
6. Update validation.ts; promote the two invariants to permanent checks (see
   `working/tmp-flow-invariants.test.ts` — note its CHECK 1 must be reworked:
   post-redesign every instance is step-referenced, and CHECK 2 should stay as a
   content guard).
7. Migrate the 7 YAML files; fix pm-and-meetings per §4.3.
8. Update docs (AGENTS.md, docs/creating-topics.md).
9. Verify: `npm run typecheck`, `npm run test`, `npm run lint`, then Playwright
   MCP E2E on the dev server (`npm run dev`, `http://localhost:5173`, per
   AGENTS.md) — check: EVENT_STORMING shows one instance per step with
   **identical** titles; collapsed views (SYS_ARCH/SWIMLANES/DATA_FLOW/SEQUENCE)
   still render a single node per system; playback highlight + node-click popup +
   inspector work across views; STATE_MACHINE view unaffected.

## 7. Notes / gotchas

- The archived test uses `import * as yaml from 'js-yaml'` (v5 namespace import —
  default import breaks, see reader.ts usage).
- `steps.yaml` dual format (array vs `{steps: []}`) — mirror reader.ts unwrapping.
- Derived command IDs are `cmd_<stepId>` / `cmd_<branchId>`; events `evt_<id>`;
  policies `pol_<id>` — useful for the invariant checks.
- `docs/` and root grill logs are declared single-sources-of-truth in AGENTS.md;
  update them in the same change, not later.
- Do NOT commit unless explicitly asked.

## 8. Suggested skills

- `grill-me` / `grill-with-docs` — to lock the §4 decisions (especially the
  dedupe strategy) before touching code.
- `code-review` — after implementation.
- E2E: use Playwright MCP tools directly (per AGENTS.md), not a skill.
