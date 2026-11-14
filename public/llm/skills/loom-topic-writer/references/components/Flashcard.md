## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main visual/activity plus supporting text. Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

Flashcard(id: string, word: string, pronunciation: string, category: string, shortDefinition: string, detailedDefinition: string, whyItMatters: string, image?: string, dialogue?: Dialogue) — One focused term or question on the front and a coherent explanation on the back, for introduction or recall.
  - id: Card ID, unique within the deck.
  - word: One focused term or question on the front of the card.
  - pronunciation: How to say the term, e.g. "/ˈkæʃ/".
  - category: Grouping shown as a badge on the card (e.g. "concept").
  - shortDefinition: One-line definition shown on the back.
  - detailedDefinition: A coherent explanation shown on the back, with a concise example or common mistake when useful.
  - whyItMatters: Why the learner should care about this term.
  - image: Optional image URL or path shown on the card.
  - dialogue: Optional Dialogue(...) example that shows the term in use.
Dialogue(user: string, aiThoughts: string, aiQuestion: string) — Example exchange showing a term in use: what the user says, what the AI thinks, and its follow-up question.
  - user: What the user says, using the term.
  - aiThoughts: The AI's internal reasoning about the user's message.
  - aiQuestion: The follow-up question the AI asks back.

### Flashcard: teaching purpose

- Introduce: Introduce or recall one focused concept, term or question with a coherent explanation, example, dialogue or common mistake.
- Explore: Attempt recall and reveal the explanation in Read; Present demonstrates the authored front and back.
- Evidence: A flip or view records exposure, not correctness or mastery. Use a grounded assessment when checked evidence is required.
- Limits: Keep one focused idea per card and use the existing word and definition fields. Use TextContent for connected explanation or TaxonomyBrowser to organize kinds; do not invent automatic recall grading.

Flashcards teach individual concepts on first encounter as well as practising recall. Use a focused term or question on the front and one coherent explanation on the back, supported by a concise example, dialogue or common mistake when useful. For Svelte, a $state card can introduce its meaning, a small example and a misconception before recall practice. Keep one focused idea per card; use TextContent for a connected explanation and TaxonomyBrowser to organize kinds or distinguish categories.

Use the existing Flashcard fields: word carries the front's term or question, and shortDefinition, detailedDefinition and optional dialogue carry the explanation and examples. Do not invent prompt, answer or automatic-grading fields. Read lets the learner attempt recall and reveal the explanation; Present demonstrates front and back. Flipping or viewing a card records exposure, not correctness or mastery. Add a grounded assessment only when the learning goal requires observable evidence.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.
