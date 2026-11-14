# taxonomy-browser

Classification and distinctions. What kinds exist, what defines them, and how do I recognise their differences? Introduce meaningful categories with examples and explain overlaps; use relationships only when the subject supports them.

Read [shared components](../core/components.md) and [narration](../core/narration.md) before writing.

## Component signatures

TaxonomyBrowser(title: string, categories: TaxonomyCategory[], heading?: string, lead?: Lead) — Introduce and explore meaningful categories with defining features, examples, scope and distinctions. Explain overlaps when relevant; browsing alone is not classification evidence.
  - title: Section title, shown in the topic outline and as the section header.
  - categories: The categories, as TaxonomyCategory references.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
TaxonomyCategory(title: string, subtitle: string, icon: string, color: string, description: string, details: string, analogy: string, primaryFocus: string, inScope: string[], outOfScope: string[]) — A category card in a taxonomy browser. `color` is a theme color name (e.g. "blue", "mauve").
  - title: Category name shown on the card.
  - subtitle: Short tagline under the name.
  - icon: lucide-react icon name, e.g. "Brain" (falls back to a circle).
  - color: Accent colour: blue, peach, pink, mauve, green, teal, sky, lavender, yellow or red.
  - description: Summary shown on the card.
  - details: Explanation with examples, distinguishing features and any overlapping scope, shown in the category details.
  - analogy: Everyday analogy for the category.
  - primaryFocus: The main concern of this category, in one line.
  - inScope: What belongs in this category.
  - outOfScope: What does not belong here (and often where it goes instead).

## Presentation beats

`title`, then `cards` (all cards), then `card1`, `card2`, … each card opened

TaxonomyBrowser introduces and explains meaningful kinds as well as supporting classification. Each category should state its defining features, give examples and distinguish nearby categories. Compare a compact Table or grouped cards for scanning, ConceptMap for labelled relationships and DecisionTree for rule-based identification. Select by the learner's question, without requiring every representation.

For an introduction to Svelte, categories could organize components, reactivity, composition and lifecycle when their scope is clearly explained. Categories may overlap; explain shared examples instead of forcing a mutually exclusive partition. Use parent-child relationships only when the subject supports them. The current TaxonomyBrowser contract is a flat category browser: describe relevant relationships in its existing fields or select a suitable relationship component; do not invent nested category or parent fields. Preserve dependencies and process order through an appropriate representation. Browsing is exploration; classification practice requires an observable learner response.
