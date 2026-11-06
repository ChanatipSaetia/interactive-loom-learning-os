# Capability-aware authoring — Issue 198

Baseline: `466871ce` (merge of PR #197), confirmed current by the repository owner.
Work continues on the existing working branch as requested. Read #198 and its
(empty) discussion, #193 including its reconciliation comments, and PR #192's
metadata/diff before implementation. PR #192 is merged; its historical partial
status is superseded by the current code and PR #197. The default target is
`master`, not a branch literally named `main`.

## Verified baseline and selected changes

| Area | Baseline evidence | This increment |
| --- | --- | --- |
| Discovery | `capability-catalog.ts`: 19 native types + OpenUI, mental models, learner actions, presentation constraints, evidence limits | Compact index exposes six Flowchart views/configuration and OpenUI families; full catalog adds view purposes, journeys, branching, narration and modeling constraints |
| Selection | `mental-model-guide.ts`, `authoring-workflow.ts`, `authoring-core.ts` | Six capability criteria, simplest faithful representation, first-class linear Bullets and definitions on Flashcards; complementary presentation/exploration/assessment bundles |
| Prompt consistency | Canonical prompt imposed a count/order even though shared guidance rejected quotas | Remove conflicting count/order and all-Text prohibitions in prompt and tutor skills; regenerate published prompts, catalogs and skills using existing generator |
| TopicPlan | Strict v1 schema, structural reference/coverage checks, three omission advisories | Keep schema and structural `valid`; extend conservative advisories and expose separate `experienceReadiness` in existing MCP/Studio validation |
| Contracts | Library-scoped dependencies, stateless version/refresh, legacy section guides | Structured unknown-component recovery; documented retry and selected legacy fallback preserving representation |
| Flowchart runtime | Already implements all six views, initial view, narration view changes, journeys, branches, async/data/state contracts; existing Read/Present and state tests | Reuse runtime; warn about primary/narration views without modeled payloads or state transitions and narration views on other sections |
| Evaluation | Full/filtered/progressive benchmarks, protocol tests, host measurements and imported reviews | Comprehensive Three.js/Spline authored fixture, positive/negative capability cases, per-objective offline support rubric, optional observed tool-call counts |
| Browser | Existing Read/Present layout auditor and MCP host | Add comprehensive fixture traversal at 380/768 pixels in both modes; retain source-scoped layout reports and screenshots in CI |
| Hosting/persistence | Stateless Cloudflare Worker, compiler in browser/local tooling, authorized storage ports | Preserved; no LLM, new endpoint, storage provider, schema break or renderer recommendation engine |

## Selection and progressive disclosure

1. Understand the goal, learner and evidence. Identify the knowledge structure
   and concrete learner action before selecting components.
2. `get_loom_capabilities({detail:"index"})` lists all 20 choices, Flowchart views
   and OpenUI families without exact signatures. Use full discovery when the
   behavior, modeling limits or TopicPlan schema is needed.
3. Compare feasible candidates by **knowledge fidelity, learner action,
   perspective coverage, cognitive clarity, assessment suitability and authoring
   feasibility**. These are reasoning questions, never fixed renderer scores.
4. Record the representation and meaningful configuration in existing
   `activity`, `rationale` and `presentation.strategy` fields. One primary view
   is enough; additional views must reveal distinct understanding. Multiple
   sections should explain, guide implementation, explore or assess different
   contributions rather than repeat the same explanation.
5. `validate_topic_plan({plan})`: structural validity remains separate from
   advisory readiness. Resolve relevant warnings or explicitly justify proceeding.
6. Retrieve the selected section rules and then
   `get_authoring_guide({detail:"focused",sections,components,library})` including
   dependency contracts. Retain `knownContractVersion` only while the core is in
   context; use `forceRefresh:true` after compaction/uncertainty.
7. On focused retrieval failure, retry with the correct library and explicit
   refresh. Fall back to the **selected** legacy section guide using `{sections}`
   without `detail`, `components` or `library`. For OpenUI request its section
   guide and specific component families. If both paths fail, report the blocker;
   do not guess signatures or silently turn the lesson into Text. A changed
   representation needs a revised rationale, coverage review and revalidation.
8. Generate OUI and narration, validate and repair affected statements, preview
   Read/Present, deliver and persist through the existing authorized mechanisms.
   Worker delivery never implies full compilation or confirmed persistence.

Bullets can give numbered instructions, prerequisites, checklists, key points,
supporting detail or summaries. OpenUI Steps add visual stage guidance when
useful; Flowchart teaches interactions, responsibilities, messages, data or states;
Reflection Sequence practices procedural order; User Journey follows a person's
experience. A linear process may justify Flowchart when perspectives add value.
Text remains appropriate for connected prose and nuance. Static factual tables
are useful; interactivity is not mandatory. Empirical charts need verified or
supplied data; illustrative data must be explicitly labelled.

## Flowchart configuration and narration

The six view IDs are `event-storming`, `architecture`, `swimlanes`, `sequence`,
`data-flow`, `state-machine`. `Flowchart.initialView` is its eighth positional
argument (after heading and lead). For example, the regression fixture uses:

```oui
root = Flowchart("Render request", [developer], [app, renderer], [render], [frame], null, null, "architecture")
```

Declarations in [the complete fixture](../../tests/fixtures/ai-experience/three-spline.ts)
connect a developer, application and renderer through one genuine render request,
with `Journey`/`JourneyStep` guiding that path. It uses no invented lifecycle.
Narration can change perspective on the **same beat**:

```oui
participants = NarrationStep("step1", "The application owns scene and camera; the renderer draws them.", null, "architecture")
messages = NarrationStep("step1", "Now trace the request and returned frame in order.", null, "sequence")
```

Sequence and Architecture need declared participation/messages (`initiatedBy`,
`handledBy`, `delegatesTo`, `sendsTo`). `async` denotes an actual fire-and-forget
command. Data Flow uses meaningful `Event.data`; State Machine needs a system's
`StateMachine` and genuine `Event.enters` transitions. `JourneyStep.processGroup`
is a phase label, not a state. Branch/BranchOption describe real alternatives.
No lesson must activate all six views. Missing model advisories suggest another
view or source-supported modeling, never fabrication.

## Example TopicPlan v1

This plan uses many-to-many objective links and complementary sections. The
complete comprehensive Three.js/Spline plan and validated source/narration live
in [three-spline.ts](../../tests/fixtures/ai-experience/three-spline.ts).

```json
{
  "schemaVersion": 1,
  "topicId": "rag-tools",
  "goal": "Explain and apply a retrieval tool workflow",
  "objectives": [
    {"id":"trace", "description":"Explain tool participation and message ordering", "evidenceOfLearning":"Explain which component receives the tool result"},
    {"id":"setup", "description":"Follow retrieval-tool setup steps", "evidenceOfLearning":"Reconstruct the setup order"},
    {"id":"recover", "description":"Choose a response to missing retrieval evidence", "evidenceOfLearning":"Justify requesting evidence rather than inventing a claim"}
  ],
  "sections": [
    {"id":"execution", "title":"Tool execution", "objectiveRefs":["trace"], "representation":"flowchart", "activity":"Trace messages between agent and retrieval tool", "rationale":"Component participation and message ordering are distinct useful perspectives on the same process", "presentation":{"target":"both", "strategy":"initialView: architecture; Journey follows the tool call; NarrationStep.view sequence on step1 explains ordering"}},
    {"id":"setup", "title":"Implementation instructions", "objectiveRefs":["setup"], "representation":"bullets", "activity":"Follow numbered setup instructions", "rationale":"Concise linear instructions preserve order without an extra process model", "presentation":{"target":"both", "strategy":"Reveal each numbered instruction; Read keeps the checklist available"}},
    {"id":"failure", "title":"Missing evidence", "objectiveRefs":["recover"], "representation":"scenario", "activity":"Choose a response to empty retrieval and inspect consequences", "rationale":"A branching decision teaches recovery rather than repeating system architecture", "presentation":{"target":"both", "strategy":"Read permits decisions; Present demonstrates choices before consequences"}},
    {"id":"check", "title":"Apply the workflow", "objectiveRefs":["trace","recover"], "representation":"quiz", "activity":"Submit an answer about tool-result handling and missing evidence", "rationale":"An explicit response checks application after presentation and exploration", "presentation":{"target":"both", "strategy":"Use Read for actual attempts; Present demonstrates authored feedback"}, "assessment":{"itemRefs":["sections/check.oui#handling"], "successCriterion":"Correctly identify the recipient and justify the evidence boundary"}}
  ]
}
```

## Advisory readiness

`valid` and `diagnostics` retain structural semantics. `advisoryDiagnostics` adds
path-scoped actionable warnings; `experienceReadiness.status` is `review-needed`,
`no-advisories` or `unverified` (invalid structure). `teachingQuality` always says
`not-evaluated`. No advisories does **not** certify a good lesson.

The review detects omitted/generic actions, rationale and presentation strategy;
Text choices with structured-task cues and no meaningful rationale; OpenUI with
no named composition; charts with no declared data basis; missing primary
Flowchart view or an unsupported explicit `initialView` assignment; exact repeated
objective/action/design declarations; and explicit exposure-only learning evidence.
There is no Text ratio, visual minimum, Bullets penalty or interaction count.

These are conservative, primarily English-language heuristics over declarations.
They do not parse arbitrary configuration prose, verify source truth, establish
assessment validity or determine semantic redundancy. Different evidence links
and different actions are preserved. For a checkable OpenUI composition claim, write e.g. `composition: Table` or
`composition: Tabs` in rationale/presentation.strategy. Local/browser artifact
review compares that exact component with the root's reachable statement calls;
unused declarations and component names inside quoted prose cannot satisfy it.
A mismatch remains advisory (`COMPOSITION_MISMATCH`). Arbitrary prose is not
parsed as a component requirement, and presence is never an effectiveness score.

Browser/local validation checks actual OUI,
references, narration beat targets, and modeled state/data prerequisites. Schema
checks reject unknown view IDs. Geometry checks separately measure rendered
snapshots; they cannot prove comprehension.

## Objective support and measurement

The offline `WorkflowRunSchema` accepts optional `objectiveIds`, `objectiveReviews`
and observed `toolCalls`. The inventory includes every objective, not only ones
reviewed. Reviews name an objective and one or more section IDs; sections may
support multiple objectives. They use rubric v1, scores 1–5 on:

- Representation fit: preserves the objective's knowledge structure and learner action.
- Grounding: factual claims and modeled details have appropriate support.
- Implementation quality: the intended composition/interactions/narration are realized and usable.

Anchors: 1 fails the task; 2 has major gaps; 3 partially supports it; 4 supports it
with minor limitations; 5 fully supports it clearly. Use independent calibrated
reviewers, held-out cases, a shared rubric and blinded variants where possible.
An objective is supported when **each dimension's mean reviewer score is at
least 4**. Supported Objective Rate = supported objectives / all objectives.
If any objective lacks review, the rate stays unknown (`null`), with explicit
inventory/reviewed counts. Continuous alignment is the mean of the three
objective dimension means divided by 5, averaged over reviewed objectives. No
review is synthesized and the Worker does no LLM judging.

Report this alongside structural objective coverage, first-pass validation,
repairs, observed tool calls, context/documentation estimates and provider usage
when supplied. Existing host boundary instrumentation remains opt-in and
content-free. Exposure and exploration are engagement; actual authored answers
are assessment evidence, never inferred general mastery. Synthetic regression
checks cannot establish model planning adherence, source truth, human learning
outcomes or provider billing.

## Verification

Final local results on 2026-11-06; historical #193/PR #197 results are not reused
as current evidence. The first exploratory full run found stale wording assertions,
entry-point size growth and generated-file mismatches while generation was still
changing. Those were corrected; the final run below used settled source/artifacts.

| Command | Actual local result |
| --- | --- |
| `npm run typecheck` | Passed; exit 0 |
| `npm test -- --maxWorkers=4 --minWorkers=1` | 207 files passed; 2,159 tests passed, 14 skipped; 306.18 s |
| Focused MCP/authoring/Studio/evaluation regressions | 34 files, 250 tests passed |
| `npm run evaluate:offline` | 5 files, 17 tests passed, including comprehensive selection corpus; 35.48 s |
| `node_modules/.bin/vite-node scripts/gen-oui-schema.ts --check` | Passed; uses the existing generator through installed vite-node because tsx is not installed locally |
| `npm run build:worker` | Passed; production app, MCP App, Worker and standalone MCP built; Worker 631.07 kB uncompressed |
| `node --test tests/build/local-mcp.test.mjs tests/build/worker-runtime.test.mjs` | Both passed on final build |
| `git diff --check` | Passed |
| `npm run mcp:check` and standalone `node tests/mcp-host/capability-check.cjs` | Blocked before assertions: Chromium SIGTRAP / `setsockopt: Operation not permitted`; no browser/mobile success claimed |
| `npm run check:worker` | Local workerd did not become ready; offline Wrangler version probe confirms pinned package is not cached (`ENOTCACHED`); no runtime success claimed |

Playwright MCP tools are unavailable. The existing Playwright Node host is the
fallback; its new capability traversal is included in `mcp:check` and the existing
GitHub Actions gate. CI retains `capability-layout.json` and screenshots. Local
jsdom tests do not substitute for browser/mobile geometry. No dependencies were
added; the existing installed lockfile dependencies were used. Existing jsdom
canvas/WebGL, React and Vite chunk-size warnings remain.

Measured context on the fixed short-topic corpus (characters/4 estimates):

| Measurement | p50 | p95 |
| --- | --- | --- |
| Focused contracts | 1,887 | 2,000 |
| Progressive documentation | 2,651 | 2,764 |
| Section-filtered documentation | 10,471 | 10,540 |
| Full guide documentation | 33,304 | 33,304 |

Compact capability index: 752 estimated tokens, retaining the <=1,000 index gate.
The short-topic focused <=2,000 and total-documentation <=5,000 gates pass, with
p95 focused exactly at its current gate. The comprehensive Three.js/Spline
fixture has 100% structural objective linkage and valid OUI/narration; its
Flowchart dependency contracts (~2,182) and generic Card/Stack closure (~4,747)
need explicit complex-topic budget exceptions. Required contracts are retained,
not truncated. The fixture's source is authored; zero regression-check repairs
is not an observed assistant first-pass success rate. No external model was run.

The offline report deliberately leaves semantic fit, Supported Objective Rate,
learner outcomes and provider usage unknown until actual reviews/observations
are supplied. Local browser/runtime limitations remain explicit even though the
bundles and SDK protocol contracts pass. Nothing was deployed or merged.


Follow-up: explicit OpenUI composition-to-artifact checks passed 15 focused MCP tests, all 17 offline tests, TypeScript, the production Worker/local build and both bundle guards. The complete CI suite is rerun for the final revision; local browser restrictions still apply. The browser fixture also expands initially compact Present controls before traversal.


A later report of persistent Text preference is investigated in [text-selection-followup.md](text-selection-followup.md), including the exact supplied request, reproduced review loopholes, corrected discovery and delivery paths, and the limits of authored regressions.
