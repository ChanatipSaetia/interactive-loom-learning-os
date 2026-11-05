## Shared authoring workflow (v2)

For a new topic or substantial redesign:

1. Identify the learner, goal, relevant source evidence and prior progress.
2. Choose the learning task and learner action before the renderer. Compare native interactions and OpenUI compositions; no mandatory mix or quota. Read the shared mental-model and visual-planning references; call get_loom_capabilities if connected to MCP.
3. Use a schemaVersion 1 TopicPlan: topicId, goal, objectives (id, description, optional prerequisiteIds/evidenceOfLearning), and sections (id, title, objectiveRefs, representation, activity, optional rationale/library/evidenceRefs/presentation/assessment). activity is the concrete learner action; explain the representation choice in rationale for new plans. representation is a section type such as quiz or openui; library is loom or openui. presentation names target read/present/both and strategy; assessment binds itemRefs to a successCriterion. Keep objective and evidence references consistent.
4. Check objective coverage, prerequisites, supported representations, library compatibility and declared evidence links before writing OUI. Structural validity is not a judgment of teaching quality. Use validate_topic_plan if available; otherwise check the same contract locally and state which checks ran.
5. Load the selected section rules, then only the component contracts needed. Always specify the library for focused retrieval; native Text and OpenUI Text have different signatures. Read selected section references and only the relevant OpenUI families. With MCP, use get_authoring_guide with components and explicit library.
6. Write OUI and narration from the checked plan, preserving IDs and exact signatures. Use current buffers and targeted dependencies for edits.
7. Use the existing OUI/narration checks, compare the artifact with the plan, and measure Read/Present at phone/tablet widths when possible. Inspect clipping, fonts, reachable scroll content and narration focus. Repair only affected statements; report checks not run. Compiler validity and section variety are not teaching-quality scores.
8. Show the checked topic and save its exact source through the existing authorized storage workflow. Showing is not a confirmed save. Follow the skill output-location and validation references; provide the actual files.

For a small edit, read affected current source, preserve the existing learning decision, retrieve scoped contracts only as needed, validate and deliver the targeted change. Do not require every tool, a whole-guide reload or a new plan for each minor edit. Assistants own research, reasoning, generation and repair; Loom supplies deterministic contracts and checks.
