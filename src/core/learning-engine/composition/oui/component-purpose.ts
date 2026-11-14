/** Discovery is organized by learner task, never by component implementation. */
export const COMPONENT_PURPOSES = [
  { name: 'Explain and orient', purpose: 'Connected explanation, motivation and readable examples.', components: ['TextContent', 'Text', 'Intro', 'CodeBlock', 'Callout'] },
  { name: 'Compare facts and examples', purpose: 'Align matching attributes or inspect concrete alternatives.', components: ['Table', 'Card', 'Stack', 'Tabs'] },
  { name: 'Follow steps and processes', purpose: 'Follow instructions, trace handoffs or inspect a person’s experience.', components: ['Steps', 'Bullets', 'Flowchart', 'UserJourney'] },
  { name: 'Explore relationships and categories', purpose: 'Explain connections, classification, foundations and spatial structure.', components: ['ConceptMap', 'TaxonomyBrowser', 'PillarLayer', 'Svg'] },
  { name: 'Interpret quantities and change', purpose: 'Compare amounts, trends, measured timing or parts of a whole. Use verified or labelled illustrative data.', components: ['BarChart', 'HorizontalBarChart', 'LineChart', 'AreaChart', 'ScatterChart', 'PieChart', 'RadarChart', 'Timeline', 'BreakdownTree'] },
  { name: 'Explore choices and models', purpose: 'Compare contextual choices, trace consequences or vary a defensible authored model.', components: ['TradeoffSandbox', 'DecisionTree', 'Scenario', 'FormulaSandbox'] },
  { name: 'Compose a local exploration', purpose: 'Bind controls to an authored visual or model without another AI call. Explain what the local model can and cannot represent.', components: ['Slider', 'Input', 'Select', 'SwitchGroup', 'Form', 'Button'] },
  { name: 'Inspect visual references', purpose: 'Recognize and compare labelled visual examples.', components: ['Image', 'ImageGallery', 'LearningGallery'] },
  { name: 'Recall, apply and explain', purpose: 'Introduce vocabulary, practise recall or answer an authored assessment.', components: ['Flashcards', 'Quiz', 'ReflectionSequence', 'ReflectionTemplate'] },
] as const

/** One placement per contract. Model/helper contracts stay discoverable without overwhelming task selection. */
export function purposeGroups(names: string[]) {
  const remaining = new Set(names)
  const groups: Array<{ name: string; components: string[] }> = []
  for (const group of COMPONENT_PURPOSES) {
    const components = group.components.filter((name) => remaining.delete(name))
    if (components.length) groups.push({ name: group.name, components })
  }
  if (remaining.size) groups.push({ name: 'Layout, controls and supporting contracts', components: [...remaining].sort() })
  return groups
}
