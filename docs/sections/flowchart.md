# Section Type: `flowchart`

**Mental model**: Event Storming process flows, system boundaries, and actor swimlanes. Shows *how* a system works end-to-end.

---

## File Structure

```
sections/flowchart/
├── section.md        # section descriptor (resource: ".")
├── actors.yaml       # actor declarations
├── systems.yaml      # system/aggregate declarations
├── steps.yaml        # ordered flow steps
└── journeys.yaml     # named journey groupings
```

The `resource: "."` value means the loader reads **all four YAML files** from the directory and merges them into a single `FlowchartSchema`.

## `section.md` Frontmatter

```yaml
---
type: flowchart
title: "Combat Flow"
resource: "."         # loads actors.yaml, systems.yaml, steps.yaml, journeys.yaml from this directory
---
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"flowchart"` | Yes | Fixed value |
| `title` | `string` | No | Section header |
| `resource` | `"."` | Yes | Must be `"."` — signals directory-wide load |

---

## `actors.yaml`

A YAML **mapping** (not a list) of `actorId → ActorDecl`.

```yaml
player:
  title: "Player"
  desc: "Martial Artist Monk controlling skills and gear"
boss:
  title: "Boss Enemy"
  desc: "Map boss or Pinnacle boss"
pack:
  title: "Mob Pack"
  desc: "Group of regular enemies"
```

`ActorDecl`:

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | Yes | Display name |
| `desc` | `string` | Yes | Short description |

---

## `systems.yaml`

A YAML **mapping** of `systemId → SystemDecl`. Systems can be `aggregate` (internal) or `external` (third-party/passive).

```yaml
falling_thunder:
  title: "Falling Thunder"
  desc: "Lightning projectile per Power Charge, 360-degree via Nova Projectiles"
  type: "aggregate"

ailiths_chimes:
  title: "Ailith's Chimes"
  desc: "Converts Combo expenditure into Power Charges"
  type: "external"

`SystemDecl`:

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | Yes | Display name |
| `desc` | `string` | Yes | Description |
| `type` | `"aggregate" \| "external"` | Yes | Internal aggregate or external system |
| `stateMachine` | `StateMachine` | No | Optional state machine definition |

`StateMachine`:
```yaml
stateMachine:
  states: ["idle", "charging", "firing"]
  transitions:
    - from: idle
      to: charging
      event: "Power Charge Generated"
    - from: charging
      to: firing
      event: "Falling Thunder Cast"
```

> [!IMPORTANT]
> **Per-step duplication rule**: If the same system or actor participates in multiple separate steps, `deriveSchema` automatically generates per-step node instances in EVENT_STORMING view (sharing exact titles) and collapses them into a single canonical node in derived views (`SYS_ARCH`, `SWIMLANES`, etc.) based on matching title and type. Reference declared canonical system IDs directly in `steps.yaml`.
>
> See [event-storming-conventions.md](../event-storming-conventions.md) for the full EVENT → POLICY → COMMAND → AGGREGATE → EVENT cycle rule.

---

## `steps.yaml`

A YAML **list** of step objects. Two step types exist: `linear` and `branch`.

### Linear step

```yaml
- type: linear
  id: step_enter
  initiatedBy: player            # references an actor ID
  command: "Enter Map & Initiate Attack"
  policy: "Trigger Run"
  handledBy: whirling_assault    # references a system ID
  resultEvents:
    - id: evt_clear_packs
      title: "Clear Packs with Whirling Assault"
      desc: "Optional description"          # optional
  continuesAs: step_charges      # references the next step ID (optional)
  delegatesTo: other_system_id   # optional — system that further processes the command
  sendsTo: charged_staff         # optional — actor or system that receives the result events
```

`LinearStep`:

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"linear"` | Yes | Fixed value |
| `id` | `string` | Yes | Unique step identifier |
| `initiatedBy` | `string` | No | Actor ID that triggers this step |
| `policy` | `string` | No | Business rule / trigger condition |
| `command` | `string` | Yes | Command name being issued |
| `handledBy` | `string` | Yes | System ID that handles the command |
| `delegatesTo` | `string` | No | Optional downstream system ID |
| `sendsTo` | `string` | No | Actor or system ID that receives the result events. The Sequence and System Architecture views draw only declared messages; without it the events stay on the handler's lifeline. In `.oui` it is the last `Step` / `BranchOption` argument. |
| `resultEvents` | `ResultEvent[]` | Yes | Events emitted after handling |
| `continuesAs` | `string` | No | Next step ID (omit for terminal steps) |

