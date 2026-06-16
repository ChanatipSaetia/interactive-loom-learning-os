# 0004 — Unified Schema Diagram Mapping Standard

## Context
We are expanding the Interactive Loom Learning OS from the 4 default diagrams (Event Storming, System Architecture, Data Flow Diagram, and Activity Swimlanes) to support a wider taxonomy of diagrams (Sequence Diagrams, State Machines, Entity-Relationship Diagrams, and Infrastructure Diagrams).
To avoid code duplication, configuration drift, and cognitive overhead, we need a standard projection mapping strategy to derive all other diagrams from a single master Domain-Driven Design (DDD) Event Storming schema.

## Decision
Every topic schema will define Event Storming as the master dataset. All other diagrams (System Architecture, Swimlanes, Sequence, Data Flow, State Machines, ERDs, and Infrastructure) will be derived as visual projections (lenses) from this master schema.

### 1. Diagram View Purposes
* **Event Storming (High-Level Domain Flow)**: Maps the logical business rules, triggers, and state boundaries chronologically across the entire domain.
* **Activity Swimlanes (High-Level Control Flow)**: Shows the operational handoffs and ownership of execution steps across different actors and system boundaries.
* **System Architecture (Low-Level Topology)**: Illustrates the structural deployment topology, network boundaries, and communication protocols of physical services.
* **Sequence Diagram (Low-Level Execution Timeline)**: Tracks the precise, time-based back-and-forth network requests and responses between components.
* **Data Flow Diagram (Low-Level Data Mutations)**: Follows the transformation of data payloads and state schemas as they are processed through the system pipeline.
* **State Machine (Orchestrator Lifecycle)**: Models the internal lifecycle statuses and transition loops of the core Agent Orchestrator.
* **Entity-Relationship Diagram (ERD)**: Details the database table structures, columns, and relations that store the state of the Aggregates.

---

### 2. Node Type Projection Mapping

| Event Storming Node Type | System Architecture | Activity Swimlanes | Sequence Diagram | Data Flow (DFD) | State Machine | Entity-Relationship (ERD) | Infrastructure / Cloud |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 🟠 **Event** | *Omitted* (not structural) | *Omitted* | **Return Message / Transition Label** | 📄 **Data Object** *(Payload)* | ➡️ **State Transition (Arrow)** | *Omitted* (Stored as record logs) | *Omitted* |
| 🔵 **Command** | **Edge Interaction / Action Line** | 🟩 **Process Box** *(Action)* | ➡️ **Request Message (Call Arrow)** | *Omitted* (Actions are hidden) | *Omitted* | *Omitted* | *Omitted* |
| 🟣 **Policy** | **Router / Controller / Hotspot** | 🔶 **Decision Node** *(Branching)* | *Omitted* (Represented as a check step) | *Omitted* | 🛡️ **Transition Guard (Condition)** | *Omitted* | *Omitted* |
| 🟡 **Aggregate / DB** | 🖥️ **Internal Service / DB node** | **Swimlane (Vertical / Horizontal)** | 💈 **Vertical Lifeline** | *Omitted* | *The Subject* (State Machine tracks this) | 🗃️ **Table Cluster / Aggregate Root** | 📦 **VPC Subnet / ECS Container** |
| 👤 **User / Actor** | 👤 **Client Node** | **Actors Lane** | 👤 **User Lifeline** | 👤 **Data Source / Sink** | *Omitted* | 🗃️ **User metadata table** | 🌐 **Web Browser / Client Zone** |
| 🛜 **External System** | 🛜 **External API Boundary** | **External Systems Lane** | 🛜 **External Lifeline** | *Omitted* | *Omitted* | *Omitted* (No data schema stored) | ☁️ **SaaS Endpoint (Public Internet)** |

---

### 3. Synchronization Rules
* **Unified Journey Step**: Selecting a step in a Journey highlights the corresponding projected node/edge across all active diagrams simultaneously.
* **Respective Auto-Zooming**: Each active viewport independently centers and scales its camera to focus on the active node(s) for its own coordinate layout.
* **Unified Inspector**: Hovering or selecting an element displays its high-level description, low-level JSON payload, and database write status in a single unified side panel.

## Consequences
* Simplifies authoring: The author defines a single schema and gets 7 different diagram perspectives automatically.
* Codebase maintainability: Prevents desynchronization bugs where System Architecture updates but Sequence Diagrams do not.
* Layout compilation: The visual layout compiler must dynamically map coordinates, lanes, and lines based on the active projection mode.
