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

## Phase 4 — presentation and learner evidence

Reused existing section events, event log, memory provider, progress notes and learner-controlled Pick/Ask entry points. Navigation/exploration normalize to `seen` without retaining slider values or free text. A bounded UI-local throttle limits repeated engagement, never assessment attempts. Runtime event checks require timestamps and answer evidence. Checkpoints retain prior fields and add explicit assessment evidence with `mastery: not-inferred`.

Verification: 76 progress, checkpoint, MCP and pick-anchor tests passed. Fixed the pick-anchor test's race by waiting for graph item anchors after measured rendering. Existing MCP host check now completes with system Chromium and expanded navigation controls; it exercises Present, voice, Read, broken-topic repair, Viewer handoff, memory, progress save, Pick, touch, themes and library flows. The runner's recorded observations will gain explicit assertions in Phase 6.

## Phase 5 — durable continuity and security boundary

Reused existing Drive layout/progress-note workflow and event merge/checkpoint derivation. Added an opt-in request-scoped repository over an explicitly atomic durable `LearningRecordPort`, with versioned OUI/provenance/event records. Verified auth middleware supplies identity/scopes; MCP schemas have no learnerId. Conditional read/write tools enforce scope, topic boundaries, expected versions, atomic compare-and-swap, deduplication and event-ID conflict rejection. Public Worker still has no storage tools or authentication claims.

Verification: 25 MCP, Worker and synthetic two-client continuity tests passed. ChatGPT and another client are test client names, not live external assistants. No real durable provider or auth middleware is configured in this environment; integration requires a backend implementing atomic CAS (or an authorized Drive connector revision API). Existing Drive handoff works without this adapter. No production storage deployment or live multi-assistant continuity is claimed.

## Phase 6 — reproducible evaluation and verification

Plan: use fixed synthetic fixtures outside the Worker; assert real compilation/render/answer/repair behavior; measure context variants without inventing tokens or model-quality scores; run two-client storage handoff independently; make browser checks fail on incorrect behavior; add PR CI without deploying.

Added `npm run evaluate:offline`, fixed create/edit/validate/continue fixtures, actual Viewer quiz rendering and answer recording, provenance/coverage/narration assertions, dependency recall and payload/latency report, and separate two-client MCP continuity tests. Initial run passed 4 tests: guide characters full 126907, section-filtered 33820, dependency-aware 926; dependency recall 1.0; context 719 characters; one targeted repair. Latency is a single local observation, not production performance. Tokens, external models, source truth and human judgment are explicitly unobserved/not run.

The MCP runner now asserts behavior and writes a result artifact. It exposed stale runner expectations: current documented behavior starts Read inline and preserves Read after exiting full screen. Updated the runner to request full screen explicitly and verify return to Read, rather than change product behavior. Resource/font warnings are retained separately from fatal page errors.

Added non-deploying PR CI for typecheck, full tests, offline evaluation, generated artifacts, Worker/local packaging and MCP Chromium checks. Final verification results follow after all gates finish.

## Runtime audit correction

A real local Wrangler/workerd startup found a failure that bundling and Node request tests missed: the newly reused assistant reference module created an OpenUI library at module load, and that library generates a random ID. Moved spec initialization into request-time signature access. No learner/session state is cached. Added a bundle-import regression that forbids module-scope random, timer and fetch operations, plus `npm run check:worker` to repeat real workerd startup/HTTP checks locally and in CI.

Verified after the fix in actual workerd: public tool discovery, exact QuizQuestion/QuizChoice contracts (926 characters), malformed plan diagnostics, and focused source context all passed. The public Worker exposed neither learner storage nor full compiler tools. Review also tightened read permission for writes that merge existing evidence, rejected cross-topic backend records, used the scanner rather than regex to identify manifest SectionRefs (excluding comments), and marked diagnostic truncation explicitly.

The initial full suite overlapped audit edits and used cached old modules with some new tests; its 11 failed / 2068 passed / 14 skipped result is not a pristine baseline. The subsequent clean full run passed 2096 tests across 200 files with 14 skipped. The final clean rerun after the runtime/boundary corrections is recorded below; no earlier mixed run is used as readiness evidence.
