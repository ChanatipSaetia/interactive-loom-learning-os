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
export type { ValidationContext, ValidationDiagnostic, ValidationResult } from './types'
export { contextToDiagnostic } from './types'
import { contextToDiagnostic } from './types'
import type { ValidationContext, ValidationDiagnostic, ValidationResult } from './types'

// --- Schema Registry — Dynamically resolved from Bounded Contexts ---

import {
  IntroSectionSchema,
  TextSectionSchema,
  BulletsSectionSchema,
  TaxonomyBrowserSectionSchema,
  ImageGallerySectionSchema,
  PillarLayerSectionSchema,
} from '../sub-contexts/progressive-content/schema'
import { validateProgressiveContentTier3 } from '../sub-contexts/progressive-content/validation'

import {
  FlowchartSectionSchema,
  ScenarioSectionSchema,
} from '../sub-contexts/process-simulation/schema'
import { validateProcessSimulationTier3 } from '../sub-contexts/process-simulation/validation'

import {
  TradeoffSandboxSectionSchema,
  FormulaSandboxSectionSchema,
  DecisionTreeSectionSchema,
} from '../sub-contexts/tradeoff-sandbox/schema'
import { validateTradeoffSandboxTier3 } from '../sub-contexts/tradeoff-sandbox/validation'

import {
  ReflectionSequenceSectionSchema,
  ReflectionTemplateSectionSchema,
} from '../sub-contexts/reflection-synthesis/schema'
import { validateReflectionSynthesisTier3 } from '../sub-contexts/reflection-synthesis/validation'

import {
  QuizSectionSchema,
  FlashcardsSectionSchema,
  ConceptMapSectionSchema,
} from '../sub-contexts/practice-assessment/schema'
import { validatePracticeAssessmentTier3 } from '../sub-contexts/practice-assessment/validation'

interface SchemaEntry {
  schema: z.ZodTypeAny
  subdomain: string
  validateTier3: (data: Record<string, unknown>, sectionType: string, context?: ValidationContext) => ValidationDiagnostic[]
}

const SCHEMA_REGISTRY: Record<string, SchemaEntry> = {
  'intro': { schema: IntroSectionSchema, subdomain: 'progressive-content', validateTier3: validateProgressiveContentTier3 },
  'text': { schema: TextSectionSchema, subdomain: 'progressive-content', validateTier3: validateProgressiveContentTier3 },
  'bullets': { schema: BulletsSectionSchema, subdomain: 'progressive-content', validateTier3: validateProgressiveContentTier3 },
  'taxonomy-browser': { schema: TaxonomyBrowserSectionSchema, subdomain: 'progressive-content', validateTier3: validateProgressiveContentTier3 },
  'image-gallery': { schema: ImageGallerySectionSchema, subdomain: 'progressive-content', validateTier3: validateProgressiveContentTier3 },
  'pillar-layer': { schema: PillarLayerSectionSchema, subdomain: 'progressive-content', validateTier3: validateProgressiveContentTier3 },
  'flowchart': { schema: FlowchartSectionSchema, subdomain: 'process-simulation', validateTier3: validateProcessSimulationTier3 },

  'scenario': { schema: ScenarioSectionSchema, subdomain: 'process-simulation', validateTier3: validateProcessSimulationTier3 },
  'tradeoff-sandbox': { schema: TradeoffSandboxSectionSchema, subdomain: 'tradeoff-sandbox', validateTier3: validateTradeoffSandboxTier3 },
  'formula-sandbox': { schema: FormulaSandboxSectionSchema, subdomain: 'tradeoff-sandbox', validateTier3: validateTradeoffSandboxTier3 },
  'decision-tree': { schema: DecisionTreeSectionSchema, subdomain: 'tradeoff-sandbox', validateTier3: validateTradeoffSandboxTier3 },
  'reflection-sequence': { schema: ReflectionSequenceSectionSchema, subdomain: 'reflection-synthesis', validateTier3: validateReflectionSynthesisTier3 },
  'reflection-template': { schema: ReflectionTemplateSectionSchema, subdomain: 'reflection-synthesis', validateTier3: validateReflectionSynthesisTier3 },
  'quiz': { schema: QuizSectionSchema, subdomain: 'practice-assessment', validateTier3: validatePracticeAssessmentTier3 },
  'flashcards': { schema: FlashcardsSectionSchema, subdomain: 'practice-assessment', validateTier3: validatePracticeAssessmentTier3 },
  'concept-map': { schema: ConceptMapSectionSchema, subdomain: 'practice-assessment', validateTier3: validatePracticeAssessmentTier3 },
}



export const KNOWN_SECTION_TYPES = new Set(Object.keys(SCHEMA_REGISTRY))

// --- Tier 1: YAML Syntax & Frontmatter ---

interface FrontmatterResult {
  frontmatter: Record<string, unknown>
  body: string
}

function extractFrontmatter(raw: unknown): FrontmatterResult | null {
  if (typeof raw !== 'string') {
    return { frontmatter: typeof raw === 'object' && raw ? (raw as Record<string, unknown>) : {}, body: '' }
  }
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

  const { frontmatter, body } = fmResult

  let parsed: unknown
  if (frontmatter && Object.keys(frontmatter).length > 0) {
    parsed = frontmatter
  } else {
    try {
      parsed = yaml.load(body || raw)
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
  const entry = SCHEMA_REGISTRY[sectionType]
  if (entry?.validateTier3) {
    return entry.validateTier3(data, sectionType, context)
  }
  return []
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
  let typeHint: string | undefined = undefined
  let payload: unknown = rawContent

  if (fmResult && Object.keys(fmResult.frontmatter).length > 0) {
    typeHint = (fmResult.frontmatter.type as string) || undefined
    let parsedBody: unknown = null
    if (fmResult.body.trim()) {
      try {
        parsedBody = yaml.load(fmResult.body)
      } catch {
        // Fallback when body is raw markdown text
      }
    }
    if (parsedBody && typeof parsedBody === 'object' && !Array.isArray(parsedBody)) {
      payload = { ...fmResult.frontmatter, ...parsedBody }
    } else {
      payload = fmResult.frontmatter
    }
  }

  return validateOKFSection(payload as any, typeHint, context)
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


