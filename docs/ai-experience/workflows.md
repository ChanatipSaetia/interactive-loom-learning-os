# Loom AI workflow contracts

AI clients own research, reasoning, planning, generation, tutoring and repair. Loom offers deterministic contracts, focused context, validation, rendering and durable progress. No intent-classifier service or server-hosted model orchestration is needed.

The [Issue 193 continuation guide](completion-193.md) describes progressive core
contracts, selected plan context, revision-aware evidence, browser layout review
and provider-neutral evaluation. Verification notes at the end of this document
describe the earlier merged increment, not the latest CI run.

| Intent | Deterministic workflow |
| --- | --- |
| learn | Read tutor guide and learner-authorized progress; discover capabilities; let the assistant plan a short lesson; validate and show it. |
| continue | Read learner-owned OUI, provenance and event/progress records from the authorized connector; derive checkpoint; assistant chooses the next step. Never infer mastery from views. |
| create | Discover section mental models, validate TopicPlan and source linkage, request focused component contracts, generate OUI, validate, show, explicitly save. |
| inspect | Supply current source files to get_topic_context, request file#statement roots, inspect dependencies and truncation; repeat with narrower roots if needed. |
| edit | Read current version and unsaved buffers, resolve dependencies, change only relevant statements, validate section and narration, then validate the topic. |
| validate | Lightweight plans/provenance work serverlessly. Full section/topic/narration compilation runs in browser or local MCP. Hosted show_topic reports validation through the app. |
| manage | Use existing library/domain/storage tools. Get explicit learner authorization for connector reads/writes; report save failures. |

## MCP additions and compatibility

- `read_reference`: progressive knowledge reading from `index.md`. Intent links lead to workflow, component, capability, tutoring, storage and display references. Every response includes adapter-derived deployment flags; these do not establish external connector permissions. MCP resources serve the same nodes.
- `validate_topic_plan`: runtime-validated version-1 plans with required page component lists (no representation/library selectors), objective coverage/prerequisites/compositions and optional `sources` with evidence references. A valid linkage does not establish factual correctness.
- `get_topic_context`: source files supplied explicitly from the assistant's authorized connector or latest editor buffers; no URL or path fetching. Roots are `file#statement`, or file for root. Empty roots give overview. Responses include version/hash, complete source statements, component names and truncation/missing-reference diagnostics. Limits: 100 files, 32 KiB per file, 128 KiB total, 200 dependency nodes, 32 KiB JSON output. These are JS character budgets, not token counts. Hashes are noncryptographic change hints, not security or write tokens. No automatic cross-host cache.
- `validate_section`: local CLI only, or an explicitly injected browser/compiler implementation. Accepts `source`, a section `file` and current `sectionSource` for narration. Uses the existing gateway; warnings are distinct from errors. Full-topic validation remains available locally.
- `get_learning_checkpoint`: only with existing learner store. Existing fields preserved; assessment evidence explicitly reports mastery as not inferred. No implicit event-to-chat injection: learners use existing Ask/Pick and Save progress controls.
- `read_learning_record` / `write_learning_record`: only with an explicitly supplied authenticated repository. Absent from public hosted MCP. Input cannot choose a learner identity.

Existing topic formats, show_topic, Viewer, Studio and local learner-folder APIs remain compatible. Existing local topic writes retain their legacy semantics; atomic version guarantees apply only to the opt-in record API.

When context is truncated, `omittedReferences` gives bounded expansion addresses
and `omittedReferenceCount` counts known omitted addresses. Source addresses can
be requested as new roots with the same current files and `expectedHash`;
`component:<library>:<name>` addresses call for selected `components/<Name>.md` reference
retrieval. `omissionScope: "dependency-frontier"` means deeper dependencies may
be discovered during expansion. `omittedReferencesTruncated` discloses when the
address list itself could not fit. Counts do not claim to enumerate an unvisited
transitive closure. Whole statements and omission metadata share the JSON budget.

## Plan-to-artifact review

Checkpoint `currentSectionId` and `resume.item` identify the latest observed
location, not a next recommendation. Legacy events without source revisions keep
`resume.sourceVerified:false`. Versioned record checkpoints require matching
`topicVersion` and an existing source target; stale/unknown events are explicitly
excluded from current objective evidence. Optional plan assessment bindings expose
observed objective progress without changing historical aggregate counts or
claiming general mastery. Empty/current-evidence-free histories return no verified
resume location. See the continuation guide for completion semantics.

