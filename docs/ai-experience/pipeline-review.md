# AI experience pipeline review: representation choice

Latest implementation details and remaining runtime/evaluation boundaries are in
the [Issue 193 completion guide](completion-193.md). The original findings below
remain useful design history, not a current missing-feature checklist.

Implementation status: the first increment now adds a shared host-routed workflow/TopicPlan and library-scoped retrieval, including Studio adapters and automatic context references. See [workflow contracts](workflows.md). The gaps below describe the reviewed baseline; later artifact-layout review and external-model evaluations remain future work.

Issue 193 continuation adds explicit learner-action/presentation/evidence discovery,
an optional compact index, local/browser plan-to-compiled-representation review,
bounded context omission addresses, observed resume locations and a synthetic
representation review corpus. See [verified rebaseline and limits](rebaseline-193.md).
The original gap table below is historical: orchestration and namespace gaps
were already merged before this continuation. Plan review now detects structural
representation drift; browser layout and external teaching-quality evaluation
remain unimplemented. No deterministic test claims to choose the best renderer.

## Finding

The section-selection problem spans orchestration, plan contracts, discovery, retrieval and evaluation. Prompt edits alone can shift preference from Text to OpenUI without improving the learning design. The current catalog and tools are useful primitives, but the author-facing and tutor workflows do not yet connect them into a consistent decision/review loop.

This review inspected the repository and ran a focused contract probe. It did not inspect the original source or tool traces of the learner's screenshot lesson, run external models, or measure deployed behavior. Recommendations about that lesson are based on its screenshots, not a verified diagnosis of its generation trace. The uncommitted OpenUI styling changes are a separate rendering improvement.

## Verified gaps

| Stage | Evidence | Consequence |
| --- | --- | --- |
| Entry and orchestration | `tutor-skills.ts` server instructions and tutor routine say plan, get_authoring_guide, write, validate_topic when available, show_topic. The file does not mention get_loom_capabilities, validate_topic_plan or get_topic_context. | The new discovery and planning tools are optional branches the main routine never explains how to use. Context retrieval is relevant to reuse/edits, not a required call for every new lesson. |
| Discovery | `capability-catalog.ts` exposes root components, mental models and prose cues; OpenUI now has a separate list of visual families. Native learner interactions, supported presentation behaviors and limitations are not described at the same granularity. | Layout possibilities can be more salient than native learning behaviors. Labels such as "visual" do not distinguish useful exploration from a static table of prose. |
| Planning | TopicPlan has goal, objectives, representation, free-text activity and evidence references. Studio's separate PlanItem has action/name/type/title/idea, with component names rather than normalized section types. | Neither route consistently requires a concrete learner action, explains representation choice, or carries a presentation strategy. Studio and hosted planning can drift. |
| Focused references | `assistant-prompt.ts` resolves names from the native library before the standard library. A direct probe of getAuthoringGuide([], ['Text']) returned `Text(title, paragraphs, ...)`; standard OpenUI Text is `Text(variant, value, ...)`. | A component name alone is ambiguous. Library-scoped contracts are needed; more generic reference text will not fix it. |
| Context | `context-graph.ts` returns file/statement/component dependencies, hashes and budgets. It carries no intended learning action, plan decision or presentation constraints. | Excellent structural recall can preserve an already-poor representation choice. Editing context should include the relevant design decision when available, not just its code. |
| Validation and repair | Plan validation checks structure, coverage and references. Topic compilation checks OUI/narration. There is no plan-to-artifact representation audit. McpApp reports compilation errors to model context, but no comparable presentation-layout audit. | A syntactically valid, all-static lesson with unreadably dense tables can pass. Repair is directed at invalid code, not suitability or layout. |
| Evaluation | `tests/evaluation/workflows.test.tsx` begins with a fixed valid quiz plan/source and compares guide sizes. | It does not test representation selection, tool routing or the actual instruction-to-generation workflow. Character savings do not establish pedagogical quality. |
| Distribution | Schema/skill artifacts share a generator, which is good. Capability schema is version 1 and MCP server version remains 0.1.0; there is no shared workflow/content revision for clients to compare. | Regeneration proves source consistency, not that an installed skill or deployed endpoint has the current workflow. |

## Target workflow

Use the applicable stages, without making small edits pay the cost of planning a new course:

1. Read learner intent, authorized evidence and relevant progress.
2. State the learning task before choosing a renderer: classify, explain a process, compare attributes, investigate a relationship, practise a decision, or read a connected argument.
3. Discover candidate representations and their actual learner interactions/presentation constraints.
4. Make a compact plan with objective references, learner action, chosen representation and a short reason. Record a meaningful alternative when the choice is ambiguous. AI makes this judgment.
5. Check plan structure and explicit compatibility; return advisory diagnostics for missing design decisions. Do not pretend deterministic code can grade teaching quality.
6. Retrieve the correct library's contracts and only the current source/plan/evidence context needed.
7. Generate OUI and narration; validate with existing compiler/gateway; compare the realized section types and references to the plan.
8. Preview at representative phone/tablet sizes. Report measurable overflow, text size, unreachable content and narration/viewport alignment; distinguish intentional scrolling from clipping.
9. Repair the affected section, then show/save the exact artifact and versioned plan metadata through existing authorized storage workflows.
10. Derive progress from actual learner evidence; later assistants reuse the source, plan and evidence rather than inferring mastery from views.

