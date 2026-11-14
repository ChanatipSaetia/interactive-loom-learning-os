## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main learner action with complementary cards, images, text, charts and reference links where useful; these compose one page, not separate content modes. Proactively include visual examples for visual subjects and visible sources for researched claims. See contracts/media-composition.md (installed skills: references/planning/media-composition.md). Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Include useful learner-visible reference links for deeper reading, with descriptive labels and supplied or checked destinations; keep the core lesson self-contained. See contracts/learner-references.md (installed skills: references/core/learner-references.md). Before adding image sources, read contracts/images.md and runtime.md (installed skills: references/core/images.md); a reachable HTTPS URL may still be blocked by the MCP host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

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
Lead(what?: string, why?: string, next?: string) — Short lead-in shown above a section: what it shows, why it matters, and what comes next.
  - what: What this section shows, in one sentence.
  - why: Why it matters to the learner.
  - next: What the learner should do or look for next.

### Intro: teaching purpose

- Introduce: Orient the learner through the topic’s purpose, significance and roadmap.
- Explore: Connect the opening question and motivation to the upcoming learning activities.
- Evidence: Viewing, opening or selecting is engagement; ask for an observable explanation or application when the objective requires evidence.
- Limits: Keep orientation focused and grounded. Intro is a prebuilt option alongside text and cards, not a mandatory first page or evidence of understanding.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.

### Intro presentation beats
`title` (when it has a title or tagline), `what`, `why`, `roadmap` (when it has a roadmap)
