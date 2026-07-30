import * as yaml from 'js-yaml'
import type { OKFSectionData } from './types'

// --- Structured Error Payload for AI / CLI / UI ---

export interface OKFValidationErrorPayload {
  file?: string
  topicId?: string
  sectionName?: string
  tier: 'syntax' | 'schema' | 'semantic' | 'render'
  field?: string
  line?: number
  column?: number
  message: string
  fixHint?: string
  snippet?: string
}

// --- Legacy / UI Error Types ---

export interface YAMLSyntaxError {
  kind: 'syntax'
  message: string
  line?: number
  snippet?: string
  fixHint?: string
}

export interface SchemaValidationError {
  kind: 'schema'
  field: string
  message: string
  fixHint?: string
}

export interface SemanticValidationError {
  kind: 'semantic'
  field: string
  message: string
  fixHint?: string
}

export type ValidationError = YAMLSyntaxError | SchemaValidationError | SemanticValidationError

// --- Known section types ---

export const KNOWN_SECTION_TYPES = new Set([
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

// --- Field requirements per type (Tier 2 Schema) ---

interface FieldRule {
  field: string
  required: boolean
  expectedType?: 'string' | 'array' | 'object' | 'number' | 'boolean'
  subFields?: FieldRule[]
}

const TYPE_SCHEMA: Record<string, FieldRule[]> = {
  intro: [
    { field: 'type', required: true, expectedType: 'string' },
    { field: 'what', required: true, expectedType: 'object' },
    { field: 'why', required: true, expectedType: 'object' },
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
    { field: 'nodes', required: true },
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
  errors: OKFValidationErrorPayload[],
  context?: { file?: string; topicId?: string; sectionName?: string }
): void {
  const parts = rule.field.split('.')
  let current: unknown = data
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      if (rule.required) {
        errors.push({
          ...context,
          tier: 'schema',
          field: rule.field,
          message: `Missing required field: "${rule.field}"`,
          fixHint: `Add the missing property "${rule.field}" to the section data.`,
        })
      }
      return
    }
    current = (current as Record<string, unknown>)[part]
  }

  if (current === undefined || current === null) {
    if (rule.required) {
      errors.push({
        ...context,
        tier: 'schema',
        field: rule.field,
        message: `Missing required field: "${rule.field}"`,
        fixHint: `Add property "${rule.field}" with a non-null ${rule.expectedType || 'value'}.`,
      })
    }
    return
  }

  if (rule.expectedType && jsType(current) !== rule.expectedType) {
    errors.push({
      ...context,
      tier: 'schema',
      field: rule.field,
      message: `Field "${rule.field}" expected type "${rule.expectedType}", but got "${jsType(current)}".`,
      fixHint: `Change "${rule.field}" to be of type ${rule.expectedType}.`,
    })
  }
}

// --- Tier 3: Semantic Integrity Checks ---

export function validateSemanticIntegrity(
  dataObj: Record<string, unknown>,
  sectionType: string,
  context?: { file?: string; topicId?: string; sectionName?: string }
): OKFValidationErrorPayload[] {
  const errors: OKFValidationErrorPayload[] = []

  switch (sectionType) {
    case 'scenario': {
      const nodes = (dataObj.nodes || {}) as Record<string, any>
      const startNode = dataObj.startNode as string | undefined
      const validNodeKeys = Object.keys(nodes)

      if (startNode && !nodes[startNode]) {
        errors.push({
          ...context,
          tier: 'semantic',
          field: 'startNode',
          message: `startNode "${startNode}" does not exist in scenario nodes dictionary.`,
          fixHint: `Change startNode to one of the declared node keys: [${validNodeKeys.map((k) => `"${k}"`).join(', ')}]`,
        })
      }

      for (const [nodeId, node] of Object.entries(nodes)) {
        if (!node || typeof node !== 'object') continue
        const choices = Array.isArray(node.choices) ? node.choices : []
        choices.forEach((choice: any, idx: number) => {
          if (choice && choice.nextNode && typeof choice.nextNode === 'string') {
            if (!nodes[choice.nextNode]) {
              errors.push({
                ...context,
                tier: 'semantic',
                field: `nodes.${nodeId}.choices[${idx}].nextNode`,
                message: `Choice "${choice.label || idx}" in node "${nodeId}" targets non-existent nextNode "${choice.nextNode}".`,
                fixHint: `Update nextNode to point to one of valid nodes: [${validNodeKeys.map((k) => `"${k}"`).join(', ')}]`,
              })
            }
          }
        })
      }
      break
    }

    case 'decision-tree': {
      const nodes = (dataObj.nodes || {}) as Record<string, any>
      const root = dataObj.root as string | undefined
      const validNodeKeys = Object.keys(nodes)

      if (root && !nodes[root]) {
        errors.push({
          ...context,
          tier: 'semantic',
          field: 'root',
          message: `Decision tree root node "${root}" is not defined in nodes dictionary.`,
          fixHint: `Set root to one of existing node keys: [${validNodeKeys.map((k) => `"${k}"`).join(', ')}]`,
        })
      }

      for (const [nodeId, node] of Object.entries(nodes)) {
        if (!node || typeof node !== 'object') continue
        const options = Array.isArray(node.options) ? node.options : []
        options.forEach((opt: any, idx: number) => {
          const target = opt?.target || opt?.nextNode
          if (target && typeof target === 'string' && !nodes[target]) {
            errors.push({
              ...context,
              tier: 'semantic',
              field: `nodes.${nodeId}.options[${idx}].target`,
              message: `Option "${opt.label || idx}" in node "${nodeId}" targets unknown node "${target}".`,
              fixHint: `Set target to one of valid decision-tree nodes: [${validNodeKeys.map((k) => `"${k}"`).join(', ')}]`,
            })
          }
        })
      }
      break
    }

    case 'concept-map': {
      const rawNodes = dataObj.nodes
      let nodeIds: string[] = []
      if (Array.isArray(rawNodes)) {
        nodeIds = rawNodes.map((n: any) => n?.id).filter(Boolean)
      } else if (rawNodes && typeof rawNodes === 'object') {
        nodeIds = Object.keys(rawNodes)
      }

      const edges = Array.isArray(dataObj.edges) ? dataObj.edges : []
      edges.forEach((edge: any, idx: number) => {
        if (!edge || typeof edge !== 'object') return
        if (edge.source && !nodeIds.includes(String(edge.source))) {
          errors.push({
            ...context,
            tier: 'semantic',
            field: `edges[${idx}].source`,
            message: `Concept map edge #${idx} references unknown source node "${edge.source}".`,
            fixHint: `Valid node IDs are: [${nodeIds.map((n) => `"${n}"`).join(', ')}]`,
          })
        }
        if (edge.target && !nodeIds.includes(String(edge.target))) {
          errors.push({
            ...context,
            tier: 'semantic',
            field: `edges[${idx}].target`,
            message: `Concept map edge #${idx} references unknown target node "${edge.target}".`,
            fixHint: `Valid node IDs are: [${nodeIds.map((n) => `"${n}"`).join(', ')}]`,
          })
        }
      })
      break
    }

    case 'quiz': {
      const questions = Array.isArray(dataObj.questions) ? dataObj.questions : []
      questions.forEach((q: any, idx: number) => {
        if (!q || typeof q !== 'object') return
        const opts = Array.isArray(q.options) ? q.options : []
        const correct = q.correctAnswer ?? q.correctIndex ?? q.answer
        if (typeof correct === 'number') {
          if (correct < 0 || correct >= opts.length) {
            errors.push({
              ...context,
              tier: 'semantic',
              field: `questions[${idx}].correctAnswer`,
              message: `Quiz question #${idx + 1} correctAnswer index (${correct}) is out of bounds for ${opts.length} options.`,
              fixHint: `Provide an index between 0 and ${Math.max(0, opts.length - 1)}.`,
            })
          }
        }
      })
      break
    }

    case 'formula-sandbox': {
      const vars = Array.isArray(dataObj.variables) ? dataObj.variables : []
      vars.forEach((v: any, idx: number) => {
        if (typeof v.min === 'number' && typeof v.max === 'number' && v.min > v.max) {
          errors.push({
            ...context,
            tier: 'semantic',
            field: `variables[${idx}]`,
            message: `Variable "${v.id || idx}" has min (${v.min}) greater than max (${v.max}).`,
            fixHint: `Ensure min <= max for variable "${v.id || idx}".`,
          })
        }
        if (typeof v.defaultValue === 'number' && typeof v.min === 'number' && typeof v.max === 'number') {
          if (v.defaultValue < v.min || v.defaultValue > v.max) {
            errors.push({
              ...context,
              tier: 'semantic',
              field: `variables[${idx}].defaultValue`,
              message: `Variable "${v.id || idx}" defaultValue (${v.defaultValue}) is outside min-max bounds [${v.min}, ${v.max}].`,
              fixHint: `Set defaultValue to a number between ${v.min} and ${v.max}.`,
            })
          }
        }
      })
      break
    }
  }

  return errors
}

// --- Main Validation Entry Points ---

export function validateSectionData(
  data: unknown,
  metaType?: string,
  context?: { file?: string; topicId?: string; sectionName?: string }
): OKFValidationErrorPayload[] {
  const errors: OKFValidationErrorPayload[] = []

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    errors.push({
      ...context,
      tier: 'schema',
      field: 'root',
      message: 'Section data must be an object (mapping).',
      fixHint: 'Ensure section data is a key-value YAML mapping object.',
    })
    return errors
  }

  const dataObj = data as Record<string, unknown>
  const sectionType = (dataObj.type as string) || metaType

  if (!sectionType) {
    errors.push({
      ...context,
      tier: 'schema',
      field: 'type',
      message: 'Missing required field: "type" — section type is required.',
      fixHint: `Provide a valid "type" field matching one of: [${[...KNOWN_SECTION_TYPES].join(', ')}]`,
    })
    return errors
  }

  if (!KNOWN_SECTION_TYPES.has(sectionType)) {
    errors.push({
      ...context,
      tier: 'schema',
      field: 'type',
      message: `Unknown section type "${sectionType}".`,
      fixHint: `Change type to one of: [${[...KNOWN_SECTION_TYPES].join(', ')}]`,
    })
  }

  // Tier 2: Schema Field checks
  const rules = TYPE_SCHEMA[sectionType]
  if (rules) {
    const hasTypeField = dataObj.type !== undefined && dataObj.type !== null
    for (const rule of rules) {
      if (rule.field === 'type' && !hasTypeField && metaType) continue
      validateField(dataObj, rule, errors, context)
    }
  }

  // Tier 3: Semantic Integrity checks
  const semanticErrors = validateSemanticIntegrity(dataObj, sectionType, context)
  errors.push(...semanticErrors)

  return errors
}

