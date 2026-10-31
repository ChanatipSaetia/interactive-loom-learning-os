### Layouts for Other Content

Pick the components from what the content is:

- **A how-to or procedure**: Steps, with an EntityList of amounts or settings and a Callout for the step people get wrong.
- **Code, commands or config**: CodeBlock, one per snippet, each after a TextContent saying what it does.
- **Reference facts** (specs, defaults, limits): EntityList, or a Table for several items.
- **A few options or terms side by side**: ContextCardBlock, or a row Stack of Cards for a before and after.
- **Headline figures**: OverviewCardBlock with real numbers.
- **Alternatives the reader picks between** (per platform, per version): Tabs. **Details on demand** (FAQ, edge cases): Accordion.
- **One key statement**: TextContent with size "large-heavy", then a Callout.
- **Something easier shown than told** (the parts of an object, a layout, a shape, a mechanism): an Svg drawing (see Drawings).

Signatures (? marks an optional argument):

Stack(children: any[], direction?: "row" | "column", gap?: "none" | "xs" | "s" | "m" | "l" | "xl" | "2xl", align?: "start" | "center" | "end" | "stretch" | "baseline", justify?: "start" | "center" | "end" | "between" | "around" | "evenly", wrap?: boolean) — Lays its children out in a column (default) or a row; a row of Cards puts options or a before/after side by side.
Card(children: (TextContent | MarkDownRenderer | CardHeader | Callout | TextCallout | CodeBlock | Image | Svg | ImageBlock | ImageGallery | Separator | HorizontalBarChart | RadarChart | PieChart | RadialChart | SingleStackedBarChart | ScatterChart | AreaChart | BarChart | LineChart | Table | TagBlock | Form | Buttons | IconButton | Steps | InlineHeader | EntityList | EditableTable | SnippetCardBlock | OverviewCardBlock | ContextCardBlock | CompositeCardBlock | VisualCardBlock | Tabs | Carousel | Stack)[], variant?: "card" | "sunk" | "clear", direction?: "row" | "column", gap?: "none" | "xs" | "s" | "m" | "l" | "xl" | "2xl", align?: "start" | "center" | "end" | "stretch" | "baseline", justify?: "start" | "center" | "end" | "between" | "around" | "evenly", wrap?: boolean) — A framed group of children; the usual root.
CardHeader(title?: string, subtitle?: string) — Title and subtitle at the top of a Card.
InlineHeader(heading: string, description?: string) — A heading with a one-line description, inside a Stack.
TextContent(text: string, size?: "small" | "default" | "large" | "small-heavy" | "large-heavy") — A plain paragraph; size "large-heavy" for one key statement.
MarkDownRenderer(textMarkdown: string, variant?: "clear" | "card" | "sunk") — A paragraph or a short list with inline markdown.
Callout(variant: "info" | "warning" | "error" | "success" | "neutral", title: string, description: string, visible?: $binding<boolean>) — A takeaway, tip or warning, coloured by variant.
TextCallout(variant?: "neutral" | "info" | "warning" | "success" | "danger", title?: string, description?: string) — A quieter callout with a title and a description.
Steps(items: StepsItem[]) — A numbered how-to or procedure the learner follows, one StepsItem per step.
StepsItem(title: string, details: string) — One step: what to do, then the details.
CodeBlock(language: string, codeString: string) — Code, a command or a config file, highlighted for its language.
EntityList(rows?: {left: string, right: string, rightVariant?: "text" | "number"}[], size?: "small" | "default", header?: {left: string, right: string, rightVariant?: "text" | "number"}, footer?: {left: string, right: string, rightVariant?: "text" | "number"}) — Label–value pairs: a recipe, a spec sheet, defaults and limits.
ContextCardBlock(items: ContextCardItem[], layout?: "grid" | "carousel", responsive?: boolean, action?: ActionExpression, gap?: number | string) — A few short cards side by side, each a term or option with one or two sentences.
ContextCardItem(id?: string, title: string | Tag, body?: string, bgColor?: "gray", bgImageSrc?: string, bgImageAlt?: string) — One card of a ContextCardBlock.
OverviewCardBlock(items: OverviewCardItem[], layout?: "grid" | "carousel", responsive?: boolean, action?: ActionExpression, gap?: number | string) — Key figures as cards (KPIs, headline numbers), each with an optional trend.
OverviewCardItem(id?: string, top: IconText | ImageText | Text, bottom?: MetricIndicatorInline) — One figure card: a Text on top, an optional MetricIndicatorInline below.
Text(variant?: "text" | "number", value: string, subtext?: string, subtextVariant?: "text" | "number" | "metric", size?: "xs" | "sm" | "md" | "lg") — A value with an optional subtext, for figure cards.
MetricIndicatorInline(value: string, subtext?: string, trend?: {direction: "up" | "down", value: number}) — A figure with its trend up or down.
TagBlock(tags: string[], size?: "sm" | "md" | "lg") — Keywords or labels as tags.
Tabs(items: TabItem[]) — Alternative views of the same thing (per platform, per version, chart and table); the reader picks one.
TabItem(value: string, trigger: string, content: (TextContent | MarkDownRenderer | CardHeader | Callout | TextCallout | CodeBlock | Image | Svg | ImageBlock | ImageGallery | Separator | HorizontalBarChart | RadarChart | PieChart | RadialChart | SingleStackedBarChart | ScatterChart | AreaChart | BarChart | LineChart | Table | TagBlock | Form | Buttons | IconButton | Steps | InlineHeader | EntityList | EditableTable | SnippetCardBlock | OverviewCardBlock | ContextCardBlock | CompositeCardBlock | VisualCardBlock)[]) — One tab: its value, its label and its content.
Accordion(items: AccordionItem[]) — Details on demand, such as an FAQ or edge cases; the reader opens the items.
AccordionItem(value: string, trigger: string, content: (TextContent | MarkDownRenderer | CardHeader | Callout | TextCallout | CodeBlock | Image | Svg | ImageBlock | ImageGallery | Separator | HorizontalBarChart | RadarChart | PieChart | RadialChart | SingleStackedBarChart | ScatterChart | AreaChart | BarChart | LineChart | Table | TagBlock | Form | Buttons | IconButton | Steps | InlineHeader | EntityList | EditableTable | SnippetCardBlock | OverviewCardBlock | ContextCardBlock | CompositeCardBlock | VisualCardBlock)[]) — One item: its value, its question or title, and its content.
Carousel(children: (TextContent | MarkDownRenderer | CardHeader | Callout | TextCallout | CodeBlock | Image | Svg | ImageBlock | ImageGallery | Separator | HorizontalBarChart | RadarChart | PieChart | RadialChart | SingleStackedBarChart | ScatterChart | AreaChart | BarChart | LineChart | Table | TagBlock | Form | Buttons | IconButton | Steps | InlineHeader | EntityList | EditableTable | SnippetCardBlock | OverviewCardBlock | ContextCardBlock | CompositeCardBlock | VisualCardBlock)[][], variant?: "card" | "sunk") — A short series of slides the reader swipes through; each slide is a list of components.
ImageBlock(src: string, alt?: string) — One image with alt text (a real, reachable URL).
Separator(orientation?: "horizontal" | "vertical", decorative?: boolean) — A dividing line between groups.

