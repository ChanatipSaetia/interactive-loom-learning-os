# pillar-layer

Layered dependency and foundation. What builds on or is supported by what? Examples include network layers or cloud foundation → agent runtime → application.

Read [shared components](../core/components.md) and [narration](../core/narration.md) before writing.

## Component signatures

PillarLayer(title: string, layers: Layer[], blocks: MatrixBlock[], description?: string, displayTitle?: string, heading?: string, lead?: Lead) — Layer-stack map: layers as rows (foundation last), blocks placed on a gap-free grid. Give blocks `dependsOn` so readers can tap a block to trace what it needs and what it affects. `displayTitle` overrides the title shown inside the map.
  - title: Section title, shown in the topic outline and as the section header.
  - layers: The rows, top to bottom, as Layer references.
  - blocks: Blocks placed on the grid, as MatrixBlock references. Together they must fill the grid without gaps.
  - description: Optional summary shown above the map; say what the reader should take away from the stack.
  - displayTitle: Optional title shown inside the map instead of `title`.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
Layer(id: string, title: string, description?: string, items?: LayerItem[]) — A horizontal layer (row) of a pillar/layer matrix.
  - id: Layer ID, unique within the map; blocks refer to it with `layer`.
  - title: Layer name shown at the start of the row.
  - description: Optional layer summary.
  - items: Optional items listed for this layer, as LayerItem references.
LayerItem(title: string, description?: string) — A labelled item listed inside a layer.
  - title: Item name.
  - description: Optional detail.
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

## Presentation beats

`title`, then `layerN` … `layer1` (foundation first; N is the authored top-to-bottom layer index); extra peer groups use `layerN.group2`, `layerN.group3`, …; then `overview`

## Layer Composition

- Use `PillarLayer` when the learner needs to understand a foundation supporting higher responsibilities: network protocols or a deployment stack, for example. Put layers in top-to-bottom order with the foundation last. Horizontal position means peers within one level; place components inside their actual layer rather than making every component another layer.
- For simple contained bands in Present, use rectangular `MatrixBlock`s with `rowSpan = 1`. Keep titles short and put explanations in `description`: Present shows names only, while Read retains descriptions and dependency exploration. Use multi-row spans and shapes only when those relationships matter; those use the matrix presentation.
- A layer can contain several separate outer boxes. Set the trailing `group` argument on each block to its container's name, such as `"Tools"` or `"Knowledge"`. Matching names within the same layer share one box; different names form peer boxes on the same row. Blocks without a group share the layer-title box. Group names are authored explicitly and are scoped to the layer; they are not extra layers or inferred from titles.
- Present uses a soft color tint and accent border on each outer box, with neutral white inner items in the light theme (neutral surfaces in dark themes). Set `color` on the group's first block to choose its outer accent, and use a consistent color for the group's blocks. Keep subitems visually neutral; do not add colored cards, HTML, CSS, emoji or icon arguments to force a different item appearance.
- Use `colOffset` and `colSpan` to fill the grid without gaps or overlaps. In grouped Present rows, each box's width is proportional to its members' total column spans; items stay contained within their box. For example, Agent can hold Plan & Execute and Policy & Approvals, alongside separate Database and Cloud Run boxes at the same level.
- `MatrixBlock(id, title, layer, colOffset?, colSpan?, rowSpan?, description?, color?, dependsOn?, shape?, offsets?, group?)` is positional. Skip optional values with `null` before `group`, as in the example. Set `dependsOn` to real block IDs for Read's dependency tracing; shared group membership does not create dependencies.
- Narrate from the foundation upward. Beat IDs keep their authored top-to-bottom layer identity: for three layers, playback starts with `layer3`, then `layer2`, then `layer1`. Each layer's first group uses its `layerN` beat; later groups use `layerN.group2`, `layerN.group3`, … in first-appearance order among that layer's blocks. Earlier groups and layers stay visible. Finish with `overview` to connect the whole stack. The stage adds `title` before these beats. Explain what each level enables and how peer groups differ; narration can highlight individual block IDs without adding a beat per item. Label illustrative architectures and simplifications so learners do not mistake one deployment choice for a mandatory architecture.

Example section (`sections/agent-foundation.oui`):

```
root = PillarLayer("Actions and knowledge build on a foundation", [capabilities, foundation], [tools, connectors, retrieval, search, compute, storage])
capabilities = Layer("capabilities", "Tools & Knowledge")
foundation = Layer("foundation", "Cloud Foundation")
tools = MatrixBlock("tools", "Tool Execution", capabilities, 0, 1, 1, "Runs permitted actions.", "teal", ["compute"], null, null, "Tools")
connectors = MatrixBlock("connectors", "APIs & Connectors", capabilities, 1, 1, 1, "Connects to external services.", "teal", ["compute"], null, null, "Tools")
retrieval = MatrixBlock("retrieval", "Knowledge Retrieval", capabilities, 2, 1, 1, "Finds relevant source material.", "green", ["storage"], null, null, "Knowledge")
search = MatrixBlock("search", "Document Search", capabilities, 3, 1, 1, "Searches indexed documents.", "green", ["storage"], null, null, "Knowledge")
compute = MatrixBlock("compute", "Compute", foundation, 0, 2, 1, "Hosts the services.", "blue")
storage = MatrixBlock("storage", "Storage", foundation, 2, 2, 1, "Persists documents and indexes.", "blue")
```

Matching narration (`sections/agent-foundation.narrate.oui`):

```
root = Narration([
  NarrationStep("title", "Separate the capabilities an agent uses from the foundation that runs them."),
  NarrationStep("layer2", "Compute hosts the services, while storage persists their documents and indexes."),
  NarrationStep("layer1", "Tools perform actions. Connectors give those actions access to external services.", [Highlight("tools"), Highlight("connectors")]),
  NarrationStep("layer1.group2", "Knowledge capabilities find source material through retrieval and search.", [Highlight("retrieval"), Highlight("search")]),
  NarrationStep("overview", "Both action and knowledge services rely on the cloud foundation below. These boxes represent responsibilities, not a required deployment architecture.")
])
```
