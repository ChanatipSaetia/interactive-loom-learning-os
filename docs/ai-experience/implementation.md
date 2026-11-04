# Issue #193 implementation record

Branch: `feat/serverless-ai-experience-foundations`; existing draft PR #192. No merge.

## Phase 0 — audit and baseline

Inspected all 12 files introduced by the 13 existing commits, canonical OUI library/authoring guide, assistant statement indexing, validation gateway, Viewer compiler, MCP registration/Worker and learner-folder tests. Existing abstractions remain authoritative.

Plan: validate untrusted plans before semantic traversal; test storage-less registration; retain request-scoped Worker transport; make the existing browser runner usable with system Chromium.

Initial commands: `npm ci` passed; `npm run typecheck` passed. Full tests and Worker build started before edits; final results are recorded below when complete. Initial `npm run mcp:check` failed before app execution because the cached Playwright Chromium executable was absent. Runner now accepts `LOOM_CHROMIUM_PATH` or installed system Chromium. A mistaken evaluation-test import edit during audit was reverted after its focused test failed; the original import was correct.

Changes: bounded runtime TopicPlan schema, structured malformed-input diagnostics, updated tool-registration assertions, conditional checkpoint regression, request-scoped Worker handler, Chromium selection. No hosted storage or model orchestration added.

Focused verification: MCP suites and TopicPlan checks: 52 tests passed; evaluation metrics: 2 tests passed after reverting the mistaken import edit. Typecheck rerun pending completion.

GitHub API access is blocked by the environment policy (`api.github.com`, HTTP CONNECT 403). Git fetch and public issue/PR page reads work. The domain addition is saved to the environment draft, not applied; issue/PR updates must be retried after runtime network changes.

## Phase 1 — focused discovery

Reused `componentClosure`/`componentEntries` and canonical mental-model definitions. `get_authoring_guide` accepts optional exact `components`, preserving the existing `sections` and `all` forms. Unknown components are explicit. The existing schema generator now publishes `public/llm/loom-capabilities.json` and indexes it in llms.txt; existing prompt/skill outputs remain synchronized and unchanged. Verification: 17 tests in authoring guide, canonical generated prompt and capability catalog passed. Baseline Worker bundle: 526.49 kB (uncompressed; not a latency measurement).

## Phase 2 — request-scoped context

Extracted shared statement indexing/hash utilities from existing assistant context (existing exports preserved). Added bounded caller-supplied file contracts and transitive dependency retrieval with section references, missing references, cycles, complete-statement output budgets, stale hash rejection, and current-buffer version keys. Hashes are change hints, never authorization or write-concurrency tokens. `get_topic_context` does no I/O and keeps no session state. Validation: 36 context and MCP integration tests passed, including existing assistant context tests.

## Phase 3 — planning, provenance and targeted validation

Reused the Zod contract, canonical section catalog, OUI gateway and narration validator. Evidence records are bounded version-1 plan metadata with revision/locator fields; malformed references, missing/duplicate sources, unknown objectives and credential-bearing URL fields are rejected. This checks declared linkage, not factual truth or source quality. Assistants research with authorized host tools; Loom never retrieves private sources.

Added `validate_section` only when the full checker is injected (local CLI); it returns existing diagnostic tiers plus file, section, line and statement where attributable. Hosted MCP keeps full compilation in the app and does not bundle the compiler. Existing `validate_topic`/`show_topic` behavior remains intact. Focused provenance/plan/section/narration tests: 14 passed. The existing pick-anchor suite passed on a focused rerun after its baseline timing-sensitive concept-map failure.
