/**
 * Starter `.oui` sources for new sections and topics in Loom Studio.
 * Every template is a small, valid example of its section type.
 */
import { printOUITopic } from '../../../learning-engine/composition/oui/print'

export interface SectionTemplate {
  /** Section type (e.g. "quiz"). */
  type: string
  /** OpenUI component name (e.g. "Quiz"). */
  component: string
  label: string
  description: string
  source: (title: string) => string
}

const q = (text: string) => JSON.stringify(text)

export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    type: 'intro',
    component: 'Intro',
    label: 'Intro',
    description: 'Topic opener with what / why and a roadmap',
    source: (title) => `root = Intro(${q(title)}, what, why, [RoadmapStep("Next section", "text", "What comes next")])

what = IntroWhat("One-sentence summary of the topic.", "A precise definition.", ["Key point"], ["tag"])

why = IntroWhy("Why this topic matters.", "The impact of understanding it.")
`,
  },
  {
    type: 'text',
    component: 'Text',
    label: 'Text',
    description: 'Paragraphs of prose',
    source: (title) => `root = Text(${q(title)}, [
  "First paragraph.",
  "Second paragraph.",
])
`,
  },
  {
    type: 'bullets',
    component: 'Bullets',
    label: 'Bullets',
    description: 'Bulleted or numbered checklist',
    source: (title) => `root = Bullets(${q(title)}, [
  Bullet("First point", [Bullet("Detail")]),
  Bullet("Second point"),
], false)
`,
  },
  {
    type: 'openui',
    component: 'OpenUI',
    label: 'OpenUI',
    description: 'Any standard OpenUI components (cards, tabs, tables, charts…)',
    source: (title) => `// @openui ${q(title)}
root = Card([header, tabs])

header = CardHeader("Heading", "A short subtitle")

tabs = Tabs([
  TabItem("first", "First", [TextContent("Content with **markdown**.")]),
  TabItem("second", "Second", [Callout("info", "Tip", "Callouts highlight key points.")]),
])
`,
  },
  {
    type: 'taxonomy-browser',
    component: 'TaxonomyBrowser',
    label: 'Taxonomy Browser',
    description: 'Browsable category cards',
    source: (title) => `root = TaxonomyBrowser(${q(title)}, [category])

category = TaxonomyCategory(
  "Category",
  "Short subtitle",
  "Compass",
  "blue",
  "What this category covers.",
  "More detail.",
  "An everyday analogy.",
  "Primary focus",
  ["In scope"],
  ["Out of scope"],
)
`,
  },
  {
    type: 'image-gallery',
    component: 'ImageGallery',
    label: 'Image Gallery',
    description: 'Captioned images',
    source: (title) => `root = ImageGallery(${q(title)}, [GalleryImage("image-1", "https://example.com/image.png", "Caption")])
`,
  },
  {
    type: 'pillar-layer',
    component: 'PillarLayer',
    label: 'Pillar & Layer',
    description: 'Layer-stack map of blocks',
    source: (title) => `root = PillarLayer(${q(title)}, [top, bottom], [web, db])

top = Layer("top", "Top layer")
bottom = Layer("bottom", "Bottom layer")

web = MatrixBlock("web", "Web app", top, 0, 1, 1, "Talks to the database", "blue", ["db"])
db = MatrixBlock("db", "Database", bottom, 0)
`,
  },
  {
    type: 'flowchart',
    component: 'Flowchart',
    label: 'Flowchart',
    description: 'Event Storming flow with journeys',
    source: (title) => `root = Flowchart(${q(title)}, [user], [service], [submit], [happy])

user = Actor("user", "User", "Person starting the flow")

service = System("service", "Service", "Handles the request", "aggregate")

submit = Step("submit", "When the user submits", "SubmitRequest", service, [Event("request-submitted", "Request Submitted")], user)

happy = Journey("happy", "Happy path", "The request succeeds", [JourneyStep(submit, "Submit", "The user submits a request")])
`,
  },
  {
    type: 'scenario',
    component: 'Scenario',
    label: 'Scenario',
    description: 'Branching "what would you do?" story',
    source: (title) => `root = Scenario(${q(title)}, "scenario", [start, good, risky], "Set the scene.")

start = ScenarioNode("start", "What do you do?", [
  ScenarioChoice("careful", "Take the careful option", "good"),
  ScenarioChoice("fast", "Take the fast option", "risky"),
])

good = ScenarioNode("good", null, null, Outcome("Solid choice", "Why this worked.", "a"))
risky = ScenarioNode("risky", null, null, Outcome("It worked, barely", "What could have gone wrong.", "b-minus"))
`,
  },
  {
    type: 'tradeoff-sandbox',
    component: 'TradeoffSandbox',
    label: 'Trade-off Sandbox',
    description: 'Design choices that move metrics',
    source: (title) => `root = TradeoffSandbox(${q(title)}, [scenario])

scenario = TradeoffScenario("scenario", "Scenario", [TradeoffMetric("cost", "Cost", 50, 0, 100, "lower")], [step])

step = TradeoffStep("step", "First decision", [optionA, optionB], "Pick one", "option-a")

optionA = TradeoffChoice("option-a", "Option A", "Cheaper", {cost: -10}, [ProCon("Cheap")], [ProCon("Slower")])
optionB = TradeoffChoice("option-b", "Option B", "Pricier", {cost: 10}, [ProCon("Faster")], [ProCon("Expensive")])
`,
  },
  {
    type: 'formula-sandbox',
    component: 'FormulaSandbox',
    label: 'Formula Sandbox',
    description: 'Sliders driving computed metrics',
    source: (title) => `root = FormulaSandbox(${q(title)}, [FormulaVariable("x", "Input", 0, 100, 1, 50)], [result])

result = FormulaMetric("double", "Doubled", "x * 2", "Twice the input")
`,
  },
  {
    type: 'decision-tree',
    component: 'DecisionTree',
    label: 'Decision Tree',
    description: 'Question flow ending in recommendations',
    source: (title) => `root = DecisionTree(${q(title)}, "advisor", "start", [start, small, large])

start = DecisionNode("start", "How big is the project?", [
  DecisionChoice("small", "Small", "small"),
  DecisionChoice("large", "Large", "large"),
])

small = DecisionNode("small", null, null, DecisionLeaf("Keep it simple", "Small projects need little process."))
large = DecisionNode("large", null, null, DecisionLeaf("Add structure", "Large projects need coordination."))
`,
  },
  {
    type: 'reflection-sequence',
    component: 'ReflectionSequence',
    label: 'Reflection Sequence',
    description: 'Put steps in the right order',
    source: (title) => `root = ReflectionSequence(${q(title)}, [challenge])

challenge = SequenceChallenge("Put the steps in order", [first, second], [first, second])

first = SequenceItem("first", "First step")
second = SequenceItem("second", "Second step")
`,
  },
  {
    type: 'reflection-template',
    component: 'ReflectionTemplate',
    label: 'Reflection Template',
    description: 'Fill-in-the-blank self-explanation',
    source: (title) => `root = ReflectionTemplate(${q(title)}, [challenge])

challenge = TemplateChallenge(
  "Complete the sentence",
  "Practice makes learning {zone-1}.",
  [Chip("chip-stick", "stick"), Chip("chip-fade", "fade")],
  {"zone-1": "chip-stick"},
  "Retrieval practice strengthens memory.",
)
`,
  },
  {
    type: 'quiz',
    component: 'Quiz',
    label: 'Quiz',
    description: 'Multiple-choice knowledge check',
    source: (title) => `root = Quiz(${q(title)}, [q1])

q1 = QuizQuestion("q1", "Your question?", [
  QuizChoice("a", "Correct answer", true, "Why it is right."),
  QuizChoice("b", "Wrong answer", false, "Why it is wrong."),
])
`,
  },
  {
    type: 'flashcards',
    component: 'Flashcards',
    label: 'Flashcards',
    description: 'Vocabulary flip cards',
    source: (title) => `root = Flashcards(${q(title)}, [card])

card = Flashcard("term", "Term", "term", "Category", "Short definition.", "Longer definition.", "Why it matters.")
`,
  },
  {
    type: 'concept-map',
    component: 'ConceptMap',
    label: 'Concept Map',
    description: 'Concepts and their relations',
    source: (title) => `root = ConceptMap(${q(title)}, [a, b], [ConceptLink(a, b, "relates to")])

a = Concept("a", "Concept A")
b = Concept("b", "Concept B")
`,
  },
]

export function getSectionTemplate(type: string): SectionTemplate | undefined {
  return SECTION_TEMPLATES.find((t) => t.type === type)
}

/** Turn a folder name like "my-topic" into "My Topic". */
export function humanize(name: string): string {
  return name.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim() || 'New Topic'
}

/** `topic.oui` for a brand-new topic in an empty folder. */
export function newTopicSource(folderName: string): string {
  return printOUITopic({ title: humanize(folderName), category: 'Uncategorized', description: '', sections: [] })
}
