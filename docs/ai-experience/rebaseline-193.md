# Issue 193 rebaseline — 2026-11-05

Baseline: `7d5416ade8b5be07d0e8e6637af5f36b03236eb4` on
`feat/serverless-ai-experience-next`. GitHub compare reports this branch and
`master` identical (0 ahead / 0 behind). PR 192 is already in the ancestry;
PRs 194–196 and the shared planning/library retrieval increment are included.
Issue 193 was read in full, including its product discussion, proposed contracts
and rebaseline. The issue had no comments at inspection. Remote verification used
the GitHub connector because shell fetch could not reach the configured proxy.
GitHub combined commit status and PR-triggered workflow lookup returned no entries; that does not establish CI success.

Paths below are relative to the repository root. Test evidence means existing
test coverage, not deployed-service or external-model validation.

| Experience step / contract | Baseline status | Source evidence | Test evidence | Remaining requirement |
| --- | --- | --- | --- | --- |
| 1. Connection and discovery / C0–1 | Partially implemented | `src/mcp/server.ts`, `composition/oui/capability-catalog.ts`, `mental-model-guide.ts` under `src/core/learning-engine/` | `tests/unit/mcp/server.test.ts`; `tests/unit/core/learning-engine/composition/oui/capability-catalog.test.ts` | Versioned catalog and canonical plan schema exist. Native interaction/presentation limitations lack equal discovery detail; compact index/versioned core deduplication and measured budgets remain. |
| 2. Intent routing / C1 | Implemented instruction contract | `composition/oui/authoring-workflow.ts`, `tutor-skills.ts`, `assistant-prompt.ts`; `docs/ai-experience/workflows.md` | `tests/unit/core/learning-engine/composition/oui/authoring-workflow.test.ts`; `tests/unit/core/supporting/authoring-editor/assistant/workflow-tools.test.ts` | Shared MCP/Studio/files routing and legacy plan adapter already merged. External assistant compliance is unverified; no standalone classifier needed. |
| 3. Learner/topic resolution / C2, C6 | Partially implemented; hosted continuity blocked on integration | `src/core/supporting/learner-progress/memory/checkpoint.ts`, `repository.ts`; conditional registrations in `src/mcp/server.ts` | `tests/unit/mcp/continuity.test.ts`; `tests/unit/core/supporting/learner-progress/memory/checkpoint.test.ts` | Counts and assessment evidence exist; no topic-version/current-section/objective checkpoint. Public Worker installs no authenticated durable provider. Two synthetic clients do not prove live ChatGPT-to-other-client continuity. |
| 4. Relevant source and research / C2–3 | Partially implemented | `src/core/supporting/authoring-editor/assistant/context-graph.ts`, `context.ts`; `composition/oui/source-provenance.ts` | `tests/unit/core/supporting/authoring-editor/assistant/context-graph.test.ts`; `tests/unit/core/learning-engine/composition/oui/source-provenance.test.ts` | Bounded explicit source, transitive closure, namespaces, cycles and stale hashes exist. Truncation has no omitted addresses; plan decisions are absent. Evidence validation checks locators/linkage, not source truth. Research stays in host. |
| 5. Representation, plan and exact OUI / C3–4 | Partially implemented | `composition/oui/topic-plan.ts`, `authoring-guide.ts`, `assistant-prompt.ts`; Studio plan adapter | `tests/unit/core/learning-engine/composition/oui/topic-plan.test.ts`, `authoring-guide.test.ts`, `authoring-workflow.test.ts`; `tests/unit/core/learning-engine/composition/oui/authoring-workflow.test.ts` (Studio adapter) | Runtime Zod, prerequisites, coverage, evidence and library checks exist. Action/rationale survive Studio selection. Observable evidence/presentation strategy and advisory design review remain; no quota is appropriate. |
| 6. Validation and targeted repair / C4 | Partially implemented | `src/mcp/check.ts`, `src/viewer/compileTopic.ts`, `src/core/learning-engine/validation/oui-gateway.ts`, `src/mcp/edit-topic.ts` | `tests/unit/mcp/server.test.ts`, `tests/unit/mcp/section-check.test.ts`; `tests/unit/core/learning-engine/validation/oui-gateway.test.ts` | Shared compiler and narration checks already exist locally/browser; Worker correctly omits full compiler. No comparison of compiled artifacts against explicit plan representations. DOM/mobile layout audit remains missing. |
| 7. Delivery and learner action / C5 | Partially implemented | `src/mcp/server.ts`, `src/mcp-app/McpApp.tsx`, `src/viewer/ViewerApp.tsx`; `src/core/supporting/learner-progress/memory/events.ts` | `tests/unit/mcp/server.test.ts`, `tests/unit/core/supporting/learner-progress/memory.test.ts`, `tests/unit/sections/present/openui.test.tsx`; `tests/mcp-host/check.cjs` | App-aware compact response, opt-in Viewer link, Ask/Pick and engagement throttle exist. Assessments are not throttled; views do not imply mastery. Measured responsive layout/host delivery evidence still needed. |
| 8. Follow-up, portability and evaluation / C5–7 | Partially implemented; real evaluation blocked on external runs | `src/core/supporting/learner-progress/memory/repository.ts`, `checkpoint.ts`; `src/evaluation/metrics.ts`; `tests/evaluation/workflows.test.tsx` | `tests/unit/mcp/continuity.test.ts`, `tests/unit/evaluation/metrics.test.ts`; offline workflow fixture | CAS, identity scoping and replay tests exist. No production storage/auth configured, real model/human study, full selection corpus or total-successful-task token benchmark. Existing synthetic metrics must not be called pedagogical success. |

