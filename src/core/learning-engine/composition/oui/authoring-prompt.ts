/**
 * LLM authoring prompt: everything an external LLM chat needs to write a
 * whole Loom topic that Loom Viewer and Loom Studio can open.
 *
 * It is the Loom OpenUI Lang prompt (lang-core's prompt with every prop
 * described, see `getLoomOUIPrompt`) with a Loom preamble (topic layout and
 * the output formats), authoring rules and a worked example.
 * `npm run oui:schema` publishes it as `public/llm/loom-authoring-prompt.md`.
 */
import { BULLET_AUTHORING_GUIDE } from './bullet-authoring'
import { standardOpenUISpec } from '../../sub-contexts/progressive-content/openui-standard'
import { SVG_THEME_COLORS } from '../../sub-contexts/progressive-content/components/openui/svg-markup'
import { LOOM_PAGES_URL } from './llm-guide'
import { getLoomOUIPrompt } from './library'
import { BEAT_IDS } from './narration'

export { LOOM_PAGES_URL }

/** Official OpenUI docs (linked from the @openuidev package READMEs). */
export const OPENUI_LANG_DOCS_URL = 'https://openui.com/docs/openui-lang'
export const OPENUI_REACT_UI_DOCS_URL = 'https://openui.com/docs/api-reference/react-ui'

const PREAMBLE = `You write learning topics for Interactive Loom, an interactive learning app. Content is written in openui-lang, a small declarative language described below.

## Topic Layout

A topic is a folder named after its topic ID (lowercase letters, digits, \`-\` and \`_\`, e.g. \`http-caching\`):

- \`topic.oui\`: \`root = Topic(...)\`, the catalog metadata and the ordered list of \`SectionRef("<name>")\`.
- \`sections/<name>.oui\`: one section per file, \`root = <Section>(...)\` where \`<Section>\` is a section component (Intro, Text, Bullets, Flowchart, Quiz, …), or a standard OpenUI section (see Standard OpenUI Sections).
- \`sections/<name>.narrate.oui\`: \`root = Narration(...)\`, the script the section plays to when the learner plays the topic in Present mode (see Narration Files). One per section; not listed in topic.oui.

Every file is its own openui-lang program: it has its own \`root\` and its own statement names, so names may repeat across files.
In the rules below, "program" means one file. The \`root\` of \`topic.oui\` is \`Topic(...)\`; the \`root\` of a section file is a section component.

## Output Formats

Answer in the format the user asks for. If they do not say, use the single .oui file.

1. **Single .oui file** (\`<topic-id>.loom.oui\`): the first line is \`// @loom-topic <topic-id>\` (followed by \`// @loom-domain <domain-id>\` when the topic is kept in one of the learner's domains, the folder \`Loom/<domain-id>/\` in their drive), then every file of the topic, each after a marker line \`// === <path> ===\`. Put it in one code block. For several topics, repeat the \`// @loom-topic\` line before each topic's files.

   \`\`\`
   // @loom-topic <topic-id>
   // === topic.oui ===
   root = Topic(...)
   // === sections/intro.oui ===
   root = Intro(...)
   \`\`\`

2. **Folder of .oui files**: one code block per file, each preceded by its path (\`<topic-id>/topic.oui\`, \`<topic-id>/sections/<name>.oui\`) so the user can save them into that folder.

The user opens the result in Loom Viewer (${LOOM_PAGES_URL}viewer.html) or imports it into Loom Studio. Outside the code block(s), say nothing or at most one short sentence.`

/** A narration file for the example's vocabulary section (checked by unit tests). */
export const NARRATION_EXAMPLE = `root = Narration([title, word1, back1, word2, back2])
title = NarrationStep("title", "Two words every tea brewer uses, and why they matter in the cup.")
word1 = NarrationStep("card1", "First word: catechins.", [Highlight("catechins")])
back1 = NarrationStep("card1.back", "They are the bitterness in green tea.", [Callout("catechins", "They dissolve faster in hotter water, so water at 75 °C keeps the cup sweet.")])
word2 = NarrationStep("card2", "Next: steep.")
back2 = NarrationStep("card2.back", "Steep time is the dial you control.", [Callout("steep", "Every extra minute adds more catechins than flavour. Pour off all the water when the time is up.")])
`

const BEAT_TABLE = Object.entries(BEAT_IDS).map(([type, ids]) => `| \`${type}\` | ${ids} |`).join('\n')

