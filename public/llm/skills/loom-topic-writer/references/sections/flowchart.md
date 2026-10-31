# flowchart

Process, responsibility and interaction. What happens, what triggers it, who handles it, and how do participants interact? Choose the view from the table below.

Read [shared components](../core/components.md) and [narration](../core/narration.md) before writing.

## Component signatures

Flowchart(title: string, actors: Actor[], systems: System[], steps: (Step | Branch)[], journeys: Journey[], heading?: string, lead?: Lead, initialView?: "event-storming" | "architecture" | "swimlanes" | "sequence" | "data-flow" | "state-machine") — Animated Event Storming flowchart. Every actor and system must be used by at least one step.
  - title: Section title, shown in the topic outline and as the section header.
  - actors: Human actors, as Actor references. Each must start at least one step.
  - systems: Systems, as System references. Each must handle or receive at least one step.
  - steps: The flow, as Step and Branch references, in order.
  - journeys: Guided paths through the flow, as Journey references.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
  - initialView: Optional view the section opens on: "event-storming" (default), "architecture", "swimlanes", "sequence", "data-flow" or "state-machine" (needs a system with a StateMachine). Pick the one that shows the lesson best.
Actor(id: string, title: string, desc: string) — A human actor (user role) who initiates steps.
  - id: Actor ID, unique within the flowchart; steps refer to it with `initiatedBy`.
  - title: Actor name shown on its sticky (e.g. "Buyer").
  - desc: What this actor is or wants.
System(id: string, title: string, desc: string, kind?: "aggregate" | "service" | "database" | "external", stateMachine?: StateMachine) — A system that handles commands: an "aggregate" (owned domain model) or an "external" service.
  - id: System ID, unique within the flowchart; steps refer to it with `handledBy` / `delegatesTo`.
  - title: System name shown on its sticky (e.g. "Order Service").
  - desc: What the system owns or does.
  - kind: Optional "aggregate" (owned domain model), "service" (owned component without its own domain model), "database" (data store) or "external" (outside system). Default "external".
  - stateMachine: Optional StateMachine(...) for a system that orchestrates the flow.
StateMachine(states: MachineState[], initialState: string) — State machine for an orchestrating system. `initialState` is a state ID.
  - states: The states, as MachineState references.
  - initialState: ID of the starting MachineState.
MachineState(id: string, label: string, color: string) — A state of a system state machine.
  - id: State ID, unique within the state machine.
  - label: State name shown in the state machine view.
  - color: CSS colour for the state, e.g. "var(--ctp-green)" or "#a6d189".
Step(id: string, policy: string, command: string, handledBy: string | System, events: Event[], initiatedBy?: string | Actor, delegatesTo?: string | System, continuesAs?: string, description?: string, sendsTo?: string | Actor | System, async?: boolean) — Linear Event Storming step: POLICY → COMMAND → handledBy system → resulting events. `initiatedBy` is the actor that starts it; `delegatesTo` a system the handler calls; `sendsTo` the actor or system that receives its events.
  - id: Step ID, unique within the flowchart; journeys and `continuesAs` refer to it.
  - policy: Policy that reacts to the incoming event ("When …"); the POLICY sticky.
  - command: Command the policy issues, in imperative form (e.g. "PlaceOrder").
  - handledBy: System that handles the command (System reference or ID).
  - events: Events the handler emits, as Event references (past tense).
  - initiatedBy: Optional actor that starts this path (Actor reference or ID), usually on the first step.
  - delegatesTo: Optional second system the handler calls (System reference or ID).
  - continuesAs: Optional ID of the Step, Branch or BranchOption that this path's events lead into.
  - description: Optional narration of this step, shown when it is highlighted.
  - sendsTo: Optional actor or system that receives this step's events (e.g. the server sends ServerHello to the client).
  - async: Optional: true when the command is sent without waiting for a reply (fire-and-forget); the Sequence view draws it with an open arrowhead.
Branch(id: string, event: string, options: BranchOption[]) — Branching step: one event splits into several policy/command paths.
  - id: Branch ID, unique within the flowchart.
  - event: The event that splits into the options (e.g. "Payment Checked").
  - options: The paths, as BranchOption references.
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
Event(id: string, title: string, desc?: string, enters?: string, data?: string) — A domain event produced by a step (past tense, e.g. "Order Placed").
  - id: Event ID, unique within the flowchart.
  - title: Event name in past tense (e.g. "Order Placed").
  - desc: Optional detail about the event.
  - enters: Optional MachineState ID the state machine enters when this event happens; the State Machine view draws its transitions from these.
  - data: Optional description of the data the event carries (e.g. "Order ID, total, line items"); the Data Flow view names the data object with it instead of the event title.
Journey(id: string, label: string, description: string, steps: JourneyStep[]) — A guided path through the flow, from start to finish.
  - id: Journey ID, unique within the flowchart.
  - label: Journey name shown in the journey picker (e.g. "Happy path").
  - description: What this journey walks through.
  - steps: The stops in order, as JourneyStep references.
JourneyStep(step: string | Step | BranchOption, name: string, description: string, processGroup?: string) — A stop on a journey: the Step or BranchOption it plays (reference or ID), with a short name and narration. `processGroup` is an optional phase label for the stop (e.g. "planning", "handshake").
  - step: The Step or BranchOption this stop plays (reference or ID).
  - name: Short stop name shown in the journey list.
  - description: Narration shown while the stop is played.
  - processGroup: Optional free-text phase label for the stop (e.g. "planning", "handshake"); the state-machine state comes from Event `enters`, not from this.

## Presentation beats

`title`, then `chart`, `chart.part2`, … show readable portions of the overview (up to two journey steps per page; compact architecture diagrams can use one page), then `step1`, `step2`, … one per step of the first journey
