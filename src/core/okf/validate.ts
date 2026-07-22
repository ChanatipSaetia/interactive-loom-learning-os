import * as yaml from 'js-yaml'
import type { OKFSectionData } from './types'

// --- Error types ---

export interface YAMLSyntaxError {
  kind: 'syntax'
  message: string
  line?: number
  snippet?: string
}

export interface SchemaValidationError {
  kind: 'schema'
  field: string
  message: string
}

export type ValidationError = YAMLSyntaxError | SchemaValidationError

// --- Known section types ---

const KNOWN_TYPES = new Set([
  'intro',
  'text',
  'bullets',
  'flowchart',
  'tradeoff-sandbox',
  'taxonomy-browser',
  'flashcards',
  'quiz',
  'concept-map',
  'scenario',
  'decision-tree',
  'image-gallery',
  'formula-sandbox',
  'reflection-sequence',
  'reflection-template',
])

// --- Field requirements per type ---

interface FieldRule {
  field: string
  required: boolean
  expectedType?: 'string' | 'array' | 'object' | 'number' | 'boolean'
  subFields?: FieldRule[]
}

const TYPE_SCHEMA: Record<string, FieldRule[]> = {
  intro: [
    { field: 'type', required: true, expectedType: 'string' },
    { field: 'what', required: true, expectedType: 'object', subFields: [
      { field: 'what.summary', required: true, expectedType: 'string' },
    ]},
    { field: 'why', required: true, expectedType: 'object', subFields: [
      { field: 'why.summary', required: true, expectedType: 'string' },
    ]},
  ],
  text: [
    { field: 'type', required: true, expectedType: 'string' },
    { field: 'paragraphs', required: true, expectedType: 'array' },
  ],
  bullets: [
    { field: 'type', required: true, expectedType: 'string' },
    { field: 'items', required: true, expectedType: 'array' },
  ],
  flowchart: [
    { field: 'type', required: true, expectedType: 'string' },
    { field: 'flow', required: true, expectedType: 'object' },
  ],
  quiz: [
    { field: 'type', required: true, expectedType: 'string' },
    { field: 'questions', required: true, expectedType: 'array' },
  ],
  flashcards: [
    { field: 'type', required: true, expectedType: 'string' },
    { field: 'terms', required: true, expectedType: 'array' },
  ],
  'concept-map': [
    { field: 'type', required: true, expectedType: 'string' },
    { field: 'nodes', required: true, expectedType: 'object' },
    { field: 'edges', required: true, expectedType: 'array' },
  ],
  'tradeoff-sandbox': [
    { field: 'type', required: true, expectedType: 'string' },
    { field: 'scenarios', required: true, expectedType: 'array' },
  ],
  'taxonomy-browser': [
    { field: 'type', required: true, expectedType: 'string' },
    { field: 'categories', required: true, expectedType: 'array' },
  ],
  scenario: [
    { field: 'type', required: true, expectedType: 'string' },
    { field: 'id', required: true, expectedType: 'string' },
    { field: 'title', required: true, expectedType: 'string' },
    { field: 'nodes', required: true, expectedType: 'object' },
    { field: 'startNode', required: true, expectedType: 'string' },
  ],
  'decision-tree': [
    { field: 'type', required: true, expectedType: 'string' },
    { field: 'id', required: true, expectedType: 'string' },
    { field: 'title', required: true, expectedType: 'string' },
    { field: 'root', required: true, expectedType: 'string' },
    { field: 'nodes', required: true, expectedType: 'object' },
  ],
  'image-gallery': [
    { field: 'type', required: true, expectedType: 'string' },
    { field: 'items', required: true, expectedType: 'array' },
  ],
  'formula-sandbox': [
    { field: 'type', required: true, expectedType: 'string' },
    { field: 'variables', required: true, expectedType: 'array' },
    { field: 'metrics', required: true, expectedType: 'array' },
  ],
  'reflection-sequence': [
    { field: 'type', required: true, expectedType: 'string' },
    { field: 'challenges', required: true, expectedType: 'array' },
  ],
  'reflection-template': [
    { field: 'type', required: true, expectedType: 'string' },
    { field: 'challenges', required: true, expectedType: 'array' },
  ],
}

