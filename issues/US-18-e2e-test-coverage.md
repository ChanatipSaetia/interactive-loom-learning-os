---
id: US-18
title: "E2E Test Coverage for Synchronized Grid"
type: AFK
dependencies: ["US-16", "US-17"]
e2eInfra: ["Playwright"]
---

# US-18: E2E Test Coverage for Synchronized Grid

## What to build

Add Playwright E2E and Vitest unit test suites covering the layout switching and synchronized diagram highlight systems. 

Test that playback steps correctly highlight nodes in all active SVGs in Grid Mode in both new topics. Verify that clicking aggregates pulls up the database ERD schemas, and that JSON and state machines update correctly on step changes.

## Acceptance criteria

- [ ] Unit tests pass for viewport camera auto-zoom and Grid mode coordinates
- [ ] Playwright E2E tests navigate to both new topics, toggle Grid Mode, play the journeys, and verify multi-diagram synchronization
- [ ] E2E tests verify that the JSON Payload and State Machine update correctly on step changes
- [ ] E2E tests verify that selecting database/aggregate nodes displays their correct ERD schemas

## Blocked by

- US-16 (AI Document Ingestion & Human Audit Pipeline Topic)
- US-17 (E-Commerce Automated Order Processing & Fraud Check Topic)

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
