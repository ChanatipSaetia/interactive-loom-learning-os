# Section Type: `taxonomy-browser`

**Mental model**: Categorized concept grids with expandable detail cards, analogies, and scope definitions. Shows the *landscape* of a domain.

---

## File Structure

```
sections/taxonomy/
├── section.md           # section descriptor (resource: ".")
├── 01-main-skills.yaml     # one TaxonomyCategory per file
├── 02-support-gems.yaml
├── 03-utility-skills.yaml
└── 04-defenses.yaml
```

The `resource: "."` value tells the loader to read **all `.yaml` files** in the directory, merging them into a single list of categories in **filename order** — the two-digit prefix sets the card order. Each YAML file contains exactly **one** category object (not a list). Prefix a filename with `_` to disable that category without deleting it.

## `section.md` Frontmatter

```yaml
---
type: taxonomy-browser
title: "Skill Arsenal"
resource: "."       # loads all .yaml files in this directory as categories
---
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"taxonomy-browser"` | Yes | Fixed value |
| `title` | `string` | No | Section header |
| `resource` | `"."` | Yes | Directory load — all `.yaml` files become categories |

---

## Individual category YAML file

Each `.yaml` file in the section directory represents **one category card**. The file begins with `type: taxonomy-category` as a discriminator.

```yaml
type: taxonomy-category
icon: Zap                     # Lucide icon name (PascalCase)
title: "Main Damage Skills"
subtitle: "Falling Thunder & Flicker Strike"
color: yellow                 # theme accent name (see table below)
description: "Your two primary skills that clear maps and melt bosses."
details: "Falling Thunder fires lightning projectiles per Power Charge consumed in a 360-degree burst..."
analogy: "Falling Thunder is your area denial, Flicker Strike is your mobility tool — but both kill."
primaryFocus: "Power Charge consumption and critical strike damage"
inScope:
  - "Falling Thunder (Lv20) + Elemental Armament, Nova Projectiles..."
  - "Flicker Strike (Lv20) + Blindside, Concentrated Area..."
outOfScope:
  - "Single-target focused attacks without AoE potential"
```

`TaxonomyCategory` schema:

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"taxonomy-category"` | Yes | Discriminator — must be present |
| `icon` | `string` | Yes | Lucide React icon name in PascalCase (e.g. `BookOpen`, `Zap`, `Shield`) |
| `title` | `string` | Yes | Category card title |
| `subtitle` | `string` | No | Short subtitle shown below the title |
| `color` | `string` | Yes | Theme accent name: `blue`, `peach`, `pink`, `mauve`, `green`, `teal`, `sky`, `lavender`, `yellow`, or `red` (hex values are not allowed) |
| `description` | `string` | Yes | Brief description shown collapsed on the card |
| `details` | `string` | No | Expanded detail text shown when the card is opened |
| `analogy` | `string` | No | Real-world analogy to aid understanding |
| `primaryFocus` | `string` | No | One-liner about what this category focuses on |
| `inScope` | `string[]` | No | List of things included in this category |
| `outOfScope` | `string[]` | No | List of things explicitly outside this category |

> [!NOTE]
> **Icon names**: Use a [Lucide React](https://lucide.dev/icons/) icon name in PascalCase — e.g., `BookOpen`, `Zap`, `Shield`, `Code`, `Globe`, `Settings`, `Layers`, `Target`. Do **not** use kebab-case (`book-open`), lowercase (`bookopen`), or emoji — the validator rejects unknown names (with a "did you mean" suggestion) and the renderer silently falls back to a generic `Circle` icon.

> **Colors**: `color` must be one of the Catppuccin Frappé accent names the renderer supports: `blue`, `peach`, `pink`, `mauve`, `green`, `teal`, `sky`, `lavender`, `yellow`, `red`. Hex values (`#89b4fa`) and unsupported names (`rose`, `violet`) fail schema validation.

---

## Real Example

From `public/okf/poe2-flicker-monk/sections/taxonomy/01-main-skills.yaml`:

```yaml
type: taxonomy-category
icon: Zap
title: "Main Damage Skills"
subtitle: "Falling Thunder & Flicker Strike"
color: yellow
description: "Your two primary skills that clear maps and melt bosses."
details: "Falling Thunder fires lightning projectiles per Power Charge consumed in a 360-degree burst. Flicker Strike dashes through enemies, teleporting you while dealing damage. Both scale with Power Charges and critical strikes."
analogy: "Falling Thunder is your area denial, Flicker Strike is your mobility tool — but both kill."
primaryFocus: "Power Charge consumption and critical strike damage"
inScope:
  - "Falling Thunder (Lv20) + Elemental Armament, Nova Projectiles, Ricochet, Pinpoint Critical, Ice Bite"
  - "Flicker Strike (Lv20) + Blindside, Concentrated Area, Close Combat, Perpetual Charge, Hit and Run"
  - "Both socketed in Quarterstaff"
outOfScope:
  - "Single-target focused attacks without AoE potential"
```

---

## CDN / inline equivalent

```json
{
  "type": "taxonomy-browser",
  "props": {
    "title": "Skill Arsenal",
    "categories": [
      {
        "icon": "Zap",
        "title": "Main Damage Skills",
        "subtitle": "Falling Thunder & Flicker Strike",
        "color": "yellow",
        "description": "Your two primary skills that clear maps and melt bosses.",
        "details": "Falling Thunder fires lightning projectiles per Power Charge consumed...",
        "analogy": "Falling Thunder is your area denial, Flicker Strike is your mobility tool.",
        "primaryFocus": "Power Charge consumption and critical strike damage",
        "inScope": ["Falling Thunder (Lv20) + ...", "Flicker Strike (Lv20) + ..."],
        "outOfScope": ["Single-target focused attacks without AoE potential"]
      }
    ]
  }
}
```

---

## Pedagogical Role

Place `taxonomy-browser` as step 4 — after vocabulary (`flashcards`) and before the main explanation sections. It gives learners a high-level map of what's coming, so individual sections feel connected rather than isolated.

See [sections-reference.md](../sections-reference.md) for the recommended section ordering.
