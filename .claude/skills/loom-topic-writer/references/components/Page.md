## Focused component contracts

Page source rules: sections/<name>.oui must contain exactly one root = Page(...) statement. Its body composes the selected components; a bare Page(...) call is invalid source.

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main visual/activity plus supporting text. Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Include useful learner-visible reference links for deeper reading, with descriptive labels and supplied or checked destinations; keep the core lesson self-contained. See contracts/learner-references.md (installed skills: references/core/learner-references.md). Before adding image sources, read contracts/images.md and runtime.md (installed skills: references/core/images.md); a reachable HTTPS URL may still be blocked by the MCP host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

Page(title: string, body: any, heading?: string, lead?: Lead) — One authored page with one main visual or activity and supporting text. Present may explain it through several automatic scenes.
  - title: Page title used in navigation and the presentation title beat.
  - body: The page composition: text, layouts, visuals, controls and prebuilt activities from one catalog.
  - heading: Optional supporting explanation shown with the page.
  - lead: Optional Lead(...) page introduction: what, why and next; used by the presentation title beat.
Lead(what?: string, why?: string, next?: string) — Short lead-in shown above a section: what it shows, why it matters, and what comes next.
  - what: What this section shows, in one sentence.
  - why: Why it matters to the learner.
  - next: What the learner should do or look for next.

### Page: teaching purpose

- Introduce: Define one compositional learning unit with one main purpose and supporting content.
- Explore: Read supports inspection and authored interaction; Present guides automatic scenes from the same content with separate demonstration state.
- Evidence: Evidence belongs to meaningful learner responses, not to the page boundary or component count.
- Limits: Compose canonical components in the Page body. Preserve authored boundaries, exact contracts and narration targets; multiple internal scenes do not require nested pages or completion gates.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.
