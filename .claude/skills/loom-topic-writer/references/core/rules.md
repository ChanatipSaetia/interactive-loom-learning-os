## Important Rules
- Choose the section types that best teach the content (see Loom Authoring Rules).

## Final Verification
Before finishing, walk your output and verify:
1. In every file, the `root = ...` statement comes first.
2. Every referenced name is defined. Every defined name (other than root) is reachable from root.

## Loom Authoring Rules

- In the single .oui file, start EVERY file with its own marker line written exactly as `// === topic.oui ===`, `// === sections/<name>.oui ===` or `// === sections/<name>.narrate.oui ===` (three `=` on each side, no folder prefix). Each file holds exactly one `root =` statement; never put two sections in one file.
- Every `SectionRef("<name>")` in topic.oui has a matching `sections/<name>.oui` file, and every section file is listed exactly once. Section names use lowercase letters, digits, `-` and `_`.
- Size the topic to the learner goal. Choose sections by their distinct learning contribution, without a fixed count or sequence. A short explanation may need one section; a comprehensive lesson may combine orientation, explanation, exploration and assessment. Use Intro when orientation helps, and order prerequisites before activities that depend on them. Bullets are first-class for concise linear procedures and checklists; do not add visual complexity without learning value.
- Combine sections only when each adds a distinct learning contribution; connected prose alone is valid when it best teaches the goal. Do not force visual variety or interactivity.
- Fit each section to its own content rather than to the example: different section types, and different layouts for standard OpenUI sections (Steps, CodeBlock, cards, EntityList, a chart or a table, an Svg drawing, …).
- Write a narration file for every section, at least one NarrationStep per beat of that section type (see Narration Files), in the topic's language.
- Quizzes and reflection challenges only test what an earlier section of the topic teaches. Each QuizQuestion has exactly one choice with `correct` set to true.
- IDs (`id` props) are unique within their section. Props that point at an ID (`next`, `root`, `startNode`, `recommended`, `solution`, `continuesAs`, `initialState`, `dependsOn`) must name an ID that exists in the same section.
- Flowcharts follow the Event Storming cycle EVENT → POLICY → COMMAND → System (handledBy) → EVENT for every step. Every declared Actor starts (`initiatedBy`) or receives (`sendsTo`) at least one step, and every declared System handles (`handledBy`), is called by (`delegatesTo`) or receives (`sendsTo`) at least one step. Set `sendsTo` on every step whose events go to another actor or system: the Sequence and System Architecture views draw only declared messages. When a System has a StateMachine, set `enters` on each Event that moves it into a new state (a MachineState ID); the State Machine view draws its transitions only from those. Set `data` on an Event when the data it carries matters to the lesson (e.g. "Query embedding vector"); the Data Flow view names the data with it. Set `async` on a Step or BranchOption whose command is fired without waiting for a reply (e.g. a queued job or a notification). Set `initialView` on the Flowchart when another view tells the lesson better than Event Storming: "sequence" for a protocol or request/response exchange, "architecture" for which systems talk to which, "swimlanes" for who does what, "data-flow" for how data changes, "state-machine" for the lifecycle of one object.
- To skip an optional argument and still set a later one, pass `null` in its place, e.g. `Step("s1", "When …", "DoThing", sys, [evt], null, null, "s2")`.
- Text paragraphs may use inline markdown (**bold**, `code`, [links](url)). Write factual, specific content; no placeholders such as "Lorem ipsum" or "TODO".