function jsType(val: unknown): string {
  if (val === null || val === undefined) return 'null'
  if (Array.isArray(val)) return 'array'
  return typeof val
}

function validateField(
  data: Record<string, unknown>,
  rule: FieldRule,
  errors: SchemaValidationError[]
): void {
  const parts = rule.field.split('.')
  let current: unknown = data
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      if (rule.required) {
        errors.push({
          kind: 'schema',
          field: rule.field,
          message: `Missing required field: "${rule.field}"`,
        })
      }
      return
    }
    current = (current as Record<string, unknown>)[part]
  }

  if (current === undefined || current === null) {
    if (rule.required) {
      errors.push({
        kind: 'schema',
        field: rule.field,
        message: `Missing required field: "${rule.field}"`,
      })
    }
    return
  }

  if (rule.expectedType && jsType(current) !== rule.expectedType) {
    errors.push({
      kind: 'schema',
      field: rule.field,
      message: `Field "${rule.field}" expected ${rule.expectedType}, got ${jsType(current)}`,
    })
    return
  }
}

// --- Extract line number from js-yaml error ---

function extractYAMLErrorInfo(error: Error): YAMLSyntaxError {
  const message = error.message

  // js-yaml marks includes line info like "in standard input: line X, column Y"
  const lineMatch = message.match(/line\s+(\d+)/i)
  const line = lineMatch ? parseInt(lineMatch[1], 10) : undefined

  // Extract the mark/snippet if present
  const snippetMatch = message.match(/Mark.*?\n(.*?\n?){0,3}/s)
  const snippet = snippetMatch ? snippetMatch[1]?.trim() : undefined

  return {
    kind: 'syntax',
    message,
    line,
    snippet,
  }
}

// --- Main parse + validate function ---

export interface ParseAndValidateResult {
  data: OKFSectionData | null
  errors: ValidationError[]
}

export function parseAndValidateYAML(raw: string, metaType?: string): ParseAndValidateResult {
  const errors: ValidationError[] = []

  // Step 1: YAML syntax parse
  let parsed: unknown
  try {
    parsed = parse(raw)
  } catch (e) {
    const syntaxError = extractYAMLErrorInfo(e instanceof Error ? e : new Error(String(e)))
    return { data: null, errors: [syntaxError] }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    errors.push({
      kind: 'schema',
      field: 'root',
      message: 'Section data must be a YAML object (mapping)',
    })
    return { data: parsed as OKFSectionData, errors }
  }

  const dataObj = parsed as Record<string, unknown>

  // Step 2: Schema validation
  const sectionType = (dataObj.type as string) || metaType
  if (!sectionType) {
    errors.push({
      kind: 'schema',
      field: 'type',
      message: 'Missing required field: "type" — section type is required',
    })
    return { data: parsed as OKFSectionData, errors }
  }

  if (!KNOWN_TYPES.has(sectionType)) {
    errors.push({
      kind: 'schema',
      field: 'type',
      message: `Unknown section type: "${sectionType}". Must be one of: ${[...KNOWN_TYPES].join(', ')}`,
    })
  }

  const rules = TYPE_SCHEMA[sectionType]
  if (rules) {
    const schemaErrors: SchemaValidationError[] = []
    const hasTypeField = dataObj.type !== undefined && dataObj.type !== null
    for (const rule of rules) {
      // Skip 'type' field validation when metaType is provided but data lacks type
      if (rule.field === 'type' && !hasTypeField && metaType) continue
      validateField(dataObj, rule, schemaErrors)
    }
    errors.push(...schemaErrors)
  }

  return { data: parsed as OKFSectionData, errors }
}

function parse(text: string): unknown {
  return yaml.load(text)
}
