## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main visual/activity plus supporting text. Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

DomainRef(id: string) — Includes the domain folder Loom/<id>/ (its domain.oui) in the library.
  - id: Domain ID: the folder name under Loom/, lowercase letters, digits, - and _ (e.g. "fight-animation").

### DomainRef: teaching purpose

- Introduce: Organize authored learning content and its navigation or storage references.
- Explore: Identify the relevant topic or page and follow its declared order and identifiers.
- Evidence: Navigation or source presence is not learning evidence.
- Limits: These are document/navigation contracts, not standalone teaching activities. Follow the exact document role, paths and storage authorization; showing is not saving.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.