`ResultEvent`:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique event ID (referenced by branch steps) |
| `title` | `string` | Yes | Event display name |
| `desc` | `string` | No | Event description |

### Branch step

```yaml
- type: branch
  id: step_clear_branch
  event: evt_power_charges       # result event ID that triggers this branch
  branches:
    - id: branch_ft
      label: "Falling Thunder (dense packs)"
      dashed: false              # optional — dashed line style
      policy: "If Pack is Dense"
      command: "Cast Falling Thunder"
      handledBy: falling_thunder
      resultEvents:
        - id: evt_pack_cleared
          title: "Pack Wiped (360 Lightning)"
      continuesAs: step_heralds

    - id: branch_fs
      label: "Flicker Strike (mobility)"
      policy: "If Pack is Scattered"
      command: "Cast Flicker Strike"
      handledBy: flicker_strike
      resultEvents:
        - id: evt_repositioned
          title: "Dashed Through Pack"
      continuesAs: step_heralds
```

`BranchStep`:

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"branch"` | Yes | Fixed value |
| `id` | `string` | Yes | Unique step identifier |
| `event` | `string` | Yes | Result event ID that triggers branching |
| `branches` | `Branch[]` | Yes | Array of branch paths |

`Branch` (same fields as a linear step minus `type`, plus `label` and `dashed`):

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique branch identifier |
| `label` | `string` | Yes | Branch display label |
| `dashed` | `boolean` | No | Render as dashed line (default: `false`) |
| `policy` | `string` | No | Condition for this branch |
| `command` | `string` | Yes | Command issued on this branch |
| `handledBy` | `string` | Yes | System ID handling this branch |
| `resultEvents` | `ResultEvent[]` | Yes | Events emitted by this branch |
| `continuesAs` | `string` | No | Next step ID |

---

## `journeys.yaml`

A YAML **list** of `FlowJourney` objects. A journey groups a named subset of steps into a walkthrough.

```yaml
- id: journey_mapping
  label: "Mapping Flow"
  description: "Standard map clearing: generate charges, clear with Falling Thunder or Flicker Strike, loop"
  steps:
    - stepId: step_enter
      name: "Enter Map"
      description: "Enter map, open with Whirling Assault"
      processGroup: planning       # planning | execution | evaluation | escalation

    - stepId: branch_ft
      name: "Clear with Falling Thunder"
      description: "Spend charges on Falling Thunder for 360-degree lightning burst"
      processGroup: execution