const NARRATION = `## Narration Files

Loom Viewer can play a topic hands-free (Present mode): each section plays beat by beat, answers its own quiz questions (a wrong try, then the right answer), walks scenarios and decision trees, and lights the main content of each beat. Write a narration file for every section, \`sections/<name>.narrate.oui\`: it is the script the narrator reads, beat by beat. A beat with no step reads its on-screen text instead.

- Its \`root\` is \`Narration([steps])\`; each \`NarrationStep(beat, caption, [effects])\` plays on the beat it names. Give every beat of the section at least one step, in beat order. Several steps on one beat play in turn: use them to walk a dense beat (a table, a diagram, a long card) one point at a time, each step with its own effect.
- \`caption\` is what the narrator says: one or two spoken sentences in the topic's language. Explain and connect, do not just repeat the screen: on a quiz's \`.wrong\` beat say why that answer is tempting and wrong, on its \`.right\` beat why the right one is right. Pass \`null\` for a step that only plays an effect (its Callout is still read).
- Write it as a talk, not a template: vary how captions open, link a beat to the one before or to an earlier section, ask the question the learner is about to answer, and put the why or the example the screen leaves out in a Callout. Mix the effects to what each beat needs; not every step needs one.
- Effects (optional): \`Highlight(target)\`, \`Callout(target, text)\` (a note beside an element, one or two short sentences, read after the caption), \`Spotlight([targets])\` (zoom in and dim the rest). A target is a string naming a statement of the section file, optionally with a prop: \`"catechins"\`, \`"q1.hint"\`, \`"root.items[0]"\`. Name the statements you will point at in the section file (e.g. \`catechins = Flashcard(...)\`) rather than writing them inline. In a standard OpenUI section, a target names one of the root's children (see Standard OpenUI Sections) or one value of a chart or table among them, by the path of the value in its statement: \`"bars.series[0].values[4]"\` (one bar or line point), \`"bars.labels[4]"\` (every bar or point at the fifth label), \`"bars.series[1]"\` (a whole series), \`"pie.values[2]"\` (a slice), \`"table.columns[2].data[4]"\` (a cell), \`"table.columns[2]"\` (a column) or \`"table.columns[2].label"\` (its header). To point at a table row, Spotlight its cells. In a drawing (\`Svg\`), a target names one shape by its \`id\` in the markup: \`"plant.bud"\`. Use these to explain one figure or one part of a picture at a time: Highlight a bar while the caption names it, Callout a point with why it is there, Spotlight the shapes of a drawing the caption is about.
- In the single .oui file, the narration file follows its section: \`// === sections/vocabulary.narrate.oui ===\`.

Every section except the intro opens on a \`title\` beat: a card with the section's title, its \`heading\` and its \`Lead\` text. Its step introduces the section: what it is about and why it comes now (without one, the narrator reads the card). The intro's own beats start with its \`title\`.

Beat IDs by section type (n counts from 1; every type but \`intro\` starts with \`title\`):

| Section type | Beats |
|---|---|
${BEAT_TABLE}

Example, for the \`sections/vocabulary.oui\` file of the example topic:

\`\`\`
${NARRATION_EXAMPLE}\`\`\``

const STANDARD_OPENUI = `## Standard OpenUI Sections

When no Loom section fits, a section file can instead be a standard OpenUI program:

- Its first line is \`// @openui "<Section title>" "<optional heading>"\`.
- The rest is openui-lang written with the standard OpenUI component library (\`@openuidev/react-ui\`), not the Loom components above. The components to use are listed with their signatures under Tables and Charts, Layouts for Other Content and Drawings below.
- Component reference: ${OPENUI_REACT_UI_DOCS_URL}. Language specification: ${OPENUI_LANG_DOCS_URL}.
- Content is static: no Query(), Mutation(), tools, actions, forms or buttons (there is no backend).
- List it in topic.oui with \`SectionRef\` like any other section. Prefer a Loom section when one teaches the content (a process, a quiz, a trade-off); use standard OpenUI for content whose natural form is a layout: figures, a drawing, a how-to, code, reference facts, a set of options side by side.

Shape each section to its content. Do not reuse one skeleton (a header, Tabs with a chart and a table, a Callout) for every section: pick the root and the components from what this content is (see the list under Layouts for Other Content), and two standard OpenUI sections in one topic should rarely look alike.

How the root shapes Present mode (see Narration Files): a \`Card([...])\` or \`Stack([...])\` root with several children plays one child per beat (\`part1\`, \`part2\`, …), and its children written as named statements are what narration can point at, down to one bar, point, slice or cell of a chart or table, or one shape of a drawing, among them. Any other root (Tabs, Accordion, Carousel, a single child) plays as one beat with nothing to point at, and only its first tab or slide shows. So for a section the narrator should walk through, make the root a Card or Stack of named statements, one idea each, and keep what must be presented out of Tabs, Accordion and Carousel (they suit extra detail the reader opens in Read mode).

The \`sections/steep-guide.oui\` file in the example above is a standard OpenUI section.`

