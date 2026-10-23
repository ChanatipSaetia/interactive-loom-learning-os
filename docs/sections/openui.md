# Section Type: `openui`

**Mental model**: Free-form composed layout. Use any standard OpenUI component (cards, tabs, tables, charts, accordions, steps, callouts, code blocks…), or an SVG drawing, when `text` or `bullets` can't express the shape of the content.

---

## File Structure

An `openui` section is one `.oui` file in the topic's `sections/` folder, like every other section:

```
public/content/<topic>/
├── topic.oui                 # lists the section: SectionRef("plans")
└── sections/
    └── plans.oui             # starts with the // @openui directive
```

## The `// @openui` directive

The **first non-blank line** of the file marks it as a standard OpenUI section and carries its title and optional heading:

```oui
// @openui "Choosing a plan" "Compare what you get"
```

| Argument | Type | Required | Description |
|---|---|---|---|
| 1st string | `string` | Yes | Section title shown in the section title bar |
| 2nd string | `string` | No | Sub-heading displayed below the title |

Everything after the directive is a plain **OpenUI Lang** program written against the standard
[`@openuidev/react-ui`](https://www.npmjs.com/package/@openuidev/react-ui) component library
(`openuiLibrary`), **not** the Loom section library. Output from any OpenUI-aware LLM prompt can be pasted in as-is.

> [!NOTE]
> Loom components (`Quiz`, `Text`, `Bullets`, …) are not available inside an `openui` section, and the standard
> components are not available in other sections. Both libraries have a `Text` and an `ImageGallery`; the directive
> decides which one a file uses.

## Example

```oui
// @openui "Choosing a plan" "Compare what you get"
root = Card([header, tabs, note])

header = CardHeader("Plans", "Pick the one that fits your team")

tabs = Tabs([
  TabItem("free", "Free", [TextContent("Up to **3** projects and community support.")]),
  TabItem("pro", "Pro", [
    TextContent("Unlimited projects."),
    Table([Col("Feature", ["SSO", "Audit log"]), Col("Included", ["Yes", "Yes"])]),
  ]),
])

note = Callout("info", "Tip", "You can switch plans at any time.")
```

## Available components

The full, always-current list with signatures is in the section's **Guide** (help button in the app and in Loom Studio), and in Studio's code-editor completions. Groups include:

- **Layout**: `Stack`, `Card`, `CardHeader`, `Tabs`/`TabItem`, `Accordion`/`AccordionItem`, `Carousel`, `Steps`/`StepsItem`, `Separator`
- **Content**: `TextContent` (markdown), `MarkDownRenderer`, `Callout`, `TextCallout`, `CodeBlock`, `Image`, `ImageBlock`, `ImageGallery`, `TagBlock`, and Loom's `Svg` (below)
- **Data**: `Table`/`Col`, `BarChart`, `LineChart`, `AreaChart`, `PieChart`, `RadarChart`, `RadialChart`, `ScatterChart`, `HorizontalBarChart`, `SingleStackedBarChart`
- **Forms & buttons**: `Form`, `FormControl`, `Input`, `TextArea`, `Select`, `Slider`, `CheckBoxGroup`, `RadioGroup`, `Buttons`, `Button`

## Drawings: `Svg`

Loom adds one component to the standard library: `Svg(markup, caption?)` draws inline SVG markup. Use it when a picture
explains better than words or boxes and arrows: the parts of an object, a layout, a shape, a mechanism at one moment.
It may go wherever an `Image` may (a Card, a Stack, a tab, …).

```oui
// @openui "Two Leaves and a Bud"
root = Card([header, shoot])
header = CardHeader("The fine pluck")
shoot = Svg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 250">
  <path id="leaf1" d="M180 96 C140 68 100 76 80 102 C112 122 152 120 180 96 Z" fill="green"/>
  <path id="bud" d="M180 44 C168 26 172 12 180 4 C188 12 192 26 180 44 Z" fill="teal"/>
  <text x="196" y="28" font-size="14">Bud</text>
</svg>', "A tea shoot")
```

- Write the markup as a **single-quoted string** so its attributes keep their double quotes; it may span lines.
- One `<svg>` root with a `viewBox`; it scales to the section's width, keeping its proportions (at most 28rem tall,
  20rem on the Present stage).
- **Colors**: a Loom palette name in `fill`, `stroke`, `stop-color`, … (`blue`, `peach`, `green`, `mauve`, `red`,
  `yellow`, `teal`, `text`, `subtext0`, `overlay1`, `surface0`, …) becomes that theme color, so drawings follow theme
  switches. Shapes and text without a fill draw in the text color. Other colors (`#hex`, `rgb()`) are kept as written.
- **Safe by construction**: scripts, `<style>`, event handlers, `foreignObject`, external images and links are removed;
  IDs are scoped to the drawing so two drawings can both define `#arrow`. SMIL `<animate>` is kept (use it for loops).
- **Narration** points at a shape by its `id`: `Highlight("shoot.bud")`, `Spotlight(["shoot.leaf1", "shoot.leaf2"])`.
  Make the Svg a named child of a `Card`/`Stack` root; validation checks the ID exists in the markup.

`Svg` is defined in `progressive-content/components/openui/loom-components.tsx` and is part of the snapshot
`npm run openui:gen` writes, so Studio completions, hovers, validation and the authoring prompt know it.
See decision 118 in [grill-log-presenting-mode.md](../../grill-log-presenting-mode.md).

## Rules & validation

- `Query()` / `Mutation()` are rejected: Loom content is static, so inline the data.
- Unknown components, missing required arguments and unresolved references are reported as inline diagnostics with their line, like any other section. The preview keeps the last valid version.
- Buttons only do something for the built-in **open URL** action. Other actions (for example "continue conversation") are ignored.
- Colors come from the active Loom theme (Catppuccin palette tokens), so the components follow theme switches.

## Legacy OKF folder format

The old Markdown/YAML loader also accepts `type: openui`. `resource` names the program file (default `view.oui`), which holds the OpenUI program **without** the directive:

```yaml
---
type: openui
title: "Choosing a plan"
heading: "Compare what you get"
resource: view.oui
---
```

## CDN / inline equivalent

> [!IMPORTANT]
> The single-file embed library (`libs/loom-sections.tsx`, see [cdn-library.md](../cdn-library.md)) does **not**
> include the `openui` renderer: the standard component library would roughly triple the bundle size. `openui` sections
> render in the web app and Loom Studio, where they load lazily on first use.

The section props look like this:

```json
{
  "type": "openui",
  "props": {
    "title": "Choosing a plan",
    "heading": "Compare what you get",
    "source": "root = Card([CardHeader(\"Plans\"), TextContent(\"Hello\")])"
  }
}
```

---

## Pedagogical Role

Use `openui` for structured explanations that need **composition**: side-by-side comparisons in tabs, a small data table or chart that supports the narrative, a labelled drawing, or an accordion of FAQs. Prefer the purpose-built interactive sections (`tradeoff-sandbox`, `quiz`, `flowchart`, …) when one fits, since those carry learning feedback and progress events that an `openui` section does not.

See [sections-reference.md](../sections-reference.md) for the recommended section ordering.
