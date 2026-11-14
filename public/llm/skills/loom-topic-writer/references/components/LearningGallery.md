## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main visual/activity plus supporting text. Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

LearningGallery(title: string, images: GalleryImage[], heading?: string, lead?: Lead) — Gallery of captioned images.
  - title: Section title, shown in the topic outline and as the section header.
  - images: The images, as GalleryImage references, in order.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
GalleryImage(id: string, url: string, caption: string, credit?: string) — An image in a gallery.
  - id: Image ID, unique within the gallery.
  - url: Image URL or path.
  - caption: Caption shown under the image.
  - credit: Optional attribution.
Lead(what?: string, why?: string, next?: string) — Short lead-in shown above a section: what it shows, why it matters, and what comes next.
  - what: What this section shows, in one sentence.
  - why: Why it matters to the learner.
  - next: What the learner should do or look for next.

### LearningGallery: teaching purpose

- Introduce: Teach visual recognition and concrete examples by showing relevant features, variations and distinctions.
- Explore: Inspect and compare images with explanatory labels or captions; use the selected gallery’s actual preview and presentation behavior.
- Evidence: Viewing, zooming or switching images is engagement. Recognition evidence requires a response that identifies or explains a feature.
- Limits: Images must contribute to the learning goal, remain legible and use supported accessibility/attribution fields. Do not infer hidden mechanisms from a photograph or claim a gallery provides a classification test.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.

### LearningGallery presentation beats
`title`, then `image1`, `image2`, … one per image
