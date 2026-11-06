/** Authored regression fixture, not observed external-assistant output or benchmark data. */
import type { TopicPlan } from '../../../src/core/learning-engine/composition/oui/topic-plan'

const rows = [
  ['terms', 'flashcards', 'Define scene, camera and renderer', 'Explain each term in a rendering pipeline', 'Read concise definitions, then attempt recall before flipping', 'Flashcards introduce definitions and meanings; flipping is exposure, not correctness.', 'Reveal each front and definition back; Read permits learner-paced recall.'],
  ['comparison', 'openui', 'Compare authoring approaches', 'Explain a factual difference without assuming measured performance', 'Look up matching authoring attributes across Three.js and Spline', 'A static factual table compares code-oriented Three.js and visual Spline authoring without invented benchmark data.', 'composition: Table; Read the table by attribute; Present narrates one column relationship at a time.'],
  ['pipeline', 'flowchart', 'Trace the rendering request', 'Explain which component handles a render request', 'Trace a render request and its result between application and renderer', 'Flowchart preserves component participation and message order; the same linear process has two useful perspectives.', 'initialView: architecture; follow Journey frame; NarrationStep.view sequence on step1 explains message ordering.'],
  ['layers', 'pillar-layer', 'Explain layered dependencies', 'Identify which application layer depends on the rendering foundation', 'Inspect application above rendering infrastructure and explain the dependency', 'Pillar Layer shows what builds on the rendering foundation rather than repeating request ordering.', 'Reveal foundation before application layer, then overview.'],
  ['examples', 'openui', 'Recognize authoring examples', 'Identify the authoring approach used in each example', 'Inspect a code-driven object and a visually composed object side by side', 'OpenUI cards hold concise examples without pretending to run a live 3D configurator.', 'composition: Card; Present one named card per beat; keep both examples visible in Read.'],
  ['setup', 'bullets', 'Initialize a Three.js scene', 'Reconstruct the scene initialization sequence', 'Follow numbered instructions to create scene, camera, renderer, geometry/materials and animation loop', 'Ordered Bullets give concise linear implementation instructions; no extra interaction model is needed.', 'Reveal numbered instructions one at a time; Read retains the checklist.'],
  ['choices', 'tradeoff-sandbox', 'Evaluate authoring options', 'Justify an approach for a supplied project constraint', 'Compare control and authoring workflow for a code-owned experience versus a visual prototype', 'Tradeoff Sandbox explores option suitability; qualitative strengths and limitations are not empirical performance measurements.', 'Compare authored options in Present; Read allows choosing them and inspecting their consequences.'],
  ['experience', 'user-journey', 'Explain configurator experience', 'Identify friction when a shopper configures an item', 'Follow a shopper choosing a finish and inspecting the result', 'User Journey follows a person across stages, distinct from the internal rendering pipeline.', 'Focus each stage goal, action and response; inspect the whole journey in Read.'],
  ['failure', 'scenario', 'Respond to an unverified performance claim', 'Choose a grounded response when performance data is missing', 'Choose whether to claim a faster tool or request matched measurements', 'Scenario teaches decisions and consequences when evidence is unavailable; it complements the factual table.', 'Show choices before consequences; Read captures learner-controlled exploration.'],
  ['assessment', 'quiz', 'Assess authoring judgment', 'Answer the authored application question correctly and explain the choice', 'Submit an answer about choosing an authoring approach', 'Quiz collects an explicit response after the factual comparison and tradeoffs; viewing other sections is not mastery.', 'Present demonstrates feedback; use Read for actual attempts.'],
] as const

export const THREE_SPLINE_PLAN: TopicPlan = {
  schemaVersion: 1, topicId: 'three-spline', goal: 'Understand Three.js and Spline authoring, rendering and project choices', audience: 'Developers learning 3D web authoring',
  objectives: rows.map(([id, , description, evidenceOfLearning]) => ({ id, description, evidenceOfLearning })),
  sections: rows.map(([id, representation, title, , activity, rationale, strategy]) => ({ id, title, representation, library: representation === 'openui' ? 'openui' : 'loom', objectiveRefs: [id], activity, rationale, presentation: { target: 'both', strategy }, ...(id === 'assessment' ? { assessment: { itemRefs: ['sections/assessment.oui#q1'], successCriterion: 'Select the code-owned approach for custom code control' } } : {}) })),
}

