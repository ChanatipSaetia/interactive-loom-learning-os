# Section Type: `quiz`

**Mental model**: Knowledge check and validation. Multiple-choice questions with instant feedback, hints, and explanations.

---

## File Structure

```
sections/quiz/
├── section.md          # section descriptor
└── questions.yaml      # array of quiz questions
```

## `section.md` Frontmatter

```yaml
---
type: quiz
title: "Knowledge Check"
resource: questions.yaml    # relative path to the YAML questions file
---
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"quiz"` | Yes | Fixed value |
| `title` | `string` | No | Section header |
| `resource` | `string` | Yes | Relative path to the `.yaml` questions file |

---

## `questions.yaml` — data file

A YAML **list** of `QuizQuestion` objects.

```yaml
- id: q1
  question: "What does Way of the Stonefist convert on your gloves?"
  hint: "Think about flat stats becoming percentages."
  choices:
    - id: a
      text: "Socket count into mana regeneration"
      correct: false
      explanation: "Stonefist does not affect sockets or mana. It's a damage multiplier node."
    - id: b
      text: "Flat Physical and Elemental Damage into % Extra Damage"
      correct: true
      explanation: "Correct. Flat Physical Damage + flat Elemental Damage on gloves become % Extra Damage of each type, creating a massive multiplicative multiplier."
    - id: c
      text: "Attack Speed into movement speed"
      correct: false
      explanation: "Stonefist only converts flat damage stats. Attack Speed is unaffected."
```

`QuizQuestion` schema:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique question identifier |
| `question` | `string` | Yes | The question text |
| `hint` | `string` | No | Hint shown when the learner requests it |
| `choices` | `QuizChoice[]` | Yes | Answer options (typically 3–4) |

`QuizChoice` schema:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique choice identifier within the question |
| `text` | `string` | Yes | Choice display text |
| `correct` | `boolean` | Yes | `true` for the correct answer, `false` for distractors |
| `explanation` | `string` | Yes | Shown after the learner selects this choice — explains why it is right or wrong |

> [!IMPORTANT]
> Exactly **one** choice per question must have `correct: true`. All others must be `false`.
> The `explanation` field is required for every choice — distractors need good explanations too.

---

## Real Example

From `public/okf/poe2-flicker-monk/sections/quiz/questions.yaml` *(abbreviated)*:

```yaml
- id: q2
  question: "Why should you avoid Dreaming Quarterstaff?"
  hint: "Think about critical strikes."
  choices:
    - id: a
      text: "It has too low physical damage"
      correct: false
      explanation: "Physical damage isn't the issue. The problem is more fundamental to this crit-based build."
    - id: b
      text: "It has 0% base Crit Chance"
      correct: true
      explanation: "Correct. Dreaming Quarterstaff has 0% base Crit, which cripples this crit-focused build. Use any other Quarterstaff."
    - id: c
      text: "It cannot socket Falling Thunder"
      correct: false
      explanation: "Dreaming Quarterstaff can socket any melee skill. The issue is its 0% base Crit."
```

---

## CDN / inline equivalent

```json
{
  "type": "quiz",
  "props": {
    "title": "Knowledge Check",
    "questions": [
      {
        "id": "q1",
        "question": "What is an Aggregate in DDD?",
        "hint": "Think about consistency boundaries.",
        "choices": [
          { "id": "a", "text": "A collection of unrelated entities", "correct": false, "explanation": "Aggregates group related entities." },
          { "id": "b", "text": "A consistency boundary around related entities", "correct": true, "explanation": "Correct! Aggregates enforce consistency within their boundary." },
          { "id": "c", "text": "A database table", "correct": false, "explanation": "An aggregate is a domain concept, not a persistence detail." }
        ]
      }
    ]
  }
}
```

---

## Pedagogical Role

Place `quiz` after the core content sections (flowchart, taxonomy) — step 9 in the recommended ordering. Questions should test material that has already been taught. Never quiz on vocabulary before `flashcards` have been shown.

See [sections-reference.md](../sections-reference.md) for the recommended section ordering.
