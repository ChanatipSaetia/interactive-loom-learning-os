/* eslint-disable @typescript-eslint/no-explicit-any */
import * as yaml from 'js-yaml'
import { z } from 'zod'

// ============================================================================
// Validation Gateway — 3-Tier Validation & Tell-Back Protocol
// ============================================================================
// Centralized validation engine that executes:
//   Tier 1: YAML Syntax & Frontmatter
//   Tier 2: Structural Schema (Zod delegation to Bounded Contexts)
//   Tier 3: Semantic Reference Integrity (cross-references, bounds)
// Produces standardized ValidationResult with fixHint diagnostics.
// ============================================================================

// --- Public Types ---

export interface ValidationContext {
  file?: string
  topicId?: string
  sectionName?: string
}

export interface ValidationDiagnostic {
  tier: 1 | 2 | 3
  field?: string
  line?: number
  column?: number
  message: string
  fixHint?: string
}

export interface ValidationResult<T = unknown> {
  status: 'valid' | 'warning' | 'error'
  payload: T
  diagnostics: ValidationDiagnostic[]
}

// --- Schema Registry — Dynamically resolved from Bounded Contexts ---

import * as ProgressiveContent from '../subdomains/progressive-content/schema'
import * as ProcessSimulation from '../subdomains/process-simulation/schema'
import * as TradeoffSandbox from '../subdomains/tradeoff-sandbox/schema'
import * as ReflectionSynthesis from '../subdomains/reflection-synthesis/schema'
import * as PracticeAssessment from '../subdomains/practice-assessment/schema'

interface SchemaEntry {
  schema: z.ZodTypeAny
  subdomain: string
}

const SCHEMA_REGISTRY: Record<string, SchemaEntry> = {
  'intro': { schema: ProgressiveContent.IntroSectionSchema, subdomain: 'progressive-content' },
  'text': { schema: ProgressiveContent.TextSectionSchema, subdomain: 'progressive-content' },
  'bullets': { schema: ProgressiveContent.BulletsSectionSchema, subdomain: 'progressive-content' },
  'taxonomy-browser': { schema: ProgressiveContent.TaxonomyBrowserSectionSchema, subdomain: 'progressive-content' },
  'image-gallery': { schema: ProgressiveContent.ImageGallerySectionSchema, subdomain: 'progressive-content' },
  'flowchart': { schema: ProcessSimulation.FlowchartSectionSchema, subdomain: 'process-simulation' },
  'scenario': { schema: ProcessSimulation.ScenarioSectionSchema, subdomain: 'process-simulation' },
  'tradeoff-sandbox': { schema: TradeoffSandbox.TradeoffSandboxSectionSchema, subdomain: 'tradeoff-sandbox' },
  'formula-sandbox': { schema: TradeoffSandbox.FormulaSandboxSectionSchema, subdomain: 'tradeoff-sandbox' },
  'decision-tree': { schema: TradeoffSandbox.DecisionTreeSectionSchema, subdomain: 'tradeoff-sandbox' },
  'reflection-sequence': { schema: ReflectionSynthesis.ReflectionSequenceSectionSchema, subdomain: 'reflection-synthesis' },
  'reflection-template': { schema: ReflectionSynthesis.ReflectionTemplateSectionSchema, subdomain: 'reflection-synthesis' },
  'quiz': { schema: PracticeAssessment.QuizSectionSchema, subdomain: 'practice-assessment' },
  'flashcards': { schema: PracticeAssessment.FlashcardsSectionSchema, subdomain: 'practice-assessment' },
  'concept-map': { schema: PracticeAssessment.ConceptMapSectionSchema, subdomain: 'practice-assessment' },
}

export const KNOWN_SECTION_TYPES = new Set(Object.keys(SCHEMA_REGISTRY))

// --- Tier 1: YAML Syntax & Frontmatter ---

interface FrontmatterResult {
  frontmatter: Record<string, unknown>
  body: string
}

function extractFrontmatter(raw: string): FrontmatterResult | null {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('---')) {
    return { frontmatter: {}, body: raw }
  }

  const secondDivider = trimmed.indexOf('---', 3)
  if (secondDivider === -1) {
    return null
  }

  const frontmatterStr = trimmed.slice(3, secondDivider).trim()
  const body = trimmed.slice(secondDivider + 3).trim()

  let parsed: Record<string, unknown> = {}
  try {
    const fm = yaml.load(frontmatterStr)
    if (fm && typeof fm === 'object' && !Array.isArray(fm)) {
      parsed = fm as Record<string, unknown>
    }
  } catch {
    return null
  }

  return { frontmatter: parsed, body }
}