/** Table and chart components listed with their real signatures, with when to use each. */
const TABLE_CHART_COMPONENTS: Array<[name: string, use: string]> = [
  ['Table', 'Compare several items across the same attributes (specs, settings, options side by side), or a reference the learner looks things up in. Column-oriented: a list of Col.'],
  ['Col', 'One column: its header and its values, in the same row order in every column. Use type "number" for numeric columns.'],
  ['BarChart', 'Compare one or more values across a few categories.'],
  ['HorizontalBarChart', 'Like BarChart, for long category labels or a ranked list.'],
  ['LineChart', 'A value changing over time or along an ordered scale.'],
  ['AreaChart', 'Totals or volumes accumulating over time.'],
  ['PieChart', 'Parts of one whole that add up to 100%; at most about six slices.'],
  ['RadarChart', 'Two or three items scored on the same set of criteria.'],
  ['ScatterChart', 'The relationship between two numeric variables.'],
  ['Series', 'One named series of numbers, one value per label.'],
  ['ScatterSeries', 'One named set of points of a ScatterChart.'],
  ['Point', 'One x/y point of a ScatterSeries.'],
]

function componentSignatures(components: Array<[name: string, use: string]>): string {
  return components.map(([name, use]) => {
    const component = standardOpenUISpec.components[name]
    if (!component) throw new Error(`Loom authoring prompt: standard OpenUI library has no ${name}`)
    return `${component.signature} — ${use}`
  }).join('\n')
}

/** A standard OpenUI section with a chart and a table (checked by unit tests). */
export const TABLE_CHART_EXAMPLE = `// @openui "Water Temperature" "How hot to brew each tea"
root = Card([header, chart, table, tip])
header = CardHeader("Water temperature by tea", "Starting points for a 2-minute steep")
chart = BarChart(["Gyokuro", "Sencha", "Matcha", "Oolong", "Black"], [Series("Water (°C)", [60, 75, 80, 90, 95])], "grouped", "Tea", "°C")
table = Table([Col("Tea", ["Gyokuro", "Sencha", "Matcha", "Oolong", "Black"]), Col("Water (°C)", [60, 75, 80, 90, 95], "number"), Col("Why", ["Shaded leaf, sweet and delicate", "Balanced, grassy", "Whisked powder, scorches easily", "Partly oxidised, needs more heat", "Fully oxidised, robust"])])
tip = Callout("info", "No thermometer?", "Let boiled water stand: about 80 °C after 5 minutes in an open cup.")
`

/** Narration for TABLE_CHART_EXAMPLE pointing at single bars and cells (checked by unit tests). */
export const TABLE_CHART_NARRATION_EXAMPLE = `root = Narration([title, head, low, high, why, tip])
title = NarrationStep("title", "How hot should the water be? It depends on the leaf.")
head = NarrationStep("part1", "Five teas, each at its usual starting point.", [Highlight("header")])
low = NarrationStep("part2", "Gyokuro wants the coolest water of all.", [Highlight("chart.labels[0]")])
high = NarrationStep("part2", "Black tea takes it almost boiling.", [Callout("chart.series[0].values[4]", "Fully oxidised leaf has little left to turn bitter.")])
why = NarrationStep("part3", "The last column says why: gyokuro is shaded, so it is sweet and delicate.", [Spotlight(["table.columns[0].data[0]", "table.columns[2].data[0]"])])
tip = NarrationStep("part4", "No thermometer? Time does the job.", [Highlight("tip")])
`

