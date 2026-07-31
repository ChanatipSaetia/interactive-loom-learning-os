# Loom Sections CDN Library (v1.4.0)

Standalone React component library for rendering interactive learning sections from JSON data. Load via CDN, provide OKF JSON, get rendered sections with native top navigation banner, audio controls, and animated theme switcher.

## Quick Start

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Learning Page</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/loom-learning-sections@1.4.0/loom-sections.css">
</head>
<body>
  <!-- Container where Loom Sections will render -->
  <div id="loom-root"></div>

  <script src="https://cdn.jsdelivr.net/npm/loom-learning-sections@1.4.0/loom-sections.umd.js"></script>
  <script>
    const okfSections = [
      {
        type: "text",
        props: {
          title: "Welcome",
          paragraphs: [
            "# Hello World\nThis is your first learning page.",
            "Add more paragraphs here."
          ]
        }
      },
      {
        type: "bullets",
        props: {
          title: "Key Points",
          items: [
            { text: "First concept" },
            { text: "Second concept", children: [{ text: "Sub-point A" }, { text: "Sub-point B" }] }
          ]
        }
      }
    ];

    // Render sections with header banner, audio toggle, and main web theme switcher enabled
    LoomSections.render(document.getElementById("loom-root"), okfSections, {
      title: "My Learning Topic",
      theme: "frappe",
      header: {
        brandTitle: "Learning OS",
        showAudioToggle: true,
        showThemePicker: true,
        statusBadge: "⚡ Live"
      }
    });
  </script>
</body>
</html>
```

## API Reference

### `LoomSections.render(container, sections, options?)`

Render sections into a DOM container.

| Parameter | Type | Description |
|---|---|---|
| `container` | `HTMLElement` | DOM element to render into |
| `sections` | `SectionConfig[]` | Array of section configurations |
| `options` | `RenderOptions` | Optional — title, theme, header, editable (see [RenderOptions](#renderoptions)) |

```javascript
LoomSections.render(document.getElementById("root"), sections, {
  title: "My Learning Topic",
  theme: "frappe",
  header: {
    brandTitle: "Learning OS",
    showAudioToggle: true,
    showThemePicker: true
  }
});
```

Returns a cleanup function. Call it to unmount:

```javascript
const cleanup = LoomSections.render(el, sections, { theme: "medicare" });
cleanup(); // unmounts React root
```

### `RenderOptions`

```typescript
interface RenderOptions {
  title?: string
  theme?: BuiltInTheme | Record<string, string>
  editable?: boolean
  topicId?: string
  bundle?: OKFBundled
  header?: boolean | HeaderOptions
}

interface HeaderOptions {
  brandTitle?: string      // Top banner brand text (default: 'Learning OS')
  showAudioToggle?: boolean // Sound FX toggle button (default: true)
  showThemePicker?: boolean // Animated theme switcher (default: true)
  statusBadge?: string     // Optional status pill badge (e.g. '⚡ Live')
}

