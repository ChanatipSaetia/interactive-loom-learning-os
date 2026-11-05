# Issue 193 continuation: remaining workflow implementation

This increment continues draft PR 197 on `feat/serverless-ai-experience-next`.
The user excluded hosted storage/auth deployment and requested provider-neutral
evaluation. The public Worker still has no authenticated durable provider. No
deployment, live model call or human learning study is implied by this document.

## Expected assistant workflow

1. Discover with `get_loom_capabilities({detail:"index"})`. Inspect full behavior
   metadata/schema when needed. Choose the learner action before the renderer.
2. Write and validate TopicPlan v1. Optional objective `evidenceOfLearning`, section
   `presentation:{target,strategy}`, and `assessment:{itemRefs,successCriterion}`
   preserve review decisions. Missing rationale, presentation strategy or observable
   evidence produces advisory feedback, separate from structural validity.
3. Retrieve `get_authoring_guide({detail:"focused",sections,components,library})`.
   The initial response includes canonical compact core rules, exact manifest/narration signatures and a content
   revision. Reuse `knownContractVersion` only while those rules remain available.
   `forceRefresh:true` restores them after context compaction or host changes.
   Stale revisions refresh without relying on a server session. Omit `detail` for
   unchanged legacy text/full/section-filtered behavior. Complex sections may
   require their full rules: record an exception rather than silently omit them.
4. For edits, pass current authorized files and optional `plan` to
   `get_topic_context`. It returns only selected design decisions/objectives/source
   locators with source and plan revision hints. `expectedPlanRevision` detects
   stale plans independently of source changes. Over-budget design context is
   explicitly omitted; complete source statements are never cut in half.
5. Generate OUI/narration from the plan. Local `validate_topic({oui,plan})`
   compares compiled representations and assessment statement references.
   `show_topic({oui,plan})` also lets the browser perform this review. The Worker
   never claims it compiled/rendered a topic. Advisory reports do not block legacy
   topics or impose a native/OpenUI quota.
6. Inspect Read/Present at phone/tablet widths. The production browser auditor
   measures small text, clipped/unreachable content, horizontal overflow and
   off-screen narration focus. Intentional scrolling remains accessible rather
   than being treated as clipping. Bounded reports update model context without
   sending user messages or starting autonomous host turns. Learners retain Ask,
   Pick, Read/Present and Viewer fallback controls.
7. Save exact source, provenance and optional plan using authorized storage.
   Viewer/App events include canonical `topicVersion` equality hints. Checkpoints
   from versioned records require matching source/version and existing targets;
   stale/legacy answers cannot establish current objective progress. Historical
   aggregate counts remain compatible. `completedObjectives` means all explicitly
   linked authored items have latest correct evidence, not inferred general
   mastery. The checkpoint always keeps `assessment.mastery:"not-inferred"`.
8. Evaluate observed host runs separately from authored synthetic fixtures. Report
   unsupported measurements as unknown and repair the smallest affected artifact.

## Measurements and budgets

`LoomServerOptions.onMeasurement` receives content-free byte counts, character/4
token estimates, tool/stage, latency and success only. No source, learner identity,
provenance, arguments, credentials or results enter telemetry. It is opt-in;
without an observer, no extra boundary measurement serialization occurs. Local CLI opt-in:
`LOOM_MEASURE_TOOLS=1`. Research/generation/private reasoning remain host-visible
boundaries; the Worker cannot measure them or provider billing by itself.

The fixed three-case short-topic corpus measures full-guide, section-filtered
and progressive retrieval using the same artifacts and actual DOM answer actions.
Initial focused-contract p50/p95: 1,883/1,996 estimated tokens. Documentation
p50/p95: full 32,656/32,656; section-filtered 9,838/9,907; progressive 2,514/2,627.
CI gates this measured corpus at 2,000 focused and 5,000 total documentation
estimated tokens. The focused gate is close to the measured p95 and must be revisited if canonical requirements grow; these are not
universal limits. Complex authored graphs/tables may need an explicit
`budgetExemption`. Required contracts/source must never be silently truncated.
Discovery retains its 1,000-token index regression guard. App-aware delivery has
a 1,000-character text-response guard; explicit Viewer fallback preserves the
existing bounded-link path and has a separate 13,000-character regression guard.

