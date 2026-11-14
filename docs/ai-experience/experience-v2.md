# AI Experience Engineering V2

## Audit and baseline

The starting tree was clean on branch `work`. The existing system has a shared
stateless MCP server (local Node and hosted Cloudflare Worker), linked virtual
references, a v1 TopicPlan, source/plan alignment, plan-version-bound advisory
resolutions, a three-tier OUI gateway, a restricted expression evaluator,
separate Read/Present renderers, browser layout measurement and offline evaluation.
These are extended in place. No database, external LLM, new persistence layer,
or cross-request session state is required.

A clean archive of the original HEAD passed 91 relevant tests across MCP server,
Worker, validation gateway and layout review. An initial full run overlapped
implementation, so it is not a clean before/after baseline. Final verification
results are recorded below.

Implementation files extend `src/mcp/server.ts`, the OUI composition/catalog/reference modules, the shared validation gateway, progressive-content/tradeoff validators, Viewer/Studio consumers and presentation layout/CSS. New pure helpers are `component-recommendations.ts` and `validation/quantitative.ts`; tests and the synthetic sample stay outside the hosted runtime. Compatibility risks are the additive tool/catalog version, stricter rejection of mathematically invalid content, and responsive layout changes.

The main gaps were executable formula validation (including ordinary identifier
references), structured component discovery, explicit numerical reconciliation,
provider inclusion semantics, and actionable geometry evidence. BreakdownTree
already checked IDs, parents, cycles, roots and sibling sums; probability path
values already derive by multiplication. Those implementations are reused.
Layout constraints include transformed presentation canvases, flex minimum sizes,
long technical titles, hidden-overflow ancestors and independently scrolling
regions. Source alignment never measures those properties.

## Implementation and contracts

`recommend_components` is one additive read-only MCP tool, available on both
servers. It accepts a bounded objective, optional content description, learner
action, explicit knowledge structures, constraints and candidateLimit (1–12).
It returns authored affordance matches, roles, limits, evidence requirements,
composition suggestions and selected contract URIs. Explicit structure IDs
support an extensible vocabulary; free prose uses conservative relationship
heuristics. This is deterministic discovery assistance, not general semantic
understanding. Numeric components are excluded when data is explicitly missing.
Interaction requirements and exact reconciliation influence the comparison;
there are no popularity weights, component quotas or universal preferences.

Example: spending split across graph nodes suggests BreakdownTree plus an exact
Table; changing context size and prices suggests FormulaSandbox. Categories of
memory suggest TaxonomyBrowser without inventing quantities. Exact accounting
can legitimately prioritize Table. Full contracts remain progressive references.

`validate_topic_plan` keeps its existing `plan` and structural `valid` meaning.
Optional `quantitativeModels` accepts `trees`, `formulas` and `reconciliations`.
A reconciliation names modelId, assumptions, provenance and at least two explicit
{target, value, unit} observations. Verified observations require evidenceRefs;
illustrative data requires assumptions without fabricated citations. The checker
does not extract numbers from formatted prose, convert currencies, or verify
citations. Use one source model to populate the actual table/tree/formula and
submit its observations. The compiler independently validates embedded models.
Optional `tokenUsage` requires explicit booleans describing whether input includes
cache reads/writes and output includes reasoning; normalized buckets prevent
counting included tokens twice. Tool charges, infrastructure and retries remain
separate costs, not tokens. Provider-specific adapters must supply the semantics.

Readiness separates structure, semantic advisories, quantitative checks, independent
Read/Present layout and unevaluated learning quality. New representation warnings
can be resolved with the same exact code/path/current planVersion mechanism.
Missing quantitative assumptions require repair. MCP plan feedback includes at
most 12 advisories with omitted counts; detailed checks return bounded diagnostics.
TopicPlan v1 is unchanged. No lesson migration is needed. Clients must refresh
their tool lists to discover the seventh hosted tool.

Formula checks use the existing restricted evaluator, never eval/Function.
Both identifiers and the existing `${identifier}` spelling are supported.
Earlier metric outputs enter the scope in authored order. Checks cover finite
bounds, positive slider steps, unique IDs, defaults, declared identifiers,
supported operations, deterministic expressions and finite sampled outputs.
Probes include defaults, all-min/all-max and each variable's min/max/midpoint/zero
when in range, with other inputs at defaults. They do **not** prove validity
throughout a continuous domain or all interacting combinations. Invalid mathematical
models now produce explicit error-severity tier-3 diagnostics and block OUI
validation; ordinary design advisories remain warnings. Explicit semantic error severity is honored by Viewer, Studio, assistant edit validation and the content reader; invalid models have no renderable gateway payload, while Studio retains its last valid preview. This intentionally tightens
acceptance of previously renderable but mathematically invalid content.

Explicit reconciliation uses `abs(a-b) <= 1e-9 * max(1,abs(a),abs(b))`.
BreakdownTree retains its existing stricter relative sum tolerance
`64 * Number.EPSILON * max(abs(a),abs(b),Number.MIN_VALUE)` for compatibility.
Tree unit is shared at component level; per-node mixed-unit fields are unsupported.
Arithmetic cannot establish that categories are mutually exclusive, that a causal
formula is true, or that prose claims are justified. Those require source/human review.

