---
id: US-15
title: "Unified Inspector Sidebar Widgets (State Machine, DFD payloads, ERDs)"
type: AFK
dependencies: ["US-12"]
e2eInfra: ["Playwright"]
---

# US-15: Unified Inspector Sidebar Widgets (State Machine, DFD payloads, ERDs)

## What to build

Build and integrate the new sidebar inspector sub-components:
1. `StateMachineWidget`: Displays states `IDLE`, `PLANNING`, `EXECUTING`, `EVALUATING`, `ESCALATED` and highlights the active state dynamically based on the current step's process group.
2. `JsonPayloadViewer`: A code block display component rendering mock JSON payloads corresponding to the active DFD step.
3. `ERD Database Schema`: Clicking on a database or aggregate node (like `Memory` or `Orchestrator`) shows the database tables (columns, types, foreign keys) in the sidebar.

## Acceptance criteria

- [ ] State Machine widget transitions states in sync with playback steps
- [ ] JSON Payload Viewer displays the correct mock JSON payload (parsed requests, execution plans, OCR strings) during DFD active steps
- [ ] Clicking on database/aggregate nodes displays the ERD schema tables in the sidebar inspector

## Blocked by

- US-12 (Core 2x2 Grid Layout & Toggle)

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
