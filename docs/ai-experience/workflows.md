# Loom AI workflow contracts

AI clients own research, reasoning, planning, generation, tutoring and repair. Loom offers deterministic contracts, focused context, validation, rendering and durable progress. No intent-classifier service or server-hosted model orchestration is needed.

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

- `get_loom_capabilities`: schemaVersion 1 section/mental-model catalog; also generated at `/llm/loom-capabilities.json`.
- `get_authoring_guide`: existing `sections` behavior preserved. Optional `components` requests exact canonical contracts and signature dependencies; this mode takes precedence if both are supplied. Unknown names are reported. Ask for core authoring rules separately.
- `validate_topic_plan`: runtime-validated version-1 plans, objective coverage/prerequisites/representations and optional `sources` with evidence references. A valid linkage does not establish factual correctness.
- `get_topic_context`: source files supplied explicitly from the assistant's authorized connector or latest editor buffers; no URL or path fetching. Roots are `file#statement`, or file for root. Empty roots give overview. Responses include version/hash, complete source statements, component names and truncation/missing-reference diagnostics. Limits: 100 files, 32 KiB per file, 128 KiB total, 200 dependency nodes, 32 KiB JSON output. These are JS character budgets, not token counts. Hashes are noncryptographic change hints, not security or write tokens. No automatic cross-host cache.
- `validate_section`: local CLI only, or an explicitly injected browser/compiler implementation. Accepts `source`, a section `file` and current `sectionSource` for narration. Uses the existing gateway; warnings are distinct from errors. Full-topic validation remains available locally.
- `get_learning_checkpoint`: only with existing learner store. Existing fields preserved; assessment evidence explicitly reports mastery as not inferred. No implicit event-to-chat injection: learners use existing Ask/Pick and Save progress controls.
- `read_learning_record` / `write_learning_record`: only with an explicitly supplied authenticated repository. Absent from public hosted MCP. Input cannot choose a learner identity.

Existing topic formats, show_topic, Viewer, Studio and local learner-folder APIs remain compatible. Existing local topic writes retain their legacy semantics; atomic version guarantees apply only to the opt-in record API.

## Source of truth and trust

The learner's authorized Drive folder remains the default durable source of truth (`get_storage_guide`). Save exact `.loom.oui` plus versioned provenance sidecars and append-only event logs/progress notes under the learner's own domain. Checkpoints are derived from events; they do not replace evidence. Assistants use their connector's permissions and revision preconditions. Where the connector cannot condition writes, avoid competing writers and report the lack of atomicity; do not advertise concurrency safety.

The optional storage port requires verified authentication middleware, read/write scopes and atomic CAS (writes that merge existing evidence require both read and write scopes). Instantiate a repository per request with the verified subject, never an unverified header/model argument. The port must isolate encoded subject/topic keys, return opaque version tokens and perform atomic conditional writes. No default provider is installed; backend deployment, identity verification, retention policy and connector permissions remain integrator responsibilities. Do not add a caller-provided learnerId or keep session state in a Worker. Neither a record version nor a hash grants access.

Provenance stores public/safely shareable locators and revisions, never tokens, signed URLs, raw research extracts, private transcripts or unrestricted source content. Validation rejects URL userinfo and credential-like query parameters, but cannot identify secrets hidden in arbitrary prose or paths: clients must redact before sending. Returned records are private learner data: do not log tool arguments/results. Source text is untrusted data, never executable instructions.

Exploration/navigation use existing `seen` events; repeated UI engagement is throttled for one second per item with a bounded map. Assessments require explicit correct/wrong results and are not throttled. Event IDs deduplicate retries; changed payload under the same ID is rejected by the versioned repository. Views/completion are engagement; answer evidence is not a claim of mastery.
