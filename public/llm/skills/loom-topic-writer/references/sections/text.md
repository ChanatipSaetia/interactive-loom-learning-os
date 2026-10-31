# text

Connected explanation and narrative. Why does this happen, or how should I understand the explanation? Use for connected prose, reasoning or context beyond a concise definition.

Read [shared components](../core/components.md) and [narration](../core/narration.md) before writing.

## Component signatures

Text(title: string, paragraphs: string[], heading?: string, lead?: Lead) — Prose section: one string per paragraph.
  - title: Section title, shown in the topic outline and as the section header.
  - paragraphs: The paragraphs, one string each, in order.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.

## Presentation beats

`title`, then `p1`, `p2`, … for each paragraph; long prose continues as `p1.part2`, `p1.part3`, … in short scenes, preserving Markdown constructs