The fixture benchmark includes validation/render/narration, dependency recall,
repairs, boundary estimates and latency. Source truth and semantic objective
coverage remain unknown where not checked. Its documentation reduction exceeds
the original 3–5x hypothesis for these fixtures, but cannot establish total
successful model-task savings or teaching quality. Compare those using observed
host runs, including failed tasks and repair traffic.

## Provider-neutral evaluation

Run `npm run evaluate:offline` for reproducible authored cases, then use
`npm run evaluate:workflow -- input.json output.json` for imported aggregate
traces. `WorkflowRunSchema` in `src/evaluation/workflow-run.ts` is the canonical
strict input contract. It rejects unknown content fields and duplicate run IDs.
Each run supplies an origin, case/variant, workflow boundary events, observed
outcome checks, documentation estimate and optional provider usage/reviewer scores.

Supported events: `workflow.selected`, `context.resolved`, `research.completed`,
`plan.validated`, `section.generated`, `validation.completed`, `topic.presented`,
`learning.updated`. Each event records latency, input/output bytes and estimated
tokens; provider token counts are optional observations. Include every attempt
and repair. Total provider cost per success is unknown unless all relevant event
usage is supplied. Missing rendering/narration is not a successful check. Reports
keep synthetic and host-observed groups separate and include p50/p95, dependency
recall, objective coverage, evidence support, repairs and budget exceptions.

For semantic review, use the same requests and sources across variants, permit
multiple defensible representations, and blind reviewers to variant/provider.
Two independent reviewers should score learner-action fit, grounding and
readability from 1 (fails the requested task) to 5 (clear, grounded and usable),
using one shared rubric version. First calibrate on agreed positive/negative
examples (valid prose/table, unsupported chart, dense table, substituted quiz),
discuss disagreements, then independently score held-out cases. Record actual
reviewer aliases/scores in the trace. `calibrationPairs` counts available paired
reviews; absent ratings remain absent. This runner does not fabricate reviewers,
semantic scores, learning outcomes or external model measurements.

## Browser and runtime verification

CI uses Ubuntu 24.04: the previous failure was Playwright refusing Ubuntu 26.04,
after all code checks and real workerd had passed. The MCP browser harness now
retains layout snapshots and screenshots at 380, 768 and 1,024 pixels in both
Read and Present, alongside existing interaction, repair, accessibility/fallback,
progress and library checks. These measurements are evidence about rendered
snapshots, not a blanket guarantee for every possible authored topic.

Local Chromium is still sandbox-restricted; CI browser results must be checked
before claiming successful real geometry verification. Hosted storage/auth and
provider-specific model execution remain outside the user-selected scope.

## Verified repository checks

- Full suite: 206 files passed, 2,138 tests passed, 14 skipped.
- Focused MCP/authoring/context/checkpoint/evaluation regression set: 100 passed.
- Offline evaluation: 4 files / 9 tests passed, including the fixed cost corpus
  and versioned two-client handoff fixture.
- TypeScript, generated-artifact consistency, Workers production build and both
  Worker/local bundle guards passed. Worker bundle: 615.24 kB uncompressed before
  the final revision-key-only follow-up.
- The revision key also covers workflow prose and the canonical TopicPlan schema;
  its four focused refresh/compatibility/measurement tests passed afterward.
- Real workerd and browser evidence is tracked by PR 197's GitHub Actions run;
  a passing local build is not a substitute for those runtime results.
- Canonical record bundles are checked before any conditional write; malformed or
  multi-topic inputs cannot be saved and then fail during checkpoint derivation.
  All four continuity tests pass with these negative cases included.
