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

## 3. Duplicate-and-Collapse for Repeated Handlers

To keep the flowchart layout clean while ensuring that the handler execution chain remains structurally complete, follow the **Duplicate-and-Collapse** pattern.

If a single actor or system handler (`AGGREGATE`, `EXTERNAL`, or `USER`) participates in multiple steps, you must **duplicate the node** for each step it appears in, and map those duplicates back to the canonical parent node using the `collapsedTo` field.

### Example Configuration:
In `systems.yaml`:
```yaml
# Canonical Orchestrator system node
orch_agent:
  title: "Agent Orchestrator"
  desc: "Central coordinator agent"
  type: "aggregate"

# Duplicates representing the orchestrator in specific steps
orch_plan:
  title: "Agent Orchestrator"
  desc: "Planning and delegation stage"
  type: "aggregate"
  collapsedTo: "orch_agent" # Maps back to canonical parent

orch_exec:
  title: "Agent Orchestrator"
  desc: "Execution stage"
  type: "aggregate"
  collapsedTo: "orch_agent" # Maps back to canonical parent
```

In `steps.yaml`, point each step's `handledBy` property to the **per-step duplicate** (e.g. `orch_plan` or `orch_exec`), not the canonical node. The renderer will layout these nodes separately in step views but group/collapse them into the canonical `Agent Orchestrator` component in the System Architecture view.

---

## 4. Flowchart Node Types

| Node Type | Category | Description | Example |
|---|---|---|---|
| **Actor** | User | Human user initiating a flow or performing a manual review step. | `dev_user`, `qa_reviewer` |
| **Event** | State | An outcome or state fact. Written in past tense. | `evt_started`, `evt_failed` |
| **Command** | Action | An instruction or intent to do work. Written in imperative tense. | `"Call LLM API"`, `"Write File"` |
| **Policy** | Rule | Business logic or condition triggered by an event. | `"If Review Fails"`, `"On Success"` |
| **Aggregate** | System | Internal component of the system under discussion. | `orch_agent`, `tools_router` |
| **External** | System | System outside your immediate boundaries, called via API/network. | `llm_api`, `mcp_server` |
| **Read Model** | Query | Optimized database view queried by a policy. | `read_review_scores` |
| **Risk** | Risk | Design blocker, complexity, or system vulnerability. | `unresolved_timeout` |

### Aggregate vs. External System Distinction:
- **Aggregate**: Systems or modules that belong directly to the codebase/application structure you are designing (e.g. `AgentExecutor` or `StateGraph`).
- **External**: Real external services outside your control, invoked via network requests (e.g. `LLM API`, `Brave Search Engine`, `SQLite database`).

---

## 5. Multiple Flowcharts and Journeys

### Multiple Flowcharts
If a topic contains multiple subsystems that do not share any `COMMAND` or `EVENT` nodes, you must **split them into separate flowchart sections**. Multiple flowcharts can share `AGGREGATE` or `EXTERNAL` handler nodes, but each flowchart must have exactly **one root node** (the starting `COMMAND`).

### Multiple Journeys
A flowchart should contain one or more journeys (`journeys.yaml`) that serve as walkthrough playlists for the learner:
- Each journey must follow **exactly one branch path** from start to finish. Never jump between parallel branches.
- Include a **Happy Path** journey as the baseline progression.
- Create secondary journeys for error loops, exceptions, or alternative execution flows.

---

## 6. Flowchart Validation & Connectivity Rules (Tier 3)

All flowchart diagrams are automatically validated via the **3-Tier Validation Gateway** (`src/core/learning-engine/validation/gateway.ts`).

### Tier 3 Semantic Reference Integrity Rules for Flowcharts:
1. **Actor & System Node Event Connectivity**:
   - Every `Actor` (User) and `System` (`Aggregate`, `External API`, `Service`, `Database`, `Core System`) node declared in `actors.yaml` or `systems.yaml` (or `entities`) **MUST be connected to at least one Event node** in the flowchart relation graph.
   - Connected paths are formed via `initiatedBy` (Actor → Policy), `handledBy` (Command → System → Event), and `delegatesTo` (System → Secondary System/Actor/Target).
   - Duplicate system nodes created via `collapsedTo` are linked back to their canonical system entity. If either the canonical node or any duplicate with `collapsedTo: canonicalId` connects to an Event node, the system is considered connected.
   - Unconnected nodes emit a Tier 3 warning diagnostic (`Actor/System node "X" is not connected to any Event node`).

2. **Step Link Reference Integrity (`continuesAs`)**:
   - Every `continuesAs` property in a linear step or branch option must target a valid step ID or branch option ID.
   - When `continuesAs` targets a linear step or branch option ID, the relation connects to `pol_${stepId}`.
   - When `continuesAs` targets a branch step ID, the relation connects to the branch step's event `evt_${branchStep.event}`, cleanly linking the process flow into the branch's event trigger.