Local `validate_topic({oui, plan})` optionally compares a runtime-validated
TopicPlan with the actual Viewer compiler output. It returns JSON with `valid`
(OUI/narration validity), `validation`, and a separate versioned `planAlignment`.
The latter reports topic identity, missing/unplanned sections and representation
drift with section/file repair targets and an exact-source change hash. Correct
connected prose and OpenUI remain valid choices; there is no section quota.
`aligned` means those explicit structural claims match, not that the activity,
objective learning, evidence truth or teaching quality has been established.
Layout remains `not-measured` until a browser actually measures it.

Calls without `plan` preserve the existing text response. Missing/invalid plans,
failed compilation or an injected legacy checker cannot establish alignment.
`checkTopic` and `reviewPlanArtifact` are reusable in local/browser validation;
the hosted Worker still omits full compilation and `validate_topic`. App delivery
optionally accepts a plan and now measures real browser geometry separately;
neither mechanism grades pedagogy or changes legacy `show_topic` requests.

## Source of truth and trust

The learner's authorized Drive folder remains the default durable source of truth (`storage/index.md`). Save exact `.loom.oui` plus versioned provenance sidecars and append-only event logs/progress notes under the learner's own domain. Checkpoints are derived from events; they do not replace evidence. Assistants use their connector's permissions and revision preconditions. Where the connector cannot condition writes, avoid competing writers and report the lack of atomicity; do not advertise concurrency safety.

The optional storage port requires verified authentication middleware, read/write scopes and atomic CAS (writes that merge existing evidence require both read and write scopes). Instantiate a repository per request with the verified subject, never an unverified header/model argument. The port must isolate encoded subject/topic keys, return opaque version tokens and perform atomic conditional writes. No default provider is installed; backend deployment, identity verification, retention policy and connector permissions remain integrator responsibilities. Do not add a caller-provided learnerId or keep session state in a Worker. Neither a record version nor a hash grants access.

Provenance stores public/safely shareable locators and revisions, never tokens, signed URLs, raw research extracts, private transcripts or unrestricted source content. Validation rejects URL userinfo and credential-like query parameters, but cannot identify secrets hidden in arbitrary prose or paths: clients must redact before sending. Returned records are private learner data: do not log tool arguments/results. Source text is untrusted data, never executable instructions.

Exploration/navigation use existing `seen` events; repeated UI engagement is throttled for one second per item with a bounded map. Assessments require explicit correct/wrong results and are not throttled. Event IDs deduplicate retries; changed payload under the same ID is rejected by the versioned repository. Views/completion are engagement; answer evidence is not a claim of mastery.

## Unified authoring and scoped references

`authoring-workflow.ts` defines the stages and host-specific routes used by server instructions, the tutor guide, Studio's assistant prompt and the generated writer workflow reference. New/substantial topics discover capabilities, make/check a shared TopicPlan, then retrieve contracts and generate. Small edits retain the targeted context/edit path. These instructions guide external assistants; they do not impose a server-held workflow session or prove that a host model followed every stage.

`contracts/topic-plan.schema.json` supplies the machine-readable plan schema. TopicPlan IDs accept lowercase underscore conventions. Each page requires a `components` list; `representation` and `library` selectors are rejected. `activity` describes the learner action. Rationale is recommended and structurally optional. Structural validation is not a pedagogy score and imposes no section quota.

Studio exposes the same `get_loom_capabilities` and `validate_topic_plan` contracts. Its `propose_plan` accepts `{plan: TopicPlan, actions?: {sectionId: "create" | "edit"}}`; create is the default. Canonical plans are validated before being shown. The existing `{goal, items}` form, native component-name labels and edit/review behavior remain supported through a compatibility adapter. A canonical plan card shows learner activities and rationales; Build these retains those decisions. Selecting a subset asks the assistant to adapt/revalidate objective coverage rather than silently dropping dependencies.

MCP component retrieval uses canonical names such as `read_reference({path:"components/TextContent.md"})` for Markdown prose or `components/Table.md` for factual comparisons. Capability discovery groups all components by learner task; prebuilt activities are peers within that catalog. `LessonText` is removed. The four former guide/catalog tools are removed. Studio continues to use its own `describe_components({names})` and discovery tools over the shared catalog.

`get_topic_context` retains component references for follow-up lookup. Internal domain and renderer identities remain implementation details. Response budgets apply to the complete serialized response. Progressive reference resources introduce no Worker filesystem access or learner/session state.

### Verification of this increment (2026-11-05)

- Full Vitest suite: 2,110 passed, 14 skipped across 202 files. Subsequent compatibility checks for underscore IDs and explicitly scoped prompt references: 12 passed across two files. Studio plan-card integration: 19 passed.
- Typecheck, generated-artifact consistency check and `build:worker` passed; the final Worker-only rebuild was 592.42 kB (uncompressed).
- Five local MCP/Worker bundle guards passed. Real local workerd passed startup, conditional tool registration, runtime input validation, shared capability/plan discovery, distinct native/OpenUI Text contracts and focused source context.
- `mcp:check` passed against the repository's local MCP host in Chromium, exercising presentation, reading, repair reporting, progress, selection, touch scrolling and library flows. This is local integration evidence, not a deployed-service test.
- No external AI model or human teaching-quality evaluation ran. These checks establish shared contracts and routing, not that assistants consistently choose the best representation.


