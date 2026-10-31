# quiz

Checking understanding and applying knowledge. Can I answer or apply what has already been taught?

Read [shared components](../core/components.md) and [narration](../core/narration.md) before writing.

## Component signatures

Quiz(title: string, questions: QuizQuestion[], heading?: string, lead?: Lead) — Knowledge-check section of multiple-choice questions.
  - title: Section title, shown in the topic outline and as the section header.
  - questions: The questions, as QuizQuestion references, in order.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
QuizQuestion(id: string, question: string, choices: QuizChoice[], hint?: string) — A multiple-choice question. Mark exactly one choice as correct.
  - id: Question ID, unique within the quiz.
  - question: The question text.
  - choices: Answer options, as QuizChoice references. Exactly one is correct.
  - hint: Optional hint the learner can reveal before answering.
QuizChoice(id: string, text: string, correct: boolean, explanation: string) — One answer option of a quiz question, with the explanation shown after answering.
  - id: Choice ID, unique within its question (e.g. "a").
  - text: Answer text shown on the option button.
  - correct: true for the one correct choice of the question.
  - explanation: Feedback shown after this choice is picked: why it is right or wrong.

## Presentation beats

`title`, then `q1`, `q1.wrong`, `q1.right`, `q2`, … per question: asked, its first wrong choice tried, the right answer given