/** Source-supported toy rendering model: no invented lifecycle or numerical data. */
export const RENDER_FLOW = (view = 'architecture') => `root = Flowchart("Render request", [developer], [app, renderer], [render], [frame], null, null, "${view}")
developer = Actor("developer", "Developer", "Runs the application")
app = System("app", "Application", "Owns the scene and camera", "service")
renderer = System("renderer", "Renderer", "Draws the scene", "service")
render = Step("render", "When a frame is requested", "Render scene with camera", app, [Event("drawn", "Frame drawn", null, null, "Rendered frame")], developer, renderer, null, null, developer)
frame = Journey("frame", "One frame", "Follow the rendering request", [JourneyStep(render, "Render", "Application calls renderer with scene and camera")])`

export const THREE_SPLINE_FILES: Record<string, string> = {
  'topic.oui': `root = Topic("Three.js and Spline", "3D web", "Choose an authoring approach and trace rendering", [${rows.map(([id]) => `SectionRef("${id}")`).join(', ')}])`,
  'sections/terms.oui': `root = Flashcards("Rendering terms", [scene, camera, renderer])
scene = Flashcard("scene", "Scene", "scene", "Rendering", "The container of objects to render.", "It groups the objects supplied for rendering.", "The renderer needs a scene.")
camera = Flashcard("camera", "Camera", "camera", "Rendering", "Defines the viewpoint used to render the scene.", "It determines the view of the objects.", "The renderer needs a viewpoint.")
renderer = Flashcard("renderer", "Renderer", "renderer", "Rendering", "Draws a scene from a camera viewpoint.", "It takes the scene and camera when drawing a frame.", "It produces the displayed result.")`,
  'sections/comparison.oui': `// @openui "Authoring approaches"
root = Table([Col("Approach", ["Three.js", "Spline"]), Col("Authoring", ["JavaScript code", "Visual editor"]), Col("Primary artifact", ["Application code", "Designed scene"])])`,
  'sections/pipeline.oui': RENDER_FLOW(),
  'sections/pipeline.narrate.oui': `root = Narration([NarrationStep("title", "Trace the rendering request"), chart, participants, messages])
chart = NarrationStep("chart", "First identify the participating components.", null, "architecture")
participants = NarrationStep("step1", "The application owns scene and camera; the renderer draws them.", null, "architecture")
messages = NarrationStep("step1", "Now trace the request and returned frame in order.", null, "sequence")`,
  'sections/layers.oui': `root = PillarLayer("Rendering dependencies", [application, foundation], [product, engine])
application = Layer("application", "Application", "Uses rendering")
foundation = Layer("foundation", "Rendering foundation", "Supports application")
product = MatrixBlock("product", "Product logic", application, 0, 1, 1, "Owns application behavior", "blue", ["engine"])
engine = MatrixBlock("engine", "Rendering", foundation, 0)`,
  'sections/examples.oui': `// @openui "Concrete examples"
root = Stack([code, visual])
code = Card([CardHeader("Code-driven object"), TextContent("A developer constructs geometry and materials in application code.")])
visual = Card([CardHeader("Visual composition"), TextContent("A designer arranges objects and materials in a visual editor.")])`,
  'sections/setup.oui': `root = Bullets("Initialize a scene", [Bullet("Create scene"), Bullet("Configure camera"), Bullet("Initialize renderer"), Bullet("Add geometry and materials"), Bullet("Start animation loop")], true)`,
  'sections/choices.oui': `root = TradeoffSandbox("Authoring choices", [project])
project = TradeoffScenario("project", "Choose for project constraints", [], [approach], "Qualitative comparison; no measured performance scores")
approach = TradeoffStep("approach", "Authoring approach", [code, visual])
code = TradeoffChoice("code", "Three.js", "Code-owned behavior", {}, [ProCon("Custom code control")], [ProCon("Requires programming")])
visual = TradeoffChoice("visual", "Spline", "Visual authoring", {}, [ProCon("Visual composition workflow")], [ProCon("Check integration requirements")])`,
  'sections/experience.oui': `root = UserJourney("Configure a product", "Shopper", "Inspect a finish before choosing", [choose, inspect])
choose = JourneyStage("Choose", "Try a finish", "Select a finish option.", "The displayed object changes finish.")
inspect = JourneyStage("Inspect", "Check appearance", "Inspect the configured object.", "The chosen finish remains visible.")`,
  'sections/failure.oui': `root = Scenario("Missing performance evidence", "evidence", [start, grounded, unsupported])
start = ScenarioNode("start", "No matched measurements are available. What should you do?", [ScenarioChoice("measure", "Request matched measurements", "grounded"), ScenarioChoice("guess", "Claim the visual tool is faster", "unsupported")])
grounded = ScenarioNode("grounded", null, null, Outcome("Grounded decision", "Compare the same workload and target device before making a performance claim.", "a"))
unsupported = ScenarioNode("unsupported", null, null, Outcome("Unsupported claim", "Authoring workflow alone does not establish runtime performance.", "b-plus"))`,
  'sections/assessment.oui': `root = Quiz("Apply the comparison", [q1])
q1 = QuizQuestion("q1", "A project requires custom code-owned rendering behavior. Which approach directly matches that requirement?", [QuizChoice("code", "Three.js application code", true, "It directly exposes a code-owned rendering workflow."), QuizChoice("speed", "Choose by an unverified speed claim", false, "No matched performance evidence was supplied.")])`,
}
const narration: Record<string, Array<[string, string]>> = {
  terms: [['card1', 'What is a scene?'], ['card1.back', 'It groups the objects supplied to the renderer.'], ['card2', 'What does the camera contribute?'], ['card2.back', 'It defines the viewpoint.'], ['card3', 'What draws the frame?'], ['card3.back', 'The renderer draws the scene using the camera.']],
  comparison: [['all', 'Compare authoring workflows, not unmeasured performance. Three.js uses application code; Spline offers a visual editor.']],
  layers: [['layer2', 'Rendering supports the application.'], ['layer1', 'Product behavior depends on that foundation.'], ['overview', 'A dependency is different from a message sequence.']],
  examples: [['part1', 'Application code constructs geometry and materials.'], ['part2', 'A visual editor arranges objects and materials. Neither static card is a running configurator.']],
  setup: [['item1', 'Create the container for objects.'], ['item2', 'Configure the viewpoint.'], ['item3', 'Initialize the renderer.'], ['item4', 'Add geometry and materials.'], ['item5', 'Start the loop that requests frames.']],
  choices: [['situation1', 'Choose an authoring approach for the actual project constraints.'], ['step1', 'Compare custom code control with a visual composition workflow.'], ['step1.choice1', 'Code control requires programming.'], ['step1.choice2', 'Visual composition still requires checking integration requirements.']],
  experience: [['overview', 'Follow the shopper rather than the internal rendering system.'], ['stage1.goal', 'The shopper wants to try a finish.'], ['stage1.action', 'They select a finish option.'], ['stage1.response', 'The displayed object changes finish.'], ['stage2.goal', 'Now inspect appearance.'], ['stage2.action', 'Inspect the configured object.'], ['stage2.response', 'The selected finish remains visible.']],
  failure: [['start', 'Matched performance measurements are missing.'], ['path1.choice1', 'An unsupported speed claim guesses from the workflow.'], ['path1.choice1.next', 'Authoring workflow alone cannot establish runtime performance.'], ['path2.choice1', 'Request matched measurements.'], ['path2.choice1.next', 'Compare the same workload and target device before claiming a performance difference.']],
  assessment: [['q1', 'Apply the distinction between a code-owned workflow and unsupported speed claims.'], ['q1.wrong', 'No matched performance evidence was supplied.'], ['q1.right', 'Three.js directly matches the custom code-owned requirement. Read mode collects your actual attempt.']],
}
for (const [id, steps] of Object.entries(narration)) steps.unshift(['title', rows.find(([name]) => name === id)![2]])
for (const [id, steps] of Object.entries(narration)) THREE_SPLINE_FILES[`sections/${id}.narrate.oui`] = `root = Narration([${steps.map(([beat, caption]) => `NarrationStep(${JSON.stringify(beat)}, ${JSON.stringify(caption)})`).join(', ')}])`

export const THREE_SPLINE_OUI = '// @loom-topic three-spline\n' + Object.entries(THREE_SPLINE_FILES).map(([path, source]) => `// === ${path} ===\n${source}\n`).join('')