export function validateYAMLContent(
  rawYaml: string,
  metaType?: string,
  context?: { file?: string; topicId?: string; sectionName?: string }
): { data: OKFSectionData | null; errors: OKFValidationErrorPayload[] } {
  let parsed: unknown
  try {
    parsed = yaml.load(rawYaml)
  } catch (e: any) {
    const message = e.message || String(e)
    const lineMatch = message.match(/line\s+(\d+)/i)
    const colMatch = message.match(/column\s+(\d+)/i)
    const line = lineMatch ? parseInt(lineMatch[1], 10) : undefined
    const column = colMatch ? parseInt(colMatch[1], 10) : undefined

    return {
      data: null,
      errors: [
        {
          ...context,
          tier: 'syntax',
          line,
          column,
          message: `YAML Syntax Error: ${message}`,
          snippet: rawYaml.split('\n').slice(Math.max(0, (line || 1) - 2), (line || 1) + 2).join('\n'),
          fixHint: 'Fix YAML syntax indentation and formatting around the specified line.',
        },
      ],
    }
  }

  const errors = validateSectionData(parsed, metaType, context)
  return { data: parsed as OKFSectionData, errors }
}

// --- Legacy Compatible Wrapper ---

export interface ParseAndValidateResult {
  data: OKFSectionData | null
  errors: ValidationError[]
}

