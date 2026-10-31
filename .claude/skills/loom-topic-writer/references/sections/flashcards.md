# flashcards

Definitions, meaning, vocabulary and recall. What does this term or concept mean? Teach its meaning on the back of a card, then use it for recall; flashcards introduce concepts as well as practise them.

Read [shared components](../core/components.md) and [narration](../core/narration.md) before writing.

## Component signatures

Flashcards(title: string, cards: Flashcard[], heading?: string, lead?: Lead) — Deck of flip cards for key vocabulary.
  - title: Section title, shown in the topic outline and as the section header.
  - cards: The cards, as Flashcard references, in deck order.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
Flashcard(id: string, word: string, pronunciation: string, category: string, shortDefinition: string, detailedDefinition: string, whyItMatters: string, image?: string, dialogue?: Dialogue) — A vocabulary flip card: the term on the front, definitions on the back.
  - id: Card ID, unique within the deck.
  - word: The term on the front of the card.
  - pronunciation: How to say the term, e.g. "/ˈkæʃ/".
  - category: Grouping shown as a badge on the card (e.g. "concept").
  - shortDefinition: One-line definition shown on the back.
  - detailedDefinition: Longer explanation shown on the back.
  - whyItMatters: Why the learner should care about this term.
  - image: Optional image URL or path shown on the card.
  - dialogue: Optional Dialogue(...) example that shows the term in use.
Dialogue(user: string, aiThoughts: string, aiQuestion: string) — Example exchange showing a term in use: what the user says, what the AI thinks, and its follow-up question.
  - user: What the user says, using the term.
  - aiThoughts: The AI's internal reasoning about the user's message.
  - aiQuestion: The follow-up question the AI asks back.

## Presentation beats

`title`, then `card1`, `card1.back`, `card2`, … per card: its word, then its definition
