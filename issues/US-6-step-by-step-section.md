---
id: US-6
title: "StepByStep Section"
type: AFK
dependencies: ["US-2"]
e2eInfra: ["Playwright"]
---

# US-6: StepByStep Section

## What to build

Reusable section component for progressive, step-by-step reveal of content. Each step shows text, diagrams, or animations that build on previous steps. User controls with Next/Prev buttons.

## Features

- Configurable steps with mixed content (text, SVG, code blocks)
- Progress indicator (dots or numbered bar)
- Next/Prev buttons (pill-style per Cohere)
- Content fades/slides in per step using anime.js
- Step state tracked with `useState`

## Configuration

```typescript
interface StepByStepConfig {
  steps: Array<{
    id: string
    title: string
    content: React.ReactNode  // text, SVG, code, etc.
    animation?: 'fade' | 'slide-left' | 'slide-up' | 'none'
  }>
}
```

## Design

- Progress bar: hairline `#d9d9dd` with action-blue `#1863dc` fill
- Next button: pill primary `#17171c`
- Prev button: pill outline
- Step titles: feature-heading typography (24px)

## Acceptance criteria

- [ ] Section renders current step content
- [ ] Next/Prev buttons advance/retreat steps
- [ ] Progress indicator shows current position
- [ ] Content animates in per step (fade/slide)
- [ ] First/last step disable Prev/Next appropriately
- [ ] Section registers with SectionRegistry
- [ ] E2E: Playwright clicks Next/Prev and verifies step content changes

## E2E infrastructure required

Playwright for button interaction and step navigation tests.

## Blocked by

US-2.
