## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main visual/activity plus supporting text. Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Include useful learner-visible reference links for deeper reading, with descriptive labels and supplied or checked destinations; keep the core lesson self-contained. See contracts/learner-references.md (installed skills: references/core/learner-references.md). Before adding image sources, read contracts/images.md and runtime.md (installed skills: references/core/images.md); a reachable HTTPS URL may still be blocked by the MCP host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

MatrixBlock(id: string, title: string, layer: string | Layer, colOffset?: number, colSpan?: number, rowSpan?: number, description?: string, color?: string, dependsOn?: string[], shape?: "rect" | "l-bottom-left" | "l-bottom-right" | "l-top-left" | "l-top-right", offsets?: number[][], group?: string) — A block placed on the matrix, anchored at `layer` (reference or ID) and `colOffset`. Spans default to 1; `shape` is "rect" or an L-shape. `dependsOn` lists block IDs.
  - id: Block ID, unique within the map; `dependsOn` refers to it.
  - title: Text shown on the block.
  - layer: Anchor row: Layer reference or ID.
  - colOffset: Optional anchor column, from 0 (default 0).
  - colSpan: Optional number of columns covered (default 1).
  - rowSpan: Optional number of rows covered, downward (default 1).
  - description: Optional detail shown when the block is selected.
  - color: Optional accent: rosewater, flamingo, pink, mauve, red, maroon, peach, yellow, green, teal, sky, sapphire, blue or lavender.
  - dependsOn: Optional IDs of blocks this block depends on.
  - shape: Optional "rect" (default) or an L-shape inside the span: "l-bottom-left", "l-bottom-right", "l-top-left", "l-top-right".
  - offsets: Optional custom shape: [rowOffset, colOffset] cells relative to the anchor. Overrides spans and shape.
  - group: Optional named outer container in Present mode. Blocks with the same group within a single-row layer share a box; different groups sit side by side.
Layer(id: string, title: string, description?: string, items?: LayerItem[]) — A horizontal layer (row) of a pillar/layer matrix.
  - id: Layer ID, unique within the map; blocks refer to it with `layer`.
  - title: Layer name shown at the start of the row.
  - description: Optional layer summary.
  - items: Optional items listed for this layer, as LayerItem references.
LayerItem(title: string, description?: string) — A labelled item listed inside a layer.
  - title: Item name.
  - description: Optional detail.

### MatrixBlock: teaching purpose

- Introduce: Define the MatrixBlock content or configuration consumed by its owning component.
- Explore: Inspect it through the owning component and its documented behavior.
- Evidence: A supporting data declaration does not independently provide learning evidence.
- Limits: Use the exact required fields and references. This supporting contract does not imply an independently rendered activity, interaction, grading or persistence.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.
