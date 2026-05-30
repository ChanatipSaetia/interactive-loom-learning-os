---
id: US-3
title: "Overview Page"
type: AFK
dependencies: ["US-1"]
e2eInfra: ["Playwright"]
---

# US-3: Overview Page

## What to build

Topic overview page with Shadcn UI table that displays all topics with search, filter, pagination, and sort functionality.

## Components

- TopicTable: Shadcn DataTable with columns (Title, Description, Tags, Date)
- Search input with debounced filtering
- Filter chips for topic categories
- Pagination controls
- Sortable columns (click header to sort)

## Design

- White canvas, 8px border radius cards
- Hairline `#d9d9dd` row dividers
- Coral `#ff7759` filter chips
- Action-blue `#1863dc` links
- No heavy shadows, thin borders

## Acceptance criteria

- [ ] Overview page at `/` shows table of topics from routes.ts
- [ ] Search input filters topics by title and description
- [ ] Filter chips narrow by category/tag
- [ ] Pagination shows configurable rows per page
- [ ] Column headers are clickable for sort (asc/desc)
- [ ] Clicking topic navigates to topic page
- [ ] E2E: Playwright loads overview, searches, filters, and clicks topic link

## E2E infrastructure required

Playwright for table interaction and navigation tests.

## Blocked by

US-1.