Layout diagnostics now carry bounded source anchors, DOM paths, mode, element and
container bounds, overflow amounts and repair categories without source text.
Presentation technical headings wrap and flex content can shrink; title cards can
scroll instead of hiding content. The report preserves intentional scrolling and
accounts for painted text scale. These changes do not certify arbitrary scenes.

Canonical workflow/reference generators teach representation-first selection and
bounded targeted repair: retain IDs, fix affected statements, revalidate, and stop
after three unsuccessful attempts with remaining diagnostics. There is no autonomous
server repair agent or silent rewriting of factual content or learner progress.

## Regression lesson and evaluation

`samples/token-economics.loom.oui` and its v1 `token-economics.plan.json` provide a synthetic nine-page lesson with allocation
and exact ledger, graph execution, context semantics, pricing sensitivity,
qualitative architecture choices, conditional cache outcomes, cache amortization,
outcome economics and assessment. The 0.0442 USD model reconciles exactly;
expected attempt cost is 0.04864 USD and accepted-task cost approximately
0.0540444444 USD. Prices and probabilities are illustrative, not benchmarks.

`npm run evaluate:offline` includes 15 deterministic representation cases covering
financial allocation, probability, API architecture, multi-agent flow, sensitivity,
comparison, tutorial, taxonomy, timeline, code, visual recognition, assessment,
source-limited content, mobile and multi-page composition. Its report is
`artifacts/experience-v2-benchmark.json`. Candidate presence, source compilation,
default calculations and response characters are measurable. Candidate presence
is not autonomous assistant selection accuracy; characters are not billed tokens.
The report explicitly leaves external assistant, human teaching quality and
unobserved baseline selection scores unset. Existing workflow evaluation remains
separate and no model improvement or prompt-cache savings are claimed.

`node --test tests/mcp-host/experience-layout.test.mjs` (with `npm run dev`) records
Read and Present separately at 320×640, 390×844, 768×1024, 1440×900 and 768×572.
It writes `artifacts/experience-layout.json` and screenshots. Browser runtime
errors and source compilation failures fail the test. Geometry diagnostics remain
visible in the artifact rather than being disguised as a successful teaching score.
Playwright MCP tools were unavailable in this session, so the existing installed
Playwright library drives this repeatable browser harness.

## Verification results

- Original clean baseline: 91 relevant tests passed.
- Full unit run: 225 files, 2,280 passed, 14 skipped, seven timing failures in three UI files while heavy checks competed. All 50 tests in those three files passed when rerun alone with a 20-second per-test cold-import allowance; assertions were unchanged.
- Final gateway/workspace/full-topic mathematical blocking regression: 74 passed.
- Focused contract/discovery/reference checks: 39 passed; focused delivery/geometry checks: 44 passed. The final numeric/source reconciliation and plan-resolution file passed all 31 tests, including full-topic and content-reader rejection. Final Viewer plus experience checks passed 47 tests; Studio plus assistant edits passed 30 tests.
- Offline evaluation: all 20 tests across six files passed alone with one worker and a 20-second cold-import allowance.
- Final production Worker/local MCP build and TypeScript check passed; final local standalone packaging: four passed. The emitted Viewer bundle was checked for the explicit semantic-error blocking policy.
- Real workerd startup and stateless MCP tool smoke check passed, including recommend_components.
- All five viewport pairs completed without browser runtime errors. The final rerun also passed long technical-title wrapping and reachable Flowchart playback controls.
- The deterministic benchmark retains expected candidates in 15/15 authored cases and compiles the nine-page token-economics fixture. This does not measure autonomous assistant decisions or teaching outcomes.

## Deployment and remaining work

Build using `npm run build:worker`; run `npm run check:worker` before deploying
through the established workflow. No deployment, commit or push is part of this task.
The Worker remains stateless and avoids module-scope I/O/randomness/timers. Full
source compilation stays in the browser/local adapter; optional explicit model
checks do not import the player/compiler into the Worker.

Future work needs real cross-assistant traces and provider token observations,
human factual/teaching review, automated dimensional analysis and stronger model
identity binding for reconciliation observations. Sampling cannot rule out all
singularities. Broader semantic detection needs authored metadata extension or
AI-side reasoning, not claims of general understanding from keyword heuristics.

The browser matrix also exposed a narrow Flowchart playback pill extending outside
its clipped canvas. The shared mini-player now wraps within its container;
the browser regression asserts all playback buttons remain reachable. Dense
zoomable diagrams can still report small painted labels in overview. That warning
is retained; zoom/focused splits and the exact ledger remain available. Browser
measurement is bounded and records truncation rather than claiming every element
was inspected.


Reproduce the successful isolated checks with:

```sh
npm test -- tests/unit/viewer/viewer.test.tsx tests/unit/sections/openui/index.test.tsx tests/unit/core/supporting/authoring-editor/pick/section-anchors.test.tsx --maxWorkers=1 --minWorkers=1 --testTimeout=20000
npm run evaluate:offline -- --maxWorkers=1 --minWorkers=1 --testTimeout=20000
```

The default full-suite run was not entirely green under concurrent heavy load.
These scoped reruns isolate module startup timing; they are not a claim that
production latency or the default CI timing budget has improved. Existing missing
upstream sourcemap, React warnings and bundle-size warnings remain visible.