## Verification

Historical results in `workflows.md` are not current verification. Current runs
and final increment results are recorded below when complete.

- Initial `npm ci` could not reach the proxy. Offline installation using the
  existing cache copied to writable `/tmp/loom-npm-cache` succeeded: 1,111 packages
  (`--ignore-scripts --no-audit --no-fund`). Lockfile unchanged. Default-cache
  attempts failed because that cache was not writable. A subsequent offline
  `npm ci --dry-run` also completed; no new dependency is being introduced.
- Initial checks without installed dependencies failed: `tsc` / `vitest` missing.
  These are setup failures, not code failures. Checks were restarted after install.
- Initial `npm run mcp:check` failed launching Chromium with `setsockopt:
  Operation not permitted` / SIGTRAP under the execution sandbox. No browser
  assertions ran. This is not a passing E2E result. Playwright MCP is unavailable.

- Baseline `npm run typecheck`: passed after installation.
- The first long unit run overlapped implementation edits: its new checkpoint
  test saw a cached pre-change module. That mixed run is not baseline evidence.
  The original commit was archived to `/tmp/loom-baseline-193` and its complete
  suite restarted against immutable sources and the same locked dependencies.

## Selected next increment

Compare actual compiled representations with a supplied plan through the existing
local/browser validation path. Preserve legacy validation responses and keep the
compiler out of the Worker. Report unverified plan alignment explicitly when no
plan is supplied. Extend bounded context truncation with actionable omitted
references and add fixed positive/negative offline alignment cases. Runtime
pedagogy and DOM layout judgments remain separate from these deterministic checks.

## Implemented continuation increment

- `composition/oui/plan-artifact.ts` compares the canonical validated plan with
  Viewer compiler output. Existing local `validate_topic` accepts optional `plan`;
  legacy calls retain exact text responses. Seven focused tests cover legitimate
  prose, representation drift, missing/unplanned sections, topic identity,
  failed compilation and injected checkers without alignment support.
- Context truncation returns bounded omission addresses, a count, and an explicit
  frontier/incomplete-list contract. Nine context tests cover expansion, stale
  hashes, cycles, source budgets and metadata budgets.
- Checkpoints include the last observed section/item with source freshness
  explicitly unverified. Deterministic replay, topic isolation, unknown addresses
  and two-client restoration pass focused tests. No default provider, topic
  revision or objective mastery is invented.
- Full discovery describes learner actions, Present constraints and evidence
  boundaries for all twenty representations. Optional index discovery preserves
  legacy full responses and reports actual injected deployment capabilities.
  The generated catalog was refreshed with the existing generator. Twenty-three
  focused catalog/MCP tests pass.
- Offline evaluation adds ten authored representation cases plus mixed-lesson
  and substitution checks. All seven offline tests pass (including existing
  create/edit/validate/continue and two-client fixtures). Connected prose and
  factual tables are positive cases. A dense table compiles but explicitly has
  no measured layout or teaching-quality score.
- Discovery measurement: index 2,472 characters / 618 estimated tokens; full
  catalog 17,851 characters / 4,463 estimated tokens. Estimates use characters/4,
  not provider billing. This measures discovery only, not a reduction in total
  successful-task cost. Existing fixture guide sizes: full 128,746 characters,
  section-filtered 35,386, component-focused 926; these are synthetic retrieval
  measurements, not evidence of model quality or production latency.

Deferred: browser geometry/layout audit, objective-level checkpoints with verified
topic revisions, optional design context in retrieval, versioned core contract
deduplication, real authenticated provider deployment, and external model/human
learning evaluation. Hosted full compilation remains intentionally unavailable.

## Final verification of this increment

| Check | Current result |
| --- | --- |
| Immutable baseline full suite (`7d5416ad`) | 202 files passed; 2,112 tests passed, 14 skipped |
| Continuation full suite | 203 files passed; 2,126 tests passed, 14 skipped |
| `npm run typecheck` | Passed |
| `npm run build:worker` | Passed; Worker bundle 599.85 kB uncompressed (baseline build: 592.42 kB) |
| `node --test tests/build/worker-runtime.test.mjs tests/build/local-mcp.test.mjs` | Both passed; Node runtime/module-init guard, stateless tool registration and local packaging |
| `npm run evaluate:offline` | 3 files / 7 tests passed; synthetic, no external model or human participants |
| Generated-artifact consistency | Passed using the existing generator through installed `vite-node` with `--check`; `npm run oui:schema` itself could not resolve uncached `tsx` without network |
| `npm run mcp:check` / browser E2E | Blocked: Chromium SIGTRAP / `setsockopt: Operation not permitted` before any assertion; Playwright MCP unavailable |
| Actual workerd / deployed endpoint / live connector continuity | Not run; bundle guards do not establish these |

Existing React test warnings, jsdom canvas/WebGL limitations and Vite chunk-size
warnings remain. They did not fail the completed checks. No dependencies changed,
no Worker compiler/session/LLM orchestration was added, and no deployed storage
or browser layout success is claimed. GitHub publication uses the connector
because shell network access could not reach the configured proxy; each published
commit tree is checked against its local counterpart.