type BuiltInTheme = 'frappe' | 'medicare' | 'recipebook' | 'pinkcatboo' | 'eink' | string
```

| Field | Type | Description |
|---|---|---|
| `title` | `string` | When provided, the library renders a styled page header above the sections containing this text. |
| `theme` | `BuiltInTheme` | Theme identifier matching the main web application (`frappe`, `medicare`, `recipebook`, `pinkcatboo`, `eink`). |
| `header` | `boolean \| HeaderOptions` | Embeds the main website's top navigation bar containing audio toggle, theme switcher, and container shell. |

---

### `LoomSections.renderThemeSelector(widgetContainer, sectionsContainer?, options?)`

Mount the main website's animated `<ThemeToggle />` button directly into a target DOM container.

| Parameter | Type | Description |
|---|---|---|
| `widgetContainer` | `HTMLElement` | DOM element to mount the theme toggle into |

```javascript
// Mount theme selector widget
LoomSections.renderThemeSelector(document.getElementById("theme-picker"));
```

---

### `LoomSections.registerSection(type, componentFactory)`

Register a custom section type.

| Parameter | Type | Description |
|---|---|---|
| `type` | `string` | Section type identifier (e.g., `"my-custom"`) |
| `componentFactory` | `function(props) => HTMLElement` | Factory that returns a DOM element from props |

```javascript
LoomSections.registerSection("my-custom", (props) => {
  const el = document.createElement("div");
  el.className = "my-custom-section";
  el.innerHTML = `<h2>${props.title}</h2><p>${props.body}</p>`;
  return el;
});
```

### `SectionConfig`

```typescript
interface SectionConfig {
  type: string;           // Section type identifier
  props: Record<string, unknown>;  // Props passed to the section component
}
```

## Section Types

For detailed schema specifications, prop definitions, file structures, and examples for each section type, see the dedicated reference documents in [`docs/sections/`](sections/README.md).

> [!NOTE]
> A topic configuration array (`sections`) can include **multiple instances of ANY section type** (e.g. multiple `text` sections, multiple `flowchart` sections, multiple `tradeoff-sandbox` sections, or multiple `scenario` and `decision-tree` sections).

| Type | Reference Documentation | Mental Model |
|---|---|---|
| `text` | [sections/text.md](sections/text.md) | Anchored conceptual narrative |
| `bullets` | [sections/bullets.md](sections/bullets.md) | Hierarchical breakdown |
| `concept-map` | [sections/concept-map.md](sections/concept-map.md) | Semantic relationships |
| `flashcards` | [sections/flashcards.md](sections/flashcards.md) | Vocabulary recall |
| `taxonomy-browser` | [sections/taxonomy-browser.md](sections/taxonomy-browser.md) | Concept category grid |
| `flowchart` | [sections/flowchart.md](sections/flowchart.md) | Process flows & swimlanes |
| `reflection-sequence` | [sections/reflection-sequence.md](sections/reflection-sequence.md) | Step ordering challenge |
| `quiz` | [sections/quiz.md](sections/quiz.md) | Knowledge check |
| `tradeoff-sandbox` | [sections/tradeoff-sandbox.md](sections/tradeoff-sandbox.md) | Trade-off explorer |
| `formula-sandbox` | [sections/formula-sandbox.md](sections/formula-sandbox.md) | Quantitative simulator |
| `reflection-template` | [sections/reflection-template.md](sections/reflection-template.md) | Fill-in-the-blank synthesis |
| `scenario` | [sections/scenario.md](sections/scenario.md) | Branching narrative |
| `decision-tree` | [sections/decision-tree.md](sections/decision-tree.md) | Diagnostic advisor |
| `image-gallery` | [sections/image-gallery.md](sections/image-gallery.md) | Visual showcase |

---

## Theming

Pass a `theme` in `RenderOptions` to apply colour palette overrides to the render container without touching global CSS.

### Built-in presets

| Preset | Palette | Background | Typical use |
|---|---|---|---|
| `"frappe"` | Catppuccin Frappé | `#303446` (dark grey-blue) | Default — matches the Loom app |
| `"mocha"` | Catppuccin Mocha | `#1e1e2e` (darker) | Deep dark mode |
| `"macchiato"` | Catppuccin Macchiato | `#24273a` (blue-dark) | Mid dark mode |
| `"latte"` | Catppuccin Latte | `#eff1f5` (light) | Light mode |

```javascript
LoomSections.render(container, sections, { theme: "mocha" });
```

### Custom token map

Pass a partial `Record<string, string>` to override individual CSS custom properties:

```javascript
LoomSections.render(container, sections, {
  theme: {
    "--ctp-base": "#0d1117",
    "--ctp-mantle": "#090c10",
    "--ctp-blue": "#58a6ff",
    "--ctp-text": "#e6edf3",
  },
});
```

> [!NOTE]
> The injected `<style>` is scoped to the container element (`#container-id { … }`), so
> multiple independent `render()` calls on the same page each get their own isolated theme.
> The style tag is automatically removed when the cleanup function returned by `render()` is called.

---

## CSS Theme Variables

The library uses Catppuccin Frappé theme. Override these CSS custom properties:

