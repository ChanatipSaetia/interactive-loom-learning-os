# flashcards

Definitions, meaning, vocabulary and recall. What does this term or concept mean? Introduce or recall one focused idea per card, with a coherent explanation and concise example or dialogue. A flip is exposure, not correctness.

Read [shared components](../core/components.md) and [narration](../core/narration.md) before writing.

## Component signatures

Flashcards(title: string, cards: Flashcard[], heading?: string, lead?: Lead) — Introduce individual concepts and meanings, then practise recall with focused explanation cards. Examples and dialogue can clarify meaning; a flip records exposure, not correctness.
  - title: Section title, shown in the topic outline and as the section header.
  - cards: The cards, as Flashcard references, in deck order.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
Dialogue(user: string, aiThoughts: string, aiQuestion: string) — Example exchange showing a term in use: what the user says, what the AI thinks, and its follow-up question.
  - user: What the user says, using the term.
  - aiThoughts: The AI's internal reasoning about the user's message.
  - aiQuestion: The follow-up question the AI asks back.
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

## Presentation beats

`title`, then `card1`, `card1.back`, `card2`, … per card: its word, then its definition

Flashcards teach individual concepts on first encounter as well as practising recall. Use a focused term or question on the front and one coherent explanation on the back, supported by a concise example, dialogue or common mistake when useful. For Svelte, a $state card can introduce its meaning, a small example and a misconception before recall practice. Keep one focused idea per card; use TextContent for a connected explanation and TaxonomyBrowser to organize kinds or distinguish categories.

Use the existing Flashcard fields: word carries the front's term or question, and shortDefinition, detailedDefinition and optional dialogue carry the explanation and examples. Do not invent prompt, answer or automatic-grading fields. Read lets the learner attempt recall and reveal the explanation; Present demonstrates front and back. Flipping or viewing a card records exposure, not correctness or mastery. Add a grounded assessment only when the learning goal requires observable evidence.
