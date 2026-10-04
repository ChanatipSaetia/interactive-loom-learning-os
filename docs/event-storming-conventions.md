# Event Storming Conventions for Flowcharts

This document defines the authoritative conventions for structuring flowchart data (`steps.yaml`, `actors.yaml`, `systems.yaml`, and `journeys.yaml`) inside Loom Learning OS topic bundles. These rules ensure that all flow diagrams lay out cleanly, dynamically transition between views, and correctly generate derived states (such as Sequence and System Architecture maps).

---

## 1. The Standard Flow Cycle

Loom flowcharts are built on **Event Storming** semantics. To ensure correctness, every step of your process must model state transitions progressively.

Each step in a process must strictly follow this full sequence cycle:
`EVENT → POLICY → COMMAND → AGGREGATE/EXTERNAL (handledBy) → EVENT`

```
EVENT ──> POLICY ──> COMMAND ──> AGGREGATE/EXTERNAL (handledBy) ──> EVENT
```

### Flow Cycle Rules:
1. **Never jump directly** from `EVENT → AGGREGATE` or skip command/policy nodes. Every action that performs work must be represented as a `COMMAND` handled by an `AGGREGATE` or `EXTERNAL` system.
2. **Policy Inclusion**: Every linear step (including the root step) and all branch options specify a `policy` field in the steps YAML file. The engine generates a `POLICY` node for every step in the chain (`ACTOR → POLICY → COMMAND` for root steps, and `EVENT → POLICY → COMMAND` for downstream steps).
3. **Natural Language**: Values for `command` and `policy` fields must be written in natural language (e.g. `command: "Start Agent Run"`, `policy: "If Plan Approved"`) rather than code-like variable identifiers (e.g. `cmd_start`, `pol_approve`). They render directly as text labels in the flowchart nodes.
4. **Who does what** (all on a linear step or branch option):

   | Field | Meaning | Required |
   |---|---|---|
   | `initiatedBy` | Actor who starts the step | no |
   | `handledBy` | System that runs the command | no — omit only for a pure state change no system runs (the command then emits its events directly) |
   | `delegatesTo` | System the handler hands part of the work to (e.g. reading a key store) | no — needs `handledBy` |
   | `sendsTo` | Actor or system that **receives** the step's result (a message) | no |
   | `async` | `true` when the command is fired without waiting for a reply (a queued job, a notification) | no |

   - `initiatedBy` names an **actor**; `handledBy` and `delegatesTo` name **systems**; `sendsTo` names either. Validation rejects anything else: when an actor receives the result, use `sendsTo`, not `delegatesTo`.
   - Declare `sendsTo` whenever the step sends something to someone, especially in protocol flows: the System Architecture and Sequence views draw exactly that message (`handledBy → sendsTo`) and nothing is inferred. A step with no `initiatedBy`, `sendsTo` or `delegatesTo` is drawn as happening inside its handler: its box lights up with the step label, and no line is invented.
   - Once any step of a flowchart declares `sendsTo`, System Architecture draws lines **only** from `initiatedBy`, `delegatesTo` and `sendsTo`. A flowchart with no `sendsTo` still gets a line wherever one system's event triggers another system's command.
   - When a choice belongs to a person (e.g. the player decides to fight the boss), put the same actor in `initiatedBy` on every option of the fork: the decision diamond then sits in that actor's swimlane.

   ```yaml
   - type: linear
     id: server_cert_step
     policy: "Present Server Identity"
     command: "Send Server Certificate"
     handledBy: server
     sendsTo: client          # the certificate goes to the client
     resultEvents:
       - id: server_cert_sent
         title: "Server Certificate Sent"
   ```

---

## 2. Direction & Branching

Flowcharts progress visually from **left to right**. When branching paths occur, they must follow a split pattern:
`EVENT → multiple POLICYs → one COMMAND each`

### Correct Branching Structure:
A single event triggers multiple separate policies, which in turn trigger their own commands:
```
EVENT ──> POLICY A ──> COMMAND A ──> AGGREGATE ──> EVENT A
      ──> POLICY B ──> COMMAND B ──> AGGREGATE ──> EVENT B
```

### Incorrect Branching Structure:
**Never** branch multiple commands from a single policy or group handlers without policies:
```
EVENT ──> POLICY ──> COMMAND A
                 ──> COMMAND B
```

Each branch path must start with its own unique `policy` node. When a single `EVENT` triggers multiple `POLICY` nodes, the layout engine automatically aligns and spreads the branches vertically, rendering a Decision Diamond shape in Swimlane and Data Flow views.

---

## 3. Repeated Actors and Systems

Declare each actor and system **once** and point every step at that ID (`initiatedBy`, `handledBy`, `delegatesTo`, `sendsTo`). When one is used by several steps, the engine draws a copy per step in the Event Storming view (same title) and collapses them into a single box in System Architecture, Swimlanes, Sequence and Data Flow. Do not declare duplicates yourself.