```css
:root {
  /* Catppuccin Frappé palette */
  --ctp-rosewater: #f2dcd5;
  --ctp-flamingo: #f4b8e4;
  --ctp-pink: #f7b2ce;
  --ctp-mauve: #d7b2fe;
  --ctp-red: #e78284;
  --ctp-maroon: #ea999c;
  --ctp-peach: #ef9f76;
  --ctp-yellow: #e5c890;
  --ctp-green: #a6d189;
  --ctp-teal: #81c8be;
  --ctp-sky: #99d1db;
  --ctp-sapphire: #85c1dc;
  --ctp-blue: #8caaee;
  --ctp-lavender: #babbf1;
  --ctp-text: #c6d0f5;
  --ctp-subtext1: #b5bfe2;
  --ctp-subtext0: #a5adce;
  --ctp-overlay2: #949cbb;
  --ctp-overlay1: #838ba7;
  --ctp-overlay0: #737994;
  --ctp-surface2: #626880;
  --ctp-surface1: #51576d;
  --ctp-surface0: #414559;
  --ctp-base: #303446;
  --ctp-mantle: #292c3c;
  --ctp-crust: #232634;

  /* Semantic aliases */
  --font-body: system-ui, -apple-system, sans-serif;

  /* Layout variables specific to Loom CDN container */
  --loom-title-sticky-top: 0px;                  /* Sticky top offset for section headers */
  --loom-section-bg: var(--ctp-base, #303446);   /* Background color for sticky headers */
}
```

## Embedded Data vs. External Local JSON

When building a static learning page using this library, you have two options for structuring your curriculum data:

1. **Option A: External JSON File (Recommended)** - Store the JSON database in a separate file (e.g. `curriculum.json`) in the same folder and load it dynamically using `fetch()`.
2. **Option B: Embedded Inline JS** - Declare the array of sections directly in a script tag inside the HTML file.

---

### Option A: External JSON File (Recommended)
This approach keeps your content and structural layouts strictly separate.

#### 1. Setup the Directory Structure
Create a folder for your project and place the HTML and JSON files side-by-side:
```
my-learning-project/
├── index.html
└── curriculum.json
```

#### 2. Create the JSON File (`curriculum.json`)
Create `curriculum.json` in the same directory and define the array of sections:
```json
[
  {
    "type": "text",
    "props": {
      "title": "Welcome",
      "paragraphs": ["# Hello World\nWelcome to interactive learning!"]
    }
  }
]
```

#### 3. Fetch and Render in HTML (`index.html`)
Use a modern ES module script block (`type="module"`) to fetch the JSON file locally relative to the page and render it using the library:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Loom App</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/loom-learning-sections@1.3.2/loom-sections.css">
  <style>
    #loom-root {
      max-width: 860px;
      margin: 0 auto;
      padding: 16px;
    }
  </style>
</head>
<body style="background-color: #232634; color: #c6d0f5;">
  <div id="theme-picker" style="max-width: 860px; margin: 16px auto; display: flex; justify-content: flex-end;"></div>
  <div id="loom-root"></div>

  <script src="https://cdn.jsdelivr.net/npm/loom-learning-sections@1.3.2/loom-sections.umd.js"></script>
  <script type="module">
    try {
      const response = await fetch('./curriculum.json');
      if (!response.ok) throw new Error('Failed to load JSON');
      const sections = await response.json();
      LoomSections.render(document.getElementById('loom-root'), sections, {
        title: "Stateful Agents",
        theme: "frappe"
      });
      LoomSections.renderThemeSelector(
        document.getElementById('theme-picker'),
        document.getElementById('loom-root'),
        { position: 'inline' }
      );
    } catch (err) {
      console.error('Error loading sections:', err);
    }
  </script>
</body>
</html>
```

> [!IMPORTANT]
> **Local Testing & CORS Restrictions**
> Modern browsers prevent `fetch()` requests when loading pages using the `file://` protocol (e.g. double-clicking the HTML file in explorer/finder).
> To test local JSON loading, you **must** serve the files using a local HTTP server.
> Run one of the following commands in your project folder:
> - Node.js: `npx serve .` or `npx http-server`
> - Python 3: `python3 -m http.server`
> - Python 2: `python -m SimpleHTTPServer`
> Then navigate to the URL shown (usually `http://localhost:3000` or `http://localhost:8000`).

---

