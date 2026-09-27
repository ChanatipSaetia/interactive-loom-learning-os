// Validation Types & Diagnostics Helper

export interface ValidationContext {
  file?: string
  topicId?: string
  sectionName?: string
}

export interface ValidationDiagnostic {
  tier: 1 | 2 | 3
  file?: string
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

export function contextToDiagnostic(context?: ValidationContext): Partial<ValidationDiagnostic> {
  if (!context) return {}
  return {
    file: context.file,
  }
}

// Section File Ingestion — raw files in, assembled schema input out

/** Raw section files keyed by filename relative to the section folder (e.g. `section.md`, `01-egypt.yaml`). */
export type SectionFiles = Record<string, string>

export interface SectionIntro {
  what?: string
  why?: string
  next?: string
}

/** `section.md` frontmatter. */
export interface SectionMeta {
  type: string
  title?: string
  heading?: string
  ordered?: boolean
  resource: string
  intro?: SectionIntro
}

/** Section files after Tier 1 parsing. */
export interface ParsedSection {
  meta: SectionMeta
  /** `section.md` body below the frontmatter. */
  body: string
  /** Successfully parsed `.yaml` / `.yml` files by filename. */
  yaml: Record<string, unknown>
  /** Markdown files other than `section.md`, by filename, with frontmatter stripped. */
  markdown: Record<string, string>
}

/**
 * How a section type's files map onto its schema input. Declared by each
 * sub-context next to its schema; the gateway runs it between Tier 1 and Tier 2.
 */
export interface SectionLayout {
  assemble(section: ParsedSection): { input: Record<string, unknown>; diagnostics: ValidationDiagnostic[] }
}

/** A section as loaded through the gateway. */
export interface LoadedSection {
  meta: SectionMeta
  data: Record<string, unknown>
  body: string
}