const TABLES_AND_CHARTS = `### Tables and Charts

Use a table or chart in a standard OpenUI section when the figures or the side-by-side comparison are what the learner should take away:

- **Table**: several items compared on the same attributes, or reference values the learner looks up (settings, limits, specs).
- **Chart**: the shape of real numbers: a comparison, a trend, a share of a whole or a correlation. Pick the chart type from the question it answers (see the list below).
- Not a table or chart: a trade-off the learner should explore by moving sliders (TradeoffSandbox), a formula (FormulaSandbox), categories or a hierarchy (TaxonomyBrowser), a few points with explanation (Bullets).

How to write them:

- Data is written as literal arrays, e.g. \`Col("Tea", ["Sencha", "Matcha"])\`. There is no \`data.rows\`, Query or \`@\` function call over fetched data.
- Every Col of a Table, and every Series of a chart, has one value per row or label, in the same order.
- Use real, specific figures; never invent numbers to fill a chart. Put the unit in the Col header or the axis label, e.g. "Water (°C)".
- Value axes start at 0, so values only a few percent apart look the same height. When the lesson is the difference, chart the difference (e.g. "°C below boiling", "ms over the baseline") and keep the absolute values in a Table.
- Wrap a chart in a Card with a CardHeader for its title, and add a Callout for the takeaway. Put a chart and a table of the same data in Tabs only when the narrator does not need both: Present shows the first tab only.

Signatures (? marks an optional argument):

${componentSignatures(TABLE_CHART_COMPONENTS)}

Example section file, and its narration pointing at single bars and cells:

\`\`\`
${TABLE_CHART_EXAMPLE}\`\`\`

\`\`\`
${TABLE_CHART_NARRATION_EXAMPLE}\`\`\``

/** Layout and content components listed with their real signatures, with when to use each. */
const LAYOUT_COMPONENTS: Array<[name: string, use: string]> = [
  ['Stack', 'Lays its children out in a column (default) or a row; a row of Cards puts options or a before/after side by side.'],
  ['Card', 'A framed group of children; the usual root.'],
  ['CardHeader', 'Title and subtitle at the top of a Card.'],
  ['InlineHeader', 'A heading with a one-line description, inside a Stack.'],
  ['TextContent', 'A plain paragraph; size "large-heavy" for one key statement.'],
  ['MarkDownRenderer', 'A paragraph or a short list with inline markdown.'],
  ['Callout', 'A takeaway, tip or warning, coloured by variant.'],
  ['TextCallout', 'A quieter callout with a title and a description.'],
  ['Steps', 'A numbered how-to or procedure the learner follows, one StepsItem per step.'],
  ['StepsItem', 'One step: what to do, then the details.'],
  ['CodeBlock', 'Code, a command or a config file, highlighted for its language.'],
  ['EntityList', 'Label–value pairs: a recipe, a spec sheet, defaults and limits.'],
  ['ContextCardBlock', 'A few short cards side by side, each a term or option with one or two sentences.'],
  ['ContextCardItem', 'One card of a ContextCardBlock.'],
  ['OverviewCardBlock', 'Key figures as cards (KPIs, headline numbers), each with an optional trend.'],
  ['OverviewCardItem', 'One figure card: a Text on top, an optional MetricIndicatorInline below.'],
  ['Text', 'A value with an optional subtext, for figure cards.'],
  ['MetricIndicatorInline', 'A figure with its trend up or down.'],
  ['TagBlock', 'Keywords or labels as tags.'],
  ['Tabs', 'Alternative views of the same thing (per platform, per version, chart and table); the reader picks one.'],
  ['TabItem', 'One tab: its value, its label and its content.'],
  ['Accordion', 'Details on demand, such as an FAQ or edge cases; the reader opens the items.'],
  ['AccordionItem', 'One item: its value, its question or title, and its content.'],
  ['Carousel', 'A short series of slides the reader swipes through; each slide is a list of components.'],
  ['ImageBlock', 'One image with alt text (a real, reachable URL).'],
  ['Separator', 'A dividing line between groups.'],
]

/** A how-to as a standard OpenUI section, one narratable part per child (checked by unit tests). */
export const HOWTO_EXAMPLE = `// @openui "Cold Brew" "Green tea without a kettle"
root = Stack([header, steps, recipe, warning])
header = InlineHeader("Cold-brewed sencha", "Sweeter and less bitter: catechins barely dissolve in cold water.")
steps = Steps([StepsItem("Weigh the leaf", "10 g of sencha per litre, twice the hot-brew ratio."), StepsItem("Add cold water", "Filtered water straight from the fridge."), StepsItem("Steep in the fridge", "3 hours for a light cup, up to 8 for a full one."), StepsItem("Strain", "Pour through a fine sieve and drink within 2 days.")])
recipe = EntityList([{left: "Leaf", right: "10 g"}, {left: "Water", right: "1 l"}, {left: "Steep", right: "3–8 h"}], "default", {left: "Per litre", right: "Amount"})
warning = Callout("warning", "Keep it cold", "Steeping at room temperature for hours lets bacteria grow; always steep in the fridge.")
`

