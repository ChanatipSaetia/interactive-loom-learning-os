// ============================================================================
// Section Layout Builders
// ============================================================================
// Declarative descriptions of how a section's files map onto its schema input.
// Sub-contexts compose these in their `layout.ts`; the gateway runs them after
// Tier 1 has parsed every file.
// ============================================================================

import type { ParsedSection, SectionLayout, ValidationDiagnostic } from './types'

function missingFile(file: string): ValidationDiagnostic {
  return {
    tier: 1,
    file,
    message: `Missing section file "${file}".`,
    fixHint: `Add ${file} to the section folder, or set "resource" in section.md to the file holding this section's data.`,
  }
}

function notMapping(file: string): ValidationDiagnostic {
  return {
    tier: 2,
    file,
    field: 'root',
    message: `"${file}" must contain a YAML mapping (key-value object).`,
    fixHint: `Rewrite ${file} as key-value pairs at the top level.`,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

/** The file named by `resource` in section.md, or `defaultFile` when resource is ".". */
export function resourceFile(section: ParsedSection, defaultFile: string): string {
  const { resource } = section.meta
  return resource && resource !== '.' ? resource : defaultFile
}

/**
 * One data file. Without `key` the file is a mapping spread into the input;
 * with `key` the file's content (typically an array) is stored under that key.
 */
export function singleFile(defaultFile: string, key?: string): SectionLayout {
  return {
    assemble(section) {
      const file = resourceFile(section, defaultFile)
      if (!(file in section.yaml)) return { input: {}, diagnostics: [missingFile(file)] }
      const content = section.yaml[file]
      if (key) return { input: { [key]: content }, diagnostics: [] }
      if (!isRecord(content)) return { input: {}, diagnostics: [notMapping(file)] }
      return { input: content, diagnostics: [] }
    },
  }
}

/**
 * One item per file, in filename order (numeric prefixes set the order). With a
 * `resource`, a single file holding an array of items is used instead.
 */
export function collection(key: string): SectionLayout {
  const fromResource = singleFile('', key)
  return {
    assemble(section) {
      if (section.meta.resource && section.meta.resource !== '.') return fromResource.assemble(section)
      const files = Object.keys(section.yaml)
        .filter((f) => f !== 'section.yaml' && !f.startsWith('_'))
        .sort()
      return { input: { [key]: files.map((f) => section.yaml[f]) }, diagnostics: [] }
    },
  }
}

/** Several fixed files, each stored under its own key inside `wrapKey`. */
export function fixedFiles(wrapKey: string, files: Record<string, string>): SectionLayout {
  return {
    assemble(section) {
      const diagnostics = Object.values(files)
        .filter((f) => !(f in section.yaml))
        .map(missingFile)
      const wrapped = Object.fromEntries(Object.entries(files).map(([k, f]) => [k, section.yaml[f]]))
      return { input: { [wrapKey]: wrapped }, diagnostics }
    },
  }
}

/** Markdown lines → paragraphs. Headings are skipped; list markers are stripped. */
export function parseParagraphs(markdown: string): string[] {
  return markdown
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.replace(/^\d+\.\s+/, '').replace(/^-+\s+/, ''))
}

/** A markdown file split into paragraphs, falling back to the section.md body. */
export function markdownParagraphs(defaultFile: string, key: string): SectionLayout {
  return {
    assemble(section) {
      const file = resourceFile(section, defaultFile)
      const text = section.markdown[file] ?? section.body
      return { input: { [key]: parseParagraphs(text) }, diagnostics: [] }
    },
  }
}
