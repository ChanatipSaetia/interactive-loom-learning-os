# REQUESTs.md

## Objective
Show static multiple pages of interactive React for topics.

## Requirements
- **Flowchart** — Single unified component to visualize any architecture, operating model, or mental model
  - Static flowchart layout (boxes, connections, structure)
  - Journey selector to switch between journeys (e.g., Register journey, Checkout journey)
  - Step-by-step animation follows the selected journey's sequence of boxes
  - Description panel shows context for the currently highlighted box
  - Not tied to any specific technology — generic and reusable
  - **Replaces** the old `architecture-flow` and `data-flow` sections with this single component
- Tables or graphs to display data
- Select choices with pros and cons for design choices

## Structure
- Separate layer for main app vs topic pages
- Each topic page developed independently (by myself or AI assistant)
- Topic pages grow over time as topics are added
- Overview page: table of topic records with search, filter, pagination, sort

## Tech Stack
- TypeScript + Node.js
- React + React Router
- Vite (build tool)
- anime.js
