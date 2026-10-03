# Section Type: `concept-map`

**Mental model**: Semantic groupings and entity relationships. Gives learners a spatial overview of how domain concepts connect before they are explored individually.

---

## File Structure

```
sections/concept-map/
├── section.md          # section descriptor
└── concepts.yaml       # nodes and directed edges
```

## `section.md` Frontmatter

```yaml
---
type: concept-map
title: "Build Mechanics Map"
resource: concepts.yaml    # relative path to the YAML data file
---
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"concept-map"` | Yes | Fixed value |
| `title` | `string` | No | Section header |
| `resource` | `string` | Yes | Relative path to the `.yaml` data file |

---

## `concepts.yaml` — data file

A single YAML object with two top-level keys: `nodes` (a mapping) and `edges` (a list).

```yaml
nodes:
  flicker-strike:
    title: "Flicker Strike"
    category: skill
  falling-thunder:
    title: "Falling Thunder"
    category: skill
  power-charges:
    title: "Power Charges"
    category: mechanic
  ailiths-chimes:
    title: "Ailith's Chimes"
    category: item
  combo:
    title: "Combo System"
    category: mechanic

edges:
  - from: flicker-strike
    to: power-charges
    label: "consumes for damage"
  - from: falling-thunder
    to: power-charges
    label: "fires per charge"
  - from: combo
    to: ailiths-chimes
    label: "converts to charges"
```

### `nodes` — mapping of `nodeId → ConceptNode`

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | Yes | Display name of the concept node |
| `category` | `string` | Yes | Category label used for color/grouping (e.g. `skill`, `mechanic`, `ascendancy`, `item`, `aura`, `defense`, `gear`, `support`, `herald`) |

> [!NOTE]
> Node IDs (the mapping keys, e.g. `flicker-strike`) must be **unique** within the file. They are referenced in `edges[].from` and `edges[].to`.

### `edges` — list of `ConceptEdge`

| Field | Type | Required | Description |
|---|---|---|---|
| `from` | `string` | Yes | Source node ID |
| `to` | `string` | Yes | Target node ID |
| `label` | `string` | No | Relationship label shown on the edge |

---

## Real Example

From `public/okf/poe2-flicker-monk/sections/concept-map/concepts.yaml` *(abbreviated)*:

```yaml
nodes:
  martial-artist:
    title: "Martial Artist"
    category: ascendancy
  stonefist:
    title: "Way of the Stonefist"
    category: ascendancy

edges:
  - from: martial-artist
    to: stonefist
    label: "glove multiplier"
  - from: martial-artist
    to: combo
    label: "doubles gain"
```

---

## CDN / inline equivalent

```json
{
  "type": "concept-map",
  "props": {
    "title": "Build Mechanics Map",
    "nodes": {
      "flicker-strike": { "id": "flicker-strike", "title": "Flicker Strike", "category": "skill" },
      "power-charges":  { "id": "power-charges",  "title": "Power Charges",  "category": "mechanic" }
    },
    "edges": [
      { "from": "flicker-strike", "to": "power-charges", "label": "consumes for damage" }
    ]
  }
}
```

> [!NOTE]
> In the CDN JSON format, each node object must include an `id` field mirroring its key. In the OKF YAML format, the `id` is the mapping key and does not need to be repeated inside the object.

---

## Pedagogical Role

Place `concept-map` **second** in the recommended section order — right after the `intro`. Giving learners a bird's-eye spatial map of concepts before they dive into details helps them understand how individual sections relate to the whole.

See [sections-reference.md](../sections-reference.md) for the recommended section ordering.
