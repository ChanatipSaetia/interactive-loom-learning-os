/**
 * LLM authoring prompt: everything an external LLM chat needs to write a
 * whole Loom topic that Loom Viewer and Loom Studio can open.
 *
 * It is the Loom OpenUI Lang prompt (lang-core's prompt with every prop
 * described, see `getLoomOUIPrompt`) with a Loom preamble (topic layout and
 * the output formats), authoring rules and a worked example.
 * `npm run oui:schema` publishes it as `public/llm/loom-authoring-prompt.md`.
 */
import { LOOM_PAGES_URL } from './llm-guide'
import { getLoomOUIPrompt } from './library'

export { LOOM_PAGES_URL }

/** Official OpenUI docs (linked from the @openuidev package READMEs). */
export const OPENUI_LANG_DOCS_URL = 'https://openui.com/docs/openui-lang'
export const OPENUI_REACT_UI_DOCS_URL = 'https://openui.com/docs/api-reference/react-ui'

const PREAMBLE = `You write learning topics for Interactive Loom, an interactive learning app. Content is written in openui-lang, a small declarative language described below.

## Topic Layout

A topic is a folder named after its topic ID (lowercase letters, digits, \`-\` and \`_\`, e.g. \`http-caching\`):

- \`topic.oui\`: \`root = Topic(...)\`, the catalog metadata and the ordered list of \`SectionRef("<name>")\`.
- \`sections/<name>.oui\`: one section per file, \`root = <Section>(...)\` where \`<Section>\` is a section component (Intro, Text, Bullets, Flowchart, Quiz, …), or a standard OpenUI section (see Standard OpenUI Sections).

Every file is its own openui-lang program: it has its own \`root\` and its own statement names, so names may repeat across files.
In the rules below, "program" means one file. The \`root\` of \`topic.oui\` is \`Topic(...)\`; the \`root\` of a section file is a section component.

## Output Formats

Answer in the format the user asks for. If they do not say, use the single .oui file.

1. **Single .oui file** (\`<topic-id>.loom.oui\`): the first line is \`// @loom-topic <topic-id>\`, then every file of the topic, each after a marker line \`// === <path> ===\`. Put it in one code block. For several topics, repeat the \`// @loom-topic\` line before each topic's files.

   \`\`\`
   // @loom-topic <topic-id>
   // === topic.oui ===
   root = Topic(...)
   // === sections/intro.oui ===
   root = Intro(...)
   \`\`\`

2. **Folder of .oui files**: one code block per file, each preceded by its path (\`<topic-id>/topic.oui\`, \`<topic-id>/sections/<name>.oui\`) so the user can save them into that folder.

The user opens the result in Loom Viewer (${LOOM_PAGES_URL}viewer.html) or imports it into Loom Studio. Outside the code block(s), say nothing or at most one short sentence.`

const STANDARD_OPENUI = `## Standard OpenUI Sections

When no Loom section fits (a comparison table, a chart, KPI cards, free-form tabs), a section file can instead be a standard OpenUI program:

- Its first line is \`// @openui "<Section title>" "<optional heading>"\`.
- The rest is openui-lang written with the standard OpenUI component library (\`@openuidev/react-ui\`: Stack, Card, CardHeader, TextContent, Callout, Tabs, TabItem, Accordion, Steps, Table, Col, BarChart, LineChart, PieChart, …), not the Loom components above. Its \`root\` is usually Card, Stack or Tabs.
- Component reference: ${OPENUI_REACT_UI_DOCS_URL}. Language specification: ${OPENUI_LANG_DOCS_URL}.
- Content is static: no Query(), Mutation(), tools or actions (there is no backend).
- List it in topic.oui with \`SectionRef\` like any other section. Prefer Loom sections; use standard OpenUI for the few parts that need a free-form layout.

The \`sections/steep-guide.oui\` file in the example above is a standard OpenUI section.`

const AUTHORING_RULES = [
  'Every `SectionRef("<name>")` in topic.oui has a matching `sections/<name>.oui` file, and every section file is listed exactly once. Section names use lowercase letters, digits, `-` and `_`.',
  'Start with an `Intro` section; then build understanding step by step: vocabulary (Flashcards) and maps (ConceptMap, TaxonomyBrowser) before explanations (Text, Bullets), processes (Flowchart) before practice (ReflectionSequence, Quiz), and trade-offs or decisions (TradeoffSandbox, FormulaSandbox, Scenario, DecisionTree) last.',
  'Mix interactive section types. Never build a topic out of Text sections only.',
  'Quizzes and reflection challenges only test what an earlier section of the topic teaches. Each QuizQuestion has exactly one choice with `correct` set to true.',
  'IDs (`id` props) are unique within their section. Props that point at an ID (`next`, `root`, `startNode`, `recommended`, `solution`, `continuesAs`, `initialState`, `dependsOn`) must name an ID that exists in the same section.',
  'Flowcharts follow the Event Storming cycle EVENT → POLICY → COMMAND → System (handledBy) → EVENT for every step. Every declared Actor starts at least one step (`initiatedBy`) and every declared System handles (`handledBy`) or receives (`delegatesTo`) at least one step.',
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
heat = Step("heat-water", "When a cup is wanted", "HeatWater", kettle, [Event("water-ready", "Water Ready", "Water at 75 °C")], brewer, null, "steep-leaves")
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
  return `${prompt.trimEnd()}\n\n${STANDARD_OPENUI}\n\n## Loom Authoring Rules\n\n${AUTHORING_RULES.map((r) => `- ${r}`).join('\n')}\n`
}