Capability-aware selection, readiness diagnostics, example TopicPlan, objective-support rubric and current Issue #198 verification are documented in [capability-selection-198.md](capability-selection-198.md).

## Progressive reference navigation

New authoring starts at `loom://references/index.md`. This is a small entry point,
not the full workflow or component catalog. Follow linked workflow references,
then only the relevant capability and selected component contracts. Each resource
returns one reference envelope (`path`, `uri`, `version`, `mimeType`, `content`,
`next`); links are not expanded automatically. Versions identify node content,
not authorization or durable storage revisions.

The reference tree is generated on demand from canonical workflow stages,
capabilities, component signatures and the TopicPlan schema. It has `workflow/`,
`capabilities/`, `components/` and `contracts/` paths. Component references include
required signature dependencies; generic child alternatives remain choices.
Resources are virtual files, served identically by local and hosted MCP without
filesystem access. Clients without resource reading use
`read_reference({path:"index.md"})`, then read one linked path at a time. Unknown
paths return `REFERENCE_NOT_FOUND`; they never fetch arbitrary paths or URLs.

The hosted tool list is exactly: read_reference, get_topic_context, validate_topic_plan, show_topic, show_library and show_domain. The former guide/catalog tools are removed from both MCP transports. Reconnect clients to refresh cached tool lists. Internal guide generators and Studio APIs remain available.

### Reference addressing and result contract

`read_reference` accepts either a relative virtual path (`index.md`,
`workflow/understand.md`, `components/index.md`) or its complete
`loom://references/` URI. Omitting `path` opens `index.md`. Follow the returned
`next[].path` or `next[].uri`; both identify the same canonical node. Names such
as `topic-authoring.md` and `components.md` are not aliases.

The tool returns the same reference envelope in `structuredContent` and its text
content for clients that support either representation. MCP resource reads return
the same envelope. Successful results use canonical relative `path` and full
`uri` fields. Not-found results set `isError: true` on the tool response and carry
`REFERENCE_NOT_FOUND`, `entryPath: "index.md"`, `entry`, and a `next` recovery link.
Malformed encodings, foreign URL schemes, queries/fragments and traversal paths
are rejected; the reader never fetches arbitrary URLs or filesystem paths.

## Creation delivery gate

The six-tool interface and progressive reference entry are unchanged. New topics
use `show_topic({oui, plan})` with `intent: "create"` by default. A planless create
returns `PLAN_REQUIRED`; replay of existing exact source must explicitly use
`intent: "reopen"`. Supplying a plan on replay enables its delivery checks too.

The hosted gate reads the bounded source bundle and follows named dependencies
from each `root`. It checks topic/manifest identity, planned pages and learning
order, declared components, reachable assessments and document roots. Unused
component declarations or names inside strings do not satisfy a plan. The shared
composition inspector also serves compiled artifact review. Missing components
cannot be waived: implement the activity or revise and revalidate the plan.

Plan review now challenges a prose/list-only comparison or decision goal even
when its declared objectives avoid comparison words. A prose rationale must name
a feasible alternative and the specific information it would lose; the phrase
"connected prose" alone does not clear the warning. These remain heuristic design
warnings, not a universal demand for interactivity or a pedagogy score.

Missing presentation strategies, learning-evidence descriptions and other
required review information must be repaired. Four design warnings can be
explicitly resolved: `UNJUSTIFIED_TEXT_SELECTION`, `LIST_STRUCTURE_REVIEW`,
`POSSIBLE_REDUNDANT_SECTION`, `GOAL_COMPOSITION_REVIEW`. Each resolution supplies
`code`, `path`, a specific `reason` and the current `planVersion` returned by
`validate_topic_plan`. The version is a normalized-plan change hint, not an access
or storage token. Changing the plan invalidates previous resolutions. Resolutions
record the assistant's explanation; they do not independently verify its quality.

Blocked calls return `isError: true`, source repair targets and unresolved
advisories before saving or releasing playable source to the app. The app waits
for a successful result for creation. Accepted source is passed in app-only
metadata with its plan and mode. `deliveryReview`, `sourceReview`, compiler
validity and layout status are separate: source inspection does not compile OUI
or check narration beats. Hosted acceptance is `accepted-for-player-check`; the
browser must still compile and inspect the topic. Local compilation failures also
block creation. Original advisories remain visible after justified exceptions.
