# Section Type: `flashcards`

**Mental model**: Vocabulary recall and dialogue scenario. Pre-teaches terminology before it appears in diagrams or trade-offs.

---

## File Structure

```
sections/flashcards/
├── section.md        # section descriptor
└── glossary.yaml     # array of word/term cards
```

## `section.md` Frontmatter

```yaml
---
type: flashcards
title: "Key Vocabulary"
resource: glossary.yaml    # relative path to the YAML card deck
---
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"flashcards"` | Yes | Fixed value |
| `title` | `string` | No | Section header |
| `resource` | `string` | Yes | Relative path to the `.yaml` card deck |

---

## `glossary.yaml` — data file

A YAML **list** of `WordTerm` objects.

```yaml
- id: flicker-strike
  word: "Flicker Strike"
  pronunciation: "FLIK-er strike"
  category: skill
  image: "https://cdn.example.com/flicker-strike.webp"
  shortDefinition: "Dash through enemies, dealing melee damage."
  detailedDefinition: "Your character flickers through enemies in the direction of movement, dealing melee physical damage. Links with Perpetual Charge to extend duration and reduce charge consumption chance."
  whyItMatters: "Primary mobility and clearing skill. Teleporting through packs while dealing damage is the build's signature feel."
  dialogue:
    user: "How do I clear maps fast?"
    aiThoughts: "The player wants mapping efficiency."
    aiQuestion: "Use Flicker Strike to dash through packs, then follow up with Falling Thunder on dense groups."
```

`WordTerm` schema:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique identifier for the card |
| `word` | `string` | Yes | Term or vocabulary word (front of card) |
| `pronunciation` | `string` | No | Phonetic / IPA pronunciation guide |
| `category` | `string` | No | Category label (e.g. `skill`, `mechanic`, `item`, `ascendancy`) |
| `image` | `string` | No | URL to an image displayed on the card |
| `shortDefinition` | `string` | Yes | Brief one-sentence definition shown on the front |
| `detailedDefinition` | `string` | No | Full detailed definition shown on the back |
| `whyItMatters` | `string` | No | Contextual "why this matters" explanation |
| `dialogue` | `Dialogue` | No | Interactive chat dialogue on the back of the card |

`Dialogue`:

| Field | Type | Required | Description |
|---|---|---|---|
| `user` | `string` | Yes | A sample user question |
| `aiThoughts` | `string` | Yes | Internal reasoning / context note |
| `aiQuestion` | `string` | Yes | The AI's response / answer to the user's question |

---

## Real Example

From `public/okf/poe2-flicker-monk/sections/flashcards/glossary.yaml` *(abbreviated)*:

```yaml
- id: combo
  word: "Combo"
  pronunciation: "KOM-boh"
  category: mechanic
  shortDefinition: "Stack counter that buffs damage and enables charge generation."
  detailedDefinition: "A stacking mechanic gained through melee hits. Martial Adept doubles your Combo gain. At 20 stacks on Mantra of Destruction, you can expend Combo for Power Charges via Ailith's Chimes."
  whyItMatters: "The bridge between hitting things and generating Power Charges for your main skills."
  dialogue:
    user: "How do I get more charges for bossing?"
    aiThoughts: "Player needs charge generation explained."
    aiQuestion: "Build Combo through Whirling Assault, then expend it into charges with Ailith's Chimes."
```

---

## CDN / inline equivalent

```json
{
  "type": "flashcards",
  "props": {
    "title": "Key Vocabulary",
    "terms": [
      {
        "id": "flicker-strike",
        "word": "Flicker Strike",
        "pronunciation": "FLIK-er strike",
        "category": "skill",
        "image": "https://cdn.example.com/flicker-strike.webp",
        "shortDefinition": "Dash through enemies, dealing melee damage.",
        "detailedDefinition": "Your character flickers through enemies in the direction of movement...",
        "whyItMatters": "Primary mobility and clearing skill.",
        "dialogue": {
          "user": "How do I clear maps fast?",
          "aiThoughts": "The player wants mapping efficiency.",
          "aiQuestion": "Use Flicker Strike to dash through packs..."
        }
      }
    ]
  }
}
```

---

## Pedagogical Role

Place `flashcards` **early** (step 3) in the recommended ordering — right after the concept map and before complex sections like flowcharts or trade-offs. If learners don't know the vocabulary, every subsequent section becomes noise.

Optionally add a **second** `flashcards` section near the end of the topic as a recall drill after all content has been taught.

See [sections-reference.md](../sections-reference.md) for the recommended section ordering.