/** Narration for HOWTO_EXAMPLE: several steps on one beat, a silent effect (checked by unit tests). */
export const HOWTO_NARRATION_EXAMPLE = `root = Narration([title, why, steps, ratio, amounts, warning])
title = NarrationStep("title", "No kettle needed: cold water makes the sweetest sencha.")
why = NarrationStep("part1", "Cold water barely touches the bitter catechins, so the cup stays sweet.", [Highlight("header")])
steps = NarrationStep("part2", "Four steps, and the fridge does the work.", [Spotlight(["steps"])])
ratio = NarrationStep("part2", null, [Callout("steps", "Twice the leaf makes up for the slow, cold extraction.")])
amounts = NarrationStep("part3", "For one litre, that is all you need.", [Highlight("recipe")])
warning = NarrationStep("part4", "One rule you cannot skip.", [Callout("warning", "Hours at room temperature are a food-safety risk, not a flavour choice.")])
`

/** Reference facts as a standard OpenUI section: cards side by side and an FAQ (checked by unit tests). */
export const FACTS_EXAMPLE = `// @openui "One Plant, Three Teas" "What processing changes"
root = Card([header, teas, faq])
header = CardHeader("Camellia sinensis, processed three ways", "Oxidation, not the plant, makes the difference")
teas = ContextCardBlock([ContextCardItem("green", "Green", "Heated within hours of picking, so it never oxidises."), ContextCardItem("oolong", "Oolong", "Bruised and partly oxidised, then heated."), ContextCardItem("black", "Black", "Rolled and fully oxidised before drying.")], "grid")
faq = Accordion([AccordionItem("caffeine", "Which has the most caffeine?", [TextContent("The leaf and the steep matter more than the type: a long, hot steep of any of them extracts more.")]), AccordionItem("plant", "Is it really the same plant?", [TextContent("Yes. Growers pick the same leaf; what happens after picking decides the tea.")])])
`

const LAYOUTS = `### Layouts for Other Content

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

${componentSignatures(LAYOUT_COMPONENTS)}

Example section files, a how-to and reference facts:

\`\`\`
${HOWTO_EXAMPLE}\`\`\`

\`\`\`
${FACTS_EXAMPLE}\`\`\`

The how-to plays one beat per child; this narration walks it, with two steps on the steps beat:

\`\`\`
${HOWTO_NARRATION_EXAMPLE}\`\`\``

/** A drawing as a standard OpenUI section: an Svg part whose shapes narration points at (checked by unit tests). */
export const DRAWING_EXAMPLE = `// @openui "Two Leaves and a Bud" "What a fine pluck takes"
root = Card([header, shoot, why])
header = CardHeader("The fine pluck", "Only the tip of each tea shoot is picked")
shoot = Svg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 250">
  <path id="stem" d="M180 246 V40" stroke="overlay1" stroke-width="4" fill="none"/>
  <path id="older" d="M180 200 C140 176 96 184 72 210 C108 228 152 224 180 200 Z" fill="surface2"/>
  <path id="leaf2" d="M180 150 C224 120 272 128 296 156 C262 178 214 176 180 150 Z" fill="green"/>
  <path id="leaf1" d="M180 96 C140 68 100 76 80 102 C112 122 152 120 180 96 Z" fill="green"/>
  <path id="bud" d="M180 44 C168 26 172 12 180 4 C188 12 192 26 180 44 Z" fill="teal"/>
  <path d="M190 24 H240" stroke="subtext0" stroke-dasharray="3 3"/>
  <text x="246" y="29" font-size="14">Bud</text>
  <text x="74" y="107" font-size="14" text-anchor="end">1st leaf</text>
  <text x="302" y="161" font-size="14">2nd leaf</text>
  <text x="24" y="244" font-size="12" fill="subtext0">Older leaf: left on the bush</text>
</svg>', "A tea shoot: the bud, then the first and second leaf")
why = Callout("info", "Why only the tip?", "The youngest leaves hold the most amino acids and catechins, so they make the sweetest, fullest cup.")
`