### Where things are drawn
- **Swimlanes:** a command an actor starts sits in that actor's lane; any other command sits in the lane of the system that handles it. A fork whose options are all started by the same actor sits in that actor's lane.
- **Sequence:** one message per command (from `initiatedBy`, else a self-call on the handler) and one per result event (to `sendsTo`, else on the handler's lifeline). Steps appear in declared order, except that a step never comes before the step it follows from. `async` commands get an open arrowhead.

---

## 4. Flowchart Node Types

| Node Type | Category | Description | Example |
|---|---|---|---|
| **Actor** | User | Human user initiating a flow or performing a manual review step. | `dev_user`, `qa_reviewer` |
| **Event** | State | An outcome or state fact. Written in past tense. | `evt_started`, `evt_failed` |
| **Command** | Action | An instruction or intent to do work. Written in imperative tense. | `"Call LLM API"`, `"Write File"` |
| **Policy** | Rule | Business logic or condition triggered by an event. | `"If Review Fails"`, `"On Success"` |
| **Aggregate** | System | Owned domain model of the system under discussion (`kind: "aggregate"`). | `orch_agent`, `order_aggregate` |
| **Service** | System | Owned component without its own domain model: a router, a pipeline stage, an adapter (`kind: "service"`). | `tools_router`, `retriever` |
| **Database** | System | Data store the system reads and writes (`kind: "database"`). | `progress_store`, `key_store` |
| **External** | System | System outside your immediate boundaries, called via API/network (`kind: "external"`, the default). | `llm_api`, `mcp_server` |
| **Read Model** | Query | Optimized database view queried by a policy. | `read_review_scores` |
| **Risk** | Risk | Design blocker, complexity, or system vulnerability. | `unresolved_timeout` |

### Choosing a system kind:
- **Aggregate**: the domain model you are designing, which owns state and rules (e.g. `Order`, `StateGraph`).
- **Service**: other code you own that does work without owning a domain model (e.g. an HTTP controller, a port, a text splitter).
- **Database**: where data is stored (e.g. Postgres, a document store, a key store).
- **External**: services outside your control, invoked via network requests (e.g. `LLM API`, `Brave Search Engine`).

Aggregates, services and databases sit inside the System Boundary in the architecture view; external systems sit outside it.

### State machines and event data
- A system can carry a `StateMachine` (states + `initialState`). Mark each event that moves it into a new state with `enters: <STATE_ID>`. The State Machine view draws one transition per change, labelled with the command that caused it, and playback highlights the state the journey has reached. Without `enters`, the view shows the states with no transitions.
- Give an event `data` (e.g. `"Order ID, total, line items"`) when what it carries matters to the lesson: the Data Flow view names the event's data object with it.

---

## 5. Multiple Flowcharts and Journeys

### Multiple Flowcharts
If a topic contains multiple subsystems that do not share any `COMMAND` or `EVENT` nodes, you must **split them into separate flowchart sections**. Multiple flowcharts can share `AGGREGATE` or `EXTERNAL` handler nodes, but each flowchart must have exactly **one root node** (the starting `COMMAND`).

### Multiple Journeys
A flowchart should contain one or more journeys (`journeys.yaml`) that serve as walkthrough playlists for the learner:
- Each journey must follow **exactly one branch path** from start to finish. Never jump between parallel branches.
- Include a **Happy Path** journey as the baseline progression.
- Create secondary journeys for error loops, exceptions, or alternative execution flows.
- Each journey step's `stepId` must be a **linear step `id` or a branch option `id`** from `steps.yaml` — never a `resultEvents` id or a branch step's own `id`. Playback highlights and frames that step's whole cycle (actor → policy → command → handler → result events); pointing at an event would show that single event only. The validator flags it with the producing step as the fix hint.

```yaml
- stepId: step_draft     # ✅ the step that produces evt_draft_opened
  name: "Draft"
  description: "The writer opens a pull request"
- stepId: branch_pass    # ✅ one option of a branch step
  name: "Editorial review"
  description: "Structure, style and terms are checked"
# - stepId: evt_draft_opened   ❌ a result event
```

---

## 6. Flowchart Validation & Connectivity Rules (Tier 3)

All flowchart diagrams are automatically validated via the **3-Tier Validation Gateway** (`src/core/learning-engine/validation/gateway.ts`).

### Tier 3 Semantic Reference Integrity Rules for Flowcharts:
1. **Actor & System Attachment to Steps**:
   - Every `Actor` (User) and `System` (`Aggregate`, `External API`, `Service`, `Database`) node declared in `actors.yaml` or `systems.yaml` **MUST be attached to at least one step in steps.yaml** (via `initiatedBy`, `handledBy`, `delegatesTo`, or `sendsTo`).
   - A `handledBy` and a `delegatesTo` MUST name a declared system; an `initiatedBy` MUST name a declared actor; a `sendsTo` MUST name a declared actor or system; `delegatesTo` requires `handledBy`.
   - An event's `enters` MUST name a state of a declared `StateMachine`.
   - Every `Actor` and `System` node in the derived graph MUST be connected to an Event node via step relation chains.

2. **Step Link Reference Integrity (`continuesAs`)**:
   - Every `continuesAs` property in a linear step or branch option must target a valid step ID or branch option ID.
   - When `continuesAs` targets a linear step or branch option ID, the relation connects to `pol_${stepId}`.
   - When `continuesAs` targets a branch step ID, the relation connects to the branch step's event `evt_${branchStep.event}`, cleanly linking the process flow into the branch's event trigger.
