/** Learning roles are independent of the implementation or library a component comes from. */
export interface ComponentTeachingProfile {
  introduces: string
  exploration: string
  evidence: string
  limits: string
}
const profile = (introduces: string, exploration: string, evidence: string, limits: string): ComponentTeachingProfile => ({ introduces, exploration, evidence, limits })
const exposure = 'Viewing, opening or selecting is engagement; ask for an observable explanation or application when the objective requires evidence.'
const demonstration = 'Present demonstrates authored content with separate state; demonstrated answers are not learner attempts.'

const profiles: Record<string, ComponentTeachingProfile> = {}
const assign = (names: string[], value: ComponentTeachingProfile) => names.forEach((name) => { profiles[name] = value })

assign(['ConceptMap'], profile(
  'Introduce concepts and teach how they connect, depend on, support or differ from one another; a map can carry the main explanation.',
  'Inspect named concepts, examples and labelled relationships; Present introduces groups and connections from the same authored graph.',
  'A displayed map does not show that a learner can explain or reconstruct its relationships. Use a grounded response if needed.',
  'Label relationships precisely. Do not imply causation, sequence or equivalence through an unlabelled connection. TaxonomyBrowser organizes kinds; Flowchart traces a process. The current map is not automatically a matching exercise.',
))
assign(['PillarLayer'], profile(
  'Explain foundations, layered responsibilities and what builds on or is supported by what.',
  'Inspect foundations, layers and meaningful peer groups; Present derives focused scenes from the authored stack.',
  exposure,
  'Layers must express defensible foundations or dependencies. Do not stack unrelated categories for decoration or infer process order from vertical placement.',
))
assign(['UserJourney'], profile(
  'Explain a procedure or experience through a person’s goals, actions, responses and friction; it can introduce a subject through a concrete experience.',
  'Inspect stages and their context, identify friction and compare authored improvements; Present guides the journey.',
  'Stage selection does not show that the learner can diagnose friction or explain an improvement.',
  'Keep the person’s experience distinct from internal system execution. Ground claims about users in evidence, or label the journey illustrative. Use Flowchart for system handoffs.',
))
assign(['Timeline'], profile(
  'Explain when work happens, measured duration, overlap, dependencies and waiting, including scheduling and performance examples.',
  'Inspect authored start times, durations and groups to explain elapsed time and concurrency.',
  'Ask the learner to interpret overlap, waiting or completion time; selecting an activity alone is engagement.',
  'Use verified values or clearly labelled illustrative timings with units. Geometry must follow those values. Sequence order alone does not establish duration or causation.',
))
assign(['BreakdownTree'], profile(
  'Explain how a measurable whole divides into parts, or how conditional probability composes along paths.',
  'Inspect branches, totals and the contribution of parts; choose the documented quantity or probability model.',
  'Expansion alone is engagement; an interpreted contribution or probability calculation can supply evidence when checked.',
  'Use defensible quantities, units and conditional assumptions. A category hierarchy alone is not a measurable breakdown. Do not invent amounts or probabilities to fill branches.',
))
assign(['FormulaSandbox'], profile(
  'Teach an authored input/output relationship through predictions and experiments, including first explanations of a formula.',
  'Vary meaningful inputs and interpret outputs, ranges and sensitivity. Explain why the formula responds as it does.',
  'Changing a slider alone is engagement. Ask for a prediction, explanation or calculation if evidence is needed. ' + demonstration,
  'State the formula, units, assumptions and valid domain. The sandbox evaluates an authored model, not the real external system; do not present invented scores or correlations as causal measurements.',
))
assign(['DecisionTree'], profile(
  'Teach explicit criteria and reasoning behind diagnosis, identification or selection, as well as guiding a decision.',
  'Follow authored questions and compare paths, explanations and leaf recommendations.',
  'Reaching a leaf is not proof of diagnostic skill or a verified recommendation. Ask the learner to explain the relevant rule when needed.',
  'Branches must represent defensible explicit rules and reachable outcomes. Preserve the existing question/leaf contract; a diagnostic guide does not establish an empirical probability or universal best choice.',
))
assign(['Scenario'], profile(
  'Teach through a concrete situation, decisions, consequences and feedback; a scenario can introduce and explain a concept rather than only test it afterward.',
  'Explore authored paths and compare how choices affect outcomes and the lesson each outcome illustrates.',
  'Separate exploration from assessment. Outcome ratings are authored judgments, not independently verified real-world performance. ' + demonstration,
  'Explain assumptions and keep consequences plausible and source-supported or labelled illustrative. A branching story is not a simulation of every possible outcome.',
))
assign(['Quiz'], profile(
  'Help learners apply taught knowledge, identify misconceptions and learn from answer-specific explanations.',
  'Attempt a grounded question and inspect feedback that explains why alternatives are right or wrong.',
  'Explicit learner answers and correctness concern the authored question. ' + demonstration,
  'Teach or supply the required facts before assessing them. Use the existing single-correct-choice contract; do not invent partial-credit, free-text grading or general mastery guarantees.',
))
assign(['ReflectionTemplate'], profile(
  'Scaffold a coherent explanation using supplied concepts and sentence blanks, making relationships and reasoning visible.',
  'Complete an explanation with authored chips, inspect feedback and articulate the resulting reasoning.',
  'A checked completion supplies evidence for this constrained exercise, which is narrower than independently producing an explanation. ' + demonstration,
  'Ground the template and solution in taught concepts. Preserve documented zones and chip references; do not claim automatic grading of arbitrary free-text reasoning.',
))
assign(['ReflectionSequence'], profile(
  'Make meaningful order and dependencies explicit by reconstructing an already-taught sequence.',
  'Arrange supplied steps and check the authored order, then explain why that order matters.',
  'Explicit checked attempts concern this sequence; dragging alone is engagement. ' + demonstration,
  'Use a defensible order and teach the procedure first. Do not force one arbitrary ordering when several are valid, or infer general procedural skill from one solved puzzle.',
))
assign(['TradeoffSandbox'], profile(
  'Explain alternatives across shared criteria, strengths, limitations and consequences, with contextual decision support when useful.',
  'Inspect matched options and their implications; optionally compare situations, authored metrics or recommendations.',
  'Exploration or choosing an option is engagement; a justified comparison or decision requires an observable response.',
  'A comparison needs no winner or scores. Use existing empty-metric contracts for qualitative comparisons; recommendations and numerical values must follow explicit assumptions and evidence.',
))
assign(['TaxonomyBrowser'], profile(
  'Introduce and organize meaningful kinds with defining features, examples and distinctions, including first encounters with a domain.',
  'Inspect category scopes and shared or distinguishing features; explain overlaps where they exist.',
  'Browsing is exploration; classification evidence requires an observable learner response.',
  'The current category browser is flat. Do not invent nested category fields or force mutually exclusive groups. Use ConceptMap for relationships and DecisionTree for identification rules.',
))
assign(['Flashcards', 'Flashcard'], profile(
  'Introduce or recall one focused concept, term or question with a coherent explanation, example, dialogue or common mistake.',
  'Attempt recall and reveal the explanation in Read; Present demonstrates the authored front and back.',
  'A flip or view records exposure, not correctness or mastery. Use a grounded assessment when checked evidence is required.',
  'Keep one focused idea per card and use the existing word and definition fields. Use TextContent for connected explanation or TaxonomyBrowser to organize kinds; do not invent automatic recall grading.',
))
assign(['Steps', 'Bullets', 'Flowchart'], profile(
  'Teach procedures: executing instructions, understanding step connections or checking prerequisites.',
  'Choose Steps for explained instructions, Bullets for concise checklists and Flowchart for meaningful sequence, dependencies, branches or responsibilities.',
  'Following a demonstration or clicking a checklist does not prove procedural skill. ReflectionSequence can check an already-taught order when appropriate.',
  'A linear procedure can justify a diagram; follow the actual selected contract and never invent participants or events to activate Flowchart. No particular mix of these components is required.',
))
assign(['Intro'], profile(
  'Orient the learner through the topic’s purpose, significance and roadmap.',
  'Connect the opening question and motivation to the upcoming learning activities.',
  exposure,
  'Keep orientation focused and grounded. Intro is a prebuilt option alongside text and cards, not a mandatory first page or evidence of understanding.',
))
assign(['TextContent', 'MarkDownRenderer', 'Text', 'BoldText', 'IconText', 'InlineHeader', 'TextCallout', 'Callout'], profile(
  'Develop connected explanations, arguments, definitions, qualifications and concise supporting labels.',
  'Read examples and follow reasoning with a clear hierarchy; use prose when its connections and nuance serve the goal.',
  exposure,
  'Keep the selected component’s role: TextContent supports Markdown prose; Text is a short line or metric. Labels and emphasis do not replace a missing mechanism, comparison or assessment.',
))
assign(['CodeBlock'], profile(
  'Explain concrete syntax, implementation steps and matched examples through readable code.',
  'Trace the code and connect each relevant part to its behavior, assumptions and expected result.',
  'Reading a code block alone does not demonstrate the ability to write, debug or run it.',
  'A code block is a display, not a runtime. Do not claim execution, tests or benchmarks without an actual supported environment and evidence; keep examples current and source-grounded.',
))
assign(['Table', 'EditableTable'], profile(
  'Align the same factual attributes, examples or supplied quantities for lookup and comparison.',
  'Inspect matching rows and columns; editing, when supported by the selected contract, can participate in an explicitly authored local activity.',
  'Viewing or editing cells alone is engagement. Ask for an interpretation or application if evidence is needed.',
  'Preserve comparable criteria, units and evidence. A factual matrix does not automatically model suitability or consequences; consider TradeoffSandbox for an explained comparison. Editing does not imply saving to an external system.',
))
assign(['BarChart', 'HorizontalBarChart', 'LineChart', 'AreaChart', 'PieChart', 'SingleStackedBarChart', 'ScatterChart', 'RadarChart', 'RadialChart'], profile(
  'Make quantitative patterns visible: amounts, trends, shares, associations or profiles, according to the selected chart.',
  'Interpret values, axes, units, series and meaningful comparisons; connect the pattern to the learning question.',
  'Chart presence or selection alone is engagement; interpretation, prediction or a checked calculation can supply evidence.',
  'Use verified/supplied data or label illustrative values. Bars compare amounts; line/area charts need meaningful order; shares require a defensible whole; scatter association is not causation; radar criteria need comparable scales. Follow the exact chart contract and check label readability.',
))
assign(['Image', 'ImageBlock', 'ImageGallery', 'ImageText', 'ImageTextLarge', 'LearningGallery'], profile(
  'Teach visual recognition and concrete examples by showing relevant features, variations and distinctions.',
  'Inspect and compare images with explanatory labels or captions; use the selected gallery’s actual preview and presentation behavior.',
  'Viewing, zooming or switching images is engagement. Recognition evidence requires a response that identifies or explains a feature.',
  'Images must contribute to the learning goal, remain legible and use supported accessibility/attribution fields. Do not infer hidden mechanisms from a photograph or claim a gallery provides a classification test.',
))
assign(['Svg'], profile(
  'Explain spatial structure, anatomy, a mechanism, geometry or a clearly labelled analogy.',
  'Inspect labelled parts and relationships; supported shape IDs can focus narration on meaningful details.',
  exposure,
  'Label conceptual or not-to-scale drawings when needed. Keep figures readable and accessible; do not use arbitrary geometry as measured evidence or assume a drawing executes the represented system.',
))
assign(['Input', 'TextArea', 'Slider', 'Select', 'DatePicker', 'CheckBoxGroup', 'RadioGroup', 'SwitchGroup', 'Chips', 'OptionCards', 'Form', 'Button', 'Buttons', 'IconButton'], profile(
  'Let learners supply answers or vary inputs in an explicitly authored activity connected to an explanation or output.',
  'Change page-local inputs and inspect the connected result without another model call when the authored bindings support it.',
  'A control change or submission alone is engagement. Only explicitly interpreted, checked responses establish evidence for the authored task.',
  'Bind controls to meaningful feedback or outputs and explain the local model. Use only supported actions; do not assume host Query/Mutation, external execution, external saving or automatic grading.',
))
assign(['Card', 'CardHeader', 'Stack', 'Separator', 'TagBlock', 'Tag', 'Icon', 'EntityList', 'ListBlock', 'ListItem', 'SnippetCardItem', 'SnippetCardBlock', 'OverviewCardItem', 'OverviewCardBlock', 'ContextCardItem', 'ContextCardBlock', 'CompositeCardItem', 'CompositeCardBlock', 'VisualCardItem', 'VisualCardBlock', 'MetricIndicatorInline', 'MetricIndicatorWithStrikethrough'], profile(
  'Organize related explanations, examples, labels or supplied metrics into a coherent learning page.',
  'Inspect meaningful groups, matched examples and supporting detail while preserving the main activity’s focus.',
  'Layout, decoration and displayed metrics do not independently establish learner understanding.',
  'Structure should clarify the information rather than add novelty. Preserve the component’s exact fields, keep dense content readable, and do not invent quantities merely to populate a metric or card.',
))
assign(['Tabs', 'Accordion', 'Carousel', 'Modal'], profile(
  'Organize alternative views, supporting examples or optional detail around the same learning purpose.',
  'Open or switch supported panels to inspect relevant detail in Read.',
  exposure,
  'Do not assume Present traverses every tab, slide or dialog. Keep essential narrated content in supported scenes/parts and verify visibility; disclosure is not an assessment or a new authored page hierarchy.',
))
assign(['Page'], profile(
  'Define one compositional learning unit with one main purpose and supporting content.',
  'Read supports inspection and authored interaction; Present guides automatic scenes from the same content with separate demonstration state.',
  'Evidence belongs to meaningful learner responses, not to the page boundary or component count.',
  'Compose canonical components in the Page body. Preserve authored boundaries, exact contracts and narration targets; multiple internal scenes do not require nested pages or completion gates.',
))
assign(['Topic', 'SectionRef', 'Catalog', 'TopicRef', 'Domain', 'DomainRef', 'Library'], profile(
  'Organize authored learning content and its navigation or storage references.',
  'Identify the relevant topic or page and follow its declared order and identifiers.',
  'Navigation or source presence is not learning evidence.',
  'These are document/navigation contracts, not standalone teaching activities. Follow the exact document role, paths and storage authorization; showing is not saving.',
))
assign(['Narration', 'NarrationStep', 'Highlight', 'NarrationCallout', 'Spotlight'], profile(
  'Explain and focus attention on already-authored content during Present.',
  'Follow supported beats and real effect targets; captions should connect and explain the content.',
  'Narration and demonstrated answers do not count as learner attempts or mastery.',
  'Use valid beat IDs, resolvable targets and supported view controls. Do not invent narrative content as evidence that an external system ran or a learner answered.',
))

/** Data helpers inherit their owning component’s behavior; they are not independent activities. */
export function componentTeachingProfile(name: string): ComponentTeachingProfile {
  return Object.prototype.hasOwnProperty.call(profiles, name) ? profiles[name] : profile(
    `Define the ${name} content or configuration consumed by its owning component.`,
    'Inspect it through the owning component and its documented behavior.',
    'A supporting data declaration does not independently provide learning evidence.',
    'Use the exact required fields and references. This supporting contract does not imply an independently rendered activity, interaction, grading or persistence.',
  )
}

export function componentTeachingGuide(name: string): string {
  const p = componentTeachingProfile(name)
  return `### ${name}: teaching purpose\n\n- Introduce: ${p.introduces}\n- Explore: ${p.exploration}\n- Evidence: ${p.evidence}\n- Limits: ${p.limits}`
}

export function hasComponentTeachingProfile(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(profiles, name)
}
