---
id: US-11
title: "Demo Topic - REST API vs WebSocket"
type: AFK
dependencies: ["US-4", "US-5", "US-6", "US-7", "US-8", "US-9", "US-10"]
e2eInfra: ["Playwright"]
---

# US-11: Demo Topic - REST API vs WebSocket

## What to build

Complete demo topic page comparing REST API vs WebSocket. Composes all section types to showcase the platform's capabilities and serve as a template for future topics.

## Sections (in order)

1. **Text:** Introduction - "Communication Patterns: REST API vs WebSocket"
2. **ArchitectureFlow:** REST architecture (client -> server -> client) vs WebSocket (client <-> server persistent)
3. **DataFlow:** Request/response cycle (REST) vs bidirectional streaming (WebSocket)
4. **Bullets:** Key differences summary (connection model, latency, scalability, use cases)
5. **StepByStep:** REST request lifecycle (6 steps: DNS -> TCP -> HTTP -> Process -> Response -> Render)
6. **DragDrop:** Categorize scenarios into "REST" or "WebSocket" (e.g., file upload, live chat, notifications)
7. **Choice:** Pros/cons of each with selectable comparison cards
8. **Text:** Conclusion and when to use each

## Route config

```typescript
{
  path: '/demo/rest-vs-websocket',
  title: 'REST API vs WebSocket',
  description: 'Interactive comparison of communication patterns',
  tags: ['networking', 'architecture', 'comparison']
}
```

## Acceptance criteria

- [ ] Topic page loads at `/demo/rest-vs-websocket`
- [ ] All 8 sections render in order with proper spacing
- [ ] ArchitectureFlow shows both REST and WebSocket diagrams with animation
- [ ] DataFlow shows animated particles for both patterns
- [ ] StepByStep walks through 6-step REST lifecycle with next/prev
- [ ] DragDrop exercise validates scenario categorization
- [ ] Choice section shows pros/cons for both options
- [ ] Topic appears in overview page table
- [ ] E2E: Playwright navigates through all sections and interacts with each

## E2E infrastructure required

Playwright for full topic page interaction and navigation tests.

## Blocked by

US-4, US-5, US-6, US-7, US-8, US-9, US-10.
