# Text selection follow-up to Issues 198 / PR 199

The user reported that an assistant still preferred Text for this request after
PR 199 was merged:

> I want you to research about the three js or spline capabilities to create the web app with 3D. Also, research the cutting edge use case samples and how it works. Please create the full topic lesson on Loom.

The original assistant's TopicPlan/tool trace and client were not supplied. The
reproduction is an authored plausible Text-heavy plan for this exact request,
not a captured external-model run. The original full suite established protocol,
compilation and browser correctness; it did not establish autonomous assistant
selection quality.

## Verified gaps

1. `get_authoring_guide(detail:"index")` returned names/components without the
   learning-purpose cues already present in `get_loom_capabilities`. A client
   choosing through that index missed definitions, linear-procedure and view cues.
2. The tool description still prescribed the legacy retrieval order, a short
   section count and an intro/closing-quiz shape for full lessons. It did not
   explicitly route new lessons through capability discovery and plan validation.
3. `UNJUSTIFIED_TEXT_SELECTION` only applied when rationale was omitted or matched
   a small list of generic words. Sentences such as "Text explains complex
   concepts clearly" or "Text is the simplest format for a detailed explanation"
   bypassed the warning, even for comparison and process objectives.
4. Later `validate_topic` and `show_topic` responses omitted readiness review.
   Compilable Text matching a Text-heavy plan could therefore end with a positive
   response after earlier advisory issues had been forgotten. A call with no
   plan also gave no explicit indication that representation readiness was unknown.

The initial reproduction failed six checks before implementation. Eight final
regressions cover those paths, section-title cues and bounded delivery feedback.

## Changes

- Reuse the existing compact capability index in the authoring index; no new
  catalog or recommendation engine. Both entry points expose all 20 learning
  purposes, Flowchart configuration and OpenUI families.
- Update tool descriptions, server instructions and shared workflow v4. Honor
  full-lesson requests without a fixed count or mandatory sequence. Discover
  capabilities and validate the plan before retrieving exact signatures.
- For structured tasks, a supplied rationale no longer automatically clears a
  Text warning. The English-language heuristic looks for a prose-specific need,
  such as nuance, connected argument, interpretation, careful wording or a
  requested essay. Clarity, simplicity and length alone do not establish fit.
  It examines section-local titles/actions/objectives, not a global Text ratio.
- Preserve legitimate prose and Bullets. Warnings remain advisory; there is no
  Text ban, forced visual quota or hardcoded renderer ranking. A different valid
  rationale can be explicitly justified by the author; absence of a warning is
  not a semantic quality certificate.
- Return readiness alongside OUI validity/plan alignment in `validate_topic`.
  These are independent properties: a topic can compile and align structurally
  while still needing representation review.
- At `show_topic`, include a short text summary plus at most three structured
  advisories, total/omitted counts and the existing validator as the expansion
  path. With no plan, say readiness was not reviewed. Delivery remains available
  to legacy clients; no server memory, compiler or LLM judge was added.
- Regenerate published prompts, catalogs and skill archives through the existing
  generator. Compact core wording was shortened to preserve the measured focused
  contract budgets while strengthening selection guidance.

For the supplied request, definitions, a factual capability comparison, rendering
interactions, use-case examples and option evaluation are different learning
purposes. The assistant should compare feasible capabilities for each; the
existing comprehensive Three.js/Spline fixture demonstrates complementary
choices, not a required type list. Text may still be useful for qualifications or
nuanced explanation. Fresh research and verified cutting-edge claims remain the
AI host's responsibility, not an inference from a valid rendering.

## Verification and limits

The original generic-rationale reproduction produced no Text-selection warnings.
The revised review produces an advisory for both structured objectives while
structural validity and compiled representation alignment remain valid. Local
and hosted SDK paths retain the warning through delivery. Appropriate connected
prose and Bullets pass. A 30-section stress fixture verifies explicit diagnostic
omissions and compact text delivery; it is not a lesson-size policy.

`tests/unit/mcp/representation-followthrough.test.ts` checks the MCP path.
`tests/fixtures/ai-experience/text-selection.ts` holds the supplied request and
synthetic bad plan/source. The offline harness retains
`artifacts/ai-text-selection-regression.json` alongside the positive comprehensive
fixture report. External-model selection and semantic learning quality remain
unmeasured; these tests establish deterministic behavior, not client obedience.

After review/merge and the existing production deployment, a client needs fresh
server instructions/tool metadata (a new connection/chat where applicable) and
current contracts. Comparing `contractVersion` in discovery with the tested build
can distinguish old documentation from the new behavior. This follow-up does not
merge or deploy automatically, and a local fix is not evidence that a live
assistant has loaded it. A captured tool trace remains useful if Text preference
persists after the update.


## Current local results

- Full suite: 208 files, **2,168 passed / 14 skipped** (302.47 seconds).
- Focused MCP/authoring regressions: 32 files, **251 passed**.
- Offline evaluation: five files, **18 passed**; authored fixtures only.
- TypeScript, generated-artifact consistency and the production Worker/local build passed.
- Both Worker/local bundle guards passed; Worker size: **632.56 kB** uncompressed.
- Capability index: **752** estimated tokens; authoring index with shared core/signatures: **1,551**.
- Fixed short-topic focused-contract p50/p95: **1,849 / 1,962**; progressive documentation **2,613 / 2,726**. Estimates use characters/4, not billing; existing gates remain unchanged.
- The local workerd invocation did not become ready; CI supplies the actual runtime gate.
- Local Chromium still exits before assertions with setsockopt denied / SIGTRAP. The existing CI browser suite remains the real rendering gate. No local browser success is claimed.

The follow-up PR records actual CI runtime/browser outcomes separately. No
external model or learner study ran, and no server-side semantic judging was added.