### Option B: Embedded Inline JS
Useful for offline testing, single standalone HTML pages, or rapid prototyping without setting up a web server.

#### 1. Setup the Directory Structure
You only need a single HTML file:
```
my-learning-project/
└── index.html
```

#### 2. Declare and Render Inline
Embed the array directly inside your script tag:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Loom App (Embedded)</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/loom-learning-sections@1.3.2/loom-sections.css">
  <style>
    #loom-root {
      max-width: 860px;
      margin: 0 auto;
      padding: 16px;
    }
  </style>
</head>
<body style="background-color: #232634; color: #c6d0f5;">
  <div id="theme-picker" style="max-width: 860px; margin: 16px auto; display: flex; justify-content: flex-end;"></div>
  <div id="loom-root"></div>

  <script src="https://cdn.jsdelivr.net/npm/loom-learning-sections@1.3.2/loom-sections.umd.js"></script>
  <script>
    const okfSections = [
      {
        type: "text",
        props: {
          title: "Introduction",
          paragraphs: ["# Welcome\nThis is loaded from an inline script block."]
        }
      }
    ];

    LoomSections.render(document.getElementById('loom-root'), okfSections, {
      title: "Embedded Lesson",
      theme: "frappe"
    });
    LoomSections.renderThemeSelector(
      document.getElementById('theme-picker'),
      document.getElementById('loom-root'),
      { position: 'inline' }
    );
  </script>
</body>
</html>
```

### Direct Comparison

| Feature | Option A: External JSON File | Option B: Embedded Inline JS |
|---|---|---|
| **Separation of Concerns** | Excellent. Content (JSON) is completely decoupled from logic/styling (HTML). | Poor. Data array is mixed with HTML markup. |
| **CORS Restriction** | Yes. Requires local web server for local testing. | No. Works directly via double-clicking the HTML file (`file://`). |
| **Ease of Maintenance** | High. Non-developers can modify the curriculum content without touching HTML. | Medium. Need to modify script tags directly inside the HTML file. |
| **Caching** | Excellent. Browser caches the HTML structure and JSON files independently. | Low. Whole HTML must be reloaded and parsed for any minor content update. |


## Troubleshooting

| Problem | Solution |
|---|---|
| Blank page | Check browser console for errors. Verify CDN links are correct and accessible. |
| Sections not rendering | Verify `sections` array matches the schema. Check `type` string matches exactly (e.g., `"flowchart"` not `"Flowchart"`). |
| Missing styles | Ensure the CSS file is loaded: `<link rel="stylesheet" href="...loom-sections.css">` |
| Flowchart not showing | Pass either a pre-derived `schema` (`entities`, `relations`, `journeys`) or raw `flow` / `schema` (`actors`, `systems`, `steps`, `journeys`). The renderer automatically derives views if `entities` is omitted. If loading via OKF YAML files, ensure all four source files exist (`actors.yaml`, `systems.yaml`, `steps.yaml`, `journeys.yaml`). |
| Taxonomy icon missing | Use exact PascalCase Lucide icon name (e.g., `"BookOpen"` not `"book-open"` or `"bookopen"`). |
| CORS error on `file://` | Use a local HTTP server instead of opening HTML directly. `npx serve .` works well. |
| Bundle load fails | Check network tag. CDN may be blocked. Verify version tag matches published version. |

---

## Library Architecture & Delivery Ports

The standalone CDN library (`libs/loom-sections.tsx`) is powered by the **Hexagonal SingleHTMLEmbedAdapter** (`src/core/delivery/adapters/single-html-embed.tsx`), implementing `OKFRuntimePort` ([src/core/delivery/ports.ts](file:///home/chanatip/interactive_loom_learning_os/src/core/delivery/ports.ts)) and backed by the **3-Tier Validation Gateway** ([src/core/validation/gateway.ts](file:///home/chanatip/interactive_loom_learning_os/src/core/validation/gateway.ts)).

* **Standalone Runtime Port:** Operates independently of SPA routing overhead.
* **Validation Gateway Integration:** Exposed API functions (`LoomSections.validateSection`, `LoomSections.validateYAML`) invoke the centralized 3-tier validation gateway and return structured `ValidationResult` diagnostics with `fixHint` annotations.

