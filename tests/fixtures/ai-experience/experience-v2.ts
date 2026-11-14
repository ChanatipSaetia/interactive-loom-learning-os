export const DISCOVERY_CASES = [
  ['financial allocation', 'Show how total AI agent spending is split across graph nodes and token categories.', 'BreakdownTree'],
  ['conditional probability', 'Inspect conditional request outcome probabilities along each path.', 'BreakdownTree'],
  ['API architecture', 'Explain the API architecture and service participants.', 'Flowchart'],
  ['multi-agent flow', 'Explain how LangGraph passes control and state between routing, retrieval, and reasoning nodes.', 'Flowchart'],
  ['sensitivity', 'Let users change context size and cached-token pricing to see cost differences.', 'FormulaSandbox'],
  ['framework comparison', 'Compare Svelte and React across reactivity, rendering, and ecosystem.', 'Table'],
  ['technical tutorial', 'Show the commands needed to initialize a project.', 'Steps'],
  ['taxonomy', 'Explain categories of AI agent memory.', 'TaxonomyBrowser'],
  ['timeline', 'Explain duration and overlap on a timeline.', 'Timeline'],
  ['code explanation', 'Explain the code execution of this function.', 'CodeBlock'],
  ['visual recognition', 'Identify visual differences in photographs of leaves.', 'LearningGallery'],
  ['assessment', 'Assess understanding with a grounded quiz.', 'Quiz'],
  ['source-limited', 'Compare architectures using only qualitative supplied facts.', 'Table'],
  ['mobile', 'Show concise procedure instructions on mobile.', 'Bullets'],
  ['multi-page', 'Explore total cost split across nodes, change input pricing, compare architecture alternatives and assess understanding.', 'FormulaSandbox'],
] as const

export const outcomeModel = {
  type: 'formula-sandbox',
  variables: [
    { id: 'base', label: 'Base USD', min: 0, max: 1, step: .0001, defaultValue: .0442 },
    { id: 'retry', label: 'Retry USD', min: 0, max: 1, step: .0001, defaultValue: .0222 },
    { id: 'probability', label: 'Retry probability', min: 0, max: 1, step: .01, defaultValue: .2 },
    { id: 'acceptance', label: 'Acceptance rate', min: .01, max: 1, step: .01, defaultValue: .9 },
  ],
  metrics: [
    { id: 'attempt', label: 'Expected cost', formula: 'base + retry * probability', description: 'Illustrative USD per attempt.' },
    { id: 'accepted', label: 'Accepted cost', formula: 'attempt / acceptance', description: 'Illustrative USD per accepted task.' },
  ],
}

