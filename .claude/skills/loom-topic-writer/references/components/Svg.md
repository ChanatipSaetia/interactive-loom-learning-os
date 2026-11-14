## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main visual/activity plus supporting text. Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

Svg(markup: string, caption?: string) — A drawing written as inline SVG markup (one <svg viewBox="…"> element), with an optional caption under it. Color names of the Loom palette (blue, peach, green, mauve, red, yellow, teal, text, subtext0, overlay1, surface0, …) follow the theme; shapes without a fill take the text color. Give the shapes narration will point at an id. No scripts, links, images or foreignObject.

### Svg: teaching purpose

- Introduce: Explain spatial structure, anatomy, a mechanism, geometry or a clearly labelled analogy.
- Explore: Inspect labelled parts and relationships; supported shape IDs can focus narration on meaningful details.
- Evidence: Viewing, opening or selecting is engagement; ask for an observable explanation or application when the objective requires evidence.
- Limits: Label conceptual or not-to-scale drawings when needed. Keep figures readable and accessible; do not use arbitrary geometry as measured evidence or assume a drawing executes the represented system.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.
