---
id: US-14
title: "Respective Auto-Zooming Camera Engine"
type: AFK
dependencies: ["US-12", "US-13"]
e2eInfra: ["Playwright"]
---

# US-14: Respective Auto-Zooming Camera Engine

## What to build

Upgrade the Flowchart zoom-and-pan camera engine so that each of the four viewports in Grid Mode calculates and maintains its own `transform` state (`scale`, `translateX`, `translateY`) independently.

When a journey step changes, all four viewports must run their camera auto-centering transitions (`animateTo`) using independent coordinate calculation math tailored for that specific viewport's active nodes.

## Acceptance criteria

- [ ] Viewports in Grid Mode maintain independent camera transformation states
- [ ] Journey playback step changes glide the camera in all 4 viewports independently to focus on the respective active nodes in each view
- [ ] Panning/zooming in one quadrant does not reset or affect the scale/translation of the other three quadrants

## Blocked by

- US-12 (Core 2x2 Grid Layout & Toggle)
- US-13 (Sequence Diagram View Projection)

## Unified Diagram Mapping & Relationships

Every system topic compiles a master event-driven schema (Event Storming) into several other derived diagram views. 

### Diagram View Purposes
* **Event Storming (High-Level Domain Flow)**: Maps the logical business rules, triggers, and state boundaries chronologically across the entire domain.
* **Activity Swimlanes (High-Level Control Flow)**: Shows the operational handoffs and ownership of execution steps across different actors and system boundaries.
* **System Architecture (Low-Level Topology)**: Illustrates the structural deployment topology, network boundaries, and communication protocols of physical services.
* **Sequence Diagram (Low-Level Execution Timeline)**: Tracks the precise, time-based back-and-forth network requests and responses between components.
* **Data Flow Diagram (DFD)**: Follows the transformation of data payloads and state schemas as they are processed through the system pipeline.
* **State Machine**: Models the internal lifecycle statuses and transition loops of the core Aggregate components (e.g. Orchestrator, Document Job, Order).
* **Entity-Relationship Diagram (ERD)**: Details the database table structures, columns, and relations that store the state of the Aggregates.

### Master Node Mapping Matrix

| Event Storming Node Type | System Architecture | Activity Swimlanes | Sequence Diagram | Data Flow (DFD) | State Machine | Entity-Relationship (ERD) | Infrastructure / Cloud |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 🟠 **Event** | *Omitted* | *Omitted* | **Return Message** | 📄 **Data Object** | ➡️ **State Transition** | *Omitted* | *Omitted* |
| 🔵 **Command** | **Edge / Action Line** | 🟩 **Process Box** | ➡️ **Request Message** | *Omitted* | *Omitted* | *Omitted* | *Omitted* |
| 🟣 **Policy** | **Router / Controller** | 🔶 **Decision Node** | *Omitted* | *Omitted* | 🛡️ **Transition Guard** | *Omitted* | *Omitted* |
| 🟡 **Aggregate / DB** | 🖥️ **Service / DB node** | **Swimlane** | 💈 **Vertical Lifeline** | *Omitted* | *The Subject* | 🗃️ **Table Cluster** | 📦 **VPC Subnet** |
| 👤 **User / Actor** | 👤 **Client Node** | **Actors Lane** | 👤 **User Lifeline** | 👤 **Source / Sink** | *Omitted* | 🗃️ **User metadata table** | 🌐 **Browser Client** |
| 🛜 **External System** | 🛜 **External Boundary** | **External Lane** | 🛜 **External Lifeline** | *Omitted* | *Omitted* | *Omitted* | ☁️ **SaaS Endpoint** |
