/** One valid `.oui` section source per Loom section type. */
export const SECTION_FIXTURES: Record<string, string> = {
  intro: `
root = Intro("AI Agents", what, why, [RoadmapStep("Quiz", "quiz", "Check yourself", "quiz")], "Subtitle", "5 min", 3)
what = IntroWhat("Agents act on goals.", "An agent is…", ["Loops"], ["LLM"])
why = IntroWhy("Prompts alone break.", "Reliability")
`,
  text: `
root = Text("Overview", [
  "First paragraph.",
  "Second paragraph.",
])
`,
  openui: `
// @openui "Plans" "Pick one"
root = Card([header, tabs])
header = CardHeader("Plans", "Compare what you get")
tabs = Tabs([TabItem("free", "Free", [TextContent("Up to **3** projects.")]), TabItem("pro", "Pro", [Callout("info", "Pro", "Unlimited projects.")])])
`,
  bullets: `
root = Bullets("Capabilities", [Bullet("Tool use", [Bullet("Search"), Bullet("Code")]), Bullet("Memory")], true)
`,
  'taxonomy-browser': `
root = TaxonomyBrowser("Taxonomy", [planning])
planning = TaxonomyCategory("Planning", "Think first", "Brain", "blue", "Desc", "Details", "Like a map", "Goals", ["Plans"], ["Execution"])
`,
  'image-gallery': `
root = ImageGallery("Gallery", [GalleryImage("img1", "/a.png", "Caption", "Credit")])
`,
  'pillar-layer': `
root = PillarLayer("Stack", [clients, infra], [web, db], "Layers")
clients = Layer("l-clients", "Clients", "Apps", [LayerItem("SPA")])
infra = Layer("l-infra", "Infra")
web = MatrixBlock("b-web", "Web", clients, 0, 1, 1, "Web app", "blue", ["b-db"])
db = MatrixBlock("b-db", "DB", "l-infra", 0)
`,
  flowchart: `
root = Flowchart("Checkout", [buyer], [orders, pay], [place, payBranch], [happy])
buyer = Actor("buyer", "Buyer", "Person placing the order")
orders = System("orders", "Order Service", "Owns orders", "aggregate")
pay = System("pay", "Payment", "Payment provider", "external")
place = Step("place-order", "When cart is submitted", "PlaceOrder", orders, [Event("order-placed", "Order Placed")], buyer)
payBranch = Branch("pay-branch", "Order Placed", [ok, declined])
ok = BranchOption("ok", "Approved", "When order placed", "Charge", pay, [Event("paid", "Paid")])
declined = BranchOption("declined", "Declined", "When card declined", "Cancel", orders, [Event("cancelled", "Cancelled")], true)
happy = Journey("happy", "Happy path", "Order goes through", [
  JourneyStep(place, "Place order", "Buyer submits the cart"),
  JourneyStep(ok, "Pay", "Card is charged"),
])
`,
  scenario: `
root = Scenario("Deploying", "deploy", [start, done], "You must deploy.")
start = ScenarioNode("start", "What first?", [ScenarioChoice("a", "Ship it", "done")])
done = ScenarioNode("done", null, null, Outcome("Shipped", "Fast but risky", "b-plus"))
`,
  'tradeoff-sandbox': `
root = TradeoffSandbox("Trade-offs", [web])
web = TradeoffScenario("web", "Web App", [perf], [frontend], "Build a web app")
perf = TradeoffMetric("performance", "Performance", 50, 0, 100, "higher")
frontend = TradeoffStep("frontend", "Frontend", [spa], "Pick a frontend", "spa")
spa = TradeoffChoice("spa", "SPA", "Single page app", {performance: 10}, [ProCon("Snappy")], [ProCon("SEO", "Needs SSR")])
`,
  'formula-sandbox': `
root = FormulaSandbox("RAG Sandbox", [FormulaVariable("chunk_size", "Chunk size", 64, 1024, 64, 256)], [cost])
cost = FormulaMetric("cost", "Cost", "chunk_size * 2", "Token cost", "Like a taxi meter")
`,
  'decision-tree': `
root = DecisionTree("Pick an architecture", "arch", "start", [start, single])
start = DecisionNode("start", "How complex?", [DecisionChoice("simple", "Simple", "single", "Keep it small", true)])
single = DecisionNode("single", null, null, DecisionLeaf("Single agent", "Fewer moving parts", ["Less parallelism"]))
`,
  'reflection-sequence': `
root = ReflectionSequence("Order it", [SequenceChallenge("Order the loop", [plan, act], [plan, "act"])])
plan = SequenceItem("plan", "Plan", "🧭")
act = SequenceItem("act", "Act")
`,
  'reflection-template': `
root = ReflectionTemplate("Explain it", [TemplateChallenge("Fill in", "Smaller chunks are {zone-1}.", [Chip("chip-a", "more precise")], {"zone-1": "chip-a"}, "Because…")])
`,
  quiz: `
root = Quiz("Knowledge Check", [q1])
q1 = QuizQuestion("q1", "What is an agent?", [
  QuizChoice("a", "A goal-directed loop", true, "Correct."),
  QuizChoice("b", "A database", false, "No."),
], "Think loops")
`,
  flashcards: `
root = Flashcards("Vocabulary", [Flashcard("t1", "Agent", "AY-jent", "Core", "Short", "Detailed", "Matters", null, Dialogue("Hi", "Hmm", "Why?"))])
`,
  'concept-map': `
root = ConceptMap("Concepts", [agent, tool], [ConceptLink(agent, tool, "uses"), ConceptLink("tool", "agent")])
agent = Concept("agent", "Agent", "core")
tool = Concept("tool", "Tool")
`,
}
