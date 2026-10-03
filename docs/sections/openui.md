# Section Type: `openui`

**Mental model**: Free-form composed layout. Use any standard OpenUI component (cards, tabs, tables, charts, accordions, steps, callouts, code blocks…) when `text` or `bullets` can't express the shape of the content.

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
- **Content**: `TextContent` (markdown), `MarkDownRenderer`, `Callout`, `TextCallout`, `CodeBlock`, `Image`, `ImageBlock`, `ImageGallery`, `TagBlock`
- **Data**: `Table`/`Col`, `BarChart`, `LineChart`, `AreaChart`, `PieChart`, `RadarChart`, `RadialChart`, `ScatterChart`, `HorizontalBarChart`, `SingleStackedBarChart`
- **Forms & buttons**: `Form`, `FormControl`, `Input`, `TextArea`, `Select`, `Slider`, `CheckBoxGroup`, `RadioGroup`, `Buttons`, `Button`

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

Use `openui` for structured explanations that need **composition**: side-by-side comparisons in tabs, a small data table or chart that supports the narrative, or an accordion of FAQs. Prefer the purpose-built interactive sections (`tradeoff-sandbox`, `quiz`, `flowchart`, …) when one fits, since those carry learning feedback and progress events that an `openui` section does not.

See [sections-reference.md](../sections-reference.md) for the recommended section ordering.
