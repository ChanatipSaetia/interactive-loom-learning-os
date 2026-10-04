import { describe, it, expect } from 'vitest'
import { LOOM_OUI_COMPONENTS, getLoomOUIComponent, getLoomOUIJSONSchema, getLoomOUIPrompt } from '../../../../../../src/core/learning-engine/composition/oui/library'
import { ouiSchemaFiles } from '../../../../../../src/core/learning-engine/composition/oui/schema-files'

declare global {
  interface ImportMeta {
    glob<T>(pattern: string | string[], options: { query: string; import: string; eager: true }): Record<string, T>
  }
}

const SCHEMA_FILES = import.meta.glob<string>('/schemas/oui/*', { query: '?raw', import: 'default', eager: true })
const SOURCES = import.meta.glob<string>('/src/**/*.tsx', { query: '?raw', import: 'default', eager: true })

type Def = { properties?: Record<string, { description?: string }> }
const defs = (getLoomOUIJSONSchema() as unknown as { $defs: Record<string, Def> }).$defs

function propsOf(name: string): string[] {
  return Object.keys(defs[name]?.properties ?? {})
}

describe('OUI field descriptions', () => {
  it('describes every component and exactly its props', () => {
    for (const component of LOOM_OUI_COMPONENTS) {
      expect(component.description, component.name).not.toBe('')
      expect(Object.keys(component.fields).sort(), component.name).toEqual(propsOf(component.name).sort())
      for (const [field, text] of Object.entries(component.fields)) {
        expect(text.trim(), `${component.name}.${field}`).not.toBe('')
      }
    }
  })

  it('puts field descriptions in the JSON Schema (VS Code and editor hovers)', () => {
    expect(defs.QuizChoice.properties?.correct.description).toBe(getLoomOUIComponent('QuizChoice')!.fields.correct)
    expect(defs.Flowchart.properties?.lead.description).toMatch(/Lead\(/)
  })

  it('lists every prop under its signature in the LLM prompt', () => {
    const prompt = getLoomOUIPrompt()
    expect(prompt).toContain('## Syntax Rules')
    const quizChoice = prompt.slice(prompt.indexOf('\nQuizChoice('))
    const block = quizChoice.slice(1, quizChoice.indexOf('\n', quizChoice.indexOf('  - explanation:')))
    expect(block).toBe([
      'QuizChoice(id: string, text: string, correct: boolean, explanation: string) — One answer option of a quiz question, with the explanation shown after answering.',
      ...['id', 'text', 'correct', 'explanation'].map((f) => `  - ${f}: ${getLoomOUIComponent('QuizChoice')!.fields[f]}`),
    ].join('\n'))
  })

  it('keeps the committed schema files fresh (npm run oui:schema)', () => {
    for (const [relative, text] of Object.entries(ouiSchemaFiles())) {
      expect(SCHEMA_FILES[`/${relative}`], relative).toBe(text)
    }
  })

  it('points every form tooltip at a described field', () => {
    let count = 0
    for (const [file, source] of Object.entries(SOURCES)) {
      for (const m of source.matchAll(/<OUIField(?:Key|Help) of=\{(?:OUI\.)?([A-Z]\w*)\} field="(\w+)"/g)) {
        count++
        expect(getLoomOUIComponent(m[1])?.fields[m[2]], `${file}: ${m[1]}.${m[2]}`).toBeTruthy()
      }
    }
    expect(count).toBeGreaterThan(150)
  })
})