/** Narration for DRAWING_EXAMPLE pointing at single shapes of the drawing (checked by unit tests). */
export const DRAWING_NARRATION_EXAMPLE = `root = Narration([title, head, bud, leaves, older, why])
title = NarrationStep("title", "Every fine green tea starts with the same pluck.")
head = NarrationStep("part1", "Pickers take only the very tip of each shoot.", [Highlight("header")])
bud = NarrationStep("part2", "At the top sits the bud, still rolled up.", [Highlight("shoot.bud")])
leaves = NarrationStep("part2", "Then the two youngest leaves below it.", [Spotlight(["shoot.leaf1", "shoot.leaf2"])])
older = NarrationStep("part2", null, [Callout("shoot.older", "Older leaves are tougher and flatter in taste; they stay on the bush.")])
why = NarrationStep("part3", "So two leaves and a bud is a recipe for flavour.", [Highlight("why")])
`

const DRAWINGS = `### Drawings

When a picture explains it better than words or boxes and arrows, draw it with \`Svg\` in a standard OpenUI section: the parts of an object (an engine, a cell, a leaf), where things sit (a floor plan, a network, a board), a shape or geometry (an angle, a curve, a wave), or a mechanism at one moment (a piston stroke, a cache hit). Prefer a Loom section when one fits: a process with actors is a Flowchart, figures are a chart, categories are a TaxonomyBrowser.

Plan the picture before the prose: what should the learner be able to picture or explain afterward? Include a labelled concept drawing whenever it makes the idea clearer, without waiting for a request for a picture. For an abstract idea, use a concrete visual analogy and explicitly label where the analogy or schematic simplifies reality. A drawing should explain a relationship, structure or change, not decorate the page. Pair it with a short explanation of what to notice and why it matters, and use narration to connect its parts to the idea one at a time.

${componentSignatures([['Svg', 'A drawing: one <svg> element with a viewBox, and a caption under it.']])}

How to draw:

- Write the markup as a single-quoted string, \`Svg('<svg …>…</svg>', "caption")\`, so its attributes keep their double quotes; it may span several lines. One \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 W H">\` root; it scales to the width of the section, keeping its proportions.
- Use shapes, paths, text, groups, markers and gradients. Scripts, event handlers, links, external images and \`foreignObject\` are removed. Use a SMIL \`<animate>\` only for a loop (\`repeatCount="indefinite"\`) that shows motion.
- Colors: write a Loom palette name, \`fill="green"\`, \`stroke="overlay1"\` (${SVG_THEME_COLORS.join(', ')}), so the drawing follows the theme; shapes and text without a fill draw in the text color. Keep it to a few colors with a meaning each.
- Label the parts with \`<text>\` (font-size about 12–16 in a viewBox a few hundred units wide) and leader lines, as in a textbook figure. Keep it simple and schematic: the few parts the lesson is about, not a detailed illustration.
- Check readability at phone width: a few large shapes, short non-overlapping labels and theme-aware contrast. Split a dense figure into simpler views instead of shrinking the text. Prefer static shapes with narration highlights; animate only a change that teaches something, and avoid expensive filters, blur and decorative loops. Label a schematic as not to scale when proportions could mislead.
- Give every shape narration will point at an \`id\` (\`<path id="bud" …>\`), unique within the drawing; make the Svg a named child of a Card or Stack root (\`shoot = Svg(…)\`), then point at \`"shoot.bud"\`. Several steps on the drawing's beat can walk it part by part.

Example section file, and its narration walking the drawing shape by shape:

\`\`\`
${DRAWING_EXAMPLE}\`\`\`

\`\`\`
${DRAWING_NARRATION_EXAMPLE}\`\`\``

