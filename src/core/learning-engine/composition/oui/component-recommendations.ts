import { z } from 'zod'
import { componentTeachingProfile } from './component-teaching'

export const ComponentRecommendationRequest = z.object({
  learningObjective: z.string().trim().min(1).max(4000),
  knowledgeStructure: z.string().max(500).optional(),
  learnerAction: z.string().max(1000).optional(),
  contentDescription: z.string().max(4000).optional(),
  constraints: z.object({
    interactionRequired: z.boolean().optional(), numericDataAvailable: z.boolean().optional(),
    sourceGrounded: z.boolean().optional(), presentationMode: z.enum(['read', 'present', 'both']).optional(),
    accessibilityNeeds: z.array(z.string().max(200)).max(10).optional(),
  }).strict().optional(),
  candidateLimit: z.number().int().min(1).max(12).default(6),
}).strict()
export type RecommendationRequest = z.input<typeof ComponentRecommendationRequest>

/** Authored affordances, shared by discovery and plan review. No popularity weights. */
export const REPRESENTATION_AFFORDANCES = [
  { component: 'BreakdownTree', structures: ['hierarchical_quantity', 'conditional_probability'], numeric: true, interactive: true, requires: 'A measurable whole with mutually exclusive parts, or exhaustive conditional branches; units and assumptions.' },
  { component: 'Table', structures: ['comparison', 'hierarchical_quantity', 'distribution', 'time_series'], numeric: false, interactive: false, requires: 'Matched attributes or exact supplied values; preserve accessible row and column labels.' },
  { component: 'FormulaSandbox', structures: ['parameter_sensitivity', 'causal_relationship'], numeric: true, interactive: true, requires: 'An explicit formula, valid input domain, units and documented defaults; correlation is not causation.' },
  { component: 'Flowchart', structures: ['sequential_process', 'branching_process', 'system_architecture', 'dependency_graph'], numeric: false, interactive: true, requires: 'Source-supported participants, transitions and messages; select a meaningful initialView.' },
  { component: 'TradeoffSandbox', structures: ['comparison', 'decision_rules'], numeric: false, interactive: true, requires: 'Shared criteria and defensible qualitative pros/cons; no invented numeric quality scores.' },
  { component: 'Steps', structures: ['procedure', 'sequential_process', 'code_execution'], numeric: false, interactive: false, requires: 'An ordered procedure; does not represent arbitrary branching or measured duration.' },
  { component: 'Bullets', structures: ['procedure', 'narrative_explanation'], numeric: false, interactive: false, requires: 'A concise checklist, summary or supporting details.' },
  { component: 'TaxonomyBrowser', structures: ['classification'], numeric: false, interactive: true, requires: 'Defined categories and distinguishing features; current categories are flat, not a quantitative tree.' },
  { component: 'ConceptMap', structures: ['conceptual_relationship', 'dependency_graph'], numeric: false, interactive: true, requires: 'Explicit concepts and relationships; do not imply unverified causality.' },
  { component: 'DecisionTree', structures: ['decision_rules', 'branching_process'], numeric: false, interactive: true, requires: 'Explicit conditional criteria and reachable outcomes; rules are not empirical probabilities.' },
  { component: 'Timeline', structures: ['time_series', 'sequential_process'], numeric: true, interactive: true, requires: 'Authored start times, durations and a common unit, verified or labelled illustrative.' },
  { component: 'LineChart', structures: ['time_series'], numeric: true, interactive: false, requires: 'Ordered numeric observations and units; identify illustrative data.' },
  { component: 'BarChart', structures: ['distribution', 'comparison'], numeric: true, interactive: false, requires: 'Comparable quantities and units; do not invent benchmarks.' },
  { component: 'Svg', structures: ['spatial_structure', 'system_architecture'], numeric: false, interactive: false, requires: 'A labelled spatial model and accessible supporting explanation.' },
  { component: 'LearningGallery', structures: ['visual_recognition'], numeric: false, interactive: true, requires: 'Authorized images, accessible descriptions and observable distinguishing features.' },
  { component: 'Quiz', structures: ['assessment'], numeric: false, interactive: true, requires: 'Grounded questions, one correct choice and explanatory feedback; teach the facts first.' },
  { component: 'CodeBlock', structures: ['code_execution', 'procedure'], numeric: false, interactive: false, requires: 'Correct code or commands with language and explanation; displayed code is not executed.' },
  { component: 'TextContent', structures: ['narrative_explanation'], numeric: false, interactive: false, requires: 'Connected argument, nuance or careful wording; compare diagrams when relationships matter.' },
] as const

