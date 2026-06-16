---
id: US-16
title: "AI Document Ingestion & Human Audit Pipeline Topic"
type: AFK
dependencies: ["US-13", "US-14", "US-15"]
e2eInfra: ["Playwright"]
---

# US-16: AI Document Ingestion & Human Audit Pipeline Topic

## What to build

Scaffold the new `doc-pipeline` topic under `src/topics/doc-pipeline/`.

1. Create `doc-schema.ts` defining the schema for document processing (Events, Commands, Policies, Aggregates, External OCR, LLM APIs).
2. Map these nodes to `EVENT_STORMING`, `SYS_ARCH`, `SWIMLANES`, `SEQUENCE`, and `DATA_FLOW` views.
3. Configure database table schemas for the `documents`, `extracted_fields`, and `audit_corrections` tables.
4. Implement two journeys: "Happy Path Extraction" and "Low Confidence Auditing".
5. Register the topic in `routes.ts` and `main.tsx`.

## Acceptance criteria

- [ ] AI Document Ingestion topic successfully mounts and displays in the UI navigation / overview page
- [ ] Happy Path journey executes successfully with JSON code previews and State Machine transitions
- [ ] Low Confidence Auditing journey runs, triggering the risk/human review phase on step 4
- [ ] Selecting database/aggregate nodes displays their correct ERD schemas in the sidebar

## Blocked by

- US-13 (Sequence Diagram View Projection)
- US-14 (Respective Auto-Zooming Camera Engine)
- US-15 (Unified Inspector Sidebar Widgets)

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
