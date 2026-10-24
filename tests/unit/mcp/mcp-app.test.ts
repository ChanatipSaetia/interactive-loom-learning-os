// @ts-expect-error Node's fs has no types in this project (see tests/unit/sections/present/helpers.ts)
import { readFileSync, readdirSync } from 'fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadTopic, themeForHost } from '../../../src/mcp-app/McpApp'

function topicSource(id: string): string {
  const dir = `public/content/${id}`
  let text = `// @loom-topic ${id}\n// === topic.oui ===\n${readFileSync(`${dir}/topic.oui`, 'utf8')}`
  for (const f of (readdirSync(`${dir}/sections`) as string[]).sort()) text += `// === sections/${f} ===\n${readFileSync(`${dir}/sections/${f}`, 'utf8')}`
  return text
}

describe('themeForHost (decision 196)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it("follows the chat's light or dark mode", () => {
    expect(themeForHost('dark')).toBe('liquid-glass')
    expect(themeForHost('light')).toBe('liquid-glass-light')
  })

  it('falls back to the system scheme when the chat does not say', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    expect(themeForHost(undefined)).toBe('liquid-glass-light')
  })
})

describe('loadTopic', () => {
  it('compiles a topic the way Viewer does', () => {
    const loaded = loadTopic(topicSource('chinese101-day1'))
    expect(loaded.report).toBeNull()
    expect(loaded.topic?.sections.every((s) => s.config)).toBe(true)
  })

  it('keeps the good sections and reports the broken one', () => {
    const loaded = loadTopic(topicSource('chinese101-day1').replace('root = Quiz(', 'root = Quizz('))
    expect(loaded.topic?.sections.find((s) => s.name === 'quiz')?.config).toBeNull()
    expect(loaded.report).toContain('sections/quiz.oui')
  })

  it('reports text it cannot open', () => {
    const loaded = loadTopic('not a topic')
    expect(loaded.topic === null || loaded.report !== null).toBe(true)
  })
})