export function parseAndValidateYAML(raw: string, metaType?: string): ParseAndValidateResult {
  const res = validateYAMLContent(raw, metaType)
  const legacyErrors: ValidationError[] = res.errors.map((e) => {
    if (e.tier === 'syntax') {
      return {
        kind: 'syntax',
        message: e.message,
        line: e.line,
        snippet: e.snippet,
      } as YAMLSyntaxError
    } else if (e.tier === 'semantic') {
      return {
        kind: 'semantic',
        field: e.field || 'root',
        message: e.message,
        fixHint: e.fixHint,
      } as SemanticValidationError
    } else {
      return {
        kind: 'schema',
        field: e.field || 'root',
        message: e.message,
      } as SchemaValidationError
    }
  })

  return { data: res.data, errors: legacyErrors }
}

// --- Prompt Formatting Helper for AI Remediation ---

export function formatPayloadAsPrompt(
  errors: OKFValidationErrorPayload[],
  rawSource?: string
): string {
  if (errors.length === 0) return 'No validation errors found.'

  let prompt = `# OKF Section Validation Error Report\n\n`
  prompt += `The following ${errors.length} error(s) were found during OKF section validation. Please fix the files accordingly.\n\n`

  errors.forEach((err, idx) => {
    prompt += `### Error ${idx + 1}: [Tier: ${err.tier.toUpperCase()}] ${err.file || err.sectionName || 'Section'}\n`
    if (err.file) prompt += `- **File**: \`${err.file}\`\n`
    if (err.sectionName) prompt += `- **Section**: \`${err.sectionName}\`\n`
    if (err.field) prompt += `- **Field Path**: \`${err.field}\`\n`
    if (err.line) prompt += `- **Location**: Line ${err.line}${err.column ? `, Column ${err.column}` : ''}\n`
    prompt += `- **Message**: ${err.message}\n`
    if (err.fixHint) prompt += `- **Suggested Fix**: ${err.fixHint}\n`
    if (err.snippet) {
      prompt += `- **Snippet**:\n\`\`\`yaml\n${err.snippet}\n\`\`\`\n`
    }
    prompt += `\n`
  })

  if (rawSource) {
    prompt += `## Source Snippet\n\`\`\`yaml\n${rawSource}\n\`\`\`\n`
  }

  prompt += `\n**Instructions for AI**: Update the specified file(s) to resolve the schema/syntax/semantic validation errors listed above while preserving valid section content.`

  return prompt
}