For a minor edit, retrieve affected context, preserve or explicitly revise the existing design decision, validate and preview the affected section. No mandatory call to every MCP tool, whole-guide reload or learner-facing planning questionnaire.

## Implementation order

### 1. Connect and unify the existing workflow

Update server instructions, tutor/writer workflows and Studio planning from one shared workflow definition. Make capability discovery and plan validation part of new/large topic authoring when available. Adapt Studio PlanItem to the same normalized plan semantics rather than introducing another planner. Preserve current tools and small-topic behavior; the user should see concise learning choices, not internal tool plumbing.

Add routing tests that fail if the primary workflow omits these stages. These test instruction contracts, not guaranteed external assistant compliance. No new all-purpose orchestration tool is necessary.

### 2. Make plan and capability metadata express learning behavior

Extend canonical mental-model metadata with native interaction affordances, useful contexts, meaningful alternatives and presentation limits. Give native and OpenUI variants comparable discovery detail, with focused retrieval to retain a compact initial response.

Evolve the plan contract compatibly (retain v1 and adapt it, or introduce v2 with explicit migration). Reuse `activity` for a concrete learner action where possible, and add a compact choice rationale plus relevant OpenUI visual family/presentation strategy. Avoid duplicating objective prose. Do not require a prescribed mix, percentage of native sections, or an OpenUI quota.

A workflow, a taxonomy, a comparison and a practice activity can have multiple valid implementations. Candidate matching can produce suggestions; it should not silently rewrite a table into TaxonomyBrowser or reject valid prose/visual explanations.

### 3. Fix reference namespaces and contextual intent

Add an explicit native/OpenUI library discriminator to focused reference retrieval and Studio describe_components, keeping existing bare-name behavior for compatibility and reporting collisions clearly. Resolve dependency closures within the selected library. Standard `Text` must not return the native signature.

Carry a small optional design-context envelope with the relevant goal/action/representation decision, library, presentation target and revision. Extend existing context retrieval; do not create a second parser or context graph. Source/plan text stays untrusted data. Hashes remain change hints, not security tokens.

### 4. Add review and repair at the artifact boundary

Keep errors (syntax/schema/references) separate from advisory representation/layout diagnostics. Reuse existing validation reports and section/statement attribution. Compare generated OUI with explicit plan claims in the browser/local compiler path. Preserve legacy show_topic calls without a plan; report that plan alignment is unverified rather than rejecting them.

Run DOM/font/layout checks in the browser/test harness, where actual viewport geometry exists. Only the client can measure rendered text, clipping and reachable scroll content. Hosts that support model-context updates can receive bounded advisory reports; an update is not a guaranteed host-chat turn or automatic agent execution. Preserve learner-controlled Ask/Pick and repair actions.

Do not add a hosted LLM judge or heavy compiler to the Worker. The assistant performs reasoning and repair; Loom returns deterministic evidence.

### 5. Evaluate the full decision loop and version its delivery

Keep current deterministic compilation/context/storage tests. Add a fixed selection corpus covering taxonomy, procedural bullets/flowcharts, option tradeoffs, parameter exploration, genuine comparison tables, quantitative charts, custom diagrams, connected prose and mixed lessons. Include positive examples of legitimate OpenUI tables and legitimate Text sections, plus dense table dumps and duplicated native interactions as review cases.

Deterministic tests cover workflow routing contracts, plan round trips, namespaced signatures, plan/artifact alignment, source/narration validity, responsive layout, and readable/reachable content. Do not count section variety as success.

External model evaluations must start from the same learner requests/sources, allow multiple defensible choices, record tool traces and actual token/latency/repair observations, and score learner-action fit, grounding and readability separately from syntax. Human/semantic judgments stay explicitly separate from offline checks. No success claim without running that evaluation.

Generate a workflow revision/capability content revision and skill metadata from the same source as prompts and references. Return compatible version metadata through existing discovery. Distinguish schema versions from content revisions; a zip generated locally does not prove an installed skill or public endpoint was updated.

## Applying this to the screenshots

- Six search directions: TaxonomyBrowser when the learner should explore each concept; a table only when cross-row attribute comparison is the actual task.
- Four-step document handling: native Bullets for an ordered checklist; Flowchart when triggers, responsibility, branching or handoffs matter.
- Failure / consequence / preservation: OpenUI Table is a valid representation for factual comparison; taxonomy is an alternative for guided drilldown.
- Research notes and talk links: keep focused explanations in the lesson and detailed citations in accessible reference content; a large reading list should not dominate a presentation beat.
- Charts need actual supplied/verified measurements, or explicitly labelled illustrative data. Neither "more visual" nor a native-section quota justifies invented metrics.

## Serverless and compatibility constraints

All hosted operations remain stateless and bounded. No in-process workflow session, always-running orchestration backend, server-held private research or Node-only Worker dependency. Reuse learner-owned source/storage and current event/checkpoint contracts. New plan/context metadata should be optional for legacy topics and validated/versioned for new workflows. Browser layout checks and offline/model evaluations stay outside the Worker CPU path.
