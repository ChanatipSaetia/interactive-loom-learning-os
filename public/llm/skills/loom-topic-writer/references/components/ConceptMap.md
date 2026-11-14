## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main learner action with complementary cards, images, text, charts and reference links where useful; these compose one page, not separate content modes. Proactively include visual examples for visual subjects and visible sources for researched claims. See contracts/media-composition.md (installed skills: references/planning/media-composition.md). Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Include useful learner-visible reference links for deeper reading, with descriptive labels and supplied or checked destinations; keep the core lesson self-contained. See contracts/learner-references.md (installed skills: references/core/learner-references.md). Before adding image sources, read contracts/images.md and runtime.md (installed skills: references/core/images.md); a reachable HTTPS URL may still be blocked by the MCP host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

ConceptMap(title: string, concepts: Concept[], links: ConceptLink[], heading?: string, lead?: Lead) — Knowledge graph of concepts and the relations between them.
  - title: Section title, shown in the topic outline and as the section header.
  - concepts: The nodes, as Concept references.
  - links: The edges between concepts, as ConceptLink references.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
Concept(id: string, title: string, category?: string) — A node in a concept map.
  - id: Concept ID, unique within the map; links point at it.
  - title: Label shown on the node.
  - category: Optional node colour group: pattern, mechanism, concept, role, system, data or process.
ConceptLink(from: string | Concept, to: string | Concept, label?: string) — A labelled relation between two concepts (references or concept IDs).
  - from: Source concept (Concept reference or ID).
  - to: Target concept (Concept reference or ID).
  - label: A short verb phrase that makes from + label + to a meaningful statement, e.g. "uses", "is a", "contains" or "depends on". Present explains each relation in this authored direction; do not imply causality or data flow unless that is what the label means. An omitted label is shown neutrally as "is connected to".
Lead(what?: string, why?: string, next?: string) — Short lead-in shown above a section: what it shows, why it matters, and what comes next.
  - what: What this section shows, in one sentence.
  - why: Why it matters to the learner.
  - next: What the learner should do or look for next.

### ConceptMap: teaching purpose

- Introduce: Introduce concepts and teach how they connect, depend on, support or differ from one another; a map can carry the main explanation.
- Explore: Inspect named concepts, examples and labelled relationships; Present introduces groups and connections from the same authored graph.
- Evidence: A displayed map does not show that a learner can explain or reconstruct its relationships. Use a grounded response if needed.
- Limits: Label relationships precisely. Do not imply causation, sequence or equivalence through an unlabelled connection. TaxonomyBrowser organizes kinds; Flowchart traces a process. The current map is not automatically a matching exercise.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.

### ConceptMap presentation beats
`title`, then `group1`, `group2`, … introduce categories in first-appearance order; after each group, `linkN` explains every ConceptLink whose endpoints are now introduced (N is its 1-based position in the links list); then `map` shows the complete map when there are links or several groups. Explain from → label → to without assuming every relation is a flow or a cause.
