## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main learner action with complementary cards, images, text, charts and reference links where useful; these compose one page, not separate content modes. Proactively include visual examples for visual subjects and visible sources for researched claims. See contracts/media-composition.md (installed skills: references/planning/media-composition.md). Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Include useful learner-visible reference links for deeper reading, with descriptive labels and supplied or checked destinations; keep the core lesson self-contained. See contracts/learner-references.md (installed skills: references/core/learner-references.md). Before adding image sources, read contracts/images.md and runtime.md (installed skills: references/core/images.md); a reachable HTTPS URL may still be blocked by the MCP host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

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
Lead(what?: string, why?: string, next?: string) — Short lead-in shown above a section: what it shows, why it matters, and what comes next.
  - what: What this section shows, in one sentence.
  - why: Why it matters to the learner.
  - next: What the learner should do or look for next.

### TaxonomyBrowser: teaching purpose

- Introduce: Introduce and organize meaningful kinds with defining features, examples and distinctions, including first encounters with a domain.
- Explore: Inspect category scopes and shared or distinguishing features; explain overlaps where they exist.
- Evidence: Browsing is exploration; classification evidence requires an observable learner response.
- Limits: The current category browser is flat. Do not invent nested category fields or force mutually exclusive groups. Use ConceptMap for relationships and DecisionTree for identification rules.

TaxonomyBrowser introduces and explains meaningful kinds as well as supporting classification. Each category should state its defining features, give examples and distinguish nearby categories. Compare a compact Table or grouped cards for scanning, ConceptMap for labelled relationships and DecisionTree for rule-based identification. Select by the learner's question, without requiring every representation.

For an introduction to Svelte, categories could organize components, reactivity, composition and lifecycle when their scope is clearly explained. Categories may overlap; explain shared examples instead of forcing a mutually exclusive partition. Use parent-child relationships only when the subject supports them. The current TaxonomyBrowser contract is a flat category browser: describe relevant relationships in its existing fields or select a suitable relationship component; do not invent nested category or parent fields. Preserve dependencies and process order through an appropriate representation. Browsing is exploration; classification practice requires an observable learner response.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.

### TaxonomyBrowser presentation beats
`title`, then `cards` (all cards), then `card1`, `card2`, … each card opened
