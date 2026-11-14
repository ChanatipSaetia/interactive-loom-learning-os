## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main learner action with complementary cards, images, text, charts and reference links where useful; these compose one page, not separate content modes. Proactively include visual examples for visual subjects and visible sources for researched claims. See contracts/media-composition.md (installed skills: references/planning/media-composition.md). Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Include useful learner-visible reference links for deeper reading, with descriptive labels and supplied or checked destinations; keep the core lesson self-contained. See contracts/learner-references.md (installed skills: references/core/learner-references.md). Before adding image sources, read contracts/images.md and runtime.md (installed skills: references/core/images.md); a reachable HTTPS URL may still be blocked by the MCP host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

BranchOption(id: string, label: string, policy: string, command: string, handledBy: string | System, events: Event[], dashed?: boolean, initiatedBy?: string | Actor, delegatesTo?: string | System, continuesAs?: string, description?: string, sendsTo?: string | Actor | System, async?: boolean) — One path of a branch: label, then the same POLICY → COMMAND → system → events cycle as a Step.
  - id: Option ID, unique within the flowchart; journeys and `continuesAs` refer to it.
  - label: Label drawn on the branch edge (e.g. "approved").
  - policy: Policy that reacts to the incoming event ("When …"); the POLICY sticky.
  - command: Command the policy issues, in imperative form (e.g. "PlaceOrder").
  - handledBy: System that handles the command (System reference or ID).
  - events: Events the handler emits, as Event references (past tense).
  - dashed: Optional: true draws this path as a dashed line (e.g. an error path).
  - initiatedBy: Optional actor that starts this path (Actor reference or ID), usually on the first step.
  - delegatesTo: Optional second system the handler calls (System reference or ID).
  - continuesAs: Optional ID of the Step, Branch or BranchOption that this path's events lead into.
  - description: Optional narration of this step, shown when it is highlighted.
  - sendsTo: Optional actor or system that receives this step's events (e.g. the server sends ServerHello to the client).
  - async: Optional: true when the command is sent without waiting for a reply (fire-and-forget); the Sequence view draws it with an open arrowhead.
System(id: string, title: string, desc: string, kind?: "aggregate" | "service" | "database" | "external", stateMachine?: StateMachine) — A system that handles commands: an "aggregate" (owned domain model) or an "external" service.
  - id: System ID, unique within the flowchart; steps refer to it with `handledBy` / `delegatesTo`.
  - title: System name shown on its sticky (e.g. "Order Service").
  - desc: What the system owns or does.
  - kind: Optional "aggregate" (owned domain model), "service" (owned component without its own domain model), "database" (data store) or "external" (outside system). Default "external".
  - stateMachine: Optional StateMachine(...) for a system that orchestrates the flow.
Event(id: string, title: string, desc?: string, enters?: string, data?: string) — A domain event produced by a step (past tense, e.g. "Order Placed").
  - id: Event ID, unique within the flowchart.
  - title: Event name in past tense (e.g. "Order Placed").
  - desc: Optional detail about the event.
  - enters: Optional MachineState ID the state machine enters when this event happens; the State Machine view draws its transitions from these.
  - data: Optional description of the data the event carries (e.g. "Order ID, total, line items"); the Data Flow view names the data object with it instead of the event title.
Actor(id: string, title: string, desc: string) — A human actor (user role) who initiates steps.
  - id: Actor ID, unique within the flowchart; steps refer to it with `initiatedBy`.
  - title: Actor name shown on its sticky (e.g. "Buyer").
  - desc: What this actor is or wants.
StateMachine(states: MachineState[], initialState: string) — State machine for an orchestrating system. `initialState` is a state ID.
  - states: The states, as MachineState references.
  - initialState: ID of the starting MachineState.
MachineState(id: string, label: string, color: string) — A state of a system state machine.
  - id: State ID, unique within the state machine.
  - label: State name shown in the state machine view.
  - color: CSS colour for the state, e.g. "var(--ctp-green)" or "#a6d189".

### BranchOption: teaching purpose

- Introduce: Define the BranchOption content or configuration consumed by its owning component.
- Explore: Inspect it through the owning component and its documented behavior.
- Evidence: A supporting data declaration does not independently provide learning evidence.
- Limits: Use the exact required fields and references. This supporting contract does not imply an independently rendered activity, interaction, grading or persistence.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.