const AUTHORING_RULES = [
  'In the single .oui file, start EVERY file with its own marker line written exactly as `// === topic.oui ===`, `// === sections/<name>.oui ===` or `// === sections/<name>.narrate.oui ===` (three `=` on each side, no folder prefix). Each file holds exactly one `root =` statement; never put two sections in one file.',
  'Every `SectionRef("<name>")` in topic.oui has a matching `sections/<name>.oui` file, and every section file is listed exactly once. Section names use lowercase letters, digits, `-` and `_`.',
  'Size the topic to the request. A short topic (one idea, a quick explanation, the next small step in a chat) is 1–3 sections that show the idea best, with no `Intro` and no quiz unless a quick check is the point. A full lesson starts with an `Intro` section; then build understanding step by step: vocabulary (Flashcards) and maps (ConceptMap, TaxonomyBrowser) before explanations (Text, Bullets), processes (Flowchart) before practice (ReflectionSequence, Quiz), and trade-offs or decisions (TradeoffSandbox, FormulaSandbox, Scenario, DecisionTree) last.',
  'Mix interactive section types. Never build a topic out of Text sections only.',
  'Fit each section to its own content rather than to the example: different section types, and different layouts for standard OpenUI sections (Steps, CodeBlock, cards, EntityList, a chart or a table, an Svg drawing, …).',
  'Write a narration file for every section, at least one NarrationStep per beat of that section type (see Narration Files), in the topic\'s language.',
  'Quizzes and reflection challenges only test what an earlier section of the topic teaches. Each QuizQuestion has exactly one choice with `correct` set to true.',
  'IDs (`id` props) are unique within their section. Props that point at an ID (`next`, `root`, `startNode`, `recommended`, `solution`, `continuesAs`, `initialState`, `dependsOn`) must name an ID that exists in the same section.',
  'Flowcharts follow the Event Storming cycle EVENT → POLICY → COMMAND → System (handledBy) → EVENT for every step. Every declared Actor starts (`initiatedBy`) or receives (`sendsTo`) at least one step, and every declared System handles (`handledBy`), is called by (`delegatesTo`) or receives (`sendsTo`) at least one step. Set `sendsTo` on every step whose events go to another actor or system: the Sequence and System Architecture views draw only declared messages. When a System has a StateMachine, set `enters` on each Event that moves it into a new state (a MachineState ID); the State Machine view draws its transitions only from those. Set `data` on an Event when the data it carries matters to the lesson (e.g. "Query embedding vector"); the Data Flow view names the data with it. Set `async` on a Step or BranchOption whose command is fired without waiting for a reply (e.g. a queued job or a notification). Set `initialView` on the Flowchart when another view tells the lesson better than Event Storming: "sequence" for a protocol or request/response exchange, "architecture" for which systems talk to which, "swimlanes" for who does what, "data-flow" for how data changes, "state-machine" for the lifecycle of one object.',
  'To skip an optional argument and still set a later one, pass `null` in its place, e.g. `Step("s1", "When …", "DoThing", sys, [evt], null, null, "s2")`.',
  'Text paragraphs may use inline markdown (**bold**, `code`, [links](url)). Write factual, specific content; no placeholders such as "Lorem ipsum" or "TODO".',
]

/** A complete, valid topic in the single-file format (checked by unit tests). */
export const AUTHORING_EXAMPLE = `// @loom-topic green-tea
// === topic.oui ===
root = Topic("Brewing Green Tea", "Food & Drink", "Water temperature, steep time and leaf ratio for a sweet, balanced cup of green tea.", [SectionRef("intro"), SectionRef("vocabulary"), SectionRef("brewing-flow"), SectionRef("steep-guide"), SectionRef("knowledge-check")], ["tea", "brewing"], "beginner")

// === sections/intro.oui ===
root = Intro("Brewing Green Tea", what, why, [RoadmapStep("Vocabulary", "flashcards", "Learn the words tea brewers use.", "vocabulary"), RoadmapStep("Brewing flow", "flowchart", "Follow one brew from kettle to cup.", "brewing-flow"), RoadmapStep("Knowledge check", "quiz", "Test what you learned.", "knowledge-check")], "Cooler water, shorter steeps", "10 min", 3)
what = IntroWhat("Green tea is unoxidised tea leaf brewed in water well below boiling.", "Green tea: leaves of Camellia sinensis, heated soon after picking so they do not oxidise.", ["Water at 70–80 °C", "Steeps of 1–3 minutes", "About 2 g of leaf per 100 ml"], ["tea", "temperature"])
why = IntroWhy("Boiling water and long steeps pull out bitter catechins and hide the sweet, grassy flavour.", "A few degrees and seconds change the cup more than the price of the leaf.")

// === sections/vocabulary.oui ===
root = Flashcards("Vocabulary", [catechins, steep])
catechins = Flashcard("catechins", "Catechins", "/ˈkætɪkɪnz/", "chemistry", "Bitter, astringent compounds in tea leaf.", "Antioxidant polyphenols that dissolve faster in hotter water and over longer steeps.", "They are what makes over-brewed green tea taste harsh.")
steep = Flashcard("steep", "Steep", "/stiːp/", "technique", "Soaking leaves in hot water.", "The time leaves spend in the water; each extra minute extracts more bitterness than flavour.", "Steep time is the easiest variable to control.")

// === sections/brewing-flow.oui ===
root = Flowchart("Brewing Flow", [brewer], [kettle, teapot], [heat, brew], [happy], "From kettle to cup")
brewer = Actor("brewer", "Brewer", "Person making the tea")
kettle = System("kettle", "Kettle", "Heats water to a set temperature", "external")
teapot = System("teapot", "Teapot", "Holds leaf and water while it steeps", "aggregate")
heat = Step("heat-water", "When a cup is wanted", "HeatWater", kettle, [Event("water-ready", "Water Ready", "Water at 75 °C")], brewer, null, "steep-leaves", null, teapot)
brew = Step("steep-leaves", "When water is ready", "SteepLeaves", teapot, [Event("tea-steeped", "Tea Steeped")])
happy = Journey("happy", "Balanced cup", "Heat, steep and pour on time", [JourneyStep(heat, "Heat water", "The kettle stops at 75 °C instead of boiling."), JourneyStep(brew, "Steep", "Two minutes, then pour off all the water.")])

// === sections/steep-guide.oui ===
// @openui "Steep Guide" "Starting points by tea"
root = Card([table, tip])
table = Table([Col("Tea", ["Sencha", "Gyokuro", "Matcha"]), Col("Water (°C)", [75, 60, 80], "number"), Col("Steep", ["1–2 min", "2 min", "Whisk 15 s"])])
tip = Callout("info", "Adjust to taste", "Bitter? Cooler water or a shorter steep. Flat? The opposite.")

// === sections/knowledge-check.oui ===
root = Quiz("Knowledge Check", [q1])
q1 = QuizQuestion("q1", "Why does boiling water make green tea bitter?", [QuizChoice("a", "It extracts catechins quickly", true, "Hot water dissolves bitter catechins faster than flavour compounds."), QuizChoice("b", "It removes the caffeine", false, "Caffeine is extracted, not removed, and it is only mildly bitter.")], "Look back at the vocabulary cards.")
`