```

`FlowJourney`:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique journey identifier |
| `label` | `string` | Yes | Display name shown in the journey selector |
| `description` | `string` | Yes | Brief description of what this journey traces |
| `steps` | `JourneyStep[]` | Yes | Ordered steps to walk through |

`JourneyStep`:

| Field | Type | Required | Description |
|---|---|---|---|
| `stepId` | `string` | Yes | References a step `id` or branch `id` from `steps.yaml` |
| `name` | `string` | Yes | Step display name in the journey panel |
| `description` | `string` | Yes | Narrative description for this step in context |
| `processGroup` | `"planning" \| "execution" \| "evaluation" \| "escalation"` | No | Groups the step into a swimlane category |

---

## Validation & Diagnostics (3-Tier Gateway)

Flowchart sections are automatically checked by the **3-Tier Validation Gateway** (`src/core/learning-engine/validation/gateway.ts`):

- **Tier 1 (YAML Syntax)**: Ensures valid YAML syntax in `actors.yaml`, `systems.yaml`, `steps.yaml`, and `journeys.yaml`.
- **Tier 2 (Structural Schema)**: Validates structural fields against `FlowchartSectionSchema`.
- **Tier 3 (Semantic Reference Integrity)**:
  - **Entity Reference Check**: Validates that all relation `from`/`to` references, journey `nodeIds`, and view `nodes`/`groups` target existing entity IDs.
  - **Actor & System Node Event Connectivity**: Ensures every `Actor` (User) and `System` (`Aggregate`, `External API`, `Service`, `Database`) node declared in the section is connected to at least one `Event` node in the relation graph. Unconnected nodes trigger a `tier: 3` warning with a `fixHint`.
  - **State Machine Reference Check**: Ensures `stateMachine.initialState` exists in `stateMachine.states`.

---

## CDN & Static Page Usage

When rendering a `flowchart` section via the CDN library (`LoomSections.render`), you can provide your diagram data in one of two formats under `props`:

### Option A: Pre-derived Schema (`props.schema`)
Pass a pre-derived `UnifiedFlowchartSchema` object containing `entities`, `relations`, and `journeys`. The component will auto-derive visual views (`EVENT_STORMING`, `SYS_ARCH`, `SWIMLANES`, etc.) automatically.

```json
{
  "type": "flowchart",
  "props": {
    "title": "Agent Research Loop Flowchart",
    "schema": {
      "entities": { ... },
      "relations": [ ... ],
      "journeys": [ ... ]
    }
  }
}
```

### Option B: Raw Abstract Flow (`props.flow` or `props.schema`)
Pass raw un-derived `actors`, `systems`, `steps`, and `journeys`. The library will run `deriveSchema()` automatically during rendering.

```json
{
  "type": "flowchart",
  "props": {
    "title": "Agent Research Loop Flowchart",
    "flow": {
      "actors": { ... },
      "systems": { ... },
      "steps": [ ... ],
      "journeys": [ ... ]
    }
  }
}
```

---

## Splitting into Multiple Connected Flowchart Sections & Multiple Journeys

For complex systems or multi-stage processes, avoid dumping a monolithic 50-step flowchart into a single section. Instead, **split the process into multiple connected flowchart sections** (e.g., `sections/flowchart-engine/`, `sections/flowchart-fuel-injection/`, `sections/flowchart-brake/`).

### 1. Multiple Flowchart Directories
Each flowchart section gets its own folder under `sections/`:
```
sections/
├── flowchart-engine/
│   ├── section.md           # title: "4-Stroke Engine Cycle"
│   ├── actors.yaml
│   ├── systems.yaml
│   ├── steps.yaml
│   └── journeys.yaml
├── flowchart-fuel-injection/
│   ├── section.md           # title: "Fuel Injection System (EFI)"
│   ├── actors.yaml
│   ├── systems.yaml
│   ├── steps.yaml
│   └── journeys.yaml
```

### 2. Multiple Journeys per Section
Each flowchart section's `journeys.yaml` can define **multiple journeys** targeting different scenarios within that subsystem:

```yaml
# sections/flowchart-engine/journeys.yaml
- id: journey_intake_compression
  label: "Intake & Compression Strokes"
  description: "Walkthrough of air-fuel mixture intake and piston compression"
  steps: [...]

- id: journey_combustion_exhaust
  label: "Combustion & Exhaust Strokes"
  description: "Walkthrough of spark ignition, power stroke, and valve exhaust"
  steps: [...]
```

### 3. Connecting Flowcharts Across Sections
When flowchart sections represent connected stages of an end-to-end system:
- **Conceptual Handoffs**: The final result events or continuation steps of section $A$ connect to the initiating actor commands of section $B$.
- **Canonical System Collapsing (`collapsedTo`)**: Systems shared across multiple flowchart sections (e.g., `Engine Control Unit`, `Event Bus`, or `Database`) map back to canonical node IDs using `collapsedTo` so handledBy chains remain consistent across sections.
- **Index Registration**: Register each flowchart section manifest (`sections/flowchart-*/section.md`) in `index.md` and add all its YAML data files to `index.yaml` under `related`.

---

## Real Example

From `public/okf/poe2-flicker-monk/sections/flowchart/` — see the actual files for a complete working schema.

---

## Pedagogical Role

The `flowchart` section is the **process understanding** anchor of a topic. Place it after vocabulary (`flashcards`) and taxonomy so learners can read node labels they already know. Follow it immediately with a `reflection-sequence` challenge to convert passive reading into active recall.

See [sections-reference.md](../sections-reference.md) for the recommended section ordering and [event-storming-conventions.md](../event-storming-conventions.md) for the canonical EVENT → POLICY → COMMAND → AGGREGATE → EVENT cycle.
