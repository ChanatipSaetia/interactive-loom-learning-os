## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main visual/activity plus supporting text. Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

NarrationCallout(target: string, text: string) — Narration effect: a note that pops up beside one element of the section, with explanation the section does not say itself.
  - target: Pick pointer to what it points at in the section file: a statement name, optionally with a prop path, e.g. "noCache", "q2.explanation", "root.categories[0]".
  - text: The note, one or two short sentences. Narration reads it after the caption.

### NarrationCallout: teaching purpose

- Introduce: Explain and focus attention on already-authored content during Present.
- Explore: Follow supported beats and real effect targets; captions should connect and explain the content.
- Evidence: Narration and demonstrated answers do not count as learner attempts or mastery.
- Limits: Use valid beat IDs, resolvable targets and supported view controls. Do not invent narrative content as evidence that an external system ran or a learner answered.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.
