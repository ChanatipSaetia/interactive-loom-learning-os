# Section Type: `text`

**Mental model**: Anchored conceptual narrative. Sets context for everything that follows.

---

## File Structure

```
sections/intro/
├── section.md        # section descriptor
└── content.md        # markdown content body
```

## `section.md` Frontmatter

```yaml
---
type: text
title: "The One-Shot Flicker Monk"
heading: "Budget-Friendly, Endgame-Viable"   # optional subtitle
resource: content.md                          # relative path to the .md body
---
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"text"` | Yes | Fixed value |
| `title` | `string` | No | Section header displayed above the content |
| `heading` | `string` | No | Subtitle / secondary heading below the title |
| `resource` | `string` | Yes | Relative path to a `.md` file containing the body text |

> [!NOTE]
> Unlike most other section types, `text` points to a `.md` file, not a `.yaml` file.
> The body is rendered as markdown and supports headings, bold, italic, links, etc.

## `content.md` — body file

Plain markdown. No frontmatter. Supports full GFM.

```markdown
The Flicker Strike + Falling Thunder Martial Artist Monk is one of the most versatile builds in
Path of Exile 2 patch 0.5. It combines mobile flickering through packs with screen-clearing
thunder projectiles, all while remaining budget-friendly from league start to Uber endgame.

You play as a Monk who specializes in close combat...
```

---

## Real Example

From `public/okf/poe2-flicker-monk/sections/intro/`:

**section.md**
```yaml
---
type: text
title: "The One-Shot Flicker Monk"
heading: "Budget-Friendly, Endgame-Viable"
resource: content.md
---
```

**content.md** *(abbreviated)*
```markdown
The Flicker Strike + Falling Thunder Martial Artist Monk is one of the most versatile builds...

You play as a Monk who specializes in close combat, using the Martial Artist ascendancy...
```

---

## CDN / inline equivalent

When used via the CDN library, the `text` section is equivalent to:

```json
{
  "type": "text",
  "props": {
    "title": "The One-Shot Flicker Monk",
    "heading": "Budget-Friendly, Endgame-Viable",
    "paragraphs": [
      "The Flicker Strike + Falling Thunder Martial Artist Monk is one of the most versatile builds..."
    ],
    "animate": true
  }
}
```

The OKF loader reads `content.md` and splits it into `paragraphs` automatically (one entry per non-empty paragraph block).

---

## Pedagogical Role

Place a `text` section **first** in the topic order. It anchors the learner by answering:
- *What is this topic about?*
- *Why does it matter?*
- *What will the learner be able to do afterward?*

See [sections-reference.md](../sections-reference.md) for the recommended section ordering.
