---
id: US-12
title: "Core 2x2 Grid Layout & Toggle"
type: AFK
dependencies: []
e2eInfra: ["Playwright"]
---

# US-12: Core 2x2 Grid Layout & Toggle

## What to build

Implement a `layoutMode` state (`single | grid`) in the `Flowchart` component. Add toggle buttons in the flowchart header container to switch between "Single Focus View" (current tab-based view) and "Split Grid View" (renders 4 flowchart quadrants).

In Grid View, render 4 separate SVGs in a CSS 2x2 grid. If the viewport width drops below 1024px, the layout must automatically fall back to Single View mode to prevent layout squishing on mobile.

## Acceptance criteria

- [ ] Flowchart header displays "Single Focus View" and "Split Grid View" layout toggles
- [ ] Clicking "Split Grid View" displays 4 equal-sized SVGs in a responsive 2x2 grid
- [ ] Viewport resizing below 1024px width resets layoutMode to 'single'
- [ ] Journey playback steps highlight active nodes simultaneously across all 4 visible diagram views

## Blocked by

None.

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
