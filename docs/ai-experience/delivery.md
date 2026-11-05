# Loom AI Experience delivery — Issue #193

Implemented on the existing `feat/serverless-ai-experience-foundations` branch and pushed to [draft PR #192](https://github.com/ChanatipSaetia/interactive-loom-learning-os/pull/192). No merge or deployment. PR page still shows Draft. [Issue #193](https://github.com/ChanatipSaetia/interactive-loom-learning-os/issues/193) and PR description updates are blocked by GitHub API network policy; this report is ready to post when access is available.

## Features and modules by phase

| Phase | Implementation and main files | Commits |
| --- | --- | --- |
| 0: audit | Runtime plan validation, registration regressions, storage-less Worker checks, request-scoped transport. `src/mcp/server.ts`, `worker.ts`, `topic-plan.ts`, MCP tests. | [ffc31bce](https://github.com/ChanatipSaetia/interactive-loom-learning-os/commit/ffc31bce) |
| 1: discovery | Exact canonical component retrieval with signature dependencies; legacy section guides retained; generated capability/mental-model catalog. `authoring-guide.ts`, `schema-files.ts`, `public/llm/loom-capabilities.json`, `public/llms.txt`. | [b4c1592d](https://github.com/ChanatipSaetia/interactive-loom-learning-os/commit/b4c1592d) |
| 2: context | Shared scanner/statement indexing; bounded current-source dependency closure, overview, missing-reference/truncation diagnostics and stale version hints. `assistant/statements.ts`, `context.ts`, `context-graph.ts`. | [c71c89c7](https://github.com/ChanatipSaetia/interactive-loom-learning-os/commit/c71c89c7) |
| 3: planning/validation | Bounded runtime schemas, objective coverage, prerequisite cycles, representation/evidence validation; targeted section and narration checks through existing gateway. `source-provenance.ts`, `topic-plan.ts`, `src/mcp/check.ts`, `cli.ts`. | [ec7b2961](https://github.com/ChanatipSaetia/interactive-loom-learning-os/commit/ec7b2961) |
| 4: presentation/progress | Existing show_topic, Viewer, Studio and Ask/Pick preserved; exploration/navigation normalization, bounded UI engagement throttle, event validation and explicit assessment evidence without mastery inference. `memory/events.ts`, `context.tsx`, `checkpoint.ts`. | [74d20b48](https://github.com/ChanatipSaetia/interactive-loom-learning-os/commit/74d20b48) |
| 5: continuity | Existing learner-owned Drive workflow retained; opt-in authenticated repository boundary, strict versioned records, scopes, atomic CAS requirement, stale-write rejection, topic isolation, event deduplication/collision checks. `memory/repository.ts`, `server.ts`, `tests/unit/mcp/continuity.test.ts`. No production provider/auth deployment. | [f3712344](https://github.com/ChanatipSaetia/interactive-loom-learning-os/commit/f3712344) |
| 6: evaluation | Offline create/edit/validate/continue fixtures, actual Viewer render/answer, targeted repair, context measurements, synthetic two-client handoff; asserted Chromium integration runner; non-deploying PR CI. `tests/evaluation/`, `vitest.evaluation.config.ts`, `src/evaluation/metrics.ts`, `tests/mcp-host/check.cjs`, `.github/workflows/ai-experience.yml`. | [d1c7bbb8](https://github.com/ChanatipSaetia/interactive-loom-learning-os/commit/d1c7bbb8) |
| Runtime audit | Fixed module-scope OpenUI random initialization, strengthened read/write boundaries and scanner-based manifest references; added real workerd harness and forbidden-global-operation bundle guard. `assistant-prompt.ts`, `scripts/check-worker-runtime.mjs`, `tests/build/worker-runtime.test.mjs`. | [c7889fad](https://github.com/ChanatipSaetia/interactive-loom-learning-os/commit/c7889fad) |

Detailed implementation decisions and intermediate failures are in [implementation.md](implementation.md); API/permission contracts in [workflows.md](workflows.md); evaluation methodology in [evaluation.md](evaluation.md).

## MCP API and compatibility

Public hosted additions: `get_loom_capabilities`, `validate_topic_plan`, `get_topic_context`. `get_authoring_guide` adds optional `components` and preserves `sections`/`all` behavior. All are deterministic, bounded and request-scoped. No model orchestration, filesystem access, fetched private sources, learner identity argument or session dependency.

Conditional additions: `get_learning_checkpoint` only with existing learner storage; `validate_section` only with an explicitly injected local/browser compiler; `read_learning_record` and `write_learning_record` only with a repository created from verified identity and scopes. They are absent from the public Worker. Existing local topic writes retain their legacy semantics; atomicity applies only to the new record boundary and requires an atomic backend implementation.

Canonical definitions and generated prompts/skills remain synchronized through the existing generator. Existing topic formats and MCP App/Viewer/library workflows remain covered by existing tests and browser checks. Full OUI compilation remains in the browser/local server, outside the hosted free-plan CPU path.

## Final verification

| Check | Result |
| --- | --- |
| `npm ci` | Passed with lockfile unchanged |
| `npm run typecheck` | Passed after final source changes |
| `npm test` | 200 files passed; 2,097 tests passed; 14 skipped |
| `npm run build:worker` | Passed; Worker 583.61 kB uncompressed; site, MCP App and standalone MCP also built |
| `npm run oui:schema -- --check` | Passed |
| `npm run evaluate:offline` | 4 tests passed, including three synthetic two-client continuity tests |
| `node --test tests/build/local-mcp.test.mjs tests/build/worker-runtime.test.mjs` | 5 tests passed |
| `npm run check:worker` | Passed in actual local Cloudflare workerd: startup, stateless tool list, focused signatures, malformed-plan diagnostics, source context |
| `npm run mcp:check` | Passed with `LOOM_WORKER_URL` targeting actual local workerd; asserted local and hosted Chromium flows (Present, voice stand-in, Read, repair, Viewer link, memory, progress, Pick, themes, touch and library) |

No tests requiring an external AI model, human judgment, live OAuth/Drive authorization or real assistant UI were run. No remote CI result or Cloudflare deployment is claimed. Browser resource warnings about unavailable optional resources remain visible in the runner artifact; fatal page errors are asserted separately.

## Synthetic measurements

Fixed quiz fixture: full guide 126,907 characters; section-filtered 33,820; focused dependency-aware component contracts 926. Source context is 719 characters, with 100% recall of the three expected statement dependencies. OUI/narration validate; Viewer actually renders and records an answer; one intentionally invalid statement is repaired and revalidated. Retrieval latency in the final fixture run was about 3.69 ms locally.

These are character counts, not token usage. Focused references omit workflow prose included in full guides; this is a payload comparison, not proof of equal model quality. Declared objective coverage and evidence linkage are complete for the fixture; factual source grounding and learning effectiveness remain unmeasured. Token usage, real model repair rates and production latency are unknown.

## Remaining limitations and actions

- A production authenticated storage provider/middleware is not configured. The public hosted Worker continues to persist nothing. Learner-owned Drive remains the supported default through the assistant's authorized connector; revision/permission guarantees depend on that connector.
- Cross-assistant continuity is verified with separate synthetic MCP clients over an atomic port fixture, not live ChatGPT/other-assistant integrations. Real auth/connector/provider integration needs separate credentials and deployment decisions.
- Evidence validation checks safe locator structure and declared linkage, not truth or sufficiency. Clients must redact secrets/private extracts; arbitrary prose cannot be proven secret-free by a URL validator.
- Full hosted compilation is deliberately unavailable; the browser reports its validation results. No production CPU/latency guarantee is inferred from local fixtures.
- GitHub API requests still fail with `Forbidden` for `api.github.com`; Git fetch/push works. The domain requirement is saved in the environment draft but not applied. Apply it through environment settings to allow issue comments and PR-description updates; this report contains the prepared status update. Draft saves do not themselves apply or publish configuration.