/** Recognize relationships, not component-name keywords. Explicit structures take precedence. */
export function inferKnowledgeStructures(input: RecommendationRequest): string[] {
  if (input.knowledgeStructure?.trim()) return [...new Set(input.knowledgeStructure.split(/[,;\s]+/).filter(Boolean))].slice(0, 12)
  const text = [input.learningObjective, input.contentDescription, input.learnerAction].filter(Boolean).join(' ')
  const structures = new Set<string>()
  const detect = (structure: string, matches: boolean) => { if (matches) structures.add(structure) }
  detect('hierarchical_quantity', /\b(total|spending|cost|budget|quantity|allocation)\b/i.test(text) && /\b(split|parts|contribut\w*|across|divid\w*|allocat\w*|hierarch\w*)\b/i.test(text))
  detect('conditional_probability', /\b(conditional|given|branch|path)\w*\b/i.test(text) && /\b(probabilit\w*|likelihood|chance)\b/i.test(text))
  detect('parameter_sensitivity', /\b(vary|chang\w*|tun\w*|adjust\w*|sensitiv\w*|amorti\w*)\b/i.test(text) && /\b(parameter\w*|input\w*|context|pric\w*|cost\w*|output\w*|size|rate\w*)\b/i.test(text))
  detect('system_architecture', /\b(architecture|participants|services|api)\b/i.test(text))
  detect('sequential_process', /\b(workflow|execution|passes control|routing|handoffs|transitions)\b/i.test(text))
  detect('comparison', /\b(compar\w*|versus|alternatives|tradeoffs|criteria)\b/i.test(text))
  detect('procedure', /\b(commands|initializ\w*|instructions|tutorial|checklist|procedure)\b/i.test(text))
  detect('classification', /\b(categories|classif\w*|taxonomy|kinds|types)\b/i.test(text) && !structures.has('hierarchical_quantity'))
  detect('time_series', /\b(timeline|chronolog\w*|over time|duration|overlap)\b/i.test(text))
  detect('code_execution', /\b(code|algorithm|function)\b/i.test(text))
  detect('visual_recognition', /\b(recogni\w*|identify)\b/i.test(text) && /\b(images|pictures|visual|photographs)\b/i.test(text))
  detect('assessment', /\b(assess\w*|quiz|test understanding|recall)\b/i.test(text))
  detect('spatial_structure', /\b(spatial|anatomy|geometry|mechanism)\b/i.test(text))
  detect('conceptual_relationship', /\b(concepts|relationships|dependencies)\b/i.test(text))
  return structures.size ? [...structures] : ['narrative_explanation']
}

export function recommendComponents(raw: RecommendationRequest) {
  const input = ComponentRecommendationRequest.parse(raw)
  const structures = inferKnowledgeStructures(input)
  const constraints = input.constraints ?? {}
  const candidates = REPRESENTATION_AFFORDANCES.map((entry) => ({ entry, matches: entry.structures.filter((s) => structures.includes(s)) }))
    .filter(({ entry, matches }) => matches.length && !(entry.numeric && constraints.numericDataAvailable === false))
    .map(({ entry, matches }) => ({ entry, matches, score: matches.length + (entry.component === 'Table' && /\b(exact|reconcil|accessib|accounting)\w*\b/i.test(`${input.learningObjective} ${input.learnerAction ?? ''}`) ? 1 : 0) + (constraints.interactionRequired === true ? (entry.interactive ? 1 : -1) : 0) }))
    .sort((a, b) => b.score - a.score || a.entry.component.localeCompare(b.entry.component))
    .slice(0, input.candidateLimit)
    .map(({ entry, matches }) => ({
      component: entry.component,
      role: entry.component === 'Quiz' ? 'assessment' : entry.component === 'Table' && structures.includes('hierarchical_quantity') && !/\b(exact|reconcil|accessib|accounting)\w*\b/i.test(`${input.learningObjective} ${input.learnerAction ?? ''}`) ? 'supporting' : 'primary',
      knowledgeFit: matches, learningFit: componentTeachingProfile(entry.component)?.introduces ?? entry.requires,
      learnerInteraction: entry.interactive ? 'Explore the authored model; ask for a prediction or explanation to assess understanding.' : 'Inspect and explain the supplied representation.',
      limitations: [entry.requires, ...(constraints.presentationMode !== 'read' ? ['Present demonstrates shared content hands-free; inspect its layout independently.'] : [])],
      evidenceRequirements: [entry.requires], requiredContracts: [`loom://references/components/${entry.component}.md`],
    }))
  return {
    schemaVersion: 1, method: 'deterministic-affordances', inferredKnowledgeStructures: structures,
    intendedLearnerAction: input.learnerAction ?? input.learningObjective, candidates,
    compositionSuggestions: structures.includes('hierarchical_quantity') && candidates.some((c) => c.component === 'BreakdownTree') ? [{ components: ['BreakdownTree', 'Table'], rationale: 'Inspect contributions and reconcile exact values from one model.', limitations: ['Use a separate page when the learner action changes to parameter experiments.'] }] : [],
    warnings: [
      'Candidates are affordance matches, not a teaching-quality verdict. Compare alternatives at the activity level.',
      ...(constraints.numericDataAvailable === false ? ['Numeric models omitted: obtain values or use a qualitative representation.'] : []),
      ...(constraints.sourceGrounded ? ['Source grounding is requested, not verified by discovery.'] : []),
      ...(constraints.accessibilityNeeds?.length ? ['Verify requested accessibility needs with labels, keyboard interaction and an accessible alternative; discovery does not certify accessibility.'] : []),
    ],
  }
}
