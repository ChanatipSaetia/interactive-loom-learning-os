# Section Type: `bullets`

**Mental model**: Hierarchical taxonomy / breakdown. Deconstructs a concept into a collapsible tree of sub-points.

---

## File Structure

```
sections/maintenance/
├── section.md        # section descriptor
└── items.yaml        # nested bullet items
```

## `section.md` Frontmatter

```yaml
---
type: bullets
title: "การบำรุงรักษาพื้นฐาน"
ordered: false          # optional — true for numbered list
resource: items.yaml    # relative path to the YAML data file
---
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"bullets"` | Yes | Fixed value |
| `title` | `string` | No | Section header |
| `ordered` | `boolean` | No | `true` = numbered list, `false` (default) = bullet list |
| `resource` | `string` | Yes | Relative path to the `.yaml` items file |

## `items.yaml` — data file

A YAML array of `BulletItem` objects. Each item can optionally have a `children` array for nesting.

```yaml
- text: "Top-level item"
  children:
    - text: "Child item A"
    - text: "Child item B"
      children:
        - text: "Grandchild item"

- text: "Another top-level item"
```

`BulletItem` schema:

| Field | Type | Required | Description |
|---|---|---|---|
| `text` | `string` | Yes | The item label (markdown supported) |
| `children` | `BulletItem[]` | No | Nested sub-items (recursive) |

---

## Real Example

From `public/okf/motorcycle/sections/maintenance/`:

**section.md**
```yaml
---
type: bullets
title: "การบำรุงรักษาพื้นฐาน"
ordered: false
resource: items.yaml
---
```

**items.yaml** *(abbreviated)*
```yaml
- text: การเปลี่ยนถ่ายน้ำมันเครื่อง (Engine Oil)
  children:
    - text: "ควรเปลี่ยนตามระยะทางที่คู่มือกำหนด (เช่น ทุกๆ 2,000 - 4,000 กม.)"
    - text: หมั่นตรวจเช็คระดับน้ำมันเครื่องผ่านก้านวัด

- text: การเช็คลมยางและสภาพยาง
  children:
    - text: เติมลมยางตามค่ามาตรฐาน
    - text: เช็คดอกยาง หากดอกยางโล้นควรเปลี่ยนทันที
```

---

## CDN / inline equivalent

```json
{
  "type": "bullets",
  "props": {
    "title": "Basic Maintenance",
    "ordered": false,
    "items": [
      {
        "text": "Engine Oil Change",
        "children": [
          { "text": "Change per manual mileage intervals (e.g. every 2,000–4,000 km)" },
          { "text": "Check oil level via dipstick regularly" }
        ]
      },
      { "text": "Tyre Pressure Check" }
    ],
    "animate": true
  }
}
```

---

## Pedagogical Role

Use `bullets` for:
- **Practical checklists** — maintenance steps, configuration checklists
- **Reference material** — hierarchical feature breakdowns, option listings
- **Learning objectives** — what the learner will be able to do

Best placed **after** a `flowchart` as a practical "apply" section (step 8 in the recommended order), or next to an `openui` prose section for structured lists.

See [sections-reference.md](../sections-reference.md) for the recommended section ordering.
