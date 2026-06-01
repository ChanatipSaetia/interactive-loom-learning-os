# Interactive Loom Learning OS

Interactive React-based learning platform for teaching IT architecture, operating models, and mental models through animated flowcharts.

## Language

**Flowchart**:
The single unified visualization component. Static layout of nodes (boxes) and edges (connections) with step-by-step animations. Replaces the old `architecture-flow` and `data-flow` sections.
_Avoid_: Architecture Flow, Data Flow, Diagram

**Node**:
A rectangular box in the flowchart representing a system component, concept, or entity. Contains a stereotype tag (`<<xxx>>`), a Lucide icon, and a label.
_Avoid_: Box, Element, Shape

**Edge**:
A straight line with arrowhead connecting two nodes. No labels. Represents a relationship or data flow between nodes.
_Avoid_: Connection, Link, Line

**Journey**:
An ordered sequence of node highlights that tells a story through the flowchart (e.g., Register Journey, Checkout Journey). Selected via dropdown. Switching journeys resets to step 0.
_Avoid_: Path, Flow, Sequence, Scenario

**Step**:
A single position within a journey. One step = one highlighted node + its description. Moving to the next step triggers a particle animation along the edge to the next node.
_Avoid_: Stage, Phase, Tick

**Step Description**:
Text that appears near the highlighted node and disappears when the step changes. Does not move between nodes — appears fresh at each new node.
_Avoid_: Tooltip, Caption, Annotation

**Layer**:
A horizontal band in the top-to-bottom layout where nodes sit at the same vertical level. Determined by auto-layout algorithm with author override.
_Avoid_: Level, Row, Tier

**Stereotype**:
A UML-style tag (`<<service>>`, `<<database>>`, `<<client>>`) displayed above the node's icon/label to categorize the node type.
_Avoid_: Type, Tag, Category

**Zoom + Pan**:
Mobile interaction mode. Flowchart scales via SVG viewBox; user pinch-zooms and pans to explore. Preserves layout intent on small screens.
_Avoid_: Responsive, Scroll, Re-flow