function tier1Validate(raw: string, context?: ValidationContext): {
  parsed: unknown
  diagnostics: ValidationDiagnostic[]
} {
  const diagnostics: ValidationDiagnostic[] = []

  const fmResult = extractFrontmatter(raw)
  if (fmResult === null) {
    diagnostics.push({
      tier: 1,
      line: 1,
      message: 'Invalid YAML frontmatter: missing closing "---" delimiter or malformed frontmatter.',
      fixHint: 'Ensure frontmatter is wrapped between opening "---" and closing "---" delimiters.',
      ...contextToDiagnostic(context),
    })
    return { parsed: null, diagnostics }
  }

  const { body } = fmResult
  const yamlContent = body || raw

  let parsed: unknown
  try {
    parsed = yaml.load(yamlContent)
  } catch (e: any) {
    const message = e.message || String(e)
    const lineMatch = message.match(/line\s+(\d+)/i)
    const colMatch = message.match(/column\s+(\d+)/i)
    const line = lineMatch ? parseInt(lineMatch[1], 10) : undefined
    const column = colMatch ? parseInt(colMatch[1], 10) : undefined

    diagnostics.push({
      tier: 1,
      line,
      column,
      message: `YAML Syntax Error: ${message}`,
      fixHint: 'Fix YAML indentation and formatting around the specified line. Ensure consistent 2-space indentation.',
      ...contextToDiagnostic(context),
    })
    return { parsed: null, diagnostics }
  }

  return { parsed, diagnostics }
}

// --- Tier 2: Structural Schema (Zod) ---

function zodErrorToDiagnostic(issue: z.ZodIssue, context?: ValidationContext): ValidationDiagnostic {
  const field = issue.path.length > 0 ? issue.path.join('.') : undefined
  // Zod 4.x issue codes differ from 3.x; use dynamic access for compatibility
  const raw = issue as unknown as Record<string, unknown>

  let fixHint: string | undefined

  if (raw.code === 'invalid_type' || raw.code === 'invalid_literal' || raw.code === 'invalid_value') {
    fixHint = `Update field "${field || 'root'}" to match expected type. ${issue.message}`
  } else if (raw.code === 'invalid_union') {
    fixHint = `Value does not match any variant of the union schema for "${field || 'root'}". Check required discriminant fields.`
  } else if (raw.code === 'unrecognized_keys') {
    fixHint = `Remove unrecognized keys: [${(raw.keys as string[]).map((k) => `"${k}"`).join(', ')}].`
  } else if (raw.code === 'invalid_enum_value') {
    const opts = raw.options as string[] | undefined
    if (opts) {
      fixHint = `Expected one of [${opts.map((o) => `"${o}"`).join(', ')}] for field "${field || 'root'}".`
    }
  } else if (raw.code === 'too_small' || raw.code === 'too_big') {
    fixHint = `Field "${field || 'root'}" violates size constraint. ${issue.message}`
  } else if (raw.code === 'custom') {
    fixHint = issue.message
  }

  return {
    tier: 2,
    field,
    message: issue.message,
    fixHint,
    ...contextToDiagnostic(context),
  }
}

export function tier2Validate(
  data: unknown,
  sectionType: string,
  context?: ValidationContext
): {
  validated: unknown
  diagnostics: ValidationDiagnostic[]
} {
  const diagnostics: ValidationDiagnostic[] = []

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    diagnostics.push({
      tier: 2,
      field: 'root',
      message: 'Section data must be a YAML mapping object (key-value pairs).',
      fixHint: 'Ensure section data is a key-value YAML mapping, not a scalar or array at the top level.',
      ...contextToDiagnostic(context),
    })
    return { validated: data, diagnostics }
  }

  if (!KNOWN_SECTION_TYPES.has(sectionType)) {
    diagnostics.push({
      tier: 2,
      field: 'type',
      message: `Unknown section type "${sectionType}".`,
      fixHint: `Change "type" to one of: [${[...KNOWN_SECTION_TYPES].join(', ')}]`,
      ...contextToDiagnostic(context),
    })
    return { validated: data, diagnostics }
  }

  const entry = SCHEMA_REGISTRY[sectionType]
  const result = entry.schema.safeParse(data)

  if (!result.success) {
    for (const issue of result.error.issues) {
      const diag = zodErrorToDiagnostic(issue, context)
      diag.field = issue.path.length > 0 ? issue.path.join('.') : undefined
      diagnostics.push(diag)
    }
  }

  return {
    validated: result.success ? result.data : data,
    diagnostics,
  }
}