Example section files, a how-to and reference facts:

```
// @openui "Cold Brew" "Green tea without a kettle"
root = Stack([header, steps, recipe, warning])
header = InlineHeader("Cold-brewed sencha", "Sweeter and less bitter: catechins barely dissolve in cold water.")
steps = Steps([StepsItem("Weigh the leaf", "10 g of sencha per litre, twice the hot-brew ratio."), StepsItem("Add cold water", "Filtered water straight from the fridge."), StepsItem("Steep in the fridge", "3 hours for a light cup, up to 8 for a full one."), StepsItem("Strain", "Pour through a fine sieve and drink within 2 days.")])
recipe = EntityList([{left: "Leaf", right: "10 g"}, {left: "Water", right: "1 l"}, {left: "Steep", right: "3–8 h"}], "default", {left: "Per litre", right: "Amount"})
warning = Callout("warning", "Keep it cold", "Steeping at room temperature for hours lets bacteria grow; always steep in the fridge.")
```

```
// @openui "One Plant, Three Teas" "What processing changes"
root = Card([header, teas, faq])
header = CardHeader("Camellia sinensis, processed three ways", "Oxidation, not the plant, makes the difference")
teas = ContextCardBlock([ContextCardItem("green", "Green", "Heated within hours of picking, so it never oxidises."), ContextCardItem("oolong", "Oolong", "Bruised and partly oxidised, then heated."), ContextCardItem("black", "Black", "Rolled and fully oxidised before drying.")], "grid")
faq = Accordion([AccordionItem("caffeine", "Which has the most caffeine?", [TextContent("The leaf and the steep matter more than the type: a long, hot steep of any of them extracts more.")]), AccordionItem("plant", "Is it really the same plant?", [TextContent("Yes. Growers pick the same leaf; what happens after picking decides the tea.")])])
```

The how-to plays one beat per child; this narration walks it, with two steps on the steps beat:

```
root = Narration([title, why, steps, ratio, amounts, warning])
title = NarrationStep("title", "No kettle needed: cold water makes the sweetest sencha.")
why = NarrationStep("part1", "Cold water barely touches the bitter catechins, so the cup stays sweet.", [Highlight("header")])
steps = NarrationStep("part2", "Four steps, and the fridge does the work.", [Spotlight(["steps"])])
ratio = NarrationStep("part2", null, [Callout("steps", "Twice the leaf makes up for the slow, cold extraction.")])
amounts = NarrationStep("part3", "For one litre, that is all you need.", [Highlight("recipe")])
warning = NarrationStep("part4", "One rule you cannot skip.", [Callout("warning", "Hours at room temperature are a food-safety risk, not a flavour choice.")])
```
