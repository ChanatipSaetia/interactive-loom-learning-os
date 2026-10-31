# taxonomy-browser

Classification and distinctions. What kinds exist, what defines them, and how do I recognise their differences?

Read [shared components](../core/components.md) and [narration](../core/narration.md) before writing.

## Component signatures

TaxonomyBrowser(title: string, categories: TaxonomyCategory[], heading?: string, lead?: Lead) — Browsable taxonomy of categories with scope, analogy and details.
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
  - details: Longer explanation shown in the category details.
  - analogy: Everyday analogy for the category.
  - primaryFocus: The main concern of this category, in one line.
  - inScope: What belongs in this category.
  - outOfScope: What does not belong here (and often where it goes instead).

## Presentation beats

`title`, then `cards` (all cards), then `card1`, `card2`, … each card opened
