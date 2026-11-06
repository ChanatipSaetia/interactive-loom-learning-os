/** Shared authoring workflow; rendering routes vary by host, never by pedagogy. No runtime state. */
export const AUTHORING_WORKFLOW_VERSION = 3
export type AuthoringHost = 'mcp' | 'studio' | 'files'

export const AUTHORING_WORKFLOW_STAGES = [
  { id: 'understand', task: 'Identify the learner, goal, relevant source evidence and prior progress.' },
  { id: 'discover', task: 'Discover compact capabilities. Map objective → knowledge structure → learner action → candidate views/interactions → representation and configuration; compare fidelity, perspective coverage, clarity, assessment fit and modeling feasibility. Choose the simplest faithful combination; no ranking or quota.' },
  { id: 'plan', task: 'Use a schemaVersion 1 TopicPlan: topicId, goal, objectives (id, description, optional prerequisiteIds/evidenceOfLearning), and sections (id, title, objectiveRefs, representation, activity, optional rationale/library/evidenceRefs/presentation/assessment). activity is the concrete learner action; explain the representation choice in rationale for new plans. representation is a section type such as quiz or openui; library is loom or openui. presentation names target read/present/both and strategy; assessment binds itemRefs to a successCriterion. Record a primary Flowchart view and any narration view transitions in presentation.strategy; for OpenUI name its intended table, cards, chart, Steps or diagram. Keep objective and evidence references consistent; each section needs a distinct contribution.' },
  { id: 'validate-plan', task: 'Check objective coverage, prerequisites, supported representations, library compatibility and declared evidence links before writing OUI. Inspect advisory experience-readiness diagnostics too; resolve them or explicitly justify proceeding. Structural validity is not a judgment of teaching quality.' },
  { id: 'references', task: 'Load the selected section rules, then only the component contracts needed. Always specify the library for focused retrieval; native Text and OpenUI Text have different signatures.' },
  { id: 'generate', task: 'Write OUI and narration from the checked plan, preserving IDs and exact signatures. Use current buffers and targeted dependencies for edits.' },
  { id: 'verify', task: 'Use the existing OUI/narration checks, compare the artifact with the plan, and measure Read/Present at phone/tablet widths when possible. Inspect clipping, fonts, reachable scroll content and narration focus. Repair only affected statements; report checks not run. Compiler validity and section variety are not teaching-quality scores.' },
  { id: 'deliver', task: 'Show the checked topic and save its exact source through the existing authorized storage workflow. Showing is not a confirmed save.' },
] as const

const ROUTES: Record<AuthoringHost, Partial<Record<typeof AUTHORING_WORKFLOW_STAGES[number]['id'], string>>> = {
  mcp: {
    discover: 'Call get_loom_capabilities with detail: index for orientation; full provides learner actions, evidence boundaries and the plan schema when needed.',
    'validate-plan': 'Call validate_topic_plan with {plan}; fix diagnostics before generating.',
    references: 'Use get_authoring_guide with detail: focused, selected sections/components and library: "loom" | "openui". The first structured response includes the core; pass its knownContractVersion on subsequent calls. Use forceRefresh after compaction or when unsure. Retrieve legacy section rules for complex section-specific constraints when needed; report a budget exception rather than omitting requirements. On focused retrieval failure retry the library-scoped request with forceRefresh, then retrieve the selected legacy section guide without library/components. If still unavailable, report the blocker; do not silently substitute Text or guess signatures.',
    generate: 'For reuse or edits, use get_topic_context with authorized current files and an available plan to preserve the selected action/rationale/presentation constraints; omit unnecessary lookups for a new topic.',
    verify: 'Use validate_topic({oui, plan}) / validate_section when available. Pass plan to show_topic for browser review. Hosted MCP leaves full compilation/layout to the player/browser; never report them as already checked by the Worker.',
    deliver: 'Call show_topic and follow get_storage_guide for saving. Use edit_topic for targeted changes when available.',
  },
  studio: {
    discover: 'Call get_loom_capabilities.',
    plan: 'Pass the same TopicPlan as {plan} to propose_plan, with optional actions keyed by section ID. The author chooses what to build; do not stage it before Build these.',
    'validate-plan': 'Call validate_topic_plan before propose_plan; propose_plan also validates canonical plans.',
    references: 'Call describe_components with {names, library: "loom" | "openui"}. Use navigate/read for current source.',
    generate: 'After Build these, stage the selected items with create_section/edit_section/edit_topic. Preserve their learner actions and rationales; recheck coverage if the author changes the selection.',
    deliver: 'Summarize staged changes. The author reviews/applies them; staged content is not yet saved.',
  },
  files: {
    discover: 'Read the shared mental-model and visual-planning references; call get_loom_capabilities if connected to MCP.',
    'validate-plan': 'Use validate_topic_plan if available; otherwise check the same contract locally and state which checks ran.',
    references: 'Read selected section references and only the relevant OpenUI families. With MCP, use get_authoring_guide with components and explicit library.',
    deliver: 'Follow the skill output-location and validation references; provide the actual files.',
  },
}

export function getAuthoringWorkflow(host: AuthoringHost): string {
  return `## Shared authoring workflow (v${AUTHORING_WORKFLOW_VERSION})\n\nFor a new topic or substantial redesign:\n\n${AUTHORING_WORKFLOW_STAGES.map((stage, index) => `${index + 1}. ${stage.task}${ROUTES[host][stage.id] ? ` ${ROUTES[host][stage.id]}` : ''}`).join('\n')}\n\nFor a small edit, read affected current source, preserve the existing learning decision, retrieve scoped contracts only as needed, validate and deliver the targeted change. Do not require every tool, a whole-guide reload or a new plan for each minor edit. Assistants own research, reasoning, generation and repair; Loom supplies deterministic contracts and checks.`
}
