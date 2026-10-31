# intro

Orientation, purpose and roadmap. What will I learn, why does it matter, and where are we going?

Read [shared components](../core/components.md) and [narration](../core/narration.md) before writing.

## Component signatures

Intro(title: string, what: IntroWhat, why: IntroWhy, roadmap?: RoadmapStep[], subtitle?: string, estimatedTime?: string, moduleCount?: number, displayTitle?: string, heading?: string, lead?: Lead) — Topic opener: what it is, why it matters, and a roadmap of the sections ahead. `displayTitle` overrides the title shown inside the card.
  - title: Section title, shown in the topic outline and as the section header.
  - what: IntroWhat(...) panel: what the topic is.
  - why: IntroWhy(...) panel: why it matters.
  - roadmap: Optional preview of the sections ahead, as RoadmapStep references.
  - subtitle: Optional tagline under the title.
  - estimatedTime: Optional time to complete, e.g. "25 min".
  - moduleCount: Optional number of modules shown in the header.
  - displayTitle: Optional title shown inside the card instead of `title`.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
IntroWhat(summary: string, definition?: string, bullets?: string[], tags?: string[]) — The "what is it" panel of a topic intro.
  - summary: One-paragraph answer to "what is it?".
  - definition: Optional formal one-line definition.
  - bullets: Optional key points.
  - tags: Optional short keyword tags.
IntroWhy(summary: string, impact?: string) — The "why it matters" panel of a topic intro.
  - summary: One-paragraph answer to "why does it matter?".
  - impact: Optional concrete impact or payoff.
RoadmapStep(title: string, type: string, description: string, sectionId?: string) — A roadmap entry previewing a later section. `type` is the section type (e.g. "quiz"); `sectionId` its file name.
  - title: Name of the upcoming section.
  - type: Section type it previews, e.g. "quiz" or "flowchart".
  - description: What the learner will do there.
  - sectionId: Optional section file name (without .oui) to link to.

## Presentation beats

`title` (when it has a title or tagline), `what`, `why`, `roadmap` (when it has a roadmap)
