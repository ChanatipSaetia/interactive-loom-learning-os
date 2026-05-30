---
id: US-9
title: "Text Section"
type: AFK
dependencies: ["US-2"]
e2eInfra: []
---

# US-9: Text Section

## What to build

Simple reusable section for prose paragraphs and explanations. Supports headings, paragraphs, inline code, and links.

## Features

- Markdown-like content rendering
- Heading levels (h2, h3)
- Paragraphs with proper line height
- Inline code with monospace styling
- Links with action-blue color and underline
- Optional anime.js entrance animation

## Configuration

```typescript
interface TextConfig {
  content: string  // markdown or React.ReactNode
  animation?: 'fade' | 'slide-up' | 'none'
}
```

## Design

- Body text: 16px, line-height 1.5, ink `#212121`
- Headings: 24-48px per Cohere scale
- Inline code: mono styling, soft-stone background
- Links: action-blue `#1863dc`, underline on hover
- Max-width: 720px for readability

## Acceptance criteria

- [ ] Section renders prose content with proper typography
- [ ] Headings follow Cohere scale
- [ ] Inline code renders with monospace styling
- [ ] Links styled with action-blue and underline
- [ ] Optional entrance animation works
- [ ] Section registers with SectionRegistry
- [ ] Unit tests pass for content rendering

## E2E infrastructure required

None. Unit tests sufficient for text rendering.

## Blocked by

US-2.