/**
 * lang-core lines written for a single streamed program, rewritten for a
 * topic of several files. `replaceOnce` throws when lang-core changes its
 * wording, so a dependency upgrade cannot silently leave them in.
 */
const REWRITES: Array<[string, string]> = [
  ['prefer references for better streaming.', 'prefer references for readability.'],
  ['## Hoisting & Streaming (CRITICAL)', '## Hoisting & Statement Order'],
  [
    'every program must define `root = Topic(...)`',
    'every file must define `root`: `root = Topic(...)` in topic.oui, `root = <Section>(...)` in a section file',
  ],
  [
    'During streaming, the output is re-parsed on every chunk.',
    'In each file, write the `root = ...` statement first, then the statements it references.\n\nSTREAMING_NOTES',
  ],
  [
    '- Choose components that best represent the content (tables for comparisons, charts for trends, forms for input, etc.)',
    '- Choose the section types that best teach the content (see Loom Authoring Rules).',
  ],
  ['1. root = Topic(...) is the FIRST line (for optimal streaming).', '1. In every file, the `root = ...` statement comes first.'],
]

function replaceOnce(text: string, from: string, to: string): string {
  const i = text.indexOf(from)
  if (i < 0) throw new Error(`Loom authoring prompt: lang-core prompt no longer contains ${JSON.stringify(from)}`)
  return text.slice(0, i) + to + text.slice(i + from.length)
}

/** Drop lang-core's streaming advice (between the marker and the next section). */
function dropStreamingNotes(text: string): string {
  const start = text.indexOf('STREAMING_NOTES')
  const end = text.indexOf('\n## ', start)
  if (start < 0 || end < 0) throw new Error('Loom authoring prompt: lang-core streaming section not found')
  return text.slice(0, start).trimEnd() + '\n' + text.slice(end).replace(/^\n+/, '\n')
}

/**
 * The full authoring prompt: Loom preamble and output formats, the OpenUI
 * Lang syntax with every component and prop described, a worked example and
 * the Loom authoring rules.
 */
export function getLoomAuthoringPrompt(): string {
  let prompt = getLoomOUIPrompt({
    preamble: PREAMBLE,
    examples: [`A complete topic in the single .oui file format:\n\n\`\`\`\n${AUTHORING_EXAMPLE}\`\`\``],
  })
  for (const [from, to] of REWRITES) prompt = replaceOnce(prompt, from, to)
  prompt = dropStreamingNotes(prompt)
  return `${prompt.trimEnd()}\n\n${STANDARD_OPENUI}\n\n${TABLES_AND_CHARTS}\n\n${LAYOUTS}\n\n${DRAWINGS}\n\n${NARRATION}\n\n${BULLET_AUTHORING_GUIDE}\n\n## Loom Authoring Rules\n\n${AUTHORING_RULES.map((r) => `- ${r}`).join('\n')}\n`
}