// --- Tier 3: Semantic Reference Integrity ---

function tier3Validate(
  data: Record<string, unknown>,
  sectionType: string,
  context?: ValidationContext
): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = []
  const ctx = contextToDiagnostic(context)

  switch (sectionType) {
    // --- Scenario: validate startNode and choice.next references ---
    case 'scenario': {
      const nodes = (data.nodes || {}) as Record<string, any>
      const startNode = data.startNode as string | undefined
      const validNodeKeys = Object.keys(nodes)

      if (startNode && !nodes[startNode]) {
        diagnostics.push({
          tier: 3,
          field: 'startNode',
          message: `startNode "${startNode}" does not exist in scenario nodes.`,
          fixHint: `Change startNode to one of: [${validNodeKeys.map((k) => `"${k}"`).join(', ')}]`,
          ...ctx,
        })
      }

      for (const [nodeId, node] of Object.entries(nodes)) {
        if (!node || typeof node !== 'object') continue
        const choices = Array.isArray(node.choices) ? node.choices : []
        choices.forEach((choice: any, idx: number) => {
          if (choice && choice.next && typeof choice.next === 'string') {
            if (!nodes[choice.next]) {
              diagnostics.push({
                tier: 3,
                field: `nodes.${nodeId}.choices[${idx}].next`,
                message: `Choice "${choice.text || idx}" in node "${nodeId}" targets non-existent node "${choice.next}".`,
                fixHint: `Update "next" to point to a valid node: [${validNodeKeys.map((k) => `"${k}"`).join(', ')}]`,
                ...ctx,
              })
            }
          }
        })
      }
      break
    }

    // --- Decision Tree: validate root and choice.next references ---
    case 'decision-tree': {
      const nodes = (data.nodes || {}) as Record<string, any>
      const root = data.root as string | undefined
      const validNodeKeys = Object.keys(nodes)

      if (root && !nodes[root]) {
        diagnostics.push({
          tier: 3,
          field: 'root',
          message: `Decision tree root "${root}" is not defined in nodes.`,
          fixHint: `Set "root" to one of: [${validNodeKeys.map((k) => `"${k}"`).join(', ')}]`,
          ...ctx,
        })
      }

      for (const [nodeId, node] of Object.entries(nodes)) {
        if (!node || typeof node !== 'object') continue
        const choices = Array.isArray(node.choices) ? node.choices : []
        choices.forEach((choice: any, idx: number) => {
          if (choice && choice.next && typeof choice.next === 'string') {
            if (!nodes[choice.next]) {
              diagnostics.push({
                tier: 3,
                field: `nodes.${nodeId}.choices[${idx}].next`,
                message: `Choice "${choice.text || idx}" in node "${nodeId}" targets unknown node "${choice.next}".`,
                fixHint: `Set "next" to a valid node: [${validNodeKeys.map((k) => `"${k}"`).join(', ')}]`,
                ...ctx,
              })
            }
          }
        })
      }
      break
    }

    // --- Flowchart: validate relations, steps, views, journeys ---
    case 'flowchart': {
      const entities = (data.entities || {}) as Record<string, any>
      const entityIds = new Set(Object.keys(entities))
      const relations = Array.isArray(data.relations) ? data.relations : []

      for (const [idx, rel] of relations.entries()) {
        if (!rel || typeof rel !== 'object') continue
        if (rel.from && !entityIds.has(String(rel.from))) {
          diagnostics.push({
            tier: 3,
            field: `relations[${idx}].from`,
            message: `Relation #${idx} references unknown entity "${rel.from}".`,
            fixHint: `Valid entity IDs: [${[...entityIds].map((e) => `"${e}"`).join(', ')}]`,
            ...ctx,
          })
        }
        if (rel.to && !entityIds.has(String(rel.to))) {
          diagnostics.push({
            tier: 3,
            field: `relations[${idx}].to`,
            message: `Relation #${idx} references unknown entity "${rel.to}".`,
            fixHint: `Valid entity IDs: [${[...entityIds].map((e) => `"${e}"`).join(', ')}]`,
            ...ctx,
          })
        }
        if (rel.handledBy === true) {
          if (rel.from && !entityIds.has(String(rel.from))) {
            // already caught above
          }
        }
      }

      const journeys = Array.isArray(data.journeys) ? data.journeys : []
      for (const [jIdx, journey] of journeys.entries()) {
        if (!journey || typeof journey !== 'object') continue
        const steps = Array.isArray(journey.steps) ? journey.steps : []
        for (const [sIdx, step] of steps.entries()) {
          if (!step || typeof step !== 'object') continue
          const stepNodeIds = Array.isArray(step.nodeIds) ? step.nodeIds : []
          for (const [nIdx, nodeId] of stepNodeIds.entries()) {
            if (!entityIds.has(nodeId)) {
              diagnostics.push({
                tier: 3,
                field: `journeys[${jIdx}].steps[${sIdx}].nodeIds[${nIdx}]`,
                message: `Step "${step.title || sIdx}" in journey "${journey.id || jIdx}" references unknown entity "${nodeId}".`,
                fixHint: `Valid entity IDs: [${[...entityIds].map((e) => `"${e}"`).join(', ')}]`,
                ...ctx,
              })
            }
          }
        }
      }

      const views = data.views
      if (views && typeof views === 'object' && !Array.isArray(views)) {
        for (const [viewName, view] of Object.entries(views)) {
          if (!view || typeof view !== 'object') continue
          const viewNodes = Array.isArray(view.nodes) ? view.nodes : []
          for (const [nIdx, vn] of viewNodes.entries()) {
            if (vn && vn.id && !entityIds.has(String(vn.id))) {
              diagnostics.push({
                tier: 3,
                field: `views.${viewName}.nodes[${nIdx}].id`,
                message: `View "${viewName}" node references unknown entity "${vn.id}".`,
                fixHint: `Valid entity IDs: [${[...entityIds].map((e) => `"${e}"`).join(', ')}]`,
                ...ctx,
              })
            }
          }
          const viewGroups = Array.isArray(view.groups) ? view.groups : []
          for (const [gIdx, group] of viewGroups.entries()) {
            if (!group || typeof group !== 'object') continue
            const groupNodeIds = Array.isArray(group.nodeIds) ? group.nodeIds : []
            for (const [nIdx, nodeId] of groupNodeIds.entries()) {
              if (!entityIds.has(nodeId)) {
                diagnostics.push({
                  tier: 3,
                  field: `views.${viewName}.groups[${gIdx}].nodeIds[${nIdx}]`,
                  message: `Group "${group.title || gIdx}" in view "${viewName}" references unknown entity "${nodeId}".`,
                  fixHint: `Valid entity IDs: [${[...entityIds].map((e) => `"${e}"`).join(', ')}]`,
                  ...ctx,
                })
              }
            }
          }
        }
      }

      const stateInitRefs: string[] = []
      for (const [entityId, entity] of Object.entries(entities)) {
        if (!entity || typeof entity !== 'object') continue
        const sm = entity.stateMachine
        if (sm && typeof sm === 'object') {
          const initialState = sm.initialState
          const states = Array.isArray(sm.states) ? sm.states : []
          const stateIds = new Set(states.map((s: any) => s?.id).filter(Boolean))
          if (initialState && !stateIds.has(String(initialState))) {
            stateInitRefs.push(`${entityId}: initialState "${initialState}" not in states [${[...stateIds].join(', ')}]`)
          }
        }
      }
      for (const ref of stateInitRefs) {
        diagnostics.push({
          tier: 3,
          field: 'entities.*.stateMachine.initialState',
          message: `State machine reference: ${ref}`,
          fixHint: 'Ensure initialState matches one of the defined state IDs.',
          ...ctx,
        })
      }
      break
    }

    // --- Quiz: validate correct answer references (by choice ID or index) ---
    case 'quiz': {
      const questions = Array.isArray(data.questions) ? data.questions : []
      questions.forEach((q: any, qIdx: number) => {
        if (!q || typeof q !== 'object') return
        const choices = Array.isArray(q.choices) ? q.choices : []
        const choiceIds = new Set(choices.map((c: any) => c?.id).filter(Boolean))

        if (q.correctAnswer !== undefined && typeof q.correctAnswer === 'string') {
          if (!choiceIds.has(q.correctAnswer)) {
            diagnostics.push({
              tier: 3,
              field: `questions[${qIdx}].correctAnswer`,
              message: `Quiz question #${qIdx + 1} correctAnswer "${q.correctAnswer}" does not match any choice ID.`,
              fixHint: `Valid choice IDs: [${[...choiceIds].map((c) => `"${c}"`).join(', ')}]`,
              ...ctx,
            })
          }
        }
      })
      break
    }

    // --- Concept Map: validate edge source/target references ---
    case 'concept-map': {
      const rawNodes = data.nodes
      let nodeIds: string[] = []
      if (rawNodes && typeof rawNodes === 'object' && !Array.isArray(rawNodes)) {
        nodeIds = Object.keys(rawNodes)
      } else if (Array.isArray(rawNodes)) {
        nodeIds = rawNodes.map((n: any) => n?.id).filter(Boolean)
      }

      const edges = Array.isArray(data.edges) ? data.edges : []
      edges.forEach((edge: any, idx: number) => {
        if (!edge || typeof edge !== 'object') return
        const from = edge.from || edge.source
        const to = edge.to || edge.target
        if (from && !nodeIds.includes(String(from))) {
          diagnostics.push({
            tier: 3,
            field: `edges[${idx}].from`,
            message: `Edge #${idx} references unknown source node "${from}".`,
            fixHint: `Valid node IDs: [${nodeIds.map((n) => `"${n}"`).join(', ')}]`,
            ...ctx,
          })
        }
        if (to && !nodeIds.includes(String(to))) {
          diagnostics.push({
            tier: 3,
            field: `edges[${idx}].to`,
            message: `Edge #${idx} references unknown target node "${to}".`,
            fixHint: `Valid node IDs: [${nodeIds.map((n) => `"${n}"`).join(', ')}]`,
            ...ctx,
          })
        }
      })
      break
    }

    // --- Formula Sandbox: validate variable bounds ---
    case 'formula-sandbox': {
      const vars = Array.isArray(data.variables) ? data.variables : []
      const varIds = new Set(vars.map((v: any) => v?.id).filter(Boolean))
      vars.forEach((v: any, idx: number) => {
        const varLabel = v?.id || `variables[${idx}]`
        if (typeof v.min === 'number' && typeof v.max === 'number' && v.min > v.max) {
          diagnostics.push({
            tier: 3,
            field: `variables[${idx}]`,
            message: `Variable "${varLabel}" has min (${v.min}) > max (${v.max}).`,
            fixHint: `Ensure min <= max for variable "${varLabel}".`,
            ...ctx,
          })
        }
        if (
          typeof v.defaultValue === 'number' &&
          typeof v.min === 'number' &&
          typeof v.max === 'number'
        ) {
          if (v.defaultValue < v.min || v.defaultValue > v.max) {
            diagnostics.push({
              tier: 3,
              field: `variables[${idx}].defaultValue`,
              message: `Variable "${varLabel}" defaultValue (${v.defaultValue}) is outside bounds [${v.min}, ${v.max}].`,
              fixHint: `Set defaultValue between ${v.min} and ${v.max}.`,
              ...ctx,
            })
          }
        }
      })

      const metrics = Array.isArray(data.metrics) ? data.metrics : []
      metrics.forEach((m: any, idx: number) => {
        if (!m || typeof m !== 'object') return
        if (m.formula && typeof m.formula === 'string') {
          const formulaVars = extractFormulaVariableRefs(m.formula)
          for (const ref of formulaVars) {
            if (!varIds.has(ref)) {
              diagnostics.push({
                tier: 3,
                field: `metrics[${idx}].formula`,
                message: `Metric "${m.id || idx}" formula references unknown variable "${ref}".`,
                fixHint: `Valid variable IDs: [${[...varIds].map((v) => `"${v}"`).join(', ')}]`,
                ...ctx,
              })
            }
          }
        }
      })
      break
    }

    // --- Reflection Sequence: validate solution references items ---
    case 'reflection-sequence': {
      const challenges = Array.isArray(data.challenges) ? data.challenges : []
      challenges.forEach((ch: any, idx: number) => {
        if (!ch || typeof ch !== 'object') return
        const itemIds = new Set(
          (Array.isArray(ch.items) ? ch.items : []).map((item: any) => item?.id).filter(Boolean)
        )
        const solution = Array.isArray(ch.solution) ? ch.solution : []
        solution.forEach((solId: any, sIdx: number) => {
          if (itemIds.size > 0 && !itemIds.has(String(solId))) {
            diagnostics.push({
              tier: 3,
              field: `challenges[${idx}].solution[${sIdx}]`,
              message: `Challenge #${idx} solution references unknown item ID "${solId}".`,
              fixHint: `Valid item IDs: [${[...itemIds].map((i) => `"${i}"`).join(', ')}]`,
              ...ctx,
            })
          }
        })
      })
      break
    }

    // --- Reflection Template: validate solution zone references ---
    case 'reflection-template': {
      const challenges = Array.isArray(data.challenges) ? data.challenges : []
      challenges.forEach((ch: any, idx: number) => {
        if (!ch || typeof ch !== 'object') return
        const chipIds = new Set(
          (Array.isArray(ch.chips) ? ch.chips : []).map((chip: any) => chip?.id).filter(Boolean)
        )
        const solution = ch.solution
        if (solution && typeof solution === 'object' && !Array.isArray(solution)) {
          for (const [zoneId, chipId] of Object.entries(solution)) {
            if (chipIds.size > 0 && !chipIds.has(String(chipId))) {
              diagnostics.push({
                tier: 3,
                field: `challenges[${idx}].solution.${zoneId}`,
                message: `Challenge #${idx} solution zone "${zoneId}" references unknown chip "${chipId}".`,
                fixHint: `Valid chip IDs: [${[...chipIds].map((c) => `"${c}"`).join(', ')}]`,
                ...ctx,
              })
            }
          }
        }
      })
      break
    }
  }

  return diagnostics
}

