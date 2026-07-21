# Section Type: `image-gallery`

**Mental model**: Visual confirmation and showcase. Reinforces abstract concepts with concrete visual evidence — UI mockups, diagrams, icons, and screenshots.

---

## File Structure

```
sections/image-gallery/
├── section.md        # section descriptor
└── gallery.yaml      # array of image items
```

## `section.md` Frontmatter

```yaml
---
type: image-gallery
title: "Skill & Mechanic Showcase"
resource: gallery.yaml    # relative path to the YAML data file
---
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"image-gallery"` | Yes | Fixed value |
| `title` | `string` | No | Section header |
| `resource` | `string` | Yes | Relative path to the `.yaml` image list file |

---

## `gallery.yaml` — data file

A YAML **list** of `GalleryItem` objects.

```yaml
- id: flicker-strike-art
  url: "https://cdn.mobalytics.gg/cdn-cgi/image/format=auto,width=96/assets/poe-2/images/game/Art/2DArt/SkillIcons/MonkFlickerStrikeTeleport.webp"
  caption: "Flicker Strike — teleport through packs dealing melee physical damage"
  credit: "Source: Mobalytics / Grinding Gear Games"

- id: monk-portrait
  url: "https://www.poe2wiki.net/images/e/e9/Monk_portrait.png"
  caption: "Monk — agile INT/DEX class wielding Quarterstaves and elemental disciplines"
  credit: "Source: poe2wiki.net"

- id: falling-thunder-icon
  url: "https://www.poe2wiki.net/images/a/a9/Falling_Thunder_inventory_icon.png"
  caption: "Falling Thunder — fires one lightning projectile per Power Charge consumed"
```

`GalleryItem` schema:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique item identifier |
| `url` | `string` | Yes | Image URL (absolute, supports external CDN URLs) |
| `caption` | `string` | Yes | Caption shown below the image |
| `credit` | `string` | No | Attribution / source credit |

---

## Real Example

From `public/okf/poe2-flicker-monk/sections/image-gallery/gallery.yaml`:

```yaml
- id: tempest-bell-icon
  url: "https://www.poe2wiki.net/images/c/c9/Tempest_Bell_inventory_icon.png"
  caption: "Tempest Bell — summon a bell; strike it to trigger a shockwave dealing lightning damage"
  credit: "Source: poe2wiki.net"

- id: whirling-assault-icon
  url: "https://www.poe2wiki.net/images/c/c4/Whirling_Assault_inventory_icon.png"
  caption: "Whirling Assault — gap-closer that builds Combo for Power Charge generation"
  credit: "Source: poe2wiki.net"
```

---

## CDN / inline equivalent

```json
{
  "type": "image-gallery",
  "props": {
    "title": "Visual Reference",
    "items": [
      { "id": "img-1", "url": "https://example.com/image1.png", "caption": "Architecture diagram", "credit": "Source: documentation" },
      { "id": "img-2", "url": "https://example.com/image2.png", "caption": "Data flow visualization" }
    ]
  }
}
```

---

## Pedagogical Role

`image-gallery` is flexible — it can be placed anywhere contextually appropriate. Common placements:
- **After a taxonomy** to visually confirm the categories just described
- **Within an intro** to ground the learner visually before theory
- **At the end** as a visual reference summary

See [sections-reference.md](../sections-reference.md) for the recommended section ordering.
