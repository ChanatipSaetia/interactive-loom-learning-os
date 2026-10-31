# concept-map

Relationships between concepts. How do ideas connect, depend on, support or differ from each other? Label the relationship explicitly.

Read [shared components](../core/components.md) and [narration](../core/narration.md) before writing.

## Component signatures

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

## Presentation beats

`title`, then `group1`, `group2`, … introduce categories in first-appearance order; after each group, `linkN` explains every ConceptLink whose endpoints are now introduced (N is its 1-based position in the links list); then `map` shows the complete map when there are links or several groups. Explain from → label → to without assuming every relation is a flow or a cause.