// --- Helper: extract variable references from formula string ---

function extractFormulaVariableRefs(formula: string): string[] {
  const refs = new Set<string>()
  const matches = formula.match(/\$\{([^}]+)\}/g) || []
  for (const m of matches) {
    const inner = m.slice(2, -1).trim()
    if (inner && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(inner)) {
      refs.add(inner)
    }
  }
  return [...refs]
}

// --- Helper: merge context into diagnostic partial ---

function contextToDiagnostic(context?: ValidationContext): Partial<ValidationDiagnostic> {
  if (!context) return {}
  const parts: string[] = []
  if (context.topicId) parts.push(context.topicId)
  if (context.sectionName) parts.push(context.sectionName)
  return {
    field: context.file ? `${context.file}${parts.length ? `:${parts.join('/')}` : ''}` : undefined,
  }
}

// --- Main Validation Gateway Entry Point ---

/**
 * Execute the full 3-Tier Validation pipeline on raw YAML content.
 *
 * @param rawYaml - Raw YAML string (with optional frontmatter)
 * @param sectionTypeHint - Optional type hint from meta/frontmatter when data lacks "type" field
 * @param context - File/topic context for diagnostic attribution
 * @returns ValidationResult with status, payload (validated or last-valid data), and diagnostics
 */
export function validateOKFSection(
  rawYaml: string,
  sectionTypeHint?: string,
  context?: ValidationContext
): ValidationResult<Record<string, unknown>> {
  const allDiagnostics: ValidationDiagnostic[] = []
  let lastValidData: Record<string, unknown> | null = null

  // === TIER 1: YAML Syntax & Frontmatter ===
  const tier1Result = tier1Validate(rawYaml, context)
  allDiagnostics.push(...tier1Result.diagnostics)

  if (tier1Result.diagnostics.some((d) => d.tier === 1)) {
    return {
      status: 'error',
      payload: lastValidData ?? {},
      diagnostics: allDiagnostics,
    }
  }

  const parsed = tier1Result.parsed

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    allDiagnostics.push({
      tier: 2,
      field: 'root',
      message: 'Parsed YAML is not a valid section object.',
      fixHint: 'Section data must be a YAML mapping (key-value object), not a scalar or array.',
      ...contextToDiagnostic(context),
    })
    return {
      status: 'error',
      payload: lastValidData ?? {},
      diagnostics: allDiagnostics,
    }
  }

  const dataObj = parsed as Record<string, unknown>
  const sectionType = (dataObj.type as string) || sectionTypeHint

  if (!sectionType) {
    allDiagnostics.push({
      tier: 2,
      field: 'type',
      message: `Missing required "type" field. Section type cannot be determined.`,
      fixHint: `Add a "type" field with one of: [${[...KNOWN_SECTION_TYPES].join(', ')}]`,
      ...contextToDiagnostic(context),
    })
    return {
      status: 'error',
      payload: lastValidData ?? {},
      diagnostics: allDiagnostics,
    }
  }

  // Inject type from hint if absent (frontmatter-sourced type) so Zod schemas validate correctly
  const dataForValidation = sectionTypeHint && !dataObj.type
    ? { ...dataObj, type: sectionTypeHint }
    : dataObj

  // === TIER 2: Structural Schema (Zod) ===
  const tier2Result = tier2Validate(dataForValidation, sectionType, context)
  allDiagnostics.push(...tier2Result.diagnostics)

  if (tier2Result.diagnostics.length === 0) {
    lastValidData = {
      ...(tier2Result.validated as Record<string, unknown>),
      type: sectionType,
    }
  }

  // === TIER 3: Semantic Reference Integrity ===
  const tier3Diagnostics = tier3Validate(dataForValidation, sectionType, context)
  allDiagnostics.push(...tier3Diagnostics)

  // Determine overall status
  const hasTier1Errors = allDiagnostics.some((d) => d.tier === 1)
  const hasTier2Errors = allDiagnostics.some((d) => d.tier === 2)
  const hasTier3Errors = allDiagnostics.some((d) => d.tier === 3)

  let status: ValidationResult['status'] = 'valid'
  if (hasTier1Errors || hasTier2Errors) {
    status = 'error'
  } else if (hasTier3Errors) {
    status = 'warning'
  }

  return {
    status,
    payload: lastValidData ?? dataForValidation,
    diagnostics: allDiagnostics,
  }
}

// --- Convenience: validate raw section with frontmatter meta ---

/**
 * Parse section markdown with frontmatter, extract meta.type hint, and validate.
 */
export function validateOKFSectionFile(
  rawContent: string,
  context?: ValidationContext
): ValidationResult<Record<string, unknown>> {
  const fmResult = extractFrontmatter(rawContent)
  let typeHint = undefined
  let body = rawContent

  if (fmResult) {
    typeHint = (fmResult.frontmatter.type as string) || undefined
    body = fmResult.body
  }

  return validateOKFSection(body, typeHint, context)
}

// --- CLI / Machine-readable output helpers ---

/**
 * Format validation diagnostics as machine-readable JSON for CLI / AI remediation.
 */
export function formatValidationReport(
  result: ValidationResult<Record<string, unknown>>,
  context?: ValidationContext
): string {
  const report: Record<string, unknown> = {
    status: result.status,
    diagnostics: result.diagnostics.map((d) => ({
      tier: d.tier,
      field: d.field,
      line: d.line,
      column: d.column,
      message: d.message,
      fixHint: d.fixHint,
    })),
  }
  if (context) {
    report.file = context.file
    report.topicId = context.topicId
    report.sectionName = context.sectionName
  }
  return JSON.stringify(report, null, 2)
}

/**
 * Format validation diagnostics as human-readable markdown for AI prompt remediation.
 */
export function formatValidationAsPrompt(
  result: ValidationResult<Record<string, unknown>>,
  rawSource?: string,
  context?: ValidationContext
): string {
  if (result.diagnostics.length === 0) return 'No validation errors found.'

  let prompt = `# OKF Section Validation Report\n\n`
  prompt += `**Status**: ${result.status}\n\n`
  prompt += `${result.diagnostics.length} diagnostic(s) found.\n\n`

  result.diagnostics.forEach((diag, idx) => {
    prompt += `### Issue ${idx + 1} [Tier ${diag.tier}] ${diag.field || 'root'}\n`
    if (context?.file) prompt += `- **File**: \`${context.file}\`\n`
    if (context?.sectionName) prompt += `- **Section**: \`${context.sectionName}\`\n`
    if (diag.line) prompt += `- **Location**: Line ${diag.line}${diag.column ? `, Column ${diag.column}` : ''}\n`
    prompt += `- **Message**: ${diag.message}\n`
    if (diag.fixHint) prompt += `- **Suggested Fix**: ${diag.fixHint}\n`
    prompt += '\n'
  })

  if (rawSource) {
    prompt += `## Source\n\`\`\`yaml\n${rawSource}\n\`\`\`\n`
  }

  return prompt
}
